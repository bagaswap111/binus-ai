import { auth } from "@/auth"
import { NextResponse } from "next/server"

const IMRAD_SECTIONS = [
  { name: "Introduction", keywords: ["introduction", "background", "context", "problem statement"] },
  { name: "Methods", keywords: ["method", "methodology", "approach", "procedure", "participants", "materials", "data collection"] },
  { name: "Results", keywords: ["result", "finding", "analysis", "observation", "outcome"] },
  { name: "Discussion", keywords: ["discussion", "implication", "interpretation", "conclusion"] },
]

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { text } = await req.json()
  if (!text) return NextResponse.json({ error: "No text provided" }, { status: 400 })

  const lower = text.toLowerCase()
  const found: Array<{ section: string; present: boolean; confidence: string }> = []
  let score = 0

  for (const s of IMRAD_SECTIONS) {
    const matched = s.keywords.filter((k) => lower.includes(k))
    const present = matched.length > 0
    if (present) score++
    found.push({
      section: s.name,
      present,
      confidence: present ? `${matched.length}/${s.keywords.length} keywords` : "not found",
    })
  }

  return NextResponse.json({
    sections: found,
    completeness: `${score}/4 IMRaD sections found`,
    feedback: score >= 4 ? "Good IMRaD structure" : score >= 2 ? "Partial IMRaD structure — add missing sections" : "Paper lacks clear IMRaD structure",
  })
}
