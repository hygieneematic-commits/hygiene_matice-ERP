import { useMemo, useState } from "react";
import { FileBarChart, Download, FileSpreadsheet } from "lucide-react";
import PageHeader from "../../components/ui/PageHeader";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import EmptyState from "../../components/ui/EmptyState";
import DataTable from "../../components/ui/DataTable";
import { useProductionStore } from "../../store/useProductionStore";
import { useProductStore } from "../../store/useProductStore";
import { useFormulaStore } from "../../store/useFormulaStore";
import { useRawMaterialStore } from "../../store/useRawMaterialStore";
import { usePackagingStore } from "../../store/usePackagingStore";
import { useSettingsStore } from "../../store/useSettingsStore";
import { calculateFullCost, calculateSellingMetrics, calculateComponentPlanCost, scaleFormula, humanizeQuantity } from "../../utils/costEngine";
import { formatCurrency, formatDate, pct } from "../../utils/formatters";
import { exportTableToPDF } from "../../utils/pdfExport";
import { exportTableToExcel } from "../../utils/excelExport";
import clsx from "clsx";

const TABS = ["Daily Production", "Monthly Production", "Raw Material Consumption", "Profit Reports"];

export default function Reports() {
  const [tab, setTab] = useState(TABS[0]);
  const batches = useProductionStore((s) => s.batches);
  const products = useProductStore((s) => s.products);
  const { getFormula } = useFormulaStore();
  const rawMaterials = useRawMaterialStore((s) => s.rawMaterials);
  const rawMaterialsById = useMemo(() => { const m = {}; rawMaterials.forEach((r) => (m[r.id] = r)); return m; }, [rawMaterials]);
  const packagingItemsAll = usePackagingStore((s) => s.packagingItems);
  const packagingById = useMemo(() => { const m = {}; packagingItemsAll.forEach((p) => (m[p.id] = p)); return m; }, [packagingItemsAll]);
  const settings = useSettingsStore((s) => s.settings);

  const completed = useMemo(() => batches.filter((b) => b.status === "completed"), [batches]);
  const productName = (id) => products.find((p) => p.id === id)?.name || "Unknown";

  // Daily Production
  const dailyRows = useMemo(
    () =>
      completed
        .map((b) => [formatDate(b.date), productName(b.productId), b.batchNumber, `${b.quantityL} L`, b.operator, `${b.yieldPercent}%`])
        .sort((a, b2) => (a[0] < b2[0] ? 1 : -1)),
    [completed]
  );

  // Monthly Production — grouped by month + product
  const monthlyRows = useMemo(() => {
    const map = {};
    completed.forEach((b) => {
      const month = new Date(b.date).toLocaleDateString("en-IN", { month: "short", year: "numeric" });
      const key = `${month}__${b.productId}`;
      if (!map[key]) map[key] = { month, product: productName(b.productId), total: 0, batches: 0 };
      map[key].total += b.quantityL;
      map[key].batches += 1;
    });
    return Object.values(map).map((r) => [r.month, r.product, r.batches, `${r.total.toFixed(1)} L`]);
  }, [completed]);

  // Raw Material Consumption
  const consumptionRows = useMemo(() => {
    const totals = {};
    completed.forEach((b) => {
      const formula = getFormula(b.productId);
      const scaled = scaleFormula(formula.ingredients, b.quantityL, rawMaterialsById);
      scaled.forEach((ing) => {
        totals[ing.rawMaterialId] = (totals[ing.rawMaterialId] || 0) + ing.scaledBaseQty;
      });
    });
    return Object.entries(totals).map(([id, baseQty]) => {
      const rm = rawMaterialsById[id];
      const type = rm?.unitType || "volume";
      const display = humanizeQuantity(baseQty, type);
      return [rm?.name || "Unknown", `${display.value} ${display.unit}`, formatCurrency((baseQty / 1000) * (rm?.price || 0))];
    });
  }, [completed, rawMaterialsById, getFormula]);

  // Profit Reports
  const profitRows = useMemo(() => {
    return completed.map((b) => {
      const product = products.find((p) => p.id === b.productId);
      const formula = getFormula(b.productId);
      if (!product) return [b.batchNumber, "Unknown", `${b.quantityL} L`, "—", "—", "—"];
      const componentPlan = calculateComponentPlanCost(b.packagingPlan, packagingById);
      const packagingOverride = componentPlan.breakdown.length > 0 ? componentPlan : undefined;
      const cost = calculateFullCost({ product, formula, batchLiters: b.quantityL, rawMaterialsById, packagingById, settings, packagingOverride });
      const metrics = calculateSellingMetrics({
        sellingPricePerL: product.sellingPricePerL,
        costPerLiter: cost.costPerLiter,
        directCostPerLiter: cost.directCostPerLiter,
        batchLiters: b.quantityL,
        settings,
      });
      return [
        b.batchNumber,
        product.name,
        `${b.quantityL} L`,
        formatCurrency(cost.totalCost),
        formatCurrency(metrics.netProfitTotal),
        pct(metrics.marginPercent),
      ];
    });
  }, [completed, products, rawMaterialsById, packagingById, settings, getFormula]);

  const config = {
    "Daily Production": {
      columns: ["Date", "Product", "Batch #", "Quantity", "Operator", "Yield"],
      rows: dailyRows,
    },
    "Monthly Production": {
      columns: ["Month", "Product", "Batches", "Total Volume"],
      rows: monthlyRows,
    },
    "Raw Material Consumption": {
      columns: ["Material", "Total Consumed", "Total Cost"],
      rows: consumptionRows,
    },
    "Profit Reports": {
      columns: ["Batch #", "Product", "Quantity", "Total Cost", "Net Profit", "Margin"],
      rows: profitRows,
    },
  }[tab];

  const tableColumns = config.columns.map((c, i) => ({ key: `c${i}`, header: c, align: i > 1 ? "right" : "left" }));
  const tableData = config.rows.map((r, idx) => {
    const obj = { id: idx };
    r.forEach((val, i) => (obj[`c${i}`] = val));
    return obj;
  });

  function handlePDF() {
    exportTableToPDF({
      title: `Hygiene Matic — ${tab}`,
      subtitle: `Generated ${formatDate(new Date().toISOString())}`,
      columns: config.columns,
      rows: config.rows,
      filename: tab.toLowerCase().replace(/\s+/g, "-"),
    });
  }

  function handleExcel() {
    exportTableToExcel({
      sheetName: tab.slice(0, 30),
      columns: config.columns,
      rows: config.rows,
      filename: tab.toLowerCase().replace(/\s+/g, "-"),
    });
  }

  return (
    <div>
      <PageHeader
        title="Reports"
        subtitle="Production, consumption, and profit — exportable as PDF or Excel"
        actions={
          <>
            <Button variant="secondary" onClick={handleExcel}><FileSpreadsheet size={16} /> Excel</Button>
            <Button onClick={handlePDF}><Download size={16} /> PDF</Button>
          </>
        }
      />

      <div className="flex gap-2 mb-5 flex-wrap">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={clsx(
              "px-4 py-2 rounded-xl text-sm font-medium transition-colors",
              tab === t ? "bg-brand-gradient text-white shadow-soft" : "bg-white border border-surface-border text-ink-600"
            )}
          >
            {t}
          </button>
        ))}
      </div>

      <Card padding="p-5">
        <DataTable
          columns={tableColumns}
          data={tableData}
          keyField="id"
          emptyState={<EmptyState icon={FileBarChart} title="No data yet" description="Complete a production batch to see this report populate." />}
        />
      </Card>
    </div>
  );
}