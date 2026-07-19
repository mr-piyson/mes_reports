"use client"

import { Download, Eye, EyeOff, Loader2 } from "lucide-react"
import { useCallback, useState } from "react"
import { useQueryState } from "nuqs"
import { Bar, BarChart, CartesianGrid, LabelList, XAxis, YAxis } from "recharts"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  type ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { trpc } from "@/lib/trpc/client"

import { downloadCsv } from "@/lib/csv-export"

import { fromParam, gateParam, toParam } from "./params"

type ProjectData = {
  project: string
  defect_count: number
  total_panels_inspected: number
}

// Updated chart configuration matching your query fields and shadcn UI palette styles
const chartConfig = {
  total_panels_inspected: {
    label: "Panels",
    color: "var(--chart-2)",
  },
  defect_count: {
    label: "Total Defects",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig

export function Total_inspections_per_project_Chart() {
  const [appliedFrom, setAppliedFrom] = useQueryState("from", fromParam)
  const [appliedTo, setAppliedTo] = useQueryState("to", toParam)
  const [gate, setGate] = useQueryState("gate", gateParam)
  const [showLabels, setShowLabels] = useState(true)

  const { data, isLoading } = trpc.charts.get_totals_defects.useQuery({
    from: appliedFrom,
    to: appliedTo,
    groupBy: "project",
    limit: 6,
    gate: Number(gate),
  })

  const { data: fullData } = trpc.charts.get_totals_defects.useQuery({
    from: appliedFrom,
    to: appliedTo,
    groupBy: "project",
    gate: Number(gate),
  })

  const handleExport = useCallback(() => {
    if (!fullData || fullData.length === 0) return
    const header = "Project,Defect Count,Total Panels Inspected"
    const rows = (fullData as ProjectData[]).map(
      (r) => `${r.project},${r.defect_count},${r.total_panels_inspected}`
    )
    downloadCsv(
      [header, ...rows].join("\n"),
      `project-analytics-${new Date().toISOString().split("T")[0]}.csv`
    )
  }, [fullData])

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Project Analytics</CardTitle>
          <CardDescription>Defects vs Unique Panels Inspected</CardDescription>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleExport}
            disabled={!fullData || fullData.length === 0}
            className="h-8 w-8 p-0"
          >
            <Download className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowLabels(!showLabels)}
            className="h-8 w-8 p-0"
          >
            {showLabels ? (
              <Eye className="size-4" />
            ) : (
              <EyeOff className="size-4" />
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex h-75 items-center justify-center text-muted-foreground gap-2">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span>Loading factory metrics...</span>
          </div>
        ) : !data || data.length === 0 ? (
          <div className="flex h-75 items-center justify-center text-muted-foreground">
            No inspection data found for the selected period.
          </div>
        ) : (
          <ChartContainer config={chartConfig}>
            {/* Setting layout to vertical for long project name scannability */}
            <BarChart
              accessibilityLayer
              data={data as ProjectData[]}
              layout="vertical"
              margin={{ left: 24, right: 16 }}
            >
              <CartesianGrid horizontal={false} />

              {/* YAxis handles the Project categories */}
              <YAxis
                dataKey="project"
                type="category"
                tickLine={false}
                tickMargin={10}
                axisLine={true}
                className="fill-foreground font-medium"
                fontSize={12}
              />

              {/* XAxis calculates the numeric metrics */}
              <XAxis type="number" tickLine={false} axisLine={false} />

              {/* Tooltip matches the shadcn/ui spec from your template */}
              <ChartTooltip content={<ChartTooltipContent hideLabel />} />
              <ChartLegend content={<ChartLegendContent />} />

              {/* Bar 1: Total Panels Inspected (uses modern corner radius matching your layout) */}

              <Bar
                dataKey="total_panels_inspected"
                fill="var(--color-total_panels_inspected)"
                radius={[0, 4, 4, 0]}
              >
                {showLabels && (
                  <LabelList
                    dataKey="total_panels_inspected"
                    position="right"
                    offset={8}
                    className="fill-foreground"
                    fontSize={12}
                  />
                )}
              </Bar>

              {/* Bar 2: Defect Count */}
              <Bar
                dataKey="defect_count"
                fill="var(--color-defect_count)"
                radius={[0, 4, 4, 0]}
              >
                {showLabels && (
                  <LabelList
                    dataKey="defect_count"
                    position="right"
                    offset={8}
                    className="fill-foreground"
                    fontSize={12}
                  />
                )}
              </Bar>
            </BarChart>
          </ChartContainer>
        )}
      </CardContent>
      <CardFooter className="flex-col items-start gap-2 text-sm">
        <div className="leading-none text-muted-foreground">
          Live factory defect metrics aggregated by registered category logs.
        </div>
      </CardFooter>
    </Card>
  )
}
