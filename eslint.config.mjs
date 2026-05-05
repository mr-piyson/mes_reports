// eslint.config.mjs (for Next.js 15/16)
import { FlatCompat } from "@eslint/eslintrc"
import { dirname } from "path"
import { fileURLToPath } from "url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const compat = new FlatCompat({
  basePath: __dirname,
})

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript", "prettier"),
  {
    rules: {
      "jsx-a11y/no-static-element-interactions": "off",
      "jsx-a11y/click-events-have-key-events": "off",
      "@typescript-eslint/no-unused-vars": "warn",
      "react/no-array-index-key": "off",
    },
  },
]

export default eslintConfig
