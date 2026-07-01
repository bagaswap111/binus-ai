import { auth } from "@/auth"
import prisma from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const isTeacher = ["TEACHER", "LECTURER", "ADMIN", "SUPER_ADMIN"].includes(session.user.role)
  const violations = await prisma.proctoringViolation.findMany({
    where: isTeacher ? { examId: id } : { examId: id, studentId: session.user.id },
    include: { student: { select: { id: true, name: true } } },
    orderBy: { timestamp: "desc" },
  })
  return NextResponse.json(violations)
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  // ponytail: only allow violation creation if user has an active exam result
  const result = await prisma.examResult.findFirst({
    where: { examId: id, studentId: session.user.id, status: "IN_PROGRESS" },
  })
  if (!result) return NextResponse.json({ error: "No active exam session" }, { status: 403 })

  const { type, details } = await req.json()
  const violation = await prisma.proctoringViolation.create({
    data: { examId: id, studentId: session.user.id, type, details },
  })
  return NextResponse.json(violation, { status: 201 })
}
