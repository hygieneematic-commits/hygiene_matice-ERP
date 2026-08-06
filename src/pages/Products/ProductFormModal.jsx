import { useEffect, useState } from "react";
import Modal from "../../components/ui/Modal";
import Button from "../../components/ui/Button";
import { Label, Input, Select, FormRow } from "../../components/ui/Field";
import { useProductStore } from "../../store/useProductStore";
import { usePackagingStore } from "../../store/usePackagingStore";

const CATEGORIES = ["Floor Cleaner", "Glass Cleaner", "Toilet Cleaner", "Dishwash", "Handwash", "Phenyl", "Other"];
const PACK_SIZES = [100, 200, 250, 500, 1000, 5000];

const defaultBOMFor = (packSizeMl, packagingItems) => {
  const bottleId = packagingItems.find((p) => p.category === "Bottle" && p.name.includes(String(packSizeMl)))?.id
    || packagingItems.find((p) => p.category === "Bottle")?.id;
  const cap = packagingItems.find((p) => p.category === "Cap")?.id;
  const label = packagingItems.find((p) => p.category === "Label")?.id;
  const shrink = packagingItems.find((p) => p.category === "Shrink")?.id;
  const carton = packagingItems.find((p) => p.category === "Carton")?.id;
  const tape = packagingItems.find((p) => p.category === "Tape")?.id;
  const perCarton = packSizeMl <= 300 ? 24 : 12;
  return [
    bottleId && { packagingId: bottleId, qtyPerUnit: 1 },
    cap && { packagingId: cap, qtyPerUnit: 1 },
    label && { packagingId: label, qtyPerUnit: 1 },
    shrink && { packagingId: shrink, qtyPerUnit: 1 },
    carton && { packagingId: carton, qtyPerUnit: 1 / perCarton },
    tape && { packagingId: tape, qtyPerUnit: 1 / perCarton },
  ].filter(Boolean);
};

export default function ProductFormModal({ open, onClose, product, onSaved }) {
  const { addProduct, updateProduct } = useProductStore();
  const packagingItems = usePackagingStore((s) => s.packagingItems);
  const isEdit = !!product;

  const [form, setForm] = useState({
    name: "",
    category: CATEGORIES[0],
    sku: "",
    packSizeMl: 500,
    sellingPricePerL: 80,
  });

  useEffect(() => {
    if (open) {
      setForm(
        product
          ? {
              name: product.name,
              category: product.category,
              sku: product.sku,
              packSizeMl: product.packSizeMl,
              sellingPricePerL: product.sellingPricePerL,
            }
          : { name: "", category: CATEGORIES[0], sku: "", packSizeMl: 500, sellingPricePerL: 80 }
      );
    }
  }, [open, product]);

  function set(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!form.name.trim() || !form.sku.trim()) return;

    if (isEdit) {
      updateProduct(product.id, form);
      onSaved(product.id, false);
    } else {
      const packSizeMl = Number(form.packSizeMl);
      const id = addProduct({
        ...form,
        packSizeMl,
        sellingPricePerL: Number(form.sellingPricePerL),
        packagingBOM: defaultBOMFor(packSizeMl, packagingItems),
      });
      onSaved(id, true);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? "Edit Product" : "Add Product"}
      subtitle={isEdit ? "Update product details" : "Create a new product — you can add its formula next"}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit}>{isEdit ? "Save Changes" : "Add Product"}</Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label>Product Name</Label>
          <Input value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="e.g. Lemon Floor Cleaner" required />
        </div>
        <FormRow cols={2}>
          <div>
            <Label>Category</Label>
            <Select value={form.category} onChange={(e) => set("category", e.target.value)}>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </Select>
          </div>
          <div>
            <Label>SKU</Label>
            <Input value={form.sku} onChange={(e) => set("sku", e.target.value)} placeholder="e.g. HM-FC-LEM" required />
          </div>
        </FormRow>
        <FormRow cols={2}>
          <div>
            <Label hint="Retail pack">Pack Size</Label>
            <Select value={form.packSizeMl} onChange={(e) => set("packSizeMl", e.target.value)}>
              {PACK_SIZES.map((s) => (
                <option key={s} value={s}>{s} ml</option>
              ))}
            </Select>
          </div>
          <div>
            <Label hint="Pre-GST">Selling Price / Liter</Label>
            <Input type="number" step="0.01" value={form.sellingPricePerL} onChange={(e) => set("sellingPricePerL", e.target.value)} required />
          </div>
        </FormRow>
        {!isEdit && (
          <p className="text-xs text-ink-400 bg-ink-900/[0.03] rounded-xl px-3.5 py-3">
            Default packaging (bottle, cap, label, shrink, carton, tape) will be assigned automatically based on pack size — editable anytime from the product's formula page.
          </p>
        )}
      </form>
    </Modal>
  );
}
