import { createEnv } from "@t3-oss/env-core"
import * as z from "zod"

export const env = createEnv({
  server: {
    ERP_USERNAME: z.string(),
    ERP_PASSWORD: z.string(),
    ERP_SERVER: z.string(),
    ERP_DATABASE: z.string(),
    ERP_PORT: z.coerce.number(),
    MES_DATABASE_URL: z.string(),
  },
  // clientPrefix: "PUBLIC_",
  // client: {},
  runtimeEnv: process.env,
  emptyStringAsUndefined: true,
  onValidationError: (issues: any) => {
    console.error("\x1b[31m%s\x1b[0m", "❌ Invalid Environment Variables:")

    issues.forEach((issue: any) => {
      const varName = issue.path[0]?.toString() || "UNKNOWN"
      let errorMessage = issue.message

      // Check if it's a type mismatch to show "Expected vs Received"
      if (issue.code === "invalid_type") {
        errorMessage = `Expected ${issue.expected}, but received ${issue.received}`
      }

      console.log(
        "  \x1b[1m\x1b[31m%s\x1b[0m \x1b[90m->\x1b[0m \x1b[33m%s\x1b[0m",
        varName.padEnd(20),
        errorMessage
      )
    })

    console.info(
      "\n\x1b[41m\x1b[37m%s\x1b[0m",
      " FATAL: Fix your .env file to continue. "
    )
    process.exit(1)
  },

  onInvalidAccess(variable) {
    console.error(
      "\x1b[31m%s\x1b[0m \x1b[1m%s\x1b[0m",
      "❌ Invalid access to:",
      variable
    )
    process.exit(1)
  },
})
