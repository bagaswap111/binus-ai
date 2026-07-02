"use client"

import { Eye, EyeOff } from "lucide-react"
import { toast } from "sonner"
import { signIn } from "next-auth/react"
import { useState, useEffect, useRef } from "react"
import { safeFetchJSON, safeFetch } from "@/lib/security"
import { Button } from "@/components/ui/button"

interface School {
  id: string
  name: string
}

export default function RegisterPage() {
  const [schools, setSchools] = useState<School[]>([])
  const [loading, setLoading] = useState(false)
  const [isDirty, setIsDirty] = useState(false)
  const passwordRef = useRef<HTMLInputElement>(null)
  const [showPassword, setShowPassword] = useState(false)

  // ponytail: warn on navigate away with unsaved form data
  useEffect(() => {
    if (!isDirty) return
    const handler = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = "" }
    window.addEventListener("beforeunload", handler)
    return () => window.removeEventListener("beforeunload", handler)
  }, [isDirty])

  useEffect(() => {
    // ponytail: fetch schools for registration
    safeFetchJSON("/api/schools")
  }, [])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    const form = new FormData(e.currentTarget)
    const res = await safeFetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: form.get("email"),
        name: form.get("name"),
        password: form.get("password"),
        role: form.get("role"),
        schoolId: form.get("schoolId"),
      }),
    })
    if (!res) {
      toast.error("Registration failed")
      setLoading(false)
      return
    }
    // auto sign-in after registration
    const signInRes = await signIn("credentials", {
      email: form.get("email"),
      password: form.get("password"),
      redirect: false,
    })
    if (signInRes?.error) {
      window.location.href = "/login"
    } else {
      window.location.href = "/dashboard"
    }
  }

  const fetchSchools = async () => {
    const res = await safeFetch("/api/schools")
    if (res) setSchools(await res.json())
  }

  useEffect(() => { fetchSchools() }, [])

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-sm space-y-4 rounded-xl border p-6 shadow-sm">
        <h1 className="text-xl font-semibold">Create Account</h1>


        <Button
          variant="outline"
          onClick={() => signIn("microsoft-entra-id", { callbackUrl: "/dashboard" })}
          className="flex w-full items-center justify-center gap-2"
        >
          <svg className="h-5 w-5" viewBox="0 0 21 21" fill="none">
            <rect x="1" y="1" width="9" height="9" fill="#f25022"/>
            <rect x="11" y="1" width="9" height="9" fill="#7fba00"/>
            <rect x="1" y="11" width="9" height="9" fill="#00a4ef"/>
            <rect x="11" y="11" width="9" height="9" fill="#ffb900"/>
          </svg>
          Sign up with Microsoft (@binus.ac.id)
        </Button>

        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <hr className="flex-1" />
          <span>or register with email</span>
          <hr className="flex-1" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-3" onChange={() => setIsDirty(true)}>
          <input name="name" placeholder="Full name" required maxLength={100} pattern=".{2,}" title="Full name must be at least 2 characters" className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-ring" />
          <input name="email" type="email" placeholder="Email (@binus.ac.id)" required maxLength={254} pattern="[^@\s]+@[^@\s]+\.[^@\s]+" title="Enter a valid email address" className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-ring" />
          <div className="relative">
            <input ref={passwordRef} name="password" type="password" placeholder="Password (min 8 chars)" required minLength={8} maxLength={128} className="w-full rounded-lg border px-3 py-2 pr-10 text-sm outline-none focus:border-ring" />
            <button type="button" onClick={() => { if (passwordRef.current) { passwordRef.current.type = showPassword ? "password" : "text"; setShowPassword(!showPassword) }}} className="absolute right-2 top-1/2 -translate-y-1/2 text-sm text-muted-foreground hover:text-foreground" aria-label={showPassword ? "Hide password" : "Show password"}>
              {showPassword ? <EyeOff className="h-4 w-4" aria-hidden="true" /> : <Eye className="h-4 w-4" aria-hidden="true" />}
            </button>
          </div>
          <div className="flex gap-2">
            <select name="role" className="flex-1">
              <option value="SMA">Student (SMA)</option>
              <option value="S1">Student (S1)</option>
              <option value="S2">Student (S2)</option>
              <option value="S3">Student (S3)</option>
              <option value="TEACHER">Teacher</option>
            </select>
            <select name="schoolId" className="flex-1">
              <option value="">Select school</option>
              {schools.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "Creating account..." : "Create Account"}
          </Button>
        </form>

        <p className="text-center text-xs text-muted-foreground">
          Already have an account?{" "}
          <a href="/login" className="text-foreground underline">Sign in</a>
        </p>
      </div>
    </div>
  )
}
