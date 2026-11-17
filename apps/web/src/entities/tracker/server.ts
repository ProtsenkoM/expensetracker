import 'server-only';
import { backendFetch } from '@/shared/api/backend';
import { getSessionToken } from '@/shared/auth/session-cookie';

export async function trackerRead<T>(path: string): Promise<T> {
  const token = await getSessionToken();
  const response = await backendFetch(path, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (response.status === 401) throw new Error('unauthorized');
  if (!response.ok) throw new Error('unavailable');
  return response.json() as Promise<T>;
}
