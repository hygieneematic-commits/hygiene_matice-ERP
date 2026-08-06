import { useAuthStore } from "../store/useAuthStore";

// Every route in the app, matched against Sidebar entries in components/layout/Sidebar.jsx
export const ALL_PAGES = [
  "/", "/products", "/formula-library", "/batch-calculator", "/raw-materials",
  "/packaging", "/production", "/inventory", "/reports",
  "/batch-history", "/users", "/audit-log", "/settings",
];

// Friendly labels for the per-user access checklist in the Users page.
export const PAGE_LABELS = {
  "/": "Dashboard",
  "/products": "Products",
  "/formula-library": "Formula Library",
  "/batch-calculator": "Batch Calculator",
  "/raw-materials": "Raw Materials",
  "/packaging": "Packaging",
  "/production": "Production",
  "/inventory": "Inventory",
  "/reports": "Reports",
  "/batch-history": "Batch History",
  "/users": "Users",
  "/audit-log": "Audit Log",
  "/settings": "Settings",
};

// pages: "all" or an explicit array of allowed route paths (formula-library/:productId
// and any other nested route is allowed automatically whenever its parent list entry is).
// canEdit: false means the role can view but every Add/Edit/Delete/Save action is hidden ("Viewer").
export const ROLE_PERMISSIONS = {
  "Super Admin": { pages: "all", canEdit: true, description: "Full access to every module" },
  "Admin": { pages: "all", canEdit: true, description: "Almost full access" },
  "Production Manager": {
    pages: ["/", "/products", "/formula-library", "/batch-calculator", "/production", "/batch-history"],
    canEdit: true,
    description: "Production only",
  },
  "Production Staff": {
    pages: ["/", "/batch-calculator", "/production", "/batch-history"],
    canEdit: true,
    description: "Production only",
  },
  "Inventory Manager": {
    pages: ["/", "/inventory", "/raw-materials", "/packaging"],
    canEdit: true,
    description: "Inventory only",
  },
  "Sales Manager": {
    pages: ["/", "/products", "/reports"],
    canEdit: true,
    description: "Sales only",
  },
  "Purchase Manager": {
    pages: ["/", "/raw-materials", "/packaging", "/inventory"],
    canEdit: true,
    description: "Purchase & raw materials",
  },
  "Quality Control": {
    pages: ["/", "/production", "/batch-history"],
    canEdit: true,
    description: "Quality check only",
  },
  "Viewer": {
    pages: ["/", "/production", "/batch-history", "/raw-materials", "/reports"],
    canEdit: false,
    description: "Read only",
  },
};

export function pageAllowed(role, path, overridePages) {
  // A per-user override (set by Super Admin in the Users page) always wins
  // over the role default — lets Super Admin grant/restrict access for one
  // specific person without having to invent a whole new role for them.
  const pages = overridePages ?? ROLE_PERMISSIONS[role]?.pages;
  if (!pages) return false;
  if (pages === "all") return true;
  // nested routes (e.g. /formula-library/:id) inherit their parent's permission
  return pages.some((p) => path === p || path.startsWith(p + "/"));
}

export function usePermissions() {
  const user = useAuthStore((s) => s.currentUser);
  const role = user?.role || "Viewer";
  const perm = ROLE_PERMISSIONS[role] || ROLE_PERMISSIONS.Viewer;
  const overridePages = user?.pageOverrides ?? null;
  const effectivePages = overridePages ?? perm.pages;
  return {
    role,
    canEdit: !!perm.canEdit,
    pages: effectivePages,
    isPageAllowed: (path) => pageAllowed(role, path, overridePages),
  };
}
