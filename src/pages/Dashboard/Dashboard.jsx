import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { isSameDay, subDays, format } from "date-fns";
import {
  Factory, IndianRupee, TrendingUp, Wallet, Clock, AlertTriangle,
  Trophy, Plus, Calculator, FileBarChart, ArrowRight,
} from "lucide-react";
import PageHeader from "../../components/ui/PageHeader";
import Card from "../../components/ui/Card";
import StatCard from "../../components/ui/StatCard";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import EmptyState from "../../components/ui/EmptyState";
import MonthlyProfitChart from "../../components/charts/MonthlyProfitChart";
import { useProductionStore } from "../../store/useProductionStore";
import { useProductStore } from "../../store/useProductStore";
import { useFormulaStore } from "../../store/useFormulaStore";
import { useRawMaterialStore } from "../../store/useRawMaterialStore";
import { usePackagingStore } from "../../store/usePackagingStore";
import { useSettingsStore } from "../../store/useSettingsStore";
import { calculateFullCost, calculateSellingMetrics } from "../../utils/costEngine";
import { formatCurrency, timeAgo } from "../../utils/formatters";

export default function Dashboard() {
  const navigate = useNavigate();
  const batches = useProductionStore((s) => s.batches);
  const products = useProductStore((s) => s.products);
  const { getFormula } = useFormulaStore();
  const rawMaterials = useRawMaterialStore((s) => s.rawMaterials);
  const packagingItems = usePackagingStore((s) => s.packagingItems);
  const settings = useSettingsStore((s) => s.settings);

  const rawMaterialsById = useMemo(() => {
    const map = {};
    rawMaterials.forEach((r) => (map[r.id] = r));
    return map;
  }, [rawMaterials]);
  const packagingById = useMemo(() => {
    const map = {};
    packagingItems.forEach((p) => (map[p.id] = p));
    return map;
  }, [packagingItems]);
  const lowRawMaterials = useMemo(() => rawMaterials.filter((r) => r.stock <= r.minStock), [rawMaterials]);
  const lowPackaging = useMemo(() => packagingItems.filter((p) => p.stock <= p.minStock), [packagingItems]);

  const completed = useMemo(() => batches.filter((b) => b.status === "completed"), [batches]);
  const productName = (id) => products.find((p) => p.id === id)?.name || "Unknown";

  function batchEconomics(batch) {
    const product = products.find((p) => p.id === batch.productId);
    if (!product) return { cost: 0, sales: 0, profit: 0 };
    const formula = getFormula(batch.productId);
    const cost = calculateFullCost({ product, formula, batchLiters: batch.quantityL, rawMaterialsById, packagingById, settings });
    const metrics = calculateSellingMetrics({
      sellingPricePerL: product.sellingPricePerL,
      costPerLiter: cost.costPerLiter,
      directCostPerLiter: cost.directCostPerLiter,
      batchLiters: batch.quantityL,
      settings,
    });
    return { cost: cost.totalCost, sales: product.sellingPricePerL * batch.quantityL, profit: metrics.netProfitTotal };
  }

  const today = new Date();
  const yesterday = subDays(today, 1);

  const todayBatches = completed.filter((b) => isSameDay(new Date(b.date), today));
  const yesterdayBatches = completed.filter((b) => isSameDay(new Date(b.date), yesterday));

  function aggregate(list) {
    return list.reduce(
      (acc, b) => {
        const econ = batchEconomics(b);
        acc.production += b.quantityL;
        acc.cost += econ.cost;
        acc.sales += econ.sales;
        acc.profit += econ.profit;
        return acc;
      },
      { production: 0, cost: 0, sales: 0, profit: 0 }
    );
  }

  const todayStats = aggregate(todayBatches);
  const yesterdayStats = aggregate(yesterdayBatches);

  function trendOf(key) {
    const prev = yesterdayStats[key];
    if (!prev) return undefined;
    return Math.round(((todayStats[key] - prev) / prev) * 100);
  }

  const recentBatch = [...batches].sort((a, b) => new Date(b.date) - new Date(a.date))[0];

  const lowStockAlerts = [
    ...lowRawMaterials.map((r) => ({ ...r, kind: "Raw material" })),
    ...lowPackaging.map((p) => ({ ...p, kind: "Packaging" })),
  ].slice(0, 5);

  const topProducts = useMemo(() => {
    const totals = {};
    completed.forEach((b) => {
      totals[b.productId] = (totals[b.productId] || 0) + b.quantityL;
    });
    return Object.entries(totals)
      .map(([id, vol]) => ({ product: products.find((p) => p.id === id), volume: vol }))
      .filter((t) => t.product)
      .sort((a, b) => b.volume - a.volume)
      .slice(0, 5);
  }, [completed, products]);

  const monthlyChart = useMemo(() => {
    const totals = {};
    completed.forEach((b) => {
      const key = format(new Date(b.date), "MMM yyyy");
      const econ = batchEconomics(b);
      totals[key] = (totals[key] || 0) + econ.profit;
    });
    const entries = Object.entries(totals).sort((a, b) => new Date(a[0]) - new Date(b[0]));
    return { labels: entries.map((e) => e[0]), data: entries.map((e) => Math.round(e[1])) };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [completed, products, rawMaterialsById, packagingById, settings]);

  return (
    <div>
      <PageHeader
        title={`Good day, Aarav 👋`}
        subtitle={format(today, "EEEE, d MMMM yyyy")}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Today's Production" value={`${todayStats.production.toFixed(0)} L`} icon={Factory} trend={trendOf("production")} tone="brand" delay={0} />
        <StatCard label="Today's Cost" value={formatCurrency(todayStats.cost)} icon={Wallet} trend={trendOf("cost")} tone="warning" delay={0.05} />
        <StatCard label="Today's Sales" value={formatCurrency(todayStats.sales)} icon={IndianRupee} trend={trendOf("sales")} tone="aqua" delay={0.1} />
        <StatCard label="Estimated Profit" value={formatCurrency(todayStats.profit)} icon={TrendingUp} trend={trendOf("profit")} tone="success" delay={0.15} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-5">
        <Card className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-semibold text-ink-900">Monthly Profit</p>
            <Badge tone="brand">Net profit trend</Badge>
          </div>
          {monthlyChart.labels.length === 0 ? (
            <EmptyState icon={TrendingUp} title="No completed batches yet" description="Confirm production batches to see your profit trend." />
          ) : (
            <MonthlyProfitChart labels={monthlyChart.labels} data={monthlyChart.data} />
          )}
        </Card>

        <Card>
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-semibold text-ink-900">Quick Actions</p>
          </div>
          <div className="space-y-2.5">
            <QuickAction icon={Plus} label="Add Product" onClick={() => navigate("/products?new=1")} />
            <QuickAction icon={Factory} label="New Batch" onClick={() => navigate("/production?new=1")} />
            <QuickAction icon={Calculator} label="Batch Calculator" onClick={() => navigate("/batch-calculator")} />
            <QuickAction icon={FileBarChart} label="View Reports" onClick={() => navigate("/reports")} />
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <Clock size={16} className="text-brand-600" />
            <p className="text-sm font-semibold text-ink-900">Recent Batch</p>
          </div>
          {recentBatch ? (
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="font-semibold text-ink-900">{productName(recentBatch.productId)}</p>
                <Badge tone={recentBatch.status === "completed" ? "success" : "warning"} dot>
                  {recentBatch.status === "completed" ? "Completed" : "Planned"}
                </Badge>
              </div>
              <p className="text-xs font-mono text-ink-400 mb-3">{recentBatch.batchNumber}</p>
              <div className="space-y-1.5 text-sm">
                <div className="flex justify-between"><span className="text-ink-500">Quantity</span><span className="font-medium text-ink-900">{recentBatch.quantityL} L</span></div>
                <div className="flex justify-between"><span className="text-ink-500">Operator</span><span className="font-medium text-ink-900">{recentBatch.operator}</span></div>
                <div className="flex justify-between"><span className="text-ink-500">When</span><span className="font-medium text-ink-900">{timeAgo(recentBatch.date)}</span></div>
              </div>
            </div>
          ) : (
            <EmptyState icon={Factory} title="No batches yet" />
          )}
        </Card>

        <Card>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <AlertTriangle size={16} className="text-warning-500" />
              <p className="text-sm font-semibold text-ink-900">Low Stock Alerts</p>
            </div>
            {lowStockAlerts.length > 0 && <Badge tone="warning">{lowStockAlerts.length}</Badge>}
          </div>
          {lowStockAlerts.length === 0 ? (
            <EmptyState icon={AlertTriangle} title="All stock levels healthy" />
          ) : (
            <div className="space-y-3">
              {lowStockAlerts.map((item) => (
                <div key={item.id} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-ink-900">{item.name}</p>
                    <p className="text-xs text-ink-400">{item.kind}</p>
                  </div>
                  <span className="text-sm font-mono text-warning-600 font-semibold">{item.stock} left</span>
                </div>
              ))}
              <button onClick={() => navigate("/inventory")} className="text-xs font-semibold text-brand-600 inline-flex items-center gap-1 mt-2">
                View inventory <ArrowRight size={12} />
              </button>
            </div>
          )}
        </Card>

        <Card>
          <div className="flex items-center gap-2 mb-4">
            <Trophy size={16} className="text-brand-600" />
            <p className="text-sm font-semibold text-ink-900">Top Products by Volume</p>
          </div>
          {topProducts.length === 0 ? (
            <EmptyState icon={Trophy} title="No production data yet" />
          ) : (
            <div className="space-y-3">
              {topProducts.map((t, idx) => (
                <div key={t.product.id} className="flex items-center gap-3">
                  <span className="w-5 h-5 rounded-full bg-brand-gradient-soft text-brand-700 text-[11px] font-bold flex items-center justify-center shrink-0">{idx + 1}</span>
                  <span className="text-sm text-ink-700 flex-1 truncate">{t.product.name}</span>
                  <span className="text-sm font-mono font-semibold text-ink-900">{t.volume.toFixed(0)} L</span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

function QuickAction({ icon: Icon, label, onClick }) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 px-3.5 py-3 rounded-xl border border-surface-border hover:border-brand-300 hover:bg-brand-50/40 transition-all text-left group"
    >
      <div className="w-8 h-8 rounded-lg bg-brand-gradient-soft flex items-center justify-center shrink-0">
        <Icon size={15} className="text-brand-600" />
      </div>
      <span className="text-sm font-medium text-ink-700 flex-1">{label}</span>
      <ArrowRight size={14} className="text-ink-300 group-hover:text-brand-500 group-hover:translate-x-0.5 transition-all" />
    </button>
  );
}