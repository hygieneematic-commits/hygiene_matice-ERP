import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Search, FlaskConical, ChevronRight, Layers } from "lucide-react";
import PageHeader from "../../components/ui/PageHeader";
import Card from "../../components/ui/Card";
import Badge from "../../components/ui/Badge";
import { Input } from "../../components/ui/Field";
import EmptyState from "../../components/ui/EmptyState";
import { useProductStore } from "../../store/useProductStore";
import { useFormulaStore } from "../../store/useFormulaStore";

export default function FormulaLibrary() {
  const navigate = useNavigate();
  const products = useProductStore((s) => s.products);
  const formulasByProductId = useFormulaStore((s) => s.formulasByProductId);
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return products;
    return products.filter((p) => p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q));
  }, [products, query]);

  return (
    <div>
      <PageHeader title="Formula Library" subtitle="Every product's base formula, defined per 1 Liter" />

      <div className="mb-5 max-w-sm relative">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400" />
        <Input placeholder="Search formulas…" value={query} onChange={(e) => setQuery(e.target.value)} className="pl-10" />
      </div>

      {filtered.length === 0 ? (
        <Card><EmptyState icon={FlaskConical} title="No formulas found" description="Try a different search term." /></Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((product) => {
            const formula = formulasByProductId[product.id] || { ingredients: [], versions: [] };
            return (
              <Card
                key={product.id}
                hover
                className="cursor-pointer"
                onClick={() => navigate(`/formula-library/${product.id}`)}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="w-10 h-10 rounded-xl bg-brand-gradient-soft flex items-center justify-center">
                    <FlaskConical size={18} className="text-brand-600" />
                  </div>
                  <ChevronRight size={16} className="text-ink-400 mt-2" />
                </div>
                <p className="font-semibold text-ink-900 mb-1">{product.name}</p>
                <Badge tone="brand" className="mb-3">{product.category}</Badge>
                <div className="flex items-center gap-4 text-xs text-ink-500 pt-3 border-t border-surface-border">
                  <span className="flex items-center gap-1"><Layers size={12} /> {formula.ingredients.length} ingredients</span>
                  <span>{formula.versions.length} version{formula.versions.length !== 1 ? "s" : ""}</span>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
