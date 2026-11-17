# Трекер витрат

Початкова заготовка монорепозиторію на npm workspaces:

- `apps/web` — Next.js 16, React 19, App Router, TypeScript.
- `apps/api` — NestJS 11, Express, REST API, Prisma 7.
- PostgreSQL 17 — локально через Docker Compose.

Бізнес-логіка й доступ до БД належать backend. Frontend звертатиметься до REST API. API підтримує реєстрацію та JWT-вхід користувачів.

## Вимоги

- Node.js 24 LTS (див. `.nvmrc`) та npm 11.
- Docker із Compose v2, що підтримує `up --wait`.
- Вільні порти `3000`, `3001`, `5432`.

## Перший запуск

Виконайте з кореня репозиторію:

```sh
cp .env.example .env
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env.local
npm install
npm run db:up
npm run db:generate
npm run db:migrate -- --name add_user
npm run dev
```

Залежності ще не встановлені. Перше `npm install` створить єдиний кореневий `package-lock.json`; додайте його до Git. Після цього для відтворюваного встановлення використовуйте `npm ci`. Встановлення не потребує запущеної БД й не виконує міграції.

- Frontend: <http://localhost:3000>
- API: <http://localhost:3001/api/health>
- Перевірка БД: <http://localhost:3001/api/health/db>

`GET /api/health` повертає `200` і `{"status":"ok"}` незалежно від доступності БД. `GET /api/health/db` виконує `SELECT 1` і повертає `200` з `{"status":"ok","database":"up"}` або `503` з `{"status":"error","database":"down"}`. З'єднання з БД ліниве, тому API запускається й коли PostgreSQL вимкнений. Згенеруйте Prisma Client перед першим `dev:api`.

## Команди

| Команда                                   | Призначення                                                              |
| ----------------------------------------- | ------------------------------------------------------------------------ |
| `npm run dev`                             | Запустити обидва застосунки; Ctrl+C завершує обидва                      |
| `npm run dev:web` / `npm run dev:api`     | Запустити окремий застосунок                                             |
| `npm run build`                           | Зібрати обидва застосунки; перед backend build генерується Prisma Client |
| `npm run lint`                            | Перевірити обидва застосунки ESLint                                      |
| `npm run typecheck`                       | Згенерувати типи Next.js / Prisma й перевірити TypeScript                |
| `npm run format:check` / `npm run format` | Перевірити / виправити форматування                                      |
| `npm run db:up`                           | Запустити PostgreSQL і дочекатися healthcheck                            |
| `npm run db:down`                         | Зупинити контейнери зі збереженням volume                                |
| `npm run db:generate`                     | Згенерувати Prisma Client без підключення до БД                          |
| `npm run db:migrate -- --name init`       | Створити й застосувати dev-міграцію після додавання моделей              |
| `npm run db:studio`                       | Відкрити Prisma Studio                                                   |

Для запуску зібраних застосунків використовуйте `npm run start --workspace=@expense-tracker/web` та `npm run start --workspace=@expense-tracker/api`. Backend запускайте через npm workspace, щоб він читав `apps/api/.env`.

## Налаштування середовища

- Кореневий `.env` використовується Docker Compose.
- `apps/api/.env` задає `DATABASE_URL`, `PORT` (за замовчуванням `3001`), `CORS_ORIGIN` (один origin без кінцевого `/`) і `JWT_SECRET` (щонайменше 32 байти). Використовуйте окремий випадковий секрет для кожного середовища.
- `apps/web/.env.local` задає серверний `API_URL` для звернень Next.js до NestJS (разом із `/api`). Старий `NEXT_PUBLIC_API_URL` підтримується як запасний варіант. Значення `NEXT_PUBLIC_*` публічні; секретів у них бути не повинно.

Параметри PostgreSQL у кореневому `.env` і `DATABASE_URL` backend повинні збігатися. Якщо змінюєте порт БД, оновіть також URL. Credentials у прикладах призначені для локальної розробки. Зміна `POSTGRES_*` не змінює користувача чи пароль у вже створеному volume.

