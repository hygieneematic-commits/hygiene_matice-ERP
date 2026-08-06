import { create } from "zustand";
import { persist } from "zustand/middleware";
import { seedBatchHistory } from "../data/seedMisc";
import { generateId, generateBatchNumber } from "../utils/id";
import { useFormulaStore } from "./useFormulaStore";
import { useRawMaterialStore } from "./useRawMaterialStore";
import { usePackagingStore } from "./usePackagingStore";
import { usePackagingKitStore } from "./usePackagingKitStore";
import { useProductStore } from "./useProductStore";
import { scaleFormula } from "../utils/costEngine";

export const useProductionStore = create(
  persist(
    (set, get) => ({
      batches: seedBatchHistory,

      getById: (id) => get().batches.find((b) => b.id === id),

      // Create a planned batch (does NOT touch inventory yet)
      createBatch: ({ productId, quantityL, operator, supervisor, shift, notes, mfgDate, expiryDate, yieldPercent, packagingPlan }) => {
        const product = useProductStore.getState().getById(productId);
        const batch = {
          id: generateId("batch"),
          batchNumber: generateBatchNumber(product?.sku?.split("-")[1] || "GEN"),
          productId,
          quantityL,
          operator: operator || "Unassigned",
          supervisor: supervisor || "",
          shift: shift || "Morning",
          notes: notes || "",
          yieldPercent: yieldPercent ?? 100,
          status: "planned",
          date: new Date().toISOString(),
          mfgDate: mfgDate || new Date().toISOString().slice(0, 10),
          expiryDate: expiryDate || "",
          packagingPlan: packagingPlan || [],
          qc: null,
        };
        set({ batches: [batch, ...get().batches] });
        return batch;
      },

      // Confirm production: deducts raw material + packaging stock exactly once
      confirmProduction: (batchId) => {
        const batch = get().getById(batchId);
        if (!batch || batch.status === "completed") return;

        const product = useProductStore.getState().getById(batch.productId);
        const formula = useFormulaStore.getState().getFormula(batch.productId);
        const rawMaterialsById = useRawMaterialStore.getState().getByIdMap();
        const packagingById = usePackagingStore.getState().getByIdMap();

        const scaled = scaleFormula(formula.ingredients, batch.quantityL, rawMaterialsById);
        scaled.forEach((ing) => {
          const largeUnitQty = ing.scaledBaseQty / 1000;
          useRawMaterialStore.getState().adjustStock(ing.rawMaterialId, -largeUnitQty);
        });

        if (batch.packagingPlan?.length) {
          // Custom multi-packaging split defined for this batch — deduct exactly those kits
          batch.packagingPlan.forEach((line) => {
            if (line.packagingKitId && Number(line.qty) > 0) {
              usePackagingKitStore.getState().adjustStock(line.packagingKitId, -Number(line.qty));
            }
          });
        } else if (product?.packagingBOM?.length && product.packSizeMl) {
          const unitsProduced = Math.floor((batch.quantityL * 1000) / product.packSizeMl);
          product.packagingBOM.forEach((bom) => {
            const item = packagingById[bom.packagingId];
            if (!item) return;
            usePackagingStore.getState().adjustStock(bom.packagingId, -(unitsProduced * bom.qtyPerUnit));
          });
        }

        set({
          batches: get().batches.map((b) => (b.id === batchId ? { ...b, status: "completed" } : b)),
        });
      },

      deleteBatch: (batchId) => set({ batches: get().batches.filter((b) => b.id !== batchId) }),

      updateBatch: (batchId, patch) =>
        set({ batches: get().batches.map((b) => (b.id === batchId ? { ...b, ...patch } : b)) }),
    }),
    { name: "hm-production" }
  )
);
