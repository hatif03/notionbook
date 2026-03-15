const pendingAuth = new Map<
  string,
  { codeVerifier: string; createdAt: number }
>();

const SESSION_TTL_MS = 10 * 60 * 1000; // 10 minutes

export function storeAuthSession(state: string, codeVerifier: string): void {
  pendingAuth.set(state, {
    codeVerifier,
    createdAt: Date.now(),
  });
}

export function getAuthSession(state: string): string | null {
  const session = pendingAuth.get(state);
  if (!session) return null;
  if (Date.now() - session.createdAt > SESSION_TTL_MS) {
    pendingAuth.delete(state);
    return null;
  }
  pendingAuth.delete(state);
  return session.codeVerifier;
}
