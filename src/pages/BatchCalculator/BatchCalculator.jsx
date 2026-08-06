import { useState, useMemo, useEffect } from "react";
import { Beaker, Columns2, PackageOpen } from "lucide-react";
import PageHeader from "../../components/ui/PageHeader";
import Card from "../../components/ui/Card";
import Badge from "../../components/ui/Badge";
import { Select, Input, Label } from "../../components/ui/Field";
import LiquidVisualizer from "../../components/charts/LiquidVisualizer";
import PackagingPlanBuilder from "../../components/production/PackagingPlanBuilder";
import { useProductStore } from "../../store/useProductStore";
import { useFormulaStore } from "../../store/useFormulaStore";
import { useRawMaterialStore } from "../../store/useRawMaterialStore";
import { usePackagingStore } from "../../store/usePackagingStore";
import { usePackagingKitStore } from "../../store/usePackagingKitStore";
import { useSettingsStore } from "../../store/useSettingsStore";
import {
  calculateFullCost,
  calculateSellingMetrics,
  calculatePackagingPlanCost,
  calculatePackLineEconomics,
} from "../../utils/costEngine";
import { formatCurrency } from "../../utils/formatters";
import clsx from "clsx";

const PRESETS = [5, 10, 20, 50, 100, 200, 500, 1000];

