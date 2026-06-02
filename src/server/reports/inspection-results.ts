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
  defect_type: string | null
}

export interface InspectionResult {
  id: number
  panel_serial: string
  project: string
  date: string
  datetime: string
  factory: string
  gate: string
  inspection_result: boolean
  inspector: string
  epicor_asm_part_no: string | null
  image: string | null
  defect_type: string | null
  // --- Add these optional fields for Gate 5 ---
  paint_batch_no?: string
  delta_e?: number
  gloss?: number
  l_value?: number
  a_value?: number
  b_value?: number
  delta_l?: number
  delta_a?: number
  delta_b?: number
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
        gate: z.number().optional(),
      })
    )
    .query(async ({ input }) => {
      try {
        const { from, to, gate } = input
        const conditions: string[] = []
        const values: any[] = []

        // 1. Build Dynamic Query
        if (from) {
          conditions.push("ir.date >= ?")
          values.push(from)
        }
        if (to) {
          conditions.push("ir.date <= ?")
          values.push(to)
        }
        if (gate !== undefined && gate !== 0) {
          conditions.push("ir.gate = ?")
          values.push(gate)
        }

        const whereClause = conditions.length
          ? `WHERE ${conditions.join(" AND ")}`
          : ""

        const selectColumns = [
          "ir.id",
          "ir.panel_serial",
          "u.shortchar01 AS epicor_asm_part_no",
          "ir.project",
          "ir.datetime",
          "ir.date",
          "ir.gate",
          "ir.inspection_result",
          "ir.inspector",
          "ir.factory",
          "d.image",
          "dl.defect_type",
        ]

        if (gate === 5) {
          selectColumns.push(
            "ir.delta_e",
            "ir.l_value",
            "ir.a_value",
            "ir.b_value",
            "ir.delta_l",
            "ir.delta_a",
            "ir.delta_b",
            "ir.paint_batch_no",
            "ir.gloss"
          )
        }

        const query = `
            SELECT 
                ${selectColumns.join(",\n      ")}
            FROM quality.inspection_results ir
            LEFT JOIN quality.defects d ON ir.id = d.inspection_id
            LEFT JOIN label_app.ud31 u ON ir.panel_serial = u.key5
            LEFT JOIN quality.defects_list dl on d.defect_type = dl.id 
            ${whereClause}
            ORDER BY ir.datetime DESC;
          `
        const [rows] = await db.mes.execute<APIInspectionResult[]>(
          query,
          values
        )

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
        const result: InspectionResult[] = Array.from(dedupedMap.values()).map(
          (row) => ({
            id: row.id,
            panel_serial: row.panel_serial,
            project: row.project,
            date: new Date(row.date).toISOString(),
            datetime: new Date(row.datetime).toISOString(),
            factory: row.factory,
            gate: gateMap[row.gate] ?? "Unknown",
            inspection_result: row.inspection_result === "OK",
            inspector: row.inspector,
            image: row.image,
            defect_type: row.defect_type,
            epicor_asm_part_no: row.epicor_asm_part_no,
            // Additional fields for Gate 5
            ...(gate === 5 && {
              delta_e: row.delta_e,
              l_value: row.l_value,
              a_value: row.a_value,
              b_value: row.b_value,
              delta_l: row.delta_l,
              delta_a: row.delta_a,
              delta_b: row.delta_b,
              paint_batch_no: row.paint_batch_no,
              gloss: row.gloss,
            }),
          })
        )

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
