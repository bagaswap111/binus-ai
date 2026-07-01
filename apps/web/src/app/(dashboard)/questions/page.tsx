"use client"

import { useEffect, useState } from "react"
import { safeFetchJSON, safeFetch } from "@/lib/security"

interface QBQuestion {
  id: string
  type: string
  question: string
  options: string[] | null
  answer: string | null
  maxScore: number
  bloomLevel: string | null
  tags: string[]
  difficulty: string | null
  subject: { name: string; code: string }
}

const BLOOM_LEVELS = ["C1 (Remember)", "C2 (Understand)", "C3 (Apply)", "C4 (Analyze)", "C5 (Evaluate)", "C6 (Create)"]

export default function QuestionsPage() {
  const [questions, setQuestions] = useState<QBQuestion[]>([])
  const [showForm, setShowForm] = useState(false)

  useEffect(() => {
    safeFetchJSON<QBQuestion[]>("/api/questions").then((d) => d && setQuestions(d))
  }, [])

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold">Question Bank</h1>
        <button onClick={() => setShowForm(!showForm)} className="rounded-lg bg-zinc-900 px-4 py-2 text-sm text-white">
          {showForm ? "Cancel" : "+ New Question"}
        </button>
      </div>

      {showForm && <QuestionForm onDone={() => { setShowForm(false); safeFetchJSON<QBQuestion[]>("/api/questions").then((d) => d && setQuestions(d)) }} />}

      <div className="space-y-3">
        {questions.map((q) => (
          <div key={q.id} className="rounded-lg border p-4">
            <div className="mb-1 flex items-center gap-2 text-xs text-zinc-500">
              <span className="rounded bg-zinc-100 px-1.5 py-0.5">{q.type.replace("_", " ")}</span>
              {q.bloomLevel && <span className="rounded bg-blue-100 px-1.5 py-0.5 text-blue-700">{q.bloomLevel}</span>}
              {q.difficulty && <span className="rounded bg-orange-100 px-1.5 py-0.5 text-orange-700">{q.difficulty}</span>}
              <span>{q.subject.code}</span>
              <span>{q.maxScore} pts</span>
            </div>
            <p className="text-sm">{q.question}</p>
            <div className="mt-1 flex flex-wrap gap-1">
              {q.tags.map((t) => (
                <span key={t} className="rounded bg-zinc-100 px-1.5 py-0.5 text-xs text-zinc-500">{t}</span>
              ))}
            </div>
          </div>
        ))}
        {questions.length === 0 && <p className="pt-10 text-center text-zinc-400">No questions yet</p>}
      </div>
    </div>
  )
}

function QuestionForm({ onDone }: { onDone: () => void }) {
  const [subjects, setSubjects] = useState<Array<{ id: string; name: string; code: string }>>([])
  const [form, setForm] = useState({
    subjectId: "", type: "essay", question: "", options: ["", "", "", ""], answer: "",
    maxScore: 10, bloomLevel: "", tags: "", difficulty: "",
  })

  useEffect(() => { safeFetchJSON<{ id: string; name: string; code: string }[]>("/api/subjects").then((d) => d && setSubjects(d)) }, [])

  async function handleSubmit() {
    await fetch("/api/questions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean),
        options: form.type === "multiple_choice" ? form.options : null,
      }),
    })
    onDone()
  }

  return (
    <div className="mb-6 rounded-lg border p-4 space-y-3">
      <div className="flex gap-3">
          <label htmlFor="q-subject" className="sr-only">Subject</label>
          <select id="q-subject" value={form.subjectId} onChange={(e) => setForm({ ...form, subjectId: e.target.value })} className="flex-1">
          <option value="">Subject</option>
          {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <label htmlFor="q-type" className="sr-only">Type</label>
        <select id="q-type" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
          <option value="essay">Essay</option>
          <option value="multiple_choice">Multiple Choice</option>
          <option value="short_answer">Short Answer</option>
        </select>
        <label htmlFor="q-bloom" className="sr-only">Bloom Level</label>
        <select id="q-bloom" value={form.bloomLevel} onChange={(e) => setForm({ ...form, bloomLevel: e.target.value })}>
          <option value="">Bloom Level</option>
          {BLOOM_LEVELS.map((b) => <option key={b} value={b}>{b}</option>)}
        </select>
        <label htmlFor="q-diff" className="sr-only">Difficulty</label>
        <select id="q-diff" value={form.difficulty} onChange={(e) => setForm({ ...form, difficulty: e.target.value })}>
          <option value="">Difficulty</option>
          <option value="easy">Easy</option>
          <option value="medium">Medium</option>
          <option value="hard">Hard</option>
        </select>
        <label htmlFor="q-score" className="sr-only">Max Score</label>
        <input id="q-score" type="number" value={form.maxScore} onChange={(e) => setForm({ ...form, maxScore: Number(e.target.value) })} className="w-20 rounded border px-3 py-1.5 text-sm outline-none" placeholder="Score" />
      </div>
      <label htmlFor="q-text" className="sr-only">Question</label>
      <textarea id="q-text" value={form.question} onChange={(e) => setForm({ ...form, question: e.target.value })} className="w-full rounded border px-3 py-1.5 text-sm outline-none" rows={2} placeholder="Question" />
      {form.type === "multiple_choice" && form.options.map((opt, i) => (
        <div key={i} className="flex items-center gap-2">
          <input type="radio" name="correct" checked={form.answer === String.fromCharCode(97 + i)} onChange={() => setForm({ ...form, answer: String.fromCharCode(97 + i) })} />
          <label htmlFor={`q-opt-${i}`} className="sr-only">Option {String.fromCharCode(65 + i)}</label>
          <input id={`q-opt-${i}`} value={opt} onChange={(e) => {
            const opts = [...form.options]; opts[i] = e.target.value; setForm({ ...form, options: opts })
          }} className="flex-1 rounded border px-3 py-1 text-sm outline-none" placeholder={`Option ${String.fromCharCode(65 + i)}`} />
        </div>
      ))}
      {form.type === "short_answer" && (<>
        <label htmlFor="q-answer" className="sr-only">Correct Answer</label>
        <input id="q-answer" value={form.answer} onChange={(e) => setForm({ ...form, answer: e.target.value })} className="w-full rounded border px-3 py-1.5 text-sm outline-none" placeholder="Correct answer" />
      </>)}
      <label htmlFor="q-tags" className="sr-only">Tags</label>
      <input id="q-tags" value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} className="w-full rounded border px-3 py-1.5 text-sm outline-none" placeholder="Tags (comma-separated)" />
      <button onClick={handleSubmit} disabled={!form.subjectId || !form.question} className="rounded-lg bg-zinc-900 px-4 py-2 text-sm text-white disabled:opacity-50">Save</button>
    </div>
  )
}
