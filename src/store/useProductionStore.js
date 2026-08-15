import { create } from "zustand";
import { firestoreSync } from "./middleware/firestoreSync";
import { generateId, generateBatchNumber } from "../utils/id";
import { useFormulaStore } from "./useFormulaStore";
import { useRawMaterialStore } from "./useRawMaterialStore";
import { usePackagingStore } from "./usePackagingStore";
import { useProductStore } from "./useProductStore";
import { useSettingsStore } from "./useSettingsStore";
import { scaleFormula, calculateComponentPlanCost, calculateOverheadCost } from "../utils/costEngine";
import { computeFormulaLines, computeRawMaterialCost } from "../utils/batchCalcEngine";

export const useProductionStore = create(
  firestoreSync(
    (set, get) => ({
      // Real production data only — no seeded/demo batches. New environments
      // (or anyone who resets Firestore) start with an empty batch history
      // instead of fake sample data mixed in with real records.
      batches: [],

      getById: (id) => get().batches.find((b) => b.id === id),

      // Create a planned batch (does NOT touch inventory yet)
      createBatch: ({ productId, quantityL, operator, supervisor, shift, notes, mfgDate, expiryDate, startTime, endTime, yieldPercent, packagingPlan, formulaOverride, formulaOriginal, formulaEdited }) => {
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
          startTime: startTime || "",
          endTime: endTime || "",
          expiryDate: expiryDate || "",
          packagingPlan: packagingPlan || [],
          // Batch-specific formula override — set only when someone edited
          // ingredient quantities for THIS batch at creation time. Never
          // written back to the Formula Library master formula. `null` means
          // "use the master formula, scaled to quantityL, as usual".
          formulaOverride: formulaOverride || null,
          formulaOriginal: formulaOriginal || null,
          formulaEdited: !!formulaEdited,
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
        const rawMaterialsById = useRawMaterialStore.getState().getByIdMap();
        const packagingById = usePackagingStore.getState().getByIdMap();
        const settings = useSettingsStore.getState().settings;

        // ---------------------------------------------------------------
        // Freeze a cost snapshot BEFORE deducting stock, using whatever
        // rates are live right now. This is what Batch History / Reports
        // will show for this batch from now on — a future raw material or
        // packaging price change must NOT silently change what an already
        // -completed batch is recorded as having cost.
        // ---------------------------------------------------------------
        let rawMaterialLines;
        if (batch.formulaOverride?.length) {
          rawMaterialLines = batch.formulaOverride;
        } else {
          const formula = useFormulaStore.getState().getFormula(batch.productId);
          rawMaterialLines = computeFormulaLines(formula.ingredients, batch.quantityL, rawMaterialsById);
        }
        const rawMaterialCostResult = computeRawMaterialCost(rawMaterialLines);
        const packagingCostResult = batch.packagingPlan?.length
          ? calculateComponentPlanCost(batch.packagingPlan, packagingById)
          : { breakdown: [], totalCost: 0, totalMl: 0 };
        const overheadResult = calculateOverheadCost(batch.quantityL, settings);
        const totalCost = rawMaterialCostResult.totalCost + packagingCostResult.totalCost + overheadResult.total;
        const costSnapshot = {
          rawMaterial: { total: rawMaterialCostResult.totalCost, lines: rawMaterialCostResult.lines },
          packaging: { total: packagingCostResult.totalCost, breakdown: packagingCostResult.breakdown },
          overhead: overheadResult,
          totalCost,
          costPerLiter: batch.quantityL > 0 ? totalCost / batch.quantityL : 0,
          formulaVersion: batch.formulaEdited ? "batch-specific adjustment" : (useFormulaStore.getState().getFormula(batch.productId).versions?.length || 1),
          frozenAt: new Date().toISOString(),
        };

        // A batch-specific formula override (edited at creation time) takes
        // priority over the master Formula Library — deduct exactly what was
        // actually planned for this batch, not what the master formula says.
        if (batch.formulaOverride?.length) {
          batch.formulaOverride.forEach((ing) => {
            const largeUnitQty = ing.requiredBaseQty / 1000;
            useRawMaterialStore.getState().adjustStock(ing.rawMaterialId, -largeUnitQty);
          });
        } else {
          const formula = useFormulaStore.getState().getFormula(batch.productId);
          const scaled = scaleFormula(formula.ingredients, batch.quantityL, rawMaterialsById);
          scaled.forEach((ing) => {
            const largeUnitQty = ing.scaledBaseQty / 1000;
            useRawMaterialStore.getState().adjustStock(ing.rawMaterialId, -largeUnitQty);
          });
        }

        if (batch.packagingPlan?.length) {
          // Custom component-based split defined for this batch — deduct exactly
          // the Bottle / Sticker / Carton / Tape / Cap / Shrink items selected
          const plan = calculateComponentPlanCost(batch.packagingPlan, packagingById);
          plan.breakdown.forEach((line) => {
            const adjust = usePackagingStore.getState().adjustStock;
            if (line.bottle) adjust(line.bottle.id, -line.units);
            if (line.sticker) adjust(line.sticker.id, -line.units);
            if (line.cap) adjust(line.cap.id, -line.units);
            if (line.shrink) adjust(line.shrink.id, -line.units);
            if (line.carton) adjust(line.carton.id, -line.cartonCount);
            if (line.tape) adjust(line.tape.id, -line.tapeCount);
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
          batches: get().batches.map((b) => (b.id === batchId ? { ...b, status: "completed", costSnapshot } : b)),
        });
      },

      deleteBatch: (batchId) => set({ batches: get().batches.filter((b) => b.id !== batchId) }),

      // Cancel a batch that hasn't been confirmed yet — no inventory was
      // ever deducted for a "planned" batch, so this is safe for any
      // authorized (canEdit) user, not just Super Admin. The record stays
      // in Batch History as "Cancelled" (audit trail of the mistake) rather
      // than silently vanishing, but it's excluded from production totals.
      cancelBatch: (batchId, reason) =>
        set({
          batches: get().batches.map((b) =>
            b.id === batchId ? { ...b, status: "cancelled", cancelReason: reason || "", cancelledAt: new Date().toISOString() } : b
          ),
        }),

      updateBatch: (batchId, patch) =>
        set({ batches: get().batches.map((b) => (b.id === batchId ? { ...b, ...patch } : b)) }),
    }),
    { name: "hm-production" }
  )
);
