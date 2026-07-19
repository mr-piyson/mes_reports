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
  Download,
  FileSpreadsheet,
  Search,
  TableIcon,
} from "lucide-react"
import { parseAsString, useQueryState } from "nuqs"
import { Suspense, useCallback, useMemo, useState } from "react"

import { Total_OK_NOK_Chart } from "@/app/charts/inspections/Gate-Analytics-Chart"
import { ChartBarInteractive } from "@/app/charts/inspections/Inspection-Analatics"
import { Total_inspections_per_project_Chart } from "@/app/charts/inspections/Project-Analytics-Chart"
import { SummaryCards } from "@/app/charts/inspections/SummaryCard"
import { Total_Defects_Per_Type_Chart } from "@/app/charts/inspections/Total_Defects_Per_Type_Chart"
import { fromParam, gateParam, toParam } from "@/app/charts/inspections/params"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { buildAnalyticsCsv, downloadCsv } from "@/lib/csv-export"
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

const viewParam = parseAsString.withDefault("table")

type ViewMode = "table" | "analytics"

export default function ReportPage() {
  const theme = useTableTheme()

  const [appliedFrom, setAppliedFrom] = useQueryState<Date>("from", fromParam)
  const [appliedTo, setAppliedTo] = useQueryState<Date>("to", toParam)
  const [gate, setGate] = useQueryState("gate", gateParam)

  const [activeView, setActiveView] = useQueryState("view", viewParam)

  const [gridApi, setGridApi] = useState<GridApi<InspectionResult> | null>(null)

  const isRangeSelected = !!appliedFrom && !!appliedTo
  const gateNum = gate ? Number(gate) : 0

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
      gate: gateNum || undefined,
    },
    {
      enabled: isRangeSelected && activeView === "table",
    }
  )

  const { data: statsData } = trpc.charts.get_all_stats.useQuery(
    { from: appliedFrom, to: appliedTo, gate: gateNum },
    { enabled: isRangeSelected && activeView === "analytics" }
  )

  const { data: defectsPerDayData } =
    trpc.charts.get_total_defects_per_day.useQuery(
      { from: appliedFrom, to: appliedTo, gate: gateNum },
      { enabled: isRangeSelected && activeView === "analytics" }
    )

  const { data: okNokData } = trpc.charts.get_totals_defects.useQuery(
    { from: appliedFrom, to: appliedTo, gate: gateNum },
    { enabled: isRangeSelected && activeView === "analytics" }
  )

  const { data: projectData } = trpc.charts.get_totals_defects.useQuery(
    {
      from: appliedFrom,
      to: appliedTo,
      groupBy: "project",
      limit: 6,
      gate: gateNum,
    },
    { enabled: isRangeSelected && activeView === "analytics" }
  )

  const { data: projectDataFull } = trpc.charts.get_totals_defects.useQuery(
    {
      from: appliedFrom,
      to: appliedTo,
      groupBy: "project",
      gate: gateNum,
    },
    { enabled: isRangeSelected && activeView === "analytics" }
  )

  type GateRow = {
    gate_name: string
    OK: number
    NOK: number
    total: number
    defect_rate: number
  }
  type ProjectRow = {
    project: string
    defect_count: number
    total_panels_inspected: number
  }
  const okNokCasted = (okNokData ?? []) as GateRow[]
  const projectCasted = (projectData ?? []) as ProjectRow[]
  const projectFullCasted = (projectDataFull ?? []) as ProjectRow[]

  const { data: defectTypeData } =
    trpc.charts.get_defect_counts_by_type.useQuery(
      { from: appliedFrom, to: appliedTo, limit: 6, gate: gateNum },
      { enabled: isRangeSelected && activeView === "analytics" }
    )

  const { data: defectTypeDataFull } =
    trpc.charts.get_defect_counts_by_type.useQuery(
      { from: appliedFrom, to: appliedTo, gate: gateNum },
      { enabled: isRangeSelected && activeView === "analytics" }
    )

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
                <Button variant="link" className="p-0 h-auto" disabled={!value}>
                  {!value ? (
                    "-"
                  ) : (
                    <span className="flex flex-row justify-center items-center">
                      View Image <ChevronRightIcon className="ml-2 size-4" />
                    </span>
                  )}
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-3xl">
                <DialogHeader>
                  <DialogTitle>Image Preview</DialogTitle>
                  <DialogDescription>
                    Preview of the defect image
                  </DialogDescription>
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

  const hasAnalyticsData =
    statsData && defectsPerDayData && okNokData && projectData && defectTypeData && projectDataFull && defectTypeDataFull

  const exportAnalytics = useCallback(() => {
    if (!hasAnalyticsData) return
    const csv = buildAnalyticsCsv({
      stats: statsData,
      defectsPerDay: defectsPerDayData,
      okNokByGate: okNokCasted,
      inspectionsPerProject: projectCasted,
      defectsPerType: defectTypeData,
    })
    downloadCsv(
      csv,
      `inspection-analytics-${new Date().toISOString().split("T")[0]}.csv`
    )
  }, [statsData, defectsPerDayData, okNokCasted, projectCasted, defectTypeData])

  const downloadDailyCsv = useCallback(() => {
    if (!defectsPerDayData || defectsPerDayData.length === 0) return
    const header = "Date,Count"
    const rows = defectsPerDayData.map(
      (r: { date: string | Date | null; count: number }) =>
        `${r.date ?? ""},${r.count}`
    )
    downloadCsv(
      [header, ...rows].join("\n"),
      `daily-defects-${new Date().toISOString().split("T")[0]}.csv`
    )
  }, [defectsPerDayData])

  const downloadGatesCsv = useCallback(() => {
    if (!okNokCasted || okNokCasted.length === 0) return
    const header = "Gate,OK,NOK,Total,Defect Rate"
    const rows = okNokCasted.map(
      (r: GateRow) =>
        `${r.gate_name},${r.OK},${r.NOK},${r.total},${r.defect_rate}`
    )
    downloadCsv(
      [header, ...rows].join("\n"),
      `gates-analytics-${new Date().toISOString().split("T")[0]}.csv`
    )
  }, [okNokCasted])

  const downloadProjectsCsv = useCallback(() => {
    if (!projectFullCasted || projectFullCasted.length === 0) return
    const header = "Project,Defect Count,Total Panels Inspected"
    const rows = projectFullCasted.map(
      (r: ProjectRow) =>
        `${r.project},${r.defect_count},${r.total_panels_inspected}`
    )
    downloadCsv(
      [header, ...rows].join("\n"),
      `project-analytics-${new Date().toISOString().split("T")[0]}.csv`
    )
  }, [projectFullCasted])

  const downloadDefectTypesCsv = useCallback(() => {
    if (!defectTypeDataFull || defectTypeDataFull.length === 0) return
    const header = "Defect Type,Defect Count"
    const rows = (defectTypeDataFull as { defect_type: string; defect_count: number }[]).map(
      (r) => `${r.defect_type},${r.defect_count}`
    )
    downloadCsv(
      [header, ...rows].join("\n"),
      `defect-type-analytics-${new Date().toISOString().split("T")[0]}.csv`
    )
  }, [defectTypeDataFull])

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
      <div className="p-3 border-b bg-card space-y-3 shrink-0">
        <div className="flex flex-wrap items-center gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                suppressHydrationWarning
                className="h-8 w-[130px] justify-between text-xs"
              >
                {appliedFrom ? appliedFrom.toLocaleDateString() : "From"}
                <ChevronDownIcon className="size-3 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={appliedFrom ?? undefined}
                onSelect={(d) => setAppliedFrom(d ?? null)}
                disabled={(d) => d > new Date()}
                captionLayout="dropdown"
              />
            </PopoverContent>
          </Popover>

          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                suppressHydrationWarning
                className="h-8 w-[130px] justify-between text-xs"
              >
                {appliedTo ? appliedTo.toLocaleDateString() : "To"}
                <ChevronDownIcon className="size-3 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={appliedTo ?? undefined}
                onSelect={(d) => setAppliedTo(d ?? null)}
                disabled={(d) =>
                  d > new Date() || (appliedFrom ? d < appliedFrom : false)
                }
                captionLayout="dropdown"
              />
            </PopoverContent>
          </Popover>

          <Button
            size="sm"
            className="h-8 text-xs"
            onClick={() => refetch()}
            disabled={isFetching || !isRangeSelected}
          >
            <Search className="mr-1 size-3" />
            {isFetching ? "..." : "Search"}
          </Button>

          <Button
            variant="outline"
            size="sm"
            className="h-8 text-xs"
            onClick={activeView === "table" ? exportRows : exportAnalytics}
            disabled={
              activeView === "table"
                ? !tableData || tableData.length === 0
                : !hasAnalyticsData
            }
          >
            <FileSpreadsheet className="mr-1 size-3" />
            CSV
          </Button>

          <div className="ml-auto">
            <Tabs
              value={activeView}
              onValueChange={(v) => setActiveView(v as ViewMode)}
            >
              <TabsList className="h-8">
                <TabsTrigger value="table" className="gap-1 text-xs px-2 h-6">
                  <TableIcon className="size-3" />
                  Table
                </TabsTrigger>
                <TabsTrigger
                  value="analytics"
                  className="gap-1 text-xs px-2 h-6"
                >
                  <BarChart3 className="size-3" />
                  Analytics
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>

        <Tabs value={gate} onValueChange={setGate}>
          <TabsList className="w-full h-full overflow-x-auto overflow-y-hidden">
            {GATE_OPTIONS.map((opt) => (
              <TabsTrigger
                key={opt.value}
                value={opt.value}
                className="flex-1 text-xs min-w-[75px]"
              >
                {opt.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      <div className="flex-1 min-h-0">
        {!isRangeSelected ? (
          <EmptyState />
        ) : activeView === "table" ? (
          <div className="h-full flex flex-col">
            <AgGridReact
              rowData={tableData}
              columnDefs={columnDefs}
              onGridReady={onGridReady}
              theme={theme}
              loading={isFetching}
              defaultColDef={defaultColDef}
            />
            <div className="text-xs text-muted-foreground px-4 py-2 border-t bg-muted/30 shrink-0">
              Total Inspections: {tableData?.length ?? 0}
            </div>
          </div>
        ) : (
          <Suspense>
            <div className="p-4 space-y-4 overflow-auto h-full">
              <SummaryCards />
              <div className="relative group">
                <ChartBarInteractive />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={downloadDailyCsv}
                  disabled={!defectsPerDayData || defectsPerDayData.length === 0}
                  className="absolute top-3 right-3 z-10 h-7 text-xs"
                >
                  <Download className="mr-1 size-3" />
                  Export
                </Button>
              </div>
              <div className="grid grid-cols-1 xl:grid-cols-3 w-full gap-4">
                <div className="relative group">
                  <Total_OK_NOK_Chart />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={downloadGatesCsv}
                    disabled={!okNokCasted || okNokCasted.length === 0}
                    className="absolute top-3 right-3 z-10 h-7 text-xs"
                  >
                    <Download className="mr-1 size-3" />
                    Export
                  </Button>
                </div>
                <div className="relative group">
                  <Total_inspections_per_project_Chart />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={downloadProjectsCsv}
                    disabled={!projectFullCasted || projectFullCasted.length === 0}
                    className="absolute top-3 right-3 z-10 h-7 text-xs"
                  >
                    <Download className="mr-1 size-3" />
                    Export
                  </Button>
                </div>
                <div className="relative group">
                  <Total_Defects_Per_Type_Chart />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={downloadDefectTypesCsv}
                    disabled={!defectTypeDataFull || defectTypeDataFull.length === 0}
                    className="absolute top-3 right-3 z-10 h-7 text-xs"
                  >
                    <Download className="mr-1 size-3" />
                    Export
                  </Button>
                </div>
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
    <div className="flex flex-col items-center justify-center h-full text-muted-foreground border-2 border-dashed rounded-xl m-4 p-8">
      <AlertCircle className="size-6 mb-3 opacity-50" />
      <h3 className="text-base font-medium">No Date Range Selected</h3>
      <p className="text-xs">
        Select &quot;From&quot; and &quot;To&quot; dates to view data.
      </p>
    </div>
  )
}
