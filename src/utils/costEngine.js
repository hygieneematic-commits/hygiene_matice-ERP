import { toBaseUnit, unitType, round } from "./units";

/**
 * CORE ENGINE
 * Every cost/profit number shown anywhere in the app flows through these functions.
 * This guarantees that editing a raw material or packaging price instantly and
 * correctly ripples through Dashboard, Batch Calculator, Cost & Profit, and Reports.
 *
 * Base formulas are always defined for 1 Liter. Scaling to any batch size (including
 * custom quantities) is a straight multiplication because ratios are preserved.
 */

// Pick the most readable display unit for a base-unit (ml or gm) quantity
export function humanizeQuantity(baseQuantity, type) {
  if (type === "volume") {
    if (baseQuantity >= 1000) return { value: round(baseQuantity / 1000, 2), unit: "L" };
    return { value: round(baseQuantity, 1), unit: "ml" };
  }
  if (baseQuantity >= 1000) return { value: round(baseQuantity / 1000, 2), unit: "Kg" };
  return { value: round(baseQuantity, 1), unit: "gm" };
}

// Scale a formula's ingredients to a target batch size (in Liters)
export function scaleFormula(ingredients, batchLiters, rawMaterialsById) {
  return ingredients.map((ing) => {
    const rm = rawMaterialsById[ing.rawMaterialId];
    const type = rm ? rm.unitType : unitType(ing.unit);
    const baseQtyFor1L = toBaseUnit(ing.quantity, ing.unit); // ml or gm, for 1L base formula
    const scaledBaseQty = baseQtyFor1L * batchLiters;
    const display = humanizeQuantity(scaledBaseQty, type);
    return {
      ...ing,
      rawMaterialName: rm ? rm.name : "Unknown material",
      type,
      scaledBaseQty, // always ml or gm
      displayValue: display.value,
      displayUnit: display.unit,
    };
  });
}

// Cost of raw materials for a scaled formula
export function calculateRawMaterialCost(scaledIngredients, rawMaterialsById) {
  let total = 0;
  const breakdown = scaledIngredients.map((ing) => {
    const rm = rawMaterialsById[ing.rawMaterialId];
    if (!rm) return { ...ing, cost: 0, price: 0 };
    // Raw materials are priced per L (volume) or per Kg (weight)
    const largeUnitQty = ing.scaledBaseQty / 1000;
    const cost = largeUnitQty * rm.price;
    total += cost;
    return { ...ing, cost: round(cost, 2), price: rm.price };
  });
  return { total: round(total, 2), breakdown };
}

// Packaging cost, derived from the product's pack size + packaging BOM
export function calculatePackagingCost(product, batchLiters, packagingById) {
  if (!product.packSizeMl || !product.packagingBOM?.length) {
    return { total: 0, unitsProduced: 0, breakdown: [] };
  }
  const totalMl = batchLiters * 1000;
  const unitsProduced = Math.floor(totalMl / product.packSizeMl);
  let total = 0;
  const breakdown = product.packagingBOM.map((bom) => {
    const item = packagingById[bom.packagingId];
    if (!item) return { ...bom, cost: 0, name: "Unknown item" };
    const cost = unitsProduced * bom.qtyPerUnit * item.price;
    total += cost;
    return {
      ...bom,
      name: item.name,
      unitPrice: item.price,
      cost: round(cost, 2),
    };
  });
  return { total: round(total, 2), unitsProduced, breakdown };
}

// Fixed/overhead costs, scaled by batch size (or flat per batch), sourced from Settings defaults
export function calculateOverheadCost(batchLiters, settings) {
  const perBatch = settings.overheadMode === "perBatch";
  const multiplier = perBatch ? 1 : batchLiters;
  const labour = (settings.labourCostPerL || 0) * multiplier;
  const electricity = (settings.electricityCostPerL || 0) * multiplier;
  const transport = (settings.transportCostPerL || 0) * multiplier;
  const misc = (settings.miscCostPerL || 0) * multiplier;
  const total = labour + electricity + transport + misc;
  return {
    labour: round(labour, 2),
    electricity: round(electricity, 2),
    transport: round(transport, 2),
    misc: round(misc, 2),
    total: round(total, 2),
  };
}

/**
 * Full cost breakdown for a product at a given batch size.
 * This is THE function most pages should call.
 */
export function calculateFullCost({ product, formula, batchLiters, rawMaterialsById, packagingById, settings }) {
  const scaledIngredients = scaleFormula(formula?.ingredients || [], batchLiters, rawMaterialsById);
  const rawMaterialCost = calculateRawMaterialCost(scaledIngredients, rawMaterialsById);
  const packagingCost = calculatePackagingCost(product, batchLiters, packagingById);
  const overhead = calculateOverheadCost(batchLiters, settings);

  const totalCost = round(rawMaterialCost.total + packagingCost.total + overhead.total, 2);
  const costPerLiter = batchLiters > 0 ? round(totalCost / batchLiters, 2) : 0;
  const directCostPerLiter =
    batchLiters > 0 ? round((rawMaterialCost.total + packagingCost.total) / batchLiters, 2) : 0;

  return {
    scaledIngredients,
    rawMaterialCost,
    packagingCost,
    overhead,
    totalCost,
    costPerLiter,
    directCostPerLiter, // cost per liter excluding overheads (used for Gross Profit)
  };
}

