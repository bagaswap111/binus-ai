// ponytail: wrapper panggil AI Gateway dari Next.js
const GATEWAY_URL = process.env.GATEWAY_URL || "http://localhost:8000"

export async function chatCompletion(messages: { role: string; content: string }[], opts?: {
  model?: string
  userRole?: string
  subjectId?: string
  stream?: boolean
}) {
  const res = await fetch(`${GATEWAY_URL}/v1/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      messages,
      model: opts?.model || "gpt-4o-mini",
      user_role: opts?.userRole,
      subject_id: opts?.subjectId,
      stream: opts?.stream || false,
    }),
  })
  if (!res.ok) throw new Error(`AI Gateway error: ${res.status}`)
  return res.json() as Promise<{ content: string; model: string }>
}

export async function healthCheck() {
  const res = await fetch(`${GATEWAY_URL}/health`)
  return res.json() as Promise<{ status: string }>
}
