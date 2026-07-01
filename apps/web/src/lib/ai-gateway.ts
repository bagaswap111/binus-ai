const GATEWAY_URL = process.env.GATEWAY_URL || "http://localhost:8000"
const GATEWAY_API_KEY = process.env.GATEWAY_API_KEY || ""

export async function chatCompletion(messages: { role: string; content: string }[], opts?: {
  model?: string
  userRole?: string
  subjectId?: string
  userId?: string
  stream?: boolean
}) {
  const headers: Record<string, string> = { "Content-Type": "application/json" }
  if (GATEWAY_API_KEY) headers["X-API-Key"] = GATEWAY_API_KEY

  const res = await fetch(`${GATEWAY_URL}/v1/chat`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      messages,
      model: opts?.model || "gpt-4o-mini",
      user_role: opts?.userRole,
      subject_id: opts?.subjectId,
      user_id: opts?.userId,
      stream: opts?.stream || false,
    }),
  })
  if (!res.ok) throw new Error(`AI Gateway error: ${res.status}`)
  return res.json() as Promise<{ content: string; model: string }>
}
