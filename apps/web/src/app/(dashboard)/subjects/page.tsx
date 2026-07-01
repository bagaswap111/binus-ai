"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { safeFetchJSON } from "@/lib/security"

interface Subject {
  id: string
  name: string
  code: string
  description: string | null
}

export default function SubjectsPage() {
  const [subjects, setSubjects] = useState<Subject[]>([])
  const router = useRouter()

  useEffect(() => {
    safeFetchJSON<Subject[]>("/api/subjects").then((d) => d && setSubjects(d))
  }, [])

  return (
    <div>
      <h1 className="mb-4 text-xl font-semibold">Subjects</h1>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {subjects.map((s) => (
          <button
            key={s.id}
            onClick={() => router.push(`/chat?subject=${s.id}`)}
            className="rounded-lg border p-4 text-left hover:border-ring"
          >
            <div className="text-sm font-medium">{s.name}</div>
            <div className="mt-1 text-xs text-muted-foreground">{s.code}</div>
            {s.description && <div className="mt-1 text-xs text-muted-foreground">{s.description}</div>}
          </button>
        ))}
      </div>
    </div>
  )
}
