/**
 * Budget configuration, transcribed 1:1 from the source spreadsheet
 * (data/source/budget-sheet-2026-10.xlsx). See docs/SPEC.md.
 *
 * Amounts are in the currency they are stated in; conversion to UAH
 * happens in plan.ts using the month's exchange rate.
 */

export type MemberId = "ostap" | "olena"
export const MEMBERS: MemberId[] = ["ostap", "olena"]

export type Currency = "UAH" | "USD"

export type Member = {
  id: MemberId
  name: string
  initial: string
  incomeUsd: number
  savingsRate: number
  personalFixedUah: number
}

export type GoalId = "cushion" | "apartment" | "pension"
export type Goal = { id: GoalId; name: string; emoji: string; share: number }

export type Jar = { id: string; name: string; emoji: string; amount: number; currency: Currency; note?: string }

export type ZoneItem = { id: string; payer: MemberId; name: string; amount: number; currency: Currency; note?: string }

/**
 * One-off months where a member's savings target differs from the normal
 * rule (e.g. Olena's tax debt in Oct–Nov 2026). The savings target becomes
 * whatever is left after shared costs, adjusted personal costs and the debt.
 */
export type SavingsOverride = {
  personalFixedDeltaUah: number
  debtPaymentUah: number
  note: string
}

export type BudgetConfig = {
  defaultFxUsdUah: number
  members: Record<MemberId, Member>
  goals: Goal[]
  jars: Jar[]
  zoneItems: ZoneItem[]
  /** key: YYYY-MM */
  savingsOverrides: Record<string, Partial<Record<MemberId, SavingsOverride>>>
  /** Settle-up differences smaller than this are shown as "≈ even". */
  settleToleranceUah: number
}

export const config: BudgetConfig = {
  defaultFxUsdUah: 44.7,
  members: {
    ostap: { id: "ostap", name: "Остап", initial: "О", incomeUsd: 5700, savingsRate: 0.37, personalFixedUah: 25850 },
    olena: { id: "olena", name: "Лєна", initial: "Л", incomeUsd: 3650, savingsRate: 0.37, personalFixedUah: 39850 },
  },
  goals: [
    { id: "cushion", name: "Подушка", emoji: "🛟", share: 0.2 },
    { id: "apartment", name: "Квартира", emoji: "🏠", share: 0.5 },
    { id: "pension", name: "Пенсія", emoji: "🧓", share: 0.3 },
  ],
  jars: [
    { id: "travel", name: "Подорожі", emoji: "✈️", amount: 3000 / 12, currency: "USD", note: "$3 000 на рік" },
    { id: "home", name: "Для дому", emoji: "🪴", amount: 120, currency: "USD", note: "Посуд, девайси" },
    { id: "emergency", name: "Непередбачене", emoji: "🧯", amount: 6000, currency: "UAH", note: "Операції, поломки" },
  ],
  zoneItems: [
    { id: "groceries", payer: "olena", name: "Продукти", amount: 30000, currency: "UAH" },
    { id: "cleaning", payer: "olena", name: "Прибиральниця", amount: 3 * 2300, currency: "UAH", note: "3 × 2 300" },
    { id: "cats", payer: "olena", name: "Коти", amount: 5700, currency: "UAH" },
    { id: "household", payer: "olena", name: "Дім, побут", amount: 2500, currency: "UAH", note: "Хімія, дрібниці" },
    { id: "rent", payer: "ostap", name: "Оренда", amount: 36230, currency: "UAH" },
    { id: "cafe", payer: "ostap", name: "Кафе разом", amount: 12000, currency: "UAH" },
    { id: "fuel", payer: "ostap", name: "Машина: пальне", amount: 1000, currency: "UAH" },
    { id: "car-insurance", payer: "ostap", name: "Машина: страховка", amount: 40000 / 12, currency: "UAH", note: "40 000 на рік" },
    { id: "car-service", payer: "ostap", name: "Машина: обслуговування", amount: 35000 / 12, currency: "UAH", note: "35 000 на рік" },
    { id: "utilities", payer: "ostap", name: "Комуналка", amount: 5000, currency: "UAH" },
    { id: "internet", payer: "ostap", name: "Інтернет", amount: 500, currency: "UAH" },
    { id: "trading", payer: "ostap", name: "Навчання", amount: 3600, currency: "UAH" },
    { id: "streaming", payer: "ostap", name: "Megogo, YouTube", amount: 850, currency: "UAH" },
  ],
  savingsOverrides: {
    "2026-10": {
      olena: { personalFixedDeltaUah: 0, debtPaymentUah: 124000 / 2 - 50000, note: "Податковий борг: 62 000 − 50 000 від Остапа" },
    },
    "2026-11": {
      olena: { personalFixedDeltaUah: -(10000 - 5000), debtPaymentUah: 124000 / 2, note: "Податковий борг 62 000, косметолог 5 000" },
    },
  },
  settleToleranceUah: 500,
}
