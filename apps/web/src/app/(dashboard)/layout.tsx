"use client"

import { signOut, useSession } from "next-auth/react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import ThemeToggle from "@/components/theme-toggle"

const navItems = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/chat", label: "Chat" },
  { href: "/subjects", label: "Subjects" },
  { href: "/projects", label: "Projects" },
  { href: "/exams", label: "Exams" },
  { href: "/questions", label: "Questions" },
  { href: "/plagiarism", label: "Plagiarism" },
  { href: "/academic", label: "Academic" },
  { href: "/teaching", label: "Teaching" },
  { href: "/collaboration", label: "Collaborate" },
  { href: "/analytics", label: "Analytics" },
  { href: "/career", label: "Career" },
  { href: "/gamification", label: "Gamification" },
  { href: "/admin", label: "Admin", roles: ["ADMIN", "SUPER_ADMIN"] },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession()
  const pathname = usePathname()
  const role = session?.user?.role

  return (
    <div className="flex min-h-screen">
      <aside className="flex w-56 flex-col border-r bg-card p-4">
        <Link href="/dashboard" className="mb-6 block text-lg font-bold text-foreground">BINUS AI</Link>
        <nav className="flex flex-col gap-1">
          {navItems
            .filter((item) => !item.roles || (role && item.roles.includes(role)))
            .map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-md px-3 py-2 text-sm font-medium ${
                  pathname === item.href ? "bg-secondary text-secondary-foreground" : "text-muted-foreground hover:bg-accent"
                }`}
              >
                {item.label}
              </Link>
            ))}
        </nav>
        <div className="mt-auto pt-4 border-t space-y-2">
          <div className="flex items-center justify-between">
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground truncate">{session?.user?.email}</p>
              <p className="text-xs font-medium text-foreground">{role}</p>
            </div>
            <ThemeToggle />
          </div>
          <button onClick={() => signOut()} className="w-full rounded-md bg-secondary px-3 py-1.5 text-xs font-medium text-secondary-foreground hover:opacity-80">
            Sign Out
          </button>
        </div>
      </aside>
      <main className="flex-1 p-6 bg-background text-foreground">{children}</main>
    </div>
  )
}
