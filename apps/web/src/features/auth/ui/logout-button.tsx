'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { LogOut } from 'lucide-react';
import { Button } from '@/shared/ui/button';

export function LogoutButton() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  async function logout() {
    setPending(true);
    setError('');
    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        signal: AbortSignal.timeout(15_000),
      });
      if (!response.ok) throw new Error('Logout failed');
      router.replace('/login');
      router.refresh();
    } catch {
      setError('Не вдалося вийти. Спробуйте ще раз.');
    } finally {
      setPending(false);
    }
  }
  return (
    <div>
      <Button
        variant="outline"
        className="h-11"
        onClick={logout}
        disabled={pending}
      >
        <LogOut aria-hidden="true" />
        {pending ? 'Виходимо…' : 'Вийти'}
      </Button>
      {error ? (
        <p role="alert" className="mt-2 text-sm text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}
