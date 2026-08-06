import { ShieldAlert } from "lucide-react";
import { Link } from "react-router-dom";
import Button from "../../components/ui/Button";
import { usePermissions } from "../../utils/permissions";

export default function AccessDenied() {
  const { role } = usePermissions();
  return (
    <div className="flex flex-col items-center justify-center text-center py-24 px-4">
      <div className="w-16 h-16 rounded-2xl bg-danger-50 flex items-center justify-center mb-5">
        <ShieldAlert size={28} className="text-danger-500" />
      </div>
      <p className="text-2xl font-display font-bold text-ink-900 mb-1.5">403 — Access Denied</p>
      <p className="text-sm text-ink-500 max-w-sm mb-6">
        Your role (<span className="font-semibold text-ink-700">{role}</span>) doesn't have permission to view this page. Ask a Super Admin if you need access.
      </p>
      <Link to="/"><Button variant="secondary">Back to Dashboard</Button></Link>
    </div>
  );
}
