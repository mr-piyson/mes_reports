import { TRPCError } from "@trpc/server"
import { type RowDataPacket } from "mysql2"
import { z } from "zod"

import db from "@/lib/database"
import { publicProcedure, router } from "@/lib/trpc/server"

// --- Types & Constants ---

export type APIInspectionResult = RowDataPacket & {
  id: number
  panel_serial: string
  project: string
  datetime: Date
  date: Date
  gate: number
  inspection_result: string
  epicor_asm_part_no: string
  inspector: string
  factory: string
}

export interface InspectionResultDTO {
  id: number
  panel_serial: string
  project: string
  date: string
  datetime: string
  factory: string
  gate: string
  inspection_result: boolean
  inspector: string
  epicor_asm_part_no: string
}

const gateMap: Record<number, string> = {
  1: "Mold",
  2: "Gelcoating",
  3: "Trimming",
  4: "Finishing",
  5: "Painting",
  6: "Final",
  10: "Demolding",
  11: "Drilling",
  12: "Bonding",
  15: "Paint Prep",
  16: "Wrapping",
  17: "Packing",
  18: "Mixing",
  19: "Casting",
  20: "Pullout Test",
  21: "Curing",
  22: "After Trimming",
}

// --- Router Definition ---

export const inspectionsRouter = router({
  getResults: publicProcedure
    .input(
      z.object({
        from: z.date().optional().nullable(),
        to: z.date().optional().nullable(),
        gates: z.array(z.number()).optional().default([]),
      })
    )
    .query(async ({ input }) => {
      try {
        const { from, to, gates } = input
        const conditions: string[] = []
        const values: any[] = []

        console.log("Input Dates:", { from, to })
        console.log("SQL Conditions:", conditions)
        console.log("SQL Values:", values)

        // 1. Build Dynamic Query
        if (from) {
          conditions.push("ir.date >= ?")
          values.push(from)
        }
        if (to) {
          conditions.push("ir.date <= ?")
          values.push(to)
        }
        if (gates.length > 0 && gates[0] !== 0) {
          const placeholders = gates.map(() => "?").join(",")
          conditions.push(`ir.gate IN (${placeholders})`)
          values.push(...gates)
        }

        const whereClause = conditions.length
          ? `WHERE ${conditions.join(" AND ")}`
          : ""

        const query = `
          SELECT 
            ir.id,
            ir.panel_serial,
            u.shortchar01 AS epicor_asm_part_no,
            ir.project,
            ir.datetime,
            ir.date,
            ir.gate,
            ir.inspection_result,
            ir.inspector,
            ir.factory
          FROM quality.inspection_results ir
          LEFT JOIN label_app.ud31 u ON u.key5 = ir.panel_serial
          ${whereClause}
          ORDER BY ir.datetime DESC;
        `

        const [rows] = await db.mes.execute<APIInspectionResult[]>(
          query,
          values
        )

        console.log("Raw Rows Count:", rows.length)

        // 2. In-memory Deduplication (Keep oldest entry per Serial + Gate)
        const dedupedMap = new Map<string, APIInspectionResult>()

        for (const row of rows) {
          const panelSerial = row.panel_serial.toUpperCase()
          const key = `${panelSerial}__${row.gate}`
          row.panel_serial = panelSerial

          const existing = dedupedMap.get(key)
          if (!existing || row.datetime < existing.datetime) {
            dedupedMap.set(key, row)
          }
        }

        // 3. Transform to DTO
        const result: InspectionResultDTO[] = Array.from(
          dedupedMap.values()
        ).map((row) => ({
          id: row.id,
          panel_serial: row.panel_serial,
          project: row.project,
          date: row.date.toISOString(),
          datetime: row.datetime.toISOString(),
          factory: row.factory,
          gate: gateMap[row.gate] ?? "Unknown",
          inspection_result: row.inspection_result === "OK",
          inspector: row.inspector,
          epicor_asm_part_no: row.epicor_asm_part_no,
        }))

        return result
      } catch (error) {
        console.error("tRPC Error (getResults):", error)
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch inspection results",
        })
      }
    }),
})
