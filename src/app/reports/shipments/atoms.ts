import { atom } from "jotai"

export interface ApiReportData {
  package: string
  project: string
  part_id: string
  description: string
  container_id: string
  date: string
  shipped_by: string
  job_id: string
  epicor_asm_part_no: string
  epicor_part_no: string
}

export interface ReportData {
  package: string
  project: string
  part_id: string
  description: string
  container_id: string
  date: Date
  shipped_by: string
  job_id: string
  epicor_asm_part_no: string
  epicor_part_no: string
}

export const initData = atom<ReportData[]>([])
export const filteredData = atom<ReportData[]>([])
export const yearStore = atom<string>("")
export const monthStore = atom<string>("")
