import { parseAsIsoDate, parseAsString } from "nuqs"

// nuqs built-in parser handles Date objects cleanly
export const fromParam = parseAsIsoDate
export const toParam = parseAsIsoDate

// gate value is a string, defaulting to "0"
export const gateParam = parseAsString.withDefault("0")
