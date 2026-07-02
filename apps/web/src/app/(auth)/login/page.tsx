"use client"

import { Eye, EyeOff } from "lucide-react"
import { toast } from "sonner"
import { signIn, useSession } from "next-auth/react"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

export default function LoginPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)

  useEffect(() => {
    if (session) router.replace("/dashboard")
  }, [session, router])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    const res = await signIn("credentials", {
      email: form.get("email"),
      password: form.get("password"),
      redirect: false,
    })
    if (res?.error) return toast.error("Invalid credentials")
    router.replace("/dashboard")
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4 rounded-xl border p-6 shadow-sm bg-card">
        <h1 className="text-xl font-semibold text-foreground">Sign in to BINUS AI</h1>


        <button
          type="button"
          onClick={() => signIn("microsoft-entra-id", { callbackUrl: "/dashboard" })}
          className="flex w-full items-center justify-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium text-foreground hover:bg-accent"
        >
          <svg className="h-5 w-5" viewBox="0 0 21 21" fill="none">
            <rect x="1" y="1" width="9" height="9" fill="#f25022"/>
            <rect x="11" y="1" width="9" height="9" fill="#7fba00"/>
            <rect x="1" y="11" width="9" height="9" fill="#00a4ef"/>
            <rect x="11" y="11" width="9" height="9" fill="#ffb900"/>
          </svg>
          Sign in with Microsoft (@binus.ac.id)
        </button>

        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <hr className="flex-1" />
          <span>or sign in with email</span>
          <hr className="flex-1" />
        </div>

        <input name="email" type="email" placeholder="Email" required className="w-full rounded-lg border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-ring" />
        <div className="relative">
          <input name="password" type={showPassword ? "text" : "password"} placeholder="Password" required className="w-full rounded-lg border bg-background px-3 py-2 pr-10 text-sm text-foreground outline-none focus:border-ring" />
          <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-2 top-1/2 -translate-y-1/2 text-sm text-muted-foreground hover:text-foreground" aria-label={showPassword ? "Hide password" : "Show password"}>
            {showPassword ? <EyeOff className="h-4 w-4" aria-hidden="true" /> : <Eye className="h-4 w-4" aria-hidden="true" />}
          </button>
        </div>
        <button type="submit" className="w-full rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90">
          Sign In
        </button>
        <p className="text-center text-xs text-muted-foreground">
          Don&apos;t have an account?{" "}
          <a href="/register" className="text-foreground underline">Register</a>
        </p>
      </form>
    </div>
  )
}
