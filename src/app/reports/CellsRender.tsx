import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

import type { ReportData } from "./panels/atoms"

export const StatusCellRenderer = (props: {
  value: boolean
  whenFalse?: React.ReactNode
  whenTrue?: React.ReactNode
}) => {
  const bool = props.value

  const content = bool ? (props.whenTrue ?? "Yes") : (props.whenFalse ?? "No")

  return (
    <Badge variant={bool ? "default" : "destructive"} className="text-xs">
      {content}
    </Badge>
  )
}

export const PanelCellRender = ({ value }: { value: string }) => {
  const trackerUrl = `http://intranet.bfginternational.com:88/utilities/panel_tracker?part_id=${value}`

  return (
    <div className="flex justify-between items-center">
      <span className="text-md font-semibold">{value}</span>
      <Button
        variant="outline"
        size="icon"
        className="p-0"
        onClick={() => window.open(trackerUrl, "_blank")}
        title="Inspect Panel"
      >
        <i className="icon-[mingcute--inspect-line] size-5" />
      </Button>
    </div>
  )
}

export const ContainerCellRenderer = ({ data }: { data: ReportData }) => (
  <div className="flex justify-between items-center">
    <span className="text-md font-semibold">{data.container}</span>
    {data.container && (
      <Button
        variant="outline"
        size="icon"
        className="p-0"
        onClick={() =>
          window.open(
            `http://intranet.bfginternational.com:88/containers/show?id=${parseInt(
              data.container?.match(/\d+/)?.[0] || "0"
            )}`,
            "_blank"
          )
        }
        title="Inspect Container"
      >
        <i className="icon-[ph--shipping-container] size-6" />
      </Button>
    )}
  </div>
)

export const BoxCellRenderer = ({ data }: { data: ReportData }) => (
  <div className="flex justify-between items-center">
    <span className="text-md font-semibold">{data.package}</span>
    {data.package && (
      <Button
        variant="outline"
        size="icon"
        className="p-0"
        onClick={() =>
          window.open(
            `http://intranet.bfginternational.com:88/packages/show?id=${parseInt(
              data.package?.match(/\d+/)?.[0] || "0"
            )}`,
            "_blank"
          )
        }
        title="Inspect Box"
      >
        <i className="icon-[solar--box-outline] size-6" />
      </Button>
    )}
  </div>
)

// const DateCellRenderer = ({ value }: { value: string }) => {
//   if (!value) return null;
//   const date = new Date(value);
//   const day = String(date.getDate()).padStart(2, "0");
//   const month = String(date.getMonth() + 1).padStart(2, "0");
//   const year = date.getFullYear();
//   return `${day}/${month}/${year}`;
// };

export const JobCellRenderer = ({ value }: { value: string }) => {
  if (!value) return null
  const jobUrl = `http://intranet.bfginternational.com:88/labels/assemblies/assembly_jobs?id=${value}`

  return (
    <div className="flex justify-between items-center">
      <span className="text-md font-semibold">{value}</span>
      <Button
        variant="outline"
        size="icon"
        className="p-0"
        onClick={() => window.open(jobUrl, "_blank")}
        title="Inspect Job"
      >
        <i className="icon-[ph--briefcase] size-5" />
      </Button>
    </div>
  )
}

export const RouteCellRenderer = ({ value }: { value: string[] }) => {
  return (
    <div className="flex-row gap-1">
      {value && value.length > 0 ? (
        value.map((step, index) => (
          <div key={index} className="inline-flex items-center">
            <Badge
              key={index}
              className="m-1 text-foreground border border-success-foreground/50"
              variant="success"
              title={`Step ${index + 1}`}
            >
              {step}
            </Badge>
            <div className="w-full flex items-center text-foreground/80">
              {index < value.length - 1 && (
                <i className="icon-[mdi--arrow-right-bold] size-4" />
              )}
            </div>
          </div>
        ))
      ) : (
        <span className="text-sm text-muted-foreground">No Route</span>
      )}
    </div>
  )
}

export const DateCellRenderer = ({ value }: { value: string }) => {
  if (!value) return null
  const date = new Date(value)
  const day = String(date.getDate()).padStart(2, "0")
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const year = date.getFullYear()
  const hours = String(date.getHours()).padStart(2, "0")
  const minutes = String(date.getMinutes()).padStart(2, "0")
  const seconds = String(date.getSeconds()).padStart(2, "0")

  return `${year}-${month}-${day}  ${hours}:${minutes}:${seconds}`
}
