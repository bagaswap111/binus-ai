import { auth } from "@/auth"
import prisma from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const forums = await prisma.discussionForum.findMany({
    include: {
      _count: { select: { posts: true } },
      subject: { select: { name: true } },
      createdBy: { select: { name: true } },
    },
    orderBy: [{ isPinned: "desc" }, { updatedAt: "desc" }],
  })
  return NextResponse.json(forums)
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { title, description, subjectId } = await req.json()
  const forum = await prisma.discussionForum.create({
    data: { title, description, subjectId, createdById: session.user.id },
  })
  return NextResponse.json(forum, { status: 201 })
}
