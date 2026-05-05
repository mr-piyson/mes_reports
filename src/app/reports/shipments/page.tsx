"use client"
import { useQuery } from "@tanstack/react-query"
import type { ColDef, GridApi, GridReadyEvent } from "ag-grid-community"
import {
  AllCommunityModule,
  CsvExportModule,
  ModuleRegistry,
} from "ag-grid-community"
import { AgGridReact } from "ag-grid-react"
import axios from "axios"
import { useAtom } from "jotai"
import { Search } from "lucide-react"
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

import {
  BoxCellRenderer,
  DateCellRenderer,
  PanelCellRender,
} from "../CellsRender"
import {
  type ApiReportData,
  type ReportData,
  filteredData,
  initData,
  monthStore,
  yearStore,
} from "./atoms"

ModuleRegistry.registerModules([AllCommunityModule, CsvExportModule])

// API function

export default function ReportPage() {
  const [gridApi, setGridApi] = useState<GridApi | null>(null)
  const [selectedRows, setSelectedRows] = useState<ReportData[]>([])
  const [year, setYear] = useAtom(yearStore)
  const [month, setMonth] = useAtom(monthStore)
  const [, setInitPanels] = useAtom(initData)
  const [panels, setPanels] = useAtom(filteredData)
  const theme = useTableTheme()

  // React Query for data fetching
  const {
    data: tableData = [],
    isFetching: isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["shipment", year, month],
    queryFn: async () => {
      const data = await fetchPanels()
      setInitPanels(data)
      setPanels(data)
      return data
    },
    refetchOnWindowFocus: false,
    gcTime: Infinity,
    staleTime: Infinity,
    enabled: false,
  })

  const fetchPanels = useCallback(async (): Promise<ReportData[]> => {
    const response = await axios.get(
      `/api/reports/shipments?year=${year}&month=${month}`
    )
    const data = response.data.map(
      (panel: ApiReportData): ReportData => ({
        package: panel.package.toUpperCase(),
        project: panel.project,
        part_id: panel.part_id.toUpperCase(),
        description: panel.description,
        container_id: panel.container_id,
        date: new Date(panel.date),
        shipped_by: panel.shipped_by,
        epicor_asm_part_no: panel.epicor_asm_part_no,
        epicor_part_no: panel.epicor_part_no,
        job_id: panel.job_id,
      })
    )
    return data
  }, [year, month])

  // Memoized column definitions
  const columnDefs: ColDef<ReportData>[] = useMemo(
    () => [
      {
        headerName: "Panel ID",
        field: "part_id",
        editable: true,
        sortable: true,
        filter: true,
        flex: 1,
        cellRenderer: PanelCellRender,
      },

      {
        headerName: "Description",
        field: "description",
        editable: true,
        sortable: true,
        filter: true,
        flex: 1,
      },
      {
        headerName: "Box Code",
        field: "package",
        editable: true,
        sortable: true,
        filter: true,
        flex: 1,
        cellRenderer: BoxCellRenderer,
      },
      {
        headerName: "Project Name",
        field: "project",
        editable: true,
        sortable: true,
        filter: true,
        flex: 1,
      },
      {
        headerName: "Shipped By",
        field: "shipped_by",
        editable: true,
        sortable: true,
        filter: true,
        flex: 1,
      },
      {
        headerName: "Date",
        field: "date",
        sortable: true,
        filter: "agDateColumnFilter",
        cellRenderer: DateCellRenderer,
      },
      {
        headerName: "Job ID",
        field: "job_id",
        editable: true,
        sortable: true,
        filter: true,
        flex: 1,
      },
      {
        headerName: "Container ID",
        field: "container_id",
        editable: true,
        sortable: true,
        filter: true,
        flex: 1,
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

  const refreshData = useCallback(() => {
    if (gridApi) {
      gridApi.setFilterModel(null)
      gridApi.resetColumnState()
    }
    refetch()
  }, [gridApi, year, month])

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

  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ]

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

        {/* Right Controls */}
        <div className="flex flex-1 flex-row justify-end gap-2">
          <Select value={year} onValueChange={setYear}>
            <SelectTrigger className=" border-border">
              <SelectValue placeholder="Year" />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: 6 }, (_, index) => (
                <SelectItem
                  key={index}
                  value={String(new Date().getFullYear() - index)}
                >
                  {new Date().getFullYear() - index}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={month} onValueChange={setMonth}>
            <SelectTrigger className="border-border">
              <SelectValue placeholder="Month" />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: 12 }, (_, index) => (
                <SelectItem key={index} value={String(index + 1)}>
                  {monthNames[index]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            onClick={() => {
              refetch()
            }}
          >
            <Search />
            Search
          </Button>
        </div>
      </CardContent>

      <CardContent className="p-0 h-full">
        <div className="ag-theme-alpine h-full w-full">
          <AgGridReact
            rowData={panels}
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
          <span>Total Panels: {tableData.length}</span>
          {selectedRows.length > 0 && (
            <span className="pl-4 ml-2 border-l-2 border-foreground">
              Selected Panels: {selectedRows.length}
            </span>
          )}
        </div>
      </CardFooter>
    </Card>
  )
}
