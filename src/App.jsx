import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import AppLayout from "./components/layout/AppLayout";
import Dashboard from "./pages/Dashboard/Dashboard";
import Products from "./pages/Products/Products";
import FormulaLibrary from "./pages/FormulaLibrary/FormulaLibrary";
import FormulaDetail from "./pages/FormulaLibrary/FormulaDetail";
import BatchCalculator from "./pages/BatchCalculator/BatchCalculator";
import RawMaterials from "./pages/RawMaterials/RawMaterials";
import Packaging from "./pages/Packaging/Packaging";
import Production from "./pages/Production/Production";
import Inventory from "./pages/Inventory/Inventory";
import Reports from "./pages/Reports/Reports";
import BatchHistory from "./pages/BatchHistory/BatchHistory";
import UsersPage from "./pages/Users/Users";
import Settings from "./pages/Settings/Settings";
import Login from "./pages/Login/Login";
import AccessDenied from "./pages/AccessDenied/AccessDenied";
import AuditLog from "./pages/AuditLog/AuditLog";
import { useAuthStore } from "./store/useAuthStore";
import { usePermissions } from "./utils/permissions";

function RequireAuth({ children }) {
  const currentUser = useAuthStore((s) => s.currentUser);
  const location = useLocation();
  if (!currentUser) return <Navigate to="/login" replace state={{ from: location }} />;
  return children;
}

// Wraps a page element and shows the 403 page instead if the signed-in role
// isn't permitted on this route (spec §13 — role-based sidebar & access).
function Guarded({ path, children }) {
  const { isPageAllowed } = usePermissions();
  return isPageAllowed(path) ? children : <AccessDenied />;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          element={
            <RequireAuth>
              <AppLayout />
            </RequireAuth>
          }
        >
          <Route path="/" element={<Dashboard />} />
          <Route path="/products" element={<Guarded path="/products"><Products /></Guarded>} />
          <Route path="/formula-library" element={<Guarded path="/formula-library"><FormulaLibrary /></Guarded>} />
          <Route path="/formula-library/:productId" element={<Guarded path="/formula-library"><FormulaDetail /></Guarded>} />
          <Route path="/batch-calculator" element={<Guarded path="/batch-calculator"><BatchCalculator /></Guarded>} />
          <Route path="/raw-materials" element={<Guarded path="/raw-materials"><RawMaterials /></Guarded>} />
          <Route path="/packaging" element={<Guarded path="/packaging"><Packaging /></Guarded>} />
          <Route path="/production" element={<Guarded path="/production"><Production /></Guarded>} />
          <Route path="/inventory" element={<Guarded path="/inventory"><Inventory /></Guarded>} />
          <Route path="/reports" element={<Guarded path="/reports"><Reports /></Guarded>} />
          <Route path="/batch-history" element={<Guarded path="/batch-history"><BatchHistory /></Guarded>} />
          <Route path="/users" element={<Guarded path="/users"><UsersPage /></Guarded>} />
          <Route path="/audit-log" element={<Guarded path="/audit-log"><AuditLog /></Guarded>} />
          <Route path="/settings" element={<Guarded path="/settings"><Settings /></Guarded>} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
