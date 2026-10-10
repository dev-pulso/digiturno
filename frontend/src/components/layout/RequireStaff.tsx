import { Navigate, Outlet } from 'react-router-dom';

const TOKEN_KEY = 'digiturno_token';
const USER_KEY = 'digiturno_user';
const LEGACY_KEY = 'ips-token';

export function hasStaffSession(): boolean {
  return !!(
    localStorage.getItem(TOKEN_KEY) ||
    localStorage.getItem(USER_KEY) ||
    localStorage.getItem(LEGACY_KEY)
  );
}

export function RequireStaff() {
  if (!hasStaffSession()) {
    return <Navigate to="/login" replace />;
  }
  return <Outlet />;
}
