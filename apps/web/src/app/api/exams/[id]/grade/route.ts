import { auth } from "@/auth"
import prisma from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const user = await prisma.user.findUnique({ where: { id: session.user.id } })
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 })
  if (!["TEACHER", "LECTURER", "ADMIN", "SUPER_ADMIN"].includes(user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const exam = await prisma.exam.findUnique({ where: { id } })
  if (!exam || exam.teacherId !== user.id) {
    return NextResponse.json({ error: "Not found or not yours" }, { status: 404 })
  }

  const { resultId, totalScore, answers } = await req.json()

  const updated = await prisma.examResult.update({
    where: { id: resultId },
    data: { totalScore, answers, status: "GRADED", gradedAt: new Date(), gradedBy: user.id },
  })

  // if all results graded, mark exam as GRADED
  const pending = await prisma.examResult.count({
    where: { examId: id, status: { not: "GRADED" } },
  })
  if (pending === 0) {
    await prisma.exam.update({ where: { id }, data: { status: "GRADED" } })
  }

  return NextResponse.json(updated)
}