/**
 * Selling price / GST / profit metrics.
 * sellingPrice is assumed to be PRE-GST (GST is added on top, collected & remitted separately).
 */
export function calculateSellingMetrics({ sellingPricePerL, costPerLiter, directCostPerLiter, batchLiters, settings }) {
  const cgstPercent = settings.cgstPercent ?? 9;
  const sgstPercent = settings.sgstPercent ?? 9;

  const cgstAmount = round((sellingPricePerL * cgstPercent) / 100, 2);
  const sgstAmount = round((sellingPricePerL * sgstPercent) / 100, 2);
  const totalGstPerL = round(cgstAmount + sgstAmount, 2);
  const priceWithGst = round(sellingPricePerL + totalGstPerL, 2);

  const netProfitPerL = round(sellingPricePerL - costPerLiter, 2);
  const grossProfitPerL = round(sellingPricePerL - directCostPerLiter, 2);

  const marginPercent = sellingPricePerL > 0 ? round((netProfitPerL / sellingPricePerL) * 100, 2) : 0;
  const markupPercent = costPerLiter > 0 ? round((netProfitPerL / costPerLiter) * 100, 2) : 0;

  return {
    cgstPercent,
    sgstPercent,
    cgstAmount,
    sgstAmount,
    totalGstPerL,
    priceWithGst,
    netProfitPerL,
    grossProfitPerL,
    marginPercent,
    markupPercent,
    netProfitTotal: round(netProfitPerL * batchLiters, 2),
    grossProfitTotal: round(grossProfitPerL * batchLiters, 2),
  };
}

// ---------------------------------------------------------------------------
// PACKAGING PLAN ENGINE
// A "Packaging Plan" is an ad-hoc list of { packagingKitId, qty } lines chosen
// at Batch Calculator / Production time. This lets one batch be split across
// several packaging sizes (e.g. 40 x 1L bottles + 2 x 5L cans) independent of
// any single product's default packaging BOM.
// ---------------------------------------------------------------------------

// Sum the editable cost components of a packaging kit into one per-unit price
export function kitUnitCost(kit) {
  if (!kit) return 0;
  const c = kit.costs || {};
  return round(
    (c.bottle || 0) +
      (c.cap || 0) +
      (c.label || 0) +
      (c.shrink || 0) +
      (c.innerBox || 0) +
      (c.outerCarton || 0) +
      (c.tape || 0),
    2
  );
}

// Cost + volume totals for a whole packaging plan
export function calculatePackagingPlanCost(planLines, kitsById) {
  let totalCost = 0;
  let totalMl = 0;
  const breakdown = (planLines || [])
    .filter((l) => l.packagingKitId && Number(l.qty) > 0)
    .map((line) => {
      const kit = kitsById[line.packagingKitId];
      if (!kit) return null;
      const unitCost = kitUnitCost(kit);
      const qty = Number(line.qty);
      const lineCost = round(unitCost * qty, 2);
      const lineMl = (kit.sizeMl || 0) * qty;
      totalCost += lineCost;
      totalMl += lineMl;
      return { ...line, qty, kit, unitCost, lineCost, lineMl };
    })
    .filter(Boolean);
  return { breakdown, totalCost: round(totalCost, 2), totalMl: round(totalMl, 0) };
}

// Per-packaging-type economics: cost, selling price, profit, margin & markup
// for one unit of a given pack size, given the batch's per-liter production
// cost (raw material + overhead, i.e. BEFORE packaging) and selling price/L.
export function calculatePackLineEconomics({ line, costPerLiterExclPackaging, sellingPricePerL }) {
  const sizeL = (line.kit?.sizeMl || 0) / 1000;
  const costPerUnit = round(costPerLiterExclPackaging * sizeL + line.unitCost, 2);
  const sellingPerUnit = round((sellingPricePerL || 0) * sizeL, 2);
  const profitPerUnit = round(sellingPerUnit - costPerUnit, 2);
  const marginPercent = sellingPerUnit > 0 ? round((profitPerUnit / sellingPerUnit) * 100, 2) : 0;
  const markupPercent = costPerUnit > 0 ? round((profitPerUnit / costPerUnit) * 100, 2) : 0;
  return { sizeL, costPerUnit, sellingPerUnit, profitPerUnit, marginPercent, markupPercent };
}

// Given a raw material id, find every product whose formula references it (for price-impact preview)
export function findAffectedProducts(rawMaterialId, formulasByProductId, products) {
  return products.filter((p) => {
    const formula = formulasByProductId[p.id];
    return formula?.ingredients?.some((ing) => ing.rawMaterialId === rawMaterialId);
  });
}

export function findAffectedProductsByPackaging(packagingId, products) {
  return products.filter((p) => p.packagingBOM?.some((b) => b.packagingId === packagingId));
}
