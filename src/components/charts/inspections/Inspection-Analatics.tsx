"use client"

import { Download, Eye, EyeOff, Loader2 } from "lucide-react"
import { useQueryState } from "nuqs"
import { useCallback, useState } from "react"
import { Bar, BarChart, CartesianGrid, LabelList, XAxis } from "recharts"

import {
  fromParam,
  gateParam,
  toParam,
} from "@/components/charts/inspections/params"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { downloadCsv } from "@/lib/csv-export"
import { trpc } from "@/lib/trpc/client"

export const description = "Daily Defect Analytics"

// Updated to match the "count" concept rather than desktop/mobile
const chartConfig = {
  defects: {
    label: "Total Defects",
    color: "var(--chart-1)",
  },
  panels: {
    label: "Panels Inspected",
    color: "var(--chart-2)",
  },
} satisfies ChartConfig

type DefectData = {
  date: string | Date | null
  count: number
  panels: number
}

export function ChartBarInteractive() {
  const [appliedFrom, setAppliedFrom] = useQueryState("from", fromParam)
  const [appliedTo, setAppliedTo] = useQueryState("to", toParam)
  const [gate, setGate] = useQueryState("gate", gateParam)
  const [showLabels, setShowLabels] = useState(true)

  const { data, isLoading } = trpc.charts.get_total_defects_per_day.useQuery({
    from: appliedFrom,
    to: appliedTo,
    gate: Number(gate),
  })

  const handleExport = useCallback(() => {
    if (!data || data.length === 0) return
    const header = "Date,Panels Inspected,Defects"
    const rows = data.map(
      (r: { date: string | Date | null; count: number; panels: number }) =>
        `${r.date ?? ""},${r.panels ?? 0},${r.count}`
    )
    downloadCsv(
      [header, ...rows].join("\n"),
      `daily-analytics-${new Date().toISOString().split("T")[0]}.csv`
    )
  }, [data])

  return (
    <Card className="col-span-3 max-h-96 px-2 sm:p-6">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Daily Analytics</CardTitle>
          <CardDescription>
            Defects and panels inspected per day
          </CardDescription>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleExport}
            disabled={!data || data.length === 0}
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
          <div className="flex h-[300px] items-center justify-center gap-2 text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span>Loading defect analytics...</span>
          </div>
        ) : !data || data.length === 0 ? (
          <div className="flex h-[300px] items-center justify-center">
            No data found for the selected period.
          </div>
        ) : (
          <ChartContainer
            config={chartConfig}
            className="aspect-auto h-[250px] w-full"
          >
            <BarChart
              accessibilityLayer
              data={data} // Replaced undefined 'chartData' with 'data' prop
              margin={{
                left: 12,
                right: 12,
                top: showLabels ? 20 : 12,
              }}
            >
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                minTickGap={32}
                tickFormatter={(value) => {
                  if (!value) return ""
                  const date = new Date(value)
                  return date.toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })
                }}
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    className="w-[200px]"
                    labelFormatter={(value) => {
                      if (!value) return ""
                      return new Date(value).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })
                    }}
                  />
                }
              />
              <Bar
                dataKey="count"
                fill="var(--color-defects)"
                radius={[4, 4, 0, 0]}
              >
                {showLabels && (
                  <LabelList
                    dataKey="count"
                    position="top"
                    offset={10}
                    className="fill-foreground"
                    fontSize={12}
                  />
                )}
              </Bar>
              <Bar
                dataKey="panels"
                fill="var(--color-panels)"
                radius={[4, 4, 0, 0]}
              >
                {showLabels && (
                  <LabelList
                    dataKey="panels"
                    position="top"
                    offset={10}
                    className="fill-foreground"
                    fontSize={12}
                  />
                )}
              </Bar>
            </BarChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  )
}
