import { Navigate, Outlet } from 'react-router-dom';
import { toast } from 'sonner';
import { useEffect, useRef } from 'react';
import { hasStaffSession, getStaffUser } from './RequireStaff';

export function RequireAdmin() {
  const user = getStaffUser();
  const hasSession = hasStaffSession();
  const notifiedRef = useRef(false);

  useEffect(() => {
    if (hasSession && user?.rol !== 'admin' && !notifiedRef.current) {
      notifiedRef.current = true;
      toast.error('Acceso restringido: Se requieren permisos de administrador.');
    }
  }, [hasSession, user]);

  if (!hasSession) {
    return <Navigate to="/login" replace />;
  }

  if (user?.rol !== 'admin') {
    if (user?.rol === 'medico') {
      const codigo = user.area_predeterminada?.codigo || 'c1';
      return <Navigate to={`/consultorio/${codigo}`} replace />;
    }
    return <Navigate to="/recepcion" replace />;
  }

  return <Outlet />;
}
