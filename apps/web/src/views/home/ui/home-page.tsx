import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ArrowDownLeft, ArrowUpRight, ChevronDown, Scale } from 'lucide-react';
import { getSession } from '@/entities/session';
import type { Category, Summary, TransactionPage } from '@/entities/tracker';
import { trackerRead } from '@/entities/tracker/server';
import { TransactionForm, DeleteItem } from '@/features/tracker';
import { AppShell } from '@/widgets/app-shell';
import { Button } from '@/shared/ui/button';
import { CategoryIcon } from '@/entities/tracker';

const select = 'min-h-11 rounded-lg border border-input bg-white px-3 text-sm';
const money = (amount: string) => {
  const negative = amount.startsWith('-');
  const [whole, fraction = '00'] = amount.replace('-', '').split('.');
  return `${negative ? '−' : ''}${new Intl.NumberFormat('uk-UA').format(BigInt(whole))},${fraction.padEnd(2, '0')} ₴`;
};
export async function HomePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await getSession();
  if (session.status === 'anonymous') redirect('/login');
  if (session.status === 'unavailable')
    return (
      <main className="mx-auto max-w-lg p-8">
        <h1 className="text-2xl font-semibold">Сервіс тимчасово недоступний</h1>
        <p className="my-4">Не вдалося перевірити сесію.</p>
        <Button asChild>
          <Link href="/">Спробувати ще раз</Link>
        </Button>
      </main>
    );
  const query = await searchParams;
  const now = new Date();
  const current = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}`;
  const month =
    typeof query.month === 'string' &&
    /^\d{4}-(0[1-9]|1[0-2])$/.test(query.month) &&
    query.month.slice(0, 4) !== '0000'
      ? query.month
      : current;
  const [year, m] = month.split('-').map(Number);
  const from = new Date(0);
  from.setUTCFullYear(year, m - 1, 1);
  from.setUTCHours(0, 0, 0, 0);
  const to = new Date(from);
  to.setUTCMonth(to.getUTCMonth() + 1);
  to.setMilliseconds(-1);
  const page =
    typeof query.page === 'string' && /^\d+$/.test(query.page)
      ? Math.min(1000000, Math.max(1, Number(query.page)))
      : 1;
  const type =
    query.type === 'Income' || query.type === 'Expense' ? query.type : '';
  const category =
    typeof query.category === 'string' &&
    /^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i.test(query.category)
      ? query.category
      : '';
  const params = new URLSearchParams({
    page: String(page),
    dateFrom: from.toISOString(),
    dateTo: to.toISOString(),
  });
  if (type) params.set('type', type);
  if (category) params.set('categoryId', category);
  let categories: Category[], summary: Summary, transactions: TransactionPage;
  try {
    [categories, summary, transactions] = await Promise.all([
      trackerRead<Category[]>('/categories'),
      trackerRead<Summary>(`/transactions/summary?month=${m}&year=${year}`),
      trackerRead<TransactionPage>(`/transactions?${params}`),
    ]);
  } catch (error) {
    if (error instanceof Error && error.message === 'unauthorized')
      redirect('/login');
    return (
      <AppShell user={session.user} active="transactions">
        <h1 className="text-2xl font-semibold">Не вдалося завантажити дані</h1>
        <p className="my-4 text-muted-foreground">
          Перевірте з’єднання та спробуйте ще раз.
        </p>
        <Button asChild>
          <Link href="/">Спробувати ще раз</Link>
        </Button>
      </AppShell>
    );
  }
  const pages = Math.max(1, Math.ceil(transactions.total / 10));
  function href(n: number) {
    const p = new URLSearchParams({ month, page: String(n) });
    if (type) p.set('type', type);
    if (category) p.set('category', category);
    return `/?${p}`;
  }
  if (page > pages) redirect(href(pages));
  return (
    <AppShell user={session.user} active="transactions">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-primary">Ваші фінанси</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">
            Транзакції
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Відстежуйте доходи та витрати в одному місці.
          </p>
        </div>
        <TransactionForm categories={categories} />
      </div>
      {!categories.length && (
        <div className="mt-6 rounded-xl border bg-white p-5 text-sm">
          Щоб додати першу транзакцію,{' '}
          <Link
            href="/categories"
            className="font-semibold text-primary underline"
          >
            створіть категорію
          </Link>
          .
        </div>
      )}
      <form
        className="mt-8 flex flex-wrap items-end gap-x-6 gap-y-4"
        action="/"
      >
        <label className="mr-2 flex flex-col gap-1 text-sm font-medium">
          Місяць{' '}
          <input
            className={select}
            type="month"
            name="month"
            defaultValue={month}
            required
          />
        </label>
        <label className="mr-2 flex flex-col gap-1 text-sm font-medium">
          Тип{' '}
          <span className="relative">
            <select
              className={`${select} w-full appearance-none pr-10`}
              name="type"
              defaultValue={type}
            >
              <option value="">Усі типи</option>
              <option value="Income">Доходи</option>
              <option value="Expense">Витрати</option>
            </select>
            <ChevronDown
              aria-hidden="true"
              className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2"
            />
          </span>
        </label>
        <label className="mr-2 flex flex-col gap-1 text-sm font-medium">
          Категорія{' '}
          <span className="relative">
            <select
              className={`${select} w-full appearance-none pr-10`}
              name="category"
              defaultValue={category}
            >
              <option value="">Усі категорії</option>
              {categories.map((c) => (
                <option value={c.id} key={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <ChevronDown
              aria-hidden="true"
              className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2"
            />
          </span>
        </label>
        <Button className="min-h-11" type="submit">
          Застосувати
        </Button>
        <span className="pb-3 text-xs text-muted-foreground">
          Період і дати: UTC
        </span>
      </form>
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        {[
          { label: 'Доходи', amount: summary.totalIncome, icon: ArrowDownLeft },
          {
            label: 'Витрати',
            amount: summary.totalExpense,
            icon: ArrowUpRight,
          },
          { label: 'Баланс за місяць', amount: summary.balance, icon: Scale },
        ].map(({ label, amount, icon: Icon }) => (
          <div key={label} className="rounded-xl border bg-white p-5">
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              {label}
              <span className="rounded-lg bg-secondary p-2 text-primary">
                <Icon size={18} aria-hidden="true" />
              </span>
            </div>
            <p className="mt-4 text-2xl font-semibold">{money(amount)}</p>
          </div>
        ))}
      </div>
      <section className="mt-8 overflow-hidden rounded-xl border bg-white">
        <div className="flex flex-wrap justify-between gap-2 border-b px-5 py-5">
          <h2 className="text-lg font-semibold">Історія транзакцій</h2>
          <span className="text-sm text-muted-foreground">
            Усього: {transactions.total}
          </span>
        </div>
        {transactions.items.length ? (
          <ul className="divide-y">
            {transactions.items.map((t) => {
              const c = categories.find((c) => c.id === t.categoryId);
              return (
                <li
                  key={t.id}
                  className="flex flex-wrap items-center gap-3 px-5 py-4"
                >
                  <span className="rounded-xl bg-secondary p-3 text-primary">
                    <CategoryIcon name={c?.icon ?? 'tag'} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">
                      {t.description || c?.name || 'Транзакція'}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      <span style={{ color: c?.color }}>●</span>{' '}
                      {c?.name ?? 'Категорія'} ·{' '}
                      {new Intl.DateTimeFormat('uk-UA', {
                        timeZone: 'UTC',
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      }).format(new Date(t.date))}{' '}
                      · {t.type === 'Income' ? 'Дохід' : 'Витрата'}
                    </p>
                  </div>
                  <span
                    className={`font-semibold ${t.type === 'Income' ? 'text-primary' : ''}`}
                  >
                    {t.type === 'Income' ? '+' : '−'}
                    {money(t.amount)}
                  </span>
                  <div className="flex">
                    <TransactionForm categories={categories} transaction={t} />
                    <DeleteItem kind="transactions" id={t.id} />
                  </div>
                </li>
              );
            })}
          </ul>
        ) : (
          <div className="px-5 py-14 text-center">
            <p className="font-medium">Транзакцій не знайдено</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Додайте транзакцію або змініть фільтри.
            </p>
          </div>
        )}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t px-5 py-4 text-sm">
          <span className="text-muted-foreground">
            Сторінка {page} із {pages} · {transactions.total} записів
          </span>
          <div className="flex flex-wrap items-center gap-2">
            {page > 1 ? (
              <Button asChild variant="outline" className="min-h-11">
                <Link href={href(page - 1)}>Назад</Link>
              </Button>
            ) : (
              <Button variant="outline" className="min-h-11" disabled>
                Назад
              </Button>
            )}
            {Array.from(
              { length: Math.min(5, pages) },
              (_, i) => Math.max(1, Math.min(page - 2, pages - 4)) + i,
            ).map((n) => (
              <Button
                key={n}
                asChild
                variant={n === page ? 'default' : 'outline'}
                className="min-h-11 min-w-11"
              >
                <Link
                  href={href(n)}
                  aria-current={n === page ? 'page' : undefined}
                >
                  {n}
                </Link>
              </Button>
            ))}
            {page < pages ? (
              <Button asChild variant="outline" className="min-h-11">
                <Link href={href(page + 1)}>Далі</Link>
              </Button>
            ) : (
              <Button variant="outline" className="min-h-11" disabled>
                Далі
              </Button>
            )}
          </div>
        </div>
      </section>
    </AppShell>
  );
}
