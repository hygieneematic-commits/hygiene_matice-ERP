import { useEffect, useState, useMemo } from "react";
import Modal from "../../components/ui/Modal";
import Button from "../../components/ui/Button";
import { Label, Input, Select, FormRow } from "../../components/ui/Field";
import { useRawMaterialStore } from "../../store/useRawMaterialStore";
import { useProductStore } from "../../store/useProductStore";
import { useFormulaStore } from "../../store/useFormulaStore";
import { findAffectedProducts } from "../../utils/costEngine";
import { AlertTriangle } from "lucide-react";
import { useAuditStore } from "../../store/useAuditStore";

export default function RawMaterialFormModal({ open, onClose, material, onSaved }) {
  const { addRawMaterial, updateRawMaterial } = useRawMaterialStore();
  const products = useProductStore((s) => s.products);
  const formulasByProductId = useFormulaStore((s) => s.formulasByProductId);
  const logAudit = useAuditStore((s) => s.log);
  const isEdit = !!material;

  const blank = { name: "", unitType: "volume", basePrice: "", gstPercent: 18, includeGst: false, stock: "", minStock: "", supplier: "" };
  const [form, setForm] = useState(blank);

  useEffect(() => {
    if (open) {
      setForm(material ? { ...blank, ...material, basePrice: material.basePrice ?? material.price ?? "" } : blank);
    }
  }, [open, material]);

  const gstAmount = form.includeGst ? Math.round(((Number(form.basePrice) || 0) * (Number(form.gstPercent) || 0))) / 100 : 0;
  const finalPrice = Math.round(((Number(form.basePrice) || 0) + gstAmount) * 100) / 100;

  const affected = useMemo(() => {
    if (!isEdit) return [];
    return findAffectedProducts(material.id, formulasByProductId, products);
  }, [isEdit, material, formulasByProductId, products]);

  function set(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!form.name.trim()) return;
    const payload = {
      ...form,
      basePrice: Number(form.basePrice),
      gstPercent: Number(form.gstPercent),
      includeGst: !!form.includeGst,
      price: finalPrice,
      stock: Number(form.stock),
      minStock: Number(form.minStock),
    };
    if (isEdit) {
      updateRawMaterial(material.id, payload);
      logAudit("Raw material price changed", `${form.name}: ₹${material.price?.toFixed(2)} → ₹${finalPrice.toFixed(2)}`);
      onSaved(false);
    } else {
      addRawMaterial(payload);
      logAudit("Raw material added", form.name);
      onSaved(true);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? "Edit Raw Material" : "Add Raw Material"}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit}>{isEdit ? "Save Changes" : "Add Material"}</Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label>Material Name</Label>
          <Input value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="e.g. SLES" required />
        </div>
        <FormRow cols={2}>
          <div>
            <Label>Type</Label>
            <Select value={form.unitType} onChange={(e) => set("unitType", e.target.value)}>
              <option value="volume">Volume (priced per Liter)</option>
              <option value="weight">Weight (priced per Kg)</option>
            </Select>
          </div>
          <div>
            <Label>Supplier</Label>
            <Input value={form.supplier} onChange={(e) => set("supplier", e.target.value)} placeholder="e.g. Chem Source India" />
          </div>
        </FormRow>
        <div className="bg-ink-900/[0.02] border border-surface-border rounded-xl p-4 space-y-3">
          <p className="text-xs font-semibold text-ink-400 uppercase tracking-wide">Price &amp; GST</p>
          <FormRow cols={2}>
            <div>
              <Label hint={form.unitType === "weight" ? "per Kg" : "per Liter"}>Base Price (₹)</Label>
              <Input type="number" step="0.01" value={form.basePrice} onChange={(e) => set("basePrice", e.target.value)} required />
            </div>
            <div>
              <Label>GST %</Label>
              <Select value={form.gstPercent} onChange={(e) => set("gstPercent", e.target.value)}>
                {[0, 5, 12, 18, 28].map((g) => <option key={g} value={g}>{g}%</option>)}
              </Select>
            </div>
          </FormRow>
          <label className="flex items-center gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={form.includeGst}
              onChange={(e) => set("includeGst", e.target.checked)}
              className="w-4 h-4 rounded accent-brand-600"
            />
            <span className="text-sm text-ink-700">Include GST in costing</span>
          </label>
          <div className="flex items-center justify-between border-t border-surface-border pt-3">
            <span className="text-sm text-ink-500">Final Price used in costing</span>
            <span className="text-sm font-mono font-bold text-ink-900">
              ₹{finalPrice.toFixed(2)} / {form.unitType === "weight" ? "Kg" : "L"}
            </span>
          </div>
        </div>

        <FormRow cols={2}>
          <div>
            <Label>Stock</Label>
            <Input type="number" step="0.01" value={form.stock} onChange={(e) => set("stock", e.target.value)} required />
          </div>
          <div>
            <Label>Min. Stock</Label>
            <Input type="number" step="0.01" value={form.minStock} onChange={(e) => set("minStock", e.target.value)} required />
          </div>
        </FormRow>

        {isEdit && affected.length > 0 && (
          <div className="flex items-start gap-2.5 bg-warning-50 border border-warning-500/20 rounded-xl px-3.5 py-3">
            <AlertTriangle size={15} className="text-warning-600 mt-0.5 shrink-0" />
            <p className="text-xs text-warning-700 leading-relaxed">
              Changing the price affects <strong>{affected.length} product{affected.length !== 1 ? "s" : ""}</strong>:{" "}
              {affected.map((p) => p.name).join(", ")}. Costing recalculates automatically everywhere.
            </p>
          </div>
        )}
      </form>
    </Modal>
  );
}
