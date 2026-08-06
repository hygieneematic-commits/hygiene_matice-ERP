import { useState, useMemo, useEffect } from "react";
import { Beaker, PackageOpen, Receipt, IndianRupee, ClipboardList, FlaskConical } from "lucide-react";
import PageHeader from "../../components/ui/PageHeader";
import Card from "../../components/ui/Card";
import { Select, Input, Label } from "../../components/ui/Field";
import LiquidVisualizer from "../../components/charts/LiquidVisualizer";
import { useProductStore } from "../../store/useProductStore";
import { useFormulaStore } from "../../store/useFormulaStore";
import { useRawMaterialStore } from "../../store/useRawMaterialStore";
import { usePackagingStore } from "../../store/usePackagingStore";
import { useSettingsStore } from "../../store/useSettingsStore";
import {
  safeNumber,
  computeFormulaLines,
  computeRawMaterialCost,
  computeBottleCount,
  computePackagingCost,
  computeOverheadCost,
  computeGrandTotal,
  resolveSellingPricePerLiter,
  computeGst,
  computeProfit,
} from "../../utils/batchCalcEngine";
import { formatCurrency, formatNumber } from "../../utils/formatters";
import clsx from "clsx";

const BATCH_PRESETS = [10, 25, 50, 100, 250, 500, 1000];
const GST_PRESETS = [0, 5, 12, 18, 28];

