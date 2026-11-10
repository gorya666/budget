"use client"

import { cn } from "cn"
import { useState, useTransition } from "react"
import { toast } from "sonner"
import { addEntry } from "@/app/actions"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { config, type MemberId, MEMBERS } from "@/lib/budget/config"
import { formatUah, parseUahInput } from "@/lib/budget/money"
import { defaultPaidOn } from "@/lib/budget/month"
import { Avatar } from "./avatar"
import { useDashboard } from "./dashboard"
import { SECTIONS } from "./person-column"

export type EntryPrefill = { member?: MemberId; itemKey?: string }

export function EntryDialog({
  open,
  prefill,
  onOpenChange,
}: {
  open: boolean
  prefill?: EntryPrefill
  onOpenChange: (open: boolean) => void
}) {
  const { month, progress } = useDashboard()
  // State is initialised from the prefill; the parent remounts this
  // component (via `key`) every time the dialog is opened.
  const [member, setMember] = useState<MemberId>(prefill?.member ?? "ostap")
  const [itemKey, setItemKey] = useState<string | null>(prefill?.itemKey ?? null)
  const [amount, setAmount] = useState("")
  const [paidOn, setPaidOn] = useState(() => defaultPaidOn(month))
  const [note, setNote] = useState("")
  const [pending, start] = useTransition()

  const items = progress.items.filter((i) => i.member === member && (i.plan > 0 || i.done > 0))
  const selected = items.find((i) => i.key === itemKey) ?? null
  const kop = parseUahInput(amount)

  const quick = selected && selected.left > 0
    ? [
        { label: "Залишок", kop: selected.left },
        ...(selected.left >= 200_00 ? [{ label: "½", kop: Math.round(selected.left / 2 / 100) * 100 }] : []),
      ]
    : []

  const submit = () => {
    if (!selected || !kop) return
    start(async () => {
      try {
        await addEntry({ month, member, itemKey: selected.key, amount: kop, paidOn, note: note.trim() || null })
        toast(`${selected.emoji ?? "✓"} ${config.members[member].name} · ${selected.name}: +${formatUah(kop)}`)
        onOpenChange(false)
      } catch {
        toast.error("Не вдалося зберегти. Спробуй ще раз.")
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92dvh] gap-5 overflow-y-auto rounded-3xl p-6 sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg">Новий внесок</DialogTitle>
          <DialogDescription>Можна частинами: з ЗП 7-го і з ЗП 22-го.</DialogDescription>
        </DialogHeader>

        <form
          className="flex flex-col gap-5"
          onSubmit={(e) => {
            e.preventDefault()
            submit()
          }}
        >
          <fieldset className="grid grid-cols-2 gap-2">
            <legend className="sr-only">Хто</legend>
            {MEMBERS.map((m) => (
              <button
                key={m}
                type="button"
                aria-pressed={member === m}
                onClick={() => {
                  setMember(m)
                  setItemKey(null)
                }}
                className={cn(
                  "flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition",
                  member === m ? "depth-surface" : "text-muted-foreground opacity-70 hover:opacity-100",
                )}
              >
                <Avatar member={m} size="sm" straight={member !== m} />
                {config.members[m].name}
              </button>
            ))}
          </fieldset>

          <div className="flex flex-col gap-3">
            {SECTIONS.map((s) => {
              const list = items.filter((i) => i.kind === s.kind)
              if (!list.length) return null
              return (
                <div key={s.kind}>
                  <p className="mb-1.5 text-xs font-semibold tracking-wide text-muted-foreground uppercase">{s.title}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {list.map((i) => (
                      <button
                        key={i.key}
                        type="button"
                        aria-pressed={itemKey === i.key}
                        onClick={() => setItemKey(i.key)}
                        className={cn(
                          "rounded-lg px-2.5 py-1.5 text-sm transition",
                          itemKey === i.key ? "depth-ink text-white" : "bg-black/[0.04] hover:bg-black/[0.07]",
                          i.status === "done" && itemKey !== i.key && "text-muted-foreground line-through decoration-black/20",
                        )}
                      >
                        {i.emoji && <span className="mr-1">{i.emoji}</span>}
                        {i.name}
                      </button>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex items-baseline justify-between">
              <Label htmlFor="amount">Сума, ₴</Label>
              {selected && (
                <span className="text-xs text-muted-foreground tabular-nums">
                  {formatUah(selected.done)} з {formatUah(selected.plan)} · лишилось {formatUah(selected.left)}
                </span>
              )}
            </div>
            <Input
              id="amount"
              inputMode="decimal"
              placeholder="напр. 20 000 або 20к"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="h-12 text-xl font-semibold tabular-nums placeholder:font-normal placeholder:text-base md:text-xl"
              aria-invalid={amount !== "" && !kop}
            />
            {quick.length > 0 && (
              <div className="flex gap-1.5">
                {quick.map((q) => (
                  <button
                    key={q.label}
                    type="button"
                    onClick={() => setAmount(String(q.kop / 100))}
                    className="rounded-lg bg-black/[0.04] px-2.5 py-1 text-xs tabular-nums hover:bg-black/[0.07]"
                  >
                    {q.label} · {formatUah(q.kop)}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-[auto_1fr] gap-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="paidOn">Дата</Label>
              <Input id="paidOn" type="date" min={`${month}-01`} max={`${month}-31`} value={paidOn} onChange={(e) => setPaidOn(e.target.value)} className="w-40" />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="note">Коментар</Label>
              <Input id="note" value={note} onChange={(e) => setNote(e.target.value)} placeholder="необовʼязково" maxLength={200} />
            </div>
          </div>

          <Button type="submit" size="lg" disabled={!selected || !kop || pending} className="w-full">
            {selected && kop ? `Додати ${formatUah(kop)}` : selected ? "Вкажи суму" : "Обери, куди"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
