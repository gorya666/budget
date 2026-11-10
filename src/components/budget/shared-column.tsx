"use client"

import { cn } from "cn"
import { ArrowRight, Plus, Trash2 } from "lucide-react"
import { useOptimistic, useState, useTransition } from "react"
import { addTask, deleteTask, toggleTask } from "@/app/actions"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { config, type MemberId, MEMBERS } from "@/lib/budget/config"
import { formatUah } from "@/lib/budget/money"
import type { Tally, Task } from "@/lib/budget/progress"
import { Avatar } from "./avatar"
import { useDashboard } from "./dashboard"

export function SharedColumn({ tasks, className }: { tasks: Task[]; className?: string }) {
  return (
    <div className={cn("flex flex-col gap-5", className)}>
      <Categories />
      <SettleCard />
      <Tasks tasks={tasks} />
    </div>
  )
}

function SplitBar({ total, byMember, label }: { total: Tally; byMember: Record<MemberId, Tally>; label: string }) {
  const denom = Math.max(total.plan, total.done, 1)
  return (
    <div
      className="flex h-2 w-full gap-0.5 overflow-hidden rounded-full depth-well"
      role="img"
      aria-label={`${label}: ${MEMBERS.map((m) => `${config.members[m].name} ${formatUah(byMember[m].done)}`).join(", ")} з ${formatUah(total.plan)}`}
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
  )
}

function Categories() {
  const { progress } = useDashboard()
  const zone = progress.bySection.zone
  const groups = [
    { title: "Цілі", rows: progress.categories.filter((c) => c.kind === "savings") },
    { title: "Банки", rows: progress.categories.filter((c) => c.kind === "jar") },
  ]
  return (
    <Card className="gap-4 px-5 py-5">
      <div>
        <h2 className="text-base font-semibold tracking-tight">Разом</h2>
        <p className="text-xs text-muted-foreground">Спільний прогрес по кожній категорії</p>
      </div>
      {groups.map((g) => (
        <div key={g.title} className="flex flex-col gap-3">
          <h3 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">{g.title}</h3>
          {g.rows.map((c) => (
            <div key={c.key} className="flex flex-col gap-1.5">
              <div className="flex items-baseline justify-between gap-2 text-sm">
                <span>
                  {c.emoji && <span className="mr-1.5">{c.emoji}</span>}
                  {c.name}
                </span>
                <span className="tabular-nums">
                  <span className="font-medium">{formatUah(c.total.done)}</span>
                  <span className="text-muted-foreground"> / {formatUah(c.total.plan)}</span>
                </span>
              </div>
              <SplitBar total={c.total} byMember={c.byMember} label={c.name} />
            </div>
          ))}
        </div>
      ))}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-baseline justify-between gap-2 text-sm">
          <h3 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">Спільні витрати</h3>
          <span className="tabular-nums">
            <span className="font-medium">{formatUah(zone.all.done)}</span>
            <span className="text-muted-foreground"> / {formatUah(zone.all.plan)}</span>
          </span>
        </div>
        <SplitBar total={zone.all} byMember={{ ostap: zone.ostap, olena: zone.olena }} label="Спільні витрати" />
      </div>
    </Card>
  )
}

function SettleCard() {
  const { progress } = useDashboard()
  const s = progress.settle
  return (
    <Card className="gap-2 px-5 py-4">
      <h2 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">Хто кому компенсує</h2>
      {s.kind === "none" && <p className="text-sm text-muted-foreground">Порахуємо, щойно зʼявляться спільні витрати чи банки.</p>}
      {s.kind === "even" && (
        <p className="text-sm">
          <span className="tilt-l mr-2 inline-block rounded-md bg-foreground px-1.5 py-0.5 text-xs font-semibold text-background">
            ≈ порівну
          </span>
          Ніхто нікому нічого не винен 🤝
        </p>
      )}
      {s.kind === "transfer" && (
        <div className="flex items-center gap-3">
          <Avatar member={s.from} />
          <ArrowRight className="size-4 text-muted-foreground" />
          <Avatar member={s.to} />
          <p className="ml-1 text-sm">
            <span className="font-semibold tabular-nums">{formatUah(s.amount)}</span>
            <span className="block text-xs text-muted-foreground">
              {config.members[s.from].name} → {config.members[s.to].name} на зараз, щоб вийшло пропорційно доходу
            </span>
          </p>
        </div>
      )}
    </Card>
  )
}

function Tasks({ tasks }: { tasks: Task[] }) {
  const { month } = useDashboard()
  const [title, setTitle] = useState("")
  const [assignee, setAssignee] = useState<MemberId | null>(null)
  const [, start] = useTransition()
  const [optimistic, apply] = useOptimistic(tasks, (state: Task[], patch: { id: string; done?: boolean; remove?: boolean }) =>
    patch.remove ? state.filter((t) => t.id !== patch.id) : state.map((t) => (t.id === patch.id ? { ...t, done: !!patch.done } : t)),
  )

  const submit = () => {
    const t = title.trim()
    if (!t) return
    setTitle("")
    start(async () => addTask({ month, title: t, assignee }))
  }
  const cycle = () => setAssignee((a) => (a === null ? "ostap" : a === "ostap" ? "olena" : null))
  const doneCount = optimistic.filter((t) => t.done).length

  return (
    <Card className="gap-3 px-5 py-5">
      <div className="flex items-baseline justify-between">
        <h2 className="text-base font-semibold tracking-tight">Задачі місяця</h2>
        {optimistic.length > 0 && (
          <span className="text-xs text-muted-foreground tabular-nums">
            {doneCount}/{optimistic.length}
          </span>
        )}
      </div>
      <ul className="flex flex-col">
        {optimistic.map((t) => (
          <li key={t.id} className="group/task flex items-center gap-2.5 rounded-lg px-1 py-1.5 hover:bg-black/[0.025]">
            <Checkbox
              checked={t.done}
              onCheckedChange={(v) =>
                start(async () => {
                  apply({ id: t.id, done: !!v })
                  await toggleTask({ id: t.id, month, done: !!v })
                })
              }
              aria-label={t.title}
            />
            <span className={cn("flex-1 text-sm", t.done && "text-muted-foreground line-through decoration-black/20")}>{t.title}</span>
            {t.assignee && <Avatar member={t.assignee} size="xs" />}
            <button
              type="button"
              aria-label={`Видалити задачу ${t.title}`}
              className="text-muted-foreground opacity-0 group-hover/task:opacity-100 focus-visible:opacity-100"
              onClick={() =>
                start(async () => {
                  apply({ id: t.id, remove: true })
                  await deleteTask({ id: t.id, month })
                })
              }
            >
              <Trash2 className="size-3.5" />
            </button>
          </li>
        ))}
        {optimistic.length === 0 && (
          <li className="py-1 text-sm text-muted-foreground">Наприклад: «купити ОВДП на $1 730» чи «закрити борг».</li>
        )}
      </ul>
      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault()
          submit()
        }}
      >
        <button
          type="button"
          onClick={cycle}
          aria-label={`Відповідальний: ${assignee ? config.members[assignee].name : "обоє"}`}
          title="Хто відповідає (клікни, щоб змінити)"
          className="grid size-10 shrink-0 place-items-center rounded-lg depth-well"
        >
          {assignee ? <Avatar member={assignee} size="sm" /> : <span className="text-xs text-muted-foreground">обоє</span>}
        </button>
        <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Нова задача…" aria-label="Нова задача" />
        <Button type="submit" variant="outline" size="icon" className="size-10" aria-label="Додати задачу">
          <Plus />
        </Button>
      </form>
    </Card>
  )
}
