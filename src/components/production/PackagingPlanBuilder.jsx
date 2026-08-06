import { Plus, Trash2, CheckCircle2, AlertTriangle } from "lucide-react";
import { Select, Input } from "../ui/Field";
import Button from "../ui/Button";
import { formatCurrency } from "../../utils/formatters";
import { round } from "../../utils/units";

// planLines: [{ id, packagingKitId, qty }]
export default function PackagingPlanBuilder({ planLines, onChange, kits, batchLiters, planCost }) {
  const targetMl = round((Number(batchLiters) || 0) * 1000, 0);
  const filledMl = planCost?.totalMl || 0;
  const remainingMl = round(targetMl - filledMl, 0);
  const pct = targetMl > 0 ? Math.min(100, round((filledMl / targetMl) * 100, 0)) : 0;

  function addLine() {
    onChange([...planLines, { id: `line_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`, packagingKitId: kits[0]?.id || "", qty: 1 }]);
  }
  function updateLine(id, patch) {
    onChange(planLines.map((l) => (l.id === id ? { ...l, ...patch } : l)));
  }
  function removeLine(id) {
    onChange(planLines.filter((l) => l.id !== id));
  }
  function autoFillRemaining() {
    if (planLines.length === 0) return;
    const last = planLines[planLines.length - 1];
    const kit = kits.find((k) => k.id === last.packagingKitId);
    if (!kit?.sizeMl) return;
    const extraUnits = Math.floor(remainingMl / kit.sizeMl);
    if (extraUnits > 0) updateLine(last.id, { qty: Number(last.qty) + extraUnits });
  }

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        {planLines.map((line) => {
          const kit = kits.find((k) => k.id === line.packagingKitId);
          const lineMl = (kit?.sizeMl || 0) * (Number(line.qty) || 0);
          return (
            <div key={line.id} className="flex flex-col sm:flex-row gap-2 sm:items-center bg-ink-900/[0.02] border border-surface-border rounded-xl p-3">
              <Select
                value={line.packagingKitId}
                onChange={(e) => updateLine(line.id, { packagingKitId: e.target.value })}
                className="sm:flex-1"
              >
                {kits.map((k) => (
                  <option key={k.id} value={k.id}>
                    {k.name} · {formatCurrency(k.price)}/pc
                  </option>
                ))}
              </Select>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min="1"
                  value={line.qty}
                  onChange={(e) => updateLine(line.id, { qty: e.target.value })}
                  className="w-24"
                />
                <span className="text-xs text-ink-400 w-24 shrink-0">
                  {lineMl >= 1000 ? `${(lineMl / 1000).toFixed(2)} L` : `${lineMl} ml`}
                </span>
                <button
                  onClick={() => removeLine(line.id)}
                  className="p-2 text-ink-400 hover:text-danger-500 hover:bg-danger-50 rounded-lg transition-colors shrink-0"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant="secondary" onClick={addLine}>
          <Plus size={14} /> Add Packaging Line
        </Button>
        {remainingMl > 0 && planLines.length > 0 && (
          <Button size="sm" variant="outline" onClick={autoFillRemaining}>
            Fill Remaining
          </Button>
        )}
      </div>

      {targetMl > 0 && (
        <div>
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="text-ink-500">
              Packed: {filledMl >= 1000 ? `${(filledMl / 1000).toFixed(2)} L` : `${filledMl} ml`} of{" "}
              {(targetMl / 1000).toFixed(2)} L
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
    </div>
  );
}
