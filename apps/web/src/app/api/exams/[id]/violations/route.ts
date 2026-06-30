import { auth } from "@/auth"
import prisma from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const user = await prisma.user.findUnique({ where: { id: session.user.id } })
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 })

  const isTeacher = ["TEACHER", "LECTURER", "ADMIN", "SUPER_ADMIN"].includes(user.role)
  const violations = await prisma.proctoringViolation.findMany({
    where: isTeacher ? { examId: id } : { examId: id, studentId: user.id },
    include: { student: { select: { id: true, name: true } } },
    orderBy: { timestamp: "desc" },
  })
  return NextResponse.json(violations)
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { type, details } = await req.json()
  const violation = await prisma.proctoringViolation.create({
    data: { examId: id, studentId: session.user.id, type, details },
  })
  return NextResponse.json(violation, { status: 201 })
}
