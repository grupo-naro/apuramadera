# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## This is NOT the Next.js you know

`next@16` (with React 19 and Turbopack) has breaking changes vs. older versions — APIs, conventions, and file structure may differ from training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing framework code, and heed deprecation notices. Notably: middleware is renamed `proxy` (see `src/proxy.ts`).

## Commands

Package manager is **pnpm**.

| Task | Command |
|------|---------|
| Dev server (Turbopack, :3000) | `pnpm dev` |
| Production build / serve | `pnpm build` / `pnpm start` |
| Bundle analyzer | `pnpm build:analyze` |
| Lint | `pnpm lint` |
| Typecheck | `pnpm typecheck` |
| E2E (Playwright, Chromium) | `pnpm test:e2e` — auto-starts `pnpm dev` |
| E2E, watch UI | `pnpm test:e2e:ui` |
| Single E2E spec | `pnpm exec playwright test e2e/checkout.spec.ts` |
| Single E2E by name | `pnpm exec playwright test -g "add to cart"` |

E2E specs require a seeded DB with **at least one ACTIVE, in-stock product**; they run serially (shared cart cookie) and fail with a clear message if the seed hasn't run.

### Database (Prisma 7)

| Task | Command |
|------|---------|
| Regenerate client (`src/generated/prisma`) | `pnpm db:generate` |
| Create + apply migration (dev) | `pnpm db:migrate` |
| Apply migrations (prod) | `pnpm db:deploy` |
| Seed demo catalog (**destructive**) | `pnpm db:seed` |
| Seed from a client's data file | `pnpm db:seed:client` |
| Prisma Studio | `pnpm db:studio` |

`postinstall` runs `prisma generate`. `DATABASE_URL` is read via `prisma.config.ts` (not declared in `schema.prisma`).

## The big picture: a cloneable storefront framework

"Commerce Core" is a **single-tenant** e-commerce framework. Each client store is a **clone of the repo**: copy → edit `src/store.config.ts` + the client's env vars → deploy. There is no multitenancy. Design decisions consistently favor "clone and configure" over per-store code:

- **`src/store.config.ts`** — one object: name/tagline/description/locale, footer contact, and the full oklch theme token set (light + dark). `<ThemeStyle>` in `src/app/layout.tsx` emits these as `:root` CSS vars. Components use semantic Tailwind tokens (`bg-background`, `text-primary`) — **never literal colors**.
- **Admin access** is email + password. The principal admin is the `ADMIN_EMAILS` allowlist (`src/core/auth/admin-allowlist.ts`) with its first password in `ADMIN_INITIAL_PASSWORD`; any other panel user is a `User` row with a `passwordHash`, created from `/admin/usuarios` (initial password = DNI, forced change on first login). No roles: everyone has full access.
- **Payments, email, WhatsApp, analytics** are all env-gated. The pattern: a `config.ts` exports constants from `process.env` plus an `isXConfigured` boolean; features no-op when unset.
- The **catalog schema is vertical-agnostic** (clothing, electronics, furniture…). The vertical is *content* (categories + option axes), not code.

The codebase is **in Spanish** — comments, domain vocabulary, route segments (`/productos`, `/carrito`, `/checkout`, `/orden/[id]`, `/admin/*`), and user-facing copy. Match it.

**Money is always integer cents.** `3990` = $39,90.

## Layout

- **`src/core/`** — framework internals. Not route code.
  - **`modules/<name>/`** — domain logic, strictly layered (see below): `cart`, `catalog`, `checkout`, `cms`, `coupons`, `customers`, `notifications`, `orders`, `payments`, `shipping`, `users`.
  - **`integrations/`** — third-party adapters: `cloudinary`, `resend`, `whatsapp`, `analytics`.
  - **`auth/`** — Auth.js v5 setup (see below).
  - **`lib/`** — leaf utilities: `db` (Prisma singleton), `encryption`, `format`, `seo`, `csv`, `utils`.
  - **`ui/`** — shadcn/ui primitives (new-york style; `components.json` aliases resolve here) + `ui/commerce/` composite components (price, product-card, badges…).
  - **`theme/`** — `ThemeStyle` token injector.
- **`src/features/`** — client-side feature components, grouped by area (`admin`, `auth`, `cart`, `checkout`, `cms`, `storefront`). These compose `core/ui` and call module Server Actions.
- **`src/app/`** — App Router. `(storefront)` group = public shop; `admin/` = protected panel; `api/` = webhooks, auth handler, MP OAuth, CSV export.
- **`src/generated/prisma/`** — generated Prisma client. Excluded from tsconfig and eslint. **Never edit.** Import types/client from `@/generated/prisma/client`.
- Path alias: `@/*` → `src/*`.

