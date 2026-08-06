// Unit conversion helpers.
// Assumption (stated explicitly, confirmed acceptable for water-based cleaning formulations):
// density ≈ 1, so 1 ml ≈ 1 gm. This lets a single formula mix volume (ml/L) and
// weight (gm/Kg) ingredients and still scale together consistently.

export const VOLUME_UNITS = ["ml", "L"];
export const WEIGHT_UNITS = ["gm", "Kg"];
export const ALL_UNITS = [...VOLUME_UNITS, ...WEIGHT_UNITS];

export function unitType(unit) {
  if (VOLUME_UNITS.includes(unit)) return "volume";
  if (WEIGHT_UNITS.includes(unit)) return "weight";
  return "volume";
}

// Convert any supported unit quantity to its smallest base unit (ml for volume, gm for weight)
export function toBaseUnit(quantity, unit) {
  switch (unit) {
    case "L":
      return quantity * 1000; // -> ml
    case "ml":
      return quantity; // ml
    case "Kg":
      return quantity * 1000; // -> gm
    case "gm":
      return quantity; // gm
    default:
      return quantity;
  }
}

// Convert a base-unit quantity (ml or gm) to a target display unit
export function fromBaseUnit(baseQuantity, targetUnit) {
  switch (targetUnit) {
    case "L":
      return baseQuantity / 1000;
    case "ml":
      return baseQuantity;
    case "Kg":
      return baseQuantity / 1000;
    case "gm":
      return baseQuantity;
    default:
      return baseQuantity;
  }
}

// Convert a base-unit (ml or gm) quantity into the "large unit" used for raw material pricing
// (raw materials are always priced per L for volume items, per Kg for weight items)
export function baseToLargeUnit(baseQuantity, type) {
  return type === "volume" ? baseQuantity / 1000 : baseQuantity / 1000;
}

export function round(value, decimals = 2) {
  const factor = 10 ** decimals;
  return Math.round((value + Number.EPSILON) * factor) / factor;
}
