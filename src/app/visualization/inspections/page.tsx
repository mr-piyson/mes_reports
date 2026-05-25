"use client"
import { ChevronDownIcon, FileSpreadsheet, Search } from "lucide-react"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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

const dataSummary = [
  { label: "Total Inspections", value: "1,234" },
  { label: "Total Defects", value: "567" },
  { label: "Defect Rate", value: "45.9%" },
  { label: "Average Defects per Inspection", value: "0.46" },
  { label: "Most Common Defect", value: "0.5" },
]

export default function Visulization(props: VisualizationProps) {
  const [gate, setGate] = useState<string>("0")

  // Date State with proper types
  const [from, setFrom] = useState<Date | undefined>()
  const [to, setTo] = useState<Date | undefined>()

  const { data, refetch, isLoading, isError } =
    trpc.charts.get_total_inspections_per_gate.useQuery({
      from: from,
      to: to,
    })

  console.log(data)

  return (
    <div className="flex flex-col h-screen max-h-screen p-2 gap-4 bg-background">
      <div className="p-4 border-b space-y-4 bg-card shrink-0 rounded-xl border">
        <div className="flex flex-wrap items-center gap-3">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-50 justify-between">
                {from ? from.toLocaleDateString() : "From Date"}
                <ChevronDownIcon className="ml-2 size-4 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={from}
                onSelect={setFrom}
                disabled={(d) => d > new Date()}
                initialFocus
              />
            </PopoverContent>
          </Popover>

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-50 justify-between">
                {to ? to.toLocaleDateString() : "To Date"}
                <ChevronDownIcon className="ml-2 size-4 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={to}
                onSelect={setTo}
                disabled={(d) => d > new Date() || (from ? d < from : false)}
                initialFocus
              />
            </PopoverContent>
          </Popover>

          <Button
            onClick={() => refetch()}
            disabled={isLoading || !from || !to}
          >
            <Search className="mr-2 size-4" />
            {isLoading ? "Searching..." : "Search"}
          </Button>
        </div>

        <Tabs value={gate} onValueChange={setGate} className="w-full">
          <TabsList className="w-full bg-muted/50">
            {GATE_OPTIONS.map((opt) => (
              <TabsTrigger key={opt.value} value={opt.value} className="flex-1">
                {opt.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>
      <div className="flex flex-row gap-4 justify-evenly shrink-0">
        {dataSummary.map((item) => (
          <Card key={item.label} className="w-1/4">
            <CardContent className="flex flex-col items-center justify-center">
              <div className="text-sm text-muted-foreground">{item.label}</div>
              <div className="text-2xl font-bold">{item.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex flex-col gap-4">
        <ChartBarInteractive className="pb-4" />
        <div className="flex w-full gap-4">
          <TotalInsectionChart className="flex-1" />
          <ChartBarHorizontal className="flex-1" />
          <Total_Defects_Per_Type_Chart className="flex-1" />
        </div>
      </div>
    </div>
  )
}
