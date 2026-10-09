import { Navigate, Outlet } from 'react-router-dom';

// ponytail: stub hasta auth Consalud. En DEV no bloquea (trabajo local).
// En prod exige ips-token; cuando llegue la integración, validar firma/rol real.
const STAFF_KEY = 'ips-token';

export function hasStaffSession(): boolean {
  if (import.meta.env.DEV) return true;
  return !!localStorage.getItem(STAFF_KEY);
}

export function RequireStaff() {
  if (!hasStaffSession()) {
    return <Navigate to="/" replace />;
  }
  return <Outlet />;
}
