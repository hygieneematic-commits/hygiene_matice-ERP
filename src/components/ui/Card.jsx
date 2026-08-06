import clsx from "clsx";

export default function Card({ children, className, hover = false, padding = "p-6", ...props }) {
  return (
    <div
      className={clsx(
        "bg-surface-card border border-surface-border rounded-2xl shadow-card",
        padding,
        hover && "transition-all duration-300 hover:shadow-cardHover hover:-translate-y-0.5",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
