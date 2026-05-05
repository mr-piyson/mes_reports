import { atom } from "jotai"

export interface ApiReportData {
  panel_serial: string
  datetime_out: string
  gate: string
}

export interface ReportData {
  panel_serial: string
  [key: string]: string
}

export const initData = atom<ReportData[]>([])
export const filteredData = atom<ReportData[]>([])
export const filterStore = atom<string>("")

const workstation: Record<number, string | undefined> = {
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

type Mode = "min" | "max"

export function getPivotData(
  api: ApiReportData[],
  mode: Mode = "max"
): ReportData[] {
  const panelMap = new Map<string, Record<string, Date>>()

  for (const { panel_serial, datetime_out, gate } of api) {
    const workstationName = workstation[Number(gate)]
    if (!workstationName) continue

    // SINGLE SOURCE OF TRUTH
    const normalizedPanel = panel_serial.trim().toUpperCase()

    let record = panelMap.get(normalizedPanel)
    if (!record) {
      record = {}
      panelMap.set(normalizedPanel, record)
    }

    const newTime = new Date(datetime_out)
    const currentTime = record[workstationName]

    if (
      !currentTime ||
      (mode === "min" && newTime < currentTime) ||
      (mode === "max" && newTime > currentTime)
    ) {
      record[workstationName] = newTime
    }
  }

  return Array.from(panelMap.entries(), ([panel_serial, workstationData]) => ({
    panel_serial, // already uppercase
    ...workstationData,
  }))
}
