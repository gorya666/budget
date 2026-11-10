/**
 * Oracle tests: the source spreadsheet already computed the right answers
 * (fixtures/sheet-golden.json). The app's math must reproduce them.
 */
import { describe, expect, it } from "vitest"
import golden from "../../../fixtures/sheet-golden.json"
import { config, MEMBERS } from "./config"
import { formatUah, parseUahInput, splitKop } from "./money"
import { buildMonthPlan } from "./plan"
import { type Entry, settleUp, summarize } from "./progress"

const E = golden.expected
const plan = buildMonthPlan(config, "2026-12", golden.inputs.fxUsdUah)
const close = (a: number, b: number) => expect(a).toBeCloseTo(b, 2)

describe("plan matches the spreadsheet", () => {
  it("income in UAH and income share", () => {
    close(plan.incomeUah.ostap, E.incomeUah.ostap)
    close(plan.incomeUah.olena, E.incomeUah.olena)
    expect(plan.incomeShare.ostap).toBeCloseTo(E.incomeShare.ostap, 6)
    expect(plan.incomeShare.olena).toBeCloseTo(E.incomeShare.olena, 6)
  })

  it("shared zones, jars and totals", () => {
    close(plan.shared.zoneUah.olena, E.shared.zoneOlenaUah)
    close(plan.shared.zoneUah.ostap, E.shared.zoneOstapUah)
    close(plan.shared.jarsUah, E.shared.jarsUah)
    close(plan.shared.totalUah, E.shared.totalUah)
  })

  it("must contribute and jar top-ups (proportional to income)", () => {
    close(plan.shared.mustContributeUah.olena, E.shared.mustContributeUah.olena)
    close(plan.shared.mustContributeUah.ostap, E.shared.mustContributeUah.ostap)
    close(plan.shared.topUpJarsUah.olena, E.shared.topUpJarsUah.olena)
    close(plan.shared.topUpJarsUah.ostap, E.shared.topUpJarsUah.ostap)
  })

  it("savings by the normal rule", () => {
    close(plan.savingsUah.ostap, E.personal.savingsUah.ostap)
    close(plan.savingsUah.olena, E.personal.savingsUah.olena)
    expect(plan.savingsTargetUah).toEqual(plan.savingsUah)
  })

  it("Olena's transition months (tax debt) override her savings target", () => {
    const oct = buildMonthPlan(config, "2026-10", golden.inputs.fxUsdUah)
    const nov = buildMonthPlan(config, "2026-11", golden.inputs.fxUsdUah)
    close(oct.savingsTargetUah.olena, E.personal.olenaTransition.oct.canSaveUah)
    close(nov.savingsTargetUah.olena, E.personal.olenaTransition.nov.canSaveUah)
    close(nov.savingsTargetUah.ostap, E.personal.savingsUah.ostap)
  })

  it("savings goal monthly contributions match the Goals tab (USD)", () => {
    const totalSavingsUsd = (plan.savingsUah.ostap + plan.savingsUah.olena) / golden.inputs.fxUsdUah
    close(totalSavingsUsd, E.goals.monthlySavingsUsd)
    const byGoal = (key: string) =>
      plan.items.filter((i) => i.key === key).reduce((s, i) => s + i.plan, 0) / 100 / golden.inputs.fxUsdUah
    expect(byGoal("savings.cushion")).toBeCloseTo(E.goals.rows[0].contributionUsd, 1)
    expect(byGoal("savings.pension")).toBeCloseTo(E.goals.rows[2].contributionUsd, 1)
  })
})

describe("plan items (the monthly todo list)", () => {
  const sum = (pred: (i: (typeof plan.items)[number]) => boolean) =>
    plan.items.filter(pred).reduce((s, i) => s + i.plan, 0)

  it("each person's items add up exactly to their targets, to the kopiyka", () => {
    for (const m of MEMBERS) {
      expect(sum((i) => i.member === m && i.kind === "savings")).toBe(Math.round(plan.savingsTargetUah[m] * 100))
      expect(sum((i) => i.member === m && i.kind === "zone")).toBe(Math.round(plan.shared.zoneUah[m] * 100))
    }
  })

  it("jar items per person sum to their top-up, and jars are fully funded", () => {
    for (const m of MEMBERS) {
      expect(Math.abs(sum((i) => i.member === m && i.kind === "jar") - plan.shared.topUpJarsUah[m] * 100)).toBeLessThanOrEqual(3)
    }
    expect(sum((i) => i.kind === "jar")).toBe(Math.round(plan.shared.jarsUah * 100))
  })

  it("item ids are unique per person", () => {
    const ids = plan.items.map((i) => `${i.member}:${i.key}`)
    expect(new Set(ids).size).toBe(ids.length)
  })
})

describe("progress & settle-up", () => {
  const entry = (p: Partial<Entry>): Entry => ({
    id: Math.random().toString(36),
    month: "2026-12",
    member: "ostap",
    itemKey: "savings.apartment",
    amount: 0,
    paidOn: "2026-12-07",
    note: null,
    createdAt: "2026-12-07T10:00:00Z",
    ...p,
  })

  it("installments from two paychecks close an item", () => {
    const apt = plan.items.find((i) => i.member === "ostap" && i.key === "savings.apartment")!
    const half = Math.floor(apt.plan / 2)
    const p1 = summarize(config, plan, [entry({ amount: half })])
    expect(p1.items.find((i) => i.id === "ostap:savings.apartment")!.status).toBe("partial")
    const p2 = summarize(config, plan, [entry({ amount: half }), entry({ amount: apt.plan - half, paidOn: "2026-12-22" })])
    const it2 = p2.items.find((i) => i.id === "ostap:savings.apartment")!
    expect(it2.status).toBe("done")
    expect(it2.left).toBe(0)
    expect(p2.timeline[6].ostap).toBe(half)
    expect(p2.timeline[21].ostap).toBe(apt.plan)
  })

  it("settle-up: no shared entries → nothing to settle", () => {
    expect(settleUp(config, plan, [entry({ amount: 100_00 })]).kind).toBe("none")
  })

  it("settle-up: when Olena carries everything, Ostap compensates his share", () => {
    const s = settleUp(config, plan, [entry({ member: "olena", itemKey: "zone.groceries", amount: 10_000_00 })])
    expect(s).toEqual({ kind: "transfer", from: "ostap", to: "olena", amount: Math.round(10_000_00 * plan.incomeShare.ostap) })
  })

  it("settle-up: paying exactly by plan is even", () => {
    const shared = plan.items.filter((i) => i.kind !== "savings").map((i) => entry({ member: i.member, itemKey: i.key, amount: i.plan }))
    expect(settleUp(config, plan, shared).kind).toBe("even")
  })
})

describe("money helpers", () => {
  it("splitKop keeps the total exact", () => {
    expect(splitKop(100, [1, 1, 1])).toEqual([34, 33, 33])
    expect(splitKop(1000, [0.2, 0.5, 0.3]).reduce((a, b) => a + b)).toBe(1000)
    expect(splitKop(1000, [0, 0])).toEqual([0, 0])
  })
  it("parses and formats UAH", () => {
    expect(parseUahInput("12 500")).toBe(1_250_000)
    expect(parseUahInput("12,5к")).toBe(1_250_000)
    expect(parseUahInput("-5")).toBeNull()
    expect(formatUah(12_345_600)).toBe("123 456 ₴")
    expect(formatUah(-50_000, { sign: true })).toBe("−500 ₴")
  })
})
