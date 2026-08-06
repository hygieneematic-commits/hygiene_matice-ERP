// Simple, dependency-free unique ID generator.
// Swappable later for a DB-generated UUID (Postgres/Supabase) without touching callers.
export function generateId(prefix = "id") {
  const random = Math.random().toString(36).slice(2, 9);
  const time = Date.now().toString(36).slice(-5);
  return `${prefix}_${time}${random}`;
}

export function generateBatchNumber(productCode = "GEN") {
  const now = new Date();
  const y = now.getFullYear().toString().slice(-2);
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  const rand = Math.floor(100 + Math.random() * 900);
  return `HM-${productCode}-${y}${m}${d}-${rand}`;
}
