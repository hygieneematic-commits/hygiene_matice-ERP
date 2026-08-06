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

// Batch history — pre-populated so Dashboard, Reports & Batch History aren't empty on first run
export const seedBatchHistory = [
  { id: "batch-1", batchNumber: "HM-LEM-260715-241", productId: "prod-lemon-floor", quantityL: 50, operator: "Sneha Patil", yieldPercent: 98.5, status: "completed", date: "2026-07-15T10:30:00Z", notes: "Standard run, no issues." },
  { id: "batch-2", batchNumber: "HM-DSH-260716-118", productId: "prod-dishwash", quantityL: 100, operator: "Sneha Patil", yieldPercent: 97.2, status: "completed", date: "2026-07-16T11:00:00Z", notes: "" },
  { id: "batch-3", batchNumber: "HM-GLC-260718-372", productId: "prod-glass-cleaner", quantityL: 20, operator: "Priya Deshmukh", yieldPercent: 99.0, status: "completed", date: "2026-07-18T09:15:00Z", notes: "Small trial batch for new distributor." },
  { id: "batch-4", batchNumber: "HM-TLT-260720-556", productId: "prod-toilet-cleaner", quantityL: 50, operator: "Sneha Patil", yieldPercent: 96.8, status: "completed", date: "2026-07-20T14:00:00Z", notes: "" },
  { id: "batch-5", batchNumber: "HM-ROS-260722-903", productId: "prod-rose-floor", quantityL: 37, operator: "Sneha Patil", yieldPercent: 98.1, status: "completed", date: "2026-07-22T10:00:00Z", notes: "Custom quantity for bulk order." },
  { id: "batch-6", batchNumber: "HM-HWS-260725-447", productId: "prod-handwash", quantityL: 20, operator: "Priya Deshmukh", yieldPercent: 99.4, status: "completed", date: "2026-07-25T12:30:00Z", notes: "" },
  { id: "batch-7", batchNumber: "HM-WPH-260728-812", productId: "prod-white-phenyl", quantityL: 100, operator: "Sneha Patil", yieldPercent: 97.9, status: "completed", date: "2026-07-28T09:45:00Z", notes: "" },
  { id: "batch-8", batchNumber: "HM-BPH-260730-265", productId: "prod-black-phenyl", quantityL: 50, operator: "Sneha Patil", yieldPercent: 98.0, status: "completed", date: "2026-07-30T13:20:00Z", notes: "" },
  { id: "batch-9", batchNumber: "HM-LEM-260801-609", productId: "prod-lemon-floor", quantityL: 100, operator: "Priya Deshmukh", yieldPercent: 98.7, status: "completed", date: "2026-08-01T10:00:00Z", notes: "" },
  { id: "batch-10", batchNumber: "HM-DSH-260802-134", productId: "prod-dishwash", quantityL: 50, operator: "Sneha Patil", yieldPercent: 97.5, status: "completed", date: "2026-08-02T11:30:00Z", notes: "" },
  // "Today" batch — dated dynamically so the Dashboard always has live activity to show, regardless of when the app is opened
  {
    id: "batch-11",
    batchNumber: "HM-LEM-TODAY-001",
    productId: "prod-lemon-floor",
    quantityL: 60,
    operator: "Sneha Patil",
    yieldPercent: 98.3,
    status: "completed",
    date: new Date(new Date().setHours(9, 30, 0, 0)).toISOString(),
    notes: "",
  },
  {
    id: "batch-12",
    batchNumber: "HM-DSH-TODAY-002",
    productId: "prod-dishwash",
    quantityL: 40,
    operator: "Priya Deshmukh",
    yieldPercent: 97.8,
    status: "completed",
    date: new Date(new Date().setHours(11, 15, 0, 0)).toISOString(),
    notes: "",
  },
];
