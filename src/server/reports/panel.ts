import { TRPCError } from "@trpc/server"
import { z } from "zod"

import { mes } from "@/lib/database"
import { publicProcedure, router } from "@/lib/trpc/server"

export interface PanelsReportData {
  panel_Id: string
  container?: string
  created_at: string
  wrapped: boolean
  final: boolean
  epicor_asm_part_no: string
  asm_part_no: string
  project: string
  package?: string
  qc_datetime?: string
  panel_id: string
  label_creation_date: string
  description: string
  job_id: string
}

// 1. Refined Schema: Coerce undefined/null to 'all' to ensure stability
const filterSchema = z
  .enum([
    "today",
    "last7days",
    "last30days",
    "last90days",
    "1year",
    "2years",
    "3years",
    "5years",
    "all",
    "No Filter",
  ])
  .catch("all")

export const panelsRouter = router({
  getPanels: publicProcedure
    .input(
      z.object({
        filter: z.string().optional(),
        panelType: z.enum(["all", "main", "assembly"]).catch("all"),
      })
    )
    .query(async ({ input }) => {
      // 2. Validate input and default to 'all'
      const filter = filterSchema.parse(input.filter)
      const panelType = input.panelType

      try {
        let sql = `
          SELECT 
            i.qr_code as panel_id,
            i.panel_ref AS description,
            u.shortchar01 as epicor_asm_part_no,
            u.key1 as job_id,
            i.created_at,
            u.key3 as tree,
            i.project_category as project,
            CASE WHEN ir.panel_serial IS NOT NULL THEN 1 ELSE 0 END as final,
            CASE WHEN lp.part_id IS NOT NULL THEN 1 ELSE 0 END as wrapped,
            pi.package_code as package,
            c.code as container,
            ir.datetime_out as qc_datetime
          FROM label_app.kla_factory_epicor i 
          LEFT JOIN label_app.ud31 u ON u.key5 = i.qr_code 
          LEFT JOIN (
            SELECT ir1.panel_serial, MAX(ir1.datetime_out) as datetime_out
            FROM quality.inspection_results ir1 
            WHERE ir1.gate = 6 AND ir1.inspection_result = 'OK'
            GROUP BY ir1.panel_serial
          ) ir ON ir.panel_serial = i.qr_code
          LEFT JOIN (
            SELECT part_id, MIN(date) as date
            FROM mes.log_printed
            WHERE print_type = 'wrapping'
            GROUP BY part_id
          ) lp ON lp.part_id = i.qr_code
          LEFT JOIN mes.package_items pi ON pi.part_id = i.qr_code
          LEFT JOIN mes.packages pk ON pk.id = pi.package_id
          LEFT JOIN mes.container_items ci ON ci.item_id = pk.code
          LEFT JOIN mes.containers c ON c.id = ci.container_id
          WHERE i.qr_code IS NOT NULL and u.key1 is not NULL
        `

        // 3. Logic Correction: Fixed Interval math and used template literals safely
        const filterMap: Record<string, string> = {
          today: " AND i.created_at >= CURDATE()",
          last7days: " AND i.created_at >= CURDATE() - INTERVAL 7 DAY",
          last30days: " AND i.created_at >= CURDATE() - INTERVAL 30 DAY",
          last90days: " AND i.created_at >= CURDATE() - INTERVAL 90 DAY",
          "1year": " AND i.created_at >= CURDATE() - INTERVAL 1 YEAR",
          "2years": " AND i.created_at >= CURDATE() - INTERVAL 2 YEAR",
          "3years": " AND i.created_at >= CURDATE() - INTERVAL 3 YEAR",
          "5years": " AND i.created_at >= CURDATE() - INTERVAL 5 YEAR",
          all: "",
          "No Filter": "",
        }

        sql += filterMap[filter] || ""

        if (panelType === "main") {
          sql += " AND u.key3 = 0"
        } else if (panelType === "assembly") {
          sql += " AND u.key3 != 0"
        }

        const [rows] = await mes.execute(sql)

        // 4. Guaranteed Array Return: Always returns [] if rows is null/undefined
        return Array.isArray(rows) ? rows : []
      } catch (error) {
        console.error("Database error:", error)
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch panel data. Please try again later.",
          cause: error,
        })
      }
    }),
})
