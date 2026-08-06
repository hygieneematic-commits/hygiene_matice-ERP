import { generateId } from "../utils/id";

function ing(rawMaterialId, quantity, unit) {
  return { id: generateId("ing"), rawMaterialId, quantity, unit };
}

// Each formula is defined for exactly 1 Liter of finished product.
// The 5 formulas below (Dishwash, Lemon Floor Cleaner, Toilet Cleaner, Glass
// Cleaner, White Phenyl) are transcribed directly from the uploaded
// "Hygiene Matic – 1 Liter Formulation Manual". Water quantities marked
// "Balance to 1 L" in the manual are computed here as the exact remainder.
export const seedFormulas = {
  // Dishwash Liquid — manual gives every quantity explicitly (no "balance" line)
  "prod-dishwash": [
    ing("rm-ro-water", 600, "ml"),
    ing("rm-acid-slurry", 70, "ml"),
    ing("rm-sles", 150, "ml"),
    ing("rm-caustic-soda", 16, "gm"),
    ing("rm-salt-thickener", 20, "gm"), // Sodium Sulphate
    ing("rm-perfume-lemon", 4, "ml"),
    ing("rm-yellow-colour-solution", 8, "ml"),
    ing("rm-preservative", 1, "ml"),
  ],
  // Floor Cleaner (original batch reference: 10 L)
  "prod-lemon-floor": [
    ing("rm-ro-water", 900, "ml"),
    ing("rm-sles", 50, "ml"),
    ing("rm-capb", 20, "ml"),
    ing("rm-alphox-200", 12, "ml"),
    ing("rm-citric-acid", 10, "gm"),
    ing("rm-ipa", 10, "ml"),
    ing("rm-edta", 1, "gm"),
    ing("rm-hydrogen-peroxide", 15, "ml"),
    ing("rm-perfume-lemon", 2, "ml"),
    ing("rm-preservative", 1, "ml"),
    ing("rm-color-yellow", 0.5, "gm"), // "Colour — as required"
  ],
  // Toilet Cleaner (original batch reference: 10 L) — RO Water is "Balance to 1 L"
  "prod-toilet-cleaner": [
    ing("rm-hcl", 150, "ml"),
    ing("rm-acid-thickener", 25, "ml"),
    ing("rm-citric-acid", 10, "gm"),
    ing("rm-acid-blue", 0.05, "gm"),
    ing("rm-toilet-fragrance", 0.5, "ml"),
    ing("rm-ro-water", 814.45, "ml"), // balance to 1 L
  ],
  // Glass Cleaner (original batch reference: 20 L) — RO Water is "Balance to 1 L"
  "prod-glass-cleaner": [
    ing("rm-ipa", 100, "ml"),
    ing("rm-capb", 8, "ml"),
    ing("rm-alphox-200", 4, "ml"),
    ing("rm-op-10", 2, "ml"),
    ing("rm-edta", 1, "gm"),
    ing("rm-perfume-floral", 1, "ml"),
    ing("rm-ocean-blue-colour", 0.1, "ml"),
    ing("rm-preservative", 2, "ml"),
    ing("rm-ro-water", 881.9, "ml"), // balance to 1 L
  ],
  // White Phenyl (original batch reference: 20 L) — RO Water is "Balance to 1 L"
  "prod-white-phenyl": [
    ing("rm-pine-oil", 35, "ml"),
    ing("rm-alphox-200", 5.5, "ml"),
    ing("rm-tro", 5, "ml"),
    ing("rm-sles", 4.5, "ml"),
    ing("rm-ro-water", 950, "ml"), // balance to 1 L
  ],

  // Not covered by the uploaded manual yet — kept as reasonable working formulas
  "prod-rose-floor": [
    ing("rm-ro-water", 780, "ml"),
    ing("rm-sles", 50, "gm"),
    ing("rm-capb", 30, "gm"),
    ing("rm-perfume-rose", 5, "ml"),
    ing("rm-edta", 2, "gm"),
    ing("rm-citric-acid", 1, "gm"),
    ing("rm-color-pink", 0.2, "gm"),
    ing("rm-preservative", 1, "ml"),
  ],
  "prod-handwash": [
    ing("rm-ro-water", 750, "ml"),
    ing("rm-sles", 80, "gm"),
    ing("rm-capb", 50, "gm"),
    ing("rm-glycerin", 20, "ml"),
    ing("rm-perfume-floral", 5, "ml"),
    ing("rm-color-pink", 0.2, "gm"),
    ing("rm-preservative", 1, "ml"),
  ],
  "prod-black-phenyl": [
    ing("rm-ro-water", 500, "ml"),
    ing("rm-pine-oil", 250, "ml"),
    ing("rm-ipa", 50, "ml"),
    ing("rm-capb", 30, "gm"),
    ing("rm-perfume-floral", 5, "ml"),
    ing("rm-color-black", 1, "gm"),
  ],
};