## Module architecture (`src/core/modules/<name>/`)

Every module is a bounded context with a single public entrypoint. **The rest of the app imports only from `@/core/modules/<name>` (the `index.ts` barrel), never from internal files.**

| File | Role |
|------|------|
| `index.ts` | Public API. Re-exports the use cases, actions, and types other code may use. |
| `<name>.actions.ts` | `"use server"` Server Actions — the client-safe surface. Thin: validate, call use case, `revalidatePath`, return `{ ok, ... }`. |
| `<name>.use-cases.ts` | Business logic. Recomputes/validates authoritative values server-side. Never trusts caller-supplied money. |
| `<name>.repository.ts` | The only place Prisma is touched. Maps rows ↔ domain types. Encapsulated. |
| `<name>.schemas.ts` | Zod schemas + inferred input types. |
| `<name>.types.ts` | Domain types (distinct from Prisma models). |
| `<name>.admin.*.ts` | Admin-panel variants of the above, kept separate from storefront paths. |

Cross-module calls go through barrels too (e.g. `orders.use-cases` imports `notifications` via `@/core/modules/notifications/...`).

## Key mechanisms

- **Auth (Auth.js v5 beta, Credentials provider, JWT sessions, no adapter).** Config is split so the proxy stays edge-safe:
  - `auth.config.ts` — no DB, no providers. Used by `src/proxy.ts` (matches `/admin/:path*`) to gate the panel via the `authorized` callback reading the JWT cookie; it also forces `/admin/cambiar-clave` when the JWT carries `mustChangePassword`.
  - `auth.ts` — the full instance. Server-only. It imports `modules/users/users.credentials` directly (an exception to the barrel rule, to avoid an import cycle).
  - Passwords are hashed with scrypt; the `users` module locks an account after 5 failed attempts for 15 minutes.
  - Admin Route Handlers under `/api` are NOT covered by the proxy (it only matches `/admin/*`): they must call `requireActiveAdmin()` from `@/core/auth/require-active-admin` (checks `isAdmin`, `uid`, `mustChangePassword` and that the user still exists).
- **Prisma 7** requires a driver adapter: `PrismaPg` over `pg`, wired in `src/core/lib/db.ts` (singleton, cached on `globalThis` in dev).
- **Images** are served through Cloudinary, not the Next optimizer. Use `<StoreImage>` (`core/ui/store-image.tsx`) — `next/image` with a Cloudinary loader that builds responsive `f_auto`/`q_auto` URLs. `ProductImage.publicId` is the Cloudinary asset id; URLs are built at runtime. Escape hatch: a `publicId` starting with `/` is treated as a local `public/` asset and served by the default `next/image` loader (used by the demo seed, which has no Cloudinary upload creds).
- **Orders are immutable documents.** `OrderItem` freezes name/price/attributes at purchase; `variantId`/`productId` are soft pointers (no FK) so deleting a product never breaks history. Totals are always recomputed in `createOrder`. Status changes go through the `canTransition` state machine in `orders.status.ts`.
- **Payments (Mercado Pago).** The store links its *own* MP account via OAuth from the admin panel (agency-level `MP_CLIENT_ID/SECRET`, one `PaymentConnection` row). Access/refresh tokens are stored **AES-256-GCM encrypted** (`core/lib/encryption.ts`, `ENCRYPTION_KEY`). `/api/webhooks/mercadopago` flips an order `PENDING → PAID` and is idempotent.
- **CMS home** is an ordered list of `HomeBlock` rows; each block's `data` is JSON validated by a per-type Zod schema in the `cms` module (`HERO_BANNER`, `PRODUCT_CAROUSEL`, `CATEGORY_GRID`), with optional `startsAt`/`endsAt` scheduling.
- **Cart** is DB-persisted, keyed by a `cart_id` cookie. Prices are shown live; the snapshot is taken only when the order is created.
- **Coupons** apply to subtotal only, no stacking; `usageCount` is incremented inside the order transaction, not at validation time.

## Environment

Copy `.env.example` to `.env` (gitignored) and fill it in — the file documents every variable. Required for a working local setup: `DATABASE_URL`, `AUTH_SECRET`, `ADMIN_EMAILS`, `ADMIN_INITIAL_PASSWORD`. `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=demo` works read-only with the seed data. `AUTH_RESEND_KEY` is optional and now only enables transactional emails (not login). WhatsApp and analytics vars are optional and disable those features when blank.
