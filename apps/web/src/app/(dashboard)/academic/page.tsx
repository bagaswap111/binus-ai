"use client"

import { useState, useEffect } from "react"
import { safeFetchJSON, safeFetch } from "@/lib/security"

export default function AcademicWritingPage() {
  const [tab, setTab] = useState("literature")

  return (
    <div>
      <h1 className="mb-6 text-xl font-semibold">Academic Writing Tools</h1>

      <div className="tab-list" role="tablist" aria-label="Academic Writing Tools">
        {["literature", "citation", "structure", "outline"].map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`tab ${tab === t ? "tab-active" : ""}`}
            role="tab"
            aria-selected={tab === t}
            aria-controls={`panel-${t}`}
            id={`tab-${t}`}
          >
            {t.replace("_", " ")}
          </button>
        ))}
      </div>

      {tab === "literature" && <div role="tabpanel" id="panel-literature" aria-labelledby="tab-literature"><LitReviewTab /></div>}
      {tab === "citation" && <div role="tabpanel" id="panel-citation" aria-labelledby="tab-citation"><CitationTab /></div>}
      {tab === "structure" && <div role="tabpanel" id="panel-structure" aria-labelledby="tab-structure"><StructureTab /></div>}
      {tab === "outline" && <div role="tabpanel" id="panel-outline" aria-labelledby="tab-outline"><OutlineTab /></div>}
    </div>
  )
}

