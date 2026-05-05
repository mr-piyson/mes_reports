import { TRPCError } from "@trpc/server"
import { RowDataPacket } from "mysql2"
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

      // Define date range for the specific month
      const startDate = `${year}-${month.toString().padStart(2, "0")}-01 00:00:00`
      const lastDay = new Date(year, month, 0).getDate() // Gets last day of month
      const endDate = `${year}-${month.toString().padStart(2, "0")}-${lastDay} 23:59:59`

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
        LEFT JOIN 
          mes.packages pk ON pk.code = ci.item_id
        LEFT JOIN 
          mes.package_items pi ON pi.package_id = pk.id
        LEFT JOIN 
          label_app.kla_factory_epicor i ON i.qr_code = pi.part_id
        LEFT JOIN 
          label_app.ud31 u ON u.key5 = i.qr_code
        WHERE 
          ci.created_at BETWEEN ? AND ?
          AND c.id IS NOT NULL 
        ORDER BY i.project_category DESC
      `

      try {
        // Use the range [startDate, endDate] instead of the formatted string
        const [rows] = await mes.execute<
          RowDataPacket[] & ShippedPackageData[]
        >(sql, [startDate, endDate])

        // Safety check: log count to your terminal
        console.log(`Query for ${year}-${month} returned ${rows.length} rows`)

        return rows as ShippedPackageData[]
      } catch (error) {
        console.error("Database error:", error)
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database connection failed",
        })
      }
    }),
})
