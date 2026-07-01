import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { decode } from "@auth/core/jwt"

if (!process.env.AUTH_SECRET) {
  throw new Error("AUTH_SECRET is required")
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
    const login = new URL("/login", req.url)
    login.searchParams.set("callbackUrl", pathname)
    return Response.redirect(login)
  }

  try {
    const payload = await decode({ token, secret: process.env.AUTH_SECRET!, salt: cookieName }) as any
    // ponytail: manual exp check since decode doesn't validate it
    if (!payload || !payload.sub || !payload.role) throw new Error("invalid payload")
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) throw new Error("expired")
  } catch {
    const login = new URL("/login", req.url)
    login.searchParams.set("callbackUrl", pathname)
    return Response.redirect(login)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
}
