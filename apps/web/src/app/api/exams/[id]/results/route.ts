import { auth } from "@/auth"
import prisma from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const user = await prisma.user.findUnique({ where: { id: session.user.id } })
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 })

  const exam = await prisma.exam.findUnique({ where: { id } })
  if (!exam) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const isTeacher = ["TEACHER", "LECTURER", "ADMIN", "SUPER_ADMIN"].includes(user.role)

  if (isTeacher && exam.teacherId === user.id) {
    const results = await prisma.examResult.findMany({
      where: { examId: id },
      include: { student: { select: { id: true, name: true, email: true } } },
      orderBy: { submittedAt: "desc" },
    })
    return NextResponse.json(results)
  }

  const result = await prisma.examResult.findMany({
    where: { examId: id, studentId: user.id },
    include: { student: { select: { id: true, name: true } } },
  })
  return NextResponse.json(result)
}
