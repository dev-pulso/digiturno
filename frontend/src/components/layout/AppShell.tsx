import { Toaster } from 'sonner';
import { AccessBoundary } from '@/components/auth/access-boundary';

export function AppShell() {
  return (
    <>
      <AccessBoundary />
      <Toaster
        position="bottom-right"
        theme="system"
        richColors
      />
    </>
  );
}
