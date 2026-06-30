// ponytail: in-memory rate limiter — cukup untuk dev, upgrade ke Redis di production
const hits = new Map<string, { count: number; resetsAt: number }>()

export function rateLimit(key: string, max: number, windowMs: number): boolean {
  const now = Date.now()
  const entry = hits.get(key)
  if (!entry || now > entry.resetsAt) {
    hits.set(key, { count: 1, resetsAt: now + windowMs })
    return true
  }
  entry.count++
  return entry.count <= max
}

export function sanitize(str: string): string {
  return str.replace(/[<>&"']/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;", "'": "&#x27;" })[c] || c)
}
