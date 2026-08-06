import { useState, useRef, useEffect, useMemo } from "react";
import { Menu, Search, Bell, ChevronDown, LogOut } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { useRawMaterialStore } from "../../store/useRawMaterialStore";
import { usePackagingStore } from "../../store/usePackagingStore";
import { useAuthStore } from "../../store/useAuthStore";

export default function Topbar({ onMenuClick, onSearchClick, className = "" }) {
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const ref = useRef(null);
  const profileRef = useRef(null);
  const rawMaterials = useRawMaterialStore((s) => s.rawMaterials);
  const packagingItems = usePackagingStore((s) => s.packagingItems);
  const currentUser = useAuthStore((s) => s.currentUser);
  const logout = useAuthStore((s) => s.logout);
  const navigate = useNavigate();
  const alerts = useMemo(() => [
    ...rawMaterials.filter((r) => r.stock <= r.minStock).map((r) => ({ ...r, kind: "Raw material" })),
    ...packagingItems.filter((p) => p.stock <= p.minStock).map((p) => ({ ...p, kind: "Packaging" })),
  ], [rawMaterials, packagingItems]);

  const initials = currentUser?.name
    ? currentUser.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
    : "?";

  useEffect(() => {
    function onClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setNotifOpen(false);
      if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <header className={`sticky top-0 z-30 h-[72px] bg-surface-bg/80 backdrop-blur-md border-b border-surface-border flex items-center justify-between px-4 sm:px-6 gap-4 ${className}`}>
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <button onClick={onMenuClick} className="lg:hidden text-ink-700 shrink-0">
          <Menu size={22} />
        </button>
        <button
          onClick={onSearchClick}
          className="flex items-center gap-2.5 bg-white border border-surface-border rounded-xl px-3.5 py-2.5 text-sm text-ink-400 w-full max-w-sm hover:border-brand-300 transition-colors"
        >
          <Search size={16} />
          <span className="flex-1 text-left">Search or jump to…</span>
          <kbd className="text-[10px] bg-ink-900/5 px-1.5 py-0.5 rounded font-mono hidden sm:inline">⌘K</kbd>
        </button>
      </div>

      <div className="flex items-center gap-3 shrink-0">
        <div className="relative" ref={ref}>
          <button
            onClick={() => setNotifOpen((v) => !v)}
            className="relative w-10 h-10 rounded-xl bg-white border border-surface-border flex items-center justify-center text-ink-500 hover:text-brand-600 hover:border-brand-300 transition-colors"
          >
            <Bell size={18} />
            {alerts.length > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-danger-500 text-white text-[10px] font-bold flex items-center justify-center">
                {alerts.length}
              </span>
            )}
          </button>
          <AnimatePresence>
            {notifOpen && (
              <motion.div
                initial={{ opacity: 0, y: -8, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.97 }}
                transition={{ duration: 0.18 }}
                className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-cardHover border border-surface-border overflow-hidden"
              >
                <div className="px-4 py-3 border-b border-surface-border">
                  <p className="text-sm font-semibold text-ink-900">Low stock alerts</p>
                </div>
                <div className="max-h-72 overflow-y-auto">
                  {alerts.length === 0 ? (
                    <p className="text-sm text-ink-400 px-4 py-6 text-center">All stock levels look healthy.</p>
                  ) : (
                    alerts.map((a) => (
                      <div key={a.id} className="px-4 py-3 border-b border-surface-border last:border-0 flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-ink-900">{a.name}</p>
                          <p className="text-xs text-ink-400">{a.kind} · {a.stock} left (min {a.minStock})</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                {alerts.length > 0 && (
                  <Link
                    to="/inventory"
                    onClick={() => setNotifOpen(false)}
                    className="block text-center text-xs font-semibold text-brand-600 py-3 hover:bg-brand-50 transition-colors"
                  >
                    View inventory →
                  </Link>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="relative" ref={profileRef}>
          <button className="flex items-center gap-2 pl-1 pr-2.5 py-1 rounded-xl hover:bg-white transition-colors" onClick={() => setProfileOpen((v) => !v)}>
            <div className="w-8 h-8 rounded-lg bg-brand-gradient flex items-center justify-center text-white text-xs font-semibold shrink-0">
              {initials}
            </div>
            <span className="text-sm font-medium text-ink-700 hidden sm:inline">{currentUser?.name?.split(" ")[0] || "Guest"}</span>
            <ChevronDown size={14} className="text-ink-400 hidden sm:inline" />
          </button>
          <AnimatePresence>
            {profileOpen && (
              <motion.div
                initial={{ opacity: 0, y: -8, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.97 }}
                transition={{ duration: 0.18 }}
                className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-cardHover border border-surface-border overflow-hidden"
              >
                <div className="px-4 py-3 border-b border-surface-border">
                  <p className="text-sm font-semibold text-ink-900">{currentUser?.name}</p>
                  <p className="text-xs text-ink-400">{currentUser?.role}</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2.5 px-4 py-3 text-sm text-ink-600 hover:bg-danger-50 hover:text-danger-600 transition-colors"
                >
                  <LogOut size={15} /> Sign Out
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
}