import { TRPCError } from "@trpc/server"
import { z } from "zod"

import { mes } from "@/lib/database"
import { publicProcedure, router } from "@/lib/trpc/server"

// Assuming your mysql2 pool instance

export const qualityRouter = router({
  getPaintInspectionData: publicProcedure
    .input(z.object({ panelSerial: z.string() }))
    .query(async ({ input }) => {
      const { panelSerial } = input

      try {
        // 1. Fetch Panel Metadata
        // [rows] destructures the first element of the mysql2 response array
        const [panel]: any = await mes.execute(
          `
          SELECT i.qr_code, i.epicor_part_no, proj.project_name 
          FROM label_app.kla_factory_epicor i
          LEFT JOIN mes.projects proj ON i.project_code = proj.project_code
          WHERE i.qr_code = ? 
          LIMIT 1
        `,
          [panelSerial]
        )

        if (!panel || panel.length === 0) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Panel metadata not found.",
          })
        }

        // 2. Fetch Paint & Colorimetric Data
        const [paintData]: any = await mes.execute(
          `
          SELECT 
            gelcoat_batch_no as paint_batch, 
            gloss_level, 
            l_val, dl_val, a_val, da_val, b_val, db_val, de_val
          FROM quality.inspection_results 
          WHERE panel_serial = ? 
          ORDER BY id DESC LIMIT 1
        `,
          [panelSerial]
        )

        // 3. Fetch Checklist Data
        const [checklist]: any = await mes.execute(
          `
          SELECT cr.checkpoint_id, cl.checkpoint_name, cr.result
          FROM quality.checklist_results cr
          JOIN quality.checklists cl ON cr.checkpoint_id = cl.id
          WHERE cr.panel_id = ?
        `,
          [panelSerial]
        )

        // 4. Fetch Defect Data
        const [defects]: any = await mes.execute(
          `
          SELECT defect_type, defect_location, root_cause_category, cause_worker_id
          FROM quality.defects 
          WHERE panel_serial = ?
        `,
          [panelSerial]
        )

        return {
          panel: panel[0],
          paint: paintData[0] || {},
          checklist: checklist || [],
          defects: defects || [],
        }
      } catch (error) {
        console.error("Database Error:", error)
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message:
            "An unexpected error occurred while fetching inspection data.",
        })
      }
    }),
})
