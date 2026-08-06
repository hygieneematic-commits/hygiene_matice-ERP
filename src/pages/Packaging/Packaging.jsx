import { useState, useMemo } from "react";
import { Plus, Search, Pencil, Trash2, PackageOpen, AlertTriangle } from "lucide-react";
import PageHeader from "../../components/ui/PageHeader";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import Badge from "../../components/ui/Badge";
import { Input, Label, Select, FormRow } from "../../components/ui/Field";
import DataTable from "../../components/ui/DataTable";
import EmptyState from "../../components/ui/EmptyState";
import ConfirmDialog from "../../components/ui/ConfirmDialog";
import Modal from "../../components/ui/Modal";
import { usePackagingStore } from "../../store/usePackagingStore";
import { usePackagingKitStore } from "../../store/usePackagingKitStore";
import { useProductStore } from "../../store/useProductStore";
import { useToastStore } from "../../store/useToastStore";
import { findAffectedProductsByPackaging } from "../../utils/costEngine";
import { formatCurrency } from "../../utils/formatters";
import PackagingKitFormModal from "./PackagingKitFormModal";
import clsx from "clsx";
import { usePermissions } from "../../utils/permissions";

const CATEGORIES = ["Bottle", "Cap", "Label", "Shrink", "Carton", "Tape", "Other"];

