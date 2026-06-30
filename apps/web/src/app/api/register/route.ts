import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import prisma from "@/lib/prisma"

const ALLOWED_ROLES = ["SD", "SMP", "SMA", "S1", "S2", "S3", "TEACHER"]
const MIN_PASSWORD_LENGTH = 8
const BCRYPT_ROUNDS = 12

export async function POST(req: Request) {
  try {
    const { email, name, password, role, schoolId } = await req.json()
    if (!email || !name || !password || !schoolId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }
    if (password.length < MIN_PASSWORD_LENGTH) {
      return NextResponse.json({ error: "Password too short (min 8 chars)" }, { status: 400 })
    }
    if (role && !ALLOWED_ROLES.includes(role)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 })
    }

    
    const school = await prisma.school.findUnique({ where: { id: schoolId } })
    if (!school) {
      return NextResponse.json({ error: "School not found" }, { status: 400 })
    }

    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      return NextResponse.json({ error: "Email already registered" }, { status: 409 })
    }

    const hashed = await bcrypt.hash(password, BCRYPT_ROUNDS)
    const user = await prisma.user.create({
      data: { email, name, password: hashed, role: role || "SMA", schoolId },
    })
    return NextResponse.json({ id: user.id, email: user.email, name: user.name, role: user.role })
  } catch (err) {
    return NextResponse.json({ error: "Registration failed" }, { status: 500 })
  }
}
