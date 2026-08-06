import { motion } from "framer-motion";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";
import clsx from "clsx";

export default function StatCard({ label, value, icon: Icon, trend, trendLabel = "vs yesterday", tone = "brand", delay = 0 }) {
  const positive = trend > 0;
  const isFlat = trend === 0 || trend === undefined;

  const iconTones = {
    brand: "bg-brand-50 text-brand-600",
    aqua: "bg-aqua-50 text-aqua-700",
    success: "bg-success-50 text-success-600",
    warning: "bg-warning-50 text-warning-600",
    danger: "bg-danger-50 text-danger-600",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: [0.16, 1, 0.3, 1] }}
      className="bg-surface-card border border-surface-border rounded-2xl p-5 shadow-card hover:shadow-cardHover transition-shadow duration-300"
    >
      <div className="flex items-start justify-between mb-4">
        <div className={clsx("w-10 h-10 rounded-xl flex items-center justify-center", iconTones[tone])}>
          {Icon && <Icon size={19} />}
        </div>
        {!isFlat && (
          <span
            className={clsx(
              "inline-flex items-center gap-0.5 text-xs font-semibold px-2 py-1 rounded-full",
              positive ? "bg-success-50 text-success-600" : "bg-danger-50 text-danger-600"
            )}
          >
            {positive ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
            {Math.abs(trend)}%
          </span>
        )}
      </div>
      <p className="text-sm text-ink-500 font-medium mb-1">{label}</p>
      <p className="text-2xl font-bold text-ink-900 font-display tracking-tight">{value}</p>
      {!isFlat && <p className="text-xs text-ink-400 mt-1">{trendLabel}</p>}
    </motion.div>
  );
}