function LitReviewTab() {
  const [projects, setProjects] = useState<Array<{ id: string; name: string }>>([])
  const [selected, setSelected] = useState("")
  const [matrix, setMatrix] = useState<Array<{ title: string; theme: string; methodology: string; keyFindings: string }> | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => { safeFetchJSON<Array<{ id: string; name: string }>>("/api/projects").then((d) => d && setProjects(d)) }, [])

  async function analyze() {
    if (!selected) return
    setLoading(true)
    const res = await safeFetch("/api/academic/literature", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ projectId: selected }),
    })
    if (res) setMatrix((await res.json()).matrix)
    setLoading(false)
  }

  return (
    <div>
      <p className="mb-4 text-sm text-zinc-500">Upload articles to a project, then generate a comparison matrix.</p>
      <div className="mb-6 flex gap-3">
        <label htmlFor="lit-project" className="sr-only">Select Project</label>
        <select id="lit-project" value={selected} onChange={(e) => setSelected(e.target.value)}
          className="flex-1"
          onFocus={() => safeFetchJSON<Array<{ id: string; name: string }>>("/api/projects").then((d) => d && setProjects(d))}
        >
          <option value="">Select project</option>
          {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <button onClick={analyze} disabled={!selected || loading}
          className="rounded-lg bg-zinc-900 px-4 py-2 text-sm text-white disabled:opacity-50"
        >
          {loading ? "Analyzing..." : "Generate Matrix"}
        </button>
      </div>

      {matrix && matrix.length === 0 && <p className="text-zinc-400">No text files found in project. Upload .txt or .md files.</p>}

      {matrix && matrix.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-xs text-zinc-500">
                <th className="p-2 font-medium">Title</th>
                <th className="p-2 font-medium">Theme</th>
                <th className="p-2 font-medium">Methodology</th>
                <th className="p-2 font-medium">Key Findings</th>
              </tr>
            </thead>
            <tbody>
              {matrix.map((row, idx) => (
                <tr key={idx} className="border-b hover:bg-zinc-50">
                  <td className="p-2 font-medium">{row.title}</td>
                  <td className="p-2 text-zinc-600">{row.theme}</td>
                  <td className="p-2 text-zinc-600">{row.methodology}</td>
                  <td className="p-2 text-zinc-600 max-w-xs truncate">{row.keyFindings}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function CitationTab() {
  const [doi, setDoi] = useState("")
  const [author, setAuthor] = useState("")
  const [year, setYear] = useState("")
  const [title, setTitle] = useState("")
  const [journal, setJournal] = useState("")
  const [citation, setCitation] = useState("")

  async function generate() {
    const res = await safeFetch("/api/academic/citation", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ doi, author, year, title, journal }),
    })
    if (res) setCitation((await res.json()).citation)
  }

  return (
    <div>
      <p className="mb-4 text-sm text-zinc-500">Generate APA/MLA/IEEE citations from DOI or manual input.</p>
      <div className="max-w-lg space-y-3">
        <label htmlFor="cite-doi" className="sr-only">DOI</label>
        <input id="cite-doi" value={doi} onChange={(e) => setDoi(e.target.value)} placeholder="DOI (e.g. 10.1000/xyz)" className="w-full rounded-lg border px-4 py-2 text-sm outline-none" />
        <div className="flex gap-3">
          <label htmlFor="cite-author" className="sr-only">Author</label>
          <input id="cite-author" value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="Author" className="flex-1 rounded-lg border px-4 py-2 text-sm outline-none" />
          <label htmlFor="cite-year" className="sr-only">Year</label>
          <input id="cite-year" value={year} onChange={(e) => setYear(e.target.value)} placeholder="Year" className="w-24 rounded-lg border px-4 py-2 text-sm outline-none" />
        </div>
        <label htmlFor="cite-title" className="sr-only">Title</label>
        <input id="cite-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title" className="w-full rounded-lg border px-4 py-2 text-sm outline-none" />
        <label htmlFor="cite-journal" className="sr-only">Journal/Publisher</label>
        <input id="cite-journal" value={journal} onChange={(e) => setJournal(e.target.value)} placeholder="Journal/Publisher" className="w-full rounded-lg border px-4 py-2 text-sm outline-none" />
        <button onClick={generate} className="rounded-lg bg-zinc-900 px-4 py-2 text-sm text-white">Generate Citation</button>
        {citation && (
          <div className="rounded-lg border bg-zinc-50 p-4 text-sm">
            <p className="font-medium text-zinc-700">{citation}</p>
            <button onClick={() => navigator.clipboard.writeText(citation)} className="mt-2 text-xs text-blue-600">Copy</button>
          </div>
        )}
      </div>
    </div>
  )
}

function StructureTab() {
  const [text, setText] = useState("")
  const [result, setResult] = useState<{ sections: Array<{ section: string; present: boolean; confidence: string }>; completeness: string; feedback: string } | null>(null)

  async function check() {
    const res = await safeFetch("/api/academic/structure", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    })
    if (res) setResult(await res.json())
  }

  return (
    <div>
      <p className="mb-4 text-sm text-zinc-500">Paste your paper text to check IMRaD structure (Introduction, Methods, Results, Discussion).</p>
      <label htmlFor="structure-text" className="sr-only">Paper Text</label>
      <textarea id="structure-text" value={text} onChange={(e) => setText(e.target.value)} rows={8}
        className="w-full rounded-lg border px-4 py-2 text-sm outline-none" placeholder="Paste paper text..." />
      <button onClick={check} disabled={!text} className="mt-3 rounded-lg bg-zinc-900 px-4 py-2 text-sm text-white disabled:opacity-50">
        Check Structure
      </button>
      {result && (
        <div className="mt-4 space-y-2">
          <p className={`text-sm font-medium ${result.completeness.startsWith("4/4") ? "text-green-600" : result.completeness.startsWith("2/4") ? "text-yellow-600" : "text-red-600"}`}>
            {result.completeness}
          </p>
          <p className="text-sm text-zinc-500">{result.feedback}</p>
          {result.sections.map((s) => (
            <div key={s.section} className="flex items-center gap-3 rounded border p-2 text-sm">
              <span className={`h-2 w-2 rounded-full ${s.present ? "bg-green-500" : "bg-red-400"}`} />
              <span className="w-28 font-medium">{s.section}</span>
              <span className="text-zinc-400">{s.confidence}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function OutlineTab() {
  const [topic, setTopic] = useState("")
  const [outline, setOutline] = useState<{ title: string; outline: Array<{ section: string; subsections: Array<{ title: string }> }> } | null>(null)

  async function generate() {
    const res = await safeFetch("/api/academic/outline", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "thesis", topic }),
    })
    if (res) setOutline(await res.json())
  }

  return (
    <div>
      <p className="mb-4 text-sm text-zinc-500">Generate a thesis/dissertation outline from your topic.</p>
      <div className="flex gap-3">
        <label htmlFor="outline-topic" className="sr-only">Research Topic</label>
        <input id="outline-topic" value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="Research topic" className="flex-1 rounded-lg border px-4 py-2 text-sm outline-none" />
        <button onClick={generate} disabled={!topic} className="rounded-lg bg-zinc-900 px-4 py-2 text-sm text-white disabled:opacity-50">
          Generate
        </button>
      </div>
      {outline && (
        <div className="mt-4 space-y-3">
          <p className="font-medium">{outline.title}</p>
          {outline.outline.map((ch, idx) => (
            <div key={idx} className="rounded border p-3">
              <p className="text-sm font-medium">{ch.section}</p>
              <ul className="mt-1 list-inside list-disc text-sm text-zinc-500">
                {ch.subsections.map((sub, si) => (
                  <li key={si}>{sub.title}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
