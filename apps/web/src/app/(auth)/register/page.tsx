import type { Metadata } from 'next';
import { AuthPage } from '@/views/auth';
export const metadata: Metadata = { title: 'Реєстрація | Трекер витрат' };
export default function Page() {
  return <AuthPage mode="register" />;
}
