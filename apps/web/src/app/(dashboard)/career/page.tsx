"use client"

import { useState } from "react"
import { safeFetch, safeFetchJSON } from "@/lib/security"

type Tab = "recommend" | "universities" | "interview" | "portfolio"

export default function CareerPage() {
  const [tab, setTab] = useState<Tab>("recommend")

  const tabs: { key: Tab; label: string }[] = [
    { key: "recommend", label: "Career Path" },
    { key: "universities", label: "University Match" },
    { key: "interview", label: "Mock Interview" },
    { key: "portfolio", label: "Portfolio" },
  ]

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-foreground">Career & University Preparation</h1>

      <div className="tab-list" role="tablist" aria-label="Career and University Preparation">
        {tabs.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`tab ${tab === t.key ? "tab-active" : ""}`}
            role="tab"
            aria-selected={tab === t.key}
            aria-controls={`panel-${t.key}`}
            id={`tab-${t.key}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "recommend" && <div role="tabpanel" id="panel-recommend" aria-labelledby="tab-recommend"><CareerRecommender /></div>}
      {tab === "universities" && <div role="tabpanel" id="panel-universities" aria-labelledby="tab-universities"><UniversityMatcher /></div>}
      {tab === "interview" && <div role="tabpanel" id="panel-interview" aria-labelledby="tab-interview"><MockInterview /></div>}
      {tab === "portfolio" && <div role="tabpanel" id="panel-portfolio" aria-labelledby="tab-portfolio"><PortfolioBuilder /></div>}
    </div>
  )
}

function CareerRecommender() {
  const [interests, setInterests] = useState("")
  const [scores, setScores] = useState<{ subject: string; score: number }[]>([])
  const [results, setResults] = useState<any[] | null>(null)
  const [loading, setLoading] = useState(false)

  const subjects = ["Matematika", "Fisika", "Biologi", "Kimia", "Bahasa Indonesia", "Bahasa Inggris", "Ekonomi", "Sejarah"]

  function toggleScore(subject: string) {
    setScores((prev) => prev.find((s) => s.subject === subject) ? prev.filter((s) => s.subject !== subject) : [...prev, { subject, score: 80 }])
  }

  function updateScore(subject: string, score: number) {
    setScores((prev) => prev.map((s) => s.subject === subject ? { ...s, score } : s))
  }

  async function handleSubmit() {
    setLoading(true)
    const res = await safeFetch("/api/career/recommend", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ scores, interests: interests.split(",").map((s) => s.trim()).filter(Boolean) }),
    })
    if (res) {
      const data = await res.json()
      setResults(data.recommendations)
    }
    setLoading(false)
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border p-4 space-y-3">
        <h2 className="text-lg font-semibold text-foreground">Minat & Nilai</h2>
        <div>
          <label className="text-sm text-muted-foreground">Minat (pisahkan dengan koma)</label>
          <input value={interests} onChange={(e) => setInterests(e.target.value)} placeholder="coding, desain, kesehatan"
            className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-ring" />
        </div>
        <div>
          <label className="text-sm text-muted-foreground">Mata pelajaran favorit (klik untuk atur nilai)</label>
          <div className="mt-2 flex flex-wrap gap-2">
            {subjects.map((s) => {
              const active = scores.find((x) => x.subject === s)
              return (
                <button key={s} onClick={() => toggleScore(s)}
                  className={`rounded-full px-3 py-1 text-xs font-medium border transition-colors ${
                    active ? "bg-primary text-primary-foreground border-primary" : "bg-card text-muted-foreground border-border hover:border-ring"
                  }`}
                >
                  {s} {active ? `(${active.score})` : ""}
                </button>
              )
            })}
          </div>
          {scores.map((s) => (
            <div key={s.subject} className="mt-2 flex items-center gap-2 text-sm">
              <span className="w-32 text-foreground">{s.subject}</span>
              <input type="range" min="0" max="100" value={s.score} onChange={(e) => updateScore(s.subject, +e.target.value)}
                className="flex-1" />
              <span className="w-8 text-right text-foreground">{s.score}</span>
            </div>
          ))}
        </div>
        <button onClick={handleSubmit} disabled={loading}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50">
          {loading ? "Menganalisis..." : "Cari Rekomendasi Karir"}
        </button>
      </div>

      {results && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-foreground">Rekomendasi Karir</h2>
          {results.map((c) => (
            <div key={c.id} className="rounded-xl border p-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-foreground">{c.title}</h3>
                  <p className="text-sm text-muted-foreground">{c.field}</p>
                </div>
                <div className={`text-sm font-bold px-2 py-1 rounded ${c.relevance >= 70 ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300" : c.relevance >= 40 ? "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300" : "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300"}`}>
                  {c.relevance}%
                </div>
              </div>
              <p className="mt-1 text-sm text-foreground">{c.description}</p>
              <div className="mt-2 flex gap-4 text-xs text-muted-foreground">
                <span>Prospek: {c.outlook}</span>
                <span>Gaji: {c.salary}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function UniversityMatcher() {
  const [gpa, setGpa] = useState("3.0")
  const [major, setMajor] = useState("")
  const [location, setLocation] = useState("")
  const [results, setResults] = useState<any[] | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit() {
    setLoading(true)
    const res = await safeFetch("/api/career/universities", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ gpa: parseFloat(gpa), majorInterest: major, location }),
    })
    if (res) {
      const data = await res.json()
      setResults(data.universities)
    }
    setLoading(false)
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border p-4 space-y-3">
        <h2 className="text-lg font-semibold text-foreground">Cari Universitas</h2>
        <div className="grid gap-3 sm:grid-cols-3">
          <div>
            <label className="text-sm text-muted-foreground">IPK / Rata-rata nilai</label>
            <input type="number" step="0.1" min="0" max="4" value={gpa} onChange={(e) => setGpa(e.target.value)}
              className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-ring" />
          </div>
          <div>
            <label className="text-sm text-muted-foreground">Minat jurusan</label>
            <input value={major} onChange={(e) => setMajor(e.target.value)} placeholder="Informatika, Hukum..."
              className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-ring" />
          </div>
          <div>
            <label className="text-sm text-muted-foreground">Lokasi (opsional)</label>
            <select value={location} onChange={(e) => setLocation(e.target.value)} className="mt-1">
              <option value="">Semua lokasi</option>
              <option value="Jakarta">Jakarta</option>
              <option value="Bandung">Bandung</option>
              <option value="Surabaya">Surabaya</option>
              <option value="Yogyakarta">Yogyakarta</option>
              <option value="Semarang">Semarang</option>
            </select>
          </div>
        </div>
        <button onClick={handleSubmit} disabled={loading}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50">
          {loading ? "Mencari..." : "Cari Universitas"}
        </button>
      </div>

      {results && (
        <div className="space-y-3">
          {results.map((u, i) => (
            <div key={i} className="rounded-xl border p-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-foreground">{u.name}</h3>
                  <p className="text-sm text-muted-foreground">{u.location} · {u.type} · Akreditasi {u.accreditasi}</p>
                </div>
                <div className={`text-sm font-bold px-2 py-1 rounded ${u.probability >= 60 ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300" : "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300"}`}>
                  {u.probability}%
                </div>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">Min. IPK: {u.minGpa} · Daya tampung: {u.acceptance}</p>
              <div className="mt-2 flex flex-wrap gap-1">
                {u.majors.slice(0, 4).map((m: string) => (
                  <span key={m} className={`rounded-full px-2 py-0.5 text-xs ${String(m).toLowerCase().includes(major.toLowerCase()) ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                    {m}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function MockInterview() {
  const [mode, setMode] = useState<"umum" | "behavioral" | "beasiswa">("umum")
  const [question, setQuestion] = useState("")
  const [qi, setQi] = useState(0)
  const [total, setTotal] = useState(0)
  const [answer, setAnswer] = useState("")
  const [feedback, setFeedback] = useState<string | null>(null)
  const [done, setDone] = useState(false)
  const [started, setStarted] = useState(false)
  const [loading, setLoading] = useState(false)

  async function startInterview() {
    setLoading(true)
    const res = await safeFetch("/api/career/interview", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mode: "start", topic: mode }),
    })
    if (res) {
      const data = await res.json()
      setQuestion(data.question); setQi(data.questionIndex); setTotal(data.total)
      setStarted(true); setFeedback(null); setDone(false); setAnswer("")
    }
    setLoading(false)
  }

  async function submitAnswer(answerMode: string) {
    setLoading(true)
    const res = await safeFetch("/api/career/interview", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mode: answerMode, answer, questionIndex: qi, topic: mode }),
    })
    if (res) {
      const data = await res.json()
      if (data.done) { setDone(true); setStarted(false) }
      else if (answerMode === "feedback") { setFeedback(data.feedback?.content || JSON.stringify(data.feedback)) }
      else { setQuestion(data.question); setQi(data.questionIndex); setTotal(data.total); setAnswer("") }
    }
    setLoading(false)
  }

  if (!started) {
    return (
      <div className="space-y-4">
        <div className="rounded-xl border p-4 space-y-3">
          <h2 className="text-lg font-semibold text-foreground">Mock Interview</h2>
          <p className="text-sm text-muted-foreground">Latihan wawancara dengan AI. Pilih mode:</p>
          <div className="flex gap-2">
            {([["umum", "Umum"], ["behavioral", "Behavioral"], ["beasiswa", "Beasiswa"]] as const).map(([k, l]) => (
              <button key={k} onClick={() => setMode(k)}
                className={`rounded-full px-4 py-1.5 text-sm font-medium border transition-colors ${
                  mode === k ? "bg-primary text-primary-foreground border-primary" : "bg-card text-muted-foreground border-border"
                }`}
              >{l}</button>
            ))}
          </div>
          <button onClick={startInterview} disabled={loading}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90">
            Mulai Interview
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">Pertanyaan {qi + 1}/{total}</h2>
          <span className="text-xs text-muted-foreground">{mode}</span>
        </div>
        <p className="text-foreground">{question}</p>
        <textarea value={answer} onChange={(e) => setAnswer(e.target.value)} rows={4} placeholder="Tulis jawaban Anda..."
          className="w-full rounded-lg border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-ring resize-none" />
        <div className="flex gap-2">
          <button onClick={() => submitAnswer("feedback")} disabled={loading || !answer.trim()}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50">
            Minta Feedback
          </button>
          <button onClick={() => submitAnswer("answer")} disabled={loading || !answer.trim()}
            className="rounded-lg bg-secondary px-4 py-2 text-sm font-medium text-secondary-foreground hover:opacity-80 disabled:opacity-50">
            Jawab & Lanjut
          </button>
        </div>
      </div>

      {feedback && (
        <div className="rounded-xl border p-4 bg-muted/50">
          <h3 className="text-sm font-semibold text-foreground mb-1">Feedback</h3>
          <p className="text-sm text-foreground whitespace-pre-line">{feedback}</p>
        </div>
      )}

      {done && <p className="text-center text-sm text-muted-foreground">Interview selesai! Klik "Mulai Interview" untuk coba lagi.</p>}
    </div>
  )
}

function PortfolioBuilder() {
  const [portfolio, setPortfolio] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  async function loadPortfolio() {
    setLoading(true)
    const res = await safeFetch("/api/career/portfolio", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    })
    if (res) {
      const data = await res.json()
      setPortfolio(data.portfolio)
    }
    setLoading(false)
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border p-4 space-y-3">
        <h2 className="text-lg font-semibold text-foreground">Portfolio Builder</h2>
        <p className="text-sm text-muted-foreground">Lihat dan review portofolio akademik Anda berdasarkan project yang sudah dikerjakan.</p>
        <button onClick={loadPortfolio} disabled={loading}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50">
          {loading ? "Memuat..." : "Muat Portofolio"}
        </button>
      </div>

      {portfolio && (
        <div className="space-y-3">
          <div className="rounded-xl border p-4">
            <h3 className="text-lg font-semibold text-foreground">{portfolio.name}</h3>
            <p className="text-sm text-muted-foreground">{portfolio.email}</p>
            <p className="mt-2 text-sm text-foreground">{portfolio.projects.length} project</p>
          </div>

          {portfolio.projects.map((p: any, i: number) => (
            <div key={i} className="rounded-xl border p-4">
              <h4 className="font-medium text-foreground">{p.name}</h4>
              {p.description && <p className="text-sm text-muted-foreground">{p.description}</p>}
              <div className="mt-1 flex gap-3 text-xs text-muted-foreground">
                <span>{p.files} file(s)</span>
                <span>{new Date(p.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
