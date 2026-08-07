import { useState } from "react";
import { LogIn, AlertCircle } from "lucide-react";
import { useNavigate, useLocation, Navigate } from "react-router-dom";
import { useAuthStore } from "../../store/useAuthStore";
import { Input, Label } from "../../components/ui/Field";
import Button from "../../components/ui/Button";

export default function Login() {
  const login = useAuthStore((s) => s.login);
  const currentUser = useAuthStore((s) => s.currentUser);
  const navigate = useNavigate();
  const location = useLocation();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  // Already signed in (or just signed in) — leave the login page
  if (currentUser) {
    const redirectTo = location.state?.from?.pathname || "/";
    return <Navigate to={redirectTo} replace />;
  }

  function handleSubmit(e) {
    e.preventDefault();
    const result = login(username, password);
    if (!result.ok) {
      setError(result.error);
    } else {
      setError("");
      navigate(location.state?.from?.pathname || "/", { replace: true });
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-bg bg-mesh-light px-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-white flex items-center justify-center shadow-soft mb-4 overflow-hidden">
            <img src="/logo-192.png" alt="Hygiene Matic" className="w-full h-full object-contain" />
          </div>
          <p className="font-display font-bold text-ink-900 text-xl">Hygiene Matic</p>
          <p className="text-sm text-ink-400 mt-0.5">Manufacturing OS — sign in to continue</p>
        </div>

        <div className="bg-white border border-surface-border rounded-3xl shadow-card p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>Username</Label>
              <Input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="e.g. aarav" autoFocus required />
            </div>
            <div>
              <Label>Password</Label>
              <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required />
            </div>

            {error && (
              <div className="flex items-start gap-2 bg-danger-50 border border-danger-500/20 rounded-xl px-3.5 py-3">
                <AlertCircle size={15} className="text-danger-600 mt-0.5 shrink-0" />
                <p className="text-xs text-danger-700 leading-relaxed">{error}</p>
              </div>
            )}

            <Button type="submit" className="w-full">
              <LogIn size={16} /> Sign In
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
