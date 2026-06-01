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
  get_totals_inspections: publicProcedure
    .input(
      z.object({
        factory: z.string().default("F2 Rail"),
        from: z.date().optional().nullable(),
        to: z.date().optional().nullable(),
        gate: z.number().int().min(0).default(0), // 0 = all gates, >0 = specific gate
        limit: z.number().optional(),
        order: z.enum(["asc", "desc"]).default("desc"),
        groupBy: z.enum(["gate", "project"]).default("gate"),
      })
    )
    .query(async ({ input }) => {
      try {
        const { factory, from, to, gate, limit, order, groupBy } = input

        // Determine which gates to query
        const gatesToQuery = gate === 0 ? ALL_GATES : [gate]

        // Validate that a specific gate exists in our map
        if (gate !== 0 && !gateMap[gate]) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `Invalid gate ID: ${gate}. Valid gates are: ${Object.keys(gateMap).join(", ")}`,
          })
        }

        // --- Build parameterized conditions ---
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

        // Ensure SQL injection safety for ORDER BY direction
        const orderDirection = order === "asc" ? "ASC" : "DESC"

        // Variables to hold dynamic SQL strings
        let sql = ""
        const isProjectGroup = groupBy === "project"

        // --- Execute conditional SQL based on 'groupBy' ---
        if (isProjectGroup) {
          sql = `
            SELECT 
              ir.project,
              COUNT(*) as count
            FROM quality.inspection_results ir
            ${whereClause}
            GROUP BY ir.project
            ORDER BY count ${orderDirection}
            ${limit ? "LIMIT ?" : ""}
          `
        } else {
          sql = `
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
            ORDER BY ir.gate ${orderDirection}
            ${limit ? "LIMIT ?" : ""}
          `
        }

        // Append limit param if it exists
        if (limit) params.push(limit)

        // Run the query (loosely typing the return as we handle it conditionally)
        const [rows] = await db.mes.query<RowDataPacket[]>(sql, params)

        // --- Map-Reduce to Chart-Ready Format ---

        // 1. Format for Project Grouping
        if (isProjectGroup) {
          return rows.map((row) => ({
            project: row.project || "Unassigned",
            count: Number(row.count),
          }))
        }

        // 2. Format for Gate Grouping (Default)
        const formattedData: Record<
          number,
          { gate_name: string; OK: number; NOK: number }
        > = {}

        // Initialize empty placeholders so all requested gates are listed
        gatesToQuery.forEach((gateId) => {
          formattedData[gateId] = {
            gate_name: gateMap[gateId] || `Gate ${gateId}`,
            OK: 0,
            NOK: 0,
          }
        })

        // Reduce database rows directly into our map tracker
        rows.forEach((row) => {
          if (formattedData[row.gate]) {
            formattedData[row.gate][row.result_category as "OK" | "NOK"] =
              Number(row.count)
          }
        })

        // Return a clean array
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

  get_defect_counts_by_type: publicProcedure
    .input(
      z.object({
        from: z.date().optional().nullable(),
        to: z.date().optional().nullable(),
        limit: z.number().optional(),
      })
    )
    .query(async ({ input }) => {
      try {
        const { from, to, limit } = input

        // --- Build parameterized query ---
        const conditions: string[] = []
        const params: (Date | string | number)[] = []

        // Optional date range filtering for datetime_in
        if (from) {
          conditions.push("d.datetime_in >= ?")
          params.push(from)
        }
        if (to) {
          conditions.push("d.datetime_in <= ?")
          params.push(to)
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

        // Date range
        if (from) {
          conditions.push("ir.datetime >= ?")
          params.push(from)
        }
        if (to) {
          conditions.push("ir.datetime <= ?")
          params.push(to)
        }

        // FIX: Only generate WHERE clause if conditions exist to prevent SQL syntax breaks
        const whereClause =
          conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : ""

        const sql = `
          SELECT 
            COUNT(DISTINCT ir.id) AS total_inspections,
            COUNT(DISTINCT ir.panel_serial) AS total_panels_inspected,
            COUNT(DISTINCT CASE WHEN ir.inspection_result != 'OK' THEN ir.panel_serial END) AS total_defect_panels,
            COUNT(d.id) AS total_defects,
            ROUND(
                (COUNT(DISTINCT CASE WHEN ir.inspection_result != 'OK' THEN ir.panel_serial END) * 100.0) / 
                NULLIF(COUNT(DISTINCT ir.panel_serial), 0), 
                2
            ) AS defect_panel_percentage
          FROM quality.inspection_results ir 
          LEFT JOIN quality.defects d ON ir.id = d.inspection_id
          ${whereClause}
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
      })
    )
    .query(async ({ input }) => {
      try {
        const { from, to } = input

        // --- Build parameterized query ---
        const conditions: string[] = []
        const params: (Date | string | number)[] = []

        // Date range for datetime_in
        if (from) {
          conditions.push("d.datetime_in >= ?")
          params.push(from)
        }
        if (to) {
          conditions.push("d.datetime_in <= ?")
          params.push(to)
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

        const [rows] = await db.mes.query<
          (RowDataPacket & {
            defect_day: Date | null
            total_defects: number
          })[]
        >(sql, params)

        // --- Format Data ---
        // Converts database rows cleanly. Groups by day.
        return rows.map((row) => ({
          date: row.defect_day,
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
