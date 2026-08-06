export function formatCurrency(value, currency = "INR") {
  const symbols = { INR: "₹", USD: "$", EUR: "€" };
  const symbol = symbols[currency] || "₹";
  const n = Number(value) || 0;
  return `${symbol}${n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function formatNumber(value, decimals = 2) {
  const n = Number(value) || 0;
  return n.toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: decimals });
}

export function formatDate(dateStr) {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

export function formatDateTime(dateStr) {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  return d.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function timeAgo(dateStr) {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return formatDate(dateStr);
}

export function pct(value, decimals = 1) {
  const n = Number(value) || 0;
  return `${n.toFixed(decimals)}%`;
}
