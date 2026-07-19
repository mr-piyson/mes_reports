import { Children, Suspense } from "react"

type ChartLayoutProps = {
  children?: React.ReactNode
}

export default function ChartLayout(props: ChartLayoutProps) {
  return (
    <Suspense fallback={<p>Loading chart data...</p>}>
      {props.children}
    </Suspense>
  )
}
