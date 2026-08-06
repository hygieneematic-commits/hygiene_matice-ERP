import { create } from "zustand";
import { firestoreSync } from "./middleware/firestoreSync";
import { seedRawMaterials } from "../data/seedRawMaterials";
import { generateId } from "../utils/id";
import { round } from "../utils/units";

// A raw material's usable "price" (the number costEngine multiplies against
// consumption) is always the GST-inclusive final price when Include GST is on,
// otherwise the base price. Recomputed any time base price / GST% / toggle change.
export function withFinalPrice(data) {
  const basePrice = Number(data.basePrice ?? data.price ?? 0);
  const gstPercent = Number(data.gstPercent ?? 0);
  const includeGst = !!data.includeGst;
  const gstAmount = includeGst ? round((basePrice * gstPercent) / 100, 2) : 0;
  const price = round(basePrice + gstAmount, 2);
  return { ...data, basePrice, gstPercent, includeGst, price };
}

export const useRawMaterialStore = create(
  firestoreSync(
    (set, get) => ({
      rawMaterials: seedRawMaterials,

      getById: (id) => get().rawMaterials.find((r) => r.id === id),

      getByIdMap: () => {
        const map = {};
        get().rawMaterials.forEach((r) => (map[r.id] = r));
        return map;
      },

      addRawMaterial: (data) =>
        set({
          rawMaterials: [...get().rawMaterials, { id: generateId("rm"), ...withFinalPrice(data) }],
        }),

      updateRawMaterial: (id, patch) =>
        set({
          rawMaterials: get().rawMaterials.map((r) => (r.id === id ? withFinalPrice({ ...r, ...patch }) : r)),
        }),

      deleteRawMaterial: (id) =>
        set({
          rawMaterials: get().rawMaterials.filter((r) => r.id !== id),
        }),

      adjustStock: (id, deltaLargeUnit) =>
        set({
          rawMaterials: get().rawMaterials.map((r) =>
            r.id === id ? { ...r, stock: Math.max(0, +(r.stock + deltaLargeUnit).toFixed(3)) } : r
          ),
        }),

      lowStockItems: () => get().rawMaterials.filter((r) => r.stock <= r.minStock),
    }),
    {
      name: "hm-raw-materials",
      // The v1/v2 stale-price bug (RO Water stuck at ₹0.00 from an old
      // localStorage cache) is structurally gone now that Firestore is the
      // single source of truth for every device — no per-browser cache left
      // to go stale, so the version/migrate workaround is no longer needed.
    }
  )
);
