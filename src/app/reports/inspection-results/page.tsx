"use client"

import {
  AllCommunityModule,
  type ColDef,
  CsvExportModule,
  type GridApi,
  GridOptions,
  type GridReadyEvent,
  ModuleRegistry,
} from "ag-grid-community"
import { AgGridReact } from "ag-grid-react"
import {
  ChevronDownIcon,
  ChevronRightIcon,
  FileSpreadsheet,
  Search,
} from "lucide-react"
import Image from "next/image"
import { useCallback, useMemo, useState } from "react"

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

export default function ReportPage() {
  const theme = useTableTheme()

  // Grid State
  const [gridApi, setGridApi] = useState<GridApi<InspectionResult> | null>(null)
  const [gate, setGate] = useState<string>("0")

  // Date State with proper types
  const [from, setFrom] = useState<Date | undefined>()
  const [to, setTo] = useState<Date | undefined>()

  // tRPC Query - Mapping input to ensure dates are valid before sending
  const {
    data: tableData,
    isFetching,
    isError,
    error,
    refetch,
  } = trpc.inspections.getResults.useQuery(
    {
      from: from,
      to: to,
      gate: gate ? Number(gate) : undefined,
    },
    {
      enabled: !!from && !!to,
    }
  )

  // Calculations based on fetched data
  const metrics = useMemo(() => {
    const data = tableData || []
    const total = data.length
    const defects = data.filter((r) => !r.inspection_result).length
    const percentage = total > 0 ? (defects / total) * 100 : 0
    return { total, percentage }
  }, [tableData])

  const defaultColDef = useMemo<ColDef>(
    () => ({
      // --- FIXED WIDTH & SCROLLING ---
      width: 180, // Default width for all columns
      suppressSizeToFit: true, // Crucial: Stops the grid from squishing columns to fit screen
      resizable: false, // Optional: Set to true if you want users to manual resize

      // --- DISABLE DRAGGING ---
      suppressMovable: true, // Prevents individual columns from being dragged

      // --- STANDARD FEATURES ---
      sortable: true,
      filter: true,
      floatingFilter: true,
      // flex: 1,              // NEVER include flex if you want horizontal scrolling
    }),
    []
  )

  // 2. The Column Definitions (Now much cleaner)
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

      // --- FIX 1: gate is a string ("5"), not a number (5) ---
      ...(gate === "5"
        ? ([
            { field: "paint_batch_no", headerName: "Batch No", width: 120 },
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
          ] as ColDef<InspectionResult>[]) // FIX 2: Cast to bypass strict NestedFieldPaths
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

  // Actions
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
      <div className="p-4 border-b space-y-4 bg-card">
        <div className="flex flex-wrap items-center gap-3">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-50 justify-between">
                {from ? from.toLocaleDateString() : "From Date"}
                <ChevronDownIcon className="ml-2 size-4 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={from}
                onSelect={setFrom}
                disabled={(d) => d > new Date()}
                initialFocus
              />
            </PopoverContent>
          </Popover>

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-50 justify-between">
                {to ? to.toLocaleDateString() : "To Date"}
                <ChevronDownIcon className="ml-2 size-4 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={to}
                onSelect={setTo}
                disabled={(d) => d > new Date() || (from ? d < from : false)}
                initialFocus
              />
            </PopoverContent>
          </Popover>

          <Button
            onClick={() => refetch()}
            disabled={isFetching || !from || !to}
          >
            <Search className="mr-2 size-4" />
            {isFetching ? "Searching..." : "Search"}
          </Button>

          <Button
            variant="outline"
            onClick={exportRows}
            disabled={!tableData || tableData.length === 0}
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

        <Tabs value={gate} onValueChange={setGate} className="w-full">
          <TabsList className="w-full bg-muted/50">
            {GATE_OPTIONS.map((opt) => (
              <TabsTrigger key={opt.value} value={opt.value} className="flex-1">
                {opt.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      <div className="flex-1 overflow-hidden relative">
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
