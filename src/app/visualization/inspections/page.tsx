"use client"
import { AlertCircle, ChevronDownIcon, Loader2, Search } from "lucide-react"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Card, CardContent } from "@/components/ui/card"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { trpc } from "@/lib/trpc/client"

import { TotalInsectionChart } from "./DefectsLineChart"
import { Total_Defects_Per_Type_Chart } from "./ProjectDefects"
import { ChartBarHorizontal } from "./RowLineChart"
import { ChartBarInteractive } from "./TimeChart"

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

export default function Visualization(props: VisualizationProps) {
  const [gate, setGate] = useState<string>("0")

  // Temporary UI state for the calendar popovers
  const [tempFrom, setTempFrom] = useState<Date | undefined>()
  const [tempTo, setTempTo] = useState<Date | undefined>()

  // Applied state that actually triggers the tRPC queries
  const [appliedFrom, setAppliedFrom] = useState<Date | undefined>()
  const [appliedTo, setAppliedTo] = useState<Date | undefined>()

  // Logic Check: Only allow queries if both dates are selected
  const isRangeSelected = !!appliedFrom && !!appliedTo

  // Individual Query 1: Gates
  const { data: totals_per_gate, isFetching: isFetching_per_gate } =
    trpc.charts.get_total_inspections_per_gate.useQuery(
      { from: appliedFrom, to: appliedTo },
      { enabled: isRangeSelected } // Disables automatic fetch on mount
    )

  // Individual Query 2: Defect Types
  const { data: totals_per_type, isFetching: isFetching_per_type } =
    trpc.charts.get_defect_counts_by_type.useQuery(
      { from: appliedFrom, to: appliedTo },
      { enabled: isRangeSelected }
    )

  // Individual Query 3: Top Stats
  const { data: statsData, isFetching: isFetching_stats } =
    trpc.charts.get_all_stats.useQuery(
      { from: appliedFrom, to: appliedTo },
      { enabled: isRangeSelected }
    )

  const handleSearch = () => {
    setAppliedFrom(tempFrom)
    setAppliedTo(tempTo)
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

  // Use `isFetching` instead of `isLoading` when dealing with `enabled: false` queries
  const isAnyFetching =
    isFetching_per_gate || isFetching_per_type || isFetching_stats

  return (
    // Changed to min-h-screen to allow scrolling on mobile if content overflows
    <div className="flex flex-col min-h-screen p-2 md:p-4 gap-4 bg-background">
      {/* Controls Section */}
      <div className="p-4 border-b space-y-4 bg-card shrink-0 rounded-xl border">
        {/* Changed flex layout to allow inputs to stack on mobile */}
        <div className="flex flex-col md:flex-row flex-wrap items-center gap-3 w-full">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-full md:w-[200px] justify-between"
              >
                {tempFrom ? tempFrom.toLocaleDateString() : "From Date"}
                <ChevronDownIcon className="ml-2 size-4 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={tempFrom}
                onSelect={setTempFrom}
                disabled={(d) => d > new Date()}
                initialFocus
              />
            </PopoverContent>
          </Popover>

          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-50 w-full md:w-[200px] justify-between"
              >
                {tempTo ? tempTo.toLocaleDateString() : "To Date"}
                <ChevronDownIcon className="ml-2 size-4 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={tempTo}
                onSelect={setTempTo}
                disabled={(d) =>
                  d > new Date() || (tempFrom ? d < tempFrom : false)
                }
                initialFocus
              />
            </PopoverContent>
          </Popover>

          {/* Search button is disabled unless both temporary dates are picked */}
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
          {/* Added h-auto and flex-wrap so tabs don't overflow screen boundaries on small devices */}
          <TabsList className="w-full bg-muted/50 h-auto flex-wrap justify-start md:justify-center">
            {GATE_OPTIONS.map((opt) => (
              <TabsTrigger
                key={opt.value}
                value={opt.value}
                className="flex-1 min-w-[80px]"
              >
                {opt.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      {/* Main Content Area */}
      {!isRangeSelected ? (
        // Empty State: Prompt the user to pick a date
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
          {/* Summary Cards: 2 columns on mobile, 3 on tablet, 5 on desktop */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 shrink-0">
            {dynamicSummary.map((item) => (
              <Card key={item.label}>
                <CardContent className="flex flex-col items-center justify-center p-4 md:p-6">
                  <div className="text-xs md:text-sm text-muted-foreground text-center">
                    {item.label}
                  </div>
                  {isFetching_stats ? (
                    <div className="mt-2 flex items-center justify-center h-[32px]">
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
            <ChartBarInteractive />
            {/* Charts Area: 1 column on mobile, 3 columns on desktop */}
            <div className="grid grid-cols-1 xl:grid-cols-3 w-full gap-4">
              <TotalInsectionChart
                data={totals_per_gate}
                isLoading={isFetching_per_gate}
              />
              <ChartBarHorizontal />
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
