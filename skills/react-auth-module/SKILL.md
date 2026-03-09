---
name: react-auth-module
description: Use when implementing JWT authentication with React, including auth context, token refresh, route guards, and lazy-loaded protected routes
---

# React Auth Module Pattern

## AuthContext

```tsx
// client/src/contexts/AuthContext.tsx
import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { apiClient } from "../api/client";

interface User { id: string; email: string; firstName: string; lastName: string; role: "ADMIN" | "MEMBER"; mustChangePassword: boolean; }
interface AuthState { user: User | null; token: string | null; loading: boolean; login: (email: string, password: string) => Promise<void>; logout: () => void; }

const AuthContext = createContext<AuthState>(null!);
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient.post("/auth/refresh").then(res => {
      setToken(res.data.data.accessToken);
      setUser(res.data.data.user);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const login = async (email: string, password: string) => {
    const res = await apiClient.post("/auth/login", { email, password });
    setToken(res.data.data.accessToken);
    setUser(res.data.data.user);
  };

  const logout = () => {
    apiClient.post("/auth/logout");
    setToken(null);
    setUser(null);
  };

  return <AuthContext.Provider value={{ user, token, loading, login, logout }}>{children}</AuthContext.Provider>;
}
```

## Axios Interceptor

```typescript
// client/src/api/client.ts
import axios from "axios";

export const apiClient = axios.create({ baseURL: import.meta.env.VITE_API_URL, withCredentials: true });

let accessToken: string | null = null;
export const setAccessToken = (t: string | null) => { accessToken = t; };

apiClient.interceptors.request.use(config => {
  if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`;
  return config;
});

apiClient.interceptors.response.use(res => res, async err => {
  if (err.response?.status === 401 && !err.config._retry) {
    err.config._retry = true;
    const res = await apiClient.post("/auth/refresh");
    accessToken = res.data.data.accessToken;
    return apiClient(err.config);
  }
  return Promise.reject(err);
});
```

## Route Guards

```tsx
// client/src/components/guards/AuthGuard.tsx
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";

export function AuthGuard() {
  const { user, loading } = useAuth();
  if (loading) return <div>Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (user.mustChangePassword) return <Navigate to="/change-password" replace />;
  return <Outlet />;
}

// AdminGuard.tsx — same pattern, add: if (user.role !== "ADMIN") return <Navigate to="/dashboard" />;
```

## Lazy Route Setup

```tsx
const FinanceDashboard = lazy(() => import("./pages/apps/finance/FinanceDashboard"));
const CrmLayout = lazy(() => import("./pages/apps/crm/CrmLayout"));

<Route element={<AuthGuard />}>
  <Route path="/dashboard" element={<Dashboard />} />
  <Route path="/apps/finance/*" element={<Suspense fallback={<Loading />}><FinanceDashboard /></Suspense>} />
  <Route element={<AdminGuard />}>
    <Route path="/admin/*" element={<AdminPanel />} />
  </Route>
</Route>
```