Prisma schema розташована в `apps/api/prisma/schema.prisma`, конфігурація CLI — у `apps/api/prisma.config.ts`. Schema поки не має моделей: першу міграцію створюємо разом із доменною моделлю. Prisma Studio до цього не матиме таблиць застосунку. Згенерований клієнт у `apps/api/src/generated/prisma` виключений із Git. Backend використовує ESM та `.js` розширення в локальних TypeScript-імпортах.

## Перевірка після встановлення

```sh
npm run lint
npm run typecheck
npm run format:check
npm run build
curl -i http://localhost:3001/api/health
curl -i http://localhost:3001/api/health/db
```

Перевірте сторінку frontend. Зупиніть БД через `npm run db:down`: API health повинен залишитися `200`, а DB health — повернути `503`. Запустіть БД знову й перевірте відновлення `200`. Compose використовує named volume: зупинка та повторний запуск зберігають дані; перевірити збереження записів можна після додавання першої моделі.

Заготовка не містить CI/CD, деплою або автоматичних міграцій на старті.

## Frontend authentication

The frontend uses shadcn/ui (Tailwind CSS) and Feature-Sliced Design; see `AGENTS.md` for layer and import rules. Routes `/login` and `/register` call the existing NestJS API through same-origin Next.js handlers. `/` checks the session with `/auth/me`, redirects guests to login, and shows the signed-in user and logout action.

Set `API_URL` in `apps/web/.env.local` to the backend base URL including `/api` (default `http://localhost:3001/api`). `NEXT_PUBLIC_API_URL` remains a legacy fallback. This URL must be reachable by the Next.js server. Tokens stay in HttpOnly cookies and expire after the API's `expiresIn` (currently 15 minutes); sign in again after expiry. Production uses Secure cookies and requires HTTPS.

Manual verification with PostgreSQL and both apps running:

1. Open `/register`; check required fields, an invalid email, short password, and mismatched password confirmation.
2. Register a fresh email; confirm redirect to `/` and that your name appears. Reload to check session persistence.
3. Log out; confirm redirect to `/login` and that `/` redirects guests.
4. Register the same email again and check the conflict message. Try a wrong password and check the login error; then sign in with the correct password.
5. Expire/delete the session cookie and reload `/`; confirm the login redirect. Stop the API and submit a form; confirm a retryable error and an enabled submit button.
6. Check both forms on mobile and desktop, keyboard navigation, password visibility, and password-manager autofill. Tokens must not appear in client responses or browser storage.

UI primitives were sourced from the official shadcn/ui `new-york-v4` registry. Add future primitives with the shadcn CLI from `apps/web`; `components.json` points generation at `shared/ui`.

If Turbopack cannot open its internal worker port in a restricted environment, verify the frontend with `npm run build --workspace=@expense-tracker/web -- --webpack`.

### Транзакції API

Усі запити до `/api/transactions` потребують заголовка `Authorization: Bearer <token>`. Створення: `POST /api/transactions` з JSON, наприклад `{"amount":"12.50","type":"Expense","date":"2026-11-17T12:00:00Z","categoryId":"<uuid>","description":"Кава"}`. Сума — додатний десятковий рядок із максимум двома знаками після крапки; відповідь містить суму з двома знаками.

`GET /api/transactions` приймає необов’язкові `dateFrom`, `dateTo`, `type`, `categoryId`; межі дат включні. Дати мають бути ISO 8601 із часовим поясом. `GET /api/transactions/summary?month=11&year=2026` повертає `totalIncome`, `totalExpense` і `balance` за календарний місяць UTC. Окрему транзакцію можна прочитати, змінити або видалити через `GET`, `PATCH` або `DELETE /api/transactions/:id`. Видалення категорії з транзакціями повертає `409`.
