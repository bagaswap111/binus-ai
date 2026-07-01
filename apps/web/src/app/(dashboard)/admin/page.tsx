"use client"

import { useEffect, useState } from "react"

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

  useEffect(() => { fetch("/api/admin/models").then((r) => r.ok && r.json()).then(setModels) }, [])

  async function addModel(e: React.FormEvent) {
    e.preventDefault()
    const res = await fetch("/api/admin/models", {
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
    if (res.ok) {
      setShowForm(false); setName(""); setModelId(""); setProvider("OPENAI")
      const m = await res.json()
      setModels((prev) => [...prev, m])
    }
  }

  async function toggleModel(m: Model) {
    await fetch("/api/admin/models", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: m.id, isActive: !m.isActive }),
    })
    setModels((prev) => prev.map((x) => (x.id === m.id ? { ...x, isActive: !x.isActive } : x)))
  }

  return (
    <div>
      <a href="/admin/reviews" className="mb-4 inline-block rounded-lg border px-4 py-3 text-sm hover:bg-muted transition-colors">
        🛡️ Content Review Queue <span className="text-muted-foreground">→</span>
      </a>
      <h1 className="mb-4 mt-4 text-xl font-semibold">Admin — Model Registry</h1>

      <button onClick={() => setShowForm(!showForm)} className="mb-4 rounded-md bg-zinc-900 px-3 py-1.5 text-sm text-white">
        + Add Model
      </button>

      {showForm && (
        <form onSubmit={addModel} className="mb-6 space-y-3 rounded-lg border p-4">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Display Name (e.g. GPT-4o Mini)" required className="w-full rounded-md border px-3 py-2 text-sm" />
          <input value={modelId} onChange={(e) => setModelId(e.target.value)} placeholder="Model ID (e.g. gpt-4o-mini)" required className="w-full rounded-md border px-3 py-2 text-sm" />
          <select value={provider} onChange={(e) => setProvider(e.target.value)}>
            <option value="OPENAI">OpenAI</option>
            <option value="ANTHROPIC">Anthropic</option>
            <option value="GOOGLE">Google</option>
            <option value="AZURE_OPENAI">Azure OpenAI</option>
            <option value="OLLAMA">Ollama (Local)</option>
            <option value="CUSTOM">Custom</option>
          </select>
          <button type="submit" className="rounded-md bg-zinc-900 px-3 py-1.5 text-sm text-white">Save</button>
        </form>
      )}

      <div className="space-y-2">
        {models.map((m) => (
          <div key={m.id} className="flex items-center justify-between rounded-lg border px-4 py-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">{m.name}</span>
                <span className={`rounded-full px-2 py-0.5 text-xs ${m.isActive ? "bg-green-100 text-green-700" : "bg-zinc-100 text-zinc-500"}`}>
                  {m.isActive ? "Active" : "Inactive"}
                </span>
              </div>
              <div className="text-xs text-zinc-400">{m.modelId} &middot; {m.provider}</div>
            </div>
            <button onClick={() => toggleModel(m)} className="text-xs text-zinc-500 hover:text-zinc-900">
              {m.isActive ? "Deactivate" : "Activate"}
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
