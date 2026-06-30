import { auth } from "@/auth"
import prisma from "@/lib/prisma"
import { NextResponse } from "next/server"

// ponytail: simple length-based moderation
function moderate(content: string): { flagged: boolean; reason: string | null } {
  if (content.length < 20) return { flagged: true, reason: "Post too short (min 20 characters)" }
  const toxic = ["spam", "promosi", "jual", "beli", "toxic", "bodoh", "bego", "anjing"]
  const lower = content.toLowerCase()
  for (const t of toxic) {
    if (lower.includes(t)) return { flagged: true, reason: `Flagged: contains inappropriate language` }
  }
  return { flagged: false, reason: null }
}

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const posts = await prisma.discussionPost.findMany({
    where: { forumId: id },
    include: { user: { select: { id: true, name: true } } },
    orderBy: { createdAt: "desc" },
  })
  return NextResponse.json(posts)
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { content } = await req.json()
  const mod = moderate(content)

  const post = await prisma.discussionPost.create({
    data: { forumId: id, userId: session.user.id, content, isFlagged: mod.flagged, flagReason: mod.reason },
    include: { user: { select: { id: true, name: true } } },
  })
  return NextResponse.json(post, { status: 201 })
}
