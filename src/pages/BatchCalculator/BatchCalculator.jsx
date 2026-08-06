import { useState, useMemo, useEffect } from "react";
import { Beaker, Columns2, PackageOpen, FlaskConical, Receipt, IndianRupee, ClipboardList } from "lucide-react";
import PageHeader from "../../components/ui/PageHeader";
import Card from "../../components/ui/Card";
import Badge from "../../components/ui/Badge";
import { Select, Input, Label } from "../../components/ui/Field";
import LiquidVisualizer from "../../components/charts/LiquidVisualizer";
import PackagingComponentBuilder from "../../components/production/PackagingComponentBuilder";
import { useProductStore } from "../../store/useProductStore";
import { useFormulaStore } from "../../store/useFormulaStore";
import { useRawMaterialStore } from "../../store/useRawMaterialStore";
import { usePackagingStore } from "../../store/usePackagingStore";
import { useSettingsStore } from "../../store/useSettingsStore";
import {
  calculateFullCost,
  calculateSellingMetrics,
  calculateComponentPlanCost,
  calculateComponentLineEconomics,
} from "../../utils/costEngine";
import { formatCurrency } from "../../utils/formatters";
import clsx from "clsx";

const PRESETS = [1, 2, 5, 10, 20, 50, 100, 200, 500, 1000];
const PACKAGING_CATEGORIES = ["Bottle", "Label", "Carton", "Tape", "Cap", "Shrink"];

