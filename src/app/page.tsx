import { redirect } from "next/navigation"

type Props = {
  children?: React.ReactNode
}

export default function Page(props: Props) {
  redirect("/reports")
  return <div></div>
}
