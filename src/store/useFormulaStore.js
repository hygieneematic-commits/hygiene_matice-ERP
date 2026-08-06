import { create } from "zustand";
import { persist } from "zustand/middleware";
import { seedFormulas } from "../data/seedFormulas";
import { generateId } from "../utils/id";

// formulasByProductId: { [productId]: { ingredients: [...], versions: [{ id, timestamp, ingredients }] } }
const initialFormulas = {};
Object.entries(seedFormulas).forEach(([productId, ingredients]) => {
  initialFormulas[productId] = {
    ingredients,
    versions: [{ id: generateId("ver"), timestamp: "2026-02-10T09:00:00Z", ingredients, label: "Initial formula" }],
  };
});

export const useFormulaStore = create(
  persist(
    (set, get) => ({
      formulasByProductId: initialFormulas,

      getFormula: (productId) => get().formulasByProductId[productId] || { ingredients: [], versions: [] },

      // Create an empty formula shell for a brand-new product
      ensureFormula: (productId) => {
        if (get().formulasByProductId[productId]) return;
        set({
          formulasByProductId: {
            ...get().formulasByProductId,
            [productId]: { ingredients: [], versions: [] },
          },
        });
      },

      addIngredient: (productId, ingredient) => {
        const current = get().getFormula(productId);
        const updated = [...current.ingredients, { id: generateId("ing"), ...ingredient }];
        set({
          formulasByProductId: {
            ...get().formulasByProductId,
            [productId]: { ...current, ingredients: updated },
          },
        });
      },

      updateIngredient: (productId, ingredientId, patch) => {
        const current = get().getFormula(productId);
        const updated = current.ingredients.map((i) => (i.id === ingredientId ? { ...i, ...patch } : i));
        set({
          formulasByProductId: {
            ...get().formulasByProductId,
            [productId]: { ...current, ingredients: updated },
          },
        });
      },

      deleteIngredient: (productId, ingredientId) => {
        const current = get().getFormula(productId);
        const updated = current.ingredients.filter((i) => i.id !== ingredientId);
        set({
          formulasByProductId: {
            ...get().formulasByProductId,
            [productId]: { ...current, ingredients: updated },
          },
        });
      },

      // Saves current ingredients as a new named version snapshot
      saveVersion: (productId, label = "Manual save") => {
        const current = get().getFormula(productId);
        const version = {
          id: generateId("ver"),
          timestamp: new Date().toISOString(),
          ingredients: current.ingredients,
          label,
        };
        set({
          formulasByProductId: {
            ...get().formulasByProductId,
            [productId]: { ...current, versions: [version, ...current.versions] },
          },
        });
      },

      revertToVersion: (productId, versionId) => {
        const current = get().getFormula(productId);
        const version = current.versions.find((v) => v.id === versionId);
        if (!version) return;
        set({
          formulasByProductId: {
            ...get().formulasByProductId,
            [productId]: { ...current, ingredients: version.ingredients },
          },
        });
      },
    }),
    { name: "hm-formulas" }
  )
);
