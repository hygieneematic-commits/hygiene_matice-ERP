import { toBaseUnit, unitType } from "./units";

/**
 * BATCH CALCULATOR ENGINE — v2
 * -----------------------------------------------------------------------
 * Built to the "6-step, accuracy-first" spec:
 *   1. Product          2. Batch Size        3. Raw Material Cost
 *   4. Packaging Cost    5. Cost Summary       6. Selling Price & Profit
 *
 * Ground rules (non-negotiable, per spec):
 *   - Never hardcode a calculation — every number flows through one of the
 *     small pure functions below (Formula Engine / Packaging Engine /
 *     Overhead Engine / GST Engine / Profit Engine), each independently
 *     testable and reusable.
 *   - Full precision internally. Values are NEVER rounded until the moment
 *     they are handed to formatCurrency()/formatNumber() for display. Every
 *     function here returns raw floats — round in the component, not here.
 *   - Every input is validated. NaN, Infinity, and negative quantities are
 *     normalized to 0 before they can propagate into a calculation.
 * -----------------------------------------------------------------------
 */

// ---------------------------------------------------------------------------
// Input sanitation — the single gate every user-entered number passes through
// ---------------------------------------------------------------------------
export function safeNumber(value, { min = 0 } = {}) {
  const n = typeof value === "number" ? value : parseFloat(value);
  if (!Number.isFinite(n)) return 0; // catches NaN and ±Infinity
  return n < min ? min : n;
}

// ---------------------------------------------------------------------------
// STEP 1/2 — FORMULA ENGINE
// formula % (as stored quantity-per-1L) × batch size, unit-converted
// automatically. No manual entry, no manual conversion.
// ---------------------------------------------------------------------------
export function computeFormulaLines(ingredients, batchLiters, rawMaterialsById) {
  const safeLiters = safeNumber(batchLiters);
  return (ingredients || []).map((ing) => {
    const rm = rawMaterialsById[ing.rawMaterialId];
    const type = rm ? rm.unitType : unitType(ing.unit);
    const baseQtyPer1L = toBaseUnit(safeNumber(ing.quantity), ing.unit); // ml or gm, exact
    const requiredBaseQty = baseQtyPer1L * safeLiters; // exact, unrounded
    return {
      rawMaterialId: ing.rawMaterialId,
      rawMaterialName: rm ? rm.name : "Unknown material",
      type,
      requiredBaseQty, // always ml or gm, full precision
      rawMaterial: rm || null,
    };
  });
}

// ---------------------------------------------------------------------------
// STEP 3 — RAW MATERIAL COST ENGINE
// Raw materials are priced per L (volume) or per Kg (weight). Cost is exact;
// only the returned `lines[].cost` / `totalCost` get rounded at render time.
// ---------------------------------------------------------------------------
export function computeRawMaterialCost(formulaLines) {
  let totalCost = 0;
  const lines = (formulaLines || []).map((line) => {
    if (!line.rawMaterial) return { ...line, unitPrice: 0, cost: 0 };
    const largeUnitQty = line.requiredBaseQty / 1000; // ml->L or gm->Kg
    const unitPrice = safeNumber(line.rawMaterial.price);
    const cost = largeUnitQty * unitPrice; // exact
    totalCost += cost;
    return { ...line, unitPrice, largeUnitQty, cost };
  });
  return { lines, totalCost };
}

// ---------------------------------------------------------------------------
// STEP 4 — PACKAGING ENGINE
// One bottle size, quantity auto-derived from batch size. Every other
// component (cap / sticker / outer box / shrink) is optional, auto-filled
// from the packaging database but editable, and priced per bottle (per
// carton for the outer box). Labour/overhead/transport/misc are optional
// flat or per-liter add-ons entered at this same step.
// ---------------------------------------------------------------------------
export function computeBottleCount(batchLiters, bottleCapacityMl) {
  const cap = safeNumber(bottleCapacityMl);
  if (cap <= 0) return 0;
  const totalMl = safeNumber(batchLiters) * 1000;
  return Math.ceil(totalMl / cap); // physical count — must be a whole bottle
}

export function computePackagingCost({
  bottleUnits,
  bottleCost,
  useCap,
  capCost,
  useSticker,
  stickerCost,
  useOuterBox,
  outerBoxCost,
  outerBoxCapacityUnits,
  useShrink,
  shrinkCost,
}) {
  const units = safeNumber(bottleUnits);
  const bottleTotal = units * safeNumber(bottleCost);
  const capTotal = useCap ? units * safeNumber(capCost) : 0;
  const stickerTotal = useSticker ? units * safeNumber(stickerCost) : 0;
  const shrinkTotal = useShrink ? units * safeNumber(shrinkCost) : 0;
  const boxCapacity = safeNumber(outerBoxCapacityUnits, { min: 1 }) || 1;
  const outerBoxCount = useOuterBox ? Math.ceil(units / boxCapacity) : 0;
  const outerBoxTotal = useOuterBox ? outerBoxCount * safeNumber(outerBoxCost) : 0;

  const packagingTotal = bottleTotal + capTotal + stickerTotal + shrinkTotal + outerBoxTotal;

  return {
    units,
    bottleTotal,
    capTotal,
    stickerTotal,
    shrinkTotal,
    outerBoxCount,
    outerBoxTotal,
    packagingTotal,
  };
}

