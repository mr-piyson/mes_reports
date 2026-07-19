"use client"

import { Download, Eye, EyeOff, Loader2 } from "lucide-react"
import { useQueryState } from "nuqs"
import { useCallback, useState } from "react"
import { Bar, BarChart, CartesianGrid, LabelList, XAxis } from "recharts"

import { fromParam, gateParam, toParam } from "@/app/charts/inspections/params"
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
import { trpc } from "@/lib/trpc/client"

import { downloadCsv } from "@/lib/csv-export"

type GateData = {
  gate_name: string
  OK: number
  NOK: number
  total: number
  defect_rate: number
  gate: number
}

// 1. Map config keys to match our API payload structure
const chartConfig = {
  OK: {
    label: "Passed (OK)",
    color: "var(--chart-2)", // Emerald/Green theme color variable
  },
  NOK: {
    label: "Failed (NOK)",
    color: "var(--chart-1)", // Rose/Red theme color variable
  },
} satisfies ChartConfig

export function Total_OK_NOK_Chart() {
  const [appliedFrom, setAppliedFrom] = useQueryState("from", fromParam)
  const [appliedTo, setAppliedTo] = useQueryState("to", toParam)
  const [gate, setGate] = useQueryState("gate", gateParam)
  const [showLabels, setShowLabels] = useState(true)

  const { data, isLoading } = trpc.charts.get_totals_defects.useQuery({
    from: appliedFrom,
    to: appliedTo,
    gate: Number(gate),
    groupBy: "gate",
  })

  const handleExport = useCallback(() => {
    if (!data || data.length === 0) return
    const header = "Gate,OK,NOK,Total,Defect Rate"
    const rows = (data as GateData[]).map(
      (r) =>
        `${r.gate_name},${r.OK},${r.NOK},${r.total},${r.defect_rate}`
    )
    downloadCsv(
      [header, ...rows].join("\n"),
      `gates-analytics-${new Date().toISOString().split("T")[0]}.csv`
    )
  }, [data])

  return (
    <Card className="flex-1">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Gates Analytics</CardTitle>
          <CardDescription>
            Total inspection and defects per gate
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
          // Smooth loading state instead of an empty layout break
          <div className="flex h-75 items-center justify-center text-muted-foreground gap-2">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span>Loading defect analytics...</span>
          </div>
        ) : !data || data.length === 0 ? (
          <div className="flex h-75 items-center justify-center ">
            No data found for the selected period.
          </div>
        ) : (
          <ChartContainer config={chartConfig}>
            <BarChart
              accessibilityLayer
              data={data as GateData[]}
              margin={{ top: 20 }} // Added spacing to prevent numeric labels from getting clipped
            >
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="gate_name" // Maps directly to the gate labels we formatted on the backend
                tickLine={false}
                tickMargin={10}
                axisLine={false}
              />
              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent indicator="dashed" />}
              />

              {/* 3. OK Bar component with integrated data labels */}
              <Bar dataKey="OK" fill="var(--color-OK)" radius={4}>
                {showLabels && (
                  <LabelList
                    dataKey="OK"
                    position="top"
                    offset={10}
                    className="fill-foreground"
                    fontSize={12}
                    formatter={(value) => (Number(value) > 0 ? value : "")}
                  />
                )}
              </Bar>

              {/* 4. NOK Bar component with integrated data labels */}
              <Bar dataKey="NOK" fill="var(--color-NOK)" radius={4}>
                {showLabels && (
                  <LabelList
                    dataKey="NOK"
                    position="top"
                    offset={10}
                    className="fill-foreground"
                    fontSize={12}
                    formatter={(value) => (Number(value) > 0 ? value : "")}
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
