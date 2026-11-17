import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getSession } from '@/entities/session';
import type { Category } from '@/entities/tracker';
import { trackerRead } from '@/entities/tracker/server';
import { CategoryForm, DeleteItem } from '@/features/tracker';
import { AppShell } from '@/widgets/app-shell';
import { Button } from '@/shared/ui/button';
import { CategoryIcon } from '@/entities/tracker';
export async function CategoriesPage() {
  const session = await getSession();
  if (session.status === 'anonymous') redirect('/login');
  if (session.status === 'unavailable')
    return (
      <main className="p-8">
        <h1>Сервіс тимчасово недоступний</h1>
        <Link href="/categories">Спробувати ще раз</Link>
      </main>
    );
  let categories: Category[];
  try {
    categories = await trackerRead<Category[]>('/categories');
  } catch (error) {
    if (error instanceof Error && error.message === 'unauthorized')
      redirect('/login');
    return (
      <AppShell user={session.user} active="categories">
        <h1>Не вдалося завантажити категорії</h1>
        <Button asChild className="mt-4">
          <Link href="/categories">Спробувати ще раз</Link>
        </Button>
      </AppShell>
    );
  }
  return (
    <AppShell user={session.user} active="categories">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-primary">Ваші фінанси</p>
          <h1 className="mt-1 text-3xl font-semibold">Категорії</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Упорядкуйте ваші доходи та витрати.
          </p>
        </div>
        <CategoryForm />
      </div>
      <section className="mt-8 overflow-hidden rounded-xl border bg-white">
        <h2 className="border-b px-5 py-5 font-semibold">
          Ваші категорії{' '}
          <span className="ml-2 text-sm font-normal text-muted-foreground">
            {categories.length}
          </span>
        </h2>
        {categories.length ? (
          <ul className="divide-y">
            {categories.map((c) => (
              <li key={c.id} className="flex items-center gap-3 px-5 py-4">
                <span
                  className="rounded-lg bg-secondary p-3"
                  style={{ color: c.color }}
                >
                  <CategoryIcon name={c.icon} />
                </span>
                <span className="min-w-0 flex-1 truncate font-medium">
                  {c.name}
                </span>
                <CategoryForm category={c} />
                <DeleteItem kind="categories" id={c.id} />
              </li>
            ))}
          </ul>
        ) : (
          <p className="p-12 text-center text-muted-foreground">
            Категорій ще немає. Створіть першу категорію.
          </p>
        )}
      </section>
    </AppShell>
  );
}
