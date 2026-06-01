"use client"
import { AlertCircle, Loader2, Search } from "lucide-react"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { trpc } from "@/lib/trpc/client"

import { ChartBarInteractive } from "./TimeChart"
import { Total_Defects_Per_Type_Chart } from "./Total_Defects_Per_Type_Chart"
import { Total_OK_NOK_Chart } from "./Total_OK_NOK_Chart"
import { Total_inspections_per_project_Chart } from "./Total_inspections_per_project_Chart"

type VisualizationProps = {
  children?: React.ReactNode
}

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

// Helper to convert native string dates safely to UTC/Local Date objects for tRPC
const parseDateString = (dateStr: string | undefined): Date | undefined => {
  if (!dateStr) return undefined
  const date = new Date(dateStr)
  return isNaN(date.getTime()) ? undefined : date
}

export default function Visualization(props: VisualizationProps) {
  const [gate, setGate] = useState<string>("0")

  // Native inputs store values as "YYYY-MM-DD" string arrays/states
  const [tempFrom, setTempFrom] = useState<string>("")
  const [tempTo, setTempTo] = useState<string>("")

  // Applied state that actually triggers the tRPC queries
  const [appliedFrom, setAppliedFrom] = useState<Date | undefined>()
  const [appliedTo, setAppliedTo] = useState<Date | undefined>()

  // Logic Check: Only allow queries if both dates are selected
  const isRangeSelected = !!appliedFrom && !!appliedTo

  // Individual Query 1: Gates
  const { data: totals_per_gate, isFetching: isFetching_per_gate } =
    trpc.charts.get_totals_inspections.useQuery(
      { from: appliedFrom, to: appliedTo, groupBy: "gate" },
      { enabled: isRangeSelected }
    )

  // Individual Query 2: Defect Types
  const { data: totals_per_type, isFetching: isFetching_per_type } =
    trpc.charts.get_defect_counts_by_type.useQuery(
      { from: appliedFrom, to: appliedTo, limit: 6 },
      { enabled: isRangeSelected }
    )

  // Individual Query 3: Top Stats
  const { data: statsData, isFetching: isFetching_stats } =
    trpc.charts.get_all_stats.useQuery(
      { from: appliedFrom, to: appliedTo },
      { enabled: isRangeSelected }
    )

  const { data: totals_per_project, isFetching: isFetching_per_project } =
    trpc.charts.get_totals_inspections.useQuery(
      { from: appliedFrom, to: appliedTo, groupBy: "project", limit: 6 },
      { enabled: isRangeSelected }
    )

  const { data: totals_per_day, isFetching: isFetching_per_day } =
    trpc.charts.get_total_defects_per_day.useQuery(
      { from: appliedFrom, to: appliedTo },
      { enabled: isRangeSelected }
    )

  const handleSearch = () => {
    setAppliedFrom(parseDateString(tempFrom))
    setAppliedTo(parseDateString(tempTo))
  }

  const dynamicSummary = [
    { label: "Total Inspections", value: statsData?.total_inspections ?? 0 },
    {
      label: "Total Panels Inspected",
      value: statsData?.total_panels_inspected ?? 0,
    },
    { label: "Defect Panels", value: statsData?.total_defect_panels ?? 0 },
    { label: "Total Raw Defects", value: statsData?.total_defects ?? 0 },
    {
      label: "Defect Rate",
      value: `${statsData?.defect_panel_percentage ?? 0}%`,
    },
  ]

  const isAnyFetching =
    isFetching_per_gate || isFetching_per_type || isFetching_stats

  // Get today's date formatted as YYYY-MM-DD to use as the `max` ceiling attribute
  const todayStr = new Date().toISOString().split("T")[0]

  return (
    <div className="flex flex-col min-h-screen p-2 md:p-4 gap-4 bg-background">
      {/* Controls Section */}
      <div className="p-4 border-b space-y-4 bg-card shrink-0 rounded-xl border">
        <div className="flex flex-col md:flex-row flex-wrap items-center gap-3 w-full">
          {/* Native From Date Picker */}
          <div className="w-full md:w-50 relative">
            <input
              type="date"
              value={tempFrom}
              max={todayStr}
              onChange={(e) => setTempFrom(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 appearance-none dark:scheme-dark"
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
              min={tempFrom || undefined} // Prevents picking a 'To' date prior to the 'From' date
              onChange={(e) => setTempTo(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 appearance-none dark:scheme-dark"
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
            disabled={isAnyFetching || !tempFrom || !tempTo}
            className="w-full md:w-auto"
          >
            {isAnyFetching ? (
              <Loader2 className="mr-2 size-4 animate-spin" />
            ) : (
              <Search className="mr-2 size-4" />
            )}
            {isAnyFetching ? "Searching..." : "Search"}
          </Button>
        </div>

        <Tabs value={gate} onValueChange={setGate} className="w-full">
          <TabsList className="w-full bg-muted/50 h-auto flex-wrap justify-start md:justify-center">
            {/* {GATE_OPTIONS.map((opt) => (
              <TabsTrigger
                key={opt.value}
                value={opt.value}
                className="flex-1 min-w-20"
              >
                {opt.label}
              </TabsTrigger>
            ))} */}
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
          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 shrink-0">
            {dynamicSummary.map((item) => (
              <Card key={item.label}>
                <CardContent className="flex flex-col items-center justify-center p-2 ">
                  <div className="text-lg md:text-sm text-muted-foreground text-center">
                    {item.label}
                  </div>
                  {isFetching_stats ? (
                    <div className="mt-2 flex items-center justify-center h-8">
                      <Loader2 className="size-5 animate-spin text-muted-foreground" />
                    </div>
                  ) : (
                    <div className="text-xl md:text-2xl font-bold mt-1">
                      {item.value}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="flex flex-col gap-4 pb-4">
            <ChartBarInteractive
              data={totals_per_day}
              isLoading={isFetching_per_day}
            />
            <div className="grid grid-cols-1 xl:grid-cols-3 w-full gap-4">
              <Total_OK_NOK_Chart
                data={totals_per_gate}
                isLoading={isFetching_per_gate}
              />
              <Total_inspections_per_project_Chart
                data={totals_per_project}
                isLoading={isFetching_per_project}
              />
              <Total_Defects_Per_Type_Chart
                data={totals_per_type}
                isLoading={isFetching_per_type}
              />
            </div>
          </div>
        </>
      )}
    </div>
  )
}
