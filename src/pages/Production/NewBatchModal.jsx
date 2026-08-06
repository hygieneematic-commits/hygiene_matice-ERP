import { useState } from "react";
import Modal from "../../components/ui/Modal";
import Button from "../../components/ui/Button";
import { Label, Input, Select, Textarea, FormRow } from "../../components/ui/Field";
import PackagingPlanBuilder from "../../components/production/PackagingPlanBuilder";
import { useProductStore } from "../../store/useProductStore";
import { useProductionStore } from "../../store/useProductionStore";
import { usePackagingKitStore } from "../../store/usePackagingKitStore";
import { useUserStore } from "../../store/useUserStore";
import { useToastStore } from "../../store/useToastStore";
import { useAuditStore } from "../../store/useAuditStore";
import { calculatePackagingPlanCost } from "../../utils/costEngine";

const SHIFTS = ["Morning", "Afternoon", "Night"];

export default function NewBatchModal({ open, onClose, onCreated }) {
  const products = useProductStore((s) => s.products);
  const users = useUserStore((s) => s.users);
  const packagingKits = usePackagingKitStore((s) => s.packagingKits);
  const kitsById = usePackagingKitStore((s) => s.getByIdMap());
  const { createBatch } = useProductionStore();
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

  const planCost = calculatePackagingPlanCost(packagingPlan, kitsById);

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
          <Label hint="Optional — split across sizes now, or later before confirming">Packaging Distribution</Label>
          <PackagingPlanBuilder
            planLines={packagingPlan}
            onChange={setPackagingPlan}
            kits={packagingKits}
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