export default function BatchCalculator() {
  const products = useProductStore((s) => s.products);
  const { getFormula } = useFormulaStore();
  const rawMaterials = useRawMaterialStore((s) => s.rawMaterials);
  const rawMaterialsById = useMemo(() => { const m = {}; rawMaterials.forEach((r) => (m[r.id] = r)); return m; }, [rawMaterials]);
  const packagingItemsAll = usePackagingStore((s) => s.packagingItems);
  const packagingById = useMemo(() => { const m = {}; packagingItemsAll.forEach((p) => (m[p.id] = p)); return m; }, [packagingItemsAll]);
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
  const settings = useSettingsStore((s) => s.settings);

  // ---- Step 1: Product + Step 2: Batch Size ----
  const [productId, setProductId] = useState(products[0]?.id || "");
  const [batchLiters, setBatchLiters] = useState(10);
  const [customValue, setCustomValue] = useState("");
  const [compareOn, setCompareOn] = useState(false);
  const [compareLiters, setCompareLiters] = useState(50);

  // ---- Step 4: Packaging ----
  const [packagingPlan, setPackagingPlan] = useState([]);

  // ---- Step 7: Selling Price & GST ----
  const [priceType, setPriceType] = useState("liter"); // "liter" | "package"
  const [sellingPriceInput, setSellingPriceInput] = useState("");
  const [gstMode, setGstMode] = useState("exclude");

  useEffect(() => {
    setPackagingPlan([]);
  }, [productId]);

  const product = products.find((p) => p.id === productId);
  const formula = getFormula(productId);

  useEffect(() => {
    setSellingPriceInput(String(product?.sellingPricePerL ?? ""));
    setPriceType("liter");
  }, [productId]); // eslint-disable-line react-hooks/exhaustive-deps

  // ---- Step 4/5: Packaging plan cost (single source of truth, feeds costing below) ----
  const planCost = useMemo(() => calculateComponentPlanCost(packagingPlan, packagingById), [packagingPlan, packagingById]);
  const packagingOverride = planCost.breakdown.length > 0 ? planCost : undefined;
  const primaryLine = planCost.breakdown[0] || null;
  const primaryPackCapacityL = (primaryLine?.bottle?.capacityMl || 0) / 1000;

  // Selling price is entered either per Liter or per selected Package — both
  // resolve to a single per-Liter figure that drives every downstream number.
  const effectiveSellingPricePerL = useMemo(() => {
    const raw = Number(sellingPriceInput) || 0;
    if (priceType === "package" && primaryPackCapacityL > 0) return raw / primaryPackCapacityL;
    return raw;
  }, [sellingPriceInput, priceType, primaryPackCapacityL]);

  // ---- Step 3: Formula & Raw Material Cost + Step 6: Final Production Cost ----
  const result = useMemo(() => {
    if (!product) return null;
    return calculateFullCost({ product, formula, batchLiters, rawMaterialsById, packagingById, settings, packagingOverride });
  }, [product, formula, batchLiters, rawMaterialsById, packagingById, settings, packagingOverride]);

  const compareResult = useMemo(() => {
    if (!product || !compareOn) return null;
    return calculateFullCost({ product, formula, batchLiters: compareLiters, rawMaterialsById, packagingById, settings });
  }, [product, formula, compareLiters, compareOn, rawMaterialsById, packagingById, settings]);

  // ---- Step 7: Profit / Margin / Markup / GST ----
  const metrics = useMemo(() => {
    if (!result || !product) return null;
    return calculateSellingMetrics({
      sellingPricePerL: effectiveSellingPricePerL,
      costPerLiter: result.costPerLiter,
      directCostPerLiter: result.directCostPerLiter,
      batchLiters,
      settings,
      gstMode,
    });
  }, [result, product, batchLiters, settings, effectiveSellingPricePerL, gstMode]);

  const costPerLiterExclPackaging = useMemo(() => {
    if (!result || !batchLiters) return 0;
    return (result.rawMaterialCost.total + result.overhead.total) / batchLiters;
  }, [result, batchLiters]);

  const packLineEconomics = useMemo(() => {
    return planCost.breakdown.map((line) => ({
      line,
      econ: calculateComponentLineEconomics({ line, costPerLiterExclPackaging, sellingPricePerL: metrics?.netSellingPricePerL || 0 }),
    }));
  }, [planCost, costPerLiterExclPackaging, metrics]);

  const totalUnitsProduced = planCost.breakdown.reduce((s, l) => s + l.units, 0);

  function handlePreset(val) {
    setBatchLiters(val);
    setCustomValue("");
  }

  function handleCustom(e) {
    const v = e.target.value;
    setCustomValue(v);
    const n = Number(v);
    if (n > 0) setBatchLiters(n);
  }

  return (
    <div>
      <PageHeader title="Batch Calculator" subtitle="Product → Batch Size → Formula → Packaging → Cost → Selling Price — one simple flow" />

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        {/* Main flow */}
        <div className="xl:col-span-2 space-y-5">
          {/* Step 1 & 2 */}
          <Card>
            <SectionLabel n={1} title="Select Product & Batch Size" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
              <div>
                <Label>Product</Label>
                <Select value={productId} onChange={(e) => setProductId(e.target.value)}>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </Select>
              </div>
              <div>
                <Label hint="Liters">Custom Quantity</Label>
                <Input type="number" min="0.1" step="0.1" placeholder="e.g. 37" value={customValue} onChange={handleCustom} />
              </div>
            </div>

            <div className="flex flex-wrap gap-2 mb-2">
              {PRESETS.map((val) => (
                <button
                  key={val}
                  onClick={() => handlePreset(val)}
                  className={clsx(
                    "px-4 py-2 rounded-xl text-sm font-medium border transition-all",
                    batchLiters === val && !customValue
                      ? "bg-brand-gradient text-white border-transparent shadow-soft"
                      : "bg-white text-ink-600 border-surface-border hover:border-brand-300"
                  )}
                >
                  {val}L
                </button>
              ))}
              <button
                onClick={() => setCompareOn((v) => !v)}
                className={clsx(
                  "px-4 py-2 rounded-xl text-sm font-medium border transition-all inline-flex items-center gap-1.5 ml-auto",
                  compareOn ? "bg-aqua-50 text-aqua-700 border-aqua-200" : "bg-white text-ink-500 border-surface-border hover:border-aqua-300"
                )}
              >
                <Columns2 size={14} /> Compare
              </button>
            </div>
          </Card>

          {compareOn && (
            <Card className="!border-aqua-200 bg-aqua-50/30">
              <div className="flex items-center gap-3 flex-wrap">
                <Label className="!mb-0">Compare against</Label>
                <div className="flex gap-2 flex-wrap">
                  {PRESETS.map((val) => (
                    <button
                      key={val}
                      onClick={() => setCompareLiters(val)}
                      className={clsx(
                        "px-3.5 py-1.5 rounded-lg text-sm font-medium border transition-all",
                        compareLiters === val ? "bg-aqua-600 text-white border-transparent" : "bg-white text-ink-600 border-surface-border"
                      )}
                    >
                      {val}L
                    </button>
                  ))}
                </div>
              </div>
            </Card>
          )}

          {/* Step 3 */}
          <Card padding="p-0">
            <div className="px-5 py-4 border-b border-surface-border flex items-center justify-between">
              <div>
                <SectionLabel n={2} title="Formula & Raw Material Cost" icon={FlaskConical} noMargin />
                <p className="text-xs text-ink-400 mt-0.5">Scaled for {batchLiters}L — updates instantly</p>
              </div>
              <Badge tone="brand">{result?.rawMaterialCost.breakdown.length || 0} items</Badge>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse min-w-[520px]">
                <thead>
                  <tr className="border-b border-surface-border bg-ink-900/[0.015]">
                    <th className="text-left text-[11px] font-semibold text-ink-400 uppercase tracking-wide px-5 py-2.5">Raw Material</th>
                    <th className="text-right text-[11px] font-semibold text-ink-400 uppercase tracking-wide px-3 py-2.5">Required Qty</th>
                    <th className="text-right text-[11px] font-semibold text-ink-400 uppercase tracking-wide px-3 py-2.5">Rate</th>
                    <th className="text-right text-[11px] font-semibold text-ink-400 uppercase tracking-wide px-5 py-2.5">Total Cost</th>
                  </tr>
                </thead>
                <tbody>
                  {result?.rawMaterialCost.breakdown.map((ing) => (
                    <tr key={ing.id} className="border-b border-surface-border last:border-0">
                      <td className="px-5 py-3 text-sm text-ink-700">{ing.rawMaterialName}</td>
                      <td className="px-3 py-3 text-sm text-right font-mono text-ink-900">{ing.displayValue} {ing.displayUnit}</td>
                      <td className="px-3 py-3 text-sm text-right font-mono text-ink-500">{formatCurrency(ing.price)}/{ing.type === "weight" ? "Kg" : "L"}</td>
                      <td className="px-5 py-3 text-sm text-right font-mono font-semibold text-ink-900">{formatCurrency(ing.cost)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex items-center justify-between px-5 py-3.5 bg-ink-900/[0.02] border-t border-surface-border">
              <span className="text-sm font-semibold text-ink-900">Total Raw Material Cost</span>
              <span className="text-sm font-mono font-bold text-ink-900">{formatCurrency(result?.rawMaterialCost.total)}</span>
            </div>
          </Card>

          {/* Step 4 & 5 */}
          <Card padding="p-0">
            <div className="px-5 py-4 border-b border-surface-border flex items-center justify-between">
              <div>
                <SectionLabel n={3} title="Select Packaging" icon={PackageOpen} noMargin />
                <p className="text-xs text-ink-400 mt-0.5">Bottle → Sticker → Carton → Tape → Cap → Shrink — pick only what this batch actually uses</p>
              </div>
              <Badge tone="brand">{packagingByCategory.Bottle.length} bottle types</Badge>
            </div>
            <div className="p-5">
              <PackagingComponentBuilder
                lines={packagingPlan}
                onChange={setPackagingPlan}
                packagingByCategory={packagingByCategory}
                batchLiters={batchLiters}
                planCost={planCost}
              />

              {packLineEconomics.length > 0 && (
                <div className="mt-5 overflow-x-auto -mx-2 px-2">
                  <table className="w-full border-collapse min-w-[560px]">
                    <thead>
                      <tr className="border-b border-surface-border">
                        <th className="text-left text-xs font-semibold text-ink-400 uppercase tracking-wide px-3 py-2">Pack</th>
                        <th className="text-right text-xs font-semibold text-ink-400 uppercase tracking-wide px-3 py-2">Qty</th>
                        <th className="text-right text-xs font-semibold text-ink-400 uppercase tracking-wide px-3 py-2">Cost / Unit</th>
                        <th className="text-right text-xs font-semibold text-ink-400 uppercase tracking-wide px-3 py-2">Selling / Unit</th>
                        <th className="text-right text-xs font-semibold text-ink-400 uppercase tracking-wide px-3 py-2">Profit</th>
                        <th className="text-right text-xs font-semibold text-ink-400 uppercase tracking-wide px-3 py-2">Margin</th>
                      </tr>
                    </thead>
                    <tbody>
                      {packLineEconomics.map(({ line, econ }) => (
                        <tr key={line.id} className="border-b border-surface-border last:border-0">
                          <td className="px-3 py-3 text-sm text-ink-700">{line.bottle.name}</td>
                          <td className="px-3 py-3 text-sm text-right font-mono">{line.units}</td>
                          <td className="px-3 py-3 text-sm text-right font-mono font-semibold text-ink-900">{formatCurrency(econ.costPerUnit)}</td>
                          <td className="px-3 py-3 text-sm text-right font-mono">{formatCurrency(econ.sellingPerUnit)}</td>
                          <td className={clsx("px-3 py-3 text-sm text-right font-mono font-semibold", econ.profitPerUnit >= 0 ? "text-success-600" : "text-danger-600")}>
                            {formatCurrency(econ.profitPerUnit)}
                          </td>
                          <td className="px-3 py-3 text-sm text-right font-mono">{econ.marginPercent}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </Card>

          {/* Step 6 */}
          <Card padding="p-0">
            <div className="px-5 py-4 border-b border-surface-border">
              <SectionLabel n={4} title="Final Production Cost" icon={Receipt} noMargin />
            </div>
            <div className="p-5 space-y-2.5 text-sm">
              <Row label="Raw material cost" value={result?.rawMaterialCost.total} />
              <Row label="Packaging cost" value={result?.packagingCost.total} />
              <Row label="Labour" value={result?.overhead.labour} />
              <Row label="Electricity" value={result?.overhead.electricity} />
              <Row label="Transport" value={result?.overhead.transport} />
              <Row label="Misc." value={result?.overhead.misc} />
              <div className="border-t border-surface-border !mt-3.5 pt-3.5 flex justify-between">
                <span className="text-sm font-semibold text-ink-900">Total Batch Cost</span>
                <span className="text-sm font-mono font-bold text-ink-900">{formatCurrency(result?.totalCost)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink-500">Cost Per Liter</span>
                <span className="font-mono font-semibold text-ink-900">{formatCurrency(result?.costPerLiter)}</span>
              </div>
              {totalUnitsProduced > 0 && (
                <div className="flex justify-between">
                  <span className="text-ink-500">{totalUnitsProduced} unit{totalUnitsProduced !== 1 ? "s" : ""} produced · Cost Per Package</span>
                  <span className="font-mono font-semibold text-ink-900">
                    {primaryLine ? formatCurrency(planCost.totalCost / totalUnitsProduced) : "—"}
                  </span>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Visualizer + Step 7 & 8 */}
        <div className="space-y-5">
          <Card>
            <div className="flex items-center gap-2 mb-3">
              <Beaker size={16} className="text-brand-600" />
              <p className="text-sm font-semibold text-ink-900">Formula Composition</p>
            </div>
            {result && <LiquidVisualizer ingredients={result.scaledIngredients} batchLiters={batchLiters} />}
          </Card>

          {/* Step 7 */}
          <Card>
            <SectionLabel n={5} title="Selling Price & GST" icon={IndianRupee} />
            <div className="flex gap-2 mb-3">
              <button
                onClick={() => setPriceType("liter")}
                className={clsx("flex-1 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors", priceType === "liter" ? "bg-brand-gradient text-white border-transparent" : "bg-white text-ink-600 border-surface-border")}
              >
                Price Per Liter
              </button>
              <button
                onClick={() => setPriceType("package")}
                disabled={!primaryLine}
                className={clsx(
                  "flex-1 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors",
                  priceType === "package" ? "bg-brand-gradient text-white border-transparent" : "bg-white text-ink-600 border-surface-border",
                  !primaryLine && "opacity-40 cursor-not-allowed"
                )}
                title={!primaryLine ? "Select packaging above first" : ""}
              >
                Price Per Package{primaryLine ? ` (${primaryLine.bottle.name})` : ""}
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div>
                <Label hint={priceType === "package" ? "₹ / package" : "₹ / Liter"}>Selling Price</Label>
                <Input type="number" step="0.01" value={sellingPriceInput} onChange={(e) => setSellingPriceInput(e.target.value)} placeholder="e.g. 120" />
              </div>
              <div>
                <Label>GST Mode</Label>
                <Select value={gstMode} onChange={(e) => setGstMode(e.target.value)}>
                  <option value="exclude">Exclude GST (price is before tax)</option>
                  <option value="include">Include GST (price already has tax)</option>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
              <Metric label="Net Selling Price /L" value={formatCurrency(metrics?.netSellingPricePerL)} />
              <Metric label="Price with GST /L" value={formatCurrency(metrics?.priceWithGst)} />
              <Metric label={`GST (${(metrics?.cgstPercent || 0) + (metrics?.sgstPercent || 0)}%) /L`} value={formatCurrency(metrics?.totalGstPerL)} />
              <Metric label="Net Profit /L" value={formatCurrency(metrics?.netProfitPerL)} tone={metrics?.netProfitPerL >= 0 ? "success" : "danger"} />
              <Metric label="Margin / Markup" value={`${metrics?.marginPercent || 0}% / ${metrics?.markupPercent || 0}%`} />
              <Metric label="Total Batch Profit" value={formatCurrency(metrics?.netProfitTotal)} tone={metrics?.netProfitTotal >= 0 ? "success" : "danger"} />
            </div>
          </Card>

          {/* Step 8 */}
          <Card className="bg-brand-gradient text-white !border-transparent">
            <div className="flex items-center gap-2 mb-1">
              <ClipboardList size={15} className="text-white/80" />
              <p className="text-xs text-white/70">Result Summary</p>
            </div>
            <p className="text-3xl font-bold font-display mb-4">{formatCurrency(result?.costPerLiter)} <span className="text-sm font-normal text-white/70">/ Liter</span></p>
            <div className="grid grid-cols-2 gap-x-3 gap-y-3 text-sm border-t border-white/20 pt-4">
              <SummaryStat label="Batch Size" value={`${batchLiters} L`} />
              <SummaryStat label="Total Cost" value={formatCurrency(result?.totalCost)} />
              <SummaryStat label="Selling Price (net)" value={formatCurrency(metrics?.netSellingPricePerL)} />
              <SummaryStat label="Net Margin" value={`${metrics?.marginPercent || 0}%`} />
              <SummaryStat label="Markup" value={`${metrics?.markupPercent || 0}%`} />
              <SummaryStat label="GST /L" value={formatCurrency(metrics?.totalGstPerL)} />
              <SummaryStat label="Total Batch Profit" value={formatCurrency(metrics?.netProfitTotal)} highlight />
            </div>
          </Card>

          {compareOn && compareResult && (
            <Card className="!border-aqua-200">
              <p className="text-xs font-semibold text-aqua-700 uppercase tracking-wide mb-3">
                {batchLiters}L vs {compareLiters}L
              </p>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-ink-500">Total cost</span><span className="font-mono">{formatCurrency(result?.totalCost)} → {formatCurrency(compareResult.totalCost)}</span></div>
                <div className="flex justify-between"><span className="text-ink-500">Cost / Liter</span><span className="font-mono">{formatCurrency(result?.costPerLiter)} → {formatCurrency(compareResult.costPerLiter)}</span></div>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

function SectionLabel({ n, title, icon: Icon, noMargin }) {
  return (
    <p className={clsx("text-sm font-semibold text-ink-900 flex items-center gap-2", !noMargin && "mb-4")}>
      <span className="w-5 h-5 rounded-full bg-brand-gradient text-white text-[11px] font-bold flex items-center justify-center shrink-0">{n}</span>
      {Icon && <Icon size={15} className="text-brand-600" />}
      {title}
    </p>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex justify-between">
      <span className="text-ink-500">{label}</span>
      <span className="font-mono font-medium text-ink-900">{formatCurrency(value)}</span>
    </div>
  );
}

function Metric({ label, value, tone }) {
  return (
    <div className="bg-ink-900/[0.02] border border-surface-border rounded-xl px-3 py-2.5">
      <p className="text-[11px] text-ink-400 mb-0.5">{label}</p>
      <p className={clsx("font-mono font-semibold text-sm", tone === "success" ? "text-success-600" : tone === "danger" ? "text-danger-600" : "text-ink-900")}>
        {value}
      </p>
    </div>
  );
}

function SummaryStat({ label, value, highlight }) {
  return (
    <div className={clsx(highlight && "col-span-2 border-t border-white/20 pt-3")}>
      <p className="text-white/60 text-xs mb-0.5">{label}</p>
      <p className={clsx("font-mono font-semibold", highlight ? "text-lg" : "text-sm")}>{value}</p>
    </div>
  );
}
