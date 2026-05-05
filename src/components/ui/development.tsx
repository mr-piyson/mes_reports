import { toast } from "sonner"

type DevelopmentProps = {
  children?: React.ReactNode
  isDev: boolean
}

export function Development({ isDev = false, ...props }: DevelopmentProps) {
  return (
    <div
      onClick={(e) => {
        if (isDev) {
          e.preventDefault()
          e.stopPropagation()
          toast.error("This feature is under development.")
        }
      }}
      {...props}
    />
  )
}
