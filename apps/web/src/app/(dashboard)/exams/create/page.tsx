"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { safeFetchJSON, safeFetch } from "@/lib/security"
import { Button } from "@/components/ui/button"
import Breadcrumb from "@/components/breadcrumb"

interface Subject {
  id: string
  name: string
  code: string
}

interface Question {
  type: "essay" | "multiple_choice" | "short_answer"
  question: string
  options?: string[]
  maxScore: number
  answer?: string
  bloomLevel?: string
}

export default function CreateExamPage() {
  const router = useRouter()
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [instructions, setInstructions] = useState("")
  const [subjectId, setSubjectId] = useState("")
  const [duration, setDuration] = useState(60)
  const [maxScore, setMaxScore] = useState(100)
  const [passingScore, setPassingScore] = useState(0)
  const [questions, setQuestions] = useState<Question[]>([])
  const [isDirty, setIsDirty] = useState(false)

  // ponytail: warn on navigate away with unsaved form data
  useEffect(() => {
    if (!isDirty) return
    const handler = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = "" }
    window.addEventListener("beforeunload", handler)
    return () => window.removeEventListener("beforeunload", handler)
  }, [isDirty])

  useEffect(() => {
    safeFetchJSON<Subject[]>("/api/subjects").then((d) => d && setSubjects(d))
  }, [])

  function addQuestion(type: Question["type"]) {
    setQuestions([...questions, { type, question: "", maxScore: type === "multiple_choice" ? 1 : 10, options: type === "multiple_choice" ? ["", "", "", ""] : undefined }])
  }

  function updateQuestion(idx: number, field: string, value: unknown) {
    setQuestions(questions.map((q, i) => (i === idx ? { ...q, [field]: value } : q)))
  }

  function removeQuestion(idx: number) {
    if (!confirm(`Remove Q${idx + 1}?`)) return
    setQuestions(questions.filter((_, i) => i !== idx))
  }

  async function handleSubmit() {
    const res = await safeFetch("/api/exams", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, description, instructions, questions, subjectId, duration, maxScore, passingScore }),
    })
    if (res) {
      const exam = await res.json()
      router.push(`/exams/${exam.id}`)
    } else {
      toast.error("Failed to create exam. Please try again.")
    }
  }

  return (
    <div className="max-w-3xl">
      <Breadcrumb items={[{ label: "Exams", href: "/exams" }, { label: "Create Exam" }]} />
      <h1 className="mb-6 text-xl font-semibold">Create Exam</h1>

      <div className="space-y-6">
        <label htmlFor="exam-title" className="sr-only">Exam Title *</label>
          <input id="exam-title" value={title} onChange={(e) => { setTitle(e.target.value); setIsDirty(true) }} placeholder="Exam title" maxLength={200} className="w-full rounded-lg border px-4 py-2 text-sm outline-none focus:border-ring" />
        <label htmlFor="exam-desc" className="sr-only">Description</label>
        <textarea id="exam-desc" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description (optional)" maxLength={2000} className="w-full rounded-lg border px-4 py-2 text-sm outline-none focus:border-ring" rows={2} />
        <label htmlFor="exam-instr" className="sr-only">Instructions</label>
        <textarea id="exam-instr" value={instructions} onChange={(e) => setInstructions(e.target.value)} placeholder="Instructions (optional)" maxLength={2000} className="w-full rounded-lg border px-4 py-2 text-sm outline-none focus:border-ring" rows={2} />

        <div className="flex gap-4">
          <label htmlFor="exam-subject" className="sr-only">Subject *</label>
          <select id="exam-subject" value={subjectId} onChange={(e) => setSubjectId(e.target.value)} className="flex-1">
            <option value="">Select subject</option>
            {subjects.map((s) => <option key={s.id} value={s.id}>{s.name} ({s.code})</option>)}
          </select>
          <label htmlFor="exam-duration" className="sr-only">Duration (minutes)</label>
          <input id="exam-duration" type="number" value={duration} onChange={(e) => setDuration(Number(e.target.value))} placeholder="Duration (min)" min={1} max={480} className="w-32 rounded-lg border px-4 py-2 text-sm outline-none focus:border-ring" />
          <label htmlFor="exam-maxscore" className="sr-only">Max Score</label>
          <input id="exam-maxscore" type="number" value={maxScore} onChange={(e) => setMaxScore(Number(e.target.value))} placeholder="Max score" min={1} max={1000} className="w-28 rounded-lg border px-4 py-2 text-sm outline-none focus:border-ring" />
          <label htmlFor="exam-passing" className="sr-only">Passing Score</label>
          <input id="exam-passing" type="number" value={passingScore} onChange={(e) => setPassingScore(Number(e.target.value))} placeholder="Passing score" min={0} max={1000} className="w-28 rounded-lg border px-4 py-2 text-sm outline-none focus:border-ring" />
        </div>

        <div className="space-y-3">
          <div className="flex gap-2">
            <Button variant="secondary" size="xs" onClick={() => addQuestion("essay")}>+ Essay</Button>
            <Button variant="secondary" size="xs" onClick={() => addQuestion("multiple_choice")}>+ Multiple Choice</Button>
            <Button variant="secondary" size="xs" onClick={() => addQuestion("short_answer")}>+ Short Answer</Button>
          </div>

          {questions.map((q, idx) => (
            <div key={idx} className="rounded-lg border p-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">Q{idx + 1} &middot; {q.type.replace("_", " ")}</span>
                <Button variant="destructive" size="xs" onClick={() => removeQuestion(idx)} title="Remove this question">Remove</Button>
              </div>
              <input value={q.question} onChange={(e) => updateQuestion(idx, "question", e.target.value)} placeholder="Question" className="mb-2 w-full rounded border px-3 py-1.5 text-sm outline-none focus:border-ring" />
              <input type="number" value={q.maxScore} onChange={(e) => updateQuestion(idx, "maxScore", Number(e.target.value))} placeholder="Max score" className="mb-2 w-24 rounded border px-3 py-1.5 text-sm outline-none focus:border-ring" />

              {q.type === "multiple_choice" && (
                <div className="space-y-1">
                  {(q.options || ["", "", "", ""]).map((opt, oi) => (
                    <div key={oi} className="flex items-center gap-2">
                      <input type="radio" name={`mc-${idx}`} checked={q.answer === String.fromCharCode(97 + oi)} onChange={() => updateQuestion(idx, "answer", String.fromCharCode(97 + oi))} />
                      <input value={opt} onChange={(e) => {
                        const opts = [...(q.options || ["", "", "", ""])]
                        opts[oi] = e.target.value
                        updateQuestion(idx, "options", opts)
                      }} placeholder={`Option ${String.fromCharCode(65 + oi)}`} className="flex-1 rounded border px-3 py-1 text-sm outline-none focus:border-ring" />
                    </div>
                  ))}
                </div>
              )}

              {q.type === "short_answer" && (
                <input value={q.answer || ""} onChange={(e) => updateQuestion(idx, "answer", e.target.value)} placeholder="Correct answer" className="w-full rounded border px-3 py-1.5 text-sm outline-none focus:border-ring" />
              )}
            </div>
          ))}
        </div>

        <Button onClick={handleSubmit} disabled={!title || !subjectId || questions.length === 0}>
          Create Exam
        </Button>
        <Button variant="outline" onClick={() => router.back()} className="ml-2">Cancel</Button>
      </div>
    </div>
  )
}
