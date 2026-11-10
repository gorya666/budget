"use client"

import { cn } from "cn"
import { Area, AreaChart, CartesianGrid, ReferenceLine, XAxis, YAxis } from "recharts"
import { Card } from "@/components/ui/card"
import { type ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { config as budget, MEMBERS } from "@/lib/budget/config"
import { formatUah } from "@/lib/budget/money"
import { monthGenitive, today } from "@/lib/budget/month"
import { useDashboard } from "./dashboard"

const chartConfig = {
  ostap: { label: budget.members.ostap.name, color: "var(--ostap)" },
  olena: { label: budget.members.olena.name, color: "var(--olena)" },
} satisfies ChartConfig

const PAYDAYS = [7, 22]
const compact = (uah: number) => (uah >= 1000 ? `${Math.round(uah / 1000)}k` : String(uah))

export function TimelineChart({ className }: { className?: string }) {
  const { month, progress } = useDashboard()
  const t = today()
  const cutoff = t.startsWith(month) ? Number(t.slice(8, 10)) : month < t.slice(0, 7) ? 99 : 0

  const data = progress.timeline.map((d) => ({
    day: d.day,
    ostap: d.day <= cutoff ? d.ostap / 100 : null,
    olena: d.day <= cutoff ? d.olena / 100 : null,
  }))
  const plans = MEMBERS.map((m) => ({ m, uah: progress.byMember[m].plan / 100 }))
  const last = data.filter((d) => d.ostap !== null).at(-1)
  const empty = progress.total.done === 0
  const lastDay = data.length

  return (
    <Card className={cn("gap-3 px-6 py-6", className)}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium">Наростаючим підсумком</p>
          <p className="text-xs text-muted-foreground">
            Хто скільки закинув протягом {monthGenitive(month)} · вертикальні лінії — дні ЗП
          </p>
        </div>
        <ul className="flex shrink-0 gap-3 text-xs text-muted-foreground" aria-label="Легенда">
          {MEMBERS.map((m) => (
            <li key={m} className="flex items-center gap-1.5">
              <span
                className={cn("inline-block h-0.5 w-4 rounded-full", m === "ostap" ? "bg-ostap" : "stripes h-1")}
                aria-hidden
              />
              {budget.members[m].name}
            </li>
          ))}
        </ul>
      </div>

      <div className="relative">
        <ChartContainer config={chartConfig} className="aspect-auto h-[220px] w-full">
          <AreaChart data={data} margin={{ top: 16, right: 56, bottom: 0, left: 0 }}>
            <CartesianGrid vertical={false} stroke="rgb(0 0 0 / 0.06)" />
            <XAxis
              dataKey="day"
              type="number"
              domain={[1, lastDay]}
              ticks={[1, 7, 15, 22, lastDay]}
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tick={{ fontSize: 11 }}
            />
            <YAxis
              width={36}
              tickLine={false}
              axisLine={false}
              tickFormatter={compact}
              tick={{ fontSize: 11 }}
              domain={[0, (max: number) => Math.max(max, ...plans.map((p) => p.uah)) * 1.05]}
            />
            {PAYDAYS.map((d) => (
              <ReferenceLine
                key={d}
                x={d}
                stroke="rgb(0 0 0 / 0.14)"
                label={{ value: "ЗП", position: "top", fontSize: 10, fill: "var(--muted-foreground)" }}
              />
            ))}
            {plans.map((p) => (
              <ReferenceLine
                key={p.m}
                y={p.uah}
                stroke="rgb(0 0 0 / 0.1)"
                label={{
                  value: `план ${budget.members[p.m].initial}`,
                  position: "right",
                  fontSize: 10,
                  fill: "var(--muted-foreground)",
                }}
              />
            ))}
            <ChartTooltip
              cursor={{ stroke: "rgb(0 0 0 / 0.2)" }}
              content={
                <ChartTooltipContent
                  indicator="line"
                  labelFormatter={(_, payload) => `${payload?.[0]?.payload?.day} ${monthGenitive(month)}`}
                  formatter={(value, name) => (
                    <div className="flex w-full justify-between gap-4">
                      <span className="text-muted-foreground">{chartConfig[name as keyof typeof chartConfig]?.label}</span>
                      <span className="font-medium tabular-nums">{formatUah(Number(value) * 100)}</span>
                    </div>
                  )}
                />
              }
            />
            <Area
              dataKey="olena"
              type="stepAfter"
              stroke="var(--color-olena)"
              strokeWidth={2}
              strokeDasharray="5 3"
              fill="var(--color-olena)"
              fillOpacity={0.1}
              connectNulls={false}
              isAnimationActive={false}
              activeDot={{ r: 4, stroke: "var(--card)", strokeWidth: 2 }}
            />
            <Area
              dataKey="ostap"
              type="stepAfter"
              stroke="var(--color-ostap)"
              strokeWidth={2}
              fill="var(--color-ostap)"
              fillOpacity={0.1}
              connectNulls={false}
              isAnimationActive={false}
              activeDot={{ r: 4, stroke: "var(--card)", strokeWidth: 2 }}
            />
          </AreaChart>
        </ChartContainer>
        {empty && (
          <div className="pointer-events-none absolute inset-0 grid place-items-center">
            <p className="tilt-l depth-surface rounded-xl px-3 py-1.5 text-sm">
              Ще жодного внеску. Перший — з ЗП 7-го? 💸
            </p>
          </div>
        )}
      </div>
      {last && !empty && (
        <p className="sr-only">
          Станом на {last.day}: {MEMBERS.map((m) => `${budget.members[m].name} ${formatUah((last[m] ?? 0) * 100)}`).join(", ")}
        </p>
      )}
    </Card>
  )
}
