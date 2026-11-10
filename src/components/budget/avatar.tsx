import { cn } from "cn"
import { config, type MemberId } from "@/lib/budget/config"

const sizes = {
  xs: "size-5 text-[10px] rounded-md",
  sm: "size-7 text-xs rounded-lg",
  md: "size-9 text-sm rounded-xl",
  lg: "size-12 text-lg rounded-2xl",
}

/** Slightly tilted, sticker-like initials. Ostap = ink, Lena = paper. */
export function Avatar({
  member,
  size = "md",
  className,
  straight,
}: {
  member: MemberId
  size?: keyof typeof sizes
  className?: string
  straight?: boolean
}) {
  const m = config.members[member]
  return (
    <span
      aria-label={m.name}
      title={m.name}
      className={cn(
        "relative inline-grid shrink-0 place-items-center font-semibold select-none",
        member === "ostap" ? "depth-ink text-white" : "depth-surface text-foreground",
        !straight && (member === "ostap" ? "tilt-l" : "tilt-r"),
        sizes[size],
        className,
      )}
    >
      {m.initial}
    </span>
  )
}
