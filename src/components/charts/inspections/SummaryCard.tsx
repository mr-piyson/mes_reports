import { Loader2 } from "lucide-react"
import { useQueryState } from "nuqs"

import {
  fromParam,
  gateParam,
  toParam,
} from "@/components/charts/inspections/params"
import { Card, CardContent } from "@/components/ui/card"
import { trpc } from "@/lib/trpc/client"

export function SummaryCards() {
  const [appliedFrom, setAppliedFrom] = useQueryState("from", fromParam)
  const [appliedTo, setAppliedTo] = useQueryState("to", toParam)
  const [gate, setGate] = useQueryState("gate", gateParam)

  const { data: statsData, isLoading } = trpc.charts.get_all_stats.useQuery({
    from: appliedFrom,
    to: appliedTo,
    gate: Number(gate),
  })

  const dynamicSummary = [
    { label: "Total Inspections", value: statsData?.total_inspections ?? 0 },
    {
      label: "Total Panels Inspected",
      value: statsData?.total_panels_inspected ?? 0,
    },
    { label: "Defected Panels", value: statsData?.total_defect_panels ?? 0 },
    { label: "Total Number of Defects", value: statsData?.total_defects ?? 0 },
    {
      label: "Defect Rate",
      value: `${statsData?.defect_panel_percentage ?? 0}%`,
    },
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 shrink-0">
      {dynamicSummary.map((item) => (
        <Card key={item.label}>
          <CardContent className="flex flex-col items-center justify-center p-2 ">
            <div className="text-lg md:text-sm text-muted-foreground text-center">
              {item.label}
            </div>
            {isLoading ? (
              <div className="mt-2 flex items-center justify-center h-8">
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
  )
}
