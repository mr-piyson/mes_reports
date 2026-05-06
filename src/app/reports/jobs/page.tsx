"use client"
import type { ColDef, GridApi, GridReadyEvent } from "ag-grid-community"
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
import { useTableTheme } from "@/hooks/use-tableTheme"
import { trpc } from "@/lib/trpc/client"
import type { ApiJobsData } from "@/server/reports/jobs"

import {
  DateCellRenderer,
  JobCellRenderer,
  StatusCellRenderer,
} from "../CellsRender"

ModuleRegistry.registerModules([AllCommunityModule, CsvExportModule])

// Helper function to format date for API (YYYY-MM-DD)
function formatDateForAPI(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

export default function ReportPage() {
  const [gridApi, setGridApi] = useState<GridApi | null>(null)
  const [selectedRows, setSelectedRows] = useState<ApiJobsData[]>([])
  const [filter, setFilter] = useState("")
  const theme = useTableTheme()

  const {
    data: tableData = [],
    isFetching: isLoading,
    isError,
    error,
    refetch,
  } = trpc.jobs.getJobs.useQuery({
    filter: filter,
  })

  // Memoized column definitions
  const columnDefs: ColDef<ApiJobsData>[] = useMemo(
    () => [
      {
        headerName: "Job ID",
        field: "job_id",
        editable: true,
        sortable: true,
        filter: true,
        cellRenderer: JobCellRenderer,
      },
      {
        headerName: "Execution Date",
        field: "date",
        sortable: true,
        filter: "agDateColumnFilter",
        cellRenderer: DateCellRenderer,
      },
      {
        headerName: "Epicor ASM PART ID",
        field: "epicor_asm_part_no",
        sortable: true,
      },
      {
        headerName: "Project ID",
        field: "project_code",
        sortable: true,
      },
      {
        headerName: "Job's Total Panels",
        field: "total_panels",
        sortable: true,
      },
      {
        headerName: "is Inspected",
        field: "has_inspected_panel",
        sortable: true,
        cellRenderer: StatusCellRenderer,
      },
      {
        headerName: "is Printed",
        field: "has_printed_panel",
        sortable: true,
        cellRenderer: StatusCellRenderer,
      },
      {
        headerName: "Printed Panels",
        field: "printed_panels",
        sortable: true,
      },
      {
        headerName: "Inspected Panels",
        field: "inspected_panels",
        sortable: true,
      },
    ],
    []
  )

  // Memoized default column properties
  const defaultColDef = useMemo(
    () => ({
      resizable: true,
      sortable: true,
      filter: true,
      floatingFilter: true,
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

  const exportRows = useCallback(() => {
    if (gridApi) {
      gridApi.exportDataAsCsv({
        onlySelected: false,
        onlySelectedAllPages: false,
        allColumns: false,
        fileName: `filtered-report-${
          new Date().toISOString().split("T")[0]
        }.csv`,
      })
    }
  }, [gridApi])

  // Error state
  if (isError) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-destructive">
            <h2 className="text-lg font-semibold mb-2">Error Loading Data</h2>
            <p className="mb-4">
              {error instanceof Error ? error.message : "An error occurred"}
            </p>
            <Button onClick={() => refetch()}>Try Again</Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="h-full p-0 gap-0">
      <CardContent className="w-full flex flex-row items-center justify-between p-3 space-x-3">
        {/* Left Controls */}
        <div className="flex flex-1 flex-row gap-4">
          <Button
            variant="outline"
            onClick={exportRows}
            disabled={isLoading || !gridApi}
          >
            <i className="icon-[vscode-icons--file-type-excel] size-4" />
            <span className="max-sm:hidden">Export</span>
          </Button>
        </div>
        <div className="flex flex-row gap-3">
          <Select value={filter} onValueChange={(value) => setFilter(value)}>
            <SelectTrigger className="w-40 border-border">
              <SelectValue placeholder="Filter by date" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="future">Future</SelectItem>
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
          <Button onClick={() => refetch()}>
            <SearchIcon />
            Search
          </Button>
        </div>
      </CardContent>

      <CardContent className="p-0 h-full">
        <div className="ag-theme-alpine h-full w-full">
          <AgGridReact
            rowData={tableData}
            columnDefs={columnDefs}
            defaultColDef={defaultColDef}
            onGridReady={onGridReady}
            animateRows={true}
            suppressMenuHide={true}
            theme={theme}
            loading={isLoading}
            onSelectionChanged={onRowSelectionChanged}
          />
        </div>
      </CardContent>

      <CardFooter>
        <div className="text-sm text-muted-foreground flex items-center gap-2">
          <span>Total Jobs: {tableData.length}</span>
        </div>
      </CardFooter>
    </Card>
  )
}
