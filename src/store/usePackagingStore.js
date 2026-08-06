import { create } from "zustand";
import { persist } from "zustand/middleware";
import { seedPackaging } from "../data/seedPackaging";
import { generateId } from "../utils/id";

export const usePackagingStore = create(
  persist(
    (set, get) => ({
      packagingItems: seedPackaging,

      getById: (id) => get().packagingItems.find((p) => p.id === id),

      getByIdMap: () => {
        const map = {};
        get().packagingItems.forEach((p) => (map[p.id] = p));
        return map;
      },

      addPackaging: (data) =>
        set({ packagingItems: [...get().packagingItems, { id: generateId("pkg"), ...data }] }),

      updatePackaging: (id, patch) =>
        set({
          packagingItems: get().packagingItems.map((p) => (p.id === id ? { ...p, ...patch } : p)),
        }),

      deletePackaging: (id) =>
        set({ packagingItems: get().packagingItems.filter((p) => p.id !== id) }),

      adjustStock: (id, delta) =>
        set({
          packagingItems: get().packagingItems.map((p) =>
            p.id === id ? { ...p, stock: Math.max(0, Math.round(p.stock + delta)) } : p
          ),
        }),

      lowStockItems: () => get().packagingItems.filter((p) => p.stock <= p.minStock),
    }),
    { name: "hm-packaging" }
  )
);
