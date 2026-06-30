"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"

interface Exam {
  id: string
  title: string
  description: string | null
  subject: { name: string; code: string }
  duration: number
  status: string
  maxScore: number
  _count: { results: number }
  createdAt: string
}

export default function ExamsPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [exams, setExams] = useState<Exam[]>([])
  const isTeacher = ["TEACHER", "LECTURER", "ADMIN", "SUPER_ADMIN"].includes(session?.user?.role || "")

  useEffect(() => {
    fetch("/api/exams").then((r) => r.ok && r.json()).then(setExams)
  }, [])

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold">Exams</h1>
        {isTeacher && (
          <button onClick={() => router.push("/exams/create")} className="rounded-lg bg-zinc-900 px-4 py-2 text-sm text-white">
            + Create Exam
          </button>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {exams.map((e) => (
          <button
            key={e.id}
            onClick={() => router.push(`/exams/${e.id}`)}
            className="rounded-lg border p-4 text-left hover:border-zinc-400"
          >
            <div className="text-sm font-medium">{e.title}</div>
            <div className="mt-1 text-xs text-zinc-500">{e.subject.code} &middot; {e.duration} min</div>
            {e.description && <div className="mt-1 text-xs text-zinc-400 line-clamp-2">{e.description}</div>}
            <div className="mt-2 flex gap-2 text-xs">
              <span className={`rounded-full px-2 py-0.5 ${e.status === "PUBLISHED" ? "bg-green-100 text-green-700" : "bg-zinc-100 text-zinc-600"}`}>{e.status}</span>
              <span className="text-zinc-400">{e._count.results} submissions</span>
            </div>
          </button>
        ))}
        {exams.length === 0 && <p className="col-span-full text-center text-zinc-400 pt-10">No exams yet</p>}
      </div>
    </div>
  )
}
