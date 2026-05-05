/**
 * root.ts
 * The single tRPC app router — merges every sub-router.
 * Import this in your Next.js API route handler.
 *
 * Usage in /app/api/trpc/[trpc]/route.ts:
 *   import { appRouter } from '@/lib/trpc/root';
 *   export type AppRouter = typeof appRouter;
 */
import { t } from "@/lib/trpc/server"

import { jobsRouter } from "./reports/jobs"
import { packageRouter } from "./reports/packages"
import { panelsRouter } from "./reports/panel"
import { shippingRouter } from "./reports/shipments"

export const appRouter = t.router({
  panels: panelsRouter,
  shipping: shippingRouter,
  jobs: jobsRouter,
  packages: packageRouter,
})

export type AppRouter = typeof appRouter
