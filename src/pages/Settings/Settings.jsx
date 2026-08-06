import { useRef, useState } from "react";
import { Save, Download, Upload, Building2 } from "lucide-react";
import PageHeader from "../../components/ui/PageHeader";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import { Label, Input, Select, Textarea, FormRow } from "../../components/ui/Field";
import { useSettingsStore } from "../../store/useSettingsStore";
import { useToastStore } from "../../store/useToastStore";
import { useAuditStore } from "../../store/useAuditStore";
import { usePermissions } from "../../utils/permissions";

export default function Settings() {
  const { settings, updateSettings } = useSettingsStore();
  const push = useToastStore((s) => s.push);
  const logAudit = useAuditStore((s) => s.log);
  const { canEdit } = usePermissions();
  const fileInputRef = useRef(null);

  const [form, setForm] = useState(settings);

  function set(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function handleSave() {
    updateSettings({
      ...form,
      cgstPercent: Number(form.cgstPercent),
      sgstPercent: Number(form.sgstPercent),
      labourCostPerL: Number(form.labourCostPerL),
      electricityCostPerL: Number(form.electricityCostPerL),
      transportCostPerL: Number(form.transportCostPerL),
      miscCostPerL: Number(form.miscCostPerL),
      overheadMode: form.overheadMode,
    });
    logAudit("Settings changed", "Company / GST / overhead defaults updated");
    push("Settings saved");
  }

  function handleBackup() {
    const keys = ["hm-settings", "hm-raw-materials", "hm-packaging", "hm-products", "hm-formulas", "hm-production", "hm-users"];
    const backup = {};
    keys.forEach((k) => {
      const raw = localStorage.getItem(k);
      if (raw) backup[k] = JSON.parse(raw);
    });
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `hygiene-matic-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    push("Backup downloaded");
  }

  function handleRestore(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result);
        Object.entries(data).forEach(([key, value]) => {
          localStorage.setItem(key, JSON.stringify(value));
        });
        push("Backup restored — reloading…");
        setTimeout(() => window.location.reload(), 900);
      } catch {
        push("Could not read that backup file", "error");
      }
    };
    reader.readAsText(file);
  }

  return (
    <div>
      <PageHeader title="Settings" subtitle="Company details, tax rates, cost defaults, and data backup" actions={canEdit && <Button onClick={handleSave}><Save size={16} /> Save Changes</Button>} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <Building2 size={16} className="text-brand-600" />
            <p className="text-sm font-semibold text-ink-900">Company Information</p>
          </div>
          <div className="space-y-4">
            <div>
              <Label>Company Name</Label>
              <Input value={form.companyName} onChange={(e) => set("companyName", e.target.value)} />
            </div>
            <div>
              <Label>GSTIN</Label>
              <Input value={form.gstin} onChange={(e) => set("gstin", e.target.value)} className="font-mono" />
            </div>
            <div>
              <Label>Address</Label>
              <Textarea value={form.address} onChange={(e) => set("address", e.target.value)} rows={2} />
            </div>
            <div>
              <Label>Currency</Label>
              <Select value={form.currency} onChange={(e) => set("currency", e.target.value)}>
                <option value="INR">₹ INR — Indian Rupee</option>
                <option value="USD">$ USD — US Dollar</option>
                <option value="EUR">€ EUR — Euro</option>
              </Select>
            </div>
          </div>
        </Card>

        <div className="space-y-5">
          <Card>
            <p className="text-sm font-semibold text-ink-900 mb-4">GST Rates (default)</p>
            <FormRow cols={2}>
              <div>
                <Label hint="%">CGST</Label>
                <Input type="number" step="0.1" value={form.cgstPercent} onChange={(e) => set("cgstPercent", e.target.value)} />
              </div>
              <div>
                <Label hint="%">SGST</Label>
                <Input type="number" step="0.1" value={form.sgstPercent} onChange={(e) => set("sgstPercent", e.target.value)} />
              </div>
            </FormRow>
            <p className="text-xs text-ink-400 mt-3">Individual products can override this in Cost & Profit.</p>
          </Card>

          <Card>
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-semibold text-ink-900">Other Charges</p>
              <Select value={form.overheadMode} onChange={(e) => set("overheadMode", e.target.value)} className="!w-auto">
                <option value="perLiter">Per Liter</option>
                <option value="perBatch">Per Batch</option>
              </Select>
            </div>
            <FormRow cols={2}>
              <div>
                <Label>Labour Cost</Label>
                <Input type="number" step="0.1" value={form.labourCostPerL} onChange={(e) => set("labourCostPerL", e.target.value)} />
              </div>
              <div>
                <Label>Electricity</Label>
                <Input type="number" step="0.1" value={form.electricityCostPerL} onChange={(e) => set("electricityCostPerL", e.target.value)} />
              </div>
              <div>
                <Label>Transport</Label>
                <Input type="number" step="0.1" value={form.transportCostPerL} onChange={(e) => set("transportCostPerL", e.target.value)} />
              </div>
              <div>
                <Label>Misc.</Label>
                <Input type="number" step="0.1" value={form.miscCostPerL} onChange={(e) => set("miscCostPerL", e.target.value)} />
              </div>
            </FormRow>
          </Card>

          <Card>
            <p className="text-sm font-semibold text-ink-900 mb-1">Backup & Restore</p>
            <p className="text-xs text-ink-500 mb-4">Download all your data as a file, or restore from a previous backup.</p>
            <div className="flex gap-3">
              <Button variant="secondary" className="flex-1" onClick={handleBackup}><Download size={15} /> Download Backup</Button>
              <Button variant="secondary" className="flex-1" onClick={() => fileInputRef.current?.click()}><Upload size={15} /> Restore Backup</Button>
              <input ref={fileInputRef} type="file" accept=".json" onChange={handleRestore} className="hidden" />
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
