import { auth } from "@/auth"
import prisma from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const user = await prisma.user.findUnique({ where: { id: session.user.id } })
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 })

  const questions = await prisma.questionBank.findMany({
    where: { subject: { schoolId: user.schoolId } },
    include: { subject: { select: { name: true, code: true } } },
    orderBy: { createdAt: "desc" },
  })
  return NextResponse.json(questions)
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const user = await prisma.user.findUnique({ where: { id: session.user.id } })
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 })
  if (!["TEACHER", "LECTURER", "ADMIN", "SUPER_ADMIN"].includes(user.role)) {
    return NextResponse.json({ error: "Only teachers can create questions" }, { status: 403 })
  }

  const { subjectId, type, question, options, answer, maxScore, bloomLevel, tags, difficulty } = await req.json()
  const q = await prisma.questionBank.create({
    data: { subjectId, teacherId: user.id, type, question, options, answer, maxScore: maxScore || 10, bloomLevel, tags: tags || [], difficulty },
  })
  return NextResponse.json(q, { status: 201 })
}
