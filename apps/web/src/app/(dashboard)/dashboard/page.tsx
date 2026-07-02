"use client"

import { useSession } from "next-auth/react"
import { useEffect, useState } from "react"
import Link from "next/link"
import type { LucideIcon } from "lucide-react"
import { MessageCircle, BookOpen, Folder, FileText, HelpCircle, Search, PenTool, GraduationCap, Handshake, BarChart3, Hourglass } from "lucide-react"
import { safeFetchJSON } from "@/lib/security"

interface DashboardData {
  stats: { examCount: number; projectCount: number; sessionCount: number; pendingGrading: number; avgScore: number | null }
  recentGrades: Array<{ totalScore: number | null; exam: { title: string; maxScore: number }; createdAt: string }>
  recentExams: Array<{ id: string; title: string; status: string; createdAt: string; _count: { results: number } }>
}

const quickLinks = [
  { href: "/chat", label: "Chat AI", desc: "Chat with AI assistant", icon: MessageCircle, color: "bg-blue-50 dark:bg-blue-950" },
  { href: "/subjects", label: "Subjects", desc: "Browse subjects & knowledge base", icon: BookOpen, color: "bg-green-50 dark:bg-green-950" },
  { href: "/projects", label: "Projects", desc: "Manage your projects & files", icon: Folder, color: "bg-purple-50 dark:bg-purple-950" },
  { href: "/exams", label: "Exams", desc: "Take exams & view results", icon: FileText, color: "bg-orange-50 dark:bg-orange-950" },
  { href: "/questions", label: "Question Bank", desc: "Manage & generate questions", icon: HelpCircle, color: "bg-pink-50 dark:bg-pink-950" },
  { href: "/plagiarism", label: "Plagiarism Check", desc: "Check document similarity", icon: Search, color: "bg-red-50 dark:bg-red-950" },
  { href: "/academic", label: "Academic Writing", desc: "Literature review, citation, outline", icon: PenTool, color: "bg-indigo-50 dark:bg-indigo-950" },
  { href: "/teaching", label: "Teaching Tools", desc: "RPS generator, learning path", icon: GraduationCap, color: "bg-teal-50 dark:bg-teal-950" },
  { href: "/collaboration", label: "Collaborate", desc: "Study groups & discussion forums", icon: Handshake, color: "bg-cyan-50 dark:bg-cyan-950" },
  { href: "/analytics", label: "Analytics", desc: "Grade distribution & knowledge gaps", icon: BarChart3, color: "bg-amber-50 dark:bg-amber-950" },
]

export default function DashboardPage() {
  const { data: session } = useSession()
  const [data, setData] = useState<DashboardData | null>(null)
  const role = session?.user?.role
  const isTeacher = ["TEACHER", "LECTURER", "ADMIN", "SUPER_ADMIN"].includes(role || "")

  useEffect(() => {
    safeFetchJSON<DashboardData>("/api/dashboard").then((d) => d && setData(d))
  }, [])

  const s = data?.stats

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground">Welcome back, {session?.user?.name || session?.user?.email}</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-5">
        <StatCard label="Exams" value={s?.examCount ?? "—"} icon={FileText} />
        <StatCard label="Projects" value={s?.projectCount ?? "—"} icon={Folder} />
        <StatCard label="Chat Sessions" value={s?.sessionCount ?? "—"} icon={MessageCircle} />
        {isTeacher && <StatCard label="Pending Grading" value={s?.pendingGrading ?? "—"} icon={Hourglass} />}
        {!isTeacher && s?.avgScore !== null && s?.avgScore !== undefined && (
          <StatCard label="Avg Score" value={`${s.avgScore}%`} icon={BarChart3} />
        )}
        {isTeacher && s?.avgScore !== null && s?.avgScore !== undefined && (
          <StatCard label="Class Avg" value={`${s.avgScore}%`} icon={BarChart3} />
        )}
      </div>

      {/* Quick Links */}
      <div>
        <h2 className="mb-3 text-lg font-semibold text-foreground">Quick Actions</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {quickLinks.map((link) => (
            <Link key={link.href} href={link.href}
              className={`${link.color} rounded-xl border p-4 hover:shadow-md transition-shadow`}>
              <link.icon className="size-6 mb-2" aria-hidden="true" />
              <div className="text-sm font-medium text-foreground">{link.label}</div>
              <div className="text-xs text-muted-foreground mt-0.5">{link.desc}</div>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid gap-6 md:grid-cols-2">
        {data?.recentExams && data.recentExams.length > 0 && (
          <div className="rounded-xl border p-4">
            <h2 className="mb-3 text-lg font-semibold text-foreground">Recent Exams</h2>
            <div className="space-y-2">
              {data.recentExams.map((exam) => (
                <Link key={exam.id} href={`/exams/${exam.id}`}
                  className="flex items-center justify-between rounded-lg bg-muted p-3 hover:bg-accent transition-colors">
                  <div>
                    <div className="text-sm font-medium text-foreground">{exam.title}</div>
                    <div className="text-xs text-muted-foreground">
                      {exam._count.results} submissions &middot; {exam.status.toLowerCase()}
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {new Date(exam.createdAt).toLocaleDateString()}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {data?.recentGrades && data.recentGrades.length > 0 && (
          <div className="rounded-xl border p-4">
            <h2 className="mb-3 text-lg font-semibold text-foreground">Recent Grades</h2>
            <div className="space-y-2">
              {data.recentGrades.map((g, i) => {
                const pct = g.totalScore && g.exam.maxScore > 0
                  ? Math.round((g.totalScore / g.exam.maxScore) * 100) : 0
                return (
                  <div key={i} className="flex items-center justify-between rounded-lg bg-muted p-3">
                    <div>
                      <div className="text-sm font-medium text-foreground">{g.exam.title}</div>
                      <div className="text-xs text-muted-foreground">
                        {g.totalScore ?? "—"} / {g.exam.maxScore}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className={`text-sm font-semibold ${pct >= 70 ? "text-green-600 dark:text-green-400" : pct >= 50 ? "text-amber-600 dark:text-amber-400" : "text-red-600 dark:text-red-400"}`}>
                        {pct}%
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* Admin shortcut */}
      {role === "ADMIN" || role === "SUPER_ADMIN" ? (
        <div className="rounded-xl border border-dashed p-4">
          <h2 className="mb-2 text-lg font-semibold text-foreground">Admin</h2>
          <Link href="/admin" className="text-sm text-blue-600 dark:text-blue-400 hover:underline">
            Go to Admin Panel &rarr;
          </Link>
        </div>
      ) : null}
    </div>
  )
}

function StatCard({ label, value, icon: Icon }: { label: string; value: string | number; icon: LucideIcon }) {
  return (
    <div className="rounded-xl border bg-card p-4">
      <Icon className="size-6 mb-1" aria-hidden="true" />
      <div className="text-2xl font-bold text-foreground">{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  )
}
