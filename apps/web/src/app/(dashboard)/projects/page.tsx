"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

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
  const router = useRouter()

  useEffect(() => { fetch("/api/projects").then((r) => r.ok && r.json()).then(setProjects) }, [])

  async function create(e: React.FormEvent) {
    e.preventDefault()
    const res = await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, description: desc }),
    })
    if (res.ok) {
      setName(""); setDesc(""); setShowForm(false)
      const data = await res.json()
      router.push(`/projects/${data.id}`)
    }
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold">Projects</h1>
        <button onClick={() => setShowForm(!showForm)} className="rounded-md bg-zinc-900 px-3 py-1.5 text-sm text-white">
          + New Project
        </button>
      </div>

      {showForm && (
        <form onSubmit={create} className="mb-6 space-y-3 rounded-lg border p-4">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Project name" required className="w-full rounded-md border px-3 py-2 text-sm" />
          <textarea value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Description (optional)" className="w-full rounded-md border px-3 py-2 text-sm" rows={2} />
          <button type="submit" className="rounded-md bg-zinc-900 px-3 py-1.5 text-sm text-white">Create</button>
        </form>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        {projects.map((p) => (
          <button key={p.id} onClick={() => router.push(`/projects/${p.id}`)}
            className="rounded-lg border p-4 text-left hover:border-zinc-400"
          >
            <div className="font-medium">{p.name}</div>
            {p.description && <div className="mt-1 text-xs text-zinc-500">{p.description}</div>}
            {p.subject && <div className="mt-1 text-xs text-zinc-400">{p.subject.name}</div>}
          </button>
        ))}
      </div>
    </div>
  )
}
