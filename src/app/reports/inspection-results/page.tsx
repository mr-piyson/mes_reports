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
import { ChevronDownIcon, FileSpreadsheet, Search } from "lucide-react"
import { useCallback, useEffect, useMemo, useState } from "react"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useTableTheme } from "@/hooks/use-tableTheme"
import { trpc } from "@/lib/trpc/client"

import {
  DateCellRenderer,
  PanelCellRender,
  StatusCellRenderer,
} from "../CellsRender"

ModuleRegistry.registerModules([AllCommunityModule, CsvExportModule])

interface InspectionResult {
  panel_serial: string
  epicor_asm_part_no: string
  gate: string
  project: string
  datetime: string
  factory: string
  inspection_result: boolean
}

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
  const [gridApi, setGridApi] = useState<GridApi | null>(null)
  const [gate, setGate] = useState<string>("0")

  // Jotai Global State
  const [from, setFrom] = useState()
  const [to, setTo] = useState()
  const [inspections, setInspections] = useState()
  const [, setInitPanels] = useState()

  // tRPC Query
  const {
    data: tableData,
    isFetching,
    isError,
    error,
    refetch,
  } = trpc.inspections.getResults.useQuery(
    {
      from: from, // Fallback to avoid null in query if required
      to: to,
      gates: [Number(gate)],
    },
    {
      enabled: !!from && !!to, // Only fetch if dates are selected
    }
  )

  // Sync tRPC data to Jotai Store
  useEffect(() => {
    if (tableData) {
      setInspections(tableData)
      setInitPanels(tableData)
    }
  }, [tableData, setInspections, setInitPanels])

  // Calculations
  const metrics = useMemo(() => {
    const total = inspections?.length || 0
    const defects = inspections?.filter((r) => !r.inspection_result).length || 0
    const percentage = total > 0 ? (defects / total) * 100 : 0
    return { total, percentage }
  }, [inspections])

  // AG Grid Column Definitions
  const columnDefs = useMemo<ColDef<InspectionResult>[]>(
    () => [
      {
        headerName: "Panel ID",
        field: "panel_serial",
        cellRenderer: PanelCellRender,
        flex: 1.5,
      },
      { field: "epicor_asm_part_no", headerName: "ASM Part No" },
      { field: "gate" },
      { field: "project" },
      {
        field: "datetime",
        headerName: "Date & Time",
        cellRenderer: DateCellRenderer,
      },
      { field: "factory" },
      {
        headerName: "Result",
        field: "inspection_result",
        cellRenderer: (params: any) => (
          <StatusCellRenderer
            value={params.value}
            whenFalse="NOK"
            whenTrue="OK"
          />
        ),
      },
    ],
    []
  )

  const defaultColDef = useMemo(
    () => ({
      resizable: true,
      sortable: true,
      filter: true,
      floatingFilter: true,
      flex: 1,
    }),
    []
  )

  // Actions
  const onGridReady = (params: GridReadyEvent) => setGridApi(params.api)

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
      {/* Header / Toolbar */}
      <div className="p-4 border-b space-y-4 bg-card">
        <div className="flex flex-wrap items-center gap-3">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-50 justify-between">
                {from ? from.toLocaleDateString() : "From Date"}
                <ChevronDownIcon className="size-4 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={from}
                onSelect={setFrom}
                disabled={(d) => d > new Date()}
              />
            </PopoverContent>
          </Popover>

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-50 justify-between">
                {to ? to.toLocaleDateString() : "To Date"}
                <ChevronDownIcon className="size-4 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={to}
                onSelect={setTo}
                disabled={(d) => d > new Date() || (from ? d < from : false)}
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
            disabled={!inspections}
          >
            <FileSpreadsheet className="mr-2 size-4" />
            Export CSV
          </Button>

          {/* Metrics Section */}
          <div className="ml-auto flex gap-4">
            <MetricCard
              label="Defect Rate"
              value={`${metrics.percentage.toFixed(2)}%`}
              destructive={metrics.percentage > 5}
            />
            <MetricCard
              label="Total Inspected"
              value={metrics.total.toString()}
            />
          </div>
        </div>

        <Tabs value={gate} onValueChange={setGate} className="w-full">
          <TabsList className="w-full bg-muted/50">
            {GATE_OPTIONS.map((opt) => (
              <TabsTrigger key={opt.value} value={opt.value}>
                {opt.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      {/* Grid Area */}
      <div className="flex-1 overflow-hidden relative">
        <div className="absolute inset-0">
          <AgGridReact
            rowData={inspections}
            columnDefs={columnDefs}
            defaultColDef={defaultColDef}
            onGridReady={onGridReady}
            theme={theme}
            loading={isFetching}
            animateRows={false}
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
    <div className="px-4 py-2 bg-background border rounded-xl shadow-sm flex flex-col justify-center">
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
