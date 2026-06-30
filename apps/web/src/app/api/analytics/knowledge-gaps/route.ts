import { auth } from "@/auth"
import prisma from "@/lib/prisma"
import { NextResponse } from "next/server"

// ponytail: identify weak questions (avg score < 50%)
export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const user = await prisma.user.findUnique({ where: { id: session.user.id } })
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 })
  if (!["TEACHER", "LECTURER", "ADMIN", "SUPER_ADMIN"].includes(user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const exams = await prisma.exam.findMany({
    where: { teacherId: user.id },
    include: {
      results: { where: { status: "GRADED" }, select: { answers: true } },
    },
  })

  const gaps: Array<{ examId: string; examTitle: string; questionIndex: number; question: string; avgScore: number; maxScore: number; intervention: string }> = []

  for (const exam of exams) {
    const questions = exam.questions as Array<{ type: string; question: string; maxScore: number }>
    if (!questions) continue

    for (let qi = 0; qi < questions.length; qi++) {
      const scores: number[] = []
      for (const r of exam.results) {
        const answers = (r.answers || []) as Array<{ questionIndex: number; score?: number }>
        const a = answers.find((ans) => ans.questionIndex === qi)
        if (a?.score !== undefined) scores.push(a.score)
      }

      if (scores.length < 3) continue

      const avg = scores.reduce((a, b) => a + b, 0) / scores.length
      const pct = Math.round((avg / questions[qi].maxScore) * 100)

      if (pct < 50) {
        gaps.push({
          examId: exam.id,
          examTitle: exam.title,
          questionIndex: qi,
          question: questions[qi].question,
          avgScore: pct,
          maxScore: questions[qi].maxScore,
          intervention: `Students scored avg ${pct}% on this question — recommend review session and additional practice`,
        })
      }
    }
  }

  return NextResponse.json({ gaps, totalWeakQuestions: gaps.length })
}
