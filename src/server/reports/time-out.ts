import { TRPCError } from "@trpc/server"
import { z } from "zod"

import { mes } from "@/lib/database"
import { publicProcedure, router } from "@/lib/trpc/server"

// Define the response type
export type ApiInspections = {
  panel_serial: string
  datetime_out: string
  gate: number
}

// Helper to calculate past dates
const getPastDate = (days: number): string => {
  const d = new Date()
  d.setDate(d.getDate() - days)
  return d.toISOString().slice(0, 10)
}

export const timeOutRouter = router({
  getHistory: publicProcedure
    .input(
      z.object({
        filter: z.enum([
          "today",
          "last7days",
          "last30days",
          "last90days",
          "1year",
          "2years",
          "3years",
        ]),
      })
    )
    .query(async ({ input }) => {
      const { filter } = input

      let sql = `
        SELECT panel_serial, datetime_out, gate
        FROM quality.inspection_results
        WHERE inspection_result = 'OK'
      `

      const params: string[] = []

      // Determine date logic based on filter
      switch (filter) {
        case "today":
          sql += ` AND DATE(datetime_out) = ?`
          params.push(new Date().toISOString().slice(0, 10))
          break
        case "last7days":
          sql += ` AND DATE(datetime_out) >= ?`
          params.push(getPastDate(7))
          break
        case "last30days":
          sql += ` AND DATE(datetime_out) >= ?`
          params.push(getPastDate(30))
          break
        case "last90days":
          sql += ` AND DATE(datetime_out) >= ?`
          params.push(getPastDate(90))
          break
        case "1year":
          sql += ` AND DATE(datetime_out) >= ?`
          params.push(getPastDate(365))
          break
        case "2years":
          sql += ` AND DATE(datetime_out) >= ?`
          params.push(getPastDate(365 * 2))
          break
        case "3years":
          sql += ` AND DATE(datetime_out) >= ?`
          params.push(getPastDate(365 * 3))
          break
      }

      try {
        const [rows] = await mes.execute(sql, params)
        return rows as ApiInspections[]
      } catch (error) {
        console.error("Database error:", error)
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database connection failed",
          cause: error,
        })
      }
    }),
})
