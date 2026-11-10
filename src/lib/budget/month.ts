const NAMES = ["Січень", "Лютий", "Березень", "Квітень", "Травень", "Червень", "Липень", "Серпень", "Вересень", "Жовтень", "Листопад", "Грудень"]
const GENITIVE = ["січня", "лютого", "березня", "квітня", "травня", "червня", "липня", "серпня", "вересня", "жовтня", "листопада", "грудня"]
const SHORT = ["січ", "лют", "бер", "кві", "тра", "чер", "лип", "сер", "вер", "жов", "лис", "гру"]

export const MONTH_RE = /^\d{4}-(0[1-9]|1[0-2])$/
export const TZ = "Europe/Kyiv"

/** Today as YYYY-MM-DD in Kyiv. */
export function today(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date())
}
export const currentMonth = () => today().slice(0, 7)

export function addMonths(month: string, n: number): string {
  const [y, m] = month.split("-").map(Number)
  const d = new Date(Date.UTC(y, m - 1 + n, 1))
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`
}

export const monthName = (month: string) => NAMES[Number(month.slice(5, 7)) - 1]
/** "листопада" — for "протягом листопада", "7 листопада". */
export const monthGenitive = (month: string) => GENITIVE[Number(month.slice(5, 7)) - 1]
export const monthLabel = (month: string) => `${monthName(month)} ${month.slice(0, 4)}`

/** "2026-11-07" → "7 лис" */
export const shortDate = (iso: string) => `${Number(iso.slice(8, 10))} ${SHORT[Number(iso.slice(5, 7)) - 1]}`

/** Sensible default date for a new entry in a given month. */
export function defaultPaidOn(month: string): string {
  const t = today()
  if (t.startsWith(month)) return t
  const [y, m] = month.split("-").map(Number)
  if (month < t.slice(0, 7)) return `${month}-${String(new Date(Date.UTC(y, m, 0)).getUTCDate()).padStart(2, "0")}`
  return `${month}-01`
}
