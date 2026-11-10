import "server-only"
import { createClient, type SupabaseClient } from "@supabase/supabase-js"
import type { MemberId } from "@/lib/budget/config"
import type { Entry, Task } from "@/lib/budget/progress"
import type { Repo } from "./repo"

type EntryRow = {
  id: string
  month: string
  member: MemberId
  item_key: string
  amount_kop: number | string
  paid_on: string
  note: string | null
  created_at: string
}
type TaskRow = { id: string; month: string; title: string; assignee: MemberId | null; done: boolean; created_at: string }

const toEntry = (r: EntryRow): Entry => ({
  id: r.id,
  month: r.month,
  member: r.member,
  itemKey: r.item_key,
  amount: Number(r.amount_kop),
  paidOn: r.paid_on,
  note: r.note,
  createdAt: r.created_at,
})
const toTask = (r: TaskRow): Task => ({
  id: r.id,
  month: r.month,
  title: r.title,
  assignee: r.assignee,
  done: r.done,
  createdAt: r.created_at,
})

let client: SupabaseClient | null = null

function check<T>(res: { data: T; error: { message: string } | null }): T {
  if (res.error) throw new Error(`Supabase: ${res.error.message}`)
  return res.data
}

export function supabaseRepo(url: string, serviceKey: string): Repo {
  client ??= createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } })
  const db = client
  return {
    async getFx(month) {
      const row = check(await db.from("months").select("fx_usd_uah").eq("month", month).maybeSingle())
      return row ? Number(row.fx_usd_uah) : null
    },
    async setFx(month, fx) {
      check(await db.from("months").upsert({ month, fx_usd_uah: fx, updated_at: new Date().toISOString() }))
    },
    async listEntries(month) {
      const rows = check(await db.from("entries").select("*").eq("month", month).order("paid_on").order("created_at"))
      return (rows as EntryRow[]).map(toEntry)
    },
    async addEntry(e) {
      const row = check(
        await db
          .from("entries")
          .insert({ month: e.month, member: e.member, item_key: e.itemKey, amount_kop: e.amount, paid_on: e.paidOn, note: e.note })
          .select("*")
          .single(),
      )
      return toEntry(row as EntryRow)
    },
    async deleteEntry(id) {
      check(await db.from("entries").delete().eq("id", id))
    },
    async listTasks(month) {
      const rows = check(await db.from("tasks").select("*").eq("month", month).order("created_at"))
      return (rows as TaskRow[]).map(toTask)
    },
    async addTask(t) {
      const row = check(await db.from("tasks").insert({ month: t.month, title: t.title, assignee: t.assignee }).select("*").single())
      return toTask(row as TaskRow)
    },
    async setTaskDone(id, done) {
      check(await db.from("tasks").update({ done }).eq("id", id))
    },
    async deleteTask(id) {
      check(await db.from("tasks").delete().eq("id", id))
    },
  }
}
