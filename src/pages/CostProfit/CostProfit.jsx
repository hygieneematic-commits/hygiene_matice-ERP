import { useState, useMemo } from "react";
import { Users, Copy, Printer, Check, ChevronDown, ChevronRight } from "lucide-react";
import PageHeader from "../../components/ui/PageHeader";
import Card from "../../components/ui/Card";
import { Select, Input, Label } from "../../components/ui/Field";
import { useProductStore } from "../../store/useProductStore";
import { useFormulaStore } from "../../store/useFormulaStore";
import { useRawMaterialStore } from "../../store/useRawMaterialStore";
import { usePackagingStore } from "../../store/usePackagingStore";
import { useSettingsStore } from "../../store/useSettingsStore";
import { calculateFullCost } from "../../utils/costEngine";
import { safeNumber } from "../../utils/batchCalcEngine";
import { formatCurrency, formatNumber } from "../../utils/formatters";
import clsx from "clsx";

/**
 * SALES SUMMARY — a salesman-facing reference card, not a costing tool.
 * -----------------------------------------------------------------------
 * This page used to be a generic "Cost & Profit" panel that duplicated what
 * the Batch Calculator already does better (raw material breakdown, custom
 * packaging, GST ledger, calculation breakdown). It had no purpose of its
 * own, so it's been replaced with something that actually serves a
 * different job: a clean, printable/copyable price card a salesperson can
 * hand to a distributor or retailer without needing to explain a costing
 * spreadsheet.
 *
 * Route/folder name (`/cost-profit`, `CostProfit/`) is kept unchanged so
 * existing role permissions in `utils/permissions.js` don't need touching.
 * -----------------------------------------------------------------------
 */
