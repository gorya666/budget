"use client"

import { cn } from "cn"
import { X } from "lucide-react"
import { useState, useTransition } from "react"
import { toast } from "sonner"
import { addEntry } from "@/app/actions"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { config, type MemberId, MEMBERS } from "@/lib/budget/config"
import { formatUah, parseUahInput } from "@/lib/budget/money"
import { defaultPaidOn, shortDate } from "@/lib/budget/month"
import { Avatar } from "./avatar"
import { useDashboard } from "./dashboard"

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
  const { month, progress, removeEntry } = useDashboard()
  // Initialised from the prefill; the parent remounts this (via `key`) on every open.
  const [member, setMember] = useState<MemberId>(prefill?.member ?? "ostap")
  const [itemKey, setItemKey] = useState<string | null>(prefill?.itemKey ?? null)
  const [amount, setAmount] = useState("")
  const [paidOn, setPaidOn] = useState(() => defaultPaidOn(month))
  const [pending, start] = useTransition()

  const items = progress.items.filter((i) => i.member === member && (i.plan > 0 || i.done > 0))
  const selected = items.find((i) => i.key === itemKey) ?? null
  const kop = parseUahInput(amount)

  const submit = () => {
    if (!selected || !kop) return
    start(async () => {
      try {
        await addEntry({ month, member, itemKey: selected.key, amount: kop, paidOn, note: null })
        toast(`${selected.emoji} ${config.members[member].name} · ${selected.name}: +${formatUah(kop)}`)
        onOpenChange(false)
      } catch {
        toast.error("Не вдалося зберегти. Спробуй ще раз.")
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92dvh] gap-5 overflow-y-auto rounded-3xl p-6 sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-lg">Внесок</DialogTitle>
          <DialogDescription className="sr-only">Хто, куди і скільки</DialogDescription>
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
                onClick={() => setMember(m)}
                className={cn(
                  "pressable flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm font-medium",
                  member === m ? "depth-surface" : "border border-transparent text-muted-foreground opacity-60 hover:opacity-100",
                )}
              >
                <Avatar member={m} size="sm" straight={member !== m} />
                {config.members[m].name}
              </button>
            ))}
          </fieldset>

          <fieldset className="flex flex-wrap gap-1.5">
            <legend className="sr-only">Куди</legend>
            {items.map((i) => (
              <button
                key={i.key}
                type="button"
                aria-pressed={itemKey === i.key}
                onClick={() => setItemKey(i.key)}
                className={cn(
                  "pressable rounded-lg px-2.5 py-1.5 text-sm",
                  itemKey === i.key ? "depth-ink text-white" : "border border-transparent bg-black/[0.04] hover:bg-black/[0.07]",
                )}
              >
                <span className="mr-1">{i.emoji}</span>
                {i.name}
              </button>
            ))}
          </fieldset>

          <div className="flex flex-col gap-2">
            <Label htmlFor="amount">Скільки, ₴</Label>
            <Input
              id="amount"
              inputMode="decimal"
              placeholder="20 000 або 20к"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="h-12 text-xl font-semibold tabular-nums placeholder:text-base placeholder:font-normal md:text-xl"
              aria-invalid={amount !== "" && !kop}
            />
            {selected && selected.left > 0 && (
              <button
                type="button"
                onClick={() => setAmount(String(selected.left / 100))}
                className="pressable self-start rounded-lg bg-black/[0.04] px-2.5 py-1 text-xs tabular-nums hover:bg-black/[0.07]"
              >
                Весь залишок · {formatUah(selected.left)}
              </button>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="paidOn">Коли</Label>
            <Input
              id="paidOn"
              type="date"
              min={`${month}-01`}
              max={`${month}-31`}
              value={paidOn}
              onChange={(e) => setPaidOn(e.target.value)}
            />
          </div>

          <Button type="submit" size="lg" disabled={!selected || !kop || pending} className="w-full">
            {selected && kop ? `Додати ${formatUah(kop)}` : selected ? "Вкажи суму" : "Обери, куди"}
          </Button>
        </form>

        {selected && selected.entries.length > 0 && (
          <div className="flex flex-col gap-1 border-t border-black/[0.06] pt-4">
            <p className="text-xs text-muted-foreground">Вже внесено цього місяця</p>
            <ul>
              {selected.entries.map((e) => (
                <li key={e.id} className="flex items-center py-1 text-sm tabular-nums">
                  <span className="text-muted-foreground">{shortDate(e.paidOn)}</span>
                  <span className="ml-auto">{formatUah(e.amount)}</span>
                  <button
                    type="button"
                    onClick={() => removeEntry(e)}
                    aria-label={`Видалити внесок ${formatUah(e.amount)} від ${shortDate(e.paidOn)}`}
                    className="ml-2 grid size-6 place-items-center rounded-md text-muted-foreground hover:bg-black/5 hover:text-foreground"
                  >
                    <X className="size-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
