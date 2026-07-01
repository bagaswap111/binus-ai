"use client"

import { useEffect, useState } from "react"

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<any[]>([])
  const [tab, setTab] = useState("PENDING")
  const [loading, setLoading] = useState(true)

  const load = async (status: string) => {
    setLoading(true)
    const r = await fetch(`/api/admin/reviews?status=${status}`)
    if (r.ok) {
      const d = await r.json()
      setReviews(d.reviews)
    }
    setLoading(false)
  }

  useEffect(() => { load(tab) }, [tab])

  const handleAction = async (reviewId: string, status: string, reviewerNote?: string) => {
    await fetch("/api/admin/reviews", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reviewId, status, reviewerNote }),
    })
    load(tab)
  }

  const levelColor = (c: string) => {
    if (c === "toxic") return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
    if (c === "highly_sensitive") return "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300"
    if (c === "content_guidance") return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300"
    return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-foreground">Content Review Queue</h1>
        <div className="flex gap-2">
          {["PENDING", "APPROVED", "REJECTED"].map((s) => (
            <button key={s} onClick={() => setTab(s)}
              className={`px-3 py-1.5 text-sm rounded-lg font-medium transition-colors ${
                tab === s
                  ? "bg-foreground text-background"
                  : "bg-muted text-muted-foreground hover:text-foreground"
              }`}
            >{s === "PENDING" ? "⏳ Pending" : s === "APPROVED" ? "✅ Approved" : "❌ Rejected"}</button>
          ))}
        </div>
      </div>

      {loading ? (
        <p className="text-muted-foreground">Loading...</p>
      ) : reviews.length === 0 ? (
        <p className="text-muted-foreground">Tidak ada review dengan status {tab.toLowerCase()}.</p>
      ) : (
        <div className="space-y-3">
          {reviews.map((r) => (
            <div key={r.id} className="rounded-xl border p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${levelColor(r.classification)}`}>
                      {r.classification}
                    </span>
                    {r.category && (
                      <span className="px-2 py-0.5 rounded-full bg-muted text-xs text-muted-foreground">
                        {r.category}
                      </span>
                    )}
                    <span className="text-xs text-muted-foreground">
                      confidence: {(r.confidence * 100).toFixed(0)}%
                    </span>
                  </div>
                  <p className="text-sm text-foreground mt-1">{r.inputText}</p>
                  <p className="text-xs text-muted-foreground">
                    {r.submittedBy ? `${r.submittedBy.name} (${r.submittedBy.email})` : "Anonymous"} &middot;{" "}
                    {new Date(r.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>
              {tab === "PENDING" && (
                <div className="flex items-center gap-2">
                  <input id={`note-${r.id}`} placeholder="Catatan (opsional)"
                    className="flex-1 px-3 py-1.5 text-sm rounded-lg border bg-background text-foreground" />
                  <button onClick={() => {
                    const note = (document.getElementById(`note-${r.id}`) as HTMLInputElement).value
                    handleAction(r.id, "APPROVED", note || undefined)
                  }}
                    className="px-3 py-1.5 text-sm rounded-lg bg-green-600 text-white hover:bg-green-700">Approve</button>
                  <button onClick={() => {
                    const note = (document.getElementById(`note-${r.id}`) as HTMLInputElement).value
                    handleAction(r.id, "REJECTED", note || undefined)
                  }}
                    className="px-3 py-1.5 text-sm rounded-lg bg-red-600 text-white hover:bg-red-700">Reject</button>
                </div>
              )}
              {tab !== "PENDING" && r.reviewerNote && (
                <div className="text-xs text-muted-foreground mt-2">
                  Catatan: {r.reviewerNote}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
