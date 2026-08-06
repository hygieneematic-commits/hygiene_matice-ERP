// A "Packaging Kit" is a complete, ready-to-fill packaging TYPE — e.g. "1 Liter
// Bottle" — used when planning how a batch is split across pack sizes
// (Batch Calculator §1/§2/§10, Packaging Master §9). Each cost component below
// is independently editable; `price` is always the sum of all components.
function kit({ id, name, sizeMl, category, costs, stock, minStock }) {
  const price =
    Math.round(
      ((costs.bottle || 0) +
        (costs.cap || 0) +
        (costs.label || 0) +
        (costs.shrink || 0) +
        (costs.innerBox || 0) +
        (costs.outerCarton || 0) +
        (costs.tape || 0)) *
        100
    ) / 100;
  return { id, name, sizeMl, category, costs, price, stock, minStock };
}

// Costs synced directly with the uploaded "Hygiene Matic – Raw Material &
// Packaging Master" (All Inclusive bottle/can cost + matching sticker cost).
// Generic larger sizes not in the master (2L / 20L / 25L / 50L / 200L) are
// added as sensible starting points — every value is editable in Packaging Master.
export const seedPackagingKits = [
  kit({
    id: "kit-dishwash-500",
    name: "Dishwash Bottle + Pump — 500ml",
    sizeMl: 500,
    category: "Bottle",
    costs: { bottle: 22.0, cap: 0, label: 3.17, shrink: 0, innerBox: 0, outerCarton: 0, tape: 0 },
    stock: 2000,
    minStock: 300,
  }),
  kit({
    id: "kit-floor-500",
    name: "Floor Cleaner Bottle — 500ml",
    sizeMl: 500,
    category: "Bottle",
    costs: { bottle: 11.0, cap: 0, label: 3.17, shrink: 0, innerBox: 0, outerCarton: 0, tape: 0 },
    stock: 2500,
    minStock: 300,
  }),
  kit({
    id: "kit-toilet-500",
    name: "Toilet Cleaner Bottle — 500ml",
    sizeMl: 500,
    category: "Bottle",
    costs: { bottle: 12.13, cap: 0, label: 2.5, shrink: 0, innerBox: 0, outerCarton: 0, tape: 0 },
    stock: 2000,
    minStock: 300,
  }),
  kit({
    id: "kit-glass-500",
    name: "Glass Cleaner Bottle — 500ml",
    sizeMl: 500,
    category: "Bottle",
    costs: { bottle: 22.0, cap: 0, label: 2.5, shrink: 0, innerBox: 0, outerCarton: 0, tape: 0 },
    stock: 1800,
    minStock: 300,
  }),
  kit({
    id: "kit-bottle-1l",
    name: "1 Liter Bottle",
    sizeMl: 1000,
    category: "Bottle",
    costs: { bottle: 9.5, cap: 0, label: 3.5, shrink: 0, innerBox: 0, outerCarton: 0, tape: 0 },
    stock: 1500,
    minStock: 300,
  }),
  kit({
    id: "kit-bottle-2l",
    name: "2 Liter Bottle",
    sizeMl: 2000,
    category: "Bottle",
    costs: { bottle: 16, cap: 1.2, label: 4, shrink: 0, innerBox: 0, outerCarton: 0, tape: 0 },
    stock: 800,
    minStock: 150,
  }),
  kit({
    id: "kit-hdpe-5l",
    name: "5 Liter HDPE Can",
    sizeMl: 5000,
    category: "Can",
    costs: { bottle: 55.0, cap: 0, label: 2.5, shrink: 0, innerBox: 0, outerCarton: 0, tape: 0 },
    stock: 600,
    minStock: 100,
  }),
  kit({
    id: "kit-pet-5l",
    name: "5 Liter PET Can",
    sizeMl: 5000,
    category: "Can",
    costs: { bottle: 26.0, cap: 0, label: 2.5, shrink: 0, innerBox: 0, outerCarton: 0, tape: 0 },
    stock: 500,
    minStock: 100,
  }),
  kit({
    id: "kit-dishwash-5l-hdpe",
    name: "5 Liter Dishwash Can (HDPE + Pump)",
    sizeMl: 5000,
    category: "Can",
    costs: { bottle: 62.0, cap: 8.0, label: 3.0, shrink: 0, innerBox: 0, outerCarton: 0, tape: 0 },
    stock: 200,
    minStock: 40,
  }),
  kit({
    id: "kit-dishwash-5l-pet",
    name: "5 Liter Dishwash Jar (PET + Pump)",
    sizeMl: 5000,
    category: "Can",
    costs: { bottle: 32.0, cap: 8.0, label: 3.0, shrink: 0, innerBox: 0, outerCarton: 0, tape: 0 },
    stock: 150,
    minStock: 30,
  }),
  kit({
    id: "kit-can-20l",
    name: "20 Liter Can",
    sizeMl: 20000,
    category: "Can",
    costs: { bottle: 95, cap: 3, label: 6, shrink: 0, innerBox: 0, outerCarton: 0, tape: 0 },
    stock: 200,
    minStock: 40,
  }),
  kit({
    id: "kit-gallon-25l",
    name: "25 Liter Gallon",
    sizeMl: 25000,
    category: "Gallon",
    costs: { bottle: 140, cap: 4, label: 7, shrink: 0, innerBox: 0, outerCarton: 0, tape: 0 },
    stock: 120,
    minStock: 25,
  }),
  kit({
    id: "kit-gallon-50l",
    name: "50 Liter Gallon",
    sizeMl: 50000,
    category: "Gallon",
    costs: { bottle: 220, cap: 6, label: 9, shrink: 0, innerBox: 0, outerCarton: 0, tape: 0 },
    stock: 60,
    minStock: 15,
  }),
  kit({
    id: "kit-drum-200l",
    name: "200 Liter Drum",
    sizeMl: 200000,
    category: "Drum",
    costs: { bottle: 650, cap: 15, label: 0, shrink: 0, innerBox: 0, outerCarton: 0, tape: 0 },
    stock: 20,
    minStock: 5,
  }),
];