export default function BatchCalculator() {
  const products = useProductStore((s) => s.products);
  const { getFormula } = useFormulaStore();
  const rawMaterials = useRawMaterialStore((s) => s.rawMaterials);
  const rawMaterialsById = useMemo(() => {
    const m = {};
    rawMaterials.forEach((r) => (m[r.id] = r));
    return m;
  }, [rawMaterials]);
  const packagingItems = usePackagingStore((s) => s.packagingItems);
  const packagingById = useMemo(() => {
    const m = {};
    packagingItems.forEach((p) => (m[p.id] = p));
    return m;
  }, [packagingItems]);
  const byCategory = useMemo(() => {
    const map = { Bottle: [], Cap: [], Label: [], Carton: [], Shrink: [], Tape: [] };
    packagingItems.forEach((p) => {
      if (p.active === false) return;
      if (!map[p.category]) map[p.category] = [];
      map[p.category].push(p);
    });
    return map;
  }, [packagingItems]);
  const settings = useSettingsStore((s) => s.settings);

  // ---- STEP 1: Product ----
  const [productId, setProductId] = useState(products[0]?.id || "");
  const product = products.find((p) => p.id === productId);
  const formula = getFormula(productId);

  // ---- STEP 2: Batch Size ----
  const [batchLiters, setBatchLiters] = useState(10);
  const [customValue, setCustomValue] = useState("");

  // ---- STEP 4: Packaging configuration ----
  const bottleFromBOM = product?.packagingBOM?.find((b) => packagingById[b.packagingId]?.category === "Bottle");
  const capFromBOM = product?.packagingBOM?.find((b) => packagingById[b.packagingId]?.category === "Cap");
  const labelFromBOM = product?.packagingBOM?.find((b) => packagingById[b.packagingId]?.category === "Label");
  const shrinkFromBOM = product?.packagingBOM?.find((b) => packagingById[b.packagingId]?.category === "Shrink");
  const cartonFromBOM = product?.packagingBOM?.find((b) => packagingById[b.packagingId]?.category === "Carton");

  const [bottleId, setBottleId] = useState("");
  const [bottleCost, setBottleCost] = useState("");

  const [useCap, setUseCap] = useState(true);
  const [capId, setCapId] = useState("");
  const [capCost, setCapCost] = useState("");

  const [useSticker, setUseSticker] = useState(true);
  const [stickerId, setStickerId] = useState("");
  const [stickerCost, setStickerCost] = useState("");

  const [useOuterBox, setUseOuterBox] = useState(false);
  const [outerBoxId, setOuterBoxId] = useState("");
  const [outerBoxCost, setOuterBoxCost] = useState("");

  const [useShrink, setUseShrink] = useState(false);
  const [shrinkId, setShrinkId] = useState("");
  const [shrinkCost, setShrinkCost] = useState("");

  const [labourInput, setLabourInput] = useState(String(settings.labourCostPerL ?? 0));
  const [electricityInput, setElectricityInput] = useState(String(settings.electricityCostPerL ?? 0));
  const [transportInput, setTransportInput] = useState(String(settings.transportCostPerL ?? 0));
  const [miscInput, setMiscInput] = useState(String(settings.miscCostPerL ?? 0));

  // Re-seed packaging defaults every time the product changes — "auto-filled
  // from database", per spec, but always editable afterwards.
  useEffect(() => {
    const bottle = packagingById[bottleFromBOM?.packagingId] || byCategory.Bottle[0];
    const cap = packagingById[capFromBOM?.packagingId] || byCategory.Cap[0];
    const sticker = packagingById[labelFromBOM?.packagingId] || byCategory.Label[0];
    const shrink = packagingById[shrinkFromBOM?.packagingId] || byCategory.Shrink[0];
    const box = packagingById[cartonFromBOM?.packagingId] || byCategory.Carton[0];
    setBottleId(bottle?.id || "");
    setBottleCost(bottle ? String(bottle.price) : "");
    setCapId(cap?.id || "");
    setCapCost(cap ? String(cap.price) : "");
    setStickerId(sticker?.id || "");
    setStickerCost(sticker ? String(sticker.price) : "");
    setShrinkId(shrink?.id || "");
    setShrinkCost(shrink ? String(shrink.price) : "");
    setOuterBoxId(box?.id || "");
    setOuterBoxCost(box ? String(box.price) : "");
  }, [productId]); // eslint-disable-line react-hooks/exhaustive-deps

  function handleBottleChange(id) {
    setBottleId(id);
    setBottleCost(packagingById[id] ? String(packagingById[id].price) : "");
  }
  function handleCapChange(id) {
    setCapId(id);
    setCapCost(packagingById[id] ? String(packagingById[id].price) : "");
  }
  function handleStickerChange(id) {
    setStickerId(id);
    setStickerCost(packagingById[id] ? String(packagingById[id].price) : "");
  }
  function handleShrinkChange(id) {
    setShrinkId(id);
    setShrinkCost(packagingById[id] ? String(packagingById[id].price) : "");
  }
  function handleOuterBoxChange(id) {
    setOuterBoxId(id);
    setOuterBoxCost(packagingById[id] ? String(packagingById[id].price) : "");
  }

  // ---- STEP 6: Selling Price & GST ----
  const [sellingMode, setSellingMode] = useState("perLiter"); // "perLiter" | "total"
  const [sellingValue, setSellingValue] = useState(String(product?.sellingPricePerL ?? ""));
  const [gstMode, setGstMode] = useState("exclude"); // "exclude" | "include"
  const [gstPercent, setGstPercent] = useState(String((settings.cgstPercent ?? 9) + (settings.sgstPercent ?? 9)));
  const [gstCustom, setGstCustom] = useState(false);

  useEffect(() => {
    setSellingValue(String(product?.sellingPricePerL ?? ""));
    setSellingMode("perLiter");
  }, [productId]); // eslint-disable-line react-hooks/exhaustive-deps

  function handlePreset(val) {
    setBatchLiters(val);
    setCustomValue("");
  }
  function handleCustom(e) {
    const v = e.target.value;
    setCustomValue(v);
    const n = safeNumber(v);
    if (n > 0) setBatchLiters(n);
  }

  // =========================================================================
  // CALCULATION PIPELINE — every downstream number is derived here, once.
  // Nothing below is rounded; rounding happens only at render (formatCurrency).
  // =========================================================================

  // STEP 1/2/3 — Formula Engine → Raw Material Cost Engine
  const formulaLines = useMemo(
    () => computeFormulaLines(formula?.ingredients, batchLiters, rawMaterialsById),
    [formula, batchLiters, rawMaterialsById]
  );
  const rawMaterialResult = useMemo(() => computeRawMaterialCost(formulaLines), [formulaLines]);

  // STEP 4 — Packaging Engine
  const selectedBottle = packagingById[bottleId];
  const bottleUnits = useMemo(
    () => computeBottleCount(batchLiters, selectedBottle?.capacityMl),
    [batchLiters, selectedBottle]
  );
  const packagingResult = useMemo(
    () =>
      computePackagingCost({
        bottleUnits,
        bottleCost,
        useCap,
        capCost,
        useSticker,
        stickerCost,
        useOuterBox,
        outerBoxCost,
        outerBoxCapacityUnits: packagingById[outerBoxId]?.capacityUnits,
        useShrink,
        shrinkCost,
      }),
    [bottleUnits, bottleCost, useCap, capCost, useSticker, stickerCost, useOuterBox, outerBoxCost, outerBoxId, packagingById, useShrink, shrinkCost]
  );

  // STEP 4 — Overhead Engine
  const overheadResult = useMemo(
    () =>
      computeOverheadCost({
        batchLiters,
        labour: labourInput,
        electricity: electricityInput,
        transport: transportInput,
        misc: miscInput,
        mode: settings.overheadMode || "perLiter",
      }),
    [batchLiters, labourInput, electricityInput, transportInput, miscInput, settings.overheadMode]
  );

  // STEP 5 — Cost Summary
  const grandTotalResult = useMemo(
    () =>
      computeGrandTotal({
        rawMaterialTotal: rawMaterialResult.totalCost,
        packagingTotal: packagingResult.packagingTotal,
        overheadTotal: overheadResult.overheadTotal,
        batchLiters,
        bottleUnits,
      }),
    [rawMaterialResult, packagingResult, overheadResult, batchLiters, bottleUnits]
  );

  // STEP 6 — GST Engine + Profit Engine
  const sellingPricePerLiter = useMemo(
    () => resolveSellingPricePerLiter({ mode: sellingMode, value: sellingValue, batchLiters }),
    [sellingMode, sellingValue, batchLiters]
  );
  const effectiveGstPercent = safeNumber(gstPercent);
  const gstResult = useMemo(
    () => computeGst({ sellingPricePerLiter, gstMode, gstPercent: effectiveGstPercent }),
    [sellingPricePerLiter, gstMode, effectiveGstPercent]
  );
  const profitResult = useMemo(
    () =>
      computeProfit({
        netPricePerLiter: gstResult.netPricePerLiter,
        costPerLiter: grandTotalResult.costPerLiter,
        batchLiters,
        bottleUnits,
      }),
    [gstResult, grandTotalResult, batchLiters, bottleUnits]
  );

  const isProfit = profitResult.profitPerLiter >= 0;

  return (
    <div>
      <PageHeader
        title="Batch Calculator"
        subtitle="Product → Batch Size → Raw Materials → Packaging → Cost → Selling Price — 6 simple steps"
      />

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        <div className="xl:col-span-2 space-y-5">
          {/* STEP 1 & 2 */}
          <Card>
            <SectionLabel n={1} title="Select Product & Batch Size" icon={FlaskConical} />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
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
                <Label hint="Liters">Custom Batch Size</Label>
                <Input type="number" min="0.1" step="0.1" placeholder="e.g. 37" value={customValue} onChange={handleCustom} />
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {BATCH_PRESETS.map((val) => (
                <button
                  key={val}
                  onClick={() => handlePreset(val)}
                  className={clsx(
                    "px-4 py-2 rounded-xl text-sm font-medium border transition-colors",
                    batchLiters === val && !customValue
                      ? "bg-brand-gradient text-white border-transparent"
                      : "bg-white text-ink-600 border-surface-border hover:border-brand-300"
                  )}
                >
                  {val}L
                </button>
              ))}
            </div>
          </Card>

          {/* STEP 3 — Raw Material Cost */}
          <Card padding="p-0">
            <div className="px-5 py-4 border-b border-surface-border">
              <SectionLabel n={2} title="Raw Material Cost" icon={Beaker} noMargin />
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-surface-border">
                    <th className="text-left text-[11px] font-semibold text-ink-400 uppercase tracking-wide px-5 py-2.5">Raw Material</th>
                    <th className="text-right text-[11px] font-semibold text-ink-400 uppercase tracking-wide px-5 py-2.5">Required Qty</th>
                    <th className="text-right text-[11px] font-semibold text-ink-400 uppercase tracking-wide px-5 py-2.5">Unit Price</th>
                    <th className="text-right text-[11px] font-semibold text-ink-400 uppercase tracking-wide px-5 py-2.5">Total Cost</th>
                  </tr>
                </thead>
                <tbody>
                  {rawMaterialResult.lines.map((line, i) => {
                    const isKg = line.type === "weight";
                    const displayQty = line.requiredBaseQty >= 1000 ? line.requiredBaseQty / 1000 : line.requiredBaseQty;
                    const displayUnit = line.requiredBaseQty >= 1000 ? (isKg ? "Kg" : "L") : isKg ? "gm" : "ml";
                    return (
                      <tr key={i} className="border-b border-surface-border last:border-0">
                        <td className="px-5 py-2.5 font-medium text-ink-900">{line.rawMaterialName}</td>
                        <td className="px-5 py-2.5 text-right font-mono text-ink-700">
                          {formatNumber(displayQty, 2)} {displayUnit}
                        </td>
                        <td className="px-5 py-2.5 text-right font-mono text-ink-500">
                          {formatCurrency(line.unitPrice)}/{isKg ? "Kg" : "L"}
                        </td>
                        <td className="px-5 py-2.5 text-right font-mono font-semibold text-ink-900">{formatCurrency(line.cost)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="p-5 bg-brand-50/50 flex justify-between items-center rounded-b-2xl">
              <span className="text-sm font-semibold text-ink-900">Total Raw Material Cost</span>
              <span className="text-xl font-bold font-mono text-brand-700">{formatCurrency(rawMaterialResult.totalCost)}</span>
            </div>
          </Card>

          {/* STEP 4 — Packaging Cost */}
          <Card>
            <SectionLabel n={3} title="Packaging Cost" icon={PackageOpen} />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div>
                <Label hint={`${bottleUnits} bottle${bottleUnits !== 1 ? "s" : ""} required`}>Bottle Size</Label>
                <Select value={bottleId} onChange={(e) => handleBottleChange(e.target.value)}>
                  {byCategory.Bottle.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name} ({b.capacityMl >= 1000 ? `${b.capacityMl / 1000}L` : `${b.capacityMl}ml`})
                    </option>
                  ))}
                </Select>
              </div>
              <div>
                <Label hint="₹ / bottle, editable">Bottle Cost</Label>
                <Input type="number" min="0" step="0.01" value={bottleCost} onChange={(e) => setBottleCost(e.target.value)} />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
              <PackagingToggleRow
                label="Cap"
                use={useCap}
                onToggle={setUseCap}
                items={byCategory.Cap}
                selectedId={capId}
                onSelect={handleCapChange}
                cost={capCost}
                onCost={setCapCost}
              />
              <PackagingToggleRow
                label="Sticker / Label"
                use={useSticker}
                onToggle={setUseSticker}
                items={byCategory.Label}
                selectedId={stickerId}
                onSelect={handleStickerChange}
                cost={stickerCost}
                onCost={setStickerCost}
              />
              <PackagingToggleRow
                label="Outer Box (per carton)"
                use={useOuterBox}
                onToggle={setUseOuterBox}
                items={byCategory.Carton}
                selectedId={outerBoxId}
                onSelect={handleOuterBoxChange}
                cost={outerBoxCost}
                onCost={setOuterBoxCost}
              />
              <PackagingToggleRow
                label="Shrink Wrap"
                use={useShrink}
                onToggle={setUseShrink}
                items={byCategory.Shrink}
                selectedId={shrinkId}
                onSelect={handleShrinkChange}
                cost={shrinkCost}
                onCost={setShrinkCost}
              />
            </div>

            <p className="text-[11px] font-semibold text-ink-400 uppercase tracking-wide mb-2">Manufacturing Overhead (optional)</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
              <OverheadField label="Labour" value={labourInput} onChange={setLabourInput} />
              <OverheadField label="Electricity" value={electricityInput} onChange={setElectricityInput} />
              <OverheadField label="Transport" value={transportInput} onChange={setTransportInput} />
              <OverheadField label="Misc." value={miscInput} onChange={setMiscInput} />
            </div>

            <div className="border-t border-surface-border pt-3.5 space-y-2 text-sm">
              <Row label="Bottle cost" value={packagingResult.bottleTotal} />
              {useCap && <Row label="Cap cost" value={packagingResult.capTotal} />}
              {useSticker && <Row label="Sticker cost" value={packagingResult.stickerTotal} />}
              {useOuterBox && <Row label={`Outer box cost (${packagingResult.outerBoxCount} boxes)`} value={packagingResult.outerBoxTotal} />}
              {useShrink && <Row label="Shrink wrap cost" value={packagingResult.shrinkTotal} />}
              <div className="flex justify-between pt-1">
                <span className="font-semibold text-ink-900">Packaging Total</span>
                <span className="font-mono font-bold text-ink-900">{formatCurrency(packagingResult.packagingTotal)}</span>
              </div>
            </div>
          </Card>
        </div>

        <div className="space-y-5">
          <Card>
            <div className="flex items-center gap-2 mb-3">
              <Beaker size={16} className="text-brand-600" />
              <p className="text-sm font-semibold text-ink-900">Formula Composition</p>
            </div>
            <LiquidVisualizer
              ingredients={formulaLines.map((l) => ({ ...l, scaledBaseQty: l.requiredBaseQty, rawMaterialName: l.rawMaterialName }))}
              batchLiters={batchLiters}
            />
          </Card>

          {/* STEP 5 — Cost Summary */}
          <Card padding="p-0">
            <div className="px-5 py-4 border-b border-surface-border">
              <SectionLabel n={4} title="Cost Summary" icon={Receipt} noMargin />
            </div>
            <div className="p-5 space-y-2.5 text-sm">
              <Row label="Raw material cost" value={rawMaterialResult.totalCost} />
              <Row label="Packaging cost" value={packagingResult.packagingTotal} />
              <Row label="Labour" value={overheadResult.labourTotal} />
              <Row label="Electricity" value={overheadResult.electricityTotal} />
              <Row label="Transport" value={overheadResult.transportTotal} />
              <Row label="Misc." value={overheadResult.miscTotal} />
              <div className="border-t border-surface-border !mt-3.5 pt-3.5 flex justify-between">
                <span className="text-sm font-semibold text-ink-900">Grand Total Batch Cost</span>
                <span className="text-sm font-mono font-bold text-ink-900">{formatCurrency(grandTotalResult.grandTotal)}</span>
              </div>
              <Row label="Cost Per Liter" value={grandTotalResult.costPerLiter} />
              <Row label={`Cost Per Bottle (${bottleUnits} units)`} value={grandTotalResult.costPerBottle} />
            </div>
          </Card>

          {/* STEP 6 — Selling Price & Profit */}
          <Card>
            <SectionLabel n={5} title="Selling Price & Profit" icon={IndianRupee} />
            <div className="flex gap-2 mb-3">
              <button
                onClick={() => setSellingMode("perLiter")}
                className={clsx(
                  "flex-1 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors",
                  sellingMode === "perLiter" ? "bg-brand-gradient text-white border-transparent" : "bg-white text-ink-600 border-surface-border"
                )}
              >
                Price Per Liter
              </button>
              <button
                onClick={() => setSellingMode("total")}
                className={clsx(
                  "flex-1 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors",
                  sellingMode === "total" ? "bg-brand-gradient text-white border-transparent" : "bg-white text-ink-600 border-surface-border"
                )}
              >
                Total Batch Selling Price
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div>
                <Label hint={sellingMode === "total" ? "₹ / batch" : "₹ / Liter"}>Selling Price</Label>
                <Input type="number" step="0.01" min="0" value={sellingValue} onChange={(e) => setSellingValue(e.target.value)} placeholder="e.g. 120" />
              </div>
              <div>
                <Label>GST Mode</Label>
                <Select value={gstMode} onChange={(e) => setGstMode(e.target.value)}>
                  <option value="exclude">Excluding GST (price is before tax)</option>
                  <option value="include">Including GST (price already has tax)</option>
                </Select>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 mb-4">
              {GST_PRESETS.map((p) => (
                <button
                  key={p}
                  onClick={() => {
                    setGstPercent(String(p));
                    setGstCustom(false);
                  }}
                  className={clsx(
                    "px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors",
                    !gstCustom && Number(gstPercent) === p ? "bg-brand-gradient text-white border-transparent" : "bg-white text-ink-600 border-surface-border"
                  )}
                >
                  {p}%
                </button>
              ))}
              <button
                onClick={() => setGstCustom(true)}
                className={clsx(
                  "px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors",
                  gstCustom ? "bg-brand-gradient text-white border-transparent" : "bg-white text-ink-600 border-surface-border"
                )}
              >
                Custom
              </button>
              {gstCustom && (
                <Input
                  type="number"
                  min="0"
                  step="0.1"
                  className="!w-24 !py-1.5"
                  value={gstPercent}
                  onChange={(e) => setGstPercent(e.target.value)}
                  placeholder="%"
                />
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
              <Metric label="Net Selling Price /L" value={formatCurrency(gstResult.netPricePerLiter)} />
              <Metric label="Price with GST /L" value={formatCurrency(gstResult.grossPricePerLiter)} />
              <Metric label={`GST (${effectiveGstPercent}%) /L`} value={formatCurrency(gstResult.gstAmountPerLiter)} />
              <Metric label="Net Profit /L" value={formatCurrency(profitResult.profitPerLiter)} tone={isProfit ? "success" : "danger"} />
              <Metric label="Margin / Markup" value={`${formatNumber(profitResult.marginPercent, 2)}% / ${formatNumber(profitResult.markupPercent, 2)}%`} />
              <Metric label="Profit Per Bottle" value={formatCurrency(profitResult.profitPerBottle)} tone={isProfit ? "success" : "danger"} />
              <Metric label="ROI %" value={`${formatNumber(profitResult.roiPercent, 2)}%`} />
              <Metric label="Contribution Margin" value={`${formatNumber(profitResult.contributionMarginPercent, 2)}%`} />
              <Metric label="Total Batch Profit" value={formatCurrency(profitResult.netProfitTotal)} tone={isProfit ? "success" : "danger"} />
            </div>
          </Card>

          {/* Final Dashboard — Batch Summary */}
          <Card className={clsx(isProfit ? "bg-brand-gradient" : "bg-danger-600", "text-white !border-transparent")}>
            <div className="flex items-center gap-2 mb-1">
              <ClipboardList size={15} className="text-white/80" />
              <p className="text-xs text-white/70">Batch Summary</p>
            </div>
            <p className="text-3xl font-bold font-display mb-4">
              {formatCurrency(grandTotalResult.costPerLiter)} <span className="text-sm font-normal text-white/70">/ Liter</span>
            </p>
            <div className="grid grid-cols-2 gap-x-3 gap-y-3 text-sm border-t border-white/20 pt-4">
              <SummaryStat label="Batch Size" value={`${batchLiters} L`} />
              <SummaryStat label="Bottle Qty" value={`${bottleUnits} units`} />
              <SummaryStat label="Grand Cost" value={formatCurrency(grandTotalResult.grandTotal)} />
              <SummaryStat label="Selling Price /L" value={formatCurrency(gstResult.netPricePerLiter)} />
              <SummaryStat label="Net Margin" value={`${formatNumber(profitResult.marginPercent, 2)}%`} />
              <SummaryStat label="Markup" value={`${formatNumber(profitResult.markupPercent, 2)}%`} />
              <SummaryStat label="Cost / Bottle" value={formatCurrency(grandTotalResult.costPerBottle)} />
              <SummaryStat label="Profit / Bottle" value={formatCurrency(profitResult.profitPerBottle)} />
              <SummaryStat label="Total Batch Profit" value={formatCurrency(profitResult.netProfitTotal)} highlight />
            </div>
          </Card>
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

function PackagingToggleRow({ label, use, onToggle, items, selectedId, onSelect, cost, onCost }) {
  return (
    <div className="border border-surface-border rounded-xl p-3">
      <label className="flex items-center gap-2 text-sm font-medium text-ink-700 mb-2 cursor-pointer">
        <input type="checkbox" checked={use} onChange={(e) => onToggle(e.target.checked)} className="rounded border-surface-border" />
        {label}
      </label>
      {use && (
        <div className="grid grid-cols-2 gap-2">
          <Select value={selectedId} onChange={(e) => onSelect(e.target.value)} className="!py-1.5 !text-xs">
            {items.map((it) => (
              <option key={it.id} value={it.id}>
                {it.name}
              </option>
            ))}
          </Select>
          <Input type="number" min="0" step="0.01" value={cost} onChange={(e) => onCost(e.target.value)} className="!py-1.5 !text-xs" />
        </div>
      )}
    </div>
  );
}

function OverheadField({ label, value, onChange }) {
  return (
    <div>
      <Label hint="₹">{label}</Label>
      <Input type="number" min="0" step="0.01" value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}
