import { create } from "zustand";
import { firestoreSync } from "./middleware/firestoreSync";
import { seedPackagingKits } from "../data/seedPackagingKits";
import { generateId } from "../utils/id";

function withPrice(data) {
  const costs = {
    bottle: Number(data.costs?.bottle) || 0,
    cap: Number(data.costs?.cap) || 0,
    label: Number(data.costs?.label) || 0,
    shrink: Number(data.costs?.shrink) || 0,
    innerBox: Number(data.costs?.innerBox) || 0,
    outerCarton: Number(data.costs?.outerCarton) || 0,
    tape: Number(data.costs?.tape) || 0,
  };
  const price =
    Math.round(
      (costs.bottle + costs.cap + costs.label + costs.shrink + costs.innerBox + costs.outerCarton + costs.tape) * 100
    ) / 100;
  return { ...data, costs, price };
}

export const usePackagingKitStore = create(
  firestoreSync(
    (set, get) => ({
      packagingKits: seedPackagingKits,

      getById: (id) => get().packagingKits.find((k) => k.id === id),

      getByIdMap: () => {
        const map = {};
        get().packagingKits.forEach((k) => (map[k.id] = k));
        return map;
      },

      addKit: (data) =>
        set({ packagingKits: [...get().packagingKits, withPrice({ id: generateId("kit"), ...data })] }),

      updateKit: (id, patch) =>
        set({
          packagingKits: get().packagingKits.map((k) => (k.id === id ? withPrice({ ...k, ...patch }) : k)),
        }),

      deleteKit: (id) => set({ packagingKits: get().packagingKits.filter((k) => k.id !== id) }),

      adjustStock: (id, delta) =>
        set({
          packagingKits: get().packagingKits.map((k) =>
            k.id === id ? { ...k, stock: Math.max(0, Math.round((k.stock || 0) + delta)) } : k
          ),
        }),

      lowStockItems: () => get().packagingKits.filter((k) => k.stock <= k.minStock),
    }),
    { name: "hm-packaging-kits" }
  )
);
