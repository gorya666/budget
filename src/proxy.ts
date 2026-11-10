import { type NextRequest, NextResponse } from "next/server"
import { isAuthed, SESSION_COOKIE } from "@/lib/auth"

export async function proxy(request: NextRequest) {
  if (await isAuthed(request.cookies.get(SESSION_COOKIE)?.value)) return NextResponse.next()
  const url = request.nextUrl.clone()
  url.pathname = "/login"
  url.search = ""
  return NextResponse.redirect(url)
}

export const config = {
  matcher: ["/((?!login|_next/static|_next/image|favicon.ico|icon|apple-icon).*)"],
}
