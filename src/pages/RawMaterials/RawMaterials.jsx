import { useState, useMemo } from "react";
import { Plus, Search, Pencil, Trash2, Boxes, AlertTriangle } from "lucide-react";
import PageHeader from "../../components/ui/PageHeader";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import Badge from "../../components/ui/Badge";
import { Input } from "../../components/ui/Field";
import DataTable from "../../components/ui/DataTable";
import EmptyState from "../../components/ui/EmptyState";
import ConfirmDialog from "../../components/ui/ConfirmDialog";
import RawMaterialFormModal from "./RawMaterialFormModal";
import { useRawMaterialStore } from "../../store/useRawMaterialStore";
import { useProductStore } from "../../store/useProductStore";
import { useFormulaStore } from "../../store/useFormulaStore";
import { useToastStore } from "../../store/useToastStore";
import { findAffectedProducts } from "../../utils/costEngine";
import { formatCurrency } from "../../utils/formatters";
import { usePermissions } from "../../utils/permissions";

export default function RawMaterials() {
  const { rawMaterials, deleteRawMaterial } = useRawMaterialStore();
  const products = useProductStore((s) => s.products);
  const formulasByProductId = useFormulaStore((s) => s.formulasByProductId);
  const push = useToastStore((s) => s.push);
  const { canEdit } = usePermissions();

  const [query, setQuery] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return rawMaterials;
    return rawMaterials.filter((r) => r.name.toLowerCase().includes(q) || r.supplier.toLowerCase().includes(q));
  }, [rawMaterials, query]);

  function handleSaved(isNew) {
    push(isNew ? "Raw material added" : "Price updated — costing refreshed everywhere");
    setModalOpen(false);
    setEditing(null);
  }

  function handleDelete() {
    deleteRawMaterial(deleteTarget.id);
    push("Raw material deleted", "info");
    setDeleteTarget(null);
  }

  const columns = [
    {
      key: "name",
      header: "Material",
      render: (row) => {
        const affected = findAffectedProducts(row.id, formulasByProductId, products);
        return (
          <div>
            <p className="font-medium text-ink-900">{row.name}</p>
            <p className="text-xs text-ink-400">{row.supplier}</p>
            {affected.length > 0 && (
              <p className="text-[11px] text-brand-500 mt-0.5">Used in {affected.length} product{affected.length !== 1 ? "s" : ""}</p>
            )}
          </div>
        );
      },
    },
    {
      key: "price",
      header: "Price",
      align: "right",
      render: (row) => (
        <div>
          <span className="font-mono font-semibold text-ink-900">
            {formatCurrency(row.price)} / {row.unitType === "weight" ? "Kg" : "L"}
          </span>
          {row.includeGst && row.gstPercent > 0 && (
            <p className="text-[11px] text-ink-400 mt-0.5 font-mono">
              base {formatCurrency(row.basePrice)} + GST {row.gstPercent}%
            </p>
          )}
        </div>
      ),
    },
    {
      key: "stock",
      header: "Stock",
      align: "right",
      render: (row) => (
        <div className="flex items-center justify-end gap-1.5">
          {row.stock <= row.minStock && <AlertTriangle size={13} className="text-warning-500" />}
          <span className={row.stock <= row.minStock ? "text-warning-600 font-semibold" : "text-ink-700"}>
            {row.stock} {row.unitType === "weight" ? "Kg" : "L"}
          </span>
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (row) =>
        row.stock <= row.minStock ? (
          <Badge tone="warning" dot>Low stock</Badge>
        ) : (
          <Badge tone="success" dot>In stock</Badge>
        ),
    },
    {
      key: "actions",
      header: "",
      align: "right",
      render: (row) =>
        canEdit && (
          <div className="flex items-center justify-end gap-1">
            <button onClick={() => { setEditing(row); setModalOpen(true); }} className="p-2 text-ink-400 hover:text-ink-700 hover:bg-ink-900/5 rounded-lg transition-colors">
              <Pencil size={15} />
            </button>
            <button onClick={() => setDeleteTarget(row)} className="p-2 text-ink-400 hover:text-danger-500 hover:bg-danger-50 rounded-lg transition-colors">
              <Trash2 size={15} />
            </button>
          </div>
        ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Raw Materials"
        subtitle="Prices update instantly across every formula, batch, and cost report"
        actions={canEdit && <Button onClick={() => { setEditing(null); setModalOpen(true); }}><Plus size={16} /> Add Material</Button>}
      />

      <Card padding="p-5">
        <div className="relative max-w-sm mb-4">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400" />
          <Input placeholder="Search materials or supplier…" value={query} onChange={(e) => setQuery(e.target.value)} className="pl-10" />
        </div>
        <DataTable
          columns={columns}
          data={filtered}
          emptyState={<EmptyState icon={Boxes} title="No raw materials found" description="Try a different search term." />}
        />
      </Card>

      <RawMaterialFormModal open={modalOpen} onClose={() => { setModalOpen(false); setEditing(null); }} material={editing} onSaved={handleSaved} />
      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title={`Delete "${deleteTarget?.name}"?`}
        description="Formulas referencing this material will show it as unlinked."
      />
    </div>
  );
}
