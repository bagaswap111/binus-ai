"use client"

import { useEffect, useState, useRef, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
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
  instructions: string | null
  questions: Question[]
  duration: number
}

export default function TakeExamPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const [exam, setExam] = useState<ExamDetail | null>(null)
  const [answers, setAnswers] = useState<Record<number, string>>({})
  const [timeLeft, setTimeLeft] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [fullscreen, setFullscreen] = useState(false)
  const submittedRef = useRef(false)
  const violationsSent = useRef<Set<string>>(new Set())

  const logViolation = useCallback((type: string, details: string) => {
    const key = `${type}:${details}`
    if (violationsSent.current.has(key)) return
    violationsSent.current.add(key)
    safeFetch(`/api/exams/${params.id}/violations`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, details }),
    })
  }, [params.id])

  // request fullscreen on mount
  useEffect(() => {
    const el = document.documentElement
    if (el.requestFullscreen) {
      el.requestFullscreen().then(() => setFullscreen(true)).catch(() => {})
    }
  }, [])

  // detect tab switch / focus loss
  useEffect(() => {
    const onVisibility = () => {
      if (document.hidden) logViolation("tab_switch", "User switched away from exam tab")
    }
    const onBlur = () => logViolation("focus_loss", "Exam tab lost focus")
    document.addEventListener("visibilitychange", onVisibility)
    window.addEventListener("blur", onBlur)
    return () => {
      document.removeEventListener("visibilitychange", onVisibility)
      window.removeEventListener("blur", onBlur)
    }
  }, [logViolation])

  // warn on navigate away / tab close during active exam
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = "" }
    window.addEventListener("beforeunload", handler)
    return () => window.removeEventListener("beforeunload", handler)
  }, [])

  // detect fullscreen exit
  useEffect(() => {
    const onFSChange = () => {
      if (!document.fullscreenElement) {
        setFullscreen(false)
        logViolation("fullscreen_exit", "User exited fullscreen mode")
      }
    }
    document.addEventListener("fullscreenchange", onFSChange)
    return () => document.removeEventListener("fullscreenchange", onFSChange)
  }, [logViolation])

  useEffect(() => {
    safeFetchJSON<ExamDetail>(`/api/exams/${params.id}`).then((d) => { if (d) { setExam(d); setTimeLeft(d.duration * 60) } })
  }, [params.id])

  useEffect(() => {
    if (!exam || timeLeft <= 0) return
    const t = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(t)
          if (!submittedRef.current) handleSubmit()
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(t)
  }, [exam])

  async function handleSubmit() {
    if (submittedRef.current) return
    const unanswered = exam?.questions.filter((_, i) => !answers[i]?.trim()).length ?? 0
    if (unanswered > 0 && !confirm(`${unanswered} question(s) unanswered. Submit anyway?`)) return
    submittedRef.current = true
    setSubmitting(true)
    if (!confirm("Submit your exam? This action cannot be undone.")) return
    const formatted = Object.entries(answers).map(([questionIndex, answer]) => ({
      questionIndex: Number(questionIndex),
      question: exam?.questions[Number(questionIndex)]?.question || "",
      answer,
    }))
    await safeFetch(`/api/exams/${params.id}/submit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ answers: formatted }),
    })
    router.push(`/exams/${params.id}`)
  }

  function formatTime(s: number) {
    const m = Math.floor(s / 60)
    const sec = s % 60
    return `${m}:${sec.toString().padStart(2, "0")}`
  }

  if (!exam) return <div className="text-muted-foreground pt-10">Loading...</div>

  return (
    <div className="max-w-3xl">
      <Breadcrumb items={[{ label: "Exams", href: "/exams" }, { label: exam?.title || "Exam" }]} />
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">{exam.title}</h1>
          {!fullscreen && <p className="text-xs text-red-500">Not in fullscreen mode — violations are being logged</p>}
        </div>
        <div role="timer" aria-live="polite" aria-label="Time remaining" className={`text-lg font-mono font-bold ${timeLeft < 300 ? "text-red-500" : "text-muted-foreground"}`}>
          {formatTime(timeLeft)}
        </div>
      </div>

      {exam.instructions && <p className="mb-6 text-sm text-muted-foreground italic">{exam.instructions}</p>}

      <div className="space-y-6">
        {exam.questions.map((q, idx) => (
          <div key={idx} className="rounded-lg border p-4">
            <div className="mb-1 text-xs text-muted-foreground">Q{idx + 1} &middot; {q.type.replace("_", " ")} &middot; {q.maxScore} pts</div>
            <p className="mb-3 text-sm font-medium">{q.question}</p>

            {q.type === "multiple_choice" && q.options && (
              <div className="space-y-2">
                {q.options.map((opt, oi) => (
                  <label key={oi} className="flex cursor-pointer items-center gap-2 rounded border p-2 text-sm hover:bg-accent">
                    <input
                      type="radio"
                      name={`q-${idx}`}
                      checked={answers[idx] === String.fromCharCode(97 + oi)}
                      onChange={() => setAnswers({ ...answers, [idx]: String.fromCharCode(97 + oi) })}
                    />
                    {opt}
                  </label>
                ))}
              </div>
            )}

            {q.type === "essay" && (
              <textarea
                value={answers[idx] || ""}
                onChange={(e) => setAnswers({ ...answers, [idx]: e.target.value })}
                rows={5}
                className="w-full rounded-lg border px-4 py-2 text-sm outline-none focus:border-ring"
                placeholder="Write your answer..."
              />
            )}

            {q.type === "short_answer" && (
              <input
                value={answers[idx] || ""}
                onChange={(e) => setAnswers({ ...answers, [idx]: e.target.value })}
                className="w-full rounded-lg border px-4 py-2 text-sm outline-none focus:border-ring"
                placeholder="Your answer"
              />
            )}
          </div>
        ))}
      </div>

      <Button
        onClick={handleSubmit}
        disabled={submitting}
        className="mt-6"
      >
        {submitting ? "Submitting..." : "Submit Exam"}
      </Button>
    </div>
  )
}
