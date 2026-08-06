import clsx from "clsx";

export function Label({ children, hint }) {
  return (
    <div className="flex items-baseline justify-between mb-1.5">
      <label className="text-sm font-medium text-ink-700">{children}</label>
      {hint && <span className="text-xs text-ink-400">{hint}</span>}
    </div>
  );
}

const inputBase =
  "w-full bg-white border border-surface-border rounded-xl px-3.5 py-2.5 text-sm text-ink-900 placeholder:text-ink-400 transition-all duration-150 focus:border-brand-400 focus:ring-4 focus:ring-brand-100 outline-none";

export function Input({ className, ...props }) {
  return <input className={clsx(inputBase, className)} {...props} />;
}

export function Textarea({ className, rows = 3, ...props }) {
  return <textarea rows={rows} className={clsx(inputBase, "resize-none", className)} {...props} />;
}

export function Select({ className, children, ...props }) {
  return (
    <select className={clsx(inputBase, "appearance-none bg-no-repeat bg-right cursor-pointer", className)} {...props}>
      {children}
    </select>
  );
}

export function FormRow({ children, cols = 2 }) {
  return (
    <div
      className={clsx(
        "grid grid-cols-1 gap-4",
        cols === 2 && "sm:grid-cols-2",
        cols === 3 && "sm:grid-cols-2 lg:grid-cols-3"
      )}
    >
      {children}
    </div>
  );
}
