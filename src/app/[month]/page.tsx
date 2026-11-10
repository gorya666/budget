import { notFound } from "next/navigation"
import { Dashboard } from "@/components/budget/dashboard"
import { config } from "@/lib/budget/config"
import { MONTH_RE } from "@/lib/budget/month"
import { buildMonthPlan } from "@/lib/budget/plan"
import { summarize } from "@/lib/budget/progress"
import { repo } from "@/lib/data/repo"

export default async function MonthPage({ params }: PageProps<"/[month]">) {
  const { month } = await params
  if (!MONTH_RE.test(month)) notFound()

  const db = repo()
  const [fx, entries] = await Promise.all([db.getFx(month), db.listEntries(month)])
  const plan = buildMonthPlan(config, month, fx ?? config.defaultFxUsdUah)
  const progress = summarize(config, plan, entries)

  return <Dashboard month={month} plan={plan} progress={progress} fxIsDefault={fx === null} />
}
