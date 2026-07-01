// ponytail: in-memory rate limiter — cukup untuk dev, upgrade ke Redis di production
const hits = new Map<string, { count: number; resetsAt: number }>()

export function rateLimit(key: string, max: number, windowMs: number): boolean {
  const now = Date.now()

  // ponytail: cleanup expired entries on write to prevent unbounded growth
  if (hits.size > 10000) {
    for (const [k, v] of hits) {
      if (now > v.resetsAt) hits.delete(k)
    }
  }

  const entry = hits.get(key)
  if (!entry || now > entry.resetsAt) {
    hits.set(key, { count: 1, resetsAt: now + windowMs })
    return true
  }
  entry.count++
  return entry.count <= max
}

const ENTITY_MAP: Record<string, string> = { "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;", "'": "&#x27;" }

export function sanitize(str: string): string {
  return str.replace(/[<>&"']/g, (c) => ENTITY_MAP[c] || c)
}
