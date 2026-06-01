"use client"

import { Loader2 } from "lucide-react"
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts"

import { Card, CardContent } from "@/components/ui/card"
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"

export const description = "Daily Defect Analytics"

// Updated to match the "count" concept rather than desktop/mobile
const chartConfig = {
  defects: {
    label: "Total Defects",
    color: "var(--chart-1)", // Make sure this CSS variable exists in your global stylesheet
  },
} satisfies ChartConfig

// Define the shape of the data returned by your API
type DefectData = {
  date: string | Date | null
  count: number
}

export function ChartBarInteractive({
  data,
  isLoading,
}: {
  data?: DefectData[]
  isLoading?: boolean
}) {
  return (
    <Card className="col-span-3 max-h-80 px-2 sm:p-6">
      <CardContent>
        {isLoading ? (
          <div className="flex h-[300px] items-center justify-center gap-2 text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span>Loading defect analytics...</span>
          </div>
        ) : !data || data.length === 0 ? (
          <div className="flex h-[300px] items-center justify-center text-destructive">
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
                    className="w-[150px]"
                    nameKey="defects"
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
              {/* Maps to the "count" returned by the API */}
              <Bar
                dataKey="count"
                fill="var(--color-defects)"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  )
}
