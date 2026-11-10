import { type BudgetConfig, type MemberId, MEMBERS } from "./config"
import type { Kop } from "./money"
import { type ItemKind, type MonthPlan, type PlanItem, itemId } from "./plan"

export type Entry = {
  id: string
  month: string // YYYY-MM
  member: MemberId
  itemKey: string // e.g. "savings.apartment"
  amount: Kop
  paidOn: string // YYYY-MM-DD
  note: string | null
  createdAt: string
}

export type Task = {
  id: string
  month: string
  title: string
  assignee: MemberId | null
  done: boolean
  createdAt: string
}

export type ItemStatus = "todo" | "partial" | "done"

export type ItemProgress = PlanItem & {
  id: string
  done: Kop
  left: Kop
  status: ItemStatus
  entries: Entry[]
}

export type Tally = { plan: Kop; done: Kop }

export type Settle =
  | { kind: "none" }
  | { kind: "even"; diff: Kop }
  | { kind: "transfer"; from: MemberId; to: MemberId; amount: Kop }

export type MonthProgress = {
  items: ItemProgress[]
  total: Tally
  byMember: Record<MemberId, Tally & { itemsDone: number; itemsTotal: number }>
  bySection: Record<ItemKind, Record<MemberId | "all", Tally>>
  /** Savings goals + jars aggregated across both people. */
  categories: { key: string; kind: ItemKind; name: string; emoji?: string; total: Tally; byMember: Record<MemberId, Tally> }[]
  settle: Settle
  /** Cumulative amounts by day of month, for the chart. */
  timeline: { day: number; ostap: Kop; olena: Kop; total: Kop }[]
}

const KINDS: ItemKind[] = ["savings", "jar", "zone"]
const tally = (): Tally => ({ plan: 0, done: 0 })

export function statusOf(plan: Kop, done: Kop): ItemStatus {
  if (done <= 0) return "todo"
  if (plan <= 0 || done >= plan) return "done"
  return "partial"
}

export function daysInMonth(month: string): number {
  const [y, m] = month.split("-").map(Number)
  return new Date(Date.UTC(y, m, 0)).getUTCDate()
}

export function summarize(cfg: BudgetConfig, plan: MonthPlan, entries: Entry[]): MonthProgress {
  const byId = new Map<string, ItemProgress>()
  for (const it of plan.items) {
    byId.set(itemId(it.member, it.key), { ...it, id: itemId(it.member, it.key), done: 0, left: it.plan, status: "todo", entries: [] })
  }
  for (const e of entries) {
    const id = itemId(e.member, e.itemKey)
    let it = byId.get(id)
    if (!it) {
      // Entry for an item no longer in the plan (config changed) — keep it visible.
      const kind = (e.itemKey.split(".")[0] as ItemKind) ?? "savings"
      it = { key: e.itemKey, kind, member: e.member, name: e.itemKey, plan: 0, id, done: 0, left: 0, status: "todo", entries: [] }
      byId.set(id, it)
    }
    it.done += e.amount
    it.entries.push(e)
  }
  const items = [...byId.values()].map((it) => ({
    ...it,
    left: Math.max(0, it.plan - it.done),
    status: statusOf(it.plan, it.done),
    entries: it.entries.sort((a, b) => a.paidOn.localeCompare(b.paidOn) || a.createdAt.localeCompare(b.createdAt)),
  }))

  const total = tally()
  const byMember = Object.fromEntries(MEMBERS.map((m) => [m, { ...tally(), itemsDone: 0, itemsTotal: 0 }])) as MonthProgress["byMember"]
  const bySection = Object.fromEntries(
    KINDS.map((k) => [k, Object.fromEntries([...MEMBERS, "all"].map((m) => [m, tally()]))]),
  ) as MonthProgress["bySection"]

  for (const it of items) {
    total.plan += it.plan
    total.done += it.done
    const bm = byMember[it.member]
    bm.plan += it.plan
    bm.done += it.done
    if (it.plan > 0 || it.done > 0) {
      bm.itemsTotal += 1
      if (it.status === "done") bm.itemsDone += 1
    }
    for (const m of [it.member, "all"] as const) {
      bySection[it.kind][m].plan += it.plan
      bySection[it.kind][m].done += it.done
    }
  }

  const catMap = new Map<string, MonthProgress["categories"][number]>()
  for (const it of items) {
    if (it.kind === "zone") continue
    let c = catMap.get(it.key)
    if (!c) {
      c = {
        key: it.key,
        kind: it.kind,
        name: it.name,
        emoji: it.emoji,
        total: tally(),
        byMember: Object.fromEntries(MEMBERS.map((m) => [m, tally()])) as Record<MemberId, Tally>,
      }
      catMap.set(it.key, c)
    }
    c.total.plan += it.plan
    c.total.done += it.done
    c.byMember[it.member].plan += it.plan
    c.byMember[it.member].done += it.done
  }

  return {
    items,
    total,
    byMember,
    bySection,
    categories: [...catMap.values()],
    settle: settleUp(cfg, plan, entries),
    timeline: buildTimeline(plan.month, entries),
  }
}

/**
 * Who owes whom for shared spending (zones + jars), the same rule as the
 * sheet's "Хто кому компенсує": each person should carry their income share
 * of what was actually spent/topped up together.
 */
export function settleUp(cfg: BudgetConfig, plan: MonthPlan, entries: Entry[]): Settle {
  const shared = entries.filter((e) => e.itemKey.startsWith("zone.") || e.itemKey.startsWith("jar."))
  if (shared.length === 0) return { kind: "none" }
  const total = shared.reduce((s, e) => s + e.amount, 0)
  const [a, b] = MEMBERS
  const paidB = shared.filter((e) => e.member === b).reduce((s, e) => s + e.amount, 0)
  const diff = Math.round(paidB - total * plan.incomeShare[b])
  if (Math.abs(diff) < cfg.settleToleranceUah * 100) return { kind: "even", diff }
  return diff > 0 ? { kind: "transfer", from: a, to: b, amount: diff } : { kind: "transfer", from: b, to: a, amount: -diff }
}

function buildTimeline(month: string, entries: Entry[]): MonthProgress["timeline"] {
  const n = daysInMonth(month)
  const perDay = Array.from({ length: n }, () => ({ ostap: 0, olena: 0 }))
  for (const e of entries) {
    const d = Number(e.paidOn.slice(8, 10))
    if (d >= 1 && d <= n) perDay[d - 1][e.member] += e.amount
  }
  let o = 0
  let l = 0
  return perDay.map((d, i) => {
    o += d.ostap
    l += d.olena
    return { day: i + 1, ostap: o, olena: l, total: o + l }
  })
}
