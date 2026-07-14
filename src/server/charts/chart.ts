import { TRPCError } from "@trpc/server"
import { type RowDataPacket } from "mysql2"
import { z } from "zod"

import db from "@/lib/database"
import { publicProcedure, router } from "@/lib/trpc/server"

// 15: "Paint Prep",
// 16: "Wrapping",
// 17: "Packing",
// 18: "Mixing",
// 19: "Casting",
// 20: "Pullout Test",
// 21: "Curing",
// 22: "After Trimming",

// Mapping of gate IDs to display names
const gateMap: Record<number, string> = {
  1: "Mold",
  2: "Gelcoating",
  10: "Demolding",
  3: "Trimming",
  11: "Drilling",
  12: "Bonding",
  5: "Painting",
  6: "Final",
}

// All available gate IDs
const ALL_GATES = Object.keys(gateMap).map(Number)

export const chartsRouter = router({
  get_totals_defects: publicProcedure
    .input(
      z.object({
        factory: z.string().default("F2 Rail"),
        from: z.date().optional().nullable(),
        to: z.date().optional().nullable(),
        gate: z.number().int().min(0).default(0),
        limit: z.number().int().positive().optional(),
        order: z.enum(["asc", "desc"]).default("desc"),
        groupBy: z.enum(["gate", "project"]).default("gate"),
      })
    )
    .query(async ({ input }) => {
      try {
        const { factory, from, to, gate, limit, order, groupBy } = input

        // Validate gate
        if (gate !== 0 && !gateMap[gate]) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `Invalid gate ID: ${gate}. Valid gates are: ${Object.keys(
              gateMap
            ).join(", ")}`,
          })
        }

        const conditions: string[] = ["ir.factory = ?"]
        const params: (string | Date | number)[] = [factory]

        if (from) {
          conditions.push("ir.date >= ?")
          params.push(from)
        }

        if (to) {
          conditions.push("ir.date <= ?")
          params.push(to)
        }

        if (gate !== 0) {
          conditions.push("ir.gate = ?")
          params.push(gate)
        }

        const whereClause = conditions.join(" AND ")
        const isProjectGroup = groupBy === "project"
        const orderDirection = order === "asc" ? "ASC" : "DESC"

        let sql: string

        if (isProjectGroup) {
          sql = `
          SELECT
            ir.project,
            SUM(
              CASE
                WHEN ir.inspection_result != 'OK' THEN 1
                ELSE 0
              END
            ) AS defect_count,
            COUNT(DISTINCT ir.panel_serial) AS total_panels_inspected
          FROM quality.inspection_results ir
          WHERE ${whereClause}
          GROUP BY ir.project
          ORDER BY defect_count ${orderDirection}
          ${limit !== undefined ? "LIMIT ?" : ""}
        `
        } else {
          sql = `
          SELECT
            ir.gate,
            CASE
              WHEN ir.inspection_result = 'OK' THEN 'OK'
              ELSE 'NOK'
            END AS result_category,
            COUNT(*) AS count
          FROM quality.inspection_results ir
          WHERE ${whereClause}
          GROUP BY ir.gate, result_category
          ${limit !== undefined ? "LIMIT ?" : ""}
        `
        }

        if (limit !== undefined) {
          params.push(limit)
        }

        const [rows] = await db.mes.query<any[]>(sql, params)

        // ==========================================
        // Project View
        // ==========================================
        if (isProjectGroup) {
          return rows.map((row) => ({
            project: row.project ?? "Unassigned",
            defect_count: Number(row.defect_count),
            total_panels_inspected: Number(row.total_panels_inspected),
          }))
        }

        // ==========================================
        // Gate View
        // ==========================================

        const gatesToQuery =
          gate !== 0 ? [gate] : Object.keys(gateMap).map(Number)

        const formattedData: Record<
          number,
          {
            gate_name: string
            OK: number
            NOK: number
            total: number
            defect_rate: number
          }
        > = {}

        // Initialize gates
        for (const gateId of gatesToQuery) {
          formattedData[gateId] = {
            gate_name: gateMap[gateId] ?? `Gate ${gateId}`,
            OK: 0,
            NOK: 0,
            total: 0,
            defect_rate: 0,
          }
        }

        // Populate counts
        for (const row of rows) {
          const gateId = Number(row.gate)

          if (!formattedData[gateId]) continue

          formattedData[gateId][row.result_category as "OK" | "NOK"] = Number(
            row.count
          )
        }

        // Calculate totals and defect rates
        Object.values(formattedData).forEach((gate) => {
          gate.total = gate.OK + gate.NOK
          gate.defect_rate =
            gate.total > 0
              ? Number(((gate.NOK / gate.total) * 100).toFixed(2))
              : 0
        })

        const customOrder = [1, 2, 10, 3, 11, 12, 5, 6]

        const orderedGates =
          order === "asc" ? customOrder : [...customOrder].reverse()

        return orderedGates
          .filter((gateId) => formattedData[gateId])
          .map((gateId) => ({
            gate: gateId,
            ...formattedData[gateId],
          }))
      } catch (error) {
        console.error("tRPC Error (get_totals_defects):", error)

        if (error instanceof TRPCError) {
          throw error
        }

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch inspection results",
        })
      }
    }),

  get_defect_counts_by_type: publicProcedure
    .input(
      z.object({
        from: z.date().optional().nullable(),
        to: z.date().optional().nullable(),
        limit: z.number().optional(),
        gate: z.number().optional().default(0),
      })
    )
    .query(async ({ input }) => {
      try {
        const { from, to, limit, gate } = input

        // --- Build parameterized query ---
        const conditions: string[] = []
        const params: (Date | string | number)[] = []

        // Date range — use ir.date to match report page filter
        if (from) {
          conditions.push("ir.date >= ?")
          params.push(from)
        }
        if (to) {
          conditions.push("ir.date <= ?")
          params.push(to)
        }

        if (gate !== 0) {
          conditions.push("ir.gate = ?")
          params.push(gate)
        }

        // Only append WHERE clause if we actually have date filters passed
        const whereConditions =
          conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : ""

        limit ? params.push(limit) : undefined

        const sql = `
          SELECT
            dl.defect_type,
            COUNT(d.id) AS defect_count
          FROM quality.defects d
          LEFT JOIN quality.defects_list dl ON d.defect_type = dl.id
          LEFT JOIN quality.inspection_results ir ON d.inspection_id = ir.id
          ${whereConditions}
          GROUP BY dl.id, dl.defect_type
          ORDER BY defect_count DESC
          ${limit ? `limit ?` : ""}
        `

        const [rows] = await db.mes.query<
          (RowDataPacket & {
            defect_type: string | null
            defect_count: number
          })[]
        >(sql, params)

        // --- Format Data ---
        // Converts database rows cleanly. Handles potential nulls gracefully if a defect has an orphaned layout ID.
        return rows.map((row) => ({
          defect_type: row.defect_type || "Unknown / Unclassified",
          defect_count: Number(row.defect_count),
        }))
      } catch (error) {
        console.error("tRPC Error (get_defect_counts_by_type):", error)
        if (error instanceof TRPCError) throw error
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch defect counts by type",
        })
      }
    }),

  get_all_stats: publicProcedure
    .input(
      z.object({
        from: z.date().optional().nullable(),
        to: z.date().optional().nullable(),
      })
    )
    .query(async ({ input }) => {
      try {
        const { from, to } = input

        // --- Build parameterized query ---
        const conditions: string[] = []
        const params: (Date | string | number)[] = []

        // Date range — use ir.date (DATE column) to include full day,
        // matching the report page filter. ir.datetime would exclude
        // records after midnight on the `to` date.
        if (from) {
          conditions.push("ir.date >= ?")
          params.push(from)
        }
        if (to) {
          conditions.push("ir.date <= ?")
          params.push(to)
        }

        const whereClause =
          conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : ""

        const sql = `
          SELECT
            COUNT(*) AS total_inspections,
            COUNT(DISTINCT panel_serial) AS total_panels_inspected,
            COUNT(DISTINCT CASE WHEN inspection_result != 'OK' THEN panel_serial END) AS total_defect_panels,
            defect_count AS total_defects,
            ROUND(
                (COUNT(DISTINCT CASE WHEN inspection_result != 'OK' THEN panel_serial END) * 100.0) /
                NULLIF(COUNT(DISTINCT panel_serial), 0),
                2
            ) AS defect_panel_percentage
          FROM (
            SELECT
              ir.id,
              ir.panel_serial,
              ir.inspection_result,
              ir.gate,
              ir.date,
              (SELECT COUNT(*) FROM quality.defects d WHERE d.inspection_id = ir.id) AS defect_count
            FROM quality.inspection_results ir
            ${whereClause}
            GROUP BY ir.panel_serial, ir.gate
          ) AS deduped
        `

        // Strongly type the expected single row output
        const [rows] = await db.mes.query<
          (RowDataPacket & {
            total_inspections: number
            total_panels_inspected: number
            total_defect_panels: number
            total_defects: number
            defect_panel_percentage: number | null
          })[]
        >(sql, params)

        // Validate that we received data back
        if (!rows || rows.length === 0) {
          return {
            total_inspections: 0,
            total_panels_inspected: 0,
            total_defect_panels: 0,
            total_defects: 0,
            defect_panel_percentage: 0,
          }
        }

        // FIX: Extract the single aggregate row directly for a cleaner frontend payload
        const stats = rows[0]

        return {
          total_inspections: Number(stats.total_inspections),
          total_panels_inspected: Number(stats.total_panels_inspected),
          total_defect_panels: Number(stats.total_defect_panels),
          total_defects: Number(stats.total_defects),
          defect_panel_percentage: stats.defect_panel_percentage
            ? Number(stats.defect_panel_percentage)
            : 0,
        }
      } catch (error) {
        console.error("tRPC Error (get_all_stats):", error)
        if (error instanceof TRPCError) throw error
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch inspection summary stats",
        })
      }
    }),
  get_total_defects_per_day: publicProcedure
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

        // --- Build parameterized query ---
        const conditions: string[] = []
        const params: (Date | string | number)[] = []

        // Date range — use ir.date to match report page filter
        if (from) {
          conditions.push("ir.date >= ?")
          params.push(from)
        }
        if (to) {
          conditions.push("ir.date <= ?")
          params.push(to)
        }

        if (gate && gate !== 0) {
          conditions.push("ir.gate = ?")
          params.push(gate)
        }

        // Only append WHERE clause if we actually have date filters passed
        const whereConditions =
          conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : ""

        const sql = `
          SELECT
            DATE(d.datetime_in) AS date,
            COUNT(d.id) AS total_defects
          FROM quality.defects d
          LEFT JOIN quality.inspection_results ir ON d.inspection_id = ir.id
          ${whereConditions}
          GROUP BY date
          ORDER BY date ASC
        `

        // FIX 1: Updated type definition to expect 'date' instead of 'defect_day'
        const [rows] = await db.mes.query<
          (RowDataPacket & {
            date: Date | string | null
            total_defects: number
          })[]
        >(sql, params)

        // --- Format Data ---
        // FIX 2: Map from 'row.date' instead of 'row.defect_day'
        return rows.map((row) => ({
          date: row.date,
          count: Number(row.total_defects),
        }))
      } catch (error) {
        console.error("tRPC Error (get_total_defects_per_day):", error)
        if (error instanceof TRPCError) throw error
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch defect counts per day",
        })
      }
    }),
})
