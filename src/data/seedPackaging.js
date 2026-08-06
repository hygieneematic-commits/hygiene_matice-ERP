// price = price per piece (or per roll for Tape). capacityMl = bottle/container
// volume (for Bottle items only). capacityUnits = how many bottles one carton
// holds (for Carton items only). Both are used by the Batch Calculator's
// component-based packaging builder to auto-calculate quantities needed.
// IDs pkg-bottle-250/500/1000, pkg-cap, pkg-label, pkg-shrink, pkg-carton,
// pkg-tape are referenced by product packagingBOM — kept stable.
export const seedPackaging = [
  // ---------------- Bottles / Containers ----------------
  { id: "pkg-bottle-250", name: "Bottle — 250ml", price: 5.5, stock: 3000, minStock: 500, category: "Bottle", capacityMl: 250, active: true },
  { id: "pkg-bottle-500", name: "Bottle — 500ml (Generic)", price: 8.5, stock: 4000, minStock: 600, category: "Bottle", capacityMl: 500, active: true },
  { id: "pkg-bottle-dishwash-500", name: "Dishwash Bottle + Pump — 500ml", price: 22.0, stock: 1000, minStock: 200, category: "Bottle", capacityMl: 500, active: true },
  { id: "pkg-bottle-floor-500", name: "Floor Cleaner Bottle — 500ml", price: 11.0, stock: 1500, minStock: 300, category: "Bottle", capacityMl: 500, active: true },
  { id: "pkg-bottle-toilet-500", name: "Toilet Cleaner Bottle — 500ml", price: 12.13, stock: 1500, minStock: 300, category: "Bottle", capacityMl: 500, active: true },
  { id: "pkg-bottle-glass-500", name: "Glass Cleaner Bottle — 500ml", price: 22.0, stock: 1000, minStock: 200, category: "Bottle", capacityMl: 500, active: true },
  { id: "pkg-bottle-1000", name: "Bottle — 1 Liter (Generic)", price: 12, stock: 1500, minStock: 300, category: "Bottle", capacityMl: 1000, active: true },
  { id: "pkg-bottle-phenyl-1000", name: "White Phenyl Bottle — 1 Liter", price: 9.5, stock: 1200, minStock: 250, category: "Bottle", capacityMl: 1000, active: true },
  { id: "pkg-bottle-2000", name: "Bottle — 2 Liter", price: 18.0, stock: 600, minStock: 100, category: "Bottle", capacityMl: 2000, active: true },
  { id: "pkg-can-hdpe-5l", name: "5 Liter HDPE Can", price: 55.0, stock: 600, minStock: 100, category: "Bottle", capacityMl: 5000, active: true },
  { id: "pkg-jar-pet-5l", name: "5 Liter PET Jar", price: 26.0, stock: 500, minStock: 100, category: "Bottle", capacityMl: 5000, active: true },
  { id: "pkg-can-dishwash-hdpe-5l", name: "5 Liter Dishwash Can (HDPE + Pump)", price: 62.0, stock: 200, minStock: 40, category: "Bottle", capacityMl: 5000, active: true },
  { id: "pkg-jar-dishwash-pet-5l", name: "5 Liter Dishwash Jar (PET + Pump)", price: 32.0, stock: 150, minStock: 30, category: "Bottle", capacityMl: 5000, active: true },
  { id: "pkg-can-20l", name: "Can — 20 Liter", price: 95.0, stock: 150, minStock: 30, category: "Bottle", capacityMl: 20000, active: true },
  { id: "pkg-gallon-25l", name: "Gallon — 25 Liter", price: 120.0, stock: 100, minStock: 20, category: "Bottle", capacityMl: 25000, active: true },
  { id: "pkg-gallon-50l", name: "Gallon — 50 Liter", price: 220.0, stock: 60, minStock: 15, category: "Bottle", capacityMl: 50000, active: true },
  { id: "pkg-drum-200l", name: "Drum — 200 Liter", price: 650.0, stock: 25, minStock: 5, category: "Bottle", capacityMl: 200000, active: true },

  // ---------------- Stickers / Labels ----------------
  { id: "pkg-label", name: "Printed Label (Generic)", price: 0.8, stock: 8000, minStock: 1000, category: "Label", active: true },
  { id: "pkg-sticker-dishwash-floor-500", name: "Dishwash / Floor Cleaner Sticker — 500ml", price: 3.17, stock: 2000, minStock: 400, category: "Label", active: true },
  { id: "pkg-sticker-toilet-glass-500", name: "Toilet / Glass Cleaner Sticker — 500ml", price: 2.5, stock: 2000, minStock: 400, category: "Label", active: true },
  { id: "pkg-sticker-1l", name: "Sticker — 1 Liter", price: 3.5, stock: 1500, minStock: 300, category: "Label", active: true },
  { id: "pkg-sticker-2l", name: "Sticker — 2 Liter", price: 4.5, stock: 800, minStock: 150, category: "Label", active: true },
  { id: "pkg-sticker-5l", name: "Sticker — 5 Liter", price: 2.5, stock: 1000, minStock: 200, category: "Label", active: true },
  { id: "pkg-sticker-20l", name: "Sticker — 20 Liter", price: 6.0, stock: 200, minStock: 40, category: "Label", active: true },
  { id: "pkg-sticker-25l", name: "Sticker — 25 Liter", price: 7.0, stock: 150, minStock: 30, category: "Label", active: true },
  { id: "pkg-sticker-50l", name: "Sticker — 50 Liter", price: 9.0, stock: 100, minStock: 20, category: "Label", active: true },
  { id: "pkg-sticker-200l", name: "Sticker — 200 Liter", price: 15.0, stock: 40, minStock: 10, category: "Label", active: true },

  // ---------------- Cartons / Boxes (capacityUnits = bottles held) ----------------
  { id: "pkg-carton-6", name: "6 Bottle Carton", price: 22.0, stock: 500, minStock: 80, category: "Carton", capacityUnits: 6, active: true },
  { id: "pkg-carton", name: "12 Bottle Carton", price: 18, stock: 400, minStock: 60, category: "Carton", capacityUnits: 12, active: true },
  { id: "pkg-carton-24", name: "24 Bottle Carton", price: 65.0, stock: 250, minStock: 40, category: "Carton", capacityUnits: 24, active: true },
  { id: "pkg-carton-5l", name: "5 Liter Carton (holds 4 cans)", price: 35.0, stock: 150, minStock: 30, category: "Carton", capacityUnits: 4, active: true },
  { id: "pkg-carton-20l", name: "20 Liter Carton", price: 15.0, stock: 80, minStock: 15, category: "Carton", capacityUnits: 1, active: true },
  { id: "pkg-carton-25l", name: "25 Liter Carton", price: 18.0, stock: 60, minStock: 10, category: "Carton", capacityUnits: 1, active: true },
  { id: "pkg-carton-50l", name: "50 Liter Carton", price: 25.0, stock: 40, minStock: 10, category: "Carton", capacityUnits: 1, active: true },

  // ---------------- Tape ----------------
  { id: "pkg-tape", name: "Small Tape", price: 8.0, stock: 400, minStock: 60, category: "Tape", active: true },
  { id: "pkg-tape-medium", name: "Medium Tape", price: 12.0, stock: 300, minStock: 50, category: "Tape", active: true },
  { id: "pkg-tape-large", name: "Large Tape", price: 18.0, stock: 200, minStock: 40, category: "Tape", active: true },
  { id: "pkg-tape-brown", name: "Brown Tape", price: 10.0, stock: 300, minStock: 50, category: "Tape", active: true },
  { id: "pkg-tape-transparent", name: "Transparent Tape", price: 10.0, stock: 300, minStock: 50, category: "Tape", active: true },

  // ---------------- Caps ----------------
  { id: "pkg-cap", name: "Flip-top Cap", price: 1.2, stock: 8000, minStock: 1000, category: "Cap", active: true },
  { id: "pkg-cap-screw", name: "Screw Cap", price: 1.5, stock: 4000, minStock: 600, category: "Cap", active: true },
  { id: "pkg-cap-pump", name: "Pump Cap (5L Dishwash)", price: 8.0, stock: 400, minStock: 80, category: "Cap", active: true },

  // ---------------- Shrink Film ----------------
  { id: "pkg-shrink", name: "Shrink Sleeve (per bottle)", price: 0.6, stock: 6000, minStock: 800, category: "Shrink", active: true },
  { id: "pkg-shrink-bulk", name: "Shrink Film (bulk wrap, per carton)", price: 1.5, stock: 800, minStock: 150, category: "Shrink", active: true },
];
