import { Navigate, Outlet } from 'react-router-dom';

const TOKEN_KEY = 'digiturno_token';
const USER_KEY = 'digiturno_user';

export function hasStaffSession(): boolean {
  // Limpiar vestigio de token de prueba anterior si existe
  if (localStorage.getItem('ips-token') && !localStorage.getItem(TOKEN_KEY)) {
    localStorage.removeItem('ips-token');
  }
  return !!(localStorage.getItem(TOKEN_KEY) && localStorage.getItem(USER_KEY));
}

export function RequireStaff() {
  if (!hasStaffSession()) {
    return <Navigate to="/login" replace />;
  }
  return <Outlet />;
}
