"use client"

import {
  AllCommunityModule,
  type ColDef,
  CsvExportModule,
  type GridApi,
  type GridReadyEvent,
  ModuleRegistry,
} from "ag-grid-community"
import { AgGridReact } from "ag-grid-react"
import {
  AlertCircle,
  BarChart3,
  ChevronDownIcon,
  ChevronRightIcon,
  FileSpreadsheet,
  Search,
  TableIcon,
} from "lucide-react"
import { useQueryState } from "nuqs"
import { Suspense, useCallback, useMemo, useState } from "react"

import { Total_OK_NOK_Chart } from "@/app/charts/inspections/Gate-Analytics-Chart"
import { fromParam, gateParam, toParam } from "@/app/charts/inspections/params"
import { ChartBarInteractive } from "@/app/charts/inspections/Inspection-Analatics"
import { Total_inspections_per_project_Chart } from "@/app/charts/inspections/Project-Analytics-Chart"
import { SummaryCards } from "@/app/charts/inspections/SummaryCard"
import { Total_Defects_Per_Type_Chart } from "@/app/charts/inspections/Total_Defects_Per_Type_Chart"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useTableTheme } from "@/hooks/use-tableTheme"
import { trpc } from "@/lib/trpc/client"
import type { InspectionResult } from "@/server/reports/inspection-results"

import {
  DateCellRenderer,
  PanelCellRender,
  StatusCellRenderer,
} from "../CellsRender"

ModuleRegistry.registerModules([AllCommunityModule, CsvExportModule])

const GATE_OPTIONS = [
  { value: "0", label: "All" },
  { value: "1", label: "Mold" },
  { value: "2", label: "Gelcoating" },
  { value: "10", label: "Demolding" },
  { value: "3", label: "Trimming" },
  { value: "11", label: "Drilling" },
  { value: "12", label: "Bonding" },
  { value: "5", label: "Painting" },
  { value: "6", label: "Final" },
]

type ViewMode = "table" | "analytics"

