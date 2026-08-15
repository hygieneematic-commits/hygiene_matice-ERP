import { useState, useMemo } from "react";
import { History, Search, Trash2, XCircle } from "lucide-react";
import PageHeader from "../../components/ui/PageHeader";
import Card from "../../components/ui/Card";
import Badge from "../../components/ui/Badge";
import { Input, Select } from "../../components/ui/Field";
import DataTable from "../../components/ui/DataTable";
import EmptyState from "../../components/ui/EmptyState";
import ConfirmDialog from "../../components/ui/ConfirmDialog";
import { useProductionStore } from "../../store/useProductionStore";
import { useProductStore } from "../../store/useProductStore";
import { useToastStore } from "../../store/useToastStore";
import { formatDateTime } from "../../utils/formatters";
import ProductionDetailModal from "../Production/ProductionDetailModal";
import { usePermissions } from "../../utils/permissions";

export default function BatchHistory() {
  const { batches, deleteBatch, cancelBatch } = useProductionStore();
  const products = useProductStore((s) => s.products);
  const push = useToastStore((s) => s.push);
  const { role, canEdit } = usePermissions();

  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [cancelTarget, setCancelTarget] = useState(null);
  const [viewBatch, setViewBatch] = useState(null);

  function productName(id) {
    return products.find((p) => p.id === id)?.name || "Unknown product";
  }

  const filtered = useMemo(() => {
    return batches
      .filter((b) => statusFilter === "all" || b.status === statusFilter)
      .filter((b) => {
        const q = query.toLowerCase().trim();
        if (!q) return true;
        return b.batchNumber.toLowerCase().includes(q) || productName(b.productId).toLowerCase().includes(q) || b.operator.toLowerCase().includes(q);
      })
      .sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [batches, query, statusFilter]);

  const columns = [
    { key: "batchNumber", header: "Batch #", render: (row) => (
      <span className="font-mono text-sm text-ink-900 inline-flex items-center gap-1.5">
        {row.batchNumber}
        {row.formulaEdited && <span title="Formula was edited for this batch" className="w-1.5 h-1.5 rounded-full bg-warning-500 shrink-0" />}
      </span>
    ) },
    { key: "product", header: "Product", render: (row) => <span className="font-medium text-ink-900">{productName(row.productId)}</span> },
    { key: "quantityL", header: "Qty", align: "right", render: (row) => `${row.quantityL} L` },
    { key: "operator", header: "Operator" },
    { key: "shift", header: "Shift", render: (row) => <span className="text-ink-500 text-sm">{row.shift || "—"}</span> },
    { key: "yieldPercent", header: "Yield", align: "right", render: (row) => `${row.yieldPercent}%` },
    {
      key: "status",
      header: "Status",
      render: (row) => (
        <Badge
          tone={row.status === "completed" ? "success" : row.status === "rejected" ? "danger" : row.status === "cancelled" ? "neutral" : "warning"}
          dot
        >
          {row.status === "completed" ? "Completed" : row.status === "rejected" ? "Rejected" : row.status === "cancelled" ? "Cancelled" : "Planned"}
        </Badge>
      ),
    },
    {
      key: "qc",
      header: "QC Result",
      render: (row) =>
        row.qc ? (
          <Badge tone={row.qc.decision === "rejected" ? "danger" : "success"} dot>{row.qc.decision === "rejected" ? "Rejected" : "Approved"}</Badge>
        ) : (
          <span className="text-ink-400 text-sm">—</span>
        ),
    },
    { key: "date", header: "Date", render: (row) => <span className="text-ink-500 text-sm">{formatDateTime(row.date)}</span> },
    {
      key: "actions",
      header: "",
      align: "right",
      render: (row) => (
        <div className="flex items-center justify-end gap-1">
          {/* Still "planned" (not yet confirmed) — any authorized user can
              cancel a mistaken/accidental batch. No inventory was ever
              touched for a planned batch, so this is safe. */}
          {row.status === "planned" && canEdit && (
            <button
              onClick={(e) => { e.stopPropagation(); setCancelTarget(row); }}
              className="p-2 text-ink-400 hover:text-warning-600 hover:bg-warning-50 rounded-lg transition-colors"
              title="Cancel this production"
            >
              <XCircle size={15} />
            </button>
          )}
          {/* Permanently deleting any batch record (planned, cancelled,
              rejected, or a finalized "completed" one) stays Super Admin
              only — completed batches already affected real inventory, so
              this is a genuine historical-record deletion, not a quick undo. */}
          {role === "Super Admin" && (
            <button onClick={(e) => { e.stopPropagation(); setDeleteTarget(row); }} className="p-2 text-ink-400 hover:text-danger-500 hover:bg-danger-50 rounded-lg transition-colors" title="Permanently delete">
              <Trash2 size={15} />
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader title="Batch History" subtitle={`${batches.length} total batches recorded`} />

      <Card padding="p-5">
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="relative flex-1 max-w-sm">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400" />
            <Input placeholder="Search batch #, product, operator…" value={query} onChange={(e) => setQuery(e.target.value)} className="pl-10" />
          </div>
          <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="sm:w-48">
            <option value="all">All statuses</option>
            <option value="completed">Completed</option>
            <option value="planned">Planned</option>
          </Select>
        </div>
        <DataTable columns={columns} data={filtered} onRowClick={(row) => setViewBatch(row)} emptyState={<EmptyState icon={History} title="No batches found" />} />
      </Card>

      <ProductionDetailModal open={!!viewBatch} onClose={() => setViewBatch(null)} batch={viewBatch} />

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => { deleteBatch(deleteTarget.id); push("Batch deleted", "info"); setDeleteTarget(null); }}
        title={`Delete batch ${deleteTarget?.batchNumber || ""}?`}
        description={
          deleteTarget?.status === "completed"
            ? "This batch already deducted raw material/packaging stock when it was confirmed — deleting the record here does NOT restore that stock. Only delete this if you're cleaning up a genuine mistake/test entry."
            : "This removes the batch record permanently. This cannot be undone."
        }
      />

      <ConfirmDialog
        open={!!cancelTarget}
        onClose={() => setCancelTarget(null)}
        onConfirm={() => { cancelBatch(cancelTarget.id); push(`Batch ${cancelTarget.batchNumber} cancelled`, "info"); setCancelTarget(null); }}
        title="Cancel this production?"
        description="This production has not been finalized yet — no inventory has been deducted. It will be kept in Batch History marked as Cancelled for the record, but won't count as a completed batch."
      />
    </div>
  );
}
