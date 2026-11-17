import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { sessionCookie } from '@/entities/session';
import { backendFetch } from '@/shared/api/backend';

async function handle(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> },
) {
  if (request.headers.get('origin') !== request.nextUrl.origin)
    return NextResponse.json(
      { message: 'Недозволене джерело запиту.' },
      { status: 403 },
    );
  const { path } = await context.params;
  if (
    path.length < 1 ||
    path.length > 2 ||
    !['transactions', 'categories'].includes(path[0]) ||
    (path[1] && !/^[0-9a-f-]{36}$/i.test(path[1]))
  )
    return NextResponse.json(
      { message: 'Некоректний запит.' },
      { status: 400 },
    );
  const token = (await cookies()).get(sessionCookie)?.value;
  if (!token)
    return NextResponse.json({ message: 'Сесію завершено.' }, { status: 401 });
  if (
    request.method !== 'DELETE' &&
    !request.headers.get('content-type')?.startsWith('application/json')
  )
    return NextResponse.json({ message: 'Очікується JSON.' }, { status: 415 });
  try {
    const response = await backendFetch(`/${path.join('/')}`, {
      method: request.method,
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      ...(request.method === 'DELETE' ? {} : { body: await request.text() }),
    });
    if (response.status === 204) return new NextResponse(null, { status: 204 });
    if (!response.ok) {
      const message =
        response.status === 409
          ? 'Категорію з транзакціями не можна видалити.'
          : response.status === 401
            ? 'Сесію завершено.'
            : response.status === 400
              ? 'Перевірте правильність заповнення полів.'
              : response.status === 404
                ? 'Запис не знайдено. Оновіть сторінку.'
                : 'Не вдалося виконати запит. Спробуйте ще раз.';
      return NextResponse.json(
        { message },
        { status: response.status >= 500 ? 503 : response.status },
      );
    }
    return NextResponse.json(await response.json(), {
      status: response.status,
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch {
    return NextResponse.json(
      { message: 'Не вдалося зв’язатися із сервером.' },
      { status: 503 },
    );
  }
}
export const POST = handle;
export const PATCH = handle;
export const DELETE = handle;
