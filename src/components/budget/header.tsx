"use client"

import { ChevronLeft, ChevronRight, Plus } from "lucide-react"
import Link from "next/link"
import { useState, useTransition } from "react"
import { toast } from "sonner"
import { setFx } from "@/app/actions"
import { Button, buttonVariants } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { addMonths, currentMonth, monthLabel } from "@/lib/budget/month"
import { Avatar } from "./avatar"
import { useDashboard } from "./dashboard"

export function Header({ fxIsDefault }: { fxIsDefault: boolean }) {
  const { month, openEntry } = useDashboard()
  const isCurrent = month === currentMonth()

  return (
    <header className="flex flex-wrap items-center gap-3">
      <div className="flex items-center gap-2.5">
        <div className="flex -space-x-1.5">
          <Avatar member="ostap" size="sm" />
          <Avatar member="olena" size="sm" />
        </div>
        <span className="font-semibold tracking-tight">Скарбничка</span>
      </div>

      <nav className="depth-surface order-3 flex flex-1 items-center justify-between gap-0.5 rounded-xl p-0.5 md:order-none md:ml-6 md:flex-none" aria-label="Місяць">
        <Link
          href={`/${addMonths(month, -1)}`}
          aria-label="Попередній місяць"
          className={buttonVariants({ variant: "ghost", size: "icon-sm" })}
        >
          <ChevronLeft />
        </Link>
        <span className="min-w-36 text-center text-sm font-medium tabular-nums">
          {monthLabel(month)}
          {!isCurrent && (
            <Link href="/" className="ml-1.5 text-xs text-muted-foreground underline-offset-2 hover:underline">
              сьогодні
            </Link>
          )}
        </span>
        <Link
          href={`/${addMonths(month, 1)}`}
          aria-label="Наступний місяць"
          className={buttonVariants({ variant: "ghost", size: "icon-sm" })}
        >
          <ChevronRight />
        </Link>
      </nav>

      <div className="order-4 md:order-none">
        <FxChip fxIsDefault={fxIsDefault} />
      </div>

      <Button size="lg" className="order-2 ml-auto md:order-none" onClick={() => openEntry()}>
        <Plus data-icon="inline-start" /> Внесок
      </Button>
    </header>
  )
}

function FxChip({ fxIsDefault }: { fxIsDefault: boolean }) {
  const { month, plan } = useDashboard()
  const [open, setOpen] = useState(false)
  const [value, setValue] = useState(String(plan.fx))
  const [pending, start] = useTransition()

  const save = () => {
    const fx = Number(value.replace(",", "."))
    if (!Number.isFinite(fx) || fx <= 0) return toast.error("Курс має бути числом")
    start(async () => {
      await setFx({ month, fx })
      setOpen(false)
      toast(`Курс ${monthLabel(month).toLowerCase()}: ${fx.toFixed(2)} ₴`)
    })
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <button
            type="button"
            className="depth-surface pressable flex h-9 items-center gap-1.5 rounded-[10px] px-3 text-sm tabular-nums hover:brightness-[0.985]"
          />
        }
      >
        <span className="text-muted-foreground">$1 =</span>
        <span className="font-medium">{plan.fx.toFixed(2)} ₴</span>
        {fxIsDefault && <span className="tilt-r rounded-md bg-foreground px-1 text-[10px] font-semibold text-background">план</span>}
      </PopoverTrigger>
      <PopoverContent align="start" className="w-64">
        <form
          className="flex flex-col gap-3"
          onSubmit={(e) => {
            e.preventDefault()
            save()
          }}
        >
          <div>
            <p className="text-sm font-medium">Курс на {monthLabel(month).toLowerCase()}</p>
            <p className="text-xs text-muted-foreground">Перераховує план: зарплати в $, а відкладаємо в ₴.</p>
          </div>
          <div className="flex gap-2">
            <Input inputMode="decimal" value={value} onChange={(e) => setValue(e.target.value)} aria-label="Курс USD/UAH" />
            <Button type="submit" disabled={pending}>
              OK
            </Button>
          </div>
        </form>
      </PopoverContent>
    </Popover>
  )
}
