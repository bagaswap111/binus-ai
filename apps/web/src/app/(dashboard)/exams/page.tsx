"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { safeFetchJSON } from "@/lib/security"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import Breadcrumb from "@/components/breadcrumb"

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
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const perPage = 20
  const isTeacher = ["TEACHER", "LECTURER", "ADMIN", "SUPER_ADMIN"].includes(session?.user?.role || "")

  useEffect(() => {
    safeFetchJSON<Exam[]>("/api/exams").then((d) => d && setExams(d))
  }, [])

  const filtered = exams.filter((e) => !search || e.title.toLowerCase().includes(search.toLowerCase()) || e.subject.code.toLowerCase().includes(search.toLowerCase()))
  const totalPages = Math.ceil(filtered.length / perPage)
  const paged = filtered.slice((page - 1) * perPage, page * perPage)

  return (
    <div>
      <Breadcrumb items={[{ label: "Exams" }]} />
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold">Exams</h1>
        <div className="flex items-center gap-3">
          <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }} placeholder="Search exams..." className="rounded-lg border px-3 py-1.5 text-sm outline-none focus:border-ring w-48" />
          {isTeacher && (
            <Button onClick={() => router.push("/exams/create")}>
              + Create Exam
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {paged.map((e) => (
          <button
            key={e.id}
            onClick={() => router.push(`/exams/${e.id}`)}
            className="rounded-lg border p-4 text-left hover:border-ring"
          >
            <div className="text-sm font-medium">{e.title}</div>
            <div className="mt-1 text-xs text-muted-foreground">{e.subject.code} &middot; {e.duration} min</div>
            {e.description && <div className="mt-1 text-xs text-muted-foreground line-clamp-2">{e.description}</div>}
            <div className="mt-2 flex gap-2 text-xs">
              <span className={`rounded-full px-2 py-0.5 ${e.status === "PUBLISHED" ? "bg-green-100 text-green-700" : "bg-muted text-muted-foreground"}`}><span aria-hidden="true">● </span>{e.status}</span>
              <span className="text-muted-foreground">{e._count.results} submissions</span>
            </div>
          </button>
        ))}
        {paged.length === 0 && <p className="col-span-full text-center text-muted-foreground pt-10">{search ? "No exams match your search" : "No exams yet"}</p>}
      </div>

      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-center gap-2">
          <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1} className="rounded-lg border px-3 py-1.5 text-sm disabled:opacity-50">Previous</button>
          <span className="text-sm text-muted-foreground">Page {page} of {totalPages}</span>
          <button onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page === totalPages} className="rounded-lg border px-3 py-1.5 text-sm disabled:opacity-50">Next</button>
        </div>
      )}
    </div>
  )
}
