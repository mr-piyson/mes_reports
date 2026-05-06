import { TRPCError } from "@trpc/server"
import { z } from "zod"

import { mes } from "@/lib/database"
import { publicProcedure, router } from "@/lib/trpc/server"

// 1. Define the Data Interface
export interface ApiJobsData {
  job_id: string
  epicor_asm_part_no: string
  date: string
  project_code: string
  total_panels: string
  printed_panels: number
  inspected_panels: number
  has_printed_panel: boolean
  has_inspected_panel: boolean
}

// 2. Define the Schema (Reusable)
const FilterSchema = z.string().default("")

export const jobsRouter = router({
  getJobs: publicProcedure
    .input(z.object({ filter: FilterSchema }))
    .query(async ({ input }) => {
      try {
        const { filter } = input
        let whereClause = ""

        // 1. Identify the filter and build the WHERE clause
        switch (filter) {
          case "future":
            whereClause = "WHERE u.date06 >= CURDATE() + INTERVAL 1 DAY"
            break
          case "today":
            whereClause =
              "WHERE u.date06 >= CURDATE() AND u.date06 < CURDATE() + INTERVAL 1 DAY"
            break
          case "last30days":
            whereClause = "WHERE u.date06 >= CURDATE() - INTERVAL 30 DAY"
            break
          case "last7days":
            whereClause = "WHERE u.date06 >= CURDATE() - INTERVAL 7 DAY"
            break
          case "last90days":
            whereClause = "WHERE u.date06 >= CURDATE() - INTERVAL 90 DAY"
            break
          case "1year":
            whereClause = "WHERE u.date06 >= CURDATE() - INTERVAL 1 YEAR"
            break
          case "2years":
            whereClause = "WHERE u.date06 >= CURDATE() - INTERVAL 2 YEAR"
            break
          case "3years":
            whereClause = "WHERE u.date06 >= CURDATE() - INTERVAL 3 YEAR"
            break
          case "5years":
            whereClause = "WHERE u.date06 >= CURDATE() - INTERVAL 5 YEAR"
            break
          default:
            // 2. RETURN EMPTY ARRAY IMMEDIATELY
            // This skips the SQL execution entirely if no valid filter is provided
            return []
        }

        const sql = `
          SELECT 
            u.key1 AS job_id,
            u.date06 AS date,
            u.shortchar06 AS project_code,
            u.shortchar01 AS epicor_asm_part_no,
            COUNT(DISTINCT u.key5) AS total_panels,
            COUNT(DISTINCT lp.part_id) AS printed_panels,
            COUNT(DISTINCT ir.panel_serial) AS inspected_panels,
            MAX(CASE WHEN lp.part_id IS NOT NULL THEN 1 ELSE 0 END) AS has_printed_panel,
            MAX(CASE WHEN ir.panel_serial IS NOT NULL THEN 1 ELSE 0 END) AS has_inspected_panel
          FROM label_app.ud31 u
          LEFT JOIN mes.log_printed lp
            ON lp.part_id = u.key5
            AND lp.print_for = 'panels'
          LEFT JOIN quality.inspection_results ir
            ON ir.panel_serial = u.key5
          ${whereClause}
          GROUP BY 
            u.key1, u.date06, u.shortchar06, u.shortchar01
        `

        const [rawRows] = (await mes.execute(sql)) as [any[], any]

        return rawRows.map((row) => ({
          ...row,
          has_printed_panel: Boolean(row.has_printed_panel),
          has_inspected_panel: Boolean(row.has_inspected_panel),
        })) as ApiJobsData[]
      } catch (error) {
        console.error("Database error:", error)
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch jobs data",
        })
      }
    }),
})
