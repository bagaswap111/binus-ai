"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { safeFetchJSON, safeFetch } from "@/lib/security"
import { Button } from "@/components/ui/button"

interface Project {
  id: string
  name: string
  description: string | null
  subject: { name: string } | null
  createdAt: string
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState("")
  const [desc, setDesc] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()

  useEffect(() => { safeFetchJSON<Project[]>("/api/projects").then((d) => d && setProjects(d)) }, [])

  async function create(e: React.FormEvent) {
    e.preventDefault()
    if (submitting) return
    setSubmitting(true)
    setError("")
    const res = await safeFetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, description: desc }),
    })
    if (res) {
      setName(""); setDesc(""); setShowForm(false)
      const data = await res.json()
      router.push(`/projects/${data.id}`)
    } else {
      setError("Failed to create project. Please try again.")
    }
    setSubmitting(false)
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold">Projects</h1>
        <Button onClick={() => setShowForm(!showForm)}>
          + New Project
        </Button>
      </div>

      {showForm && (
        <form onSubmit={create} className="mb-6 space-y-3 rounded-lg border p-4">
          {error && <p className="text-sm text-red-500">{error}</p>}
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Project name" required className="w-full rounded-md border px-3 py-2 text-sm" />
          <textarea value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Description (optional)" className="w-full rounded-md border px-3 py-2 text-sm" rows={2} />
          <Button type="submit" disabled={submitting}>{submitting ? "Creating..." : "Create"}</Button>
        </form>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        {projects.map((p) => (
          <button key={p.id} onClick={() => router.push(`/projects/${p.id}`)}
            className="rounded-lg border p-4 text-left hover:border-ring"
          >
            <div className="font-medium">{p.name}</div>
            {p.description && <div className="mt-1 text-xs text-muted-foreground">{p.description}</div>}
            {p.subject && <div className="mt-1 text-xs text-muted-foreground">{p.subject.name}</div>}
          </button>
        ))}
      </div>
    </div>
  )
}
