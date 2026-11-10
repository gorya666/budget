"use client"

import { cn } from "cn"
import { config, type MemberId } from "@/lib/budget/config"
import { formatUah } from "@/lib/budget/money"
import type { ItemProgress } from "@/lib/budget/progress"
import { Avatar } from "./avatar"
import { useDashboard } from "./dashboard"
import { Ring } from "./ring"

/** One person's goal for the month and the five things it's made of. */
export function PersonCard({ member }: { member: MemberId }) {
  const { progress, plan } = useDashboard()
  const me = progress.byMember[member]
  const items = progress.items.filter((i) => i.member === member && (i.plan > 0 || i.done > 0))
  const override = plan.overrides[member]
  const pct = me.plan > 0 ? Math.min(100, (me.done / me.plan) * 100) : 0

  return (
    <section className="depth-card flex flex-col rounded-3xl" data-testid={`column-${member}`}>
      <header className="flex flex-col gap-4 px-6 pt-6 pb-5">
        <div className="flex items-center gap-3">
          <Avatar member={member} size="lg" />
          <h2 className="text-lg font-semibold tracking-tight">{config.members[member].name}</h2>
        </div>
        <div>
          <p className="text-2xl font-semibold tracking-tight tabular-nums">
            {formatUah(me.done)}
            <span className="text-base font-normal text-muted-foreground"> з {formatUah(me.plan)}</span>
          </p>
          <div className="depth-well mt-2.5 h-1.5 w-full overflow-hidden rounded-full">
            <div
              className={cn(
                "h-full origin-left rounded-full transition-transform duration-500 ease-(--ease-out-strong)",
                member === "ostap" ? "bg-ostap" : "stripes",
              )}
              style={{ transform: `scaleX(${pct / 100})` }}
            />
          </div>
          {override && <p className="mt-2 text-xs text-muted-foreground">Цього місяця менше: {override.note.toLowerCase()}</p>}
        </div>
      </header>
      <ul className="flex flex-col border-t border-black/[0.06] p-2">
        {items.map((it) => (
          <Row key={it.id} item={it} />
        ))}
      </ul>
    </section>
  )
}

function Row({ item }: { item: ItemProgress }) {
  const { openEntry, closeItem, pending } = useDashboard()
  const ratio = item.plan > 0 ? item.done / item.plan : item.done > 0 ? 1 : 0
  const done = item.status === "done"

  return (
    <li className="flex items-center gap-3 rounded-2xl px-3 py-2 transition-colors duration-150 hover:bg-black/[0.025]" data-testid={`item-${item.id}`}>
      <button
        type="button"
        disabled={done || pending}
        onClick={() => closeItem(item)}
        aria-label={done ? `${item.name}: закрито` : `Закрити ${item.name}: внести ${formatUah(item.left)}`}
        title={done ? "Закрито" : `Внести залишок ${formatUah(item.left)}`}
        className="pressable rounded-full outline-none focus-visible:ring-3 focus-visible:ring-ring/50 enabled:cursor-pointer"
      >
        <Ring value={ratio} member={item.member} size={28} />
      </button>
      <button
        type="button"
        className="pressable flex min-w-0 flex-1 items-baseline justify-between gap-3 py-1 text-left"
        onClick={() => openEntry({ member: item.member, itemKey: item.key })}
        title={item.note}
      >
        <span className={cn("truncate", done && "text-muted-foreground")}>
          <span className="mr-2">{item.emoji}</span>
          {item.name}
        </span>
        <span className="shrink-0 tabular-nums">
          {item.status === "partial" ? (
            <>
              {formatUah(item.done)}
              <span className="text-muted-foreground"> / {formatUah(item.plan)}</span>
            </>
          ) : (
            <span className={cn(done && "text-muted-foreground")}>{formatUah(item.plan || item.done)}</span>
          )}
        </span>
      </button>
    </li>
  )
}
