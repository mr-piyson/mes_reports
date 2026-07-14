# AGENTS.md — MES Reports

## Stack

Next.js 16 + React 19 + TypeScript. Tailwind CSS 4, tRPC v11, ag-grid, shadcn/ui (new-york style). Two databases: MySQL (MES) via mysql2, MSSQL (ERP) via mssql. Package manager: **bun**.

## Commands

```bash
bun run dev        # Dev server on port 4000 (opens browser automatically)
bun run build      # Production build
bun run lint       # ESLint (next/core-web-vitals + typescript + prettier)
bun run update     # git pull → bun install → build → systemctl restart mes-reports
```

No test suite exists. No CI/CD pipeline.

## Code style

- Prettier: **no semicolons**, **double quotes**, trailing commas (es5), 80 char width
- Import order enforced by `@trivago/prettier-plugin-sort-imports`: `@/` aliases first, then relative imports, with blank-line separation
- ESLint: unused vars are warnings (not errors), jsx-a11y click/key rules disabled, array-index-key allowed
- Path alias: `@/*` → `./src/*`

## Architecture

```
src/
  app/              # Next.js App Router pages
    reports/        # Main report pages (panels, shipments, jobs, packages, time-out, inspection-results, inspection-routes)
    charts/         # Visualization pages (inspections charts)
    quality/        # Quality page
    api/trpc/       # tRPC API handler
  server/           # tRPC routers (one file per report domain)
    _root.ts        # Merges all sub-routers into appRouter
    reports/        # Report routers (panel, shipments, jobs, packages, etc.)
    charts/         # Chart routers
  lib/
    database.ts     # MySQL pool singleton (mes). MSSQL pool exists but is commented out.
    env.ts          # Env validation via @t3-oss/env-core + zod
    trpc/           # tRPC server init, React client, provider
  hooks/            # Custom hooks (debounce, filter, mobile detection, table theme)
  components/ui/    # shadcn/ui components
```

## Key patterns

- **tRPC routers**: All in `src/server/`, import `{ publicProcedure, router }` from `@/lib/trpc/server`. Add new router in `_root.ts`.
- **Report pages**: All `"use client"`, use `trpc.<namespace>.<procedure>.useQuery(...)` for data. ag-grid is the table library.
- **Database**: Only the MySQL `mes` pool is active. MSSQL/ERP pool is defined but commented out in `database.ts`.
- **Env vars** (required): `ERP_USERNAME`, `ERP_PASSWORD`, `ERP_SERVER`, `ERP_DATABASE`, `ERP_PORT`, `MES_DATABASE_URL`. Validated at startup with zod — invalid values cause `process.exit(1)`.
- **globals.css**: Uses Tailwind v4 `@import "tailwindcss"` syntax (not `@tailwind` directives). shadcn CSS variables are defined here.
- **tsconfig excludes** `./src/components/Table/**/*` from compilation.

## Gotchas

- Dev server runs on port **4000**, not the default 3000
- `next.config.ts` allows dev origins at `172.18.1.140:4000` and `localhost:4000`
- Remote images allowed from `iss.bfginternational.com` and `intranet.bfginternational.com:88`
- `bun run update` runs `sudo systemctl restart mes-reports` — requires sudo access on deploy target
- MySQL pool uses `dateStrings: true` and timezone `+03:00` — dates arrive as strings, not JS Date objects. Query inputs expecting `z.date()` need explicit conversion.
- `src/server/reports/inspection-routes.ts` creates its own tRPC instance via `initTRPC.create()` instead of importing from `@/lib/trpc/server` — it lacks the superjson transformer and db context. Do not copy this pattern.
- Adding shadcn/ui components: `bunx shadcn@latest add <component>` (style is new-york, configured in `components.json`)
- Tailwind CSS 4 uses `@import "tailwindcss"` in `globals.css`, not the v3 `@tailwind` directives
