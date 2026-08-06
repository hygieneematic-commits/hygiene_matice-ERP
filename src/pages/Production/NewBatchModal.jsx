import { useState, useMemo } from "react";
import { FlaskConical } from "lucide-react";
import Modal from "../../components/ui/Modal";
import Button from "../../components/ui/Button";
import { Label, Input, Select, Textarea, FormRow } from "../../components/ui/Field";
import PackagingComponentBuilder from "../../components/production/PackagingComponentBuilder";
import { useProductStore } from "../../store/useProductStore";
import { useProductionStore } from "../../store/useProductionStore";
import { usePackagingStore } from "../../store/usePackagingStore";
import { useFormulaStore } from "../../store/useFormulaStore";
import { useRawMaterialStore } from "../../store/useRawMaterialStore";
import { useUserStore } from "../../store/useUserStore";
import { useToastStore } from "../../store/useToastStore";
import { useAuditStore } from "../../store/useAuditStore";
import { calculateComponentPlanCost } from "../../utils/costEngine";
import { computeFormulaLines, computeRawMaterialCost, safeNumber } from "../../utils/batchCalcEngine";
import { formatCurrency, formatNumber } from "../../utils/formatters";

const SHIFTS = ["Morning", "Afternoon", "Night"];
const PACKAGING_CATEGORIES = ["Bottle", "Label", "Carton", "Tape", "Cap", "Shrink"];

