import "server-only"
import type { Entry, Task } from "@/lib/budget/progress"
import type { Repo } from "./repo"

type Store = { fx: Map<string, number>; entries: Entry[]; tasks: Task[] }

const g = globalThis as unknown as { __budgetStore?: Store }
const store: Store = (g.__budgetStore ??= { fx: new Map(), entries: [], tasks: [] } as Store)

export function memoryRepo(): Repo {
  return {
    async getFx(month) {
      return store.fx.get(month) ?? null
    },
    async setFx(month, fx) {
      store.fx.set(month, fx)
    },
    async listEntries(month) {
      return store.entries.filter((e) => e.month === month)
    },
    async addEntry(e) {
      const row: Entry = { ...e, id: crypto.randomUUID(), createdAt: new Date().toISOString() }
      store.entries.push(row)
      return row
    },
    async deleteEntry(id) {
      store.entries = store.entries.filter((e) => e.id !== id)
    },
    async listTasks(month) {
      return store.tasks.filter((t) => t.month === month)
    },
    async addTask(t) {
      const row: Task = { ...t, id: crypto.randomUUID(), done: false, createdAt: new Date().toISOString() }
      store.tasks.push(row)
      return row
    },
    async setTaskDone(id, done) {
      const t = store.tasks.find((x) => x.id === id)
      if (t) t.done = done
    },
    async deleteTask(id) {
      store.tasks = store.tasks.filter((t) => t.id !== id)
    },
  }
}
