import { type BudgetConfig, type MemberId, MEMBERS, type SavingsOverride } from "./config"
import { type Kop, splitKop, toKop } from "./money"

export type ItemKind = "savings" | "jar" | "zone"

/** A planned amount someone should put somewhere this month — one "todo". */
export type PlanItem = {
  /** Stable id within a month, e.g. "savings.apartment" — paired with member. */
  key: string
  kind: ItemKind
  member: MemberId
  name: string
  emoji?: string
  note?: string
  plan: Kop
}

export type MonthPlan = {
  month: string
  fx: number
  incomeUah: Record<MemberId, number>
  incomeShare: Record<MemberId, number>
  shared: {
    zoneUah: Record<MemberId, number>
    jarsUah: number
    totalUah: number
    mustContributeUah: Record<MemberId, number>
    topUpJarsUah: Record<MemberId, number>
  }
  /** Savings by the normal rule (income × rate). */
  savingsUah: Record<MemberId, number>
  /** Savings target actually used this month (after one-off overrides). */
  savingsTargetUah: Record<MemberId, number>
  overrides: Partial<Record<MemberId, SavingsOverride>>
  items: PlanItem[]
}

const byMember = <T>(fn: (m: MemberId) => T): Record<MemberId, T> =>
  Object.fromEntries(MEMBERS.map((m) => [m, fn(m)])) as Record<MemberId, T>

const toUah = (amount: number, currency: "UAH" | "USD", fx: number) => (currency === "USD" ? amount * fx : amount)

export function buildMonthPlan(cfg: BudgetConfig, month: string, fx: number = cfg.defaultFxUsdUah): MonthPlan {
  const incomeUah = byMember((m) => cfg.members[m].incomeUsd * fx)
  const totalIncome = MEMBERS.reduce((s, m) => s + incomeUah[m], 0)
  const incomeShare = byMember((m) => (totalIncome ? incomeUah[m] / totalIncome : 0))

  const zoneUah = byMember((m) =>
    cfg.zoneItems.filter((z) => z.payer === m).reduce((s, z) => s + toUah(z.amount, z.currency, fx), 0),
  )
  const jarsUah = cfg.jars.reduce((s, j) => s + toUah(j.amount, j.currency, fx), 0)
  const totalUah = MEMBERS.reduce((s, m) => s + zoneUah[m], 0) + jarsUah
  const mustContributeUah = byMember((m) => totalUah * incomeShare[m])
  const topUpJarsUah = byMember((m) => mustContributeUah[m] - zoneUah[m])

  const savingsUah = byMember((m) => incomeUah[m] * cfg.members[m].savingsRate)
  const overrides = cfg.savingsOverrides[month] ?? {}
  const savingsTargetUah = byMember((m) => {
    const o = overrides[m]
    if (!o) return savingsUah[m]
    const fixed = cfg.members[m].personalFixedUah + o.personalFixedDeltaUah
    return Math.max(0, incomeUah[m] - mustContributeUah[m] - fixed - o.debtPaymentUah)
  })

  const items: PlanItem[] = []

  for (const m of MEMBERS) {
    const parts = splitKop(toKop(savingsTargetUah[m]), cfg.goals.map((g) => g.share))
    cfg.goals.forEach((g, i) =>
      items.push({ key: `savings.${g.id}`, kind: "savings", member: m, name: g.name, emoji: g.emoji, plan: parts[i] }),
    )
  }

  // Jars and zone expenses are tracked as ONE item per person (like the
  // sheet's «Факт» tab: "докинув у банки", "витратив на свою зону").
  for (const m of MEMBERS) {
    items.push({
      key: "jar.all",
      kind: "jar",
      member: m,
      name: "Банки",
      emoji: "🫙",
      note: cfg.jars.map((j) => j.name).join(", "),
      plan: Math.max(0, toKop(topUpJarsUah[m])),
    })
    items.push({
      key: "zone.all",
      kind: "zone",
      member: m,
      name: "Спільні витрати",
      emoji: "🧺",
      note: cfg.zoneItems.filter((z) => z.payer === m).map((z) => z.name).join(", "),
      plan: toKop(zoneUah[m]),
    })
  }

  return {
    month,
    fx,
    incomeUah,
    incomeShare,
    shared: { zoneUah, jarsUah, totalUah, mustContributeUah, topUpJarsUah },
    savingsUah,
    savingsTargetUah,
    overrides,
    items,
  }
}

export const itemId = (member: MemberId, key: string) => `${member}:${key}`
