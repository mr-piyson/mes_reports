"use client"

import { useQuery } from "@tanstack/react-query"
import type { ColDef, GridApi, GridReadyEvent } from "ag-grid-community"
import {
  AllCommunityModule,
  CsvExportModule,
  ModuleRegistry,
} from "ag-grid-community"
import { AgGridReact } from "ag-grid-react"
import { SearchIcon } from "lucide-react"
import { useCallback, useEffect, useMemo, useState } from "react"

// Assuming these exist in your project
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

ModuleRegistry.registerModules([AllCommunityModule, CsvExportModule])

const DateCellRenderer = ({ value }: { value: string | null | undefined }) => {
  if (!value) return ""
  const date = new Date(value)

  // Guard against invalid dates
  if (isNaN(date.getTime())) return value

  const day = String(date.getDate()).padStart(2, "0")
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const year = date.getFullYear()
  const hours = String(date.getHours()).padStart(2, "0")
  const minutes = String(date.getMinutes()).padStart(2, "0")
  const seconds = String(date.getSeconds()).padStart(2, "0")

  return `${year}-${month}-${day}  ${hours}:${minutes}:${seconds}`
}

const PanelCellRender = ({ value }: { value: string }) => {
  if (!value) return null
  const trackerUrl = `http://intranet.bfginternational.com:88/utilities/panel_tracker?part_id=${value}`

  return (
    <div className="flex justify-between items-center w-full h-full pr-2">
      <span className="text-md font-semibold uppercase">{value}</span>
      <Button
        variant="outline"
        size="icon"
        className="p-0 h-6 w-6"
        onClick={() => window.open(trackerUrl, "_blank")}
        title="Inspect Panel"
      >
        <i className="icon-[mingcute--inspect-line] size-4" />
      </Button>
    </div>
  )
}

export default function ReportPage() {
  const theme = useTableTheme()
  const [gridApi, setGridApi] = useState<GridApi | null>(null)
  const [selectedRows, setSelectedRows] = useState<any[]>([])

  // Replaced Jotai with local useState
  const [filter, setFilter] = useState<string>("today")
  const [panels, setPanels] = useState([])

  // React Query for data fetching (Removed side-effects from queryFn)
  const {
    data: tableData = [],
    isFetching: isLoading,
    isError,
    error,
    refetch,
  } = trpc.timeOut.getHistory.useQuery({
    filter: filter,
  })
  console.log(tableData)

  // Memoized column definitions
  const columnDefs: ColDef[] = useMemo(
    () => [
      {
        field: "panel_serial",
        headerName: "Panel Serial",
        editable: true,
        cellRenderer: PanelCellRender, // Utilized the custom renderer here
      },
      { field: "Mold", label: "Mold", cellRenderer: DateCellRenderer },
      {
        field: "Gelcoating",
        label: "Gelcoating",
        cellRenderer: DateCellRenderer,
      },
      {
        field: "Demolding",
        label: "Demolding",
        cellRenderer: DateCellRenderer,
      },
      { field: "Trimming", label: "Trimming", cellRenderer: DateCellRenderer },
      { field: "Drilling", label: "Drilling", cellRenderer: DateCellRenderer },
      { field: "Bonding", label: "Bonding", cellRenderer: DateCellRenderer },
      {
        field: "Paint Preparation",
        label: "Paint Preparation",
        cellRenderer: DateCellRenderer,
      },
      { field: "Painting", label: "Painting", cellRenderer: DateCellRenderer },
      { field: "Final", label: "Final", cellRenderer: DateCellRenderer },
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

  const refreshData = useCallback(() => {
    if (gridApi) {
      gridApi.setFilterModel(null)
      gridApi.resetColumnState()
    }
    refetch()
  }, [gridApi, refetch])

  const exportRows = useCallback(() => {
    if (gridApi) {
      gridApi.exportDataAsCsv({
        onlySelected: false,
        onlySelectedAllPages: false,
        allColumns: false,
        fileName: `filtered-report-${new Date().toISOString().split("T")[0]}.csv`,
      })
    }
  }, [gridApi])

  // Error state
  if (isError) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-red-600">
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
          {/* Passed local state down to SearchDialog so it can modify the data */}

          <Button disabled={isLoading || !gridApi} variant="outline">
            <SearchIcon className="size-4 mr-2" />
            <span className="max-sm:hidden">Search</span>
          </Button>

          <Button
            variant="outline"
            onClick={exportRows}
            disabled={isLoading || !gridApi}
          >
            <i className="icon-[vscode-icons--file-type-excel] size-4 mr-2" />
            <span className="max-sm:hidden">Export</span>
          </Button>

          <Button
            className="flex items-center gap-2"
            variant="outline"
            onClick={refreshData}
            disabled={isLoading}
          >
            <i className="icon-[tdesign--refresh] size-4" />
            <span className="max-sm:hidden">Refresh</span>
          </Button>
        </div>

        {/* Right Controls */}
        <div className="flex flex-1 flex-row justify-end">
          <Select value={filter} onValueChange={setFilter}>
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
              <SelectItem value="all">All Time</SelectItem>
            </SelectContent>
          </Select>
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
            rowSelection="multiple"
          />
        </div>
      </CardContent>

      <CardFooter className="py-3">
        <div className="text-sm text-muted-foreground flex items-center gap-2">
          <span>Total Panels: {panels.length}</span>
          {selectedRows.length > 0 && (
            <span className="pl-4 ml-2 border-l-2 border-border">
              Selected Panels: {selectedRows.length}
            </span>
          )}
        </div>
      </CardFooter>
    </Card>
  )
}
