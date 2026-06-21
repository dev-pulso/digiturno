import { Outlet } from 'react-router-dom';
import { Toaster } from 'sonner';

export function AppShell() {
  return (
    <>
      <Outlet />
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            background: '#0d1420',
            color: '#e8edf5',
            border: '1px solid rgba(255,255,255,0.12)',
          },
        }}
      />
    </>
  );
}
