import { useState, useMemo } from "react";
import { IndianRupee, TrendingUp, TrendingDown } from "lucide-react";
import PageHeader from "../../components/ui/PageHeader";
import Card from "../../components/ui/Card";
import Badge from "../../components/ui/Badge";
import { Select, Input, Label, FormRow } from "../../components/ui/Field";
import { useProductStore } from "../../store/useProductStore";
import { useFormulaStore } from "../../store/useFormulaStore";
import { useRawMaterialStore } from "../../store/useRawMaterialStore";
import { usePackagingStore } from "../../store/usePackagingStore";
import { useSettingsStore } from "../../store/useSettingsStore";
import { calculateFullCost, calculateSellingMetrics } from "../../utils/costEngine";
import { computeRawMaterialInputGst, estimatePackagingInputGst, computeGstLedger, safeNumber } from "../../utils/batchCalcEngine";
import { formatCurrency, pct } from "../../utils/formatters";
import clsx from "clsx";

export default function CostProfit() {
  const products = useProductStore((s) => s.products);
  const { getFormula } = useFormulaStore();
  const rawMaterials = useRawMaterialStore((s) => s.rawMaterials);
  const rawMaterialsById = useMemo(() => { const m = {}; rawMaterials.forEach((r) => (m[r.id] = r)); return m; }, [rawMaterials]);
  const packagingItemsAll = usePackagingStore((s) => s.packagingItems);
  const packagingById = useMemo(() => { const m = {}; packagingItemsAll.forEach((p) => (m[p.id] = p)); return m; }, [packagingItemsAll]);
  const settings = useSettingsStore((s) => s.settings);

  const [productId, setProductId] = useState(products[0]?.id || "");
  const [batchLiters, setBatchLiters] = useState(50);
  const [sellingPrice, setSellingPrice] = useState(null);
  const [gstOverride, setGstOverride] = useState(false);
  const [cgst, setCgst] = useState(settings.cgstPercent);
  const [sgst, setSgst] = useState(settings.sgstPercent);
  const [packagingGstPercent, setPackagingGstPercent] = useState("18"); // assumed rate — packaging items don't carry a per-item GST% yet

  const product = products.find((p) => p.id === productId);
  const formula = getFormula(productId);
  const effectivePrice = sellingPrice ?? product?.sellingPricePerL ?? 0;

  const result = useMemo(() => {
    if (!product) return null;
    return calculateFullCost({ product, formula, batchLiters, rawMaterialsById, packagingById, settings });
  }, [product, formula, batchLiters, rawMaterialsById, packagingById, settings]);

  const metrics = useMemo(() => {
    if (!result) return null;
    return calculateSellingMetrics({
      sellingPricePerL: Number(effectivePrice),
      costPerLiter: result.costPerLiter,
      directCostPerLiter: result.directCostPerLiter,
      batchLiters,
      settings: gstOverride ? { cgstPercent: Number(cgst), sgstPercent: Number(sgst) } : settings,
    });
  }, [result, effectivePrice, batchLiters, gstOverride, cgst, sgst, settings]);

  // ---- GST Ledger: Input GST (on purchases) vs Output GST (on sale) ----
  const inputGstRawResult = useMemo(() => {
    if (!result) return { lines: [], total: 0 };
    const lines = result.rawMaterialCost.breakdown.map((line) => ({
      rawMaterial: rawMaterialsById[line.rawMaterialId],
      largeUnitQty: line.scaledBaseQty / 1000,
    }));
    return computeRawMaterialInputGst(lines);
  }, [result, rawMaterialsById]);
  const inputGstPackagingResult = useMemo(
    () => estimatePackagingInputGst(result?.packagingCost?.total, packagingGstPercent),
    [result, packagingGstPercent]
  );
  const outputGstTotal = safeNumber(metrics?.totalGstPerL) * safeNumber(batchLiters);
  const gstLedger = useMemo(
    () =>
      computeGstLedger({
        outputGstTotal,
        inputGstRawMaterial: inputGstRawResult.total,
        inputGstPackaging: inputGstPackagingResult.gstAmount,
      }),
    [outputGstTotal, inputGstRawResult, inputGstPackagingResult]
  );

  function marginTone(margin) {
    if (margin >= 25) return "success";
    if (margin >= 10) return "warning";
    return "danger";
  }

  function handleProductChange(id) {
    setProductId(id);
    setSellingPrice(null);
  }

  return (
    <div>
      <PageHeader title="Cost & Profit" subtitle="Model selling price, GST, and profitability for any product and batch size" />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <Card className="lg:col-span-1 h-fit">
          <p className="text-xs font-semibold text-ink-400 uppercase tracking-wide mb-4">Inputs</p>
          <div className="space-y-4">
            <div>
              <Label>Product</Label>
              <Select value={productId} onChange={(e) => handleProductChange(e.target.value)}>
                {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </Select>
            </div>
            <div>
              <Label hint="Liters">Batch Size</Label>
              <Input type="number" step="1" value={batchLiters} onChange={(e) => setBatchLiters(Number(e.target.value) || 0)} />
            </div>
            <div>
              <Label hint="Pre-GST, per Liter">Selling Price</Label>
              <Input type="number" step="0.01" value={effectivePrice} onChange={(e) => setSellingPrice(Number(e.target.value))} />
            </div>

            <label className="flex items-center gap-2 text-sm text-ink-600 cursor-pointer">
              <input type="checkbox" checked={gstOverride} onChange={(e) => setGstOverride(e.target.checked)} className="w-4 h-4 accent-brand-600 rounded" />
              Override GST for this product
            </label>
            {gstOverride && (
              <FormRow cols={2}>
                <div>
                  <Label hint="%">CGST</Label>
                  <Input type="number" step="0.1" value={cgst} onChange={(e) => setCgst(e.target.value)} />
                </div>
                <div>
                  <Label hint="%">SGST</Label>
                  <Input type="number" step="0.1" value={sgst} onChange={(e) => setSgst(e.target.value)} />
                </div>
              </FormRow>
            )}
          </div>
        </Card>

        <div className="lg:col-span-2 space-y-5">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <MiniStat label="Cost / Liter" value={formatCurrency(result?.costPerLiter)} />
            <MiniStat label="Selling Price" value={formatCurrency(effectivePrice)} />
            <MiniStat label="Price incl. GST" value={formatCurrency(metrics?.priceWithGst)} />
            <MiniStat label="Margin" value={pct(metrics?.marginPercent)} tone={marginTone(metrics?.marginPercent || 0)} />
          </div>

          <Card>
            <p className="text-xs font-semibold text-ink-400 uppercase tracking-wide mb-4">GST Breakdown (per Liter)</p>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="bg-ink-900/[0.03] rounded-xl py-4">
                <p className="text-xs text-ink-500 mb-1">CGST ({metrics?.cgstPercent}%)</p>
                <p className="font-mono font-semibold text-ink-900">{formatCurrency(metrics?.cgstAmount)}</p>
              </div>
              <div className="bg-ink-900/[0.03] rounded-xl py-4">
                <p className="text-xs text-ink-500 mb-1">SGST ({metrics?.sgstPercent}%)</p>
                <p className="font-mono font-semibold text-ink-900">{formatCurrency(metrics?.sgstAmount)}</p>
              </div>
              <div className="bg-brand-gradient-soft rounded-xl py-4">
                <p className="text-xs text-brand-700 mb-1">Total GST</p>
                <p className="font-mono font-semibold text-brand-700">{formatCurrency(metrics?.totalGstPerL)}</p>
              </div>
            </div>
          </Card>

          <Card>
            <p className="text-xs font-semibold text-ink-400 uppercase tracking-wide mb-1">GST Ledger — Input vs Output</p>
            <p className="text-xs text-ink-500 mb-4">
              GST paid while purchasing raw material/packaging is reclaimable Input Tax Credit — it's netted off against
              the GST you collect on sale, not treated as a cost.
            </p>
            <div className="space-y-2 text-sm mb-4">
              <div className="flex justify-between">
                <span className="text-ink-500">Input GST — Raw Material (actual)</span>
                <span className="font-mono font-medium text-ink-900">{formatCurrency(inputGstRawResult.total)}</span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-ink-500 flex items-center gap-1.5">
                  Input GST — Packaging
                  <span className="inline-flex items-center gap-1">
                    (assumed
                    <input
                      type="number"
                      min="0"
                      step="0.1"
                      value={packagingGstPercent}
                      onChange={(e) => setPackagingGstPercent(e.target.value)}
                      className="w-12 px-1 py-0.5 border border-surface-border rounded text-xs text-center"
                    />
                    %)
                  </span>
                </span>
                <span className="font-mono font-medium text-ink-900">{formatCurrency(inputGstPackagingResult.gstAmount)}</span>
              </div>
              <div className="flex justify-between border-t border-surface-border pt-2">
                <span className="font-semibold text-ink-900">Total Input GST (ITC available)</span>
                <span className="font-mono font-bold text-ink-900">{formatCurrency(gstLedger.totalInputGst)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink-500">Output GST (charged to customer)</span>
                <span className="font-mono font-medium text-ink-900">{formatCurrency(gstLedger.output)}</span>
              </div>
            </div>
            <div
              className={clsx(
                "rounded-xl p-3.5 flex justify-between items-center",
                gstLedger.isCredit ? "bg-success-50" : "bg-brand-50/60"
              )}
            >
              <span className="text-sm font-semibold text-ink-900">
                {gstLedger.isCredit ? "Net ITC Credit Carried Forward" : "Net GST Payable"}
              </span>
              <span className={clsx("font-mono font-bold text-lg", gstLedger.isCredit ? "text-success-600" : "text-ink-900")}>
                {formatCurrency(Math.abs(gstLedger.netGstPayable))}
              </span>
            </div>
          </Card>

          <Card>
            <p className="text-xs font-semibold text-ink-400 uppercase tracking-wide mb-4">
              Profitability — {batchLiters}L batch
            </p>
            <div className="grid grid-cols-2 gap-4">
              <ProfitBox
                label="Gross Profit"
                sub="Revenue − direct materials"
                perL={metrics?.grossProfitPerL}
                total={metrics?.grossProfitTotal}
                positive={metrics?.grossProfitPerL >= 0}
              />
              <ProfitBox
                label="Net Profit"
                sub="Revenue − all costs"
                perL={metrics?.netProfitPerL}
                total={metrics?.netProfitTotal}
                positive={metrics?.netProfitPerL >= 0}
              />
            </div>
            <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-surface-border">
              <div className="flex items-center justify-between">
                <span className="text-sm text-ink-500">Margin</span>
                <Badge tone={marginTone(metrics?.marginPercent || 0)}>{pct(metrics?.marginPercent)}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-ink-500">Markup</span>
                <Badge tone="brand">{pct(metrics?.markupPercent)}</Badge>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

function MiniStat({ label, value, tone }) {
  const toneClass = {
    success: "text-success-600",
    warning: "text-warning-600",
    danger: "text-danger-600",
  }[tone];
  return (
    <Card padding="p-4">
      <p className="text-xs text-ink-500 mb-1">{label}</p>
      <p className={clsx("text-lg font-bold font-display", toneClass || "text-ink-900")}>{value}</p>
    </Card>
  );
}

function ProfitBox({ label, sub, perL, total, positive }) {
  return (
    <div className={clsx("rounded-xl p-4", positive ? "bg-success-50" : "bg-danger-50")}>
      <div className="flex items-center gap-1.5 mb-1">
        {positive ? <TrendingUp size={14} className="text-success-600" /> : <TrendingDown size={14} className="text-danger-600" />}
        <p className={clsx("text-xs font-semibold", positive ? "text-success-700" : "text-danger-700")}>{label}</p>
      </div>
      <p className={clsx("text-xl font-bold font-display", positive ? "text-success-700" : "text-danger-700")}>{formatCurrency(total)}</p>
      <p className="text-[11px] text-ink-500 mt-1">{formatCurrency(perL)} / L · {sub}</p>
    </div>
  );
}