import { useAuthStore } from "../store/useAuthStore";

// Every route in the app, matched against Sidebar entries in components/layout/Sidebar.jsx
export const ALL_PAGES = [
  "/", "/products", "/formula-library", "/batch-calculator", "/raw-materials",
  "/packaging", "/production", "/inventory", "/reports",
  "/batch-history", "/users", "/audit-log", "/settings",
];

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

export function pageAllowed(role, path) {
  const perm = ROLE_PERMISSIONS[role];
  if (!perm) return false;
  if (perm.pages === "all") return true;
  // nested routes (e.g. /formula-library/:id) inherit their parent's permission
  return perm.pages.some((p) => path === p || path.startsWith(p + "/"));
}

export function usePermissions() {
  const user = useAuthStore((s) => s.currentUser);
  const role = user?.role || "Viewer";
  const perm = ROLE_PERMISSIONS[role] || ROLE_PERMISSIONS.Viewer;
  return { role, canEdit: !!perm.canEdit, pages: perm.pages, isPageAllowed: (path) => pageAllowed(role, path) };
}
