"use client"

import { createContext, use, useCallback, useMemo, useState, useTransition } from "react"
import { toast } from "sonner"
import { addEntry, deleteEntry } from "@/app/actions"
import type { MemberId } from "@/lib/budget/config"
import { formatUah } from "@/lib/budget/money"
import { defaultPaidOn } from "@/lib/budget/month"
import type { MonthPlan } from "@/lib/budget/plan"
import type { Entry, ItemProgress, MonthProgress } from "@/lib/budget/progress"
import { EntryDialog, type EntryPrefill } from "./entry-dialog"
import { Header } from "./header"
import { PersonCard } from "./person-card"
import { SharedGoal } from "./shared-goal"

type Ctx = {
  month: string
  plan: MonthPlan
  progress: MonthProgress
  openEntry: (prefill?: EntryPrefill) => void
  closeItem: (item: ItemProgress) => void
  removeEntry: (e: Entry) => void
  pending: boolean
}

const DashboardContext = createContext<Ctx | null>(null)
export function useDashboard() {
  const ctx = use(DashboardContext)
  if (!ctx) throw new Error("useDashboard outside Dashboard")
  return ctx
}

export function Dashboard({
  month,
  plan,
  progress,
  fxIsDefault,
}: {
  month: string
  plan: MonthPlan
  progress: MonthProgress
  fxIsDefault: boolean
}) {
  const [dialog, setDialog] = useState<{ open: boolean; prefill?: EntryPrefill; n: number }>({ open: false, n: 0 })
  const [pending, startTransition] = useTransition()

  const openEntry = useCallback((prefill?: EntryPrefill) => setDialog((d) => ({ open: true, prefill, n: d.n + 1 })), [])

  const removeEntry = useCallback(
    (e: Entry) =>
      startTransition(async () => {
        await deleteEntry({ id: e.id, month })
        toast(`Видалено ${formatUah(e.amount)}`, {
          action: {
            label: "Повернути",
            onClick: () => startTransition(async () => void (await addEntry({ ...e, note: e.note }))),
          },
        })
      }),
    [month],
  )

  const closeItem = useCallback(
    (item: ItemProgress) => {
      if (item.left <= 0) return
      startTransition(async () => {
        const row = await addEntry({
          month,
          member: item.member,
          itemKey: item.key,
          amount: item.left,
          paidOn: defaultPaidOn(month),
          note: null,
        })
        toast(`${item.emoji ?? "✓"} ${item.name}: +${formatUah(row.amount)}`, {
          action: { label: "Скасувати", onClick: () => startTransition(async () => deleteEntry({ id: row.id, month })) },
        })
      })
    },
    [month],
  )

  const ctx = useMemo<Ctx>(
    () => ({ month, plan, progress, openEntry, closeItem, removeEntry, pending }),
    [month, plan, progress, openEntry, closeItem, removeEntry, pending],
  )

  const people: MemberId[] = ["ostap", "olena"]

  return (
    <DashboardContext value={ctx}>
      <div className="mx-auto flex w-full max-w-[1040px] flex-col gap-5 px-4 pt-4 pb-24 md:px-6 md:pt-8">
        <Header fxIsDefault={fxIsDefault} />
        <SharedGoal />
        <div className="grid items-start gap-5 md:grid-cols-2">
          {people.map((m) => (
            <PersonCard key={m} member={m} />
          ))}
        </div>
      </div>
      <EntryDialog key={dialog.n} open={dialog.open} prefill={dialog.prefill} onOpenChange={(open) => setDialog((d) => ({ ...d, open }))} />
    </DashboardContext>
  )
}
