import { getSessionUser, isTeacher, unauthorized, forbidden } from "@/lib/guards"
import prisma from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function GET() {
  const user = await getSessionUser()
  if (!user) return unauthorized()
  const teacher = isTeacher(user)

  const exams = await prisma.exam.findMany({
    where: teacher
      ? { teacherId: user.id, subject: { schoolId: user.schoolId } }
      : { status: "PUBLISHED", subject: { schoolId: user.schoolId } },
    include: { subject: { select: { name: true, code: true } }, _count: { select: { results: true } } },
    orderBy: { createdAt: "desc" },
  })
  return NextResponse.json(exams)
}

export async function POST(req: Request) {
  const user = await getSessionUser()
  if (!user) return unauthorized()
  if (!isTeacher(user)) return forbidden("Only teachers can create exams")

  const { title, description, instructions, questions, rubric, subjectId, duration, startTime, endTime, maxScore, passingScore } = await req.json()
  const exam = await prisma.exam.create({
    data: {
      title, description, instructions, questions, rubric, subjectId,
      duration: duration || 60, maxScore: maxScore || 100, passingScore: passingScore || 0,
      startTime: startTime ? new Date(startTime) : null,
      endTime: endTime ? new Date(endTime) : null,
      teacherId: user.id,
    },
  })
  return NextResponse.json(exam, { status: 201 })
}
