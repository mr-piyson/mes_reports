import { z } from "zod"

import { mes } from "@/lib/database"
import { publicProcedure, router } from "@/lib/trpc/server"

// Define the interface for the database response
export interface ApiReportData {
  id: string
  code: string
  project_name: string
  length_cm: number
  width_cm: number
  height_cm: number
  weight_kg: number
  created_at: string
  container: string
  shipped_at: string
}

export const packageRouter = router({
  getPackages: publicProcedure
    .input(
      z.object({
        filter: z.string(),
      })
    )
    .query(async ({ input }) => {
      const { filter } = input

      let sql = `
        SELECT 
          p.id,
          p.code,
          p.project_name,
          p.length_cm,
          p.width_cm,
          p.height_cm,
          p.weight_kg,
          p.created_at,
          c.code as container,
          c.created_at as shipped_at  
        FROM mes.packages p 
        LEFT JOIN mes.container_items ci ON ci.item_id = p.code
        LEFT JOIN mes.containers c ON c.id = ci.container_id
      `

      const params: (string | Date)[] = []
      const today = new Date().toISOString().split("T")[0]

      // Build the WHERE clause based on the validated input
      switch (filter) {
        case "today":
          sql += " WHERE DATE(p.created_at) = ?"
          params.push(today)
          break
        case "last30days":
          sql +=
            " WHERE DATE(p.created_at) >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)"
          break
        case "last90days":
          sql +=
            " WHERE DATE(p.created_at) >= DATE_SUB(CURDATE(), INTERVAL 90 DAY)"
          break
        case "1year":
          sql +=
            " WHERE DATE(p.created_at) >= DATE_SUB(CURDATE(), INTERVAL 1 YEAR)"
          break
        case "2years":
          sql +=
            " WHERE DATE(p.created_at) >= DATE_SUB(CURDATE(), INTERVAL 2 YEAR)"
          break
        case "3years":
          sql +=
            " WHERE DATE(p.created_at) >= DATE_SUB(CURDATE(), INTERVAL 3 YEAR)"
          break
        case "all":
          // No WHERE clause needed
          break
      }

      try {
        const [rows] = await mes.execute(sql, params)
        // Cast the rows to your interface for frontend type-safety
        return rows as ApiReportData[]
      } catch (error) {
        console.error("Database query error:", error)
        throw new Error("Database query failed")
      }
    }),
})
