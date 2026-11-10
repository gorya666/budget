import { redirect } from "next/navigation"
import { connection } from "next/server"
import { currentMonth } from "@/lib/budget/month"

export default async function Home() {
  await connection() // the current month depends on the request time, never on build time
  redirect(`/${currentMonth()}`)
}
