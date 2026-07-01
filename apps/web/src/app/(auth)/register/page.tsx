"use client"

import { signIn } from "next-auth/react"
import { useState, useEffect } from "react"
import { safeFetchJSON, safeFetch } from "@/lib/security"

interface School {
  id: string
  name: string
}

export default function RegisterPage() {
  const [schools, setSchools] = useState<School[]>([])
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  // ponytail: warn on navigate away with unsaved form data
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = "" }
    window.addEventListener("beforeunload", handler)
    return () => window.removeEventListener("beforeunload", handler)
  }, [])

  useEffect(() => {
    // ponytail: fetch schools for registration
    safeFetchJSON("/api/schools")
  }, [])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError("")
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
      setError("Registration failed")
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
        {error && <p className="text-sm text-red-500">{error}</p>}

        <button
          onClick={() => signIn("microsoft-entra-id", { callbackUrl: "/dashboard" })}
          className="flex w-full items-center justify-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium hover:bg-zinc-50"
        >
          <svg className="h-5 w-5" viewBox="0 0 21 21" fill="none">
            <rect x="1" y="1" width="9" height="9" fill="#f25022"/>
            <rect x="11" y="1" width="9" height="9" fill="#7fba00"/>
            <rect x="1" y="11" width="9" height="9" fill="#00a4ef"/>
            <rect x="11" y="11" width="9" height="9" fill="#ffb900"/>
          </svg>
          Sign up with Microsoft (@binus.ac.id)
        </button>

        <div className="flex items-center gap-2 text-xs text-zinc-400">
          <hr className="flex-1" />
          <span>or register with email</span>
          <hr className="flex-1" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <input name="name" placeholder="Full name" required className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-zinc-400" />
          <input name="email" type="email" placeholder="Email (@binus.ac.id)" required className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-zinc-400" />
          <input name="password" type="password" placeholder="Password (min 8 chars)" required minLength={8} className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-zinc-400" />
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
          <button type="submit" disabled={loading} className="w-full rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50">
            {loading ? "Creating account..." : "Create Account"}
          </button>
        </form>

        <p className="text-center text-xs text-zinc-500">
          Already have an account?{" "}
          <a href="/login" className="text-zinc-900 underline">Sign in</a>
        </p>
      </div>
    </div>
  )
}
