import 'server-only';
import { cookies } from 'next/headers';

export const sessionCookie = 'expense-tracker-session';

export async function getSessionToken() {
  return (await cookies()).get(sessionCookie)?.value;
}
