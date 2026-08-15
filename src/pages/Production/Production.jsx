import { useState, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { Plus, Factory, CheckCircle2, Clock, XCircle } from "lucide-react";
import PageHeader from "../../components/ui/PageHeader";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import Badge from "../../components/ui/Badge";
import EmptyState from "../../components/ui/EmptyState";
import ConfirmDialog from "../../components/ui/ConfirmDialog";
import NewBatchModal from "./NewBatchModal";
import ProductionDetailModal from "./ProductionDetailModal";
import { useProductionStore } from "../../store/useProductionStore";
import { useProductStore } from "../../store/useProductStore";
import { useToastStore } from "../../store/useToastStore";
import { formatDateTime } from "../../utils/formatters";
import { usePermissions } from "../../utils/permissions";

export default function Production() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { batches, cancelBatch } = useProductionStore();
  const products = useProductStore((s) => s.products);
  const push = useToastStore((s) => s.push);
  const { canEdit } = usePermissions();

  const [newOpen, setNewOpen] = useState(searchParams.get("new") === "1");
  const [detailBatch, setDetailBatch] = useState(null);
  const [cancelTarget, setCancelTarget] = useState(null);

  const planned = useMemo(() => batches.filter((b) => b.status === "planned"), [batches]);
  const completedRecent = useMemo(() => batches.filter((b) => b.status === "completed").slice(0, 6), [batches]);

  function productName(id) {
    return products.find((p) => p.id === id)?.name || "Unknown product";
  }

  function closeNew() {
    setNewOpen(false);
    if (searchParams.get("new")) setSearchParams({});
  }

  return (
    <div>
      <PageHeader
        title="Production"
        subtitle="Plan a batch, run the production checklist, then confirm to update inventory"
        actions={canEdit && <Button onClick={() => setNewOpen(true)}><Plus size={16} /> New Batch</Button>}
      />

      <div className="mb-6">
        <p className="text-sm font-semibold text-ink-900 mb-3">Planned Batches</p>
        {planned.length === 0 ? (
          <Card><EmptyState icon={Factory} title="No batches planned" description="Create a new batch to start the production workflow." action={canEdit && <Button onClick={() => setNewOpen(true)}><Plus size={16} /> New Batch</Button>} /></Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {planned.map((b) => (
              <Card key={b.id} hover className="cursor-pointer" onClick={() => setDetailBatch(b)}>
                <div className="flex items-start justify-between mb-3">
                  <Badge tone="warning" dot><Clock size={11} className="mr-0.5" /> Planned</Badge>
                  <span className="text-xs font-mono text-ink-400">{b.batchNumber}</span>
                </div>
                <p className="font-semibold text-ink-900">{productName(b.productId)}</p>
                <p className="text-sm text-ink-500 mt-0.5">{b.quantityL}L · Operator: {b.operator}</p>
                <div className="flex items-center justify-between mt-3">
                  <p className="text-xs text-ink-400">{formatDateTime(b.date)}</p>
                  {canEdit && (
                    <button
                      onClick={(e) => { e.stopPropagation(); setCancelTarget(b); }}
                      className="flex items-center gap-1 text-xs text-ink-400 hover:text-warning-600 hover:bg-warning-50 px-1.5 py-1 rounded-lg transition-colors"
                      title="Cancel this production"
                    >
                      <XCircle size={13} /> Cancel
                    </button>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      <div>
        <p className="text-sm font-semibold text-ink-900 mb-3">Recently Completed</p>
        {completedRecent.length === 0 ? (
          <Card><EmptyState icon={CheckCircle2} title="No completed batches yet" /></Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {completedRecent.map((b) => (
              <Card key={b.id} className="cursor-pointer" hover onClick={() => setDetailBatch(b)}>
                <div className="flex items-start justify-between mb-3">
                  <Badge tone="success" dot><CheckCircle2 size={11} className="mr-0.5" /> Completed</Badge>
                  <span className="text-xs font-mono text-ink-400">{b.batchNumber}</span>
                </div>
                <p className="font-semibold text-ink-900">{productName(b.productId)}</p>
                <p className="text-sm text-ink-500 mt-0.5">{b.quantityL}L · Yield {b.yieldPercent}%</p>
                <p className="text-xs text-ink-400 mt-3">{formatDateTime(b.date)}</p>
              </Card>
            ))}
          </div>
        )}
      </div>

      <NewBatchModal open={newOpen} onClose={closeNew} onCreated={(batch) => setDetailBatch(batch)} />
      <ProductionDetailModal open={!!detailBatch} onClose={() => setDetailBatch(null)} batch={detailBatch} />

      <ConfirmDialog
        open={!!cancelTarget}
        onClose={() => setCancelTarget(null)}
        onConfirm={() => { cancelBatch(cancelTarget.id); push(`Batch ${cancelTarget.batchNumber} cancelled`, "info"); setCancelTarget(null); }}
        title="Cancel this production?"
        description="This production has not been finalized yet — no inventory has been deducted. It'll be kept in Batch History marked as Cancelled for the record."
      />
    </div>
  );
}
