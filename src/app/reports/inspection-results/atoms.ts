import { atom } from "jotai"

export type InspectionResult = {
  id: number
  panel_serial: string
  project: string
  product_ref: string
  datetime: Date
  datetime_new: Date
  date: Date
  gate: string
  epicor_asm_part_no: string
  inspection_result: boolean
  inspector: string
  user: string
  factory: string
}

export const initData = atom<InspectionResult[]>([])
export const filteredData = atom<InspectionResult[]>([])
export const fromStore = atom<Date>()
export const toStore = atom<Date>()
export const toGate = atom<number>()
