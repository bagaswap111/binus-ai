import { auth } from "@/auth"
import { NextResponse } from "next/server"

const THESIS_OUTLINE = [
  { section: "Chapter 1: Introduction", subsections: ["Background", "Problem Statement", "Research Questions", "Objectives", "Scope"] },
  { section: "Chapter 2: Literature Review", subsections: ["Theoretical Framework", "Previous Studies", "Research Gap"] },
  { section: "Chapter 3: Methodology", subsections: ["Research Design", "Data Collection", "Data Analysis", "Ethical Considerations"] },
  { section: "Chapter 4: Results & Discussion", subsections: ["Findings", "Discussion", "Implications"] },
  { section: "Chapter 5: Conclusion", subsections: ["Summary", "Limitations", "Future Work"] },
]

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { type = "thesis", topic = "" } = await req.json()

  const outline = THESIS_OUTLINE.map((ch) => ({
    section: ch.section,
    subsections: ch.subsections.map((sub) => ({
      title: topic ? `${sub} (${topic})` : sub,
      description: "",
    })),
  }))

  return NextResponse.json({
    type,
    title: topic ? `${topic}: A Comprehensive Study` : "Untitled",
    outline,
    note: "ponytail: template-based outline. AI-generated version requires LLM integration.",
  })
}
