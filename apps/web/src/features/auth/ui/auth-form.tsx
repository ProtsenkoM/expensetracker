'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useRef, useState, type FormEvent } from 'react';
import {
  ArrowRight,
  Eye,
  EyeOff,
  LoaderCircle,
  CircleAlert,
} from 'lucide-react';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { Alert, AlertDescription } from '@/shared/ui/alert';

type Fields = 'name' | 'email' | 'password' | 'confirmPassword' | 'agreement';
export function AuthForm({ mode }: { mode: 'login' | 'register' }) {
  const register = mode === 'register';
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [visible, setVisible] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<Fields, string>>>({});
  const [error, setError] = useState('');
  const errorRef = useRef<HTMLDivElement>(null);
  const submitting = useRef(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting.current) return;
    const form = event.currentTarget;
    const data = new FormData(form);
    const name = String(data.get('name') ?? '').trim();
    const email = String(data.get('email') ?? '').trim();
    const password = String(data.get('password') ?? '');
    const nextErrors: Partial<Record<Fields, string>> = {};
    if (register && (!name || name.length > 100))
      nextErrors.name = 'Вкажіть ім’я (від 1 до 100 символів).';
    if (
      !email ||
      email.length > 320 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    )
      nextErrors.email = 'Вкажіть коректну електронну пошту.';
    if (password.length < 8 || password.length > 128)
      nextErrors.password = 'Пароль має містити від 8 до 128 символів.';
    if (register && password !== data.get('confirmPassword'))
      nextErrors.confirmPassword = 'Паролі не збігаються.';
    if (register && !data.has('agreement'))
      nextErrors.agreement = 'Підтвердіть згоду, щоб створити акаунт.';
    setErrors(nextErrors);
    setError('');
    const firstError = Object.keys(nextErrors)[0];
    if (firstError) {
      (form.elements.namedItem(firstError) as HTMLInputElement)?.focus();
      return;
    }
    submitting.current = true;
    setPending(true);
    try {
      const response = await fetch(`/api/auth/${mode}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...(register ? { name } : {}),
          email,
          password,
        }),
        signal: AbortSignal.timeout(15_000),
      });
      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.message ?? 'Не вдалося виконати запит.');
      }
      router.replace('/');
      router.refresh();
    } catch (cause) {
      setError(
        cause instanceof Error && cause.name === 'Error'
          ? cause.message
          : 'Перевірте з’єднання та спробуйте ще раз.',
      );
      requestAnimationFrame(() => errorRef.current?.focus());
    } finally {
      submitting.current = false;
      setPending(false);
    }
  }

  function fieldError(field: Fields) {
    return errors[field] ? (
      <p
        id={`${field}-error`}
        className="text-sm text-destructive"
        role="alert"
      >
        {errors[field]}
      </p>
    ) : null;
  }

  return (
    <form
      onSubmit={submit}
      noValidate
      className="space-y-5"
      aria-busy={pending}
    >
      {error ? (
        <Alert variant="destructive" ref={errorRef} tabIndex={-1} role="alert">
          <CircleAlert aria-hidden="true" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}
      <fieldset disabled={pending} className="space-y-5 disabled:opacity-70">
        <legend className="sr-only">
          {register ? 'Створення акаунта' : 'Вхід до акаунта'}
        </legend>
        {register ? (
          <div className="space-y-2">
            <Label htmlFor="name">Ваше ім’я</Label>
            <Input
              id="name"
              name="name"
              autoComplete="name"
              placeholder="Як до вас звертатися?"
              maxLength={100}
              required
              aria-invalid={!!errors.name}
              aria-describedby={errors.name ? 'name-error' : undefined}
            />
            {fieldError('name')}
          </div>
        ) : null}
        <div className="space-y-2">
          <Label htmlFor="email">Електронна пошта</Label>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            maxLength={320}
            required
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? 'email-error' : undefined}
          />
          {fieldError('email')}
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Пароль</Label>
          <div className="relative">
            <Input
              id="password"
              name="password"
              type={visible ? 'text' : 'password'}
              autoComplete={register ? 'new-password' : 'current-password'}
              placeholder={
                register ? 'Щонайменше 8 символів' : 'Введіть ваш пароль'
              }
              minLength={8}
              maxLength={128}
              required
              className="pr-12"
              aria-invalid={!!errors.password}
              aria-describedby={
                errors.password
                  ? 'password-error'
                  : register
                    ? 'password-hint'
                    : undefined
              }
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute top-0 right-0 size-11"
              aria-label={visible ? 'Приховати пароль' : 'Показати пароль'}
              aria-pressed={visible}
              onClick={() => setVisible(!visible)}
            >
              {visible ? (
                <EyeOff aria-hidden="true" />
              ) : (
                <Eye aria-hidden="true" />
              )}
            </Button>
          </div>
          {fieldError('password')}
          {register && !errors.password ? (
            <p id="password-hint" className="text-xs text-muted-foreground">
              Від 8 до 128 символів.
            </p>
          ) : null}
        </div>
        {register ? (
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Повторіть пароль</Label>
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type={visible ? 'text' : 'password'}
              autoComplete="new-password"
              placeholder="Введіть пароль ще раз"
              maxLength={128}
              required
              aria-invalid={!!errors.confirmPassword}
              aria-describedby={
                errors.confirmPassword ? 'confirmPassword-error' : undefined
              }
            />
            {fieldError('confirmPassword')}
          </div>
        ) : null}
        {register ? (
          <div className="space-y-2">
            <label className="flex min-h-11 cursor-pointer items-start gap-3 text-sm leading-5">
              <input
                type="checkbox"
                name="agreement"
                required
                aria-invalid={!!errors.agreement}
                aria-describedby={
                  errors.agreement ? 'agreement-error' : undefined
                }
                className="mt-0.5 size-4 shrink-0 accent-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                onChange={() =>
                  setErrors((current) => ({ ...current, agreement: undefined }))
                }
              />
              <span>
                Погоджуюся з користувацькою угодою та політикою обробки даних
              </span>
            </label>
            {fieldError('agreement')}
          </div>
        ) : null}
        <Button type="submit" className="h-12 w-full text-sm">
          {pending ? (
            <LoaderCircle
              className="motion-safe:animate-spin"
              aria-hidden="true"
            />
          ) : null}
          {pending ? 'Зачекайте…' : register ? 'Створити акаунт' : 'Увійти'}
          {!pending ? <ArrowRight aria-hidden="true" /> : null}
        </Button>
      </fieldset>
      <p className="text-center text-sm text-muted-foreground">
        {register ? 'Уже маєте акаунт?' : 'Ще немає акаунта?'}{' '}
        <Link
          className="inline-flex min-h-11 items-center font-semibold text-primary underline-offset-4 hover:underline"
          href={register ? '/login' : '/register'}
        >
          {register ? 'Увійти' : 'Зареєструватися'}
        </Link>
      </p>
    </form>
  );
}
