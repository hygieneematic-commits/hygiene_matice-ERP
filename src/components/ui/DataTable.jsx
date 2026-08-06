import clsx from "clsx";

export default function DataTable({ columns, data, keyField = "id", onRowClick, emptyState }) {
  if (!data || data.length === 0) return emptyState || null;

  return (
    <div className="overflow-x-auto -mx-2 px-2">
      <table className="w-full border-collapse min-w-[640px]">
        <thead>
          <tr className="border-b border-surface-border">
            {columns.map((col) => (
              <th
                key={col.key}
                className={clsx(
                  "text-left text-xs font-semibold text-ink-400 uppercase tracking-wide px-3 py-3",
                  col.align === "right" && "text-right"
                )}
                style={col.width ? { width: col.width } : undefined}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row) => (
            <tr
              key={row[keyField]}
              onClick={() => onRowClick?.(row)}
              className={clsx(
                "border-b border-surface-border last:border-0 transition-colors",
                onRowClick && "cursor-pointer hover:bg-brand-50/40"
              )}
            >
              {columns.map((col) => (
                <td
                  key={col.key}
                  className={clsx("px-3 py-3.5 text-sm text-ink-700 align-middle", col.align === "right" && "text-right")}
                >
                  {col.render ? col.render(row) : row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
