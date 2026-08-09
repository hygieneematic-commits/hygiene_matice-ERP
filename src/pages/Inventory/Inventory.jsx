import { useState, useMemo } from "react";
import { Warehouse, AlertTriangle, Plus, Minus, Search, PackagePlus } from "lucide-react";
import PageHeader from "../../components/ui/PageHeader";
import Card from "../../components/ui/Card";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import { Input, Label } from "../../components/ui/Field";
import DataTable from "../../components/ui/DataTable";
import EmptyState from "../../components/ui/EmptyState";
import Modal from "../../components/ui/Modal";
import { useRawMaterialStore } from "../../store/useRawMaterialStore";
import { usePackagingStore } from "../../store/usePackagingStore";
import { useProductionStore } from "../../store/useProductionStore";
import { useFormulaStore } from "../../store/useFormulaStore";
import { useProductStore } from "../../store/useProductStore";
import { useToastStore } from "../../store/useToastStore";
import { usePermissions } from "../../utils/permissions";
import { calculateMaterialUsage, estimateRemainingProduction } from "../../utils/costEngine";
import clsx from "clsx";

export default function Inventory() {
  const [tab, setTab] = useState("raw");
  const [query, setQuery] = useState("");
  const [adjustTarget, setAdjustTarget] = useState(null);
  const [adjustValue, setAdjustValue] = useState("");
  const [restockTarget, setRestockTarget] = useState(null);
  const [restockValue, setRestockValue] = useState("");

  const rawMaterials = useRawMaterialStore((s) => s.rawMaterials);
  const adjustRawStock = useRawMaterialStore((s) => s.adjustStock);
  const updateRawMaterial = useRawMaterialStore((s) => s.updateRawMaterial);
  const packagingItems = usePackagingStore((s) => s.packagingItems);
  const adjustPkgStock = usePackagingStore((s) => s.adjustStock);
  const updatePackaging = usePackagingStore((s) => s.updatePackaging);
  const batches = useProductionStore((s) => s.batches);
  const formulasByProductId = useFormulaStore((s) => s.formulasByProductId);
  const products = useProductStore((s) => s.products);
  const push = useToastStore((s) => s.push);
  const { canEdit } = usePermissions();

  const rawMaterialsById = useMemo(() => {
    const m = {};
    rawMaterials.forEach((r) => (m[r.id] = r));
    return m;
  }, [rawMaterials]);

  const startOfToday = useMemo(() => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; }, []);
  const startOfMonth = useMemo(() => { const d = new Date(); d.setDate(1); d.setHours(0, 0, 0, 0); return d; }, []);

  const source = tab === "raw" ? rawMaterials : packagingItems;
  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return source;
    return source.filter((i) => i.name.toLowerCase().includes(q));
  }, [source, query]);

  const lowCount = source.filter((i) => i.stock <= i.minStock).length;

  function openAdjust(item) {
    setAdjustTarget(item);
    setAdjustValue("");
  }

  function handleAdjust(sign) {
    const val = Number(adjustValue);
    if (!val) return;
    const delta = sign * val;
    if (tab === "raw") adjustRawStock(adjustTarget.id, delta);
    else adjustPkgStock(adjustTarget.id, delta);
    push(`Stock ${sign > 0 ? "added" : "removed"} for ${adjustTarget.name}`);
    setAdjustTarget(null);
  }

  function openRestock(item) {
    setRestockTarget(item);
    setRestockValue("");
  }

  function handleRestock() {
    const val = Number(restockValue);
    if (!val || val <= 0) return;
    if (tab === "raw") adjustRawStock(restockTarget.id, val);
    else adjustPkgStock(restockTarget.id, val);
    push(`${val} added to ${restockTarget.name} stock`, "success");
    setRestockTarget(null);
  }

  function handleMinStockChange(row, value) {
    const minStock = Number(value);
    if (Number.isNaN(minStock) || minStock < 0) return;
    if (tab === "raw") updateRawMaterial(row.id, { minStock });
    else updatePackaging(row.id, { minStock });
  }

  const columns = [
    { key: "name", header: "Item", render: (row) => <p className="font-medium text-ink-900">{row.name}</p> },
    {
      key: "stock",
      header: "Current Stock",
      align: "right",
      render: (row) => (
        <span className={clsx("font-mono font-semibold", row.stock <= row.minStock ? "text-warning-600" : "text-ink-900")}>
          {row.stock} {tab === "raw" ? (row.unitType === "weight" ? "Kg" : "L") : "pcs"}
        </span>
      ),
    },
    {
      key: "minStock",
      header: "Min. Level",
      align: "right",
      render: (row) =>
        canEdit ? (
          <div className="flex items-center justify-end gap-1.5">
            <Input
              type="number"
              min="0"
              step="0.01"
              defaultValue={row.minStock}
              onBlur={(e) => handleMinStockChange(row, e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && e.target.blur()}
              className="!w-20 !py-1 !text-xs text-right"
            />
            <span className="text-xs text-ink-400 w-7">{tab === "raw" ? (row.unitType === "weight" ? "Kg" : "L") : "pcs"}</span>
          </div>
        ) : (
          <span className="text-ink-500">{row.minStock} {tab === "raw" ? (row.unitType === "weight" ? "Kg" : "L") : "pcs"}</span>
        ),
    },
    ...(tab === "raw"
      ? [
          {
            key: "usedToday",
            header: "Used Today",
            align: "right",
            render: (row) => {
              const u = calculateMaterialUsage({ rawMaterialId: row.id, batches, formulasByProductId, rawMaterialsById, since: startOfToday });
              return <span className="text-ink-500 text-sm">{u.value > 0 ? `${u.value} ${u.unit}` : "—"}</span>;
            },
          },
          {
            key: "usedMonth",
            header: "Used This Month",
            align: "right",
            render: (row) => {
              const u = calculateMaterialUsage({ rawMaterialId: row.id, batches, formulasByProductId, rawMaterialsById, since: startOfMonth });
              return <span className="text-ink-500 text-sm">{u.value > 0 ? `${u.value} ${u.unit}` : "—"}</span>;
            },
          },
          {
            key: "remaining",
            header: "Est. Remaining Production",
            render: (row) => {
              const est = estimateRemainingProduction({ rawMaterialId: row.id, rawMaterialsById, formulasByProductId, products });
              return est ? (
                <span className="text-xs text-ink-500">Can produce ~<span className="font-mono font-semibold text-ink-900">{est.litersPossible}L</span> {est.productName}</span>
              ) : (
                <span className="text-ink-300 text-xs">Not used in any formula</span>
              );
            },
          },
        ]
      : []),
    {
      key: "status",
      header: "Status",
      render: (row) =>
        row.stock <= row.minStock ? (
          <Badge tone="warning" dot><AlertTriangle size={11} className="mr-0.5" /> Reorder now</Badge>
        ) : (
          <Badge tone="success" dot>Healthy</Badge>
        ),
    },
    {
      key: "actions",
      header: "",
      align: "right",
      render: (row) => (
        <div className="flex items-center justify-end gap-2">
          <Button size="sm" variant="success" onClick={() => openRestock(row)} title="Quickly add stock received">
            <PackagePlus size={13} /> Restock
          </Button>
          <Button size="sm" variant="secondary" onClick={() => openAdjust(row)}>
            Adjust Stock
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Inventory"
        subtitle={lowCount > 0 ? `${lowCount} item${lowCount !== 1 ? "s" : ""} below minimum stock level` : "All stock levels are healthy"}
      />

      <div className="flex gap-2 mb-5">
        <button
          onClick={() => setTab("raw")}
          className={clsx("px-4 py-2 rounded-xl text-sm font-medium transition-colors", tab === "raw" ? "bg-brand-gradient text-white shadow-soft" : "bg-white border border-surface-border text-ink-600")}
        >
          Raw Materials
        </button>
        <button
          onClick={() => setTab("packaging")}
          className={clsx("px-4 py-2 rounded-xl text-sm font-medium transition-colors", tab === "packaging" ? "bg-brand-gradient text-white shadow-soft" : "bg-white border border-surface-border text-ink-600")}
        >
          Packaging
        </button>
      </div>

      <Card padding="p-5">
        <div className="relative max-w-sm mb-4">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400" />
          <Input placeholder="Search inventory…" value={query} onChange={(e) => setQuery(e.target.value)} className="pl-10" />
        </div>
        <DataTable columns={columns} data={filtered} emptyState={<EmptyState icon={Warehouse} title="No items found" />} />
      </Card>

      <Modal
        open={!!adjustTarget}
        onClose={() => setAdjustTarget(null)}
        title={`Adjust Stock — ${adjustTarget?.name}`}
        subtitle={`Current: ${adjustTarget?.stock} ${tab === "raw" ? (adjustTarget?.unitType === "weight" ? "Kg" : "L") : "pcs"}`}
      >
        <div>
          <Label>Quantity</Label>
          <Input type="number" step="0.01" value={adjustValue} onChange={(e) => setAdjustValue(e.target.value)} placeholder="Enter quantity" />
          <div className="flex gap-3 mt-4">
            <Button variant="success" className="flex-1" onClick={() => handleAdjust(1)}>
              <Plus size={15} /> Add Stock
            </Button>
            <Button variant="danger" className="flex-1" onClick={() => handleAdjust(-1)}>
              <Minus size={15} /> Remove Stock
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        open={!!restockTarget}
        onClose={() => setRestockTarget(null)}
        title={`Restock — ${restockTarget?.name}`}
        subtitle={`Current: ${restockTarget?.stock} ${tab === "raw" ? (restockTarget?.unitType === "weight" ? "Kg" : "L") : "pcs"} · Min level: ${restockTarget?.minStock}`}
        footer={<><Button variant="secondary" onClick={() => setRestockTarget(null)}>Cancel</Button><Button variant="success" onClick={handleRestock}><PackagePlus size={15} /> Add to Stock</Button></>}
      >
        <div>
          <Label hint={tab === "raw" ? (restockTarget?.unitType === "weight" ? "Kg" : "L") : "pcs"}>Quantity Received</Label>
          <Input type="number" min="0" step="0.01" value={restockValue} onChange={(e) => setRestockValue(e.target.value)} placeholder="e.g. 50" autoFocus />
        </div>
      </Modal>
    </div>
  );
}
