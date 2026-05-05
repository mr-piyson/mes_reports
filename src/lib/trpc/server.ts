import { TRPCError, initTRPC } from "@trpc/server"
import { type FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch"
import superjson from "superjson"
import { ZodError } from "zod"

import db from "../database"

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

export async function createContext(opts: FetchCreateContextFnOptions) {
  return {
    db,
  }
}

export type Context = Awaited<ReturnType<typeof createContext>>

// ---------------------------------------------------------------------------
// tRPC init
// ---------------------------------------------------------------------------

export const t = initTRPC.context<Context>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError:
          error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    }
  },
})

export const router = t.router
export const createCallerFactory = t.createCallerFactory

// ---------------------------------------------------------------------------
// Procedure builders
// ---------------------------------------------------------------------------

export const publicProcedure = t.procedure