export default function NewBatchModal({ open, onClose, onCreated }) {
  const products = useProductStore((s) => s.products);
  const users = useUserStore((s) => s.users);
  const packagingItemsAll = usePackagingStore((s) => s.packagingItems);
  const packagingById = useMemo(() => {
    const map = {};
    packagingItemsAll.forEach((p) => (map[p.id] = p));
    return map;
  }, [packagingItemsAll]);
  const packagingByCategory = useMemo(() => {
    const map = {};
    PACKAGING_CATEGORIES.forEach((c) => (map[c] = []));
    packagingItemsAll.forEach((p) => {
      if (p.active === false) return;
      if (!map[p.category]) map[p.category] = [];
      map[p.category].push(p);
    });
    return map;
  }, [packagingItemsAll]);
  const { createBatch } = useProductionStore();
  const { getFormula } = useFormulaStore();
  const rawMaterials = useRawMaterialStore((s) => s.rawMaterials);
  const rawMaterialsById = useMemo(() => {
    const m = {};
    rawMaterials.forEach((r) => (m[r.id] = r));
    return m;
  }, [rawMaterials]);
  const push = useToastStore((s) => s.push);
  const logAudit = useAuditStore((s) => s.log);

  const [form, setForm] = useState({
    productId: products[0]?.id || "",
    quantityL: 20,
    operator: users[0]?.name || "",
    supervisor: users[1]?.name || users[0]?.name || "",
    shift: "Morning",
    mfgDate: new Date().toISOString().slice(0, 10),
    expiryDate: "",
    notes: "",
  });
  const [packagingPlan, setPackagingPlan] = useState([]);

  function set(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  const planCost = calculateComponentPlanCost(packagingPlan, packagingById);

  // Scaled raw-material requirement for the selected product + batch size —
  // shop floor reference so the operator knows exactly how much of each
  // ingredient this specific batch needs, no separate lookup required.
  const formula = getFormula(form.productId);
  const formulaLines = useMemo(
    () => computeFormulaLines(formula?.ingredients, form.quantityL, rawMaterialsById),
    [formula, form.quantityL, rawMaterialsById]
  );
  const rawMaterialResult = useMemo(() => computeRawMaterialCost(formulaLines), [formulaLines]);

  function handleSubmit(e) {
    e.preventDefault();
    if (!form.productId || !form.quantityL) return;
    const batch = createBatch({ ...form, quantityL: Number(form.quantityL), packagingPlan });
    logAudit("Batch created", `${batch.batchNumber} — ${form.quantityL}L`);
    push("Batch created — run the production workflow to confirm");
    onClose();
    onCreated?.(batch);
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="New Production Batch"
      subtitle="This plans a batch — inventory is deducted only after you confirm production"
      size="lg"
      footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button onClick={handleSubmit}>Create Batch</Button></>}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormRow cols={2}>
          <div>
            <Label>Product</Label>
            <Select value={form.productId} onChange={(e) => set("productId", e.target.value)}>
              {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </Select>
          </div>
          <div>
            <Label hint="Liters">Today's Batch Quantity</Label>
            <Input type="number" step="0.1" value={form.quantityL} onChange={(e) => set("quantityL", e.target.value)} required />
          </div>
        </FormRow>

        {rawMaterialResult.lines.length > 0 && (
          <div className="border border-surface-border rounded-xl overflow-hidden">
            <div className="px-4 py-2.5 bg-ink-900/[0.02] flex items-center gap-2">
              <FlaskConical size={14} className="text-brand-600" />
              <p className="text-xs font-semibold text-ink-900">
                Formula Requirement — {safeNumber(form.quantityL)} L batch
              </p>
            </div>
            <div className="divide-y divide-surface-border max-h-52 overflow-y-auto">
              {rawMaterialResult.lines.map((line, i) => {
                const isKg = line.type === "weight";
                const showLarge = line.requiredBaseQty >= 1000;
                const qty = showLarge ? line.requiredBaseQty / 1000 : line.requiredBaseQty;
                const unit = showLarge ? (isKg ? "Kg" : "L") : isKg ? "gm" : "ml";
                return (
                  <div key={i} className="flex items-center justify-between px-4 py-2 text-sm">
                    <span className="text-ink-700">{line.rawMaterialName}</span>
                    <span className="font-mono font-medium text-ink-900">
                      {formatNumber(qty, 2)} {unit}
                    </span>
                  </div>
                );
              })}
            </div>
            <div className="px-4 py-2 bg-brand-50/50 flex justify-between text-sm">
              <span className="font-semibold text-ink-900">Total Raw Material Cost</span>
              <span className="font-mono font-bold text-brand-700">{formatCurrency(rawMaterialResult.totalCost)}</span>
            </div>
          </div>
        )}

        <FormRow cols={3}>
          <div>
            <Label>Operator</Label>
            <Select value={form.operator} onChange={(e) => set("operator", e.target.value)}>
              {users.map((u) => <option key={u.id} value={u.name}>{u.name}</option>)}
            </Select>
          </div>
          <div>
            <Label>Supervisor</Label>
            <Select value={form.supervisor} onChange={(e) => set("supervisor", e.target.value)}>
              {users.map((u) => <option key={u.id} value={u.name}>{u.name}</option>)}
            </Select>
          </div>
          <div>
            <Label>Shift</Label>
            <Select value={form.shift} onChange={(e) => set("shift", e.target.value)}>
              {SHIFTS.map((s) => <option key={s} value={s}>{s}</option>)}
            </Select>
          </div>
        </FormRow>
        <FormRow cols={2}>
          <div>
            <Label>Manufacturing Date</Label>
            <Input type="date" value={form.mfgDate} onChange={(e) => set("mfgDate", e.target.value)} />
          </div>
          <div>
            <Label hint="Optional">Expiry Date</Label>
            <Input type="date" value={form.expiryDate} onChange={(e) => set("expiryDate", e.target.value)} />
          </div>
        </FormRow>

        <div className="border border-surface-border rounded-xl p-4">
          <Label hint="Optional — pick Bottle, then only the components this batch actually uses">Packaging Distribution</Label>
          <PackagingComponentBuilder
            lines={packagingPlan}
            onChange={setPackagingPlan}
            packagingByCategory={packagingByCategory}
            batchLiters={form.quantityL}
            planCost={planCost}
          />
        </div>

        <div>
          <Label hint="Optional">Remarks</Label>
          <Textarea value={form.notes} onChange={(e) => set("notes", e.target.value)} placeholder="Any special instructions for this batch…" />
        </div>
      </form>
    </Modal>
  );
}
