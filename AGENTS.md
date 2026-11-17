# Repository Guidelines

## Project Structure & Module Organization

This repository is an npm workspaces monorepo. `apps/web` contains the Next.js App Router frontend; its routes and global styles live in `src/app`. `apps/api` contains the NestJS REST API, organized by feature under `src` (for example, `health` and `prisma`). The PostgreSQL schema and migrations belong in `apps/api/prisma`. `compose.yaml` defines the local database. Keep application code in its workspace and shared configuration at the repository root. Add shared packages only when code is genuinely reused.

## Frontend Architecture: Feature-Sliced Design

Use Feature-Sliced Design (FSD) in `apps/web/src`. Dependencies flow downward: `app → views (Pages) → widgets → features → entities → shared`. Only create layers when needed; do not add empty scaffolding or the deprecated `processes` layer.

- `app`: Next.js App Router routes, layouts, global styles, and route-handler adapters. Keep route files thin.
- `views`: the FSD Pages layer, named `views` because Next.js reserves `src/pages` for its Pages Router. Compose complete screens here.
- `widgets`: independent, substantial interface blocks when needed.
- `features`: user actions such as authentication; keep their UI, validation, and API orchestration together in a business slice.
- `entities`: domain models and reads such as the current user session.
- `shared`: business-independent UI primitives, transport, configuration, and focused libraries. shadcn/ui components belong in `shared/ui`; configure `components.json` aliases accordingly. Use shadcn/ui before introducing another component library.

Use `ui`, `model`, `api`, and `lib` segments as needed within slices. Import other slices only from lower layers, through their public API (`index.ts`); never import another slice's internals or a sibling slice on the same layer. Within a slice, use relative imports. Shared segments may import each other. Use explicit segment entry points for Shared (for example, `@/shared/ui/button`). Expose server-only entry points separately (for example, `@/features/auth/server`) and mark server modules with `server-only`; client components must not import them. Keep browser components small and use Server Components for page composition and session reads.

Authentication uses the existing NestJS `/api/auth/register`, `/api/auth/login`, and `/api/auth/me` contracts. Next.js same-origin route handlers keep bearer tokens in HttpOnly, SameSite cookies, with Secure enabled in production; never expose tokens to client JavaScript or browser storage. The cookie lifetime follows the API's `expiresIn`; there is no refresh-token endpoint. Use server-only `API_URL` for the backend address (legacy `NEXT_PUBLIC_API_URL` is a fallback). Keep user-facing copy in Ukrainian to match the application.

## Build, Test, and Development Commands

Copy the provided environment examples, install dependencies, then start PostgreSQL and generate Prisma Client:

```sh
cp .env.example .env
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env.local
npm install
npm run db:up
npm run db:generate
npm run dev
```

`npm run dev` starts both apps; use `npm run dev:web` or `npm run dev:api` for one. `npm run build`, `npm run lint`, and `npm run typecheck` apply across workspaces. `npm run format:check` verifies Prettier formatting. Use `npm run db:migrate -- --name <migration>` after adding schema models; `npm run db:down` stops PostgreSQL while preserving its volume. Use `npm ci` for reproducible installs after `package-lock.json` has been generated and committed.

## Coding Style & Naming Conventions

Use TypeScript with strict checking, two-space indentation, single quotes, and trailing commas, as configured by Prettier. Run `npm run format` before submitting changes and `npm run lint` to catch code issues. Use PascalCase for React components and NestJS classes, camelCase for functions and variables, and kebab-case for feature directories and filenames. Keep frontend presentation separate from backend business logic and database access.

## Testing Guidelines

The API uses `node:test` through `tsx`; run `npm run test --workspace=@expense-tracker/api`. Database integration tests need their configured test database. The frontend has no automated test suite yet. Run lint, typecheck, and build for both workspaces, then manually check the auth flows described in `README.md`, the frontend at mobile and desktop widths, and `GET /api/health` and `GET /api/health/db`. Name focused tests `*.spec.ts` or `*.test.ts` consistently within the workspace.

## Commit & Pull Request Guidelines

Use Conventional Commits: `<type>(<optional scope>): <imperative summary>`, for example `feat(transactions): add transaction tracking` or `fix(auth): validate session expiry`. Use `feat`, `fix`, `docs`, `refactor`, `test`, `build`, or `chore` as appropriate; keep the subject concise and describe a single logical change. Mark breaking changes with `!` and explain them in the commit body. Pull requests should explain the change and its motivation, list verification commands and results, link related issues when available, and include screenshots for visible frontend changes. Call out schema or environment variable changes explicitly.

## Security & Configuration

Never commit `.env` files, credentials, or generated Prisma Client output. Keep `.env.example` files updated when configuration changes; use local-only credentials for Compose. Treat `NEXT_PUBLIC_*` values as public because Next.js embeds them in browser bundles.
