import { useState, useEffect, useRef, useMemo } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Play, Pause, RotateCcw, CheckCircle2, Printer, XCircle } from "lucide-react";
import Modal from "../../components/ui/Modal";
import Button from "../../components/ui/Button";
import Badge from "../../components/ui/Badge";
import { Input, Label, Select } from "../../components/ui/Field";
import { useProductStore } from "../../store/useProductStore";
import { useProductionStore } from "../../store/useProductionStore";
import { usePackagingStore } from "../../store/usePackagingStore";
import { useFormulaStore } from "../../store/useFormulaStore";
import { useRawMaterialStore } from "../../store/useRawMaterialStore";
import { useUserStore } from "../../store/useUserStore";
import { useToastStore } from "../../store/useToastStore";
import { formatDate, formatCurrency } from "../../utils/formatters";
import { calculateComponentPlanCost } from "../../utils/costEngine";
import { computeFormulaLines, computeRawMaterialCost } from "../../utils/batchCalcEngine";
import { DEFAULT_METHOD_STEPS } from "../../store/useFormulaStore";

// Quality Check checklist (spec §6) — same for every product; the
// manufacturing PROCESS steps below are per-product now (see formula.method,
// editable in Formula Library), falling back to DEFAULT_METHOD_STEPS for any
// product that hasn't customized its method yet.
const QC_ITEMS = [
  "PH Checked",
  "Colour Checked",
  "Fragrance Checked",
  "Viscosity Checked",
  "Appearance Checked",
  "Bottle Filled",
  "Cap Locked",
  "Label Applied",
  "Packing Completed",
];

