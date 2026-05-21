"use client"

import { Bar, BarChart, CartesianGrid, LabelList, XAxis } from "recharts"

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

export function TotalInsectionChart(props: any) {
  // 2. Fetch data directly from your newly updated tRPC procedure
  const { data: chartData = [], isLoading } =
    trpc.charts.get_total_inspections_per_gate.useQuery({
      gate: 0, // 0 means aggregate all gates
    })

  if (isLoading) {
    return (
      <Card
        {...props}
        className="flex h-80 items-center justify-center text-sm text-muted-foreground"
      >
        Loading inspection metrics...
      </Card>
    )
  }

  return (
    <Card {...props}>
      <CardHeader>
        <CardTitle>Total Inspection Chart</CardTitle>
        <CardDescription>
          Breakdown of OK vs NOK across production areas
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig}>
          <BarChart
            accessibilityLayer
            data={chartData}
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
                formatter={(value: number) => (value > 0 ? value : "")}
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
                formatter={(value: number) => (value > 0 ? value : "")}
              />
            </Bar>
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
