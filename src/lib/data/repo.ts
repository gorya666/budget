import "server-only"
import type { MemberId } from "@/lib/budget/config"
import type { Entry, Task } from "@/lib/budget/progress"
import { memoryRepo } from "./memory"
import { supabaseRepo } from "./supabase"

export type NewEntry = Omit<Entry, "id" | "createdAt">
export type NewTask = { month: string; title: string; assignee: MemberId | null }

export interface Repo {
  getFx(month: string): Promise<number | null>
  setFx(month: string, fx: number): Promise<void>
  listEntries(month: string): Promise<Entry[]>
  addEntry(e: NewEntry): Promise<Entry>
  deleteEntry(id: string): Promise<void>
  listTasks(month: string): Promise<Task[]>
  addTask(t: NewTask): Promise<Task>
  setTaskDone(id: string, done: boolean): Promise<void>
  deleteTask(id: string): Promise<void>
}

/** Supabase when configured; otherwise an in-memory store for local dev/e2e. */
export function repo(): Repo {
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (url && key) return supabaseRepo(url, key)
  if (process.env.VERCEL) throw new Error("SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY are not set")
  return memoryRepo()
}
