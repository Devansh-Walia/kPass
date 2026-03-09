import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Suspense, lazy } from "react";
import { AuthProvider } from "./contexts/AuthContext";
import { AuthGuard } from "./components/guards/AuthGuard";
import { AdminGuard } from "./components/guards/AdminGuard";
import { AppShell } from "./components/layout/AppShell";
import Login from "./pages/Login";
import ChangePassword from "./pages/ChangePassword";

const Dashboard = lazy(() => import("./pages/Dashboard"));
const AdminOverview = lazy(() => import("./pages/admin/Overview"));
const AdminUsers = lazy(() => import("./pages/admin/Users"));
const AdminUserDetail = lazy(() => import("./pages/admin/UserDetail"));
const AdminApps = lazy(() => import("./pages/admin/Apps"));
const FinanceDashboard = lazy(() => import("./pages/apps/finance/FinanceDashboard"));
const CrmLayout = lazy(() => import("./pages/apps/crm/CrmLayout"));

function Loading() {
  return <div className="flex items-center justify-center p-8">Loading...</div>;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Suspense fallback={<Loading />}>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/change-password" element={<ChangePassword />} />
            <Route element={<AuthGuard />}>
              <Route element={<AppShell />}>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route element={<AdminGuard />}>
                  <Route path="/admin/overview" element={<AdminOverview />} />
                  <Route path="/admin/users" element={<AdminUsers />} />
                  <Route path="/admin/users/:id" element={<AdminUserDetail />} />
                  <Route path="/admin/apps" element={<AdminApps />} />
                </Route>
                <Route path="/apps/finance/*" element={<FinanceDashboard />} />
                <Route path="/apps/crm/*" element={<CrmLayout />} />
              </Route>
            </Route>
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </Suspense>
      </AuthProvider>
    </BrowserRouter>
  );
}
