"use client"

import { Loader2 } from "lucide-react"
import { useQueryState } from "nuqs"
import { Bar, BarChart, CartesianGrid, LabelList, XAxis } from "recharts"

import { fromParam, gateParam, toParam } from "@/app/charts/inspections/params"
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

  const { data, isLoading } = trpc.charts.get_totals_defects.useQuery({
    from: appliedFrom,
    to: appliedTo,
    gate: Number(gate),
    groupBy: "gate",
  })

  return (
    <Card className="flex-1">
      <CardHeader>
        <CardTitle>Gates Analytics</CardTitle>
        <CardDescription>Total inspection and defects per gate</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          // Smooth loading state instead of an empty layout break
          <div className="flex h-75 items-center justify-center text-muted-foreground gap-2">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span>Loading defect analytics...</span>
          </div>
        ) : !data || data.length === 0 ? (
          <div className="flex h-75 items-center justify-center text-destructive">
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
                <LabelList
                  dataKey="OK"
                  position="top"
                  offset={10}
                  className="fill-foreground"
                  fontSize={12}
                  // Hides '0' tags if you want to keep the rendering area clean
                  formatter={(value) => (Number(value) > 0 ? value : "")}
                />
              </Bar>

              {/* 4. NOK Bar component with integrated data labels */}
              <Bar dataKey="NOK" fill="var(--color-NOK)" radius={4}>
                <LabelList
                  dataKey="NOK"
                  position="top"
                  offset={10}
                  className="fill-foreground"
                  fontSize={12}
                  formatter={(value) => (Number(value) > 0 ? value : "")}
                />
              </Bar>
            </BarChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  )
}
