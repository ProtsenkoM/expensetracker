import 'server-only';
import { NextRequest, NextResponse } from 'next/server';
import { sessionCookie } from '@/entities/session';
import { backendFetch } from '@/shared/api/backend';

export async function handleAuth(
  request: NextRequest,
  action: 'login' | 'register' | 'logout',
) {
  // Same-origin JSON requests only, including logout.
  if (request.headers.get('origin') !== request.nextUrl.origin) {
    return NextResponse.json(
      { message: 'Недозволене джерело запиту.' },
      { status: 403 },
    );
  }
  if (action === 'logout') {
    const response = NextResponse.json({ ok: true });
    response.cookies.delete(sessionCookie);
    return response;
  }
  if (!request.headers.get('content-type')?.startsWith('application/json')) {
    return NextResponse.json({ message: 'Очікується JSON.' }, { status: 415 });
  }
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { message: 'Некоректний запит.' },
      { status: 400 },
    );
  }
  try {
    const upstream = await backendFetch(`/auth/${action}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!upstream.ok) {
      const messages: Record<number, string> = {
        400: 'Перевірте правильність заповнення полів.',
        401: 'Неправильна електронна пошта або пароль.',
        409: 'Ця електронна пошта вже зареєстрована. Увійдіть до акаунта.',
        429: 'Забагато спроб. Спробуйте трохи пізніше.',
      };
      return NextResponse.json(
        {
          message:
            messages[upstream.status] ??
            'Сервіс тимчасово недоступний. Спробуйте ще раз.',
        },
        { status: upstream.status >= 500 ? 503 : upstream.status },
      );
    }
    const data = await upstream.json();
    if (
      typeof data.accessToken !== 'string' ||
      !Number.isFinite(data.expiresIn) ||
      data.expiresIn <= 0
    )
      throw new Error('Invalid auth response');
    const response = NextResponse.json(
      { ok: true },
      { headers: { 'Cache-Control': 'no-store' } },
    );
    response.cookies.set(sessionCookie, data.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: data.expiresIn,
    });
    return response;
  } catch {
    return NextResponse.json(
      { message: 'Не вдалося зв’язатися із сервером. Спробуйте ще раз.' },
      { status: 503 },
    );
  }
}
