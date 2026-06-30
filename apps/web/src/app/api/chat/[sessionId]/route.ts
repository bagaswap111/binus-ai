// ponytail: get/delete chat session by ID
import { auth } from "@/auth"
import prisma from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function GET(req: Request, { params }: { params: Promise<{ sessionId: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { sessionId } = await params
  
  const chat = await prisma.chatSession.findFirst({
    where: { id: sessionId, userId: session.user.id },
    include: { messages: { orderBy: { createdAt: "asc" } } },
  })
  if (!chat) return NextResponse.json({ error: "Not found" }, { status: 404 })
  return NextResponse.json(chat)
}

export async function DELETE(req: Request, { params }: { params: Promise<{ sessionId: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { sessionId } = await params
  
  await prisma.$transaction([
    prisma.message.deleteMany({ where: { sessionId } }),
    prisma.chatSession.deleteMany({ where: { id: sessionId, userId: session.user.id } }),
  ])
  return NextResponse.json({ ok: true })
}