// ---------------------------------------------------------------------------
// STEP 4 — OVERHEAD ENGINE (Labour / Electricity / Transport / Misc)
// Each is optional and can be entered as a flat per-batch charge or a
// per-liter rate; the caller decides which via `mode`.
// ---------------------------------------------------------------------------
export function computeOverheadCost({ batchLiters, labour, electricity, transport, misc, mode = "perBatch" }) {
  const multiplier = mode === "perLiter" ? safeNumber(batchLiters) : 1;
  const labourTotal = safeNumber(labour) * multiplier;
  const electricityTotal = safeNumber(electricity) * multiplier;
  const transportTotal = safeNumber(transport) * multiplier;
  const miscTotal = safeNumber(misc) * multiplier;
  return {
    labourTotal,
    electricityTotal,
    transportTotal,
    miscTotal,
    overheadTotal: labourTotal + electricityTotal + transportTotal + miscTotal,
  };
}

// ---------------------------------------------------------------------------
// STEP 5 — COST SUMMARY (Grand Manufacturing Cost)
// Pure addition of the three engines above. No packaging is ever counted
// twice — packaging cost has exactly one source: the Step 4 configuration.
// ---------------------------------------------------------------------------
export function computeGrandTotal({ rawMaterialTotal, packagingTotal, overheadTotal, batchLiters, bottleUnits }) {
  const grandTotal = safeNumber(rawMaterialTotal) + safeNumber(packagingTotal) + safeNumber(overheadTotal);
  const liters = safeNumber(batchLiters);
  const units = safeNumber(bottleUnits);
  return {
    grandTotal,
    costPerLiter: liters > 0 ? grandTotal / liters : 0,
    costPerBottle: units > 0 ? grandTotal / units : 0,
  };
}

// ---------------------------------------------------------------------------
// STEP 6 — GST ENGINE + PROFIT ENGINE
// Selling price can be entered per-Liter OR as a total batch selling price —
// both resolve to a single exact per-Liter figure before anything else runs.
// GST can be included in the entered price or added on top of it.
// ---------------------------------------------------------------------------
export function resolveSellingPricePerLiter({ mode, value, batchLiters }) {
  const v = safeNumber(value);
  if (mode === "total") {
    const liters = safeNumber(batchLiters);
    return liters > 0 ? v / liters : 0;
  }
  return v; // mode === "perLiter"
}

export function computeGst({ sellingPricePerLiter, gstMode, gstPercent }) {
  const price = safeNumber(sellingPricePerLiter);
  const pct = safeNumber(gstPercent);
  // "exclude" — price entered is net (pre-tax); GST is added on top.
  // "include" — price entered already has GST baked in; net price is backed out.
  const netPricePerLiter = gstMode === "include" ? price / (1 + pct / 100) : price;
  const gstAmountPerLiter = (netPricePerLiter * pct) / 100;
  const grossPricePerLiter = netPricePerLiter + gstAmountPerLiter;
  return { netPricePerLiter, gstAmountPerLiter, grossPricePerLiter, gstPercent: pct };
}

export function computeProfit({ netPricePerLiter, costPerLiter, batchLiters, bottleUnits }) {
  const price = safeNumber(netPricePerLiter);
  const cost = safeNumber(costPerLiter);
  const liters = safeNumber(batchLiters);
  const units = safeNumber(bottleUnits);

  const profitPerLiter = price - cost; // can be negative — that's a real loss, not clamped
  const netRevenue = price * liters;
  const netProfitTotal = profitPerLiter * liters;

  const marginPercent = price > 0 ? (profitPerLiter / price) * 100 : 0;
  const markupPercent = cost > 0 ? (profitPerLiter / cost) * 100 : 0;
  const roiPercent = cost > 0 ? (netProfitTotal / (cost * liters)) * 100 : 0;
  const profitPerBottle = units > 0 ? netProfitTotal / units : 0;
  // Contribution margin here = selling price minus the direct (variable) cost
  // per liter, expressed as a % of selling price — identical formula to
  // margin% for this single-product batch view, kept as its own named field
  // because "Contribution Margin" is a distinct line item in the spec.
  const contributionMarginPercent = marginPercent;

  return {
    profitPerLiter,
    profitPerBottle,
    netRevenue,
    netProfitTotal,
    marginPercent,
    markupPercent,
    roiPercent,
    contributionMarginPercent,
  };
}