export default function BatchCalculator() {
  const products = useProductStore((s) => s.products);
  const { getFormula } = useFormulaStore();
  const rawMaterials = useRawMaterialStore((s) => s.rawMaterials);
  const rawMaterialsById = useMemo(() => { const m = {}; rawMaterials.forEach((r) => (m[r.id] = r)); return m; }, [rawMaterials]);
  const packagingItemsAll = usePackagingStore((s) => s.packagingItems);
  const packagingById = useMemo(() => { const m = {}; packagingItemsAll.forEach((p) => (m[p.id] = p)); return m; }, [packagingItemsAll]);
  const settings = useSettingsStore((s) => s.settings);
  const packagingKits = usePackagingKitStore((s) => s.packagingKits);
  const kitsById = usePackagingKitStore((s) => s.getByIdMap());

  const [productId, setProductId] = useState(products[0]?.id || "");
  const [batchLiters, setBatchLiters] = useState(10);
  const [customValue, setCustomValue] = useState("");
  const [compareOn, setCompareOn] = useState(false);
  const [compareLiters, setCompareLiters] = useState(50);
  const [packagingPlan, setPackagingPlan] = useState([]);

  // Reset the packaging split whenever the product changes (different products
  // are usually packed differently) — batch size changes keep the same plan.
  useEffect(() => {
    setPackagingPlan([]);
  }, [productId]);

  const product = products.find((p) => p.id === productId);
  const formula = getFormula(productId);

  const result = useMemo(() => {
    if (!product) return null;
    return calculateFullCost({ product, formula, batchLiters, rawMaterialsById, packagingById, settings });
  }, [product, formula, batchLiters, rawMaterialsById, packagingById, settings]);

  const compareResult = useMemo(() => {
    if (!product || !compareOn) return null;
    return calculateFullCost({ product, formula, batchLiters: compareLiters, rawMaterialsById, packagingById, settings });
  }, [product, formula, compareLiters, compareOn, rawMaterialsById, packagingById, settings]);

  const metrics = useMemo(() => {
    if (!result || !product) return null;
    return calculateSellingMetrics({
      sellingPricePerL: product.sellingPricePerL,
      costPerLiter: result.costPerLiter,
      directCostPerLiter: result.directCostPerLiter,
      batchLiters,
      settings,
    });
  }, [result, product, batchLiters, settings]);

  const planCost = useMemo(() => calculatePackagingPlanCost(packagingPlan, kitsById), [packagingPlan, kitsById]);

  const costPerLiterExclPackaging = useMemo(() => {
    if (!result || !batchLiters) return 0;
    return (result.rawMaterialCost.total + result.overhead.total) / batchLiters;
  }, [result, batchLiters]);

  const packLineEconomics = useMemo(() => {
    return planCost.breakdown.map((line) => ({
      line,
      econ: calculatePackLineEconomics({ line, costPerLiterExclPackaging, sellingPricePerL: product?.sellingPricePerL || 0 }),
    }));
  }, [planCost, costPerLiterExclPackaging, product]);

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
      <PageHeader title="Batch Calculator" subtitle="Select a product and batch size — every ingredient and cost updates live" />

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        {/* Controls + ingredient list */}
        <div className="xl:col-span-2 space-y-5">
          <Card>
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

          <Card padding="p-0">
            <div className="px-5 py-4 border-b border-surface-border flex items-center justify-between">
              <p className="text-sm font-semibold text-ink-900">
                Scaled Ingredients <span className="text-ink-400 font-normal">for {batchLiters}L</span>
              </p>
              <Badge tone="brand">{result?.scaledIngredients.length || 0} items</Badge>
            </div>
            <div className="divide-y divide-surface-border">
              {result?.scaledIngredients.map((ing) => (
                <div key={ing.id} className="flex items-center justify-between px-5 py-3.5">
                  <span className="text-sm text-ink-700">{ing.rawMaterialName}</span>
                  <span className="text-sm font-mono font-semibold text-ink-900">
                    {ing.displayValue} {ing.displayUnit}
                  </span>
                </div>
              ))}
            </div>
          </Card>

          <Card padding="p-0">
            <div className="px-5 py-4 border-b border-surface-border flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-ink-900 flex items-center gap-2">
                  <PackageOpen size={15} className="text-brand-600" /> Packaging Plan
                </p>
                <p className="text-xs text-ink-400 mt-0.5">Split this batch across one or more packaging sizes</p>
              </div>
              <Badge tone="brand">{packagingKits.length} types available</Badge>
            </div>
            <div className="p-5">
              <PackagingPlanBuilder
                planLines={packagingPlan}
                onChange={setPackagingPlan}
                kits={packagingKits}
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
                          <td className="px-3 py-3 text-sm text-ink-700">{line.kit.name}</td>
                          <td className="px-3 py-3 text-sm text-right font-mono">{line.qty}</td>
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
        </div>

        {/* Visualizer + cost summary */}
        <div className="space-y-5">
          <Card>
            <div className="flex items-center gap-2 mb-3">
              <Beaker size={16} className="text-brand-600" />
              <p className="text-sm font-semibold text-ink-900">Formula Composition</p>
            </div>
            {result && <LiquidVisualizer ingredients={result.scaledIngredients} batchLiters={batchLiters} />}
          </Card>

          <Card>
            <p className="text-xs font-semibold text-ink-400 uppercase tracking-wide mb-4">Cost Breakdown</p>
            <div className="space-y-2.5 text-sm">
              <Row label="Raw materials" value={result?.rawMaterialCost.total} />
              <Row label="Packaging (product default)" value={result?.packagingCost.total} />
              {planCost.breakdown.length > 0 && (
                <Row label="Packaging (custom split, above)" value={planCost.totalCost} />
              )}
              <Row label="Labour" value={result?.overhead.labour} />
              <Row label="Electricity" value={result?.overhead.electricity} />
              <Row label="Transport" value={result?.overhead.transport} />
              <Row label="Misc" value={result?.overhead.misc} />
            </div>
            <div className="border-t border-surface-border mt-3 pt-3 flex justify-between">
              <span className="text-sm font-semibold text-ink-900">Total Cost</span>
              <span className="text-sm font-mono font-bold text-ink-900">{formatCurrency(result?.totalCost)}</span>
            </div>
          </Card>

          <Card className="bg-brand-gradient text-white !border-transparent">
            <p className="text-xs text-white/70 mb-1">Cost per Liter</p>
            <p className="text-3xl font-bold font-display mb-4">{formatCurrency(result?.costPerLiter)}</p>
            <div className="grid grid-cols-2 gap-3 text-sm border-t border-white/20 pt-4">
              <div>
                <p className="text-white/60 text-xs mb-0.5">Selling Price</p>
                <p className="font-mono font-semibold">{formatCurrency(product?.sellingPricePerL)}</p>
              </div>
              <div>
                <p className="text-white/60 text-xs mb-0.5">Net Margin</p>
                <p className="font-mono font-semibold">{metrics?.marginPercent}%</p>
              </div>
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

function Row({ label, value }) {
  return (
    <div className="flex justify-between">
      <span className="text-ink-500">{label}</span>
      <span className="font-mono font-medium text-ink-900">{formatCurrency(value)}</span>
    </div>
  );
}