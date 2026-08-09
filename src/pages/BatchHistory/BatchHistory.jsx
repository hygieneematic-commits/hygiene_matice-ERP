import { useState, useMemo } from "react";
import { History, Search, Trash2 } from "lucide-react";
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
  const { batches, deleteBatch } = useProductionStore();
  const products = useProductStore((s) => s.products);
  const push = useToastStore((s) => s.push);
  const { role } = usePermissions();

  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [deleteTarget, setDeleteTarget] = useState(null);
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
        <Badge tone={row.status === "completed" ? "success" : row.status === "rejected" ? "danger" : "warning"} dot>
          {row.status === "completed" ? "Completed" : row.status === "rejected" ? "Rejected" : "Planned"}
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
      render: (row) =>
        // Only Super Admin can delete a batch record, regardless of its
        // status — needed so Super Admin can actually clean up test/mistake
        // entries from history, not just batches still in "planned" state.
        role === "Super Admin" && (
          <button onClick={(e) => { e.stopPropagation(); setDeleteTarget(row); }} className="p-2 text-ink-400 hover:text-danger-500 hover:bg-danger-50 rounded-lg transition-colors">
            <Trash2 size={15} />
          </button>
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
    </div>
  );
}
