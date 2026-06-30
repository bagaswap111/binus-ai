import { auth } from "@/auth"
import prisma from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const exam = await prisma.exam.findUnique({
    where: { id },
    include: { subject: { select: { name: true, code: true } }, teacher: { select: { name: true } } },
  })
  if (!exam) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const user = await prisma.user.findUnique({ where: { id: session.user.id } })
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 })

  const isTeacher = ["TEACHER", "LECTURER", "ADMIN", "SUPER_ADMIN"].includes(user.role)

  if (!isTeacher && exam.status === "DRAFT") {
    return NextResponse.json({ error: "Not available" }, { status: 403 })
  }

  const result = isTeacher ? null : await prisma.examResult.findUnique({
    where: { examId_studentId: { examId: id, studentId: user.id } },
  })

  return NextResponse.json({ ...exam, myResult: result })
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
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

  const data = await req.json()
  const updated = await prisma.exam.update({
    where: { id },
    data: {
      ...(data.title !== undefined && { title: data.title }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.instructions !== undefined && { instructions: data.instructions }),
      ...(data.questions !== undefined && { questions: data.questions }),
      ...(data.rubric !== undefined && { rubric: data.rubric }),
      ...(data.subjectId !== undefined && { subjectId: data.subjectId }),
      ...(data.duration !== undefined && { duration: data.duration }),
      ...(data.startTime !== undefined && { startTime: data.startTime ? new Date(data.startTime) : null }),
      ...(data.endTime !== undefined && { endTime: data.endTime ? new Date(data.endTime) : null }),
      ...(data.maxScore !== undefined && { maxScore: data.maxScore }),
      ...(data.passingScore !== undefined && { passingScore: data.passingScore }),
      ...(data.status !== undefined && { status: data.status }),
    },
  })
  return NextResponse.json(updated)
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const user = await prisma.user.findUnique({ where: { id: session.user.id } })
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 })

  const exam = await prisma.exam.findUnique({ where: { id } })
  if (!exam || exam.teacherId !== user.id) {
    return NextResponse.json({ error: "Not found or not yours" }, { status: 404 })
  }

  await prisma.exam.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
