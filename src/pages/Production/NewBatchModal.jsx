import { useState, useMemo, useEffect } from "react";
import { FlaskConical, Pencil, Plus, Trash2, RotateCcw } from "lucide-react";
import Modal from "../../components/ui/Modal";
import Button from "../../components/ui/Button";
import Badge from "../../components/ui/Badge";
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
import { usePermissions } from "../../utils/permissions";
import { calculateComponentPlanCost } from "../../utils/costEngine";
import { computeFormulaLines, computeRawMaterialCost, safeNumber } from "../../utils/batchCalcEngine";
import { toBaseUnit, unitType, ALL_UNITS } from "../../utils/units";
import { formatCurrency, formatNumber } from "../../utils/formatters";

const SHIFTS = ["Morning", "Afternoon", "Evening"];
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
  const { canEdit } = usePermissions();

  const [form, setForm] = useState({
    productId: products[0]?.id || "",
    quantityL: 20,
    operator: users[0]?.name || "",
    supervisor: users[1]?.name || users[0]?.name || "",
    shift: "Morning",
    mfgDate: new Date().toISOString().slice(0, 10),
    startTime: new Date().toTimeString().slice(0, 5),
    endTime: "",
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
  const autoFormulaLines = useMemo(
    () => computeFormulaLines(formula?.ingredients, form.quantityL, rawMaterialsById),
    [formula, form.quantityL, rawMaterialsById]
  );

  // Batch-specific formula override — editable copy of the auto-scaled
  // lines. Only diverges from the master formula for THIS batch; nothing
  // here is ever written back to Formula Library. Once the user manually
  // edits/adds/removes an ingredient, further product/quantity changes stop
  // silently re-scaling over their edits (see "Formula edited" below) —
  // they can explicitly "Reset to Formula" if they want to start over.
  const [editableLines, setEditableLines] = useState(autoFormulaLines);
  const [formulaEdited, setFormulaEdited] = useState(false);
  const [addIngOpen, setAddIngOpen] = useState(false);
  const [newIng, setNewIng] = useState({ rawMaterialId: rawMaterials[0]?.id || "", quantity: "", unit: "ml" });

  useEffect(() => {
    if (!formulaEdited) setEditableLines(autoFormulaLines);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoFormulaLines, formulaEdited]);

  useEffect(() => {
    // Switching product always starts fresh from that product's own formula.
    setFormulaEdited(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.productId]);

  const rawMaterialResult = useMemo(() => computeRawMaterialCost(editableLines), [editableLines]);

  function handleLineQtyChange(index, displayQty) {
    setEditableLines((lines) =>
      lines.map((l, i) => {
        if (i !== index) return l;
        const showLarge = l.requiredBaseQty >= 1000;
        const newBaseQty = showLarge ? safeNumber(displayQty) * 1000 : safeNumber(displayQty);
        return { ...l, requiredBaseQty: newBaseQty };
      })
    );
    setFormulaEdited(true);
  }

  function handleRemoveLine(index) {
    setEditableLines((lines) => lines.filter((_, i) => i !== index));
    setFormulaEdited(true);
  }

  function handleAddIngredient() {
    const rm = rawMaterialsById[newIng.rawMaterialId];
    if (!rm || !newIng.quantity) return;
    const requiredBaseQty = toBaseUnit(safeNumber(newIng.quantity), newIng.unit);
    setEditableLines((lines) => [
      ...lines,
      { rawMaterialId: rm.id, rawMaterialName: rm.name, type: rm.unitType, requiredBaseQty, rawMaterial: rm },
    ]);
    setFormulaEdited(true);
    setAddIngOpen(false);
    setNewIng({ rawMaterialId: rawMaterials[0]?.id || "", quantity: "", unit: "ml" });
  }

  function handleResetFormula() {
    setEditableLines(autoFormulaLines);
    setFormulaEdited(false);
    push("Reset to Formula Library values", "info");
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!form.productId || !form.quantityL) return;
    const batch = createBatch({
      ...form,
      quantityL: Number(form.quantityL),
      packagingPlan,
      formulaOverride: formulaEdited ? editableLines : null,
      formulaEdited,
    });
    logAudit("Batch created", `${batch.batchNumber} — ${form.quantityL}L${formulaEdited ? " (formula edited for this batch)" : ""}`);
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
            <div className="px-4 py-2.5 bg-ink-900/[0.02] flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <FlaskConical size={14} className="text-brand-600" />
                <p className="text-xs font-semibold text-ink-900">
                  Formula Requirement — {safeNumber(form.quantityL)} L batch
                </p>
                {formulaEdited && <Badge tone="warning">Edited for this batch</Badge>}
              </div>
              {canEdit && (
                <div className="flex items-center gap-1">
                  {formulaEdited && (
                    <button type="button" onClick={handleResetFormula} className="p-1.5 text-ink-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors" title="Reset to Formula Library">
                      <RotateCcw size={13} />
                    </button>
                  )}
                  <button type="button" onClick={() => setAddIngOpen(true)} className="p-1.5 text-ink-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors" title="Add ingredient">
                    <Plus size={13} />
                  </button>
                </div>
              )}
            </div>
            <div className="divide-y divide-surface-border max-h-60 overflow-y-auto">
              {rawMaterialResult.lines.map((line, i) => {
                const isKg = line.type === "weight";
                const showLarge = line.requiredBaseQty >= 1000;
                const qty = showLarge ? line.requiredBaseQty / 1000 : line.requiredBaseQty;
                const unit = showLarge ? (isKg ? "Kg" : "L") : isKg ? "gm" : "ml";
                return (
                  <div key={i} className="flex items-center justify-between px-4 py-2 text-sm gap-2">
                    <span className="text-ink-700 truncate">{line.rawMaterialName}</span>
                    {canEdit ? (
                      <div className="flex items-center gap-1.5 shrink-0">
                        <Input
                          type="number"
                          step="0.01"
                          value={qty}
                          onChange={(e) => handleLineQtyChange(i, e.target.value)}
                          className="!w-20 !py-1 !text-xs text-right"
                        />
                        <span className="text-xs text-ink-400 w-7">{unit}</span>
                        <button type="button" onClick={() => handleRemoveLine(i)} className="p-1 text-ink-300 hover:text-danger-500 hover:bg-danger-50 rounded transition-colors">
                          <Trash2 size={13} />
                        </button>
                      </div>
                    ) : (
                      <span className="font-mono font-medium text-ink-900">
                        {formatNumber(qty, 2)} {unit}
                      </span>
                    )}
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

        {canEdit && addIngOpen && (
          <div className="border border-brand-200 bg-brand-50/40 rounded-xl p-3.5 space-y-3">
            <div className="flex items-center gap-2">
              <Pencil size={13} className="text-brand-600" />
              <p className="text-xs font-semibold text-ink-900">Add Ingredient — this batch only</p>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <Select
                value={newIng.rawMaterialId}
                onChange={(e) => {
                  const rm = rawMaterialsById[e.target.value];
                  setNewIng({ ...newIng, rawMaterialId: e.target.value, unit: rm?.unitType === "weight" ? "gm" : "ml" });
                }}
                className="!text-xs col-span-1"
              >
                {rawMaterials.map((rm) => <option key={rm.id} value={rm.id}>{rm.name}</option>)}
              </Select>
              <Input
                type="number"
                step="0.01"
                placeholder="Qty"
                value={newIng.quantity}
                onChange={(e) => setNewIng({ ...newIng, quantity: e.target.value })}
                className="!text-xs"
              />
              <Select value={newIng.unit} onChange={(e) => setNewIng({ ...newIng, unit: e.target.value })} className="!text-xs">
                {ALL_UNITS.filter((u) => unitType(u) === (rawMaterialsById[newIng.rawMaterialId]?.unitType || "volume")).map((u) => (
                  <option key={u} value={u}>{u}</option>
                ))}
              </Select>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="secondary" size="sm" onClick={() => setAddIngOpen(false)}>Cancel</Button>
              <Button type="button" size="sm" onClick={handleAddIngredient}>Add</Button>
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
        <FormRow cols={2}>
          <div>
            <Label>Production Start Time</Label>
            <Input type="time" value={form.startTime} onChange={(e) => set("startTime", e.target.value)} />
          </div>
          <div>
            <Label hint="Optional — fill in when the batch finishes">Production End Time</Label>
            <Input type="time" value={form.endTime} onChange={(e) => set("endTime", e.target.value)} />
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
