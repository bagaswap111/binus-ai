import { auth } from "@/auth"
import prisma from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function GET(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const subjectId = searchParams.get("subjectId")
  if (!subjectId) return NextResponse.json({ error: "subjectId required" }, { status: 400 })

  
  const entries = await prisma.knowledgeBase.findMany({
    where: { subjectId },
    orderBy: { createdAt: "desc" },
  })
  return NextResponse.json(entries)
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  // ponytail: knowledge base write requires teacher/lecturer/admin
  if (!["TEACHER", "LECTURER", "ADMIN", "SUPER_ADMIN"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { subjectId, title, content, source } = await req.json()
  if (!subjectId || !title || !content) {
    return NextResponse.json({ error: "subjectId, title, content required" }, { status: 400 })
  }

  
  const entry = await prisma.knowledgeBase.create({
    data: { subjectId, title, content, source },
  })
  return NextResponse.json(entry, { status: 201 })
}
