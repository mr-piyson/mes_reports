"use client"

import { Download, Eye, EyeOff, Loader2 } from "lucide-react"
import { useCallback, useState } from "react"
import { useQueryState } from "nuqs"
import { Bar, BarChart, CartesianGrid, LabelList, XAxis, YAxis } from "recharts"

import { fromParam, gateParam, toParam } from "@/app/charts/inspections/params"
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
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { trpc } from "@/lib/trpc/client"

import { downloadCsv } from "@/lib/csv-export"

const chartConfig = {
  defect_count: {
    label: "Defects",
    color: "var(--chart-1)",
  },
  label: {
    color: "var(--background)",
  },
} satisfies ChartConfig

export function Total_Defects_Per_Type_Chart() {
  const [appliedFrom, setAppliedFrom] = useQueryState("from", fromParam)
  const [appliedTo, setAppliedTo] = useQueryState("to", toParam)
  const [gate, setGate] = useQueryState("gate", gateParam)
  const [showLabels, setShowLabels] = useState(true)

  const { data, isLoading } = trpc.charts.get_defect_counts_by_type.useQuery({
    from: appliedFrom,
    to: appliedTo,
    limit: 6,
    gate: Number(gate),
  })

  const { data: fullData } = trpc.charts.get_defect_counts_by_type.useQuery({
    from: appliedFrom,
    to: appliedTo,
    gate: Number(gate),
  })

  const handleExport = useCallback(() => {
    if (!fullData || fullData.length === 0) return
    const header = "Defect Type,Defect Count"
    const rows = (fullData as { defect_type: string; defect_count: number }[]).map(
      (r) => `${r.defect_type},${r.defect_count}`
    )
    downloadCsv(
      [header, ...rows].join("\n"),
      `defect-type-analytics-${new Date().toISOString().split("T")[0]}.csv`
    )
  }, [fullData])

  return (
    <Card className="flex-1">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Defect Analytics</CardTitle>
          <CardDescription>Total defects of each defect type</CardDescription>
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
          // Smooth loading state instead of an empty layout break
          <div className="flex h-75 items-center justify-center text-muted-foreground gap-2">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span>Loading defect analytics...</span>
          </div>
        ) : !data || data.length === 0 ? (
          <div className="flex h-75 items-center justify-center text-muted-foreground">
            No defect data found for the selected period.
          </div>
        ) : (
          <ChartContainer config={chartConfig}>
            <BarChart
              accessibilityLayer
              data={data}
              layout="vertical"
              margin={{
                right: 32, // Margins adjusted to protect text metrics from clipping
                left: 8,
              }}
            >
              <CartesianGrid horizontal={false} />
              <YAxis
                dataKey="defect_type"
                type="category"
                tickLine={false}
                tickMargin={10}
                axisLine={false}
                hide // Keeps layout neat using internal labels instead
              />
              <XAxis dataKey="defect_count" type="number" hide />
              <ChartTooltip
                cursor={false}
                content={
                  <ChartTooltipContent
                    indicator="line"
                    nameKey="defect_count"
                  />
                }
              />
              <Bar dataKey="defect_count" fill="var(--chart-1)" radius={4}>
                {/* Inside Label: Displays the name of the defect */}
                <LabelList
                  dataKey="defect_type"
                  position="insideLeft"
                  offset={8}
                  className="fill-(--color-label) font-medium"
                  fontSize={12}
                />
                {/* Outside Label: Displays the raw count value on the far right */}
                {showLabels && (
                  <LabelList
                    dataKey="defect_count"
                    position="right"
                    offset={8}
                    className="fill-foreground font-semibold"
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
          Live factory defect metrics aggregated by registered category logs
        </div>
      </CardFooter>
    </Card>
  )
}
