"use client"

import { cn } from "cn"
import { Check } from "lucide-react"
import { AnimatePresence, motion } from "motion/react"
import type { MemberId } from "@/lib/budget/config"

/** Progress ring that doubles as a todo checkbox. */
export function Ring({
  value,
  member,
  size = 26,
  className,
}: {
  value: number // 0..1
  member: MemberId
  size?: number
  className?: string
}) {
  const done = value >= 1
  const r = (size - 4) / 2
  const c = 2 * Math.PI * r
  const color = member === "ostap" ? "var(--ostap)" : "var(--olena)"
  return (
    <span className={cn("relative inline-grid shrink-0 place-items-center", className)} style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" aria-hidden>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgb(0 0 0 / 0.08)" strokeWidth={2} />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeDasharray={c}
          initial={false}
          animate={{ strokeDashoffset: c * (1 - Math.min(1, Math.max(0, value))) }}
          transition={{ type: "spring", stiffness: 140, damping: 20 }}
        />
      </svg>
      <AnimatePresence>
        {done && (
          <motion.span
            key="done"
            initial={{ scale: 0.4, rotate: -30, opacity: 0 }}
            animate={{ scale: 1, rotate: -6, opacity: 1 }}
            exit={{ scale: 0.4, opacity: 0 }}
            transition={{ type: "spring", stiffness: 500, damping: 18 }}
            className={cn(
              "absolute inset-0 grid place-items-center rounded-full",
              member === "ostap" ? "depth-ink text-white" : "depth-surface text-foreground",
            )}
          >
            <Check className="size-3.5" strokeWidth={3} />
          </motion.span>
        )}
      </AnimatePresence>
    </span>
  )
}
