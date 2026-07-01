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

export async function safeFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response | null> {
  try {
    const res = await fetch(input, init)
    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      console.error(`[safeFetch] ${res.status} ${res.url}: ${body.error || res.statusText}`)
      return null
    }
    return res
  } catch (err) {
    console.error(`[safeFetch] network error:`, err)
    return null
  }
}

export async function safeFetchJSON<T = unknown>(input: RequestInfo | URL, init?: RequestInit): Promise<T | null> {
  const res = await safeFetch(input, init)
  if (!res) return null
  try {
    return await res.json()
  } catch (err) {
    console.error(`[safeFetch] JSON parse error:`, err)
    return null
  }
}
