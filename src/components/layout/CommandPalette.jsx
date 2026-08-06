import { useEffect, useMemo, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  LayoutDashboard, Package, FlaskConical, Calculator, Boxes, PackageOpen,
  Factory, Warehouse, IndianRupee, FileBarChart, History, Users, Settings, Search, CornerDownLeft,
} from "lucide-react";
import clsx from "clsx";

const commands = [
  { label: "Go to Dashboard", to: "/", icon: LayoutDashboard, group: "Navigate" },
  { label: "Go to Products", to: "/products", icon: Package, group: "Navigate" },
  { label: "Go to Formula Library", to: "/formula-library", icon: FlaskConical, group: "Navigate" },
  { label: "Go to Batch Calculator", to: "/batch-calculator", icon: Calculator, group: "Navigate" },
  { label: "Go to Raw Materials", to: "/raw-materials", icon: Boxes, group: "Navigate" },
  { label: "Go to Packaging", to: "/packaging", icon: PackageOpen, group: "Navigate" },
  { label: "Go to Production", to: "/production", icon: Factory, group: "Navigate" },
  { label: "Go to Inventory", to: "/inventory", icon: Warehouse, group: "Navigate" },
  { label: "Go to Sales Summary", to: "/cost-profit", icon: IndianRupee, group: "Navigate" },
  { label: "Go to Reports", to: "/reports", icon: FileBarChart, group: "Navigate" },
  { label: "Go to Batch History", to: "/batch-history", icon: History, group: "Navigate" },
  { label: "Go to Users", to: "/users", icon: Users, group: "Navigate" },
  { label: "Go to Settings", to: "/settings", icon: Settings, group: "Navigate" },
  { label: "New product", to: "/products?new=1", icon: Package, group: "Quick actions" },
  { label: "New batch", to: "/production?new=1", icon: Factory, group: "Quick actions" },
];

export default function CommandPalette({ open, onClose }) {
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const navigate = useNavigate();
  const inputRef = useRef(null);

  const filtered = useMemo(() => {
    if (!query.trim()) return commands;
    return commands.filter((c) => c.label.toLowerCase().includes(query.toLowerCase()));
  }, [query]);

  useEffect(() => {
    if (open) {
      setQuery("");
      setActiveIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  useEffect(() => setActiveIndex(0), [query]);

  function go(cmd) {
    if (!cmd) return;
    navigate(cmd.to);
    onClose();
  }

  function onKeyDown(e) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      go(filtered[activeIndex]);
    } else if (e.key === "Escape") {
      onClose();
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[60] flex items-start justify-center pt-[12vh] px-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-ink-900/40 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97 }}
            transition={{ duration: 0.18 }}
            className="relative bg-white w-full max-w-lg rounded-2xl shadow-cardHover overflow-hidden"
          >
            <div className="flex items-center gap-3 px-4 py-3.5 border-b border-surface-border">
              <Search size={17} className="text-ink-400 shrink-0" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={onKeyDown}
                placeholder="Search pages or run a quick action…"
                className="flex-1 outline-none text-sm text-ink-900 placeholder:text-ink-400"
              />
              <kbd className="text-[10px] text-ink-400 bg-ink-900/5 px-1.5 py-0.5 rounded">ESC</kbd>
            </div>
            <div className="max-h-80 overflow-y-auto py-2">
              {filtered.length === 0 && (
                <p className="text-sm text-ink-400 text-center py-8">No matches found</p>
              )}
              {filtered.map((cmd, idx) => (
                <button
                  key={cmd.label}
                  onClick={() => go(cmd)}
                  onMouseEnter={() => setActiveIndex(idx)}
                  className={clsx(
                    "w-full flex items-center gap-3 px-4 py-2.5 text-sm text-left transition-colors",
                    idx === activeIndex ? "bg-brand-50 text-brand-700" : "text-ink-700"
                  )}
                >
                  <cmd.icon size={16} className={idx === activeIndex ? "text-brand-600" : "text-ink-400"} />
                  <span className="flex-1">{cmd.label}</span>
                  {idx === activeIndex && <CornerDownLeft size={14} className="text-brand-400" />}
                </button>
              ))}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
