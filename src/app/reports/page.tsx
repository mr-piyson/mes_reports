import {
  ArrowRight,
  Briefcase,
  ClipboardCheck,
  Clock,
  LayoutPanelLeft,
  type LucideIcon,
  Package,
  Truck,
} from "lucide-react"
import { Route } from "next"
import Link from "next/link"
import { JSX } from "react"

import { Card, CardContent } from "@/components/ui/card"

type CardObject = {
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

export default function ModernReportsDashboard() {
  const reports = [
    {
      id: "panel",
      title: "Panel Report",
      description: "System panels & metrics",
      icon: LayoutPanelLeft,
      href: "/reports/panels",
      theme: {
        bg: "bg-blue-50 dark:bg-blue-950/30",
        text: "text-blue-600 dark:text-blue-400",
        hoverBorder: "hover:border-blue-500/30",
        hoverShadow: "hover:shadow-blue-500/10",
      },
    },
    {
      id: "inspection",
      title: "Inspection",
      description: "QA & compliance checks",
      icon: ClipboardCheck,
      href: "/reports/inspection-results",
      theme: {
        bg: "bg-emerald-50 dark:bg-emerald-950/30",
        text: "text-emerald-600 dark:text-emerald-400",
        hoverBorder: "hover:border-emerald-500/30",
        hoverShadow: "hover:shadow-emerald-500/10",
      },
    },
    {
      id: "shipment",
      title: "Shipments",
      description: "Logistics & transit status",
      icon: Truck,
      href: "/",
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
      href: "/",

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
      href: "/",

      theme: {
        bg: "bg-indigo-50 dark:bg-indigo-950/30",
        text: "text-indigo-600 dark:text-indigo-400",
        hoverBorder: "hover:border-indigo-500/30",
        hoverShadow: "hover:shadow-indigo-500/10",
      },
    },
    {
      id: "timeout",
      title: "Time-outs",
      description: "Downtimes & delays",
      icon: Clock,
      href: "/",

      theme: {
        bg: "bg-rose-50 dark:bg-rose-950/30",
        text: "text-rose-600 dark:text-rose-400",
        hoverBorder: "hover:border-rose-500/30",
        hoverShadow: "hover:shadow-rose-500/10",
      },
    },
  ] as const satisfies CardObject[]

  return (
    <div className="p-6 md:p-10 max-w-6xl mx-auto min-h-screen bg-white dark:bg-zinc-950">
      <div className="mb-10 text-center max-w-2xl mx-auto">
        <h1 className="text-4xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50">
          Reports Center
        </h1>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {reports.map((report) => {
          const Icon = report.icon

          return (
            <Card
              key={report.id}
              className={`group cursor-pointer border-2 border-zinc-100 dark:border-zinc-800 transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-xl ${report.theme.hoverBorder} ${report.theme.hoverShadow} bg-white dark:bg-zinc-900`}
            >
              <Link href={report.href}>
                <CardContent className="p-8 flex flex-col items-center text-center h-full">
                  {/* Big Colored Icon */}
                  <div
                    className={`mb-6 p-5 rounded-3xl transition-transform duration-300 group-hover:scale-110 ${report.theme.bg} ${report.theme.text}`}
                  >
                    <Icon className="w-12 h-12 stroke-[1.5]" />
                  </div>

                  {/* Text Content */}
                  <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">
                    {report.title}
                  </h3>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-8 grow">
                    {report.description}
                  </p>

                  {/* Animated Arrow */}
                  <div className="mt-auto flex items-center justify-center space-x-2 text-sm font-semibold text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-zinc-100 transition-colors">
                    <span>View Report</span>
                    <ArrowRight className="w-4 h-4 opacity-0 -translate-x-2 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-0" />
                  </div>
                </CardContent>
              </Link>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
