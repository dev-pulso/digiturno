import { createContext } from 'react';
import type { ConsaludIdentity } from '@/lib/embedded-auth';

export type AuthContextValue = {
  identity: ConsaludIdentity | null;
  ready: boolean;
  authenticated: boolean;
};

export const EmbeddedAuthContext = createContext<AuthContextValue>({ identity: null, ready: false, authenticated: false });
