import { auth } from "@/auth"
import prisma from "@/lib/prisma"
import { NextResponse } from "next/server"

// ponytail: simple word-overlap similarity, O(n*m) — ok for exam-scale
function textSimilarity(a: string, b: string): number {
  const wa = new Set(a.toLowerCase().split(/\s+/).filter(Boolean))
  const wb = new Set(b.toLowerCase().split(/\s+/).filter(Boolean))
  if (wa.size === 0 && wb.size === 0) return 1
  const intersection = new Set([...wa].filter((w) => wb.has(w)))
  return intersection.size / Math.max(wa.size, wb.size)
}

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

  const { resultId } = await req.json()
  const result = await prisma.examResult.findUnique({ where: { id: resultId } })
  if (!result || result.examId !== id) return NextResponse.json({ error: "Result not found" }, { status: 404 })
  if (result.status === "GRADED") return NextResponse.json({ error: "Already graded" }, { status: 400 })

  const questions = exam.questions as Array<{ type: string; question: string; options?: string[]; maxScore: number; answer?: string }>
  const studentAnswers = (result.answers || []) as Array<{ questionIndex: number; question: string; answer: string }>
  const rubric = (exam.rubric || []) as Array<{ questionIndex: number; criteria: string; scoringGuide: string }>

  const gradedAnswers = questions.map((q, idx) => {
    const sa = studentAnswers.find((a) => a.questionIndex === idx)
    const answer = sa?.answer || ""

    if (q.type === "multiple_choice" && q.answer) {
      const correct = answer.trim().toLowerCase() === q.answer.trim().toLowerCase()
      return { questionIndex: idx, question: q.question, answer, score: correct ? q.maxScore : 0, feedback: correct ? "Correct" : "Incorrect" }
    }

    const r = rubric.find((rb) => rb.questionIndex === idx)
    if (r) {
      const keywords = r.scoringGuide.toLowerCase().split(" ").filter((k) => k.length > 3)
      const matched = keywords.filter((k) => answer.toLowerCase().includes(k)).length
      const ratio = keywords.length > 0 ? matched / keywords.length : 0
      const score = Math.round(ratio * q.maxScore)
      return { questionIndex: idx, question: q.question, answer, score, feedback: `Auto-graded (${matched}/${keywords.length} key terms matched)` }
    }

    return { questionIndex: idx, question: q.question, answer, score: 0, feedback: "Needs manual review" }
  })

  const totalScore = gradedAnswers.reduce((sum, a) => sum + (a.score || 0), 0)

  // anomaly detection: compare with other submissions
  const peers = await prisma.examResult.findMany({
    where: { examId: id, id: { not: resultId }, status: { in: ["SUBMITTED", "GRADED"] } },
    select: { answers: true, studentId: true },
  })
  let flagged = false
  let flagReason = ""
  for (const peer of peers) {
    const peerAnswers = (peer.answers || []) as Array<{ questionIndex: number; answer: string }>
    for (const sa of studentAnswers) {
      const pa = peerAnswers.find((p) => p.questionIndex === sa.questionIndex)
      if (pa && pa.answer && sa.answer && textSimilarity(sa.answer, pa.answer) > 0.8) {
        flagged = true
        flagReason = "High similarity with another student's answer"
        break
      }
    }
    if (flagged) break
  }

  await prisma.examResult.update({
    where: { id: resultId },
    data: { answers: gradedAnswers, totalScore, status: "GRADED", gradedAt: new Date(), gradedBy: user.id, flagged, flagReason: flagged ? flagReason : null },
  })

  const pending = await prisma.examResult.count({ where: { examId: id, status: { not: "GRADED" } } })
  if (pending === 0) await prisma.exam.update({ where: { id }, data: { status: "GRADED" } })

  return NextResponse.json({ answers: gradedAnswers, totalScore, flagged, flagReason })
}
