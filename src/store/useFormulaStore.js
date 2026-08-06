import { create } from "zustand";
import { firestoreSync } from "./middleware/firestoreSync";
import { seedFormulas } from "../data/seedFormulas";
import { generateId } from "../utils/id";

// Generic starting point for a brand-new product's manufacturing method —
// each product's steps are then fully editable/reorderable from there, per
// product, instead of one fixed list shared by everything in Production.
export const DEFAULT_METHOD_STEPS = [
  "Add Water",
  "Add Active Ingredients (per formula)",
  "Mix for 15 Minutes",
  "Add Perfume",
  "Add Colour",
  "In-process QC Check",
];

// formulasByProductId: { [productId]: { ingredients: [...], method: [{id, text}...], versions: [...] } }
const initialFormulas = {};
Object.entries(seedFormulas).forEach(([productId, ingredients]) => {
  const method = DEFAULT_METHOD_STEPS.map((text) => ({ id: generateId("step"), text }));
  initialFormulas[productId] = {
    ingredients,
    method,
    versions: [{ id: generateId("ver"), timestamp: "2026-02-10T09:00:00Z", ingredients, label: "Initial formula" }],
  };
});

export const useFormulaStore = create(
  firestoreSync(
    (set, get) => ({
      formulasByProductId: initialFormulas,

      getFormula: (productId) => get().formulasByProductId[productId] || { ingredients: [], method: [], versions: [] },

      // Create an empty formula shell for a brand-new product
      ensureFormula: (productId) => {
        if (get().formulasByProductId[productId]) return;
        set({
          formulasByProductId: {
            ...get().formulasByProductId,
            [productId]: { ingredients: [], method: DEFAULT_METHOD_STEPS.map((text) => ({ id: generateId("step"), text })), versions: [] },
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

      // Manufacturing method — per-product, editable, used both here and as
      // the actual checklist an operator works through in Production.
      addMethodStep: (productId, text = "New step") => {
        const current = get().getFormula(productId);
        const updated = [...(current.method || []), { id: generateId("step"), text }];
        set({ formulasByProductId: { ...get().formulasByProductId, [productId]: { ...current, method: updated } } });
      },

      updateMethodStep: (productId, stepId, text) => {
        const current = get().getFormula(productId);
        const updated = (current.method || []).map((s) => (s.id === stepId ? { ...s, text } : s));
        set({ formulasByProductId: { ...get().formulasByProductId, [productId]: { ...current, method: updated } } });
      },

      deleteMethodStep: (productId, stepId) => {
        const current = get().getFormula(productId);
        const updated = (current.method || []).filter((s) => s.id !== stepId);
        set({ formulasByProductId: { ...get().formulasByProductId, [productId]: { ...current, method: updated } } });
      },

      moveMethodStep: (productId, stepId, direction) => {
        const current = get().getFormula(productId);
        const steps = [...(current.method || [])];
        const idx = steps.findIndex((s) => s.id === stepId);
        const swapWith = direction === "up" ? idx - 1 : idx + 1;
        if (idx < 0 || swapWith < 0 || swapWith >= steps.length) return;
        [steps[idx], steps[swapWith]] = [steps[swapWith], steps[idx]];
        set({ formulasByProductId: { ...get().formulasByProductId, [productId]: { ...current, method: steps } } });
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
