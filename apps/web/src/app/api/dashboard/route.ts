import { auth } from "@/auth"
import prisma from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const user = await prisma.user.findUnique({ where: { id: session.user.id } })
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 })

  const isTeacher = ["TEACHER", "LECTURER", "ADMIN", "SUPER_ADMIN"].includes(user.role)

  const [examCount, projectCount, sessionCount, gradeData, recentExams] = await Promise.all([
    prisma.exam.count({ where: isTeacher ? { teacherId: user.id } : { results: { some: { studentId: user.id } } } }),
    prisma.project.count({ where: { userId: user.id } }),
    prisma.chatSession.count({ where: { userId: user.id } }),
    prisma.examResult.findMany({
      where: isTeacher
        ? { exam: { teacherId: user.id }, status: "GRADED" }
        : { studentId: user.id, status: "GRADED" },
      select: { totalScore: true, exam: { select: { title: true, maxScore: true } }, createdAt: true },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    prisma.exam.findMany({
      where: isTeacher ? { teacherId: user.id } : { results: { some: { studentId: user.id } } },
      select: { id: true, title: true, status: true, createdAt: true, _count: { select: { results: true } } },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
  ])

  const pendingGrading = isTeacher
    ? await prisma.examResult.count({ where: { exam: { teacherId: user.id }, status: "SUBMITTED" } })
    : 0

  const avgScore = gradeData.length > 0
    ? Math.round(gradeData.reduce((a, r) => a + (r.totalScore || 0), 0) / gradeData.length)
    : null

  return NextResponse.json({
    stats: { examCount, projectCount, sessionCount, pendingGrading, avgScore },
    recentGrades: gradeData,
    recentExams,
  })
}
