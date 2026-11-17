'use client';
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import type { Category, Transaction } from '@/entities/tracker';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';

const field =
  'min-h-11 w-full rounded-md border border-input bg-white px-3 text-base';
function Dialog({
  title,
  trigger,
  children,
  onOpen,
}: {
  title: string;
  trigger: ReactNode;
  children: (close: () => void) => ReactNode;
  onOpen?: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const close = useCallback(() => ref.current?.close(), []);
  return (
    <>
      <span
        onClick={() => {
          onOpen?.();
          ref.current?.showModal();
        }}
      >
        {trigger}
      </span>
      <dialog
        id={title === 'Нова транзакція' ? 'new-transaction-dialog' : undefined}
        ref={ref}
        aria-label={title}
        className="m-auto w-[min(94vw,32rem)] rounded-xl border bg-white p-0 shadow-xl backdrop:bg-black/40"
      >
        <div className="p-6">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-xl font-semibold">{title}</h2>
            <button
              type="button"
              className="min-h-11 min-w-11 rounded-md text-xl hover:bg-muted"
              aria-label="Закрити"
              onClick={() => ref.current?.close()}
            >
              ×
            </button>
          </div>
          {/* close is called only by event handlers in the form. */}
          {/* eslint-disable-next-line react-hooks/refs */}
          {children(close)}
        </div>
      </dialog>
    </>
  );
}
function useMutation() {
  const router = useRouter();
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);
  async function submit(path: string, method: string, body?: unknown) {
    if (pending) return false;
    setPending(true);
    setError('');
    try {
      const response = await fetch(`/api/tracker/${path}`, {
        method,
        headers: { 'Content-Type': 'application/json' },
        ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      });
      if (response.status === 401) {
        router.replace('/login');
        return false;
      }
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message);
      }
      router.refresh();
      return true;
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Помилка з’єднання.');
      return false;
    } finally {
      setPending(false);
    }
  }
  return { error, setError, pending, submit };
}
function ErrorMessage({ error }: { error: string }) {
  return error ? (
    <p role="alert" className="text-sm text-destructive">
      {error}
    </p>
  ) : null;
}
function localDate(value?: string) {
  const d = value ? new Date(value) : new Date();
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16);
}
export function TransactionForm({
  categories,
  transaction,
}: {
  categories: Category[];
  transaction?: Transaction;
}) {
  const { error, setError, pending, submit } = useMutation();
  const dateRef = useRef<HTMLInputElement>(null);
  const transactionDate = transaction?.date;
  useEffect(() => {
    if (dateRef.current && transactionDate)
      dateRef.current.value = localDate(transactionDate);
  }, [transactionDate]);
  async function save(event: FormEvent<HTMLFormElement>, close: () => void) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const amount = String(form.get('amount')).trim().replace(',', '.');
    if (
      !/^(?=\d{1,16}(?:\.\d{1,2})?$)(?=.*[1-9])\d+(?:\.\d{1,2})?$/.test(amount)
    ) {
      setError(
        'Вкажіть додатну суму з не більше ніж двома знаками після коми.',
      );
      return;
    }
    const date = new Date(String(form.get('date')));
    if (Number.isNaN(date.getTime())) {
      setError('Вкажіть коректну дату.');
      return;
    }
    const ok = await submit(
      `transactions${transaction ? `/${transaction.id}` : ''}`,
      transaction ? 'PATCH' : 'POST',
      {
        amount,
        type: form.get('type'),
        categoryId: form.get('categoryId'),
        date:
          transaction && form.get('date') === localDate(transaction.date)
            ? transaction.date
            : date.toISOString(),
        description: String(form.get('description') || '').trim() || null,
      },
    );
    if (ok) {
      if (!transaction) {
        formElement.reset();
        if (dateRef.current) dateRef.current.value = '';
      }
      close();
    }
  }
  return (
    <Dialog
      title={transaction ? 'Редагувати транзакцію' : 'Нова транзакція'}
      onOpen={() => {
        if (!transaction && dateRef.current && !dateRef.current.value)
          dateRef.current.value = localDate();
      }}
      trigger={
        transaction ? (
          <Button
            variant="ghost"
            size="icon"
            aria-label="Редагувати транзакцію"
          >
            <Pencil />
          </Button>
        ) : (
          <Button type="button" className="min-h-11">
            <Plus />
            Додати транзакцію
          </Button>
        )
      }
    >
      {(close) => (
        <form className="space-y-4" onSubmit={(event) => save(event, close)}>
          <ErrorMessage error={error} />
          <div className="space-y-2">
            <Label htmlFor={`type-${transaction?.id ?? 'new'}`}>Тип</Label>
            <select
              id={`type-${transaction?.id ?? 'new'}`}
              name="type"
              defaultValue={transaction?.type ?? 'Expense'}
              className={field}
            >
              <option value="Expense">Витрата</option>
              <option value="Income">Дохід</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor={`amount-${transaction?.id ?? 'new'}`}>
              Сума, ₴
            </Label>
            <Input
              id={`amount-${transaction?.id ?? 'new'}`}
              name="amount"
              defaultValue={transaction?.amount}
              inputMode="decimal"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`category-${transaction?.id ?? 'new'}`}>
              Категорія
            </Label>
            <select
              id={`category-${transaction?.id ?? 'new'}`}
              name="categoryId"
              defaultValue={transaction?.categoryId ?? ''}
              className={field}
              required
            >
              <option value="" disabled>
                Оберіть категорію
              </option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            {!categories.length && (
              <p className="text-sm text-muted-foreground">
                Для збереження транзакції{' '}
                <Link href="/categories" className="underline">
                  створіть категорію
                </Link>
                .
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor={`date-${transaction?.id ?? 'new'}`}>
              Дата і час
            </Label>
            <Input
              id={`date-${transaction?.id ?? 'new'}`}
              type="datetime-local"
              name="date"
              ref={dateRef}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`description-${transaction?.id ?? 'new'}`}>
              Опис (необов’язково)
            </Label>
            <Input
              id={`description-${transaction?.id ?? 'new'}`}
              name="description"
              defaultValue={transaction?.description ?? ''}
            />
          </div>
          <Button disabled={pending} className="min-h-11 w-full">
            {pending ? 'Збереження…' : 'Зберегти'}
          </Button>
        </form>
      )}
    </Dialog>
  );
}
export function CategoryForm({ category }: { category?: Category }) {
  const { error, pending, submit } = useMutation();
  async function save(event: FormEvent<HTMLFormElement>, close: () => void) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const data = new FormData(formElement);
    if (
      await submit(
        `categories${category ? `/${category.id}` : ''}`,
        category ? 'PATCH' : 'POST',
        {
          name: data.get('name'),
          color: data.get('color'),
          icon: data.get('icon'),
        },
      )
    ) {
      if (!category) formElement.reset();
      close();
    }
  }
  return (
    <Dialog
      title={category ? 'Редагувати категорію' : 'Нова категорія'}
      trigger={
        category ? (
          <Button variant="ghost" size="icon" aria-label="Редагувати категорію">
            <Pencil />
          </Button>
        ) : (
          <Button className="min-h-11">
            <Plus />
            Додати категорію
          </Button>
        )
      }
    >
      {(close) => (
        <form className="space-y-4" onSubmit={(event) => save(event, close)}>
          <ErrorMessage error={error} />
          <div className="space-y-2">
            <Label htmlFor={`name-${category?.id ?? 'new'}`}>Назва</Label>
            <Input
              id={`name-${category?.id ?? 'new'}`}
              name="name"
              defaultValue={category?.name}
              maxLength={100}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`color-${category?.id ?? 'new'}`}>Колір</Label>
            <Input
              id={`color-${category?.id ?? 'new'}`}
              name="color"
              type="color"
              defaultValue={category?.color ?? '#236653'}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`icon-${category?.id ?? 'new'}`}>Іконка</Label>
            <select
              className={field}
              id={`icon-${category?.id ?? 'new'}`}
              name="icon"
              defaultValue={category?.icon ?? 'tag'}
            >
              {[
                ...new Set([
                  'tag',
                  'shopping-cart',
                  'coffee',
                  'home',
                  'car',
                  'heart',
                  'briefcase',
                  ...(category ? [category.icon] : []),
                ]),
              ].map((icon) => (
                <option key={icon} value={icon}>
                  {icon}
                </option>
              ))}
            </select>
          </div>
          <Button disabled={pending} className="min-h-11 w-full">
            {pending ? 'Збереження…' : 'Зберегти'}
          </Button>
        </form>
      )}
    </Dialog>
  );
}
export function DeleteItem({
  kind,
  id,
}: {
  kind: 'transactions' | 'categories';
  id: string;
}) {
  const { error, pending, submit } = useMutation();
  return (
    <Dialog
      title={
        kind === 'transactions' ? 'Видалити транзакцію?' : 'Видалити категорію?'
      }
      trigger={
        <Button
          variant="ghost"
          size="icon"
          aria-label={
            kind === 'transactions'
              ? 'Видалити транзакцію'
              : 'Видалити категорію'
          }
        >
          <Trash2 />
        </Button>
      }
    >
      {(close) => (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Цю дію неможливо скасувати.
          </p>
          <ErrorMessage error={error} />
          <div className="flex justify-end gap-3">
            <Button variant="outline" type="button" onClick={close}>
              Скасувати
            </Button>
            <Button
              variant="destructive"
              disabled={pending}
              onClick={async () => {
                if (await submit(`${kind}/${id}`, 'DELETE')) close();
              }}
            >
              {pending ? 'Видалення…' : 'Видалити'}
            </Button>
          </div>
        </div>
      )}
    </Dialog>
  );
}