export default function ProductionDetailModal({ open, onClose, batch }) {
  const product = useProductStore((s) => (batch ? s.getById(batch.productId) : null));
  const { confirmProduction, updateBatch } = useProductionStore();
  const packagingItemsAll = usePackagingStore((s) => s.packagingItems);
  const packagingById = useMemo(() => {
    const map = {};
    packagingItemsAll.forEach((p) => (map[p.id] = p));
    return map;
  }, [packagingItemsAll]);
  const planCost = useMemo(() => calculateComponentPlanCost(batch?.packagingPlan, packagingById), [batch, packagingById]);
  const { getFormula } = useFormulaStore();
  const rawMaterials = useRawMaterialStore((s) => s.rawMaterials);
  const rawMaterialsById = useMemo(() => {
    const m = {};
    rawMaterials.forEach((r) => (m[r.id] = r));
    return m;
  }, [rawMaterials]);
  // Ingredient list scaled to THIS batch's actual size — same shop-floor
  // reference shown at creation time (NewBatchModal), also available here
  // for an already-planned/in-progress batch so the operator doesn't have
  // to reopen the New Batch form just to check quantities again.
  const formula = getFormula(batch?.productId);
  // This product's own manufacturing ingredient list for THIS batch — uses
  // the batch's formula override if one was set at creation time (so what's
  // shown here always matches what confirmProduction will actually deduct),
  // otherwise falls back to the master formula scaled to quantityL.
  const formulaLines = useMemo(() => {
    if (!batch) return [];
    if (batch.formulaOverride?.length) return batch.formulaOverride;
    return computeFormulaLines(formula?.ingredients, batch.quantityL, rawMaterialsById);
  }, [formula, batch, rawMaterialsById]);
  const rawMaterialResult = useMemo(() => computeRawMaterialCost(formulaLines), [formulaLines]);
  // This product's own manufacturing method (editable in Formula Library) —
  // falls back to the generic default list only if it hasn't been customized.
  const processSteps = useMemo(() => {
    const method = formula?.method;
    return method && method.length > 0 ? method.map((s) => s.text) : DEFAULT_METHOD_STEPS;
  }, [formula]);
  const users = useUserStore((s) => s.users);
  const push = useToastStore((s) => s.push);

  const [processChecked, setProcessChecked] = useState({});
  const [qcChecked, setQcChecked] = useState({});
  const [qcDecision, setQcDecision] = useState("approved");
  const [approvedBy, setApprovedBy] = useState(users[0]?.name || "");
  const [seconds, setSeconds] = useState(0);
  const [running, setRunning] = useState(false);
  const [yieldPercent, setYieldPercent] = useState(100);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (open && batch) {
      setProcessChecked({});
      setQcChecked({});
      setQcDecision("approved");
      setApprovedBy(batch.qc?.approvedBy || users[0]?.name || "");
      setSeconds(0);
      setRunning(false);
      setYieldPercent(batch.yieldPercent ?? 100);
    }
  }, [open, batch]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => setSeconds((s) => s + 1), 1000);
    } else {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [running]);

  if (!batch) return null;

  const allProcessDone = processSteps.every((_, i) => processChecked[i]);
  const allQcDone = QC_ITEMS.every((_, i) => qcChecked[i]);
  const isCompleted = batch.status === "completed";
  const canConfirm = allProcessDone && allQcDone && qcDecision === "approved";

  function formatTime(total) {
    const m = String(Math.floor(total / 60)).padStart(2, "0");
    const s = String(total % 60).padStart(2, "0");
    return `${m}:${s}`;
  }

  // Steps must be checked in order — this is what makes it a real "process", not a free-for-all list
  function toggleProcessStep(idx) {
    if (isCompleted) return;
    const prevDone = idx === 0 || processChecked[idx - 1];
    if (!prevDone && !processChecked[idx]) return;
    setProcessChecked((c) => ({ ...c, [idx]: !c[idx] }));
  }

  function handleConfirm() {
    updateBatch(batch.id, {
      yieldPercent: Number(yieldPercent),
      qc: {
        items: QC_ITEMS.filter((_, i) => qcChecked[i]),
        decision: qcDecision,
        approvedBy,
        approvalDate: new Date().toISOString(),
      },
    });
    confirmProduction(batch.id);
    push(`Batch ${batch.batchNumber} confirmed — inventory updated`);
    onClose();
  }

  function handleReject() {
    updateBatch(batch.id, {
      status: "rejected",
      qc: { items: QC_ITEMS.filter((_, i) => qcChecked[i]), decision: "rejected", approvedBy, approvalDate: new Date().toISOString() },
    });
    push(`Batch ${batch.batchNumber} marked as rejected by QC`, "warning");
    onClose();
  }

  const qrPayload = JSON.stringify({
    batch: batch.batchNumber,
    product: product?.name,
    qtyL: batch.quantityL,
    mfg: batch.mfgDate,
    exp: batch.expiryDate,
  });

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={product?.name}
      subtitle={`Batch ${batch.batchNumber} · ${batch.quantityL}L`}
      size="xl"
      footer={
        !isCompleted &&
        batch.status !== "rejected" && (
          <>
            <Button variant="secondary" onClick={onClose}>Close</Button>
            <Button variant="danger" onClick={handleReject} disabled={!allQcDone}>
              <XCircle size={16} /> Reject
            </Button>
            <Button onClick={handleConfirm} disabled={!canConfirm}>
              <CheckCircle2 size={16} /> Confirm Production
            </Button>
          </>
        )
      }
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-5">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Field label="Operator" value={batch.operator} />
            <Field label="Supervisor" value={batch.supervisor || "—"} />
            <Field label="Shift" value={batch.shift || "—"} />
            <Field label="Mfg. Date" value={formatDate(batch.mfgDate)} />
          </div>

          {rawMaterialResult.lines.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <p className="text-sm font-semibold text-ink-900">Raw Material Requirement — {batch.quantityL}L</p>
                {batch.formulaEdited && <Badge tone="warning">Formula edited for this batch</Badge>}
              </div>
              <div className="border border-surface-border rounded-xl divide-y divide-surface-border">
                {rawMaterialResult.lines.map((line, i) => {
                  const isKg = line.type === "weight";
                  const displayQty = line.requiredBaseQty >= 1000 ? line.requiredBaseQty / 1000 : line.requiredBaseQty;
                  const displayUnit = line.requiredBaseQty >= 1000 ? (isKg ? "Kg" : "L") : isKg ? "gm" : "ml";
                  return (
                    <div key={i} className="flex items-center justify-between px-3.5 py-2 text-sm">
                      <span className="text-ink-700">{line.rawMaterialName}</span>
                      <span className="font-mono font-medium text-ink-900">
                        {displayQty.toFixed(2)} {displayUnit}
                      </span>
                    </div>
                  );
                })}
                <div className="flex items-center justify-between px-3.5 py-2 text-sm bg-brand-50/50 rounded-b-xl">
                  <span className="font-semibold text-ink-900">Total Raw Material Cost</span>
                  <span className="font-mono font-bold text-brand-700">{formatCurrency(rawMaterialResult.totalCost)}</span>
                </div>
              </div>
            </div>
          )}

          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-semibold text-ink-900">Manufacturing Process</p>
              {isCompleted || batch.status === "rejected" ? (
                <Badge tone={batch.status === "rejected" ? "danger" : "success"}>{batch.status === "rejected" ? "Rejected" : "Completed"}</Badge>
              ) : (
                <Badge tone={allProcessDone ? "success" : "warning"}>{Object.values(processChecked).filter(Boolean).length}/{processSteps.length}</Badge>
              )}
            </div>
            <div className="space-y-2">
              {processSteps.map((step, idx) => {
                const locked = !isCompleted && idx > 0 && !processChecked[idx - 1];
                return (
                  <label
                    key={idx}
                    className={`flex items-center gap-3 border border-surface-border rounded-xl px-3.5 py-2.5 transition-colors ${
                      locked ? "opacity-40 cursor-not-allowed" : "cursor-pointer hover:bg-ink-900/[0.02]"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isCompleted ? true : !!processChecked[idx]}
                      disabled={isCompleted || locked}
                      onChange={() => toggleProcessStep(idx)}
                      className="w-4 h-4 rounded accent-brand-600"
                    />
                    <span className="text-sm text-ink-700">Step {idx + 1}: {step}</span>
                  </label>
                );
              })}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-semibold text-ink-900">Quality Check</p>
              {!isCompleted && batch.status !== "rejected" && (
                <Badge tone={allQcDone ? "success" : "warning"}>{Object.values(qcChecked).filter(Boolean).length}/{QC_ITEMS.length}</Badge>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
              {QC_ITEMS.map((item, idx) => (
                <label key={idx} className="flex items-center gap-3 border border-surface-border rounded-xl px-3.5 py-2.5 cursor-pointer hover:bg-ink-900/[0.02] transition-colors">
                  <input
                    type="checkbox"
                    checked={isCompleted || batch.status === "rejected" ? batch.qc?.items?.includes(item) ?? false : !!qcChecked[idx]}
                    disabled={isCompleted || batch.status === "rejected"}
                    onChange={(e) => setQcChecked((c) => ({ ...c, [idx]: e.target.checked }))}
                    className="w-4 h-4 rounded accent-brand-600"
                  />
                  <span className="text-sm text-ink-700">{item}</span>
                </label>
              ))}
            </div>

            {!isCompleted && batch.status !== "rejected" ? (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <Label>QC Decision</Label>
                  <Select value={qcDecision} onChange={(e) => setQcDecision(e.target.value)}>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                  </Select>
                </div>
                <div>
                  <Label>Approved By</Label>
                  <Select value={approvedBy} onChange={(e) => setApprovedBy(e.target.value)}>
                    {users.map((u) => <option key={u.id} value={u.name}>{u.name}</option>)}
                  </Select>
                </div>
                <div>
                  <Label hint="%">Yield</Label>
                  <Input type="number" step="0.1" max="100" value={yieldPercent} onChange={(e) => setYieldPercent(e.target.value)} />
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 bg-ink-900/[0.02] rounded-xl p-3.5">
                <Field label="QC Result" value={<Badge tone={batch.qc?.decision === "rejected" ? "danger" : "success"} dot>{batch.qc?.decision === "rejected" ? "Rejected" : "Approved"}</Badge>} />
                <Field label="Approved By" value={batch.qc?.approvedBy || "—"} />
                <Field label="Approval Date" value={batch.qc?.approvalDate ? formatDate(batch.qc.approvalDate) : "—"} />
              </div>
            )}
          </div>

          {planCost.breakdown.length > 0 && (
            <div>
              <p className="text-sm font-semibold text-ink-900 mb-2">Packaging Distribution</p>
              <div className="divide-y divide-surface-border border border-surface-border rounded-xl overflow-hidden">
                {planCost.breakdown.map((line) => (
                  <div key={line.id} className="px-3.5 py-2.5 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-ink-700">{line.bottle?.name || "Unknown bottle"}</span>
                      <span className="font-mono font-semibold text-ink-900">{line.units} × {formatCurrency(line.lineCost / line.units)} = {formatCurrency(line.lineCost)}</span>
                    </div>
                    <p className="text-[11px] text-ink-400 mt-0.5">
                      {[line.sticker && "Sticker", line.cap && "Cap", line.shrink && "Shrink", line.carton && `Carton (${line.cartonCount})`, line.tape && "Tape"].filter(Boolean).join(" · ") || "Bottle only"}
                    </p>
                  </div>
                ))}
                <div className="flex items-center justify-between px-3.5 py-2.5 text-sm bg-ink-900/[0.02] font-semibold">
                  <span className="text-ink-900">Total Packaging Cost</span>
                  <span className="font-mono text-ink-900">{formatCurrency(planCost.totalCost)}</span>
                </div>
              </div>
            </div>
          )}

          {batch.notes && (
            <div>
              <p className="text-xs text-ink-400 mb-1">Remarks</p>
              <p className="text-sm text-ink-700 bg-ink-900/[0.03] rounded-xl px-3.5 py-3">{batch.notes}</p>
            </div>
          )}

          <div className="border border-surface-border rounded-xl p-4">
            <p className="text-sm font-semibold text-ink-900 mb-3">Mixing Timer</p>
            <div className="flex items-center gap-4">
              <span className="text-3xl font-mono font-bold text-ink-900">{formatTime(seconds)}</span>
              <div className="flex gap-2">
                <Button size="sm" variant="secondary" onClick={() => setRunning((r) => !r)}>
                  {running ? <Pause size={14} /> : <Play size={14} />} {running ? "Pause" : "Start"}
                </Button>
                <Button size="sm" variant="outline" onClick={() => { setRunning(false); setSeconds(0); }}>
                  <RotateCcw size={14} />
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-center border border-surface-border rounded-xl p-5">
          <p className="text-xs font-semibold text-ink-400 uppercase tracking-wide mb-3">Batch QR Code</p>
          <div className="bg-white p-2 rounded-lg">
            <QRCodeSVG value={qrPayload} size={140} fgColor="#0F172A" />
          </div>
          <p className="text-xs font-mono text-ink-500 mt-3">{batch.batchNumber}</p>
          <Button size="sm" variant="secondary" className="mt-4 w-full" onClick={() => window.print()}>
            <Printer size={14} /> Print Sheet
          </Button>
        </div>
      </div>
    </Modal>
  );
}

function Field({ label, value }) {
  return (
    <div>
      <p className="text-xs text-ink-400 mb-1">{label}</p>
      <p className="text-sm font-medium text-ink-900">{value}</p>
    </div>
  );
}
