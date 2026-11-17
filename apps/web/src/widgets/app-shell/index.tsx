import Link from 'next/link';
import { Wallet, List, Tags } from 'lucide-react';
import type { ReactNode } from 'react';
import type { User } from '@/entities/session';
import { LogoutButton } from '@/features/auth';

export function AppShell({
  user,
  active,
  children,
}: {
  user: User;
  active: 'transactions' | 'categories';
  children: ReactNode;
}) {
  const initials = user.name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
  return (
    <div className="min-h-screen bg-[#f6f8f7] md:flex">
      <aside className="border-b bg-white px-4 py-4 md:min-h-screen md:w-60 md:shrink-0 md:border-r md:border-b-0 md:px-5 md:py-7">
        <Link
          href="/"
          className="flex items-center gap-3 px-2 text-lg font-semibold"
        >
          <span className="rounded-xl bg-primary p-2 text-white">
            <Wallet size={20} />
          </span>
          Трекер витрат
        </Link>
        <nav
          aria-label="Головна навігація"
          className="mt-5 flex gap-2 md:mt-10 md:flex-col"
        >
          {[
            { href: '/', label: 'Транзакції', icon: List, key: 'transactions' },
            {
              href: '/categories',
              label: 'Категорії',
              icon: Tags,
              key: 'categories',
            },
          ].map(({ href, label, icon: Icon, key }) => (
            <Link
              key={key}
              href={href}
              aria-current={active === key ? 'page' : undefined}
              className={`flex min-h-11 flex-1 items-center gap-3 rounded-lg px-3 text-sm font-medium md:flex-none ${active === key ? 'bg-secondary text-primary' : 'text-muted-foreground hover:bg-muted'}`}
            >
              <Icon size={18} aria-hidden="true" />
              {label}
            </Link>
          ))}
        </nav>
      </aside>
      <div className="min-w-0 flex-1">
        <header className="flex min-h-20 items-center justify-end border-b bg-white px-5 md:px-10">
          <details className="relative">
            <summary className="flex min-h-11 cursor-pointer list-none items-center gap-3 rounded-lg px-2 focus-visible:outline-2 focus-visible:outline-ring">
              <span className="flex size-10 items-center justify-center rounded-full bg-secondary text-sm font-semibold text-primary">
                {initials}
              </span>
              <span className="hidden text-sm font-medium sm:block">
                {user.name}
              </span>
            </summary>
            <div className="absolute right-0 z-20 mt-2 w-64 rounded-xl border bg-white p-4 shadow-lg">
              <p className="font-semibold">{user.name}</p>
              <p className="mt-1 break-all text-sm text-muted-foreground">
                {user.email}
              </p>
              <div className="mt-4 border-t pt-3">
                <LogoutButton />
              </div>
            </div>
          </details>
        </header>
        <main className="mx-auto max-w-6xl px-5 py-8 md:px-10">{children}</main>
      </div>
    </div>
  );
}
