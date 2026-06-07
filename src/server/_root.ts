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

import { chartsRouter } from "./charts/chart"
import { inspectionsRouter } from "./reports/inspection-results"
import { inspection_route_Router } from "./reports/inspection-routes"
import { qualityRouter } from "./reports/inspections"
import { jobsRouter } from "./reports/jobs"
import { packageRouter } from "./reports/packages"
import { panelsRouter } from "./reports/panel"
import { shippingRouter } from "./reports/shipments"
import { timeOutRouter } from "./reports/time-out"

export const appRouter = t.router({
  // Reports
  panels: panelsRouter,
  shipping: shippingRouter,
  jobs: jobsRouter,
  packages: packageRouter,
  timeOut: timeOutRouter,
  route: inspection_route_Router,
  inspections: inspectionsRouter,
  quality: qualityRouter,

  // Charts
  charts: chartsRouter,
})

export type AppRouter = typeof appRouter
