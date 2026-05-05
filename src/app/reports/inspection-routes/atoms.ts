import { atom } from "jotai"

export interface ReportData {
  panel_serial: string
  project: string
  latest_out: Date
  route: string[]
}

export const initData = atom<ReportData[]>([])
export const filteredData = atom<ReportData[]>([])
export const filterStore = atom<string>("")
