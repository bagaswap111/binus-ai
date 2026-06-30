"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { useSession } from "next-auth/react"

interface Question {
  type: string
  question: string
  options?: string[]
  maxScore: number
}

interface ExamDetail {
  id: string
  title: string
  description: string | null
  instructions: string | null
  questions: Question[]
  subject: { name: string; code: string }
  teacher: { name: string }
  duration: number
  maxScore: number
  passingScore: number
  status: string
  myResult: { id: string; status: string; totalScore: number | null; answers: Array<{ questionIndex: number; score?: number; feedback?: string }> } | null
}

export default function ExamDetailPage() {
  const { data: session } = useSession()
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const [exam, setExam] = useState<ExamDetail | null>(null)
  const isTeacher = ["TEACHER", "LECTURER", "ADMIN", "SUPER_ADMIN"].includes(session?.user?.role || "")

  useEffect(() => {
    fetch(`/api/exams/${params.id}`).then((r) => r.ok && r.json()).then(setExam)
  }, [params.id])

  if (!exam) return <div className="text-zinc-400 pt-10">Loading...</div>

  return (
    <div className="max-w-3xl">
      <div className="mb-6">
        <h1 className="text-xl font-semibold">{exam.title}</h1>
        <p className="text-sm text-zinc-500">{exam.subject.code} &middot; {exam.teacher.name} &middot; {exam.duration} min &middot; {exam.maxScore} pts</p>
        {exam.description && <p className="mt-2 text-sm text-zinc-600">{exam.description}</p>}
        <div className="mt-2 flex gap-2">
          <span className={`rounded-full px-2 py-0.5 text-xs ${exam.status === "PUBLISHED" ? "bg-green-100 text-green-700" : "bg-zinc-100 text-zinc-600"}`}>{exam.status}</span>
        </div>
      </div>

      {exam.myResult && exam.myResult.status === "GRADED" && (
        <div className="mb-6 rounded-lg border border-green-200 bg-green-50 p-4">
          <p className="font-medium">Score: {exam.myResult.totalScore}/{exam.maxScore}</p>
          <p className="text-sm text-zinc-600">Status: Graded</p>
          <button onClick={() => router.push(`/exams/${params.id}/results`)} className="mt-2 text-sm text-blue-600 underline">View Results</button>
        </div>
      )}

      {exam.myResult && exam.myResult.status === "SUBMITTED" && (
        <div className="mb-6 rounded-lg border border-yellow-200 bg-yellow-50 p-4">
          <p className="font-medium">Submitted — waiting for grading</p>
        </div>
      )}

      <div className="space-y-4">
        {exam.questions.map((q, idx) => (
          <div key={idx} className="rounded-lg border p-4">
            <div className="mb-1 text-xs text-zinc-500">Q{idx + 1} &middot; {q.type.replace("_", " ")} &middot; {q.maxScore} pts</div>
            <p className="text-sm">{q.question}</p>
            {q.options && (
              <div className="mt-2 space-y-1">
                {q.options.map((opt, oi) => (
                  <div key={oi} className="text-sm text-zinc-600">{String.fromCharCode(97 + oi)}. {opt}</div>
                ))}
              </div>
            )}
            {exam.myResult?.answers?.[idx] && (
              <div className="mt-2 rounded bg-zinc-50 p-2 text-xs">
                <p className="font-medium">Score: {exam.myResult.answers[idx].score ?? "pending"}</p>
                {exam.myResult.answers[idx].feedback && <p className="text-zinc-500">{exam.myResult.answers[idx].feedback}</p>}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-6 flex gap-3">
        {exam.status === "PUBLISHED" && !exam.myResult && (
          <button onClick={() => router.push(`/exams/${params.id}/take`)} className="rounded-lg bg-zinc-900 px-6 py-2 text-sm text-white">
            Take Exam
          </button>
        )}
        {isTeacher && (
          <>
            <button onClick={() => router.push(`/exams/${params.id}/results`)} className="rounded-lg border px-6 py-2 text-sm">
              View All Results
            </button>
            {exam.status === "DRAFT" && (
              <button onClick={async () => {
                await fetch(`/api/exams/${params.id}`, {
                  method: "PUT",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ status: "PUBLISHED" }),
                })
                window.location.reload()
              }} className="rounded-lg bg-green-700 px-6 py-2 text-sm text-white">
                Publish
              </button>
            )}
            {exam.status === "PUBLISHED" && (
              <button onClick={async () => {
                await fetch(`/api/exams/${params.id}`, {
                  method: "PUT",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ status: "DRAFT" }),
                })
                window.location.reload()
              }} className="rounded-lg border border-yellow-400 px-6 py-2 text-sm text-yellow-700">
                Unpublish
              </button>
            )}
            <button onClick={async () => {
              if (confirm("Delete this exam?")) {
                await fetch(`/api/exams/${params.id}`, { method: "DELETE" })
                router.push("/exams")
              }
            }} className="rounded-lg border border-red-300 px-6 py-2 text-sm text-red-600">
              Delete
            </button>
          </>
        )}
      </div>
    </div>
  )
}
