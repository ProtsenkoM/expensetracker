import 'server-only';
import { backendFetch } from '@/shared/api/backend';
import { getSessionToken } from '@/shared/auth/session-cookie';

export { sessionCookie } from '@/shared/auth/session-cookie';
export type User = { id: string; name: string; email: string };
export type SessionResult =
  | { status: 'authenticated'; user: User }
  | { status: 'anonymous' }
  | { status: 'unavailable' };

export async function getSession(): Promise<SessionResult> {
  const token = await getSessionToken();
  if (!token) return { status: 'anonymous' };
  try {
    const response = await backendFetch('/auth/me', {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (response.status === 401) return { status: 'anonymous' };
    if (!response.ok) return { status: 'unavailable' };
    return { status: 'authenticated', user: (await response.json()) as User };
  } catch {
    return { status: 'unavailable' };
  }
}
