/** All money inside the app is integer kopiyky (1 ₴ = 100 kop). */
export type Kop = number

export const toKop = (uah: number): Kop => Math.round(uah * 100)
export const fromKop = (kop: Kop): number => kop / 100

/**
 * Split an integer amount by weights so the parts always sum back exactly
 * (largest-remainder method). Zero/negative weights get 0.
 */
export function splitKop(total: Kop, weights: number[]): Kop[] {
  const clean = weights.map((w) => (w > 0 ? w : 0))
  const sum = clean.reduce((a, b) => a + b, 0)
  if (sum === 0 || total <= 0) return clean.map(() => 0)
  const raw = clean.map((w) => (total * w) / sum)
  const floors = raw.map(Math.floor)
  let rest = total - floors.reduce((a, b) => a + b, 0)
  const order = raw
    .map((r, i) => ({ i, frac: r - Math.floor(r) }))
    .sort((a, b) => b.frac - a.frac)
  for (const { i } of order) {
    if (rest <= 0) break
    floors[i] += 1
    rest -= 1
  }
  return floors
}

const uahFmt = new Intl.NumberFormat("uk-UA", { maximumFractionDigits: 0 })

/** 12345600 kop → "123 456 ₴" */
export function formatUah(kop: Kop, opts: { sign?: boolean } = {}): string {
  const uah = Math.round(kop / 100)
  const s = uahFmt.format(Math.abs(uah)).replace(/ /g, " ")
  const sign = uah < 0 ? "−" : opts.sign && uah > 0 ? "+" : ""
  return `${sign}${s} ₴`
}

/** Parse user input like "12 500", "12500,50", "12.5k" into kop. */
export function parseUahInput(input: string): Kop | null {
  const s = input.trim().toLowerCase().replace(/\s| /g, "").replace(",", ".")
  if (!s) return null
  const m = s.match(/^(\d+(?:\.\d+)?)(k|к)?$/)
  if (!m) return null
  const n = Number(m[1]) * (m[2] ? 1000 : 1)
  if (!Number.isFinite(n) || n <= 0) return null
  return toKop(n)
}