export default function CostProfit() {
  const products = useProductStore((s) => s.products);
  const { getFormula } = useFormulaStore();
  const rawMaterials = useRawMaterialStore((s) => s.rawMaterials);
  const rawMaterialsById = useMemo(() => {
    const m = {};
    rawMaterials.forEach((r) => (m[r.id] = r));
    return m;
  }, [rawMaterials]);
  const packagingItemsAll = usePackagingStore((s) => s.packagingItems);
  const packagingById = useMemo(() => {
    const m = {};
    packagingItemsAll.forEach((p) => (m[p.id] = p));
    return m;
  }, [packagingItemsAll]);
  const settings = useSettingsStore((s) => s.settings);

  const [productId, setProductId] = useState(products[0]?.id || "");
  const [batchLiters, setBatchLiters] = useState(50);
  const [showAssumptions, setShowAssumptions] = useState(false);
  const [manufacturerMargin, setManufacturerMargin] = useState("25"); // % margin the factory keeps on its ex-factory price
  const [distributorMargin, setDistributorMargin] = useState("10"); // % distributor adds over ex-factory price
  const [retailerMargin, setRetailerMargin] = useState("15"); // % retailer adds over distributor price
  const [mrpBuffer, setMrpBuffer] = useState("10"); // % headroom above retailer price for the printed MRP
  const [copied, setCopied] = useState(false);

  const product = products.find((p) => p.id === productId);
  const formula = getFormula(productId);

  const result = useMemo(() => {
    if (!product) return null;
    return calculateFullCost({ product, formula, batchLiters, rawMaterialsById, packagingById, settings });
  }, [product, formula, batchLiters, rawMaterialsById, packagingById, settings]);

  const summary = useMemo(() => {
    if (!result) return null;
    const units = safeNumber(result.packagingCost.unitsProduced);
    const costPerUnit = units > 0 ? safeNumber(result.totalCost) / units : 0;

    const mMargin = Math.min(safeNumber(manufacturerMargin), 99); // guard against /0 at 100%
    const recommendedSellingPrice = mMargin < 100 ? costPerUnit / (1 - mMargin / 100) : costPerUnit;
    const minSellingPrice = costPerUnit; // break-even — anything below this is a real loss

    const distributorPrice = recommendedSellingPrice * (1 + safeNumber(distributorMargin) / 100);
    const retailerPrice = distributorPrice * (1 + safeNumber(retailerMargin) / 100);
    const mrp = retailerPrice * (1 + safeNumber(mrpBuffer) / 100);

    const profitPerUnit = recommendedSellingPrice - costPerUnit;
    const totalBatchProfit = profitPerUnit * units;
    const profitMarginPercent = recommendedSellingPrice > 0 ? (profitPerUnit / recommendedSellingPrice) * 100 : 0;

    return {
      units,
      costPerUnit,
      recommendedSellingPrice,
      minSellingPrice,
      distributorPrice,
      retailerPrice,
      mrp,
      profitPerUnit,
      totalBatchProfit,
      profitMarginPercent,
    };
  }, [result, manufacturerMargin, distributorMargin, retailerMargin, mrpBuffer]);

  const packSizeLabel = product?.packSizeMl >= 1000 ? `${product.packSizeMl / 1000} L` : `${product?.packSizeMl || 0} ml`;

  function buildPlainTextSummary() {
    if (!product || !summary) return "";
    return [
      `SALES SUMMARY — ${product.name}`,
      `Batch Size: ${batchLiters} L   |   Packaging: ${packSizeLabel}   |   Units Produced: ${summary.units}`,
      ``,
      `Manufacturing Cost / Unit:   ${formatCurrency(summary.costPerUnit)}`,
      `Minimum Selling Price:       ${formatCurrency(summary.minSellingPrice)}  (break-even, avoid below this)`,
      `Recommended Selling Price:   ${formatCurrency(summary.recommendedSellingPrice)}  (ex-factory)`,
      ``,
      `Suggested Distributor Price: ${formatCurrency(summary.distributorPrice)}`,
      `Suggested Retailer Price:    ${formatCurrency(summary.retailerPrice)}`,
      `Suggested MRP:               ${formatCurrency(summary.mrp)}`,
      ``,
      `Expected Profit / Unit:      ${formatCurrency(summary.profitPerUnit)}`,
      `Total Batch Profit:          ${formatCurrency(summary.totalBatchProfit)}`,
      `Profit Margin:               ${formatNumber(summary.profitMarginPercent, 2)}%`,
    ].join("\n");
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(buildPlainTextSummary());
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // clipboard permission denied — silently ignore, the Print option still works
    }
  }

  function handlePrint() {
    window.print();
  }

  return (
    <div>
      <PageHeader title="Sales Summary" subtitle="A quick reference card your sales team can share with distributors and retailers" />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <Card className="lg:col-span-1 h-fit print:hidden">
          <p className="text-xs font-semibold text-ink-400 uppercase tracking-wide mb-4">Product</p>
          <div className="space-y-4">
            <div>
              <Label>Product</Label>
              <Select value={productId} onChange={(e) => setProductId(e.target.value)}>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label hint="Liters">Batch Size</Label>
              <Input type="number" min="1" step="1" value={batchLiters} onChange={(e) => setBatchLiters(Number(e.target.value) || 0)} />
            </div>
          </div>

          <button
            onClick={() => setShowAssumptions((v) => !v)}
            className="w-full flex items-center justify-between mt-6 pt-4 border-t border-surface-border text-xs font-semibold text-ink-400 uppercase tracking-wide"
          >
            Pricing Assumptions
            {showAssumptions ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </button>
          {showAssumptions && (
            <div className="space-y-3 mt-3">
              <AssumptionField label="Manufacturer margin" hint="on ex-factory price" value={manufacturerMargin} onChange={setManufacturerMargin} />
              <AssumptionField label="Distributor margin" hint="over ex-factory price" value={distributorMargin} onChange={setDistributorMargin} />
              <AssumptionField label="Retailer margin" hint="over distributor price" value={retailerMargin} onChange={setRetailerMargin} />
              <AssumptionField label="MRP buffer" hint="over retailer price" value={mrpBuffer} onChange={setMrpBuffer} />
            </div>
          )}
        </Card>

        <div className="lg:col-span-2">
          {product && summary && (
            <Card className="print:shadow-none print:border-none">
              <div className="flex items-center justify-between mb-1">
                <div>
                  <p className="text-xs font-semibold text-brand-600 uppercase tracking-wide mb-1">Sales Summary</p>
                  <h2 className="text-2xl font-bold font-display text-ink-900">{product.name}</h2>
                </div>
                <div className="flex gap-2 print:hidden">
                  <button
                    onClick={handleCopy}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-surface-border bg-white text-ink-600 hover:border-brand-300"
                  >
                    {copied ? <Check size={13} className="text-success-600" /> : <Copy size={13} />}
                    {copied ? "Copied" : "Copy Summary"}
                  </button>
                  <button
                    onClick={handlePrint}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-surface-border bg-white text-ink-600 hover:border-brand-300"
                  >
                    <Printer size={13} />
                    Print
                  </button>
                </div>
              </div>
              <p className="text-sm text-ink-500 mb-5">
                Batch {batchLiters} L &middot; Packaging {packSizeLabel} &middot; {summary.units} units produced
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-5">
                <FactCell label="Manufacturing Cost / Unit" value={formatCurrency(summary.costPerUnit)} />
                <FactCell label="Minimum Selling Price" value={formatCurrency(summary.minSellingPrice)} sub="break-even — avoid below this" tone="warning" />
                <FactCell label="Recommended Selling Price" value={formatCurrency(summary.recommendedSellingPrice)} sub="ex-factory" tone="brand" />
              </div>

              <p className="text-[11px] font-semibold text-ink-400 uppercase tracking-wide mb-2">Trade Price Chain</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
                <FactCell label="Suggested Distributor Price" value={formatCurrency(summary.distributorPrice)} />
                <FactCell label="Suggested Retailer Price" value={formatCurrency(summary.retailerPrice)} />
                <FactCell label="Suggested MRP" value={formatCurrency(summary.mrp)} tone="ink" />
              </div>

              <p className="text-[11px] font-semibold text-ink-400 uppercase tracking-wide mb-2">Profitability</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <FactCell label="Expected Profit / Unit" value={formatCurrency(summary.profitPerUnit)} tone={summary.profitPerUnit >= 0 ? "success" : "danger"} />
                <FactCell label="Total Batch Profit" value={formatCurrency(summary.totalBatchProfit)} tone={summary.totalBatchProfit >= 0 ? "success" : "danger"} />
                <FactCell label="Profit Margin" value={`${formatNumber(summary.profitMarginPercent, 2)}%`} tone={summary.profitMarginPercent >= 0 ? "success" : "danger"} />
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

function AssumptionField({ label, hint, value, onChange }) {
  return (
    <div>
      <Label hint={hint}>{label}</Label>
      <Input type="number" min="0" step="0.5" value={value} onChange={(e) => onChange(e.target.value)} className="!py-1.5 !text-sm" />
    </div>
  );
}

function FactCell({ label, value, sub, tone = "ink" }) {
  const toneClass = {
    ink: "text-ink-900",
    brand: "text-brand-700",
    success: "text-success-600",
    warning: "text-warning-600",
    danger: "text-danger-600",
  }[tone];
  const bgClass = {
    ink: "bg-ink-900/[0.02]",
    brand: "bg-brand-50/60",
    success: "bg-success-50",
    warning: "bg-warning-50",
    danger: "bg-danger-50",
  }[tone];
  return (
    <div className={clsx("rounded-xl p-3.5 border border-surface-border", bgClass)}>
      <p className="text-[11px] text-ink-500 mb-1">{label}</p>
      <p className={clsx("font-mono font-bold text-lg", toneClass)}>{value}</p>
      {sub && <p className="text-[10px] text-ink-400 mt-0.5">{sub}</p>}
    </div>
  );
}
