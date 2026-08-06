import clsx from "clsx";

const variants = {
  primary:
    "bg-brand-gradient text-white shadow-soft hover:shadow-glow hover:brightness-[1.04] active:brightness-95",
  secondary:
    "bg-white text-ink-700 border border-surface-border hover:border-brand-300 hover:text-brand-700 shadow-soft",
  ghost: "text-ink-700 hover:bg-ink-900/5",
  danger: "bg-danger-500 text-white hover:bg-danger-600 shadow-soft",
  success: "bg-success-500 text-white hover:bg-success-600 shadow-soft",
  outline: "border border-surface-borderStrong text-ink-700 hover:bg-ink-900/[0.03]",
};

const sizes = {
  sm: "text-xs px-3 py-1.5 gap-1.5",
  md: "text-sm px-4 py-2.5 gap-2",
  lg: "text-base px-6 py-3 gap-2",
  icon: "p-2.5",
};

export default function Button({
  children,
  variant = "primary",
  size = "md",
  className,
  disabled,
  type = "button",
  ...props
}) {
  return (
    <button
      type={type}
      disabled={disabled}
      className={clsx(
        "inline-flex items-center justify-center font-medium rounded-xl transition-all duration-200 whitespace-nowrap select-none",
        "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none disabled:hover:translate-y-0",
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
