"use client"

import { cn } from "cn"
import { Plus, X } from "lucide-react"
import { Card } from "@/components/ui/card"
import { config, type MemberId } from "@/lib/budget/config"
import { formatUah } from "@/lib/budget/money"
import { shortDate } from "@/lib/budget/month"
import type { ItemKind } from "@/lib/budget/plan"
import type { ItemProgress } from "@/lib/budget/progress"
import { Avatar } from "./avatar"
import { useDashboard } from "./dashboard"
import { Ring } from "./ring"

export const SECTIONS: { kind: ItemKind; title: string; hint: string }[] = [
  { kind: "savings", title: "Відкласти", hint: "37% доходу → цілі" },
  { kind: "jar", title: "Банки", hint: "Спільні конверти" },
  { kind: "zone", title: "Моя зона", hint: "Спільні витрати, які я плачу" },
]

export function PersonColumn({ member }: { member: MemberId }) {
  const { progress, plan } = useDashboard()
  const me = progress.byMember[member]
  const items = progress.items.filter((i) => i.member === member && (i.plan > 0 || i.done > 0))
  const override = plan.overrides[member]

  return (
    <Card className="gap-0 py-0" data-testid={`column-${member}`}>
      <div className="flex items-center gap-3 px-5 pt-5 pb-4">
        <Avatar member={member} size="lg" />
        <div className="min-w-0 flex-1">
          <h2 className="text-base font-semibold tracking-tight">{config.members[member].name}</h2>
          <p className="text-xs text-muted-foreground tabular-nums">
            {me.itemsDone} з {me.itemsTotal} закрито · {formatUah(me.done)} з {formatUah(me.plan)}
          </p>
        </div>
      </div>
      {override && (
        <p className="tilt-l mx-5 mb-3 rounded-lg bg-foreground px-2.5 py-1.5 text-xs text-background">
          Цього місяця особливий план: {override.note}
        </p>
      )}
      {SECTIONS.map((s) => {
        const list = items.filter((i) => i.kind === s.kind)
        if (list.length === 0) return null
        const t = progress.bySection[s.kind][member]
        return (
          <section key={s.kind} className="border-t border-black/[0.06] px-2 py-3">
            <div className="flex items-baseline justify-between px-3 pb-1.5">
              <h3 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">{s.title}</h3>
              <span className="text-xs text-muted-foreground tabular-nums">
                {formatUah(t.done)} / {formatUah(t.plan)}
              </span>
            </div>
            <ul>
              {list.map((it) => (
                <ItemRow key={it.id} item={it} />
              ))}
            </ul>
          </section>
        )
      })}
    </Card>
  )
}

function ItemRow({ item }: { item: ItemProgress }) {
  const { openEntry, closeItem, removeEntry, pending } = useDashboard()
  const ratio = item.plan > 0 ? item.done / item.plan : item.done > 0 ? 1 : 0
  const done = item.status === "done"

  return (
    <li className="group/item rounded-xl px-1 transition-colors hover:bg-black/[0.025]" data-testid={`item-${item.id}`}>
      <div className="flex items-center gap-2.5 py-1.5 pr-1 pl-2">
        <button
          type="button"
          disabled={done || pending}
          onClick={() => closeItem(item)}
          aria-label={done ? `${item.name}: закрито` : `Закрити ${item.name}: внести ${formatUah(item.left)}`}
          title={done ? "Закрито" : `Внести залишок ${formatUah(item.left)}`}
          className="rounded-full outline-none focus-visible:ring-3 focus-visible:ring-ring/50 enabled:cursor-pointer enabled:hover:scale-110 transition-transform"
        >
          <Ring value={ratio} member={item.member} />
        </button>
        <button
          type="button"
          className="flex min-w-0 flex-1 items-baseline justify-between gap-3 text-left"
          onClick={() => openEntry({ member: item.member, itemKey: item.key })}
        >
          <span className={cn("truncate text-sm", done && "text-muted-foreground line-through decoration-black/20")}>
            {item.emoji && <span className="mr-1.5">{item.emoji}</span>}
            {item.name}
          </span>
          <span className="shrink-0 text-sm tabular-nums">
            {item.status === "partial" ? (
              <>
                <span className="font-medium">{formatUah(item.done)}</span>
                <span className="text-muted-foreground"> / {formatUah(item.plan)}</span>
              </>
            ) : (
              <span className={cn(done ? "text-muted-foreground" : "font-medium")}>{formatUah(item.plan || item.done)}</span>
            )}
          </span>
        </button>
        <button
          type="button"
          onClick={() => openEntry({ member: item.member, itemKey: item.key })}
          aria-label={`Додати внесок: ${item.name}`}
          className="grid size-6 place-items-center rounded-md text-muted-foreground opacity-0 transition group-hover/item:opacity-100 hover:bg-black/5 focus-visible:opacity-100"
        >
          <Plus className="size-3.5" />
        </button>
      </div>
      {item.entries.length > 0 && (
        <ul className="flex flex-wrap gap-1.5 pb-2 pl-11">
          {item.entries.map((e) => (
            <li
              key={e.id}
              className="group/chip flex items-center gap-1 rounded-md bg-black/[0.04] py-0.5 pr-0.5 pl-1.5 text-[11px] text-muted-foreground tabular-nums"
              title={e.note ?? undefined}
            >
              {shortDate(e.paidOn)} · <span className="text-foreground">{formatUah(e.amount)}</span>
              <button
                type="button"
                onClick={() => removeEntry(e)}
                disabled={pending}
                aria-label={`Видалити внесок ${formatUah(e.amount)} від ${shortDate(e.paidOn)}`}
                className="grid size-4 place-items-center rounded opacity-40 hover:bg-black/10 hover:opacity-100"
              >
                <X className="size-3" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </li>
  )
}
