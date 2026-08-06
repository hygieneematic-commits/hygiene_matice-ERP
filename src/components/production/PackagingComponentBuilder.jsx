import { Plus, Trash2, CheckCircle2, AlertTriangle } from "lucide-react";
import { Select, Input } from "../ui/Field";
import Button from "../ui/Button";
import { formatCurrency } from "../../utils/formatters";
import { round } from "../../utils/units";

function newLine(bottles) {
  return {
    id: `line_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    bottleId: bottles[0]?.id || "",
    units: 1,
    useSticker: false,
    stickerId: "",
    useCarton: false,
    cartonId: "",
    useTape: false,
    tapeId: "",
    useCap: false,
    capId: "",
    useShrink: false,
    shrinkId: "",
  };
}

// Every packaging item (Bottle / Sticker / Carton / Tape / Cap / Shrink) is
// asked for individually, exactly like a real manufacturing ERP — nothing is
// hardcoded, every option comes straight from the Packaging Master.
// packagingByCategory: { Bottle: [...], Label: [...], Carton: [...], Tape: [...], Cap: [...], Shrink: [...] }
export default function PackagingComponentBuilder({ lines, onChange, packagingByCategory, batchLiters, planCost }) {
  const bottles = packagingByCategory.Bottle || [];
  const stickers = packagingByCategory.Label || [];
  const cartons = packagingByCategory.Carton || [];
  const tapes = packagingByCategory.Tape || [];
  const caps = packagingByCategory.Cap || [];
  const shrinks = packagingByCategory.Shrink || [];

  const targetMl = round((Number(batchLiters) || 0) * 1000, 0);
  const filledMl = planCost?.totalMl || 0;
  const remainingMl = round(targetMl - filledMl, 0);
  const pct = targetMl > 0 ? Math.min(100, round((filledMl / targetMl) * 100, 0)) : 0;

  function addLine() {
    onChange([...lines, newLine(bottles)]);
  }
  function updateLine(id, patch) {
    onChange(lines.map((l) => (l.id === id ? { ...l, ...patch } : l)));
  }
  function removeLine(id) {
    onChange(lines.filter((l) => l.id !== id));
  }
  function autoFillRemaining() {
    if (lines.length === 0) return;
    const last = lines[lines.length - 1];
    const bottle = bottles.find((b) => b.id === last.bottleId);
    if (!bottle?.capacityMl) return;
    const extraUnits = Math.floor(remainingMl / bottle.capacityMl);
    if (extraUnits > 0) updateLine(last.id, { units: Number(last.units) + extraUnits });
  }

  // Aggregate totals per component type, across every line, for the summary card
  const summary = ["bottle", "sticker", "cap", "shrink", "carton", "tape"].map((key) => {
    const label = { bottle: "Bottle", sticker: "Sticker", cap: "Cap", shrink: "Shrink", carton: "Carton", tape: "Tape" }[key];
    let cost = 0;
    let qty = 0;
    (planCost?.breakdown || []).forEach((line) => {
      const item = line[key];
      if (!item) return;
      const lineQty = key === "carton" ? line.cartonCount : key === "tape" ? line.tapeCount : line.units;
      const lineCost = line[`${key}Cost`] || 0;
      if (lineCost > 0) {
        cost += lineCost;
        qty += lineQty;
      }
    });
    return { key, label, cost: round(cost, 2), qty };
  }).filter((s) => s.cost > 0);

  return (
    <div className="space-y-3">
      <div className="space-y-3">
        {lines.map((line) => {
          const found = (planCost?.breakdown || []).find((b) => b.id === line.id);
          const lineMl = (bottles.find((b) => b.id === line.bottleId)?.capacityMl || 0) * (Number(line.units) || 0);
          return (
            <div key={line.id} className="bg-ink-900/[0.02] border border-surface-border rounded-xl p-3.5 space-y-3">
              <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
                <Select value={line.bottleId} onChange={(e) => updateLine(line.id, { bottleId: e.target.value })} className="sm:flex-1">
                  {bottles.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name} · {formatCurrency(b.price)}/pc
                    </option>
                  ))}
                </Select>
                <div className="flex items-center gap-2">
                  <Input type="number" min="1" value={line.units} onChange={(e) => updateLine(line.id, { units: e.target.value })} className="w-24" placeholder="Bottles" />
                  <span className="text-xs text-ink-400 w-20 shrink-0">{lineMl >= 1000 ? `${(lineMl / 1000).toFixed(2)} L` : `${lineMl} ml`}</span>
                  <button onClick={() => removeLine(line.id)} className="p-2 text-ink-400 hover:text-danger-500 hover:bg-danger-50 rounded-lg transition-colors shrink-0">
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <ToggleSelect
                  label="Sticker"
                  checked={line.useSticker}
                  onToggle={(v) => updateLine(line.id, { useSticker: v, stickerId: v ? line.stickerId || stickers[0]?.id : line.stickerId })}
                  value={line.stickerId}
                  onChange={(id) => updateLine(line.id, { stickerId: id })}
                  options={stickers}
                />
                <ToggleSelect
                  label="Cap"
                  checked={line.useCap}
                  onToggle={(v) => updateLine(line.id, { useCap: v, capId: v ? line.capId || caps[0]?.id : line.capId })}
                  value={line.capId}
                  onChange={(id) => updateLine(line.id, { capId: id })}
                  options={caps}
                />
                <ToggleSelect
                  label="Shrink"
                  checked={line.useShrink}
                  onToggle={(v) => updateLine(line.id, { useShrink: v, shrinkId: v ? line.shrinkId || shrinks[0]?.id : line.shrinkId })}
                  value={line.shrinkId}
                  onChange={(id) => updateLine(line.id, { shrinkId: id })}
                  options={shrinks}
                />
                <ToggleSelect
                  label="Carton"
                  checked={line.useCarton}
                  onToggle={(v) => updateLine(line.id, { useCarton: v, cartonId: v ? line.cartonId || cartons[0]?.id : line.cartonId })}
                  value={line.cartonId}
                  onChange={(id) => updateLine(line.id, { cartonId: id })}
                  options={cartons}
                />
                <div className="sm:col-span-2">
                  <ToggleSelect
                    label="Tape"
                    checked={line.useTape}
                    onToggle={(v) => updateLine(line.id, { useTape: v, tapeId: v ? line.tapeId || tapes[0]?.id : line.tapeId })}
                    value={line.tapeId}
                    onChange={(id) => updateLine(line.id, { tapeId: id })}
                    options={tapes}
                  />
                </div>
              </div>

              {found && (
                <div className="flex items-center justify-between text-xs pt-1 border-t border-surface-border">
                  <span className="text-ink-400">Line packaging cost</span>
                  <span className="font-mono font-semibold text-ink-900">{formatCurrency(found.lineCost)} <span className="text-ink-400 font-normal">({formatCurrency(found.unitCost)}/unit)</span></span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant="secondary" onClick={addLine}>
          <Plus size={14} /> Add Packaging Line
        </Button>
        {remainingMl > 0 && lines.length > 0 && (
          <Button size="sm" variant="outline" onClick={autoFillRemaining}>
            Fill Remaining
          </Button>
        )}
      </div>

      {targetMl > 0 && (
        <div>
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="text-ink-500">
              Packed: {filledMl >= 1000 ? `${(filledMl / 1000).toFixed(2)} L` : `${filledMl} ml`} of {(targetMl / 1000).toFixed(2)} L
            </span>
            {remainingMl === 0 ? (
              <span className="inline-flex items-center gap-1 text-success-600 font-semibold">
                <CheckCircle2 size={12} /> Fully allocated
              </span>
            ) : remainingMl > 0 ? (
              <span className="inline-flex items-center gap-1 text-warning-600 font-semibold">
                <AlertTriangle size={12} /> {remainingMl >= 1000 ? `${(remainingMl / 1000).toFixed(2)} L` : `${remainingMl} ml`} left
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-danger-600 font-semibold">
                <AlertTriangle size={12} /> Over by {remainingMl >= -1000 ? `${Math.abs(remainingMl)} ml` : `${Math.abs(remainingMl / 1000).toFixed(2)} L`}
              </span>
            )}
          </div>
          <div className="h-2 rounded-full bg-ink-900/[0.06] overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${remainingMl < 0 ? "bg-danger-500" : remainingMl === 0 ? "bg-success-500" : "bg-brand-gradient"}`}
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      )}

      {summary.length > 0 && (
        <div className="border border-surface-border rounded-xl p-3.5 bg-white">
          <p className="text-xs font-semibold text-ink-400 uppercase tracking-wide mb-2">Packaging Summary</p>
          <div className="space-y-1.5">
            {summary.map((s) => (
              <div key={s.key} className="flex items-center justify-between text-sm">
                <span className="text-ink-600">{s.label} <span className="text-ink-400">× {s.qty}</span></span>
                <span className="font-mono text-ink-900">{formatCurrency(s.cost)}</span>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between text-sm font-semibold border-t border-surface-border mt-2 pt-2">
            <span className="text-ink-900">Total Packaging Cost</span>
            <span className="font-mono text-ink-900">{formatCurrency(planCost?.totalCost)}</span>
          </div>
        </div>
      )}
    </div>
  );
}

function ToggleSelect({ label, checked, onToggle, value, onChange, options }) {
  return (
    <div className="bg-white border border-surface-border rounded-lg px-2.5 py-2">
      <label className="flex items-center gap-2 text-xs text-ink-600 mb-1.5 cursor-pointer select-none">
        <input type="checkbox" checked={!!checked} onChange={(e) => onToggle(e.target.checked)} className="w-3.5 h-3.5 rounded accent-brand-500" />
        Use {label}
      </label>
      {checked && (
        <Select value={value} onChange={(e) => onChange(e.target.value)} className="!py-1.5 !text-xs">
          {options.length === 0 && <option value="">No {label.toLowerCase()} items — add one in Packaging</option>}
          {options.map((o) => (
            <option key={o.id} value={o.id}>
              {o.name} · {formatCurrency(o.price)}
            </option>
          ))}
        </Select>
      )}
    </div>
  );
}
