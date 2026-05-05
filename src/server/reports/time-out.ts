import { TRPCError } from "@trpc/server"
import { z } from "zod"

import { mes } from "@/lib/database"
import { publicProcedure, router } from "@/lib/trpc/server"

// Helper to calculate past dates consistently
const getPastDate = (days: number): string => {
  const d = new Date()
  d.setDate(d.getDate() - days)
  return d.toISOString().slice(0, 10)
}

// Define the shape of our pivoted data
interface PivotedReport {
  panel_serial: string
  [key: string]: string | null // For the dynamic gate names (Mold, Painting, etc.)
}

export const timeOutRouter = router({
  getHistory: publicProcedure
    .input(
      z.object({
        filter: z.string().default("today"),
      })
    )
    .query(async ({ input }) => {
      const { filter } = input

      // 1. Base Query: Only get gates that are relevant to your table
      let sql = `
        SELECT panel_serial, datetime_out, gate
        FROM quality.inspection_results
        WHERE inspection_result = 'OK'
      `
      const params: any[] = []

      // 2. Date Filtering Logic
      if (filter !== "all") {
        let days = 0
        switch (filter) {
          case "today":
            sql += ` AND DATE(datetime_out) = ?`
            params.push(new Date().toISOString().slice(0, 10))
            break
          case "last7days":
            days = 7
            break
          case "last30days":
            days = 30
            break
          case "last90days":
            days = 90
            break
          case "1year":
            days = 365
            break
          case "2years":
            days = 365 * 2
            break
          case "3years":
            days = 365 * 3
            break
        }

        if (days > 0) {
          sql += ` AND DATE(datetime_out) >= ?`
          params.push(getPastDate(days))
        }
      }

      // Order by serial and date so the pivoting is predictable
      sql += ` ORDER BY panel_serial ASC, datetime_out ASC`

      try {
        const [rows]: [any[], any] = await mes.execute(sql, params)

        // 3. Pivoting Logic (DTO Transformation)
        // This converts the list of events into the table-friendly format
        const pivotedData = rows.reduce((acc: PivotedReport[], curr) => {
          let panel = acc.find((p) => p.panel_serial === curr.panel_serial)

          if (!panel) {
            panel = { panel_serial: curr.panel_serial }
            acc.push(panel)
          }

          // Map the 'gate' value to a column and 'datetime_out' to its value
          // e.g., panel["Mold"] = "2023-10-01 10:00:00"
          panel[curr.gate] = curr.datetime_out

          return acc
        }, [])

        return pivotedData
      } catch (error) {
        console.error("Database error:", error)
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch and transform panel history",
          cause: error,
        })
      }
    }),
})
