"use client"

import { useState } from "react"

export default function TeachingToolsPage() {
  const [tab, setTab] = useState("syllabus")

  return (
    <div>
      <h1 className="mb-6 text-xl font-semibold">Teaching Tools</h1>
      <div className="tab-list">
        {["syllabus", "learning-path"].map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`tab ${tab === t ? "tab-active" : ""}`}
          >
            {t.replace("-", " ")}</button>
        ))}
      </div>
      {tab === "syllabus" && <SyllabusTab />}
      {tab === "learning-path" && <LearningPathTab />}
    </div>
  )
}

function SyllabusTab() {
  const [form, setForm] = useState({ courseName: "", courseCode: "", credits: 3, cpmk: "", semester: "" })
  const [result, setResult] = useState<{ courseName: string; courseCode: string; credits: number; semester: string; cpmk: string; weeks: Array<{ week: number; topic: string; activities: string }> } | null>(null)

  async function generate() {
    const res = await fetch("/api/teaching/syllabus", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    })
    if (res.ok) setResult(await res.json())
  }

  return (
    <div>
      <p className="mb-4 text-sm text-zinc-500">Generate a 16-week syllabus/RPS from course learning outcomes (CPMK).</p>
      <div className="max-w-lg space-y-3">
        <input value={form.courseName} onChange={(e) => setForm({ ...form, courseName: e.target.value })} placeholder="Course name" className="w-full rounded-lg border px-4 py-2 text-sm outline-none" />
        <div className="flex gap-3">
          <input value={form.courseCode} onChange={(e) => setForm({ ...form, courseCode: e.target.value })} placeholder="Course code" className="flex-1 rounded-lg border px-4 py-2 text-sm outline-none" />
          <input type="number" value={form.credits} onChange={(e) => setForm({ ...form, credits: Number(e.target.value) })} className="w-20 rounded-lg border px-4 py-2 text-sm outline-none" />
        </div>
        <textarea value={form.cpmk} onChange={(e) => setForm({ ...form, cpmk: e.target.value })} rows={2} placeholder="CPMK (Course Learning Outcomes)" className="w-full rounded-lg border px-4 py-2 text-sm outline-none" />
        <button onClick={generate} disabled={!form.courseName || !form.cpmk} className="rounded-lg bg-zinc-900 px-4 py-2 text-sm text-white disabled:opacity-50">
          Generate Syllabus
        </button>
      </div>
      {result && (
        <div className="mt-6">
          <h2 className="mb-2 text-lg font-semibold">{result.courseName} ({result.courseCode}) — {result.semester}</h2>
          <p className="mb-4 text-sm text-zinc-500">{result.credits} credits &middot; CPMK: {result.cpmk}</p>
          <div className="space-y-2">
            {result.weeks.map((w) => (
              <div key={w.week} className="rounded border p-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Week {w.week}</span>
                  <span className="text-xs text-zinc-400">{w.activities}</span>
                </div>
                <p className="mt-1 text-sm text-zinc-600">{w.topic}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function LearningPathTab() {
  const [form, setForm] = useState({ subject: "", currentScore: 50, completedTopics: "" })
  const [result, setResult] = useState<{
    subject: string; currentLevel: string; completedTopics: string[]
    recommendedTopics: string[]; focusAreas: string[]; nextMilestone: string
  } | null>(null)

  const subjects = ["Mathematics", "Programming", "Physics", "English"]

  async function generate() {
    const res = await fetch("/api/teaching/learning-path", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        subject: form.subject,
        currentScore: form.currentScore,
        completedTopics: form.completedTopics.split(",").map((t) => t.trim()).filter(Boolean),
      }),
    })
    if (res.ok) setResult(await res.json())
  }

  return (
    <div>
      <p className="mb-4 text-sm text-zinc-500">Generate a personalized learning path based on current performance.</p>
      <div className="max-w-lg space-y-3">
        <select value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })}>
          <option value="">Select subject</option>
          {subjects.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <div className="flex items-center gap-3">
          <span className="text-sm text-zinc-500">Current score:</span>
          <input type="range" min={0} max={100} value={form.currentScore} onChange={(e) => setForm({ ...form, currentScore: Number(e.target.value) })} className="flex-1" />
          <span className="w-8 text-sm font-medium">{form.currentScore}</span>
        </div>
        <input value={form.completedTopics} onChange={(e) => setForm({ ...form, completedTopics: e.target.value })} placeholder="Completed topics (comma-separated)" className="w-full rounded-lg border px-4 py-2 text-sm outline-none" />
        <button onClick={generate} disabled={!form.subject} className="rounded-lg bg-zinc-900 px-4 py-2 text-sm text-white disabled:opacity-50">
          Generate Path
        </button>
      </div>
      {result && (
        <div className="mt-6 space-y-4">
          <div className="rounded-lg border p-4">
            <p className="text-sm font-medium">{result.subject} — {result.currentLevel}</p>
            <p className="text-xs text-zinc-500">Next milestone: {result.nextMilestone}</p>
          </div>
          <div>
            <p className="mb-2 text-sm font-medium">Recommended Topics</p>
            <div className="flex flex-wrap gap-2">
              {result.recommendedTopics.map((t) => (
                <span key={t} className="rounded-full bg-blue-100 px-3 py-1 text-sm text-blue-700">{t}</span>
              ))}
            </div>
          </div>
          <div>
            <p className="mb-2 text-sm font-medium">Focus Areas</p>
            <ul className="list-inside list-disc text-sm text-zinc-600">
              {result.focusAreas.map((a) => <li key={a}>{a}</li>)}
            </ul>
          </div>
        </div>
      )}
    </div>
  )
}