export default function Packaging() {
  const { packagingItems, addPackaging, updatePackaging, deletePackaging } = usePackagingStore();
  const { packagingKits, deleteKit } = usePackagingKitStore();
  const products = useProductStore((s) => s.products);
  const push = useToastStore((s) => s.push);
  const { canEdit } = usePermissions();

  const [tab, setTab] = useState("types");
  const [kitModalOpen, setKitModalOpen] = useState(false);
  const [editingKit, setEditingKit] = useState(null);
  const [deleteKitTarget, setDeleteKitTarget] = useState(null);

  const [query, setQuery] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [form, setForm] = useState({ name: "", category: "Bottle", price: "", stock: "", minStock: "" });

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return packagingItems;
    return packagingItems.filter((p) => p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q));
  }, [packagingItems, query]);

  function openNew() {
    setEditing(null);
    setForm({ name: "", category: "Bottle", price: "", stock: "", minStock: "" });
    setModalOpen(true);
  }
  function openEdit(item) {
    setEditing(item);
    setForm({ ...item });
    setModalOpen(true);
  }

  function handleSubmit(e) {
    e.preventDefault();
    const payload = { ...form, price: Number(form.price), stock: Number(form.stock), minStock: Number(form.minStock) };
    if (editing) {
      updatePackaging(editing.id, payload);
      push("Packaging item updated — costing refreshed everywhere");
    } else {
      addPackaging(payload);
      push("Packaging item added");
    }
    setModalOpen(false);
  }

  function handleDelete() {
    deletePackaging(deleteTarget.id);
    push("Packaging item deleted", "info");
    setDeleteTarget(null);
  }

  const columns = [
    {
      key: "name",
      header: "Item",
      render: (row) => {
        const affected = findAffectedProductsByPackaging(row.id, products);
        return (
          <div>
            <p className="font-medium text-ink-900">{row.name}</p>
            {affected.length > 0 && <p className="text-[11px] text-brand-500 mt-0.5">Used in {affected.length} product{affected.length !== 1 ? "s" : ""}</p>}
          </div>
        );
      },
    },
    { key: "category", header: "Category", render: (row) => <Badge tone="brand">{row.category}</Badge> },
    { key: "price", header: "Price / Piece", align: "right", render: (row) => <span className="font-mono font-semibold">{formatCurrency(row.price)}</span> },
    {
      key: "stock",
      header: "Stock",
      align: "right",
      render: (row) => (
        <div className="flex items-center justify-end gap-1.5">
          {row.stock <= row.minStock && <AlertTriangle size={13} className="text-warning-500" />}
          <span className={row.stock <= row.minStock ? "text-warning-600 font-semibold" : "text-ink-700"}>{row.stock} pcs</span>
        </div>
      ),
    },
    {
      key: "actions",
      header: "",
      align: "right",
      render: (row) =>
        canEdit && (
          <div className="flex items-center justify-end gap-1">
            <button onClick={() => openEdit(row)} className="p-2 text-ink-400 hover:text-ink-700 hover:bg-ink-900/5 rounded-lg transition-colors"><Pencil size={15} /></button>
            <button onClick={() => setDeleteTarget(row)} className="p-2 text-ink-400 hover:text-danger-500 hover:bg-danger-50 rounded-lg transition-colors"><Trash2 size={15} /></button>
          </div>
        ),
    },
  ];

  const kitColumns = [
    {
      key: "name",
      header: "Packaging Type",
      render: (row) => (
        <div>
          <p className="font-medium text-ink-900">{row.name}</p>
          <p className="text-[11px] text-ink-400 mt-0.5">{row.sizeMl >= 1000 ? `${row.sizeMl / 1000} L` : `${row.sizeMl} ml`} capacity</p>
        </div>
      ),
    },
    { key: "category", header: "Category", render: (row) => <Badge tone="brand">{row.category}</Badge> },
    {
      key: "costs",
      header: "Cost Breakdown",
      render: (row) => (
        <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] text-ink-400">
          {Object.entries(row.costs || {})
            .filter(([, v]) => v > 0)
            .map(([k, v]) => (
              <span key={k}>{k}: <span className="font-mono text-ink-600">{formatCurrency(v)}</span></span>
            ))}
        </div>
      ),
    },
    { key: "price", header: "Total / Unit", align: "right", render: (row) => <span className="font-mono font-semibold">{formatCurrency(row.price)}</span> },
    {
      key: "stock",
      header: "Stock",
      align: "right",
      render: (row) => (
        <div className="flex items-center justify-end gap-1.5">
          {row.stock <= row.minStock && <AlertTriangle size={13} className="text-warning-500" />}
          <span className={row.stock <= row.minStock ? "text-warning-600 font-semibold" : "text-ink-700"}>{row.stock} pcs</span>
        </div>
      ),
    },
    {
      key: "actions",
      header: "",
      align: "right",
      render: (row) =>
        canEdit && (
          <div className="flex items-center justify-end gap-1">
            <button onClick={() => { setEditingKit(row); setKitModalOpen(true); }} className="p-2 text-ink-400 hover:text-ink-700 hover:bg-ink-900/5 rounded-lg transition-colors"><Pencil size={15} /></button>
            <button onClick={() => setDeleteKitTarget(row)} className="p-2 text-ink-400 hover:text-danger-500 hover:bg-danger-50 rounded-lg transition-colors"><Trash2 size={15} /></button>
          </div>
        ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Packaging"
        subtitle="Packaging types and components — editable, feeds every batch cost"
        actions={
          !canEdit ? null : tab === "types" ? (
            <Button onClick={() => { setEditingKit(null); setKitModalOpen(true); }}><Plus size={16} /> Add Packaging Type</Button>
          ) : (
            <Button onClick={openNew}><Plus size={16} /> Add Component</Button>
          )
        }
      />

      <div className="flex gap-2 mb-5">
        {[
          { key: "types", label: "Packaging Types" },
          { key: "components", label: "Components" },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={clsx(
              "px-4 py-2 rounded-xl text-sm font-medium border transition-all",
              tab === t.key ? "bg-brand-gradient text-white border-transparent shadow-soft" : "bg-white text-ink-600 border-surface-border hover:border-brand-300"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "types" ? (
        <Card padding="p-5">
          <p className="text-xs text-ink-400 mb-4">
            Complete pack sizes (e.g. "1 Liter Bottle", "5 Liter HDPE Can") used when splitting a batch across packaging in the Batch Calculator and Production. Every cost component is editable.
          </p>
          <DataTable columns={kitColumns} data={packagingKits} emptyState={<EmptyState icon={PackageOpen} title="No packaging types yet" />} />
        </Card>
      ) : (
        <Card padding="p-5">
          <div className="relative max-w-sm mb-4">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400" />
            <Input placeholder="Search packaging…" value={query} onChange={(e) => setQuery(e.target.value)} className="pl-10" />
          </div>
          <DataTable columns={columns} data={filtered} emptyState={<EmptyState icon={PackageOpen} title="No packaging items found" />} />
        </Card>
      )}

      <PackagingKitFormModal open={kitModalOpen} onClose={() => { setKitModalOpen(false); setEditingKit(null); }} kit={editingKit} onSaved={() => { push(editingKit ? "Packaging type updated" : "Packaging type added"); setKitModalOpen(false); setEditingKit(null); }} />
      <ConfirmDialog
        open={!!deleteKitTarget}
        onClose={() => setDeleteKitTarget(null)}
        onConfirm={() => { deleteKit(deleteKitTarget.id); push("Packaging type deleted", "info"); setDeleteKitTarget(null); }}
        title={`Delete "${deleteKitTarget?.name}"?`}
        description="This packaging type will no longer be selectable in the Batch Calculator or Production."
      />

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? "Edit Packaging Item" : "Add Packaging Item"}
        footer={<><Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button><Button onClick={handleSubmit}>{editing ? "Save Changes" : "Add Item"}</Button></>}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Item Name</Label>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Bottle — 500ml" required />
          </div>
          <FormRow cols={2}>
            <div>
              <Label>Category</Label>
              <Select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </Select>
            </div>
            <div>
              <Label>Price / Piece</Label>
              <Input type="number" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} required />
            </div>
          </FormRow>
          <FormRow cols={2}>
            <div>
              <Label>Stock (pcs)</Label>
              <Input type="number" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} required />
            </div>
            <div>
              <Label>Min. Stock (pcs)</Label>
              <Input type="number" value={form.minStock} onChange={(e) => setForm({ ...form, minStock: e.target.value })} required />
            </div>
          </FormRow>
        </form>
      </Modal>

      <ConfirmDialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} title={`Delete "${deleteTarget?.name}"?`} description="Products referencing this item will need a new packaging assignment." />
    </div>
  );
}
