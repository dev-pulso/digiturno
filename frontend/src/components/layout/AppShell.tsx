import { Outlet } from 'react-router-dom';
import { Toaster } from 'sonner';

export function AppShell() {
  return (
    <>
      <Outlet />
      <Toaster
        position="bottom-right"
        theme="system"
        richColors
      />
    </>
  );
}
