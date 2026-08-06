import clsx from "clsx";

const tones = {
  neutral: "bg-ink-900/5 text-ink-500",
  brand: "bg-brand-50 text-brand-700",
  success: "bg-success-50 text-success-600",
  warning: "bg-warning-50 text-warning-600",
  danger: "bg-danger-50 text-danger-600",
  aqua: "bg-aqua-50 text-aqua-700",
};

export default function Badge({ children, tone = "neutral", className, icon: Icon, dot = false }) {
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full",
        tones[tone],
        className
      )}
    >
      {dot && <span className={clsx("w-1.5 h-1.5 rounded-full", tone === "success" ? "bg-success-500" : tone === "danger" ? "bg-danger-500" : tone === "warning" ? "bg-warning-500" : "bg-ink-400")} />}
      {Icon && <Icon size={12} />}
      {children}
    </span>
  );
}
