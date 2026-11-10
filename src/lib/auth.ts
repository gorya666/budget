/**
 * Minimal shared-passcode gate for a two-person app. When APP_PASSCODE is
 * unset (local dev) everything is open.
 */
export const SESSION_COOKIE = "budget_session"

export async function expectedToken(): Promise<string | null> {
  const pass = process.env.APP_PASSCODE
  if (!pass) return null
  const data = new TextEncoder().encode(`budget-v1:${pass}`)
  const hash = await crypto.subtle.digest("SHA-256", data)
  return Array.from(new Uint8Array(hash), (b) => b.toString(16).padStart(2, "0")).join("")
}

export async function isAuthed(token: string | undefined): Promise<boolean> {
  const expected = await expectedToken()
  if (!expected) return true
  if (!token || token.length !== expected.length) return false
  let diff = 0
  for (let i = 0; i < token.length; i++) diff |= token.charCodeAt(i) ^ expected.charCodeAt(i)
  return diff === 0
}
