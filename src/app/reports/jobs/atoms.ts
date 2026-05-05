import { atom } from "jotai"

import { ApiJobsData } from "@/app/api/reports/jobs/route"

export const initData = atom<ApiJobsData[]>([])
export const filteredData = atom<ApiJobsData[]>([])
export const fromStore = atom<Date>()
export const toStore = atom<Date>()
