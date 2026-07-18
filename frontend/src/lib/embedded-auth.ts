export type ConsaludIdentity = {
  id: string;
  name: string;
  permissions: string[];
  area_codes: string[];
};

let accessToken: string | null = null;
let authRequiredHandler: (() => void) | null = null;

export function setAccessToken(token: string | null) {
  accessToken = token;
}

export function getAccessToken() {
  return accessToken;
}

export function onAuthenticationRequired(handler: () => void) {
  authRequiredHandler = handler;
  return () => { authRequiredHandler = null; };
}

export function requestAuthentication() {
  authRequiredHandler?.();
}

export function can(identity: ConsaludIdentity | null, permission: string) {
  return Boolean(identity?.permissions.includes(permission));
}
