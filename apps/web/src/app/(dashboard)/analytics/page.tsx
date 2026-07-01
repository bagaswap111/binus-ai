"use client"

import { useEffect, useState } from "react"
import { safeFetchJSON, safeFetch } from "@/lib/security"

export default function AnalyticsPage() {
  const [grades, setGrades] = useState<Array<{
    examId: string; title: string; maxScore: number
    count: number; avg: number; min: number; max: number; median: number
    distribution: Record<string, number>
  }>>([])
  const [gaps, setGaps] = useState<{ gaps: Array<{ examTitle: string; question: string; avgScore: number; intervention: string }>; totalWeakQuestions: number } | null>(null)
  const [tab, setTab] = useState("grades")

  useEffect(() => { safeFetchJSON<Array<{ examId: string; title: string; maxScore: number; count: number; avg: number; min: number; max: number; median: number; distribution: Record<string, number> }>>("/api/analytics/grades").then((d) => d && setGrades(d)) }, [])
  useEffect(() => { safeFetchJSON<{ gaps: Array<{ examTitle: string; question: string; avgScore: number; intervention: string }>; totalWeakQuestions: number }>("/api/analytics/knowledge-gaps").then((d) => d && setGaps(d)) }, [])

  function bar(value: number, max: number, color: string) {
    const pct = max > 0 ? (value / max) * 100 : 0
    return (
      <div className="flex items-center gap-2 text-xs">
        <div className="h-4 w-full rounded bg-muted">
          <div className={`h-full rounded ${color}`} style={{ width: `${pct}%` }} />
        </div>
        <span className="w-8 text-right font-medium">{value}</span>
      </div>
    )
  }

  return (
    <div>
      <h1 className="mb-6 text-xl font-semibold">Learning Analytics</h1>
      <div className="tab-list" role="tablist" aria-label="Learning Analytics">
        {["grades", "gaps"].map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`tab ${tab === t ? "tab-active" : ""}`}
            role="tab"
            aria-selected={tab === t}
            aria-controls={`panel-${t}`}
            id={`tab-${t}`}
          >{t.replace("-", " ")}</button>
        ))}
      </div>

      {tab === "grades" && (
        <div role="tabpanel" id="panel-grades" aria-labelledby="tab-grades" className="space-y-6">
          {grades.length === 0 && <p className="text-center text-muted-foreground pt-10">No graded exams yet</p>}
          {grades.map((g) => (
            <div key={g.examId} className="rounded-lg border p-4">
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <p className="font-medium">{g.title}</p>
                  <p className="text-xs text-muted-foreground">{g.count} submissions &middot; max {g.maxScore} pts</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold">{g.avg}</p>
                  <p className="text-xs text-muted-foreground">avg score</p>
                </div>
              </div>
              <div className="mb-3 grid grid-cols-3 gap-3 text-center text-sm">
                <div className="rounded bg-muted p-2">
                  <p className="font-medium text-green-600">{g.max}</p>
                  <p className="text-xs text-muted-foreground">Highest</p>
                </div>
                <div className="rounded bg-muted p-2">
                  <p className="font-medium">{g.median}</p>
                  <p className="text-xs text-muted-foreground">Median</p>
                </div>
                <div className="rounded bg-muted p-2">
                  <p className="font-medium text-red-600">{g.min}</p>
                  <p className="text-xs text-muted-foreground">Lowest</p>
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground mb-1">Distribution</p>
                {Object.entries(g.distribution).map(([range, count]) => (
                  <div key={range} className="flex items-center gap-2 text-xs">
                    <span className="w-12 text-muted-foreground">{range}</span>
                    {bar(count, g.count, count > g.count / 2 ? "bg-blue-500" : "bg-blue-300")}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === "gaps" && (
        <div role="tabpanel" id="panel-gaps" aria-labelledby="tab-gaps" className="space-y-4">
          {gaps && gaps.gaps.length === 0 && <p className="text-center text-muted-foreground pt-10">No knowledge gaps detected</p>}
          {gaps && <p className="text-sm text-muted-foreground">{gaps.totalWeakQuestions} weak question{gaps.totalWeakQuestions !== 1 ? "s" : ""} identified</p>}
          {gaps?.gaps.map((g, idx) => (
            <div key={idx} className="rounded-lg border p-4">
              <div className="mb-1 text-xs text-muted-foreground">{g.examTitle}</div>
              <p className="mb-2 text-sm font-medium">{g.question}</p>
              <div className="mb-2 flex items-center gap-2">
                <div className="h-2 w-full max-w-xs rounded bg-red-100">
                  <div className="h-full rounded bg-red-500" style={{ width: `${g.avgScore}%` }} />
                </div>
                <span className="text-xs font-medium text-red-600">{g.avgScore}%</span>
              </div>
              <p className="text-xs text-muted-foreground">{g.intervention}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
