function escapeCsvField(value: string | number): string {
  const str = String(value)
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

function buildCsvSection(
  title: string,
  headers: string[],
  rows: (string | number)[][]
): string {
  const lines = [title]
  lines.push(headers.map(escapeCsvField).join(","))
  for (const row of rows) {
    lines.push(row.map(escapeCsvField).join(","))
  }
  return lines.join("\n")
}

export function buildAnalyticsCsv(data: {
  stats: {
    total_inspections: number
    total_panels_inspected: number
    total_defect_panels: number
    total_defects: number
    defect_panel_percentage: number
  }
  defectsPerDay: { date: string | Date | null; count: number; panels: number }[]
  okNokByGate: {
    gate_name: string
    OK: number
    NOK: number
    total: number
    defect_rate: number
  }[]
  inspectionsPerProject: {
    project: string
    defect_count: number
    total_panels_inspected: number
  }[]
  defectsPerType: { defect_type: string; defect_count: number }[]
}): string {
  const sections: string[] = []

  sections.push(
    buildCsvSection("Summary Statistics", ["Metric", "Value"], [
      ["Total Inspections", data.stats.total_inspections],
      ["Total Panels Inspected", data.stats.total_panels_inspected],
      ["Defect Panels", data.stats.total_defect_panels],
      ["Total Number of Defects", data.stats.total_defects],
      ["Defect Rate (%)", data.stats.defect_panel_percentage],
    ])
  )

  sections.push(
    buildCsvSection(
      "Defects Per Day",
      ["Date", "Panels Inspected", "Count"],
      data.defectsPerDay.map((row) => {
        const dateStr = row.date
          ? new Date(row.date).toISOString().split("T")[0]
          : ""
        return [dateStr, row.panels ?? 0, row.count]
      })
    )
  )

  sections.push(
    buildCsvSection(
      "OK/NOK By Gate",
      ["Gate", "OK", "NOK", "Total", "Defect Rate (%)"],
      data.okNokByGate.map((row) => [
        row.gate_name,
        row.OK,
        row.NOK,
        row.total,
        row.defect_rate,
      ])
    )
  )

  sections.push(
    buildCsvSection(
      "Inspections Per Project (Top 6)",
      ["Project", "Defect Count", "Total Panels Inspected"],
      data.inspectionsPerProject.map((row) => [
        row.project,
        row.defect_count,
        row.total_panels_inspected,
      ])
    )
  )

  sections.push(
    buildCsvSection(
      "Defects Per Type (Top 6)",
      ["Defect Type", "Defect Count"],
      data.defectsPerType.map((row) => [row.defect_type, row.defect_count])
    )
  )

  return sections.join("\n\n")
}

export function downloadCsv(content: string, filename: string): void {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8;" })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
