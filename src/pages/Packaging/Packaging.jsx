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

// The 6 categories requested — each gets its own table. "Label" is shown as
// "Stickers / Labels" since that's the same thing for this business.
const SECTIONS = [
  { category: "Bottle", title: "Bottles / Containers", hint: "Bottle name, capacity, price, and stock — used to pick the container size in Batch Calculator." },
  { category: "Label", title: "Stickers / Labels", hint: "Product stickers, per pack size." },
  { category: "Carton", title: "Cartons / Boxes", hint: "How many bottles each carton holds (capacity) drives auto-calculated carton count." },
  { category: "Tape", title: "Tape", hint: "Sample prices for now — update anytime." },
  { category: "Cap", title: "Caps", hint: "Flip-top, screw, or pump caps." },
  { category: "Shrink", title: "Shrink Film", hint: "Optional — per-bottle sleeves or bulk carton wrap." },
];

const CATEGORIES = SECTIONS.map((s) => s.category);

const blankForm = { name: "", category: "Bottle", price: "", stock: "", minStock: "", capacityMl: "", capacityUnits: "", active: true };

export default function Packaging() {
  const { packagingItems, addPackaging, updatePackaging, deletePackaging } = usePackagingStore();
  const { packagingKits, deleteKit } = usePackagingKitStore();
  const products = useProductStore((s) => s.products);
  const push = useToastStore((s) => s.push);
  const { canEdit } = usePermissions();

  const [tab, setTab] = useState("components");
  const [kitModalOpen, setKitModalOpen] = useState(false);
  const [editingKit, setEditingKit] = useState(null);
  const [deleteKitTarget, setDeleteKitTarget] = useState(null);

  const [query, setQuery] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [form, setForm] = useState(blankForm);

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return packagingItems;
    return packagingItems.filter((p) => p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q));
  }, [packagingItems, query]);

  const byCategory = useMemo(() => {
    const map = {};
    CATEGORIES.forEach((c) => (map[c] = []));
    filtered.forEach((p) => {
      if (!map[p.category]) map[p.category] = [];
      map[p.category].push(p);
    });
    return map;
  }, [filtered]);

  function openNew(category) {
    setEditing(null);
    setForm({ ...blankForm, category: category || "Bottle" });
    setModalOpen(true);
  }
  function openEdit(item) {
    setEditing(item);
    setForm({ ...blankForm, ...item });
    setModalOpen(true);
  }

  function handleSubmit(e) {
    e.preventDefault();
    const payload = {
      ...form,
      price: Number(form.price),
      stock: Number(form.stock),
      minStock: Number(form.minStock),
      capacityMl: form.capacityMl === "" ? undefined : Number(form.capacityMl),
      capacityUnits: form.capacityUnits === "" ? undefined : Number(form.capacityUnits),
    };
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

  function columnsFor(category) {
    const cols = [
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
    ];
    if (category === "Bottle") {
      cols.push({
        key: "capacityMl",
        header: "Capacity",
        render: (row) => <span className="text-ink-500 text-sm">{row.capacityMl ? (row.capacityMl >= 1000 ? `${row.capacityMl / 1000} L` : `${row.capacityMl} ml`) : "—"}</span>,
      });
    }
    if (category === "Carton") {
      cols.push({
        key: "capacityUnits",
        header: "Holds",
        render: (row) => <span className="text-ink-500 text-sm">{row.capacityUnits ? `${row.capacityUnits} bottle${row.capacityUnits !== 1 ? "s" : ""}` : "—"}</span>,
      });
    }
    cols.push(
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
        key: "status",
        header: "Status",
        render: (row) => (row.active === false ? <Badge tone="neutral">Inactive</Badge> : <Badge tone="success">Active</Badge>),
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
      }
    );
    return cols;
  }

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
        subtitle="Bottles, stickers, cartons, tape, caps & shrink — each editable, feeds every batch cost"
        actions={
          !canEdit ? null : tab === "types" ? (
            <Button onClick={() => { setEditingKit(null); setKitModalOpen(true); }}><Plus size={16} /> Add Packaging Type</Button>
          ) : null
        }
      />

      <div className="flex gap-2 mb-5 flex-wrap">
        {[
          { key: "components", label: "Bottles, Stickers, Cartons…" },
          { key: "types", label: "Packaging Types (bundled presets)" },
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
            Optional bundled presets (kept for quick reference). The Batch Calculator and Production now build packaging from the individual Bottle / Sticker / Carton / Tape / Cap / Shrink items below instead.
          </p>
          <DataTable columns={kitColumns} data={packagingKits} emptyState={<EmptyState icon={PackageOpen} title="No packaging types yet" />} />
        </Card>
      ) : (
        <div className="space-y-5">
          <div className="relative max-w-sm">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400" />
            <Input placeholder="Search across all categories…" value={query} onChange={(e) => setQuery(e.target.value)} className="pl-10" />
          </div>

          {SECTIONS.map((section) => (
            <Card key={section.category} padding="p-5">
              <div className="flex items-start justify-between gap-3 mb-1">
                <div>
                  <p className="text-sm font-semibold text-ink-900">{section.title}</p>
                  <p className="text-xs text-ink-400 mt-0.5">{section.hint}</p>
                </div>
                {canEdit && (
                  <Button size="sm" variant="secondary" onClick={() => openNew(section.category)}>
                    <Plus size={14} /> Add {section.title.split(" /")[0].replace(/s$/, "")}
                  </Button>
                )}
              </div>
              <div className="mt-3">
                <DataTable
                  columns={columnsFor(section.category)}
                  data={byCategory[section.category] || []}
                  emptyState={<EmptyState icon={PackageOpen} title={`No ${section.title.toLowerCase()} yet`} />}
                />
              </div>
            </Card>
          ))}
        </div>
      )}

      <PackagingKitFormModal open={kitModalOpen} onClose={() => { setKitModalOpen(false); setEditingKit(null); }} kit={editingKit} onSaved={() => { push(editingKit ? "Packaging type updated" : "Packaging type added"); setKitModalOpen(false); setEditingKit(null); }} />
      <ConfirmDialog
        open={!!deleteKitTarget}
        onClose={() => setDeleteKitTarget(null)}
        onConfirm={() => { deleteKit(deleteKitTarget.id); push("Packaging type deleted", "info"); setDeleteKitTarget(null); }}
        title={`Delete "${deleteKitTarget?.name}"?`}
        description="This packaging type will no longer be selectable as a bundled preset."
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
                {CATEGORIES.map((c) => <option key={c} value={c}>{SECTIONS.find((s) => s.category === c)?.title || c}</option>)}
              </Select>
            </div>
            <div>
              <Label>Price / Piece</Label>
              <Input type="number" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} required />
            </div>
          </FormRow>
          {form.category === "Bottle" && (
            <div>
              <Label hint="ml — used to auto-calculate bottle count for a batch">Capacity</Label>
              <Input type="number" value={form.capacityMl} onChange={(e) => setForm({ ...form, capacityMl: e.target.value })} placeholder="e.g. 1000 for 1 Liter" />
            </div>
          )}
          {form.category === "Carton" && (
            <div>
              <Label hint="How many bottles this carton holds — used to auto-calculate carton count">Holds (bottles)</Label>
              <Input type="number" value={form.capacityUnits} onChange={(e) => setForm({ ...form, capacityUnits: e.target.value })} placeholder="e.g. 12" />
            </div>
          )}
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
          <div className="flex items-center gap-2">
            <input type="checkbox" id="pkg-active" checked={form.active !== false} onChange={(e) => setForm({ ...form, active: e.target.checked })} className="w-4 h-4 rounded accent-brand-500" />
            <label htmlFor="pkg-active" className="text-sm text-ink-700">Active (selectable in Batch Calculator)</label>
          </div>
        </form>
      </Modal>

      <ConfirmDialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} title={`Delete "${deleteTarget?.name}"?`} description="Products or packaging plans referencing this item will need a new assignment." />
    </div>
  );
}
