import { TRPCError } from "@trpc/server"
import { type RowDataPacket } from "mysql2"
import { z } from "zod"

import db from "@/lib/database"
import { publicProcedure, router } from "@/lib/trpc/server"

// Mapping of gate IDs to display names
const gateMap: Record<number, string> = {
  2: "Gelcoating",
  1: "Mold",
  3: "Trimming",
  4: "Finishing",
  5: "Painting",
  6: "Final",
  10: "Demolding",
  11: "Drilling",
  12: "Bonding",
  // 15: "Paint Prep",
  // 16: "Wrapping",
  // 17: "Packing",
  // 18: "Mixing",
  // 19: "Casting",
  // 20: "Pullout Test",
  // 21: "Curing",
  // 22: "After Trimming",
}

// All available gate IDs
const ALL_GATES = Object.keys(gateMap).map(Number)

// Helper to build placeholder string for IN clause
const placeholders = (arr: unknown[]) => arr.map(() => "?").join(",")

export const chartsRouter = router({
  get_total_inspections_per_gate: publicProcedure
    .input(
      z.object({
        factory: z.string().default("F2 Rail"),
        from: z.date().optional().nullable(),
        to: z.date().optional().nullable(),
        gate: z.number().int().min(0).default(0), // 0 = all gates, >0 = specific gate
      })
    )
    .query(async ({ input }) => {
      try {
        const { factory, from, to, gate } = input

        // Determine which gates to query
        const gatesToQuery = gate === 0 ? ALL_GATES : [gate]

        // Validate that a specific gate exists in our map
        if (gate !== 0 && !gateMap[gate]) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `Invalid gate ID: ${gate}. Valid gates are: ${Object.keys(gateMap).join(", ")}`,
          })
        }

        // --- Build parameterized query ---
        const conditions: string[] = []
        const params: (string | Date | number)[] = []

        // Factory is required
        conditions.push("ir.factory = ?")
        params.push(factory)

        // Date range
        if (from) {
          conditions.push("ir.datetime >= ?")
          params.push(from)
        }
        if (to) {
          conditions.push("ir.datetime <= ?")
          params.push(to)
        }

        // Gate filter (using IN clause with our gates list)
        conditions.push(`ir.gate IN (${placeholders(gatesToQuery)})`)
        params.push(...gatesToQuery)

        const whereClause = `WHERE ${conditions.join(" AND ")}`

        // Optimized query: Treat anything not exactly 'OK' as NOK
        const sql = `
          SELECT 
            ir.gate,
            CASE 
              WHEN ir.inspection_result = 'OK' THEN 'OK'
              ELSE 'NOK'
            END AS result_category,
            COUNT(*) as count
          FROM quality.inspection_results ir
          ${whereClause}
          GROUP BY ir.gate, result_category
          ORDER BY ir.gate
        `

        const [rows] = await db.mes.query<
          (RowDataPacket & {
            gate: number
            result_category: "OK" | "NOK"
            count: number
          })[]
        >(sql, params)

        // --- Map-Reduce Flat Rows to Chart-Ready Format ---
        // Creates structured items mapping keys directly for Recharts configurations
        const formattedData: Record<
          number,
          { gate_name: string; OK: number; NOK: number }
        > = {}

        // 1. Initialize empty placeholders with zeros so all gates are listed systematically
        gatesToQuery.forEach((gateId) => {
          formattedData[gateId] = {
            gate_name: gateMap[gateId] || `Gate ${gateId}`,
            OK: 0,
            NOK: 0,
          }
        })

        // 2. Reduce database flat metrics rows directly into our map tracker
        rows.forEach((row) => {
          if (formattedData[row.gate]) {
            formattedData[row.gate][row.result_category] = Number(row.count)
          }
        })

        // 3. Return a clean list array ordered properly by gate id
        return Object.values(formattedData)
      } catch (error) {
        console.error("tRPC Error (get_total_inspections_per_gate):", error)
        if (error instanceof TRPCError) throw error
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch inspection results",
        })
      }
    }),
})
