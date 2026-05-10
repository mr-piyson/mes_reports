"use client"
import { useState } from "react"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { trpc } from "@/lib/trpc/client"

export default function ScanPanelPage() {
  const [code, setCode] = useState("")
  const { data, isLoading } = trpc.quality.getPaintInspectionData.useQuery(
    { panelSerial: code },
    { enabled: code.length > 3 }
  )

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8">
      {/* Search / Scan Header */}
      <div className="flex flex-col gap-2">
        <label className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
          Scan Panel Serial
        </label>
        <Input
          autoFocus
          placeholder="Scan QR or Enter Code..."
          className="text-2xl h-14 font-mono"
          onChange={(e) => setCode(e.target.value)}
        />
      </div>

      {data && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Section 1 & 2: Paint Batch & Gloss */}
          <Card className="md:col-span-1">
            <CardHeader>
              <CardTitle className="text-sm">Paint Parameters</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-xs text-muted-foreground">
                  Paint Batch Number
                </p>
                <p className="text-xl font-bold">
                  {data.paint.gelcoat_batch_no || "N/A"}
                </p>
              </div>
              <Separator />
              <div>
                <p className="text-xs text-muted-foreground">Gloss Level</p>
                <p className="text-xl font-bold">
                  {data.paint.gloss_level || "0"} GU
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Section 3: Colorimetric (L, ΔL, etc.) */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="text-sm">Colorimetric Values</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-4 gap-4">
              <MetricBox label="L*" value={data.paint.l_val} />
              <MetricBox label="Δ L*" value={data.paint.dl_val} isDelta />
              <MetricBox label="Δ a*" value={data.paint.da_val} isDelta />
              <MetricBox label="Δ b*" value={data.paint.db_val} isDelta />
              <MetricBox
                label="Δ E*"
                value={data.paint.de_val}
                isDelta
                highlight
              />
            </CardContent>
          </Card>

          {/* Section 4: Checklist */}
          <Card className="md:col-span-1">
            <CardHeader>
              <CardTitle className="text-sm">Checklist History</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {data.checklist.map((item: any) => (
                <div
                  key={item.checkpoint_id}
                  className="flex justify-between items-center text-sm border-b pb-1"
                >
                  <span className="truncate mr-2">{item.checkpoint_name}</span>
                  <Badge
                    variant={item.result === "Yes" ? "default" : "secondary"}
                  >
                    {item.result}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Section 5: Defects */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="text-sm text-destructive">
                Recorded Defects
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Worker</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.defects.map((d: any, i: number) => (
                    <TableRow key={i}>
                      <TableCell className="font-medium">
                        {d.defect_type}
                      </TableCell>
                      <TableCell>{d.defect_location}</TableCell>
                      <TableCell>{d.cause_worker_id}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}

function MetricBox({ label, value, isDelta, highlight }: any) {
  return (
    <div
      className={`p-3 rounded-lg border ${highlight ? "bg-primary/5 border-primary" : "bg-muted/30"}`}
    >
      <span className="text-[10px] uppercase font-bold block opacity-60">
        {label}
      </span>
      <span
        className={`text-lg font-mono font-bold ${isDelta && value > 0 ? "text-blue-600" : ""}`}
      >
        {value || "-"}
      </span>
    </div>
  )
}
