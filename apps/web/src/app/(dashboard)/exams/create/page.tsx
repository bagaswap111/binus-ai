"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"

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

  useEffect(() => {
    fetch("/api/subjects").then((r) => r.ok && r.json()).then(setSubjects)
  }, [])

  function addQuestion(type: Question["type"]) {
    setQuestions([...questions, { type, question: "", maxScore: type === "multiple_choice" ? 1 : 10, options: type === "multiple_choice" ? ["", "", "", ""] : undefined }])
  }

  function updateQuestion(idx: number, field: string, value: unknown) {
    setQuestions(questions.map((q, i) => (i === idx ? { ...q, [field]: value } : q)))
  }

  function removeQuestion(idx: number) {
    setQuestions(questions.filter((_, i) => i !== idx))
  }

  async function handleSubmit() {
    const res = await fetch("/api/exams", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, description, instructions, questions, subjectId, duration, maxScore, passingScore }),
    })
    if (res.ok) {
      const exam = await res.json()
      router.push(`/exams/${exam.id}`)
    }
  }

  return (
    <div className="max-w-3xl">
      <h1 className="mb-6 text-xl font-semibold">Create Exam</h1>

      <div className="space-y-4">
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Exam title" className="w-full rounded-lg border px-4 py-2 text-sm outline-none focus:border-zinc-400" />
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description (optional)" className="w-full rounded-lg border px-4 py-2 text-sm outline-none focus:border-zinc-400" rows={2} />
        <textarea value={instructions} onChange={(e) => setInstructions(e.target.value)} placeholder="Instructions (optional)" className="w-full rounded-lg border px-4 py-2 text-sm outline-none focus:border-zinc-400" rows={2} />

        <div className="flex gap-4">
          <select value={subjectId} onChange={(e) => setSubjectId(e.target.value)} className="flex-1">
            <option value="">Select subject</option>
            {subjects.map((s) => <option key={s.id} value={s.id}>{s.name} ({s.code})</option>)}
          </select>
          <input type="number" value={duration} onChange={(e) => setDuration(Number(e.target.value))} placeholder="Duration (min)" className="w-32 rounded-lg border px-4 py-2 text-sm outline-none focus:border-zinc-400" />
          <input type="number" value={maxScore} onChange={(e) => setMaxScore(Number(e.target.value))} placeholder="Max score" className="w-28 rounded-lg border px-4 py-2 text-sm outline-none focus:border-zinc-400" />
          <input type="number" value={passingScore} onChange={(e) => setPassingScore(Number(e.target.value))} placeholder="Passing score" className="w-28 rounded-lg border px-4 py-2 text-sm outline-none focus:border-zinc-400" />
        </div>

        <div className="space-y-3">
          <div className="flex gap-2">
            <button onClick={() => addQuestion("essay")} className="rounded-lg bg-zinc-800 px-3 py-1.5 text-xs text-white">+ Essay</button>
            <button onClick={() => addQuestion("multiple_choice")} className="rounded-lg bg-zinc-800 px-3 py-1.5 text-xs text-white">+ Multiple Choice</button>
            <button onClick={() => addQuestion("short_answer")} className="rounded-lg bg-zinc-800 px-3 py-1.5 text-xs text-white">+ Short Answer</button>
          </div>

          {questions.map((q, idx) => (
            <div key={idx} className="rounded-lg border p-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-medium text-zinc-500">Q{idx + 1} &middot; {q.type.replace("_", " ")}</span>
                <button onClick={() => removeQuestion(idx)} className="text-xs text-red-500">Remove</button>
              </div>
              <input value={q.question} onChange={(e) => updateQuestion(idx, "question", e.target.value)} placeholder="Question" className="mb-2 w-full rounded border px-3 py-1.5 text-sm outline-none focus:border-zinc-400" />
              <input type="number" value={q.maxScore} onChange={(e) => updateQuestion(idx, "maxScore", Number(e.target.value))} placeholder="Max score" className="mb-2 w-24 rounded border px-3 py-1.5 text-sm outline-none focus:border-zinc-400" />

              {q.type === "multiple_choice" && (
                <div className="space-y-1">
                  {(q.options || ["", "", "", ""]).map((opt, oi) => (
                    <div key={oi} className="flex items-center gap-2">
                      <input type="radio" name={`mc-${idx}`} checked={q.answer === String.fromCharCode(97 + oi)} onChange={() => updateQuestion(idx, "answer", String.fromCharCode(97 + oi))} />
                      <input value={opt} onChange={(e) => {
                        const opts = [...(q.options || ["", "", "", ""])]
                        opts[oi] = e.target.value
                        updateQuestion(idx, "options", opts)
                      }} placeholder={`Option ${String.fromCharCode(65 + oi)}`} className="flex-1 rounded border px-3 py-1 text-sm outline-none focus:border-zinc-400" />
                    </div>
                  ))}
                </div>
              )}

              {q.type === "short_answer" && (
                <input value={q.answer || ""} onChange={(e) => updateQuestion(idx, "answer", e.target.value)} placeholder="Correct answer" className="w-full rounded border px-3 py-1.5 text-sm outline-none focus:border-zinc-400" />
              )}
            </div>
          ))}
        </div>

        <button onClick={handleSubmit} disabled={!title || !subjectId || questions.length === 0} className="rounded-lg bg-zinc-900 px-6 py-2 text-sm text-white disabled:opacity-50">
          Create Exam
        </button>
      </div>
    </div>
  )
}
