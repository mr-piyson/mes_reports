import TrpcProvider from "@/lib/trpc/Provider"

type ReportLayoutProps = {
  children?: React.ReactNode
}

export default function ReportLayout(props: ReportLayoutProps) {
  return <main className="h-screen">{props.children}</main>
}
