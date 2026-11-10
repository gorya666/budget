"use client"

import { useActionState } from "react"
import { login } from "@/app/actions"
import { Avatar } from "@/components/budget/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export default function LoginPage() {
  const [state, action, pending] = useActionState(login, undefined)
  return (
    <main className="grid min-h-dvh place-items-center p-6">
      <form action={action} className="depth-card flex w-full max-w-xs flex-col items-center gap-5 rounded-3xl p-8">
        <div className="flex -space-x-2">
          <Avatar member="ostap" size="lg" />
          <Avatar member="olena" size="lg" />
        </div>
        <div className="text-center">
          <h1 className="text-lg font-semibold tracking-tight">Скарбничка</h1>
          <p className="text-sm text-muted-foreground">Тільки для двох</p>
        </div>
        <Input name="passcode" type="password" placeholder="Пароль" autoFocus required aria-invalid={!!state?.error} />
        {state?.error && <p className="-mt-2 text-sm text-destructive">{state.error}</p>}
        <Button type="submit" size="lg" className="w-full" disabled={pending}>
          Увійти
        </Button>
      </form>
    </main>
  )
}
