"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { safeFetchJSON, safeFetch } from "@/lib/security"
import { Button } from "@/components/ui/button"
import Breadcrumb from "@/components/breadcrumb"

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
    safeFetchJSON<ExamDetail>(`/api/exams/${params.id}`).then((d) => d && setExam(d))
  }, [params.id])

  if (!exam) return <div className="text-muted-foreground pt-10">Loading...</div>

  return (
    <div className="max-w-3xl">
      <Breadcrumb items={[{ label: "Exams", href: "/exams" }, { label: exam?.title || "Loading..." }]} />
      <div className="mb-6">
        <h1 className="text-xl font-semibold">{exam.title}</h1>
        <p className="text-sm text-muted-foreground">{exam.subject.code} &middot; {exam.teacher.name} &middot; {exam.duration} min &middot; {exam.maxScore} pts</p>
        {exam.description && <p className="mt-2 text-sm text-muted-foreground">{exam.description}</p>}
        <div className="mt-2 flex gap-2">
          <span className={`rounded-full px-2 py-0.5 text-xs ${exam.status === "PUBLISHED" ? "bg-green-100 text-green-700" : "bg-muted text-muted-foreground"}`}><span aria-hidden="true">● </span>{exam.status}</span>
        </div>
      </div>

      {exam.myResult && exam.myResult.status === "GRADED" && (
        <div className="mb-6 rounded-lg border border-green-200 bg-green-50 p-4">
          <p className="font-medium">Score: {exam.myResult.totalScore}/{exam.maxScore}</p>
          <p className="text-sm text-muted-foreground">Status: Graded</p>
          <Button variant="link" onClick={() => router.push(`/exams/${params.id}/results`)}>View Results</Button>
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
            <div className="mb-1 text-xs text-muted-foreground">Q{idx + 1} &middot; {q.type.replace("_", " ")} &middot; {q.maxScore} pts</div>
            <p className="text-sm">{q.question}</p>
            {q.options && (
              <div className="mt-2 space-y-1">
                {q.options.map((opt, oi) => (
                  <div key={oi} className="text-sm text-muted-foreground">{String.fromCharCode(97 + oi)}. {opt}</div>
                ))}
              </div>
            )}
            {exam.myResult?.answers?.[idx] && (
              <div className="mt-2 rounded bg-muted p-2 text-xs">
                <p className="font-medium">Score: {exam.myResult.answers[idx].score ?? "pending"}</p>
                {exam.myResult.answers[idx].feedback && <p className="text-muted-foreground">{exam.myResult.answers[idx].feedback}</p>}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-6 flex gap-3">
        {exam.status === "PUBLISHED" && !exam.myResult && (
          <Button onClick={() => router.push(`/exams/${params.id}/take`)}>
            Take Exam
          </Button>
        )}
        {isTeacher && (
          <>
            <Button variant="outline" onClick={() => router.push(`/exams/${params.id}/results`)}>
              View All Results
            </Button>
            {exam.status === "DRAFT" && (
              <button onClick={async () => {
                if (!confirm("Publish this exam? Students will be able to see and take it.")) return
                await safeFetch(`/api/exams/${params.id}`, {
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
            <Button variant="outline" onClick={async () => {
              if (!confirm("Unpublish this exam? Students will no longer be able to access it.")) return
              await safeFetch(`/api/exams/${params.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: "DRAFT" }),
              })
              window.location.reload()
            }}>
              Unpublish
            </Button>
            )}
            <Button variant="destructive" onClick={async () => {
              if (!confirm("Delete this exam? This cannot be undone.")) return
              const res = await safeFetch(`/api/exams/${params.id}`, { method: "DELETE" })
              if (res) router.push("/exams")
            }}>
              Delete
            </Button>
          </>
        )}
      </div>
    </div>
  )
}
