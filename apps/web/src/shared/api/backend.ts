import 'server-only';
// Server-side transport. Never pass API credentials to client components.
export function backendFetch(path: string, init?: RequestInit) {
  const base =
    process.env.API_URL ??
    process.env.NEXT_PUBLIC_API_URL ??
    'http://localhost:3001/api';
  return fetch(`${base.replace(/\/$/, '')}${path}`, {
    ...init,
    cache: 'no-store',
    signal: AbortSignal.timeout(10_000),
  });
}
