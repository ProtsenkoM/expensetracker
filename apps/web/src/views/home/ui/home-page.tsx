import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Wallet, CircleCheck } from 'lucide-react';
import { getSession } from '@/entities/session';
import { LogoutButton } from '@/features/auth';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/shared/ui/card';
import { Button } from '@/shared/ui/button';

export async function HomePage() {
  const session = await getSession();
  if (session.status === 'anonymous') redirect('/login');
  if (session.status === 'unavailable')
    return (
      <main className="mx-auto flex min-h-svh max-w-md flex-col justify-center gap-6 px-6">
        <h1 className="text-2xl font-semibold">Сервіс тимчасово недоступний</h1>
        <p className="text-muted-foreground">
          Не вдалося перевірити сесію. Спробуйте ще раз трохи пізніше.
        </p>
        <Button asChild className="h-11">
          <Link href="/">Спробувати ще раз</Link>
        </Button>
        <LogoutButton />
      </main>
    );
  return (
    <main className="mx-auto max-w-5xl px-6 py-8">
      <header className="flex flex-wrap items-center justify-between gap-4 border-b pb-6">
        <span className="flex items-center gap-3 font-semibold">
          <Wallet className="text-primary" aria-hidden="true" />
          Трекер витрат
        </span>
        <LogoutButton />
      </header>
      <div className="py-16">
        <p className="mb-3 flex items-center gap-2 text-sm text-primary">
          <CircleCheck className="size-4" aria-hidden="true" />
          Ви успішно увійшли
        </p>
        <h1 className="text-3xl font-semibold tracking-tight">
          Вітаємо, {session.user.name}!
        </h1>
        <p className="mt-3 text-muted-foreground">
          Ваш особистий простір для щоденних витрат.
        </p>
        <Card className="mt-10 max-w-xl">
          <CardHeader>
            <CardTitle>Усе починається з першого кроку</CardTitle>
            <CardDescription>Ваш акаунт готовий.</CardDescription>
          </CardHeader>
          <CardContent className="text-sm leading-relaxed text-muted-foreground">
            Облік витрат з’явиться на наступному етапі.
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
