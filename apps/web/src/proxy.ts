import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { decode } from "@auth/core/jwt"

if (!process.env.AUTH_SECRET) {
  throw new Error("AUTH_SECRET is required — set it in .env")
}

const publicPaths = ["/login", "/register", "/api/auth", "/api/register", "/api/schools", "/_next", "/favicon.ico"]

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl
  if (publicPaths.some((p) => pathname.startsWith(p))) return NextResponse.next()

  const cookieName = req.cookies.get("__Secure-authjs.session-token")?.value
    ? "__Secure-authjs.session-token"
    : "authjs.session-token"
  const token = req.cookies.get(cookieName)?.value

  if (!token) {
    return Response.redirect(new URL("/login", req.url))
  }

  try {
    const payload = await decode({
      token,
      secret: process.env.AUTH_SECRET!,
      salt: cookieName,
    })
    if (!payload) throw new Error("empty payload")
  } catch {
    return Response.redirect(new URL("/login", req.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
}
