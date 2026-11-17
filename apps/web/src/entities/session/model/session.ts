import 'server-only';
import { cookies } from 'next/headers';
import { backendFetch } from '@/shared/api/backend';

export const sessionCookie = 'expense-tracker-session';
export type User = { id: string; name: string; email: string };
export type SessionResult =
  | { status: 'authenticated'; user: User }
  | { status: 'anonymous' }
  | { status: 'unavailable' };

export async function getSession(): Promise<SessionResult> {
  const token = (await cookies()).get(sessionCookie)?.value;
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
