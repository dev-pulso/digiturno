import { createBrowserRouter, Navigate } from 'react-router-dom';
import { LandingPage } from '@/features/landing/pages/LandingPage';
import { ReceptionPage } from '@/features/reception/pages/ReceptionPage';
import { ConsultorioPage } from '@/features/consultorio/pages/ConsultorioPage';
import { DisplayPage } from '@/features/display/pages/DisplayPage';
import { KioskPage } from '@/features/kiosk/pages/KioskPage';
import { AdminAreasPage } from '@/features/admin/pages/AdminAreasPage';
import { AdminTiposExamenesPage } from '@/features/admin/pages/AdminTiposExamenesPage';
import { AdminVideosPage } from '@/features/admin/pages/AdminVideosPage';
import { AdminPersonalPage } from '@/features/admin/pages/AdminPersonalPage';
import { DashboardPage } from '@/features/dashboard/pages/DashboardPage';
import { LoginPage } from '@/features/auth/pages/LoginPage';
import { AppShell } from '@/components/layout/AppShell';
import { RequireStaff, hasStaffSession, getStaffUser } from '@/components/layout/RequireStaff';
import { RequireAdmin } from '@/components/layout/RequireAdmin';

function RootIndex() {
  if (!hasStaffSession()) {
    return <Navigate to="/login" replace />;
  }
  const user = getStaffUser();
  if (user?.rol === 'medico') {
    const codigo = user.area_predeterminada?.codigo || 'c1';
    return <Navigate to={`/consultorio/${codigo}`} replace />;
  }
  return <LandingPage />;
}

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppShell />,
    children: [
      { index: true, element: <RootIndex /> },
      // públicas
      { path: 'login', element: <LoginPage /> },
      { path: 'display', element: <DisplayPage /> },
      { path: 'display/:areaId', element: <DisplayPage /> },
      { path: 'kiosco', element: <KioskPage /> },
      // staff (autenticado)
      {
        element: <RequireStaff />,
        children: [
          { path: 'recepcion', element: <ReceptionPage /> },
          { path: 'consultorio/:areaId', element: <ConsultorioPage /> },
          // exclusivo administradores
          {
            element: <RequireAdmin />,
            children: [
              { path: 'admin/personal', element: <AdminPersonalPage /> },
              { path: 'admin/areas', element: <AdminAreasPage /> },
              { path: 'admin/examenes', element: <AdminTiposExamenesPage /> },
              { path: 'admin/videos', element: <AdminVideosPage /> },
              { path: 'dashboard', element: <DashboardPage /> },
            ],
          },
        ],
      },
    ],
  },
]);
