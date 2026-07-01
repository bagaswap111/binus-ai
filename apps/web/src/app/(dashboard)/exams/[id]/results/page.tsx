"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { safeFetchJSON, safeFetch } from "@/lib/security"
import { Button } from "@/components/ui/button"
import Breadcrumb from "@/components/breadcrumb"

interface ExamResult {
  id: string
  student: { id: string; name: string; email: string }
  answers: Array<{ questionIndex: number; question: string; answer: string; score?: number; feedback?: string }>
  totalScore: number | null
  status: string
  flagged: boolean
  flagReason: string | null
  submittedAt: string | null
  gradedAt: string | null
}

interface Violation {
  id: string
  type: string
  details: string | null
  timestamp: string
  student: { id: string; name: string }
}

interface ExamDetail {
  id: string
  title: string
  questions: Array<{ type: string; question: string; options?: string[]; maxScore: number }>
  maxScore: number
  passingScore: number
  status: string
}

export default function ExamResultsPage() {
  const { data: session } = useSession()
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const [exam, setExam] = useState<ExamDetail | null>(null)
  const [results, setResults] = useState<ExamResult[]>([])
  const [violations, setViolations] = useState<Violation[]>([])
  const isTeacher = ["TEACHER", "LECTURER", "ADMIN", "SUPER_ADMIN"].includes(session?.user?.role || "")

  useEffect(() => {
    safeFetchJSON<ExamDetail>(`/api/exams/${params.id}`).then((d) => d && setExam(d))
    safeFetchJSON<ExamResult[]>(`/api/exams/${params.id}/results`).then((d) => d && setResults(d))
    safeFetchJSON<Violation[]>(`/api/exams/${params.id}/violations`).then((d) => d && setViolations(d))
  }, [params.id])

  async function autoGrade(resultId: string) {
    await safeFetch(`/api/exams/${params.id}/auto-grade`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ resultId }),
    })
    window.location.reload()
  }

  if (!exam) return <div className="text-muted-foreground pt-10">Loading...</div>

  // student view: show my own result
  if (!isTeacher && results.length === 1) {
    const r = results[0]
    return (
      <div className="max-w-3xl">
        <Breadcrumb items={[{ label: "Exams", href: "/exams" }, { label: exam?.title || "Exam", href: `/exams/${params.id}` }, { label: "Results" }]} />
        <h1 className="mb-2 text-xl font-semibold">{exam.title} — Results</h1>
        <div className="mb-6 rounded-lg border p-4">
          <p className="text-lg font-bold">{r.totalScore ?? "Pending"}/{exam.maxScore}</p>
          <p className="text-sm text-muted-foreground">Status: {r.status}</p>
        </div>
        <div className="space-y-4">
          {r.answers?.map((a, idx) => (
            <div key={idx} className="rounded-lg border p-4">
              <p className="mb-1 text-xs text-muted-foreground">Q{idx + 1}</p>
              <p className="mb-2 text-sm font-medium">{a.question}</p>
              <p className="mb-1 text-sm"><span className="font-medium">Your answer:</span> {a.answer}</p>
              {a.score !== undefined && <p className="text-sm">Score: {a.score}/{exam.questions[idx]?.maxScore}</p>}
              {a.feedback && <p className="text-sm text-muted-foreground">Feedback: {a.feedback}</p>}
            </div>
          ))}
        </div>
      </div>
    )
  }

  // teacher view: all results
  return (
    <div className="max-w-5xl">
      <Breadcrumb items={[{ label: "Exams", href: "/exams" }, { label: exam?.title || "Exam", href: `/exams/${params.id}` }, { label: "Results" }]} />
      <h1 className="mb-6 text-xl font-semibold">{exam.title} — All Results</h1>

      {results.length === 0 && <p className="text-muted-foreground">No submissions yet</p>}

      {results.some((r) => r.status === "SUBMITTED") && (
        <Button onClick={async () => {
          for (const r of results.filter((r) => r.status === "SUBMITTED")) {
            await safeFetch(`/api/exams/${params.id}/auto-grade`, {
              method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ resultId: r.id }),
            })
          }
          window.location.reload()
        }} className="mb-4">
          Grade All Pending
        </Button>
      )}

      <div className="space-y-4">
        {results.map((r) => (
          <div key={r.id} className={`rounded-lg border p-4 ${r.flagged ? "border-red-300 bg-red-50" : ""}`}>
            <div className="mb-2 flex items-center justify-between">
              <div>
                <p className="font-medium">{r.student.name}</p>
                <p className="text-xs text-muted-foreground">{r.student.email} &middot; {r.status} {r.submittedAt && `· ${new Date(r.submittedAt).toLocaleDateString()}`}</p>
              </div>
              <div className="flex items-center gap-3">
                {r.totalScore !== null && <span className="font-bold">{r.totalScore}/{exam.maxScore}</span>}
                {r.flagged && <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs text-red-700"><span aria-hidden="true">● </span>{r.flagReason || "Flagged"}</span>}
                {r.status === "SUBMITTED" && (
                  <Button variant="secondary" size="sm" onClick={() => autoGrade(r.id)}>
                    Auto-grade
                  </Button>
                )}
              </div>
            </div>
            {violations.filter((v) => v.student.id === r.student.id).length > 0 && (
            <details className="mb-2">
              <summary className="cursor-pointer text-xs text-red-500">{violations.filter((v) => v.student.id === r.student.id).length} proctoring violations</summary>
              <div className="mt-1 space-y-1">
                {violations.filter((v) => v.student.id === r.student.id).map((v) => (
                  <div key={v.id} className="text-xs text-red-400">{v.type.replace("_", " ")}: {v.details} ({new Date(v.timestamp).toLocaleTimeString()})</div>
                ))}
              </div>
            </details>
          )}
          {r.answers && (
              <details>
                <summary className="cursor-pointer text-sm text-muted-foreground">Show answers ({r.answers.length} questions)</summary>
                <div className="mt-2 space-y-2">
                  {r.answers.map((a, idx) => (
                    <div key={idx} className="rounded bg-muted p-2 text-sm">
                      <p className="text-xs text-muted-foreground">Q{idx + 1}: {a.question}</p>
                      <p className="font-medium">{a.answer}</p>
                      {a.score !== undefined && <p className="text-xs text-muted-foreground">Score: {a.score}/{exam.questions[idx]?.maxScore}</p>}
                      {a.feedback && <p className="text-xs text-muted-foreground">Feedback: {a.feedback}</p>}
                    </div>
                  ))}
                </div>
              </details>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
