// Each material carries GST fields so the ERP can show Base Price, GST % and
// GST-Inclusive Final Price separately (Raw Material Price with GST — spec §11).
// `price` is always kept in sync as the GST-inclusive final price and is the
// number every cost calculation actually uses.
// Values below are synced with the uploaded "Hygiene Matic – Raw Material &
// Packaging Master" where a matching item exists; unmatched legacy materials
// (perfumes, colors, water, etc.) keep their original working prices with GST
// left off (0%) since the master doesn't cover them yet — editable any time.
function rm({ id, name, unitType, basePrice, gstPercent = 0, includeGst = false, stock, minStock, supplier }) {
  const gstAmount = includeGst ? Math.round(basePrice * gstPercent) / 100 : 0;
  const price = Math.round((basePrice + gstAmount) * 100) / 100;
  return { id, name, unitType, basePrice, gstPercent, includeGst, price, stock, minStock, supplier };
}

export const seedRawMaterials = [
  rm({ id: "rm-ro-water", name: "RO Water", unitType: "volume", basePrice: 1, stock: 5000, minStock: 500, supplier: "In-house RO Plant" }),
  rm({ id: "rm-sles", name: "SLES", unitType: "volume", basePrice: 95, gstPercent: 18, includeGst: true, stock: 220, minStock: 40, supplier: "Chem Source India" }),
  rm({ id: "rm-capb", name: "CAPB", unitType: "volume", basePrice: 115, gstPercent: 18, includeGst: true, stock: 90, minStock: 20, supplier: "Chem Source India" }),
  rm({ id: "rm-perfume-lemon", name: "Lemon Fragrance", unitType: "volume", basePrice: 1200, stock: 25, minStock: 5, supplier: "Aroma Concepts" }),
  rm({ id: "rm-perfume-rose", name: "Perfume — Rose", unitType: "volume", basePrice: 900, stock: 18, minStock: 5, supplier: "Aroma Concepts" }),
  rm({ id: "rm-perfume-floral", name: "Perfume — Floral", unitType: "volume", basePrice: 820, stock: 22, minStock: 5, supplier: "Aroma Concepts" }),
  rm({ id: "rm-edta", name: "EDTA", unitType: "weight", basePrice: 440, stock: 25, minStock: 5, supplier: "Chem Source India" }),
  rm({ id: "rm-citric-acid", name: "Citric Acid", unitType: "weight", basePrice: 98, gstPercent: 18, includeGst: true, stock: 45, minStock: 10, supplier: "Chem Source India" }),
  rm({ id: "rm-color-yellow", name: "Color — Yellow (Synthetic Lemon Yellow)", unitType: "weight", basePrice: 1690, stock: 6, minStock: 2, supplier: "Colorlab Pigments" }),
  rm({ id: "rm-color-pink", name: "Color — Pink", unitType: "weight", basePrice: 460, stock: 5, minStock: 2, supplier: "Colorlab Pigments" }),
  rm({ id: "rm-color-blue", name: "Color — Blue", unitType: "weight", basePrice: 470, stock: 4.5, minStock: 2, supplier: "Colorlab Pigments" }),
  rm({ id: "rm-color-green", name: "Color — Green", unitType: "weight", basePrice: 455, stock: 5.5, minStock: 2, supplier: "Colorlab Pigments" }),
  rm({ id: "rm-color-black", name: "Color — Black", unitType: "weight", basePrice: 440, stock: 3, minStock: 2, supplier: "Colorlab Pigments" }),
  rm({ id: "rm-preservative", name: "Preservative", unitType: "volume", basePrice: 240, stock: 15, minStock: 3, supplier: "Chem Source India" }),
  rm({ id: "rm-ipa", name: "IPA (Isopropyl Alcohol)", unitType: "volume", basePrice: 110, gstPercent: 18, includeGst: true, stock: 60, minStock: 15, supplier: "Petro Chem Distributors" }),
  rm({ id: "rm-ammonia", name: "Ammonia Solution", unitType: "volume", basePrice: 65, stock: 30, minStock: 8, supplier: "Chem Source India" }),
  rm({ id: "rm-hcl", name: "HCL (Hydrochloric Acid)", unitType: "volume", basePrice: 18, gstPercent: 18, includeGst: true, stock: 80, minStock: 20, supplier: "Petro Chem Distributors" }),
  rm({ id: "rm-pine-oil", name: "Pine Oil", unitType: "volume", basePrice: 180, gstPercent: 18, includeGst: true, stock: 40, minStock: 10, supplier: "Aroma Concepts" }),
  rm({ id: "rm-caustic-soda", name: "Caustic Soda", unitType: "weight", basePrice: 66, stock: 35, minStock: 8, supplier: "Chem Source India" }),
  rm({ id: "rm-glycerin", name: "Glycerin", unitType: "volume", basePrice: 210, stock: 20, minStock: 5, supplier: "Chem Source India" }),
  rm({ id: "rm-salt-thickener", name: "Sodium Sulphate (Thickener)", unitType: "weight", basePrice: 20, stock: 100, minStock: 20, supplier: "Local Supplier" }),
  // Additional materials from the uploaded Raw Material Master (not yet used in a
  // formula — available in the Raw Material Library for new/edited formulations)
  rm({ id: "rm-alphox-200", name: "Alphox 200", unitType: "volume", basePrice: 183, gstPercent: 18, includeGst: true, stock: 30, minStock: 8, supplier: "Chem Source India" }),
  rm({ id: "rm-acid-thickener", name: "Acid Thickener", unitType: "volume", basePrice: 345, gstPercent: 18, includeGst: true, stock: 20, minStock: 5, supplier: "Chem Source India" }),
  rm({ id: "rm-tro", name: "TRO", unitType: "volume", basePrice: 105, gstPercent: 5, includeGst: true, stock: 25, minStock: 5, supplier: "Chem Source India" }),
  rm({ id: "rm-op-10", name: "OP-10 / Polysorbate-80", unitType: "volume", basePrice: 300, stock: 15, minStock: 5, supplier: "Chem Source India" }),
  rm({ id: "rm-hydrogen-peroxide", name: "Hydrogen Peroxide", unitType: "volume", basePrice: 35, gstPercent: 18, includeGst: true, stock: 25, minStock: 5, supplier: "Chem Source India" }),
];
