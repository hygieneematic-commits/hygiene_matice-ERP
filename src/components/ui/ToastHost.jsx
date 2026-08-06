import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, XCircle, Info, X } from "lucide-react";
import { useToastStore } from "../../store/useToastStore";

const iconMap = {
  success: <CheckCircle2 size={18} className="text-success-500" />,
  error: <XCircle size={18} className="text-danger-500" />,
  info: <Info size={18} className="text-brand-500" />,
};

export default function ToastHost() {
  const { toasts, dismiss } = useToastStore();

  return (
    <div className="fixed bottom-5 right-5 z-[100] flex flex-col gap-2 w-[320px]">
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, x: 40, scale: 0.96 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="flex items-start gap-2.5 bg-white border border-surface-border rounded-2xl shadow-cardHover px-4 py-3"
          >
            {iconMap[t.type] || iconMap.info}
            <p className="text-sm text-ink-700 flex-1 leading-snug">{t.message}</p>
            <button onClick={() => dismiss(t.id)} className="text-ink-400 hover:text-ink-700 transition-colors">
              <X size={14} />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
