"use client"

import { useEffect, useState } from "react"

interface Project {
  id: string
  name: string
}

interface MatchResult {
  fileA: string
  fileB: string
  similarity: number
  matches: Array<{ text: string; similarity: number }>
}

export default function PlagiarismPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [selected, setSelected] = useState("")
  const [results, setResults] = useState<MatchResult[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetch("/api/projects").then((r) => r.ok && r.json()).then(setProjects)
  }, [])

  async function check() {
    if (!selected) return
    setLoading(true)
    const res = await fetch("/api/plagiarism", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ projectId: selected }),
    })
    if (res.ok) setResults((await res.json()).results)
    setLoading(false)
  }

  return (
    <div>
      <h1 className="mb-6 text-xl font-semibold">Plagiarism Checker</h1>

      <div className="mb-6 flex gap-3">
        <select value={selected} onChange={(e) => setSelected(e.target.value)} className="flex-1 rounded-lg border px-4 py-2 text-sm outline-none">
          <option value="">Select a project</option>
          {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <button onClick={check} disabled={!selected || loading} className="rounded-lg bg-zinc-900 px-6 py-2 text-sm text-white disabled:opacity-50">
          {loading ? "Checking..." : "Check Plagiarism"}
        </button>
      </div>

      <div className="space-y-4">
        {results.length === 0 && !loading && <p className="text-center text-zinc-400 pt-10">Select a project and click check</p>}
        {results.sort((a, b) => b.similarity - a.similarity).map((r, idx) => (
          <div key={idx} className={`rounded-lg border p-4 ${r.similarity > 70 ? "border-red-300 bg-red-50" : r.similarity > 40 ? "border-yellow-300 bg-yellow-50" : ""}`}>
            <div className="mb-2 flex items-center justify-between">
              <div className="text-sm font-medium">{r.fileA} vs {r.fileB}</div>
              <div className={`text-lg font-bold ${r.similarity > 70 ? "text-red-600" : r.similarity > 40 ? "text-yellow-600" : "text-zinc-600"}`}>
                {r.similarity}%
              </div>
            </div>
            {r.matches.length > 0 && (
              <details>
                <summary className="cursor-pointer text-xs text-zinc-500">Show matching sections ({r.matches.length})</summary>
                <div className="mt-2 space-y-1">
                  {r.matches.map((m, mi) => (
                    <div key={mi} className="rounded bg-zinc-100 p-2 text-xs text-zinc-700">
                      <span className="font-medium">{m.similarity}%</span>: &ldquo;{m.text}&rdquo;
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