export default function ReportPage() {
  const theme = useTableTheme()

  // Shared state via nuqs — works for both table query and chart components
  const [appliedFrom, setAppliedFrom] = useQueryState<Date>(
    "from",
    fromParam
  )
  const [appliedTo, setAppliedTo] = useQueryState<Date>("to", toParam)
  const [gate, setGate] = useQueryState("gate", gateParam)

  // View toggle
  const [activeView, setActiveView] = useState<ViewMode>("table")

  // Grid state
  const [gridApi, setGridApi] = useState<GridApi<InspectionResult> | null>(
    null
  )

  const isRangeSelected = !!appliedFrom && !!appliedTo

  // Table query — only fetches when table view is active and dates are set
  const {
    data: tableData,
    isFetching,
    isError,
    error,
    refetch,
  } = trpc.inspections.getResults.useQuery(
    {
      from: appliedFrom ?? undefined,
      to: appliedTo ?? undefined,
      gate: gate ? Number(gate) : undefined,
    },
    {
      enabled: isRangeSelected && activeView === "table",
    }
  )

  // Metrics from table data
  const metrics = useMemo(() => {
    const data = tableData || []
    const total = data.length
    const defects = data.filter((r) => !r.inspection_result).length
    const percentage = total > 0 ? (defects / total) * 100 : 0
    return { total, percentage }
  }, [tableData])

  // Column definitions
  const columnDefs = useMemo<ColDef<InspectionResult>[]>(() => {
    const cols: ColDef<InspectionResult>[] = [
      {
        field: "inspection_result",
        headerName: "Result",
        maxWidth: 80,
        cellRenderer: (params: any) => (
          <StatusCellRenderer
            value={params.value}
            whenFalse="NOK"
            whenTrue="OK"
          />
        ),
      },
      {
        flex: 1,
        field: "panel_serial",
        headerName: "Panel ID",
        cellRenderer: PanelCellRender,
        minWidth: 280,
      },
      { field: "epicor_asm_part_no", headerName: "ASM Part No" },
      {
        field: "image",
        headerName: "Defect Image",
        width: 135,
        cellRenderer: (params: any) => {
          const value = params.value
          return (
            <Dialog>
              <DialogTrigger asChild>
                <Button
                  variant="link"
                  className="p-0 h-auto"
                  disabled={!value}
                >
                  {!value ? (
                    "-"
                  ) : (
                    <span className="flex flex-row justify-center items-center">
                      View Image{" "}
                      <ChevronRightIcon className="ml-2 size-4" />
                    </span>
                  )}
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-3xl">
                <DialogHeader>
                  <DialogTitle>Image Preview</DialogTitle>
                </DialogHeader>
                <div className="flex justify-center">
                  {value && (
                    <img
                      src={value.replace("http:/", "http://")}
                      alt="Preview"
                      className="max-h-[70vh] rounded-md object-contain"
                    />
                  )}
                </div>
              </DialogContent>
            </Dialog>
          )
        },
      },
      ...(gate === "5"
        ? ([
            {
              field: "paint_batch_no",
              headerName: "Batch No",
              width: 120,
            },
            {
              field: "delta_e",
              headerName: "ΔE",
              width: 90,
              type: "numericColumn",
            },
            {
              field: "gloss",
              headerName: "Gloss",
              width: 90,
              type: "numericColumn",
            },
            {
              headerName: "Values",
              children: [
                { field: "l_value", headerName: "L", width: 80 },
                { field: "a_value", headerName: "a", width: 80 },
                { field: "b_value", headerName: "b", width: 80 },
              ],
            },
            {
              headerName: "Deltas",
              children: [
                { field: "delta_l", headerName: "ΔL", width: 80 },
                { field: "delta_a", headerName: "Δa", width: 80 },
                { field: "delta_b", headerName: "Δb", width: 80 },
              ],
            },
          ] as ColDef<InspectionResult>[])
        : []),
      { field: "project", flex: 1, minWidth: 250 },
      { field: "gate", width: 120 },
      {
        field: "datetime",
        headerName: "Date & Time",
        cellRenderer: DateCellRenderer,
      },
      { field: "factory", width: 100 },
      { field: "defect_type", width: 100 },
    ]
    return cols
  }, [gate])

  const defaultColDef = useMemo<ColDef>(
    () => ({
      width: 180,
      suppressSizeToFit: true,
      resizable: false,
      suppressMovable: true,
      sortable: true,
      filter: true,
      floatingFilter: true,
    }),
    []
  )

  const onGridReady = (params: GridReadyEvent<InspectionResult>) =>
    setGridApi(params.api)

  const exportRows = useCallback(() => {
    gridApi?.exportDataAsCsv({
      fileName: `inspection-report-${new Date().toISOString().split("T")[0]}.csv`,
    })
  }, [gridApi])

  if (isError) {
    return (
      <div className="p-10 text-center">
        <p className="text-destructive mb-4">
          {error?.message || "Failed to load data"}
        </p>
        <Button onClick={() => refetch()}>Retry</Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-background">
      {/* Controls */}
      <div className="p-4 border-b space-y-4 bg-card">
        <div className="flex flex-wrap items-center gap-3">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-50 justify-between">
                {appliedFrom
                  ? appliedFrom.toLocaleDateString()
                  : "From Date"}
                <ChevronDownIcon className="ml-2 size-4 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={appliedFrom ?? undefined}
                onSelect={(d) => setAppliedFrom(d ?? null)}
                disabled={(d) => d > new Date()}
                initialFocus
              />
            </PopoverContent>
          </Popover>

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-50 justify-between">
                {appliedTo
                  ? appliedTo.toLocaleDateString()
                  : "To Date"}
                <ChevronDownIcon className="ml-2 size-4 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={appliedTo ?? undefined}
                onSelect={(d) => setAppliedTo(d ?? null)}
                disabled={(d) =>
                  d > new Date() ||
                  (appliedFrom ? d < appliedFrom : false)
                }
                initialFocus
              />
            </PopoverContent>
          </Popover>

          <Button
            onClick={() => refetch()}
            disabled={isFetching || !isRangeSelected}
          >
            <Search className="mr-2 size-4" />
            {isFetching ? "Searching..." : "Search"}
          </Button>

          <Button
            variant="outline"
            onClick={exportRows}
            disabled={
              activeView !== "table" ||
              !tableData ||
              tableData.length === 0
            }
          >
            <FileSpreadsheet className="mr-2 size-4" />
            Export CSV
          </Button>

          <div className="ml-auto flex gap-4">
            <MetricCard
              label="Defect Rate"
              value={`${metrics.percentage.toFixed(2)}%`}
              destructive={metrics.percentage > 5}
            />
            <MetricCard
              label="Total Inspected"
              value={metrics.total.toLocaleString()}
            />
          </div>
        </div>

        {/* Gate filter tabs */}
        <Tabs value={gate} onValueChange={setGate} className="w-full">
          <TabsList className="w-full bg-muted/50">
            {GATE_OPTIONS.map((opt) => (
              <TabsTrigger
                key={opt.value}
                value={opt.value}
                className="flex-1"
              >
                {opt.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      {/* View switcher tabs */}
      <div className="px-4 pt-2 bg-card border-b">
        <Tabs
          value={activeView}
          onValueChange={(v) => setActiveView(v as ViewMode)}
        >
          <TabsList className="h-8">
            <TabsTrigger value="table" className="gap-1.5 text-xs px-3 h-6">
              <TableIcon className="size-3" />
              Table
            </TabsTrigger>
            <TabsTrigger value="analytics" className="gap-1.5 text-xs px-3 h-6">
              <BarChart3 className="size-3" />
              Analytics
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        {!isRangeSelected ? (
          <EmptyState />
        ) : activeView === "table" ? (
          <div className="h-full relative">
            <div className="absolute inset-0">
              <AgGridReact
                rowData={tableData}
                columnDefs={columnDefs}
                onGridReady={onGridReady}
                theme={theme}
                loading={isFetching}
                defaultColDef={defaultColDef}
              />
            </div>
          </div>
        ) : (
          <Suspense>
            <div className="p-4 space-y-4">
              <SummaryCards />
              <ChartBarInteractive />
              <div className="grid grid-cols-1 xl:grid-cols-3 w-full gap-4">
                <Total_OK_NOK_Chart />
                <Total_inspections_per_project_Chart />
                <Total_Defects_Per_Type_Chart />
              </div>
            </div>
          </Suspense>
        )}
      </div>
    </div>
  )
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-muted-foreground border-2 border-dashed rounded-xl m-4 p-12">
      <AlertCircle className="size-8 mb-4 opacity-50" />
      <h3 className="text-lg font-medium">No Date Range Selected</h3>
      <p className="text-sm">
        Please select a &quot;From&quot; and &quot;To&quot; date to view
        data.
      </p>
    </div>
  )
}

function MetricCard({
  label,
  value,
  destructive,
}: {
  label: string
  value: string
  destructive?: boolean
}) {
  return (
    <div className="px-4 py-2 bg-background border rounded-xl shadow-sm flex flex-col justify-center min-w-30">
      <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
        {label}
      </span>
      <span
        className={`text-xl font-bold ${destructive ? "text-destructive" : "text-foreground"}`}
      >
        {value}
      </span>
    </div>
  )
}
