import { useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, Trash2, Save, History, RotateCcw, FlaskConical } from "lucide-react";
import PageHeader from "../../components/ui/PageHeader";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import Badge from "../../components/ui/Badge";
import { Input, Select, Label } from "../../components/ui/Field";
import Modal from "../../components/ui/Modal";
import ConfirmDialog from "../../components/ui/ConfirmDialog";
import EmptyState from "../../components/ui/EmptyState";
import { useProductStore } from "../../store/useProductStore";
import { useFormulaStore } from "../../store/useFormulaStore";
import { useRawMaterialStore } from "../../store/useRawMaterialStore";
import { useToastStore } from "../../store/useToastStore";
import { calculateRawMaterialCost, scaleFormula } from "../../utils/costEngine";
import { ALL_UNITS, unitType } from "../../utils/units";
import { formatCurrency, formatDateTime } from "../../utils/formatters";

export default function FormulaDetail() {
  const { productId } = useParams();
  const navigate = useNavigate();
  const push = useToastStore((s) => s.push);

  const product = useProductStore((s) => s.getById(productId));
  const { getFormula, addIngredient, updateIngredient, deleteIngredient, saveVersion, revertToVersion } = useFormulaStore();
  const rawMaterials = useRawMaterialStore((s) => s.rawMaterials);
  const rawMaterialsById = useMemo(() => { const m = {}; rawMaterials.forEach((r) => (m[r.id] = r)); return m; }, [rawMaterials]);

  const formula = getFormula(productId);

  const [addOpen, setAddOpen] = useState(false);
  const [newIng, setNewIng] = useState({ rawMaterialId: rawMaterials[0]?.id || "", quantity: "", unit: "ml" });
  const [historyOpen, setHistoryOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const scaled = useMemo(
    () => scaleFormula(formula.ingredients, 1, rawMaterialsById),
    [formula.ingredients, rawMaterialsById]
  );
  const costResult = useMemo(() => calculateRawMaterialCost(scaled, rawMaterialsById), [scaled, rawMaterialsById]);

  if (!product) {
    return (
      <Card>
        <EmptyState
          icon={FlaskConical}
          title="Product not found"
          description="This product may have been deleted."
          action={<Button onClick={() => navigate("/formula-library")}>Back to Formula Library</Button>}
        />
      </Card>
    );
  }

  const compatibleUnits = ALL_UNITS.filter((u) => {
    const rm = rawMaterialsById[newIng.rawMaterialId];
    return rm ? unitType(u) === rm.unitType : true;
  });

  function handleAddIngredient() {
    if (!newIng.rawMaterialId || !newIng.quantity) return;
    addIngredient(productId, { rawMaterialId: newIng.rawMaterialId, quantity: Number(newIng.quantity), unit: newIng.unit });
    push("Ingredient added");
    setAddOpen(false);
    setNewIng({ rawMaterialId: rawMaterials[0]?.id || "", quantity: "", unit: "ml" });
  }

  function handleSaveVersion() {
    saveVersion(productId, `Snapshot — ${new Date().toLocaleDateString("en-IN")}`);
    push("Formula version saved");
  }

  function handleRevert(versionId) {
    revertToVersion(productId, versionId);
    push("Reverted to earlier version", "info");
    setHistoryOpen(false);
  }

  return (
    <div>
      <button
        onClick={() => navigate("/formula-library")}
        className="inline-flex items-center gap-1.5 text-sm text-ink-500 hover:text-brand-600 mb-4 transition-colors"
      >
        <ArrowLeft size={15} /> Formula Library
      </button>

      <PageHeader
        title={product.name}
        subtitle={`Base formula — 1 Liter · ${product.category}`}
        actions={
          <>
            <Button variant="secondary" onClick={() => setHistoryOpen(true)}>
              <History size={16} /> Version History
            </Button>
            <Button variant="secondary" onClick={handleSaveVersion}>
              <Save size={16} /> Save Version
            </Button>
            <Button onClick={() => setAddOpen(true)}>
              <Plus size={16} /> Add Ingredient
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2">
          <Card padding="p-0">
            {scaled.length === 0 ? (
              <EmptyState
                icon={FlaskConical}
                title="No ingredients yet"
                description="Add your first ingredient to start building this formula."
                action={<Button onClick={() => setAddOpen(true)}><Plus size={16} /> Add Ingredient</Button>}
              />
            ) : (
              <div className="divide-y divide-surface-border">
                {costResult.breakdown.map((ing) => (
                  <IngredientRow
                    key={ing.id}
                    ingredient={ing}
                    onUpdate={(patch) => updateIngredient(productId, ing.id, patch)}
                    onDelete={() => setDeleteTarget(ing)}
                    rawMaterialsById={rawMaterialsById}
                  />
                ))}
              </div>
            )}
          </Card>
        </div>

        <div>
          <Card className="sticky top-24">
            <p className="text-xs font-semibold text-ink-400 uppercase tracking-wide mb-4">Cost Summary (per 1L)</p>
            <div className="space-y-3 mb-5">
              <div className="flex justify-between text-sm">
                <span className="text-ink-500">Ingredients</span>
                <span className="font-medium text-ink-900">{scaled.length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-ink-500">Raw material cost</span>
                <span className="font-mono font-semibold text-ink-900">{formatCurrency(costResult.total)}</span>
              </div>
            </div>
            <div className="bg-brand-gradient-soft rounded-2xl p-4">
              <p className="text-xs text-ink-500 mb-1">Cost per Liter (raw materials only)</p>
              <p className="text-2xl font-bold font-display text-brand-700">{formatCurrency(costResult.total)}</p>
              <p className="text-[11px] text-ink-400 mt-2 leading-relaxed">
                Full costing including packaging & overheads is available in the Batch Calculator.
              </p>
            </div>
          </Card>
        </div>
      </div>

      {/* Add ingredient modal */}
      <Modal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        title="Add Ingredient"
        subtitle="Quantity is per 1 Liter of base formula"
        footer={
          <>
            <Button variant="secondary" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button onClick={handleAddIngredient}>Add Ingredient</Button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <Label>Raw Material</Label>
            <Select
              value={newIng.rawMaterialId}
              onChange={(e) => {
                const rm = rawMaterialsById[e.target.value];
                setNewIng({ ...newIng, rawMaterialId: e.target.value, unit: rm?.unitType === "weight" ? "gm" : "ml" });
              }}
            >
              {rawMaterials.map((rm) => (
                <option key={rm.id} value={rm.id}>{rm.name}</option>
              ))}
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Quantity</Label>
              <Input type="number" step="0.01" value={newIng.quantity} onChange={(e) => setNewIng({ ...newIng, quantity: e.target.value })} placeholder="e.g. 50" />
            </div>
            <div>
              <Label>Unit</Label>
              <Select value={newIng.unit} onChange={(e) => setNewIng({ ...newIng, unit: e.target.value })}>
                {compatibleUnits.map((u) => (
                  <option key={u} value={u}>{u}</option>
                ))}
              </Select>
            </div>
          </div>
        </div>
      </Modal>

      {/* Version history */}
      <Modal open={historyOpen} onClose={() => setHistoryOpen(false)} title="Version History" subtitle="Revert to any earlier saved snapshot" size="lg">
        {formula.versions.length === 0 ? (
          <p className="text-sm text-ink-400 text-center py-8">No saved versions yet.</p>
        ) : (
          <div className="space-y-3">
            {formula.versions.map((v, idx) => (
              <div key={v.id} className="flex items-center justify-between border border-surface-border rounded-xl px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-ink-900">{v.label || "Snapshot"} {idx === 0 && <Badge tone="brand" className="ml-2">Latest</Badge>}</p>
                  <p className="text-xs text-ink-400 mt-0.5">{formatDateTime(v.timestamp)} · {v.ingredients.length} ingredients</p>
                </div>
                <Button variant="secondary" size="sm" onClick={() => handleRevert(v.id)}>
                  <RotateCcw size={13} /> Revert
                </Button>
              </div>
            ))}
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => {
          deleteIngredient(productId, deleteTarget.id);
          push("Ingredient removed", "info");
        }}
        title="Remove this ingredient?"
        description={`"${deleteTarget?.rawMaterialName}" will be removed from the formula.`}
      />
    </div>
  );
}

function IngredientRow({ ingredient, onUpdate, onDelete, rawMaterialsById }) {
  const rm = rawMaterialsById[ingredient.rawMaterialId];
  return (
    <div className="flex items-center gap-4 px-5 py-4 hover:bg-ink-900/[0.015] transition-colors">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-ink-900 truncate">{ingredient.rawMaterialName}</p>
        <p className="text-xs text-ink-400">{formatCurrency(rm?.price || 0)} / {rm?.unitType === "weight" ? "Kg" : "L"}</p>
      </div>
      <div className="flex items-center gap-2">
        <Input
          type="number"
          step="0.01"
          value={ingredient.quantity}
          onChange={(e) => onUpdate({ quantity: Number(e.target.value) })}
          className="w-24 text-center"
        />
        <Select
          value={ingredient.unit}
          onChange={(e) => onUpdate({ unit: e.target.value })}
          className="w-20"
        >
          {ALL_UNITS.filter((u) => !rm || unitType(u) === rm.unitType).map((u) => (
            <option key={u} value={u}>{u}</option>
          ))}
        </Select>
      </div>
      <div className="w-24 text-right">
        <p className="text-sm font-mono font-semibold text-ink-900">{formatCurrency(ingredient.cost)}</p>
      </div>
      <button onClick={onDelete} className="p-2 text-ink-400 hover:text-danger-500 hover:bg-danger-50 rounded-lg transition-colors shrink-0">
        <Trash2 size={15} />
      </button>
    </div>
  );
}