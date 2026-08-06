import { useState } from "react";
import { Plus, Pencil, Trash2, Users as UsersIcon, Shield, KeyRound, Power } from "lucide-react";
import PageHeader from "../../components/ui/PageHeader";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import Badge from "../../components/ui/Badge";
import Modal from "../../components/ui/Modal";
import { Label, Input, Select, FormRow } from "../../components/ui/Field";
import ConfirmDialog from "../../components/ui/ConfirmDialog";
import DataTable from "../../components/ui/DataTable";
import EmptyState from "../../components/ui/EmptyState";
import { useUserStore } from "../../store/useUserStore";
import { useToastStore } from "../../store/useToastStore";
import { useAuditStore } from "../../store/useAuditStore";
import { formatDateTime } from "../../utils/formatters";
import { ROLE_PERMISSIONS } from "../../utils/permissions";

const ROLES = Object.keys(ROLE_PERMISSIONS);
const DEPARTMENTS = ["Management", "Production", "Inventory", "Sales", "Purchase", "Quality"];

const blank = { name: "", username: "", password: "", email: "", mobile: "", employeeId: "", department: "Production", role: "Production Staff" };

export default function Users() {
  const { users, addUser, updateUser, deleteUser, resetPassword, setActive } = useUserStore();
  const push = useToastStore((s) => s.push);
  const logAudit = useAuditStore((s) => s.log);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [resetTarget, setResetTarget] = useState(null);
  const [newPassword, setNewPassword] = useState("");
  const [form, setForm] = useState(blank);

  function openNew() {
    setEditing(null);
    setForm(blank);
    setModalOpen(true);
  }
  function openEdit(u) {
    setEditing(u);
    setForm({ ...blank, ...u });
    setModalOpen(true);
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!form.name.trim() || !form.username.trim()) return;
    if (editing) {
      updateUser(editing.id, form);
      logAudit("User updated", `${form.name} — role set to ${form.role}`);
      push("User updated");
    } else {
      addUser(form);
      logAudit("User created", `${form.name} added as ${form.role}`);
      push("User added");
    }
    setModalOpen(false);
  }

  function handleResetPassword() {
    if (!newPassword.trim()) return;
    resetPassword(resetTarget.id, newPassword);
    logAudit("Password reset", `Password reset for ${resetTarget.name}`);
    push(`Password reset for ${resetTarget.name}`);
    setResetTarget(null);
    setNewPassword("");
  }

  function toggleActive(u) {
    setActive(u.id, !u.active);
    logAudit(u.active ? "User disabled" : "User enabled", u.name);
    push(u.active ? `${u.name} disabled` : `${u.name} enabled`);
  }

  const columns = [
    {
      key: "name",
      header: "User",
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-brand-gradient flex items-center justify-center text-white text-xs font-semibold shrink-0">
            {row.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
          </div>
          <div>
            <p className="font-medium text-ink-900">{row.name}</p>
            <p className="text-xs text-ink-400">{row.email} · {row.employeeId}</p>
          </div>
        </div>
      ),
    },
    { key: "role", header: "Role", render: (row) => <Badge tone="brand" icon={Shield}>{row.role}</Badge> },
    { key: "department", header: "Department", render: (row) => <span className="text-sm text-ink-600">{row.department}</span> },
    { key: "active", header: "Status", render: (row) => <Badge tone={row.active ? "success" : "neutral"} dot>{row.active ? "Active" : "Disabled"}</Badge> },
    { key: "lastLogin", header: "Last Login", render: (row) => <span className="text-xs text-ink-400">{row.lastLogin ? formatDateTime(row.lastLogin) : "Never"}</span> },
    {
      key: "actions",
      header: "",
      align: "right",
      render: (row) => (
        <div className="flex items-center justify-end gap-1">
          <button onClick={() => setResetTarget(row)} title="Reset password" className="p-2 text-ink-400 hover:text-ink-700 hover:bg-ink-900/5 rounded-lg transition-colors"><KeyRound size={15} /></button>
          <button onClick={() => toggleActive(row)} title={row.active ? "Disable user" : "Enable user"} className="p-2 text-ink-400 hover:text-warning-600 hover:bg-warning-50 rounded-lg transition-colors"><Power size={15} /></button>
          <button onClick={() => openEdit(row)} className="p-2 text-ink-400 hover:text-ink-700 hover:bg-ink-900/5 rounded-lg transition-colors"><Pencil size={15} /></button>
          <button onClick={() => setDeleteTarget(row)} className="p-2 text-ink-400 hover:text-danger-500 hover:bg-danger-50 rounded-lg transition-colors"><Trash2 size={15} /></button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Users"
        subtitle="Create users, assign roles, reset passwords, and enable/disable access"
        actions={<Button onClick={openNew}><Plus size={16} /> Add User</Button>}
      />

      <Card padding="p-5">
        <DataTable columns={columns} data={users} emptyState={<EmptyState icon={UsersIcon} title="No users yet" action={<Button onClick={openNew}><Plus size={16} /> Add User</Button>} />} />
      </Card>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? "Edit User" : "Add User"}
        size="lg"
        footer={<><Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button><Button onClick={handleSubmit}>{editing ? "Save Changes" : "Add User"}</Button></>}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormRow cols={2}>
            <div>
              <Label>Full Name</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Priya Deshmukh" required />
            </div>
            <div>
              <Label>Employee ID</Label>
              <Input value={form.employeeId} onChange={(e) => setForm({ ...form, employeeId: e.target.value })} placeholder="e.g. HM-007" />
            </div>
          </FormRow>
          <FormRow cols={2}>
            <div>
              <Label>Username</Label>
              <Input value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} placeholder="e.g. priya" required />
            </div>
            <div>
              <Label hint={editing ? "Leave as-is to keep current password" : ""}>Password</Label>
              <Input type="text" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Temporary password" required={!editing} />
            </div>
          </FormRow>
          <FormRow cols={2}>
            <div>
              <Label>Email</Label>
              <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="name@hygienematic.in" />
            </div>
            <div>
              <Label>Mobile</Label>
              <Input value={form.mobile} onChange={(e) => setForm({ ...form, mobile: e.target.value })} placeholder="98200 11223" />
            </div>
          </FormRow>
          <FormRow cols={2}>
            <div>
              <Label>Department</Label>
              <Select value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })}>
                {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
              </Select>
            </div>
            <div>
              <Label>Role</Label>
              <Select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
                {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
              </Select>
            </div>
          </FormRow>
          <p className="text-xs text-ink-400 bg-ink-900/[0.02] border border-surface-border rounded-xl px-3.5 py-2.5">
            {ROLE_PERMISSIONS[form.role]?.description} — sidebar and pages update automatically for this role.
          </p>
        </form>
      </Modal>

      <Modal
        open={!!resetTarget}
        onClose={() => { setResetTarget(null); setNewPassword(""); }}
        title={`Reset password for ${resetTarget?.name}`}
        footer={<><Button variant="secondary" onClick={() => setResetTarget(null)}>Cancel</Button><Button onClick={handleResetPassword}>Reset Password</Button></>}
      >
        <div>
          <Label>New Password</Label>
          <Input type="text" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Enter a new temporary password" />
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => { deleteUser(deleteTarget.id); logAudit("User deleted", deleteTarget.name); push("User removed", "info"); setDeleteTarget(null); }}
        title={`Remove "${deleteTarget?.name}"?`}
      />
    </div>
  );
}
