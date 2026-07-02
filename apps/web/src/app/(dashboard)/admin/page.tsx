"use client"

import { useEffect, useState } from "react"
import { Shield } from "lucide-react"
import { toast } from "sonner"
import { safeFetchJSON, safeFetch } from "@/lib/security"
import { Button } from "@/components/ui/button"

interface Model {
  id: string
  name: string
  modelId: string
  provider: string
  isActive: boolean
  maxTokens: number
  allowedRoles: string[]
}

export default function AdminPage() {
  const [models, setModels] = useState<Model[]>([])
  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState("")
  const [modelId, setModelId] = useState("")
  const [provider, setProvider] = useState("OPENAI")
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => { safeFetchJSON<Model[]>("/api/admin/models").then((d) => d && setModels(d)) }, [])

  async function addModel(e: React.FormEvent) {
    e.preventDefault()
    if (submitting) return
    setSubmitting(true)
    const res = await safeFetch("/api/admin/models", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        modelId,
        provider,
        capabilities: ["chat"],
        maxTokens: 16384,
        costPerInput: 0,
        costPerOutput: 0,
        allowedRoles: ["SD", "SMP", "SMA", "S1", "S2", "S3", "TEACHER", "LECTURER"],
      }),
    })
    if (res) {
      setShowForm(false); setName(""); setModelId(""); setProvider("OPENAI")
      const m = await res.json()
      setModels((prev) => [...prev, m])
    } else {
      toast.error("Failed to add model. Please try again.")
    }
    setSubmitting(false)
  }

  async function toggleModel(m: Model) {
    const action = m.isActive ? "deactivate" : "activate"
    if (!confirm(`Are you sure you want to ${action} ${m.name}?`)) return
    const res = await safeFetch("/api/admin/models", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: m.id, isActive: !m.isActive }),
    })
    if (res) setModels((prev) => prev.map((x) => (x.id === m.id ? { ...x, isActive: !x.isActive } : x)))
  }

  return (
    <div>
      <a href="/admin/reviews" className="mb-4 inline-block rounded-lg border px-4 py-3 text-sm hover:bg-muted transition-colors">
        <Shield className="size-4 inline mr-1.5" aria-hidden="true" />Content Review Queue <span className="text-muted-foreground">→</span>
      </a>
      <h1 className="mb-6 mt-4 text-xl font-semibold">Admin — Model Registry</h1>

      <Button onClick={() => setShowForm(!showForm)} className="mb-4">
        + Add Model
      </Button>

      {showForm && (
        <form onSubmit={addModel} className="mb-6 space-y-3 rounded-lg border p-4">

          <label htmlFor="admin-name" className="sr-only">Display Name</label>
          <input id="admin-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Display Name (e.g. GPT-4o Mini)" required className="w-full rounded-md border px-3 py-2 text-sm" />
          <label htmlFor="admin-modelid" className="sr-only">Model ID</label>
          <input id="admin-modelid" value={modelId} onChange={(e) => setModelId(e.target.value)} placeholder="Model ID (e.g. gpt-4o-mini)" required className="w-full rounded-md border px-3 py-2 text-sm" />
          <label htmlFor="admin-provider" className="sr-only">Provider</label>
          <select id="admin-provider" value={provider} onChange={(e) => setProvider(e.target.value)}>
            <option value="OPENAI">OpenAI</option>
            <option value="ANTHROPIC">Anthropic</option>
            <option value="GOOGLE">Google</option>
            <option value="AZURE_OPENAI">Azure OpenAI</option>
            <option value="OLLAMA">Ollama (Local)</option>
            <option value="CUSTOM">Custom</option>
          </select>
          <Button type="submit" disabled={submitting}>{submitting ? "Saving..." : "Save"}</Button>
        </form>
      )}

      <div className="space-y-2">
        {models.map((m) => (
          <div key={m.id} className="flex items-center justify-between rounded-lg border px-4 py-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">{m.name}</span>
                <span className={`rounded-full px-2 py-0.5 text-xs ${m.isActive ? "bg-green-100 text-green-700" : "bg-muted text-muted-foreground"}`}>
                  <span aria-hidden="true">● </span>{m.isActive ? "Active" : "Inactive"}
                </span>
              </div>
              <div className="text-xs text-muted-foreground">{m.modelId} &middot; {m.provider}</div>
            </div>
            <Button variant="ghost" size="sm" onClick={() => toggleModel(m)}>
              {m.isActive ? "Deactivate" : "Activate"}
            </Button>
          </div>
        ))}
        {models.length === 0 && <p className="text-muted-foreground text-sm">No models configured. Click "+ Add Model" to get started.</p>}
      </div>
    </div>
  )
}
