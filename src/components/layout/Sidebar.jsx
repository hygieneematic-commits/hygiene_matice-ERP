import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Package,
  FlaskConical,
  Calculator,
  Boxes,
  PackageOpen,
  Factory,
  Warehouse,
  FileBarChart,
  History,
  Users,
  Settings,
  Droplets,
  X,
  ClipboardList,
  LogOut,
} from "lucide-react";
import clsx from "clsx";
import { usePermissions } from "../../utils/permissions";
import { useAuthStore } from "../../store/useAuthStore";

const navItems = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/products", label: "Products", icon: Package },
  { to: "/formula-library", label: "Formula Library", icon: FlaskConical },
  { to: "/batch-calculator", label: "Batch Calculator", icon: Calculator },
  { to: "/raw-materials", label: "Raw Materials", icon: Boxes },
  { to: "/packaging", label: "Packaging", icon: PackageOpen },
  { to: "/production", label: "Production", icon: Factory },
  { to: "/inventory", label: "Inventory", icon: Warehouse },
  { to: "/reports", label: "Reports", icon: FileBarChart },
  { to: "/batch-history", label: "Batch History", icon: History },
  { to: "/users", label: "Users", icon: Users },
  { to: "/audit-log", label: "Audit Log", icon: ClipboardList },
  { to: "/settings", label: "Settings", icon: Settings },
];

export default function Sidebar({ open, onClose, className }) {
  const { role, isPageAllowed } = usePermissions();
  const logout = useAuthStore((s) => s.logout);
  const navigate = useNavigate();
  const visibleItems = navItems.filter((item) => isPageAllowed(item.to));

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <>
      {open && (
        <div className="fixed inset-0 bg-ink-900/40 z-40 lg:hidden" onClick={onClose} />
      )}
      <aside
        className={clsx(
          "fixed lg:sticky top-0 left-0 h-screen w-[264px] bg-white border-r border-surface-border flex flex-col z-50 transition-transform duration-300 shrink-0",
          open ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
          className
        )}
      >
        <div className="flex items-center justify-between px-5 h-[72px] border-b border-surface-border">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-brand-gradient flex items-center justify-center shadow-soft shrink-0">
              <Droplets size={18} className="text-white" strokeWidth={2.5} />
            </div>
            <div className="leading-tight">
              <p className="font-display font-bold text-ink-900 text-[15px]">Hygiene Matic</p>
              <p className="text-[11px] text-ink-400 -mt-0.5">Manufacturing OS</p>
            </div>
          </div>
          <button onClick={onClose} className="lg:hidden text-ink-400">
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-4 px-3 scrollbar-none">
          <ul className="space-y-1">
            {visibleItems.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  end={item.end}
                  onClick={onClose}
                  className={({ isActive }) =>
                    clsx(
                      "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group relative",
                      isActive
                        ? "bg-brand-gradient text-white shadow-soft"
                        : "text-ink-500 hover:bg-ink-900/[0.04] hover:text-ink-900"
                    )
                  }
                >
                  <item.icon size={18} strokeWidth={2} />
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <div className="p-4 border-t border-surface-border space-y-3">
          <div className="bg-brand-gradient-soft rounded-2xl p-4">
            <p className="text-xs font-semibold text-brand-700 mb-1">Signed in as</p>
            <p className="text-[11px] text-ink-500 leading-snug mb-3">{role}</p>
            <NavLink
              to="/batch-calculator"
              className="text-xs font-semibold text-brand-700 inline-flex items-center gap-1 hover:gap-1.5 transition-all"
            >
              Open Batch Calculator →
            </NavLink>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium text-ink-500 hover:bg-danger-50 hover:text-danger-600 transition-colors"
          >
            <LogOut size={16} /> Sign Out
          </button>
        </div>
      </aside>
    </>
  );
}
