"use client"

import { AlertCircle, Search } from "lucide-react"
import { useQueryState } from "nuqs"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

import { Total_OK_NOK_Chart } from "./Gate-Analytics-Chart"
import { Total_inspections_per_project_Chart } from "./Project-Analytics-Chart"
import { SummaryCards } from "./SummaryCard"
import { ChartBarInteractive } from "./Inspection-Analatics"
import { Total_Defects_Per_Type_Chart } from "./Total_Defects_Per_Type_Chart"
import { fromParam, gateParam, toParam } from "./params"

const GATE_OPTIONS = [
  { value: "0", label: "All" },
  { value: "1", label: "Mold" },
  { value: "2", label: "Gelcoating" },
  { value: "10", label: "Demolding" },
  { value: "3", label: "Trimming" },
  { value: "11", label: "Drilling" },
  { value: "12", label: "Bonding" },
  { value: "5", label: "Painting" },
  { value: "6", label: "Final" },
]

export default function Visualization() {
  // nuqs search param state management
  const [appliedFrom, setAppliedFrom] = useQueryState<Date>("from", fromParam)
  const [appliedTo, setAppliedTo] = useQueryState<Date>("to", toParam)
  const [gate, setGate] = useQueryState("gate", gateParam)

  // Local-only datepicker strings before applying to URL
  const [tempFrom, setTempFrom] = useState<string>(
    appliedFrom ? appliedFrom.toISOString().split("T")[0] : ""
  )
  const [tempTo, setTempTo] = useState<string>(
    appliedTo ? appliedTo.toISOString().split("T")[0] : ""
  )

  const isRangeSelected = !!appliedFrom && !!appliedTo
  const todayStr = new Date().toISOString().split("T")[0]

  const handleSearch = async () => {
    if (tempFrom && tempTo) {
      await Promise.all([
        setAppliedFrom(new Date(tempFrom)),
        setAppliedTo(new Date(tempTo)),
      ])
    }
  }

  return (
    <div className="flex flex-col min-h-screen p-2 md:p-4 gap-4 bg-background">
      {/* Search & Control Top-Bar */}
      <div className="p-4 border-b space-y-4 bg-card shrink-0 rounded-xl border">
        <div className="flex flex-col md:flex-row flex-wrap items-center gap-3 w-full">
          {/* Native From Date Picker */}
          <div className="w-full md:w-50 relative">
            <input
              type="date"
              value={tempFrom}
              max={todayStr}
              onChange={(e) => setTempFrom(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm appearance-none dark:scheme-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
            {!tempFrom && (
              <span className="absolute left-3 top-2.5 text-sm text-muted-foreground pointer-events-none">
                From Date
              </span>
            )}
          </div>

          {/* Native To Date Picker */}
          <div className="w-full md:w-50 relative">
            <input
              type="date"
              value={tempTo}
              max={todayStr}
              min={tempFrom || undefined}
              onChange={(e) => setTempTo(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm appearance-none dark:scheme-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
            {!tempTo && (
              <span className="absolute left-3 top-2.5 text-sm text-muted-foreground pointer-events-none">
                To Date
              </span>
            )}
          </div>

          {/* Search Button */}
          <Button
            onClick={handleSearch}
            disabled={!tempFrom || !tempTo}
            className="w-full md:w-auto"
          >
            <Search className="mr-2 size-4" />
            Search
          </Button>
        </div>

        <Tabs value={gate} onValueChange={setGate} className="w-full">
          <TabsList className="w-full h-auto flex-wrap justify-start md:justify-center">
            {GATE_OPTIONS.map((opt) => (
              <TabsTrigger
                key={opt.value}
                value={opt.value}
                className="flex-1 min-w-20 data-[state=active]:bg-primary data-[state=active]:text-white"
              >
                {opt.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      {/* Main Content Area */}
      {!isRangeSelected ? (
        <div className="flex flex-col items-center justify-center flex-1 text-muted-foreground border-2 border-dashed rounded-xl p-12">
          <AlertCircle className="size-8 mb-4 opacity-50" />
          <h3 className="text-lg font-medium">No Date Range Selected</h3>
          <p className="text-sm">
            Please select a "From" and "To" date and hit Search to view
            analytics.
          </p>
        </div>
      ) : (
        <>
          {/* Component dependencies access context from URL states instantly */}
          <SummaryCards />

          <div className="flex flex-col gap-4 pb-4">
            <ChartBarInteractive />
            <div className="grid grid-cols-1 xl:grid-cols-3 w-full gap-4">
              <Total_OK_NOK_Chart />
              <Total_inspections_per_project_Chart />
              <Total_Defects_Per_Type_Chart />
            </div>
          </div>
        </>
      )}
    </div>
  )
}
