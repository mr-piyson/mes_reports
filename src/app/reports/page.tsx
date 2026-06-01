import {
  ArrowRight,
  BarChart3,
  Briefcase,
  ClipboardCheck,
  Clock,
  LayoutDashboard,
  LayoutPanelLeft,
  LineChart,
  type LucideIcon,
  Package,
  PieChart,
  RouteIcon,
  Settings,
  Truck,
} from "lucide-react"
import { Route } from "next"
import Link from "next/link"
import { JSX } from "react"

import { Card, CardContent } from "@/components/ui/card"

type ReportItem = {
  id: string
  title: string
  description: string
  icon: LucideIcon
  href: Route
  theme: {
    bg: string
    text: string
    hoverBorder: string
    hoverShadow: string
  }
}

type ReportCategory = {
  categoryName: string
  items: ReportItem[]
}

export default function ScalableReportsDashboard() {
  const reportCategories: ReportCategory[] = [
    {
      categoryName: "Logistics & Operations",
      items: [
        {
          id: "shipment",
          title: "Shipments",
          description: "Logistics & transit status",
          icon: Truck,
          href: "/reports/shipments" as Route,
          theme: {
            bg: "bg-violet-50 dark:bg-violet-950/30",
            text: "text-violet-600 dark:text-violet-400",
            hoverBorder: "hover:border-violet-500/30",
            hoverShadow: "hover:shadow-violet-500/10",
          },
        },
        {
          id: "package",
          title: "Packages",
          description: "Inventory & dispatch",
          icon: Package,
          href: "/reports/packages" as Route,
          theme: {
            bg: "bg-amber-50 dark:bg-amber-950/30",
            text: "text-amber-600 dark:text-amber-400",
            hoverBorder: "hover:border-amber-500/30",
            hoverShadow: "hover:shadow-amber-500/10",
          },
        },
        {
          id: "job",
          title: "Jobs",
          description: "Active work orders",
          icon: Briefcase,
          href: "/reports/jobs" as Route,
          theme: {
            bg: "bg-indigo-50 dark:bg-indigo-950/30",
            text: "text-indigo-600 dark:text-indigo-400",
            hoverBorder: "hover:border-indigo-500/30",
            hoverShadow: "hover:shadow-indigo-500/10",
          },
        },
      ],
    },
    {
      categoryName: "Quality & Compliance",
      items: [
        {
          id: "inspection",
          title: "Inspection",
          description: "QA & compliance checks",
          icon: ClipboardCheck,
          href: "/reports/inspection-results" as Route,
          theme: {
            bg: "bg-emerald-50 dark:bg-emerald-950/30",
            text: "text-emerald-600 dark:text-emerald-400",
            hoverBorder: "hover:border-emerald-500/30",
            hoverShadow: "hover:shadow-emerald-500/10",
          },
        },
        {
          id: "inspection-routes",
          title: "Panel routes",
          description: "Show panels route and last stage",
          icon: RouteIcon,
          href: "/reports/inspection-routes" as Route,
          theme: {
            bg: "bg-lime-50 dark:bg-emerald-950/30",
            text: "text-lime-600 dark:text-emerald-400",
            hoverBorder: "hover:border-lime-400/30",
            hoverShadow: "hover:shadow-lime-400/20",
          },
        },
      ],
    },
    {
      categoryName: "System Health",
      items: [
        {
          id: "panel",
          title: "Panel Report",
          description: "System panels & metrics",
          icon: LayoutPanelLeft,
          href: "/reports/panels" as Route,
          theme: {
            bg: "bg-blue-50 dark:bg-blue-950/30",
            text: "text-blue-600 dark:text-blue-400",
            hoverBorder: "hover:border-blue-500/30",
            hoverShadow: "hover:shadow-blue-500/10",
          },
        },
        {
          id: "timeout",
          title: "Time-outs",
          description: "Downtimes & delays",
          icon: Clock,
          href: "/reports/time-out" as Route,
          theme: {
            bg: "bg-rose-50 dark:bg-rose-950/30",
            text: "text-rose-600 dark:text-rose-400",
            hoverBorder: "hover:border-rose-500/30",
            hoverShadow: "hover:shadow-rose-500/10",
          },
        },
      ],
    },
    {
      categoryName: "Visualization",
      items: [
        {
          id: "defects",
          title: "Defects Analytics",
          description: "Defects statistics and analytics",
          icon: PieChart,
          href: "/charts/inspections" as Route,
          theme: {
            bg: "bg-red-50 dark:bg-red-950/30",
            text: "text-red-600 dark:text-red-400",
            hoverBorder: "hover:border-red-500/30",
            hoverShadow: "hover:shadow-red-500/10",
          },
        },
      ],
    },
  ]

  return (
    <div className="flex min-h-screen bg-zinc-50 dark:bg-zinc-950">
      {/* SIDEBAR */}
      <aside className="hidden md:flex w-64 flex-col bg-white dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800 p-4 sticky top-0 h-screen overflow-y-auto">
        <div className="flex items-center gap-2 px-2 mb-8">
          <div className="p-2 bg-zinc-900 dark:bg-zinc-100 rounded-lg">
            <LayoutDashboard className="w-5 h-5 text-white dark:text-zinc-900" />
          </div>
          <span className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
            Analytics
          </span>
        </div>

        <nav className="flex flex-col gap-1 flex-1">
          <div className="text-xs font-semibold text-zinc-400 mb-2 px-2 uppercase tracking-wider">
            Main Menu
          </div>
          <Link
            href="/"
            className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
          >
            <BarChart3 className="w-4 h-4" /> Overview
          </Link>
          <Link
            href="/reports"
            className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <ClipboardCheck className="w-4 h-4" /> All Reports
          </Link>
          <Link
            href="/settings"
            className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors mt-auto"
          >
            <Settings className="w-4 h-4" /> Settings
          </Link>
        </nav>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 p-6 md:p-10 max-w-7xl mx-auto w-full">
        <header className="mb-8">
          <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50">
            Command Center
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 mt-1">
            Monitor visualizations and access deep-dive reports.
          </p>
        </header>

        {/* BOTTOM SECTION: Categorized Report Navigations */}
        <section className="space-y-10">
          {reportCategories.map((category) => (
            <div key={category.categoryName}>
              <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-4 border-b border-zinc-200 dark:border-zinc-800 pb-2">
                {category.categoryName}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {category.items.map((report) => {
                  const Icon = report.icon

                  return (
                    <Card
                      key={report.id}
                      className={`group relative overflow-hidden cursor-pointer border-2 border-zinc-300 drop-shadow-2xl dark:border-zinc-800 transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-lg ${report.theme.hoverBorder} ${report.theme.hoverShadow} bg-white dark:bg-zinc-900`}
                    >
                      <Link href={report.href} className="block h-full">
                        {/* 1. Increased Opacity to 15% (light) / 20% (dark) so it's visible */}
                        {/* 2. Added explicit strokeWidth for cleaner scaling */}
                        <Icon
                          strokeWidth={1.5}
                          className={`absolute -bottom-6 -right-6 w-32 h-32 pointer-events-none transition-all duration-500 ease-out group-hover:scale-110 group-hover:-rotate-12 opacity-25 dark:opacity-25 ${report.theme.text}`}
                        />

                        {/* content wrapper layer */}
                        <CardContent className="relative z-10 p-5 flex items-start gap-4 h-full">
                          {/* Primary Icon */}
                          <div
                            className={`p-3 rounded-xl transition-transform duration-300 group-hover:scale-105 shrink-0 ${report.theme.bg} ${report.theme.text}`}
                          >
                            <Icon className="w-6 h-6 stroke-2" />
                          </div>

                          {/* Text Content */}
                          <div className="flex-1">
                            <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 mb-1 flex items-center gap-2">
                              {report.title}
                              <ArrowRight className="w-3.5 h-3.5 opacity-0 -translate-x-2 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-0" />
                            </h3>
                            <p className="text-sm text-zinc-500 dark:text-zinc-400 line-clamp-2">
                              {report.description}
                            </p>
                          </div>
                        </CardContent>
                      </Link>
                    </Card>
                  )
                })}
              </div>
            </div>
          ))}
        </section>
      </main>
    </div>
  )
}
