import { TRPCError, initTRPC } from "@trpc/server"
import { z } from "zod"

import { mes } from "@/lib/database"

// Initialize tRPC (Usually defined in a central trpc.ts file)
const t = initTRPC.create()
export const router = t.router
export const publicProcedure = t.procedure

interface RawInspectionRow {
  panel_serial: string
  project: string
  latest_out: string | Date
  route: string | null // MySQL GROUP_CONCAT returns a comma-separated string or null
}

export const inspection_route_Router = router({
  get_inspection_routes: publicProcedure
    .input(
      z.object({
        filter: z.string(), // Keep it optional to match your original logic
      })
    )
    .query(async ({ input }) => {
      const { filter } = input

      if (!filter) {
        return []
      }

      let sql = `SELECT 
            t.panel_serial,
            t.project,
            MAX(t.datetime_out) AS latest_out,
            GROUP_CONCAT(t.gate_name ORDER BY t.datetime_out SEPARATOR ',') AS route
        FROM (
            SELECT 
                ir.panel_serial,
                ir.project,
                ir.datetime_out,
                CASE ir.gate 
                    WHEN 1  THEN 'Mold'
                    WHEN 2  THEN 'Gelcoating'
                    WHEN 3  THEN 'Trimming'
                    WHEN 4  THEN 'Finishing'
                    WHEN 5  THEN 'Painting'
                    WHEN 6  THEN 'Final'
                    WHEN 10 THEN 'Demolding'
                    WHEN 11 THEN 'Drilling'
                    WHEN 12 THEN 'Bonding'
                    WHEN 15 THEN 'Paint Prep'
                    WHEN 16 THEN 'Wrapping'
                    WHEN 17 THEN 'Packing'
                    WHEN 18 THEN 'Mixing'
                    WHEN 19 THEN 'Casting'
                    WHEN 20 THEN 'Pullout Test'
                    WHEN 21 THEN 'Curing'
                    WHEN 22 THEN 'After Trimming'
                END AS gate_name
            FROM quality.inspection_results ir
            WHERE ir.inspection_result = 'OK'
        ) t
      `

      let whereClause = ""

      switch (filter) {
        case "today":
          whereClause = " WHERE DATE(t.datetime_out) = CURDATE()"
          break
        case "last7days":
          whereClause =
            " WHERE DATE(t.datetime_out) >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)"
          break
        case "last30days":
          whereClause =
            " WHERE DATE(t.datetime_out) >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)"
          break
        case "last90days":
          whereClause =
            " WHERE DATE(t.datetime_out) >= DATE_SUB(CURDATE(), INTERVAL 90 DAY)"
          break
        case "1year":
          whereClause =
            " WHERE DATE(t.datetime_out) >= DATE_SUB(CURDATE(), INTERVAL 1 YEAR)"
          break
        case "2years":
          whereClause =
            " WHERE DATE(t.datetime_out) >= DATE_SUB(CURDATE(), INTERVAL 2 YEAR)"
          break
        case "3years":
          whereClause =
            " WHERE DATE(t.datetime_out) >= DATE_SUB(CURDATE(), INTERVAL 3 YEAR)"
          break
        case "all":
          break
      }

      sql += whereClause
      sql += " GROUP BY t.panel_serial"

      try {
        const [rows] = await mes.execute(sql)
        const typedRows = rows as RawInspectionRow[]

        // Transform the SQL comma-separated string into a clean JS string array
        return typedRows.map((row) => ({
          ...row,
          route: row.route ? row.route.split(",") : [],
        }))
      } catch (error) {
        console.error("Database query error:", error)
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database query failed",
          cause: error,
        })
      }
    }),
})
