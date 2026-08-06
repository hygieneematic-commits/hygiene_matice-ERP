import { create } from "zustand";
import { firestoreSync } from "./middleware/firestoreSync";
import { seedProducts } from "../data/seedProducts";
import { generateId } from "../utils/id";

export const useProductStore = create(
  firestoreSync(
    (set, get) => ({
      products: seedProducts,

      getById: (id) => get().products.find((p) => p.id === id),

      addProduct: (data) => {
        const id = generateId("prod");
        set({
          products: [
            ...get().products,
            {
              id,
              active: true,
              createdAt: new Date().toISOString(),
              packagingBOM: [],
              ...data,
            },
          ],
        });
        return id;
      },

      updateProduct: (id, patch) =>
        set({ products: get().products.map((p) => (p.id === id ? { ...p, ...patch } : p)) }),

      deleteProduct: (id) => set({ products: get().products.filter((p) => p.id !== id) }),

      toggleActive: (id) =>
        set({
          products: get().products.map((p) => (p.id === id ? { ...p, active: !p.active } : p)),
        }),
    }),
    { name: "hm-products" }
  )
);
