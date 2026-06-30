import { auth } from "@/auth"
import prisma from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const user = await prisma.user.findUnique({ where: { id: session.user.id } })
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 })

  const isTeacher = ["TEACHER", "LECTURER", "ADMIN", "SUPER_ADMIN"].includes(user.role)

  const exams = isTeacher
    ? await prisma.exam.findMany({ where: { teacherId: user.id }, select: { id: true, title: true, maxScore: true } })
    : await prisma.exam.findMany({ where: { results: { some: { studentId: user.id } } }, select: { id: true, title: true, maxScore: true } })

  const analytics: Array<{
    examId: string; title: string; maxScore: number
    count: number; avg: number; min: number; max: number; median: number
    distribution: Record<string, number>
  }> = []

  for (const exam of exams) {
    const results = await prisma.examResult.findMany({
      where: isTeacher ? { examId: exam.id, status: "GRADED" } : { examId: exam.id, studentId: user.id, status: "GRADED" },
      select: { totalScore: true },
    })

    const scores = results.map((r) => r.totalScore).filter((s): s is number => s !== null)
    if (scores.length === 0) continue

    const sorted = [...scores].sort((a, b) => a - b)
    const avg = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
    const median = sorted.length % 2 === 0
      ? Math.round((sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2)
      : sorted[Math.floor(sorted.length / 2)]

    const pct = scores.map((s) => Math.round((s / exam.maxScore) * 100))
    const distribution: Record<string, number> = { "0-20": 0, "21-40": 0, "41-60": 0, "61-80": 0, "81-100": 0 }
    for (const p of pct) {
      if (p <= 20) distribution["0-20"]++
      else if (p <= 40) distribution["21-40"]++
      else if (p <= 60) distribution["41-60"]++
      else if (p <= 80) distribution["61-80"]++
      else distribution["81-100"]++
    }

    analytics.push({ examId: exam.id, title: exam.title, maxScore: exam.maxScore, count: scores.length, avg, min: sorted[0], max: sorted[sorted.length - 1], median, distribution })
  }

  return NextResponse.json(analytics)
}
