import { createBrowserRouter } from 'react-router-dom';
import { LandingPage } from '@/features/landing/pages/LandingPage';
import { ReceptionPage } from '@/features/reception/pages/ReceptionPage';
import { ConsultorioPage } from '@/features/consultorio/pages/ConsultorioPage';
import { DisplayPage } from '@/features/display/pages/DisplayPage';
import { KioskPage } from '@/features/kiosk/pages/KioskPage';
import { AdminAreasPage } from '@/features/admin/pages/AdminAreasPage';
import { AdminTiposExamenesPage } from '@/features/admin/pages/AdminTiposExamenesPage';
import { AdminVideosPage } from '@/features/admin/pages/AdminVideosPage';
import { DashboardPage } from '@/features/dashboard/pages/DashboardPage';
import { AppShell } from '@/components/layout/AppShell';
import { RequireStaff } from '@/components/layout/RequireStaff';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppShell />,
    children: [
      { index: true, element: <LandingPage /> },
      // públicas
      { path: 'display', element: <DisplayPage /> },
      { path: 'display/:areaId', element: <DisplayPage /> },
      { path: 'kiosco', element: <KioskPage /> },
      // staff (stub hasta auth Consalud)
      {
        element: <RequireStaff />,
        children: [
          { path: 'recepcion', element: <ReceptionPage /> },
          { path: 'consultorio/:areaId', element: <ConsultorioPage /> },
          { path: 'admin/areas', element: <AdminAreasPage /> },
          { path: 'admin/examenes', element: <AdminTiposExamenesPage /> },
          { path: 'admin/videos', element: <AdminVideosPage /> },
          { path: 'dashboard', element: <DashboardPage /> },
        ],
      },
    ],
  },
]);
