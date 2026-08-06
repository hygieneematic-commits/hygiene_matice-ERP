import { useEffect, useState } from "react";
import Modal from "../../components/ui/Modal";
import Button from "../../components/ui/Button";
import { Label, Input, Select, FormRow } from "../../components/ui/Field";
import { usePackagingKitStore } from "../../store/usePackagingKitStore";
import { formatCurrency } from "../../utils/formatters";
import { useAuditStore } from "../../store/useAuditStore";

const CATEGORIES = ["Bottle", "Can", "Gallon", "Drum", "Custom"];
const COST_FIELDS = [
  { key: "bottle", label: "Bottle / Container" },
  { key: "cap", label: "Cap" },
  { key: "label", label: "Label / Sticker" },
  { key: "shrink", label: "Shrink Sleeve" },
  { key: "innerBox", label: "Inner Box" },
  { key: "outerCarton", label: "Outer Carton" },
  { key: "tape", label: "Tape" },
];

const blank = {
  name: "",
  sizeMl: 500,
  category: "Bottle",
  costs: { bottle: 0, cap: 0, label: 0, shrink: 0, innerBox: 0, outerCarton: 0, tape: 0 },
  stock: 0,
  minStock: 0,
};

export default function PackagingKitFormModal({ open, onClose, kit, onSaved }) {
  const { addKit, updateKit } = usePackagingKitStore();
  const logAudit = useAuditStore((s) => s.log);
  const isEdit = !!kit;
  const [form, setForm] = useState(blank);

  useEffect(() => {
    if (open) setForm(kit ? { ...blank, ...kit, costs: { ...blank.costs, ...kit.costs } } : blank);
  }, [open, kit]);

  function set(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }
  function setCost(key, value) {
    setForm((f) => ({ ...f, costs: { ...f.costs, [key]: value } }));
  }

  const total = COST_FIELDS.reduce((sum, f) => sum + (Number(form.costs[f.key]) || 0), 0);

  function handleSubmit(e) {
    e.preventDefault();
    if (!form.name.trim()) return;
    const payload = {
      ...form,
      sizeMl: Number(form.sizeMl),
      stock: Number(form.stock),
      minStock: Number(form.minStock),
      costs: Object.fromEntries(COST_FIELDS.map((f) => [f.key, Number(form.costs[f.key]) || 0])),
    };
    if (isEdit) updateKit(kit.id, payload);
    else addKit(payload);
    logAudit(isEdit ? "Packaging cost changed" : "Packaging type added", `${form.name}: total ₹${total.toFixed(2)}/unit`);
    onSaved?.();
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? "Edit Packaging Type" : "Add Packaging Type"}
      subtitle="e.g. 500ml Bottle, 1 Liter Bottle, 5 Liter HDPE Can, 20 Liter Can, 200 Liter Drum"
      size="lg"
      footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button onClick={handleSubmit}>{isEdit ? "Save Changes" : "Add Type"}</Button></>}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormRow cols={3}>
          <div className="col-span-1">
            <Label>Name</Label>
            <Input value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="e.g. 1 Liter Bottle" required />
          </div>
          <div>
            <Label hint="ml">Pack Size</Label>
            <Input type="number" value={form.sizeMl} onChange={(e) => set("sizeMl", e.target.value)} required />
          </div>
          <div>
            <Label>Category</Label>
            <Select value={form.category} onChange={(e) => set("category", e.target.value)}>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </Select>
          </div>
        </FormRow>

        <div>
          <p className="text-xs font-semibold text-ink-400 uppercase tracking-wide mb-2">Editable Cost Breakdown (₹ / unit)</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {COST_FIELDS.map((f) => (
              <div key={f.key}>
                <Label>{f.label}</Label>
                <Input type="number" step="0.01" value={form.costs[f.key]} onChange={(e) => setCost(f.key, e.target.value)} />
              </div>
            ))}
          </div>
          <div className="flex justify-between items-center border-t border-surface-border mt-3 pt-3">
            <span className="text-sm font-semibold text-ink-900">Total Cost / Unit</span>
            <span className="text-sm font-mono font-bold text-ink-900">{formatCurrency(total)}</span>
          </div>
        </div>

        <FormRow cols={2}>
          <div>
            <Label>Stock (pcs)</Label>
            <Input type="number" value={form.stock} onChange={(e) => set("stock", e.target.value)} required />
          </div>
          <div>
            <Label>Min. Stock (pcs)</Label>
            <Input type="number" value={form.minStock} onChange={(e) => set("minStock", e.target.value)} required />
          </div>
        </FormRow>
      </form>
    </Modal>
  );
}
