import { generateId } from "../utils/id";

function ing(rawMaterialId, quantity, unit) {
  return { id: generateId("ing"), rawMaterialId, quantity, unit };
}

// Each formula is defined for exactly 1 Liter of finished product.
export const seedFormulas = {
  "prod-lemon-floor": [
    ing("rm-ro-water", 780, "ml"),
    ing("rm-sles", 50, "gm"),
    ing("rm-capb", 30, "gm"),
    ing("rm-perfume-lemon", 5, "ml"),
    ing("rm-edta", 2, "gm"),
    ing("rm-citric-acid", 1, "gm"),
    ing("rm-color-yellow", 0.2, "gm"),
    ing("rm-preservative", 1, "ml"),
  ],
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
  "prod-glass-cleaner": [
    ing("rm-ro-water", 700, "ml"),
    ing("rm-ipa", 150, "ml"),
    ing("rm-ammonia", 30, "ml"),
    ing("rm-sles", 10, "gm"),
    ing("rm-perfume-floral", 3, "ml"),
    ing("rm-color-blue", 0.1, "gm"),
    ing("rm-preservative", 1, "ml"),
  ],
  "prod-toilet-cleaner": [
    ing("rm-ro-water", 650, "ml"),
    ing("rm-hcl", 200, "ml"),
    ing("rm-sles", 20, "gm"),
    ing("rm-perfume-floral", 4, "ml"),
    ing("rm-color-blue", 0.2, "gm"),
    ing("rm-salt-thickener", 10, "gm"),
  ],
  "prod-dishwash": [
    ing("rm-ro-water", 700, "ml"),
    ing("rm-sles", 120, "gm"),
    ing("rm-capb", 40, "gm"),
    ing("rm-caustic-soda", 5, "gm"),
    ing("rm-perfume-lemon", 4, "ml"),
    ing("rm-color-green", 0.3, "gm"),
    ing("rm-preservative", 1, "ml"),
    ing("rm-salt-thickener", 15, "gm"),
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
  "prod-white-phenyl": [
    ing("rm-ro-water", 500, "ml"),
    ing("rm-pine-oil", 300, "ml"),
    ing("rm-ipa", 50, "ml"),
    ing("rm-capb", 30, "gm"),
    ing("rm-perfume-floral", 5, "ml"),
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
