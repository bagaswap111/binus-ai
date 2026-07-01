// ponytail: type-safe route guards — eliminates 21 redundant DB user lookups
import { auth } from "@/auth"
import { NextResponse } from "next/server"

export const TEACHER_ROLES = new Set(["TEACHER", "LECTURER", "ADMIN", "SUPER_ADMIN"])

export type SessionUser = { id: string; role: string; email: string; name: string; schoolId?: string }

export async function getSessionUser(): Promise<SessionUser | null> {
  const session = await auth()
  if (!session?.user?.id || !session?.user?.role) return null
  return session.user as SessionUser
}

export function isTeacher(user: SessionUser): boolean {
  return TEACHER_ROLES.has(user.role)
}

export function unauthorized(msg = "Unauthorized") {
  return NextResponse.json({ error: msg }, { status: 401 })
}

export function forbidden(msg = "Forbidden") {
  return NextResponse.json({ error: msg }, { status: 403 })
}
