"use server"

import { cookies } from "next/headers"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { z } from "zod"
import { expectedToken, isAuthed, SESSION_COOKIE } from "@/lib/auth"
import { MONTH_RE } from "@/lib/budget/month"
import { repo } from "@/lib/data/repo"

const member = z.enum(["ostap", "olena"])
const month = z.string().regex(MONTH_RE)

async function guard() {
  if (!(await isAuthed((await cookies()).get(SESSION_COOKIE)?.value))) throw new Error("Unauthorized")
}

const done = (m: string) => revalidatePath(`/${m}`)

const entrySchema = z.object({
  month,
  member,
  itemKey: z.string().regex(/^(savings|jar|zone)\.[a-z0-9-]+$/),
  amount: z.number().int().positive().max(100_000_000_00),
  paidOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  note: z.string().trim().max(200).nullable(),
})

export async function addEntry(input: z.input<typeof entrySchema>) {
  await guard()
  const e = entrySchema.parse(input)
  const row = await repo().addEntry(e)
  done(e.month)
  return row
}

export async function deleteEntry(input: { id: string; month: string }) {
  await guard()
  const { id, month: m } = z.object({ id: z.string().uuid(), month }).parse(input)
  await repo().deleteEntry(id)
  done(m)
}

export async function setFx(input: { month: string; fx: number }) {
  await guard()
  const { month: m, fx } = z.object({ month, fx: z.number().min(1).max(1000) }).parse(input)
  await repo().setFx(m, fx)
  done(m)
}

export async function addTask(input: { month: string; title: string; assignee: "ostap" | "olena" | null }) {
  await guard()
  const t = z.object({ month, title: z.string().trim().min(1).max(200), assignee: member.nullable() }).parse(input)
  await repo().addTask(t)
  done(t.month)
}

export async function toggleTask(input: { id: string; month: string; done: boolean }) {
  await guard()
  const t = z.object({ id: z.string().uuid(), month, done: z.boolean() }).parse(input)
  await repo().setTaskDone(t.id, t.done)
  done(t.month)
}

export async function deleteTask(input: { id: string; month: string }) {
  await guard()
  const t = z.object({ id: z.string().uuid(), month }).parse(input)
  await repo().deleteTask(t.id)
  done(t.month)
}

export async function login(_prev: { error?: string } | undefined, form: FormData) {
  const pass = String(form.get("passcode") ?? "")
  const expected = await expectedToken()
  const data = new TextEncoder().encode(`budget-v1:${pass}`)
  const hash = Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", data)), (b) => b.toString(16).padStart(2, "0")).join("")
  if (expected && hash !== expected) return { error: "Не той пароль" }
  ;(await cookies()).set(SESSION_COOKIE, hash, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 400,
  })
  redirect("/")
}
