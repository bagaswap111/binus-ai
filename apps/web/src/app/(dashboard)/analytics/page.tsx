"use client"

import { useEffect, useState } from "react"

export default function AnalyticsPage() {
  const [grades, setGrades] = useState<Array<{
    examId: string; title: string; maxScore: number
    count: number; avg: number; min: number; max: number; median: number
    distribution: Record<string, number>
  }>>([])
  const [gaps, setGaps] = useState<{ gaps: Array<{ examTitle: string; question: string; avgScore: number; intervention: string }>; totalWeakQuestions: number } | null>(null)
  const [tab, setTab] = useState("grades")

  useEffect(() => { fetch("/api/analytics/grades").then((r) => r.ok && r.json()).then(setGrades) }, [])
  useEffect(() => { fetch("/api/analytics/knowledge-gaps").then((r) => r.ok && r.json()).then(setGaps) }, [])

  function bar(value: number, max: number, color: string) {
    const pct = max > 0 ? (value / max) * 100 : 0
    return (
      <div className="flex items-center gap-2 text-xs">
        <div className="h-4 w-full rounded bg-zinc-100">
          <div className={`h-full rounded ${color}`} style={{ width: `${pct}%` }} />
        </div>
        <span className="w-8 text-right font-medium">{value}</span>
      </div>
    )
  }

  return (
    <div>
      <h1 className="mb-6 text-xl font-semibold">Learning Analytics</h1>
      <div className="mb-6 flex gap-2 border-b pb-2">
        {["grades", "gaps"].map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`rounded-t-md px-4 py-2 text-sm font-medium capitalize ${tab === t ? "border-b-2 border-zinc-900 text-zinc-900" : "text-zinc-400 hover:text-zinc-700"}`}
          >{t.replace("-", " ")}</button>
        ))}
      </div>

      {tab === "grades" && (
        <div className="space-y-6">
          {grades.length === 0 && <p className="text-center text-zinc-400 pt-10">No graded exams yet</p>}
          {grades.map((g) => (
            <div key={g.examId} className="rounded-lg border p-4">
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <p className="font-medium">{g.title}</p>
                  <p className="text-xs text-zinc-500">{g.count} submissions &middot; max {g.maxScore} pts</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold">{g.avg}</p>
                  <p className="text-xs text-zinc-400">avg score</p>
                </div>
              </div>
              <div className="mb-3 grid grid-cols-3 gap-3 text-center text-sm">
                <div className="rounded bg-zinc-50 p-2">
                  <p className="font-medium text-green-600">{g.max}</p>
                  <p className="text-xs text-zinc-400">Highest</p>
                </div>
                <div className="rounded bg-zinc-50 p-2">
                  <p className="font-medium">{g.median}</p>
                  <p className="text-xs text-zinc-400">Median</p>
                </div>
                <div className="rounded bg-zinc-50 p-2">
                  <p className="font-medium text-red-600">{g.min}</p>
                  <p className="text-xs text-zinc-400">Lowest</p>
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-medium text-zinc-500 mb-1">Distribution</p>
                {Object.entries(g.distribution).map(([range, count]) => (
                  <div key={range} className="flex items-center gap-2 text-xs">
                    <span className="w-12 text-zinc-500">{range}</span>
                    {bar(count, g.count, count > g.count / 2 ? "bg-blue-500" : "bg-blue-300")}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === "gaps" && (
        <div className="space-y-4">
          {gaps && gaps.gaps.length === 0 && <p className="text-center text-zinc-400 pt-10">No knowledge gaps detected</p>}
          {gaps && <p className="text-sm text-zinc-500">{gaps.totalWeakQuestions} weak question{gaps.totalWeakQuestions !== 1 ? "s" : ""} identified</p>}
          {gaps?.gaps.map((g, idx) => (
            <div key={idx} className="rounded-lg border p-4">
              <div className="mb-1 text-xs text-zinc-500">{g.examTitle}</div>
              <p className="mb-2 text-sm font-medium">{g.question}</p>
              <div className="mb-2 flex items-center gap-2">
                <div className="h-2 w-full max-w-xs rounded bg-red-100">
                  <div className="h-full rounded bg-red-500" style={{ width: `${g.avgScore}%` }} />
                </div>
                <span className="text-xs font-medium text-red-600">{g.avgScore}%</span>
              </div>
              <p className="text-xs text-zinc-500">{g.intervention}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
