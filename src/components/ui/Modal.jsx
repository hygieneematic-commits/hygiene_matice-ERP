import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { useEffect } from "react";
import clsx from "clsx";

export default function Modal({ open, onClose, title, subtitle, children, footer, size = "md" }) {
  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape") onClose?.();
    }
    if (open) document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const widths = { sm: "max-w-md", md: "max-w-lg", lg: "max-w-2xl", xl: "max-w-4xl" };

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-ink-900/40 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 8 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className={clsx(
              "relative bg-white rounded-3xl shadow-cardHover w-full max-h-[88vh] flex flex-col",
              widths[size]
            )}
          >
            {title ? (
              <div className="flex items-start justify-between px-6 pt-6 pb-4 border-b border-surface-border">
                <div>
                  <h3 className="text-lg font-semibold text-ink-900 font-display">{title}</h3>
                  {subtitle && <p className="text-sm text-ink-500 mt-0.5">{subtitle}</p>}
                </div>
                <button
                  onClick={onClose}
                  className="text-ink-400 hover:text-ink-700 hover:bg-ink-900/5 rounded-lg p-1.5 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>
            ) : (
              <button
                onClick={onClose}
                className="absolute right-5 top-5 text-ink-400 hover:text-ink-700 hover:bg-ink-900/5 rounded-lg p-1.5 transition-colors z-10"
              >
                <X size={18} />
              </button>
            )}
            <div className="px-6 py-6 overflow-y-auto flex-1">{children}</div>
            {footer && <div className="px-6 py-4 border-t border-surface-border flex justify-end gap-3">{footer}</div>}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
