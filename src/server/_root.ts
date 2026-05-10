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

import { inspectionsRouter } from "./reports/inspection-results"
import { qualityRouter } from "./reports/inspections"
import { jobsRouter } from "./reports/jobs"
import { packageRouter } from "./reports/packages"
import { panelsRouter } from "./reports/panel"
import { shippingRouter } from "./reports/shipments"
import { timeOutRouter } from "./reports/time-out"

export const appRouter = t.router({
  panels: panelsRouter,
  shipping: shippingRouter,
  jobs: jobsRouter,
  packages: packageRouter,
  timeOut: timeOutRouter,
  inspections: inspectionsRouter,
  quality: qualityRouter,
})

export type AppRouter = typeof appRouter
