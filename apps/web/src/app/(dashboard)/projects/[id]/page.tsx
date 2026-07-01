"use client"

import { useEffect, useState, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import { safeFetchJSON, safeFetch } from "@/lib/security"

interface ProjectFile {
  id: string
  name: string
  type: string
  size: number
  url: string
}

interface Project {
  id: string
  name: string
  description: string | null
  files: ProjectFile[]
}

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [project, setProject] = useState<Project | null>(null)
  const [uploading, setUploading] = useState(false)
  const fileInput = useRef<HTMLInputElement>(null)

  useEffect(() => {
    safeFetchJSON<Project>(`/api/projects/${id}`).then((d) => d && setProject(d))
  }, [id])

  async function upload(file: File) {
    setUploading(true)
    const form = new FormData()
    form.append("file", file)
    const res = await safeFetch(`/api/projects/${id}`, { method: "POST", body: form })
    if (res) {
      const res2 = await safeFetch(`/api/projects/${id}`)
      if (res2) setProject(await res2.json())
    }
    setUploading(false)
  }

  return (
    <div>
      <button onClick={() => router.push("/projects")} className="mb-4 text-sm text-zinc-500 hover:text-zinc-900">
        &larr; Back
      </button>
      <h1 className="mb-1 text-xl font-semibold">{project?.name || "Loading..."}</h1>
      {project?.description && <p className="mb-4 text-sm text-zinc-500">{project.description}</p>}

      <div className="mb-4">
        <input
          ref={fileInput}
          type="file"
          className="hidden"
          onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])}
        />
        <button
          onClick={() => fileInput.current?.click()}
          disabled={uploading}
          className="rounded-md bg-zinc-900 px-3 py-1.5 text-sm text-white disabled:opacity-50"
        >
          {uploading ? "Uploading..." : "+ Upload File"}
        </button>
      </div>

      <div className="space-y-2">
        {project?.files.map((f) => (
          <div key={f.id} className="flex items-center justify-between rounded-lg border px-4 py-2">
            <div>
              <div className="text-sm font-medium">{f.name}</div>
              <div className="text-xs text-zinc-400">{(f.size / 1024).toFixed(1)} KB</div>
            </div>
            <a href={f.url} target="_blank" className="text-sm text-zinc-600 hover:text-zinc-900">Download</a>
          </div>
        ))}
      </div>
    </div>
  )
}
