"use client"

import NumberFlow from "@number-flow/react"
import { cn } from "cn"
import { Card } from "@/components/ui/card"
import { config, MEMBERS } from "@/lib/budget/config"
import { formatUah } from "@/lib/budget/money"
import { monthName } from "@/lib/budget/month"
import { Avatar } from "./avatar"
import { useDashboard } from "./dashboard"

const pct = (done: number, plan: number) => (plan > 0 ? Math.min(100, Math.round((done / plan) * 100)) : 0)

export function Hero({ className }: { className?: string }) {
  const { month, progress } = useDashboard()
  const { total, byMember } = progress
  const itemsDone = MEMBERS.reduce((s, m) => s + byMember[m].itemsDone, 0)
  const itemsTotal = MEMBERS.reduce((s, m) => s + byMember[m].itemsTotal, 0)
  const denom = Math.max(total.plan, total.done, 1)

  return (
    <Card className={cn("justify-between gap-6 px-6 py-6", className)}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">Закрито за {monthName(month).toLowerCase()}</p>
          <div className="mt-1 text-5xl font-semibold tracking-tight md:text-6xl">
            <NumberFlow value={Math.round(total.done / 100)} locales="uk-UA" suffix=" ₴" />
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            з {formatUah(total.plan)} плану · {pct(total.done, total.plan)}%
          </p>
        </div>
        <div className="tilt-r depth-surface shrink-0 rounded-xl px-3 py-2 text-center">
          <div className="text-xl font-semibold tabular-nums">
            {itemsDone}
            <span className="text-muted-foreground">/{itemsTotal}</span>
          </div>
          <div className="text-[11px] text-muted-foreground">задач</div>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <div
          className="flex h-2 w-full gap-0.5 overflow-hidden rounded-full depth-well"
          role="img"
          aria-label={MEMBERS.map((m) => `${config.members[m].name}: ${formatUah(byMember[m].done)}`).join(", ")}
        >
          {MEMBERS.map((m) => (
            <div
              key={m}
              className={cn("h-full rounded-full transition-[width] duration-700", m === "ostap" ? "bg-ostap" : "stripes")}
              style={{ width: `${(byMember[m].done / denom) * 100}%` }}
            />
          ))}
        </div>
        <ul className="grid grid-cols-2 gap-3">
          {MEMBERS.map((m) => (
            <li key={m} className="flex items-center gap-2.5">
              <Avatar member={m} size="sm" />
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 text-sm font-medium">
                  <span className={cn("inline-block h-2 w-3 rounded-full", m === "ostap" ? "bg-ostap" : "stripes")} aria-hidden />
                  {config.members[m].name}
                  <span className="text-muted-foreground tabular-nums">{pct(byMember[m].done, byMember[m].plan)}%</span>
                </div>
                <div className="truncate text-xs text-muted-foreground tabular-nums">
                  {formatUah(byMember[m].done)} з {formatUah(byMember[m].plan)}
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </Card>
  )
}
