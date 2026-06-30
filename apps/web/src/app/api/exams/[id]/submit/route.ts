import { auth } from "@/auth"
import prisma from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const user = await prisma.user.findUnique({ where: { id: session.user.id } })
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 })

  const exam = await prisma.exam.findUnique({ where: { id } })
  if (!exam) return NextResponse.json({ error: "Exam not found" }, { status: 404 })
  if (exam.status !== "PUBLISHED") return NextResponse.json({ error: "Exam is not open" }, { status: 400 })

  const existing = await prisma.examResult.findUnique({
    where: { examId_studentId: { examId: id, studentId: user.id } },
  })
  if (existing && existing.status === "SUBMITTED") {
    return NextResponse.json({ error: "Already submitted" }, { status: 400 })
  }

  const { answers } = await req.json()

  const result = await prisma.examResult.upsert({
    where: { examId_studentId: { examId: id, studentId: user.id } },
    create: { examId: id, studentId: user.id, answers, status: "SUBMITTED", submittedAt: new Date() },
    update: { answers, status: "SUBMITTED", submittedAt: new Date() },
  })

  return NextResponse.json(result, { status: 201 })
}
