import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import prisma from "@/lib/prisma"
import { rateLimit } from "@/lib/security"

const ALLOWED_ROLES = ["SD", "SMP", "SMA", "S1", "S2", "S3", "TEACHER"]
const MIN_PASSWORD_LENGTH = 8
const BCRYPT_ROUNDS = 12
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export async function POST(req: Request) {
  try {
    const { email, name, password, role, schoolId } = await req.json()
    if (!email || !name || !password || !schoolId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }
    if (!EMAIL_REGEX.test(email)) {
      return NextResponse.json({ error: "Invalid email" }, { status: 400 })
    }
    if (password.length > 128) return NextResponse.json({ error: "Password too long" }, { status: 400 })
    if (password.length < MIN_PASSWORD_LENGTH) {
      return NextResponse.json({ error: "Password too short (min 8 chars)" }, { status: 400 })
    }
    if (role && !ALLOWED_ROLES.includes(role)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 })
    }
    // ponytail: rate limit to 10 registration attempts per IP per hour
    const ip = req.headers.get("x-forwarded-for") || "unknown"
    if (!rateLimit(`register:${ip}`, 10, 3600000)) {
      return NextResponse.json({ error: "Too many attempts" }, { status: 429 })
    }

    
    const school = await prisma.school.findUnique({ where: { id: schoolId } })
    if (!school) {
      return NextResponse.json({ error: "School not found" }, { status: 400 })
    }

    const existing = await prisma.user.findUnique({ where: { email } })
    // ponytail: generic error to prevent email enumeration
    if (existing) {
      return NextResponse.json({ error: "Registration failed" }, { status: 409 })
    }

    const hashed = await bcrypt.hash(password, BCRYPT_ROUNDS)
    const user = await prisma.user.create({
      data: { email, name, password: hashed, role: role || "SMA", schoolId },
    })
    return NextResponse.json({ id: user.id, name: user.name })
  } catch (err) {
    return NextResponse.json({ error: "Registration failed" }, { status: 500 })
  }
}
