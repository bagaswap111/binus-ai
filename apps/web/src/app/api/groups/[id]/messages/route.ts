import { auth } from "@/auth"
import prisma from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const messages = await prisma.groupMessage.findMany({
    where: { groupId: id, group: { members: { some: { userId: session.user.id } } } },
    include: { user: { select: { id: true, name: true } } },
    orderBy: { createdAt: "asc" },
    take: 100,
  })
  return NextResponse.json(messages)
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { content } = await req.json()
  const msg = await prisma.groupMessage.create({
    data: { groupId: id, userId: session.user.id, content },
    include: { user: { select: { id: true, name: true } } },
  })
  return NextResponse.json(msg, { status: 201 })
}
