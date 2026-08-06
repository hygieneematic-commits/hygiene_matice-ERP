import { useState, useMemo } from "react";
import { ClipboardList, Search, Trash2 } from "lucide-react";
import PageHeader from "../../components/ui/PageHeader";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import { Input } from "../../components/ui/Field";
import DataTable from "../../components/ui/DataTable";
import EmptyState from "../../components/ui/EmptyState";
import ConfirmDialog from "../../components/ui/ConfirmDialog";
import { useAuditStore } from "../../store/useAuditStore";
import { useToastStore } from "../../store/useToastStore";
import { formatDateTime } from "../../utils/formatters";

export default function AuditLog() {
  const { logs, clear } = useAuditStore();
  const push = useToastStore((s) => s.push);
  const [query, setQuery] = useState("");
  const [confirmClear, setConfirmClear] = useState(false);

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return logs;
    return logs.filter((l) => l.action.toLowerCase().includes(q) || l.details?.toLowerCase().includes(q) || l.user?.toLowerCase().includes(q));
  }, [logs, query]);

  const columns = [
    { key: "timestamp", header: "When", render: (row) => <span className="text-ink-500 text-sm whitespace-nowrap">{formatDateTime(row.timestamp)}</span> },
    { key: "action", header: "Action", render: (row) => <span className="font-medium text-ink-900">{row.action}</span> },
    { key: "details", header: "Details", render: (row) => <span className="text-ink-500 text-sm">{row.details || "—"}</span> },
    { key: "user", header: "User", render: (row) => <span className="text-ink-700 text-sm">{row.user}</span> },
  ];

  return (
    <div>
      <PageHeader
        title="Audit Log"
        subtitle="Formula changes, price changes, batch creation, settings and login activity"
        actions={logs.length > 0 && <Button variant="secondary" onClick={() => setConfirmClear(true)}><Trash2 size={15} /> Clear Log</Button>}
      />

      <Card padding="p-5">
        <div className="relative max-w-sm mb-4">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400" />
          <Input placeholder="Search activity…" value={query} onChange={(e) => setQuery(e.target.value)} className="pl-10" />
        </div>
        <DataTable columns={columns} data={filtered} emptyState={<EmptyState icon={ClipboardList} title="No activity recorded yet" description="Actions across the ERP will show up here as they happen." />} />
      </Card>

      <ConfirmDialog
        open={confirmClear}
        onClose={() => setConfirmClear(false)}
        onConfirm={() => { clear(); push("Audit log cleared", "info"); setConfirmClear(false); }}
        title="Clear the entire audit log?"
        description="This cannot be undone."
      />
    </div>
  );
}
