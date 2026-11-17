import Link from 'next/link';
import { redirect } from 'next/navigation';
import {
  ArrowUpRight,
  ChartNoAxesCombined,
  ShieldCheck,
  Wallet,
} from 'lucide-react';
import { getSession } from '@/entities/session';
import { AuthForm } from '@/features/auth';

export async function AuthPage({ mode }: { mode: 'login' | 'register' }) {
  const session = await getSession();
  if (session.status === 'authenticated') redirect('/');
  const register = mode === 'register';
  return (
    <main className="grid min-h-svh lg:grid-cols-[1fr_1fr]">
      <aside className="relative hidden flex-col justify-between overflow-hidden bg-secondary p-12 lg:flex xl:p-16">
        <Link href="/" className="flex w-fit items-center gap-3 font-semibold">
          <span className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Wallet className="size-5" aria-hidden="true" />
          </span>
          Трекер витрат
        </Link>
        <div className="relative z-10 my-16 max-w-md">
          <p className="mb-6 text-xs font-semibold tracking-[.2em] text-primary uppercase">
            Ваші гроші. Ваша впевненість.
          </p>
          <h2 className="text-4xl leading-tight font-semibold tracking-tight xl:text-5xl">
            Більше ясності.
            <br />
            <span className="text-primary">Менше зайвих витрат.</span>
          </h2>
          <p className="mt-6 max-w-sm text-base leading-relaxed text-muted-foreground">
            Перший крок до усвідомлених фінансів — місце, де все під контролем.
          </p>
          <div className="mt-10 rounded-2xl border border-border bg-background/80 p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="rounded-lg bg-secondary p-3 text-primary">
                <ChartNoAxesCombined aria-hidden="true" />
              </span>
              <span className="text-xs font-medium text-muted-foreground">
                Крок за кроком
              </span>
            </div>
            <p className="mt-6 text-xl font-semibold">Почніть із простого</p>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Створіть свій простір для щоденного обліку витрат.
            </p>
            <div className="mt-6 flex items-end gap-2" aria-hidden="true">
              {[30, 46, 36, 60, 52, 76, 68, 88, 100].map((height, i) => (
                <div
                  key={i}
                  style={{ height }}
                  className="flex-1 rounded-t-md bg-primary/20 last:bg-primary"
                />
              ))}
            </div>
          </div>
        </div>
        <p className="flex items-center gap-2 text-xs text-muted-foreground">
          <ShieldCheck className="size-4" aria-hidden="true" />
          Особистий простір для ваших фінансів
        </p>
      </aside>
      <section className="flex min-w-0 flex-col px-6 py-8 sm:px-12 lg:px-16">
        <div className="flex items-center justify-between gap-4">
          <Link
            href="/"
            className="flex items-center gap-2 font-semibold lg:invisible"
          >
            <Wallet className="size-5 text-primary" aria-hidden="true" />
            Трекер витрат
          </Link>
          <Link
            href={register ? '/login' : '/register'}
            className="flex min-h-11 items-center gap-1 text-sm font-medium text-muted-foreground hover:text-primary"
          >
            {register ? 'Увійти' : 'Створити акаунт'}
            <ArrowUpRight className="size-4" aria-hidden="true" />
          </Link>
        </div>
        <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center py-10">
          <div className="mb-8">
            <div className="mb-6 flex size-12 items-center justify-center rounded-xl border bg-secondary text-primary">
              <Wallet className="size-6" aria-hidden="true" />
            </div>
            <h1 className="text-3xl font-semibold tracking-tight">
              {register ? 'Почнімо з вас' : 'Раді бачити знову'}
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              {register
                ? 'Створіть акаунт і зробіть перший крок до впорядкованих фінансів.'
                : 'Увійдіть до свого фінансового простору.'}
            </p>
          </div>
          <AuthForm mode={mode} />
        </div>
        <p className="text-center text-xs text-muted-foreground">
          Трекер витрат · Особисті фінанси щодня
        </p>
      </section>
    </main>
  );
}
