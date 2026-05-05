import { TRPCError } from "@trpc/server"
import { z } from "zod"

import { mes } from "@/lib/database"
import { publicProcedure, router } from "@/lib/trpc/server"

// Define the response interface for type safety on the frontend
export interface ShippedPackageData {
  package: string
  project: string
  part_id: string
  description: string
  container_id: string
  date: string
  shipped_by: string
  job_id: string
  epicor_asm_part_no: string
  epicor_part_no: string
}

export const shippingRouter = router({
  getMonthlyShipments: publicProcedure
    .input(
      z.object({
        year: z.coerce.number().min(1970).max(2100),
        month: z.coerce.number().min(1).max(12),
      })
    )
    .query(async ({ input }) => {
      const { year, month } = input

      // Format month with leading zero (e.g., "2024-05")
      const monthFormatted = month.toString().padStart(2, "0")
      const yearMonth = `${year}-${monthFormatted}`

      const sql = `
        SELECT DISTINCT
          pk.code as package,
          i.project_category as project,
          i.qr_code as part_id,
          i.panel_ref AS description,
          c.code as container_id,
          ci.created_at as date,
          c.shipped_by,
          u.key1 as job_id,
          u.shortchar01 as epicor_asm_part_no,
          u.shortchar01 as epicor_part_no
        FROM 
          mes.container_items ci
        INNER JOIN 
          mes.containers c ON c.id = ci.container_id
        INNER JOIN 
          mes.packages pk ON pk.code = ci.item_id
        INNER JOIN 
          mes.package_items pi ON pi.package_id = pk.id
        INNER JOIN 
          label_app.kla_factory_epicor i ON i.qr_code = pi.part_id
        LEFT JOIN 
          label_app.ud31 u ON u.key5 = i.qr_code
        WHERE 
          DATE_FORMAT(ci.created_at, '%Y-%m') = ?
          AND c.id IS NOT NULL 
        ORDER BY i.project_category DESC
      `

      try {
        const [rows] = await mes.execute(sql, [yearMonth])
        return rows as ShippedPackageData[]
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
