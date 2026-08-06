export const seedSettings = {
  companyName: "Hygiene Matic",
  tagline: "Manufacturing OS for Cleaning Products",
  gstin: "27ABCDE1234F1Z5",
  address: "Plot 14, MIDC Industrial Area, Pune, Maharashtra — 411019",
  cgstPercent: 9,
  sgstPercent: 9,
  labourCostPerL: 4,
  electricityCostPerL: 1.5,
  transportCostPerL: 2,
  miscCostPerL: 1,
  overheadMode: "perLiter", // "perLiter" | "perBatch" — spec §12 Other Charges
  currency: "INR",
  theme: "light",
};

export const seedUsers = [
  { id: "user-1", name: "Aarav Sharma", username: "aarav", password: "admin123", email: "aarav@hygienematic.in", mobile: "9820011223", employeeId: "HM-001", department: "Management", role: "Super Admin", active: true, lastLogin: null },
  { id: "user-2", name: "Priya Deshmukh", username: "priya", password: "priya123", email: "priya@hygienematic.in", mobile: "9820011224", employeeId: "HM-002", department: "Production", role: "Production Manager", active: true, lastLogin: null },
  { id: "user-3", name: "Rohit Kulkarni", username: "rohit", password: "rohit123", email: "rohit@hygienematic.in", mobile: "9820011225", employeeId: "HM-003", department: "Sales", role: "Sales Manager", active: true, lastLogin: null },
  { id: "user-4", name: "Sneha Patil", username: "sneha", password: "sneha123", email: "sneha@hygienematic.in", mobile: "9820011226", employeeId: "HM-004", department: "Production", role: "Production Staff", active: true, lastLogin: null },
  { id: "user-5", name: "Kavita Joshi", username: "kavita", password: "kavita123", email: "kavita@hygienematic.in", mobile: "9820011227", employeeId: "HM-005", department: "Inventory", role: "Inventory Manager", active: true, lastLogin: null },
  { id: "user-6", name: "Manoj Rane", username: "manoj", password: "manoj123", email: "manoj@hygienematic.in", mobile: "9820011228", employeeId: "HM-006", department: "Quality", role: "Quality Control", active: true, lastLogin: null },
];

// Batch history starts empty — this is a live production deployment now,
// not a demo. Real batches accumulate here as the factory actually runs
// them, via New Production Batch.
export const seedBatchHistory = [];
