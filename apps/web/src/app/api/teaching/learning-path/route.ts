import { auth } from "@/auth"
import { NextResponse } from "next/server"

// ponytail: topic difficulty mapping — hardcoded for MVP
const TOPIC_DIFFICULTY: Record<string, string[]> = {
  "Mathematics": ["Basic Arithmetic", "Algebra", "Geometry", "Trigonometry", "Calculus", "Linear Algebra", "Statistics", "Advanced Calculus"],
  "Programming": ["Variables & Types", "Control Flow", "Functions", "Data Structures", "OOP", "Algorithms", "Design Patterns", "System Design"],
  "Physics": ["Mechanics", "Thermodynamics", "Waves & Optics", "Electromagnetism", "Modern Physics", "Quantum Mechanics"],
  "English": ["Basic Grammar", "Vocabulary", "Reading Comprehension", "Writing", "Academic Writing", "Literature Analysis"],
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { subject, currentScore, completedTopics } = await req.json()
  if (!subject) return NextResponse.json({ error: "Subject required" }, { status: 400 })

  const topics = TOPIC_DIFFICULTY[subject] || TOPIC_DIFFICULTY["Mathematics"]
  const done = (completedTopics || []) as string[]
  const score = currentScore || 50

  const remaining = topics.filter((t) => !done.includes(t))
  const recommendations = score < 60
    ? remaining.slice(0, 2)
    : remaining.slice(0, 4)

  return NextResponse.json({
    subject,
    currentLevel: score < 40 ? "beginner" : score < 70 ? "intermediate" : "advanced",
    completedTopics: done,
    recommendedTopics: recommendations,
    focusAreas: score < 60 ? ["Strengthen fundamentals", "Review basic concepts"] : ["Advance to next level", "Explore related topics"],
    nextMilestone: recommendations.length > 0 ? `Master "${recommendations[0]}"` : "All topics completed!",
  })
}
