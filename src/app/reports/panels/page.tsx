"use client"

import type {
  ColDef,
  GridApi,
  GridOptions,
  GridReadyEvent,
} from "ag-grid-community"
import {
  AllCommunityModule,
  CsvExportModule,
  ModuleRegistry,
} from "ag-grid-community"
import { AgGridReact } from "ag-grid-react"
import { SearchIcon } from "lucide-react"
import { useCallback, useMemo, useState } from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { useTableTheme } from "@/hooks/use-tableTheme"
import { trpc } from "@/lib/trpc/client"
import { PanelsReportData } from "@/server/reports/panel"

import {
  BoxCellRenderer,
  ContainerCellRenderer,
  DateCellRenderer,
  JobCellRenderer,
  PanelCellRender,
  StatusCellRenderer,
} from "../CellsRender"

ModuleRegistry.registerModules([AllCommunityModule, CsvExportModule])

// --- Main Component ---
export default function ReportPage() {
  const [gridApi, setGridApi] = useState<GridApi | null>(null)
  const [selectedRows, setSelectedRows] = useState<PanelsReportData[]>([])
  const [filter, setFilter] = useState("today") // Default to today instead of empty string
  const theme = useTableTheme()

  const {
    data: tableData = [],
    isLoading,
    error,
    refetch,
  } = trpc.panels.getPanels.useQuery({ filter })

  // Derived unique projects for the dropdown
  const projects = useMemo(() => {
    if (!tableData) return []
    const projectSet = new Set(
      tableData.map((row: any) => row.project).filter(Boolean)
    )
    return Array.from(projectSet).sort()
  }, [tableData])

  const gridOptions = useMemo<GridOptions>(() => {
    return {
      suppressMovableColumns: true,
      defaultColDef: {
        suppressMovable: true,
      },
    }
  }, [])

  // Memoized column definitions
  const columnDefs: ColDef[] = useMemo(
    () => [
      {
        headerName: "Panel ID",
        field: "panel_id",
        editable: true,
        pinned: "left",
        width: 250,
        cellRenderer: PanelCellRender,
      },
      {
        headerName: "Description",
        field: "description",
        editable: true,
      },
      {
        headerName: "ASM Part No",
        field: "epicor_asm_part_no",
        editable: true,
      },
      { headerName: "Project Name", field: "project", editable: true },
      {
        headerName: "Job ID",
        field: "job_id",
        editable: true,
        cellRenderer: JobCellRenderer,
      },
      {
        headerName: "Created At",
        field: "created_at",
        width: 130,
        filter: "agDateColumnFilter",
        cellRenderer: DateCellRenderer,
      },
      {
        headerName: "QC Passed At",
        field: "qc_datetime",
        width: 130,
        filter: "agDateColumnFilter",
        cellRenderer: DateCellRenderer,
      },
      {
        headerName: "Final",
        field: "final",
        width: 100,
        cellRenderer: StatusCellRenderer,
      },
      {
        headerName: "Wrapped",
        field: "wrapped",
        width: 100,
        cellRenderer: StatusCellRenderer,
      },
      {
        headerName: "Box Code",
        field: "package",
        editable: true,
        cellRenderer: BoxCellRenderer,
      },
      {
        headerName: "Container Code",
        field: "container",
        editable: true,
        cellRenderer: ContainerCellRenderer,
      },
    ],
    []
  )

  // Memoized default column properties
  const defaultColDef = useMemo<ColDef>(
    () => ({
      resizable: true,
      sortable: true,
      filter: true,
      floatingFilter: true,
      suppressMovable: true, // Grid level prop moved to defaultColDef
    }),
    []
  )

  // Callbacks
  const onGridReady = useCallback((params: GridReadyEvent) => {
    setGridApi(params.api)
  }, [])

  const onRowSelectionChanged = useCallback(() => {
    if (gridApi) {
      setSelectedRows(gridApi.getSelectedRows())
    }
  }, [gridApi])

  const refreshData = useCallback(() => {
    if (gridApi) {
      gridApi.setFilterModel(null)
      gridApi.resetColumnState()
      gridApi.deselectAll()
    }
    refetch()
  }, [gridApi, refetch])

  const handleProjectFilter = useCallback(
    (value: string) => {
      if (!gridApi) return
      if (value === "No filter") {
        gridApi.destroyFilter("project")
      } else {
        gridApi
          .setColumnFilterModel("project", {
            type: "equals",
            filter: value,
          })
          .then(() => gridApi.onFilterChanged())
      }
    },
    [gridApi]
  )

  const exportRows = useCallback(() => {
    if (gridApi) {
      gridApi.exportDataAsCsv({
        onlySelected: selectedRows.length > 0, // Export only selected if there are any
        fileName: `filtered-report-${new Date().toISOString().split("T")[0]}.csv`,
      })
    }
  }, [gridApi, selectedRows])

  // Error state
  if (error) {
    return (
      <Card className="h-full">
        <CardContent className="p-6 flex items-center justify-center h-full">
          <div className="text-center text-red-600">
            <h2 className="text-lg font-semibold mb-2">Error Loading Data</h2>
            <p className="mb-4">{error.message || "An error occurred"}</p>
            <Button onClick={() => refetch()}>Try Again</Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="h-full p-0 flex flex-col gap-0 border-none shadow-none">
      <CardContent className="w-full flex flex-row items-center justify-between p-3 space-x-3 shrink-0">
        {/* Left Controls */}
        <div className="flex flex-1 flex-row gap-4 items-center">
          <Button disabled={isLoading || !gridApi} variant="outline">
            <SearchIcon className="w-4 h-4 mr-2" />
            <span className="max-sm:hidden">Search</span>
          </Button>

          <Button
            variant="outline"
            onClick={exportRows}
            disabled={isLoading || !gridApi}
          >
            <i className="icon-[vscode-icons--file-type-excel] size-4 mr-2" />
            <span className="max-sm:hidden">
              Export {selectedRows.length > 0 && `(${selectedRows.length})`}
            </span>
          </Button>

          <Button
            className="flex items-center gap-2"
            variant="outline"
            onClick={refreshData}
            disabled={isLoading}
          >
            <i className="icon-[tdesign--refresh] size-4 mr-1" />
            <span className="max-sm:hidden">Refresh</span>
          </Button>

          <Select onValueChange={handleProjectFilter}>
            <SelectTrigger
              disabled={projects.length === 0 || isLoading}
              className="w-48 border-border"
            >
              <SelectValue placeholder="Filter Project" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="No filter">All Projects</SelectItem>
              <Separator className="my-2" />
              {projects.map((project) => (
                <SelectItem key={project as string} value={project as string}>
                  {project as string}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Right Controls */}
        <div className="flex flex-row justify-end">
          <Select value={filter} onValueChange={(value) => setFilter(value)}>
            <SelectTrigger className="w-40 border-border">
              <SelectValue placeholder="Filter by date" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="last7days">Last 7 Days</SelectItem>
              <SelectItem value="last30days">Last 30 Days</SelectItem>
              <SelectItem value="last90days">Last 90 Days</SelectItem>
              <SelectItem value="1year">Last Year</SelectItem>
              <SelectItem value="2years">Last 2 Years</SelectItem>
              <SelectItem value="3years">Last 3 Years</SelectItem>
              <SelectItem value="5years">Last 5 Years</SelectItem>
              <SelectItem value="all">All Times</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent>

      <CardContent className="p-0 flex-1 min-h-0">
        <div className="h-full w-full">
          <AgGridReact
            rowData={tableData}
            columnDefs={columnDefs}
            defaultColDef={defaultColDef}
            onGridReady={onGridReady}
            onSelectionChanged={onRowSelectionChanged}
            rowSelection={{
              mode: "multiRow",
            }}
            animateRows={true}
            theme={theme}
            loading={isLoading}
            suppressMenuHide={true}
            gridOptions={gridOptions}
          />
        </div>
      </CardContent>

      <CardFooter className="shrink-0 py-3 border-t">
        <div className="text-sm text-muted-foreground flex items-center gap-2">
          <span>Total Panels: {tableData?.length || 0}</span>
          {selectedRows.length > 0 && (
            <span className="pl-4 ml-2 border-l-2 border-border">
              Selected: {selectedRows.length}
            </span>
          )}
        </div>
      </CardFooter>
    </Card>
  )
}
