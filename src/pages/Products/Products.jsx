import { useState, useMemo } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Plus, Search, Pencil, Trash2, FlaskConical, Package } from "lucide-react";
import PageHeader from "../../components/ui/PageHeader";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import Badge from "../../components/ui/Badge";
import { Input } from "../../components/ui/Field";
import EmptyState from "../../components/ui/EmptyState";
import DataTable from "../../components/ui/DataTable";
import ConfirmDialog from "../../components/ui/ConfirmDialog";
import ProductFormModal from "./ProductFormModal";
import { useProductStore } from "../../store/useProductStore";
import { useFormulaStore } from "../../store/useFormulaStore";
import { useToastStore } from "../../store/useToastStore";
import { formatCurrency } from "../../utils/formatters";
import { usePermissions } from "../../utils/permissions";

export default function Products() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { products, deleteProduct } = useProductStore();
  const { ensureFormula } = useFormulaStore();
  const push = useToastStore((s) => s.push);
  const { canEdit } = usePermissions();

  const [query, setQuery] = useState("");
  const [modalOpen, setModalOpen] = useState(searchParams.get("new") === "1");
  const [editing, setEditing] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return products;
    return products.filter(
      (p) => p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q) || p.category.toLowerCase().includes(q)
    );
  }, [products, query]);

  function openNew() {
    setEditing(null);
    setModalOpen(true);
  }

  function openEdit(product) {
    setEditing(product);
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditing(null);
    if (searchParams.get("new")) setSearchParams({});
  }

  function handleSaved(productId, isNew) {
    if (isNew) ensureFormula(productId);
    push(isNew ? "Product added" : "Product updated");
    closeModal();
  }

  function handleDelete() {
    if (!deleteTarget) return;
    deleteProduct(deleteTarget.id);
    push("Product deleted", "info");
    setDeleteTarget(null);
  }

  const columns = [
    {
      key: "name",
      header: "Product",
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-brand-gradient-soft flex items-center justify-center shrink-0">
            <Package size={16} className="text-brand-600" />
          </div>
          <div>
            <p className="font-medium text-ink-900">{row.name}</p>
            <p className="text-xs text-ink-400 font-mono">{row.sku}</p>
          </div>
        </div>
      ),
    },
    { key: "category", header: "Category", render: (row) => <Badge tone="brand">{row.category}</Badge> },
    { key: "packSizeMl", header: "Pack Size", render: (row) => `${row.packSizeMl} ml` },
    {
      key: "sellingPricePerL",
      header: "Selling Price / L",
      align: "right",
      render: (row) => <span className="font-mono font-medium">{formatCurrency(row.sellingPricePerL)}</span>,
    },
    {
      key: "active",
      header: "Status",
      render: (row) => (
        <Badge tone={row.active ? "success" : "neutral"} dot>
          {row.active ? "Active" : "Inactive"}
        </Badge>
      ),
    },
    {
      key: "actions",
      header: "",
      align: "right",
      render: (row) => (
        <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => navigate(`/formula-library/${row.id}`)}
            title="Open formula"
            className="p-2 text-ink-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors"
          >
            <FlaskConical size={15} />
          </button>
          {canEdit && (
            <>
              <button
                onClick={() => openEdit(row)}
                title="Edit product"
                className="p-2 text-ink-400 hover:text-ink-700 hover:bg-ink-900/5 rounded-lg transition-colors"
              >
                <Pencil size={15} />
              </button>
              <button
                onClick={() => setDeleteTarget(row)}
                title="Delete product"
                className="p-2 text-ink-400 hover:text-danger-500 hover:bg-danger-50 rounded-lg transition-colors"
              >
                <Trash2 size={15} />
              </button>
            </>
          )}
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Products"
        subtitle={`${products.length} products in your catalog`}
        actions={
          canEdit && (
            <Button onClick={openNew}>
              <Plus size={16} /> Add Product
            </Button>
          )
        }
      />

      <Card padding="p-5">
        <div className="mb-4">
          <div className="relative max-w-sm">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400" />
            <Input
              placeholder="Search products, SKU, or category…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <DataTable
          columns={columns}
          data={filtered}
          onRowClick={(row) => navigate(`/formula-library/${row.id}`)}
          emptyState={
            <EmptyState
              icon={Package}
              title={query ? "No products match your search" : "No products yet"}
              description={query ? "Try a different search term." : "Add your first product to start building formulas and running batches."}
              action={!query && <Button onClick={openNew}><Plus size={16} /> Add Product</Button>}
            />
          }
        />
      </Card>

      <ProductFormModal open={modalOpen} onClose={closeModal} product={editing} onSaved={handleSaved} />
      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title={`Delete "${deleteTarget?.name}"?`}
        description="This removes the product and its formula. This can't be undone."
      />
    </div>
  );
}
