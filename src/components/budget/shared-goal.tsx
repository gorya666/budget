"use client"

import NumberFlow from "@number-flow/react"
import { cn } from "cn"
import { config, MEMBERS } from "@/lib/budget/config"
import { formatUah } from "@/lib/budget/money"
import { monthName } from "@/lib/budget/month"
import { Avatar } from "./avatar"
import { useDashboard } from "./dashboard"

/** The one goal above both of us: everything planned this month, closed together. */
export function SharedGoal() {
  const { month, progress } = useDashboard()
  const { total, byMember, settle } = progress
  const denom = Math.max(total.plan, total.done, 1)
  const pct = total.plan > 0 ? Math.min(100, Math.round((total.done / total.plan) * 100)) : 0

  return (
    <section className="depth-card flex flex-col gap-5 rounded-3xl px-6 py-6 md:px-8">
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-2">
        <div>
          <p className="text-sm text-muted-foreground">Разом за {monthName(month).toLowerCase()}</p>
          <div className="text-5xl font-semibold tracking-tight md:text-6xl">
            <NumberFlow value={Math.round(total.done / 100)} locales="uk-UA" suffix=" ₴" />
          </div>
        </div>
        <p className="pb-1.5 text-sm text-muted-foreground tabular-nums">
          з {formatUah(total.plan)} · <span className="font-medium text-foreground">{pct}%</span>
        </p>
      </div>

      <div className="flex flex-col gap-2.5">
        <div
          className="depth-well flex h-3 w-full gap-0.5 overflow-hidden rounded-full"
          role="img"
          aria-label={`Закрито ${formatUah(total.done)} з ${formatUah(total.plan)}`}
        >
          {MEMBERS.map((m) =>
            byMember[m].done > 0 ? (
              <div
                key={m}
                className={cn("h-full rounded-full transition-[width] duration-700", m === "ostap" ? "bg-ostap" : "stripes")}
                style={{ width: `${(byMember[m].done / denom) * 100}%` }}
              />
            ) : null,
          )}
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
          <ul className="flex gap-4" aria-label="Легенда">
            {MEMBERS.map((m) => (
              <li key={m} className="flex items-center gap-1.5">
                <span className={cn("inline-block h-2 w-3 rounded-full", m === "ostap" ? "bg-ostap" : "stripes")} aria-hidden />
                {config.members[m].name}
              </li>
            ))}
          </ul>
          {settle.kind === "transfer" && (
            <p className="flex items-center gap-1.5">
              <Avatar member={settle.from} size="xs" straight />→<Avatar member={settle.to} size="xs" straight />
              <span className="font-medium text-foreground tabular-nums">{formatUah(settle.amount)}</span>
              за спільне, щоб вийшло пропорційно доходу
            </p>
          )}
        </div>
      </div>
    </section>
  )
}
