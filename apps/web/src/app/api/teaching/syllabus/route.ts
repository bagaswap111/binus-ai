import { auth } from "@/auth"
import { NextResponse } from "next/server"

const WEEK_TEMPLATES: Array<{ week: number; topic: string; activities: string }> = [
  { week: 1, topic: "Introduction and Overview", activities: "Course overview, learning objectives, and basic concepts" },
  { week: 2, topic: "Core Concepts", activities: "Lecture, discussion, and formative quiz" },
  { week: 3, topic: "Topic Development", activities: "In-depth lecture and case studies" },
  { week: 4, topic: "Application and Practice", activities: "Workshop, hands-on exercises" },
  { week: 5, topic: "Mid-term Review", activities: "Review session and practice problems" },
  { week: 6, topic: "Advanced Topics", activities: "Advanced concepts and real-world applications" },
  { week: 7, topic: "Integration and Synthesis", activities: "Group discussion and project check-in" },
  { week: 8, topic: "Mid-term Examination", activities: "Mid-term exam" },
  { week: 9, topic: "Post-Mid-term Topics", activities: "New module introduction" },
  { week: 10, topic: "Specialized Topics I", activities: "Expert guest lecture or deep dive" },
  { week: 11, topic: "Specialized Topics II", activities: "Advanced workshops" },
  { week: 12, topic: "Project Development", activities: "Group project work and consultation" },
  { week: 13, topic: "Recent Developments", activities: "Current trends and emerging topics" },
  { week: 14, topic: "Comprehensive Review", activities: "Final review and Q&A" },
  { week: 15, topic: "Final Project Presentation", activities: "Project presentations and peer feedback" },
  { week: 16, topic: "Final Examination", activities: "Final exam" },
]

const SEMESTERS = ["Odd 2025/2026", "Even 2025/2026", "Odd 2026/2027", "Even 2026/2027"]

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { courseName, courseCode, credits, cpmk, semester } = await req.json()
  if (!courseName || !cpmk) return NextResponse.json({ error: "Course name and CPMK required" }, { status: 400 })

  const weeks = WEEK_TEMPLATES.map((w) => ({
    ...w,
    topic: w.week <= 2 ? `Introduction to ${courseName}` : w.topic,
    activities: w.week <= 2 ? `${w.activities} related to ${courseName}` : w.activities,
  }))

  return NextResponse.json({
    courseName,
    courseCode: courseCode || "XXX123",
    credits: credits || 3,
    semester: semester || SEMESTERS[0],
    cpmk,
    weeks,
    note: "ponytail: template-based syllabus. AI-generated version requires LLM integration for tailored content.",
  })
}
