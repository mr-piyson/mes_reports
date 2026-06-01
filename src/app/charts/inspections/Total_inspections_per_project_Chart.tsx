"use client"

import { Loader2 } from "lucide-react"
import { Bar, BarChart, CartesianGrid, LabelList, XAxis, YAxis } from "recharts"

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

interface TotalDefectsChartProps extends React.ComponentProps<typeof Card> {}

const chartConfig = {
  defect_count: {
    label: "Defects",
    color: "var(--chart-2)",
  },
  label: {
    color: "var(--background)",
  },
} satisfies ChartConfig

export function Total_inspections_per_project_Chart({
  data,
  isLoading,
}: {
  data: any
  isLoading: boolean
}) {
  console.log(data)
  return (
    <Card className="flex-1">
      <CardHeader>
        <CardTitle>Total Defects Per Type</CardTitle>
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
                dataKey="project"
                type="category"
                tickLine={false}
                tickMargin={10}
                axisLine={false}
                hide // Keeps layout neat using internal labels instead
              />
              <XAxis dataKey="count" type="number" />
              <ChartTooltip
                cursor={false}
                content={
                  <ChartTooltipContent indicator="line" nameKey="count" />
                }
              />
              <Bar dataKey="count" fill="var(--chart-2)" radius={4}>
                {/* Inside Label: Displays the name of the defect */}
                <LabelList
                  dataKey="project"
                  position="insideLeft"
                  offset={8}
                  className="fill-(--color-label) font-medium"
                  fontSize={12}
                />
                {/* Outside Label: Displays the raw count value on the far right */}
                <LabelList
                  dataKey="count"
                  position="right"
                  offset={8}
                  className="fill-foreground font-semibold"
                  fontSize={12}
                />
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
