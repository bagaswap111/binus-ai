// ponytail: chat streaming API — SSE ke AI Gateway, simpan ke DB
import { getSessionUser, unauthorized } from "@/lib/guards"
import { rateLimit, sanitize } from "@/lib/security"
import prisma from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function POST(req: Request) {
  const user = await getSessionUser()
  if (!user) return unauthorized()

  if (!rateLimit(`chat:${user.id}`, 30, 60000)) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 })
  }

  const body = await req.json()
  if (!body.message || typeof body.message !== "string") {
    return NextResponse.json({ error: "Message is required" }, { status: 400 })
  }
  const { message, sessionId, subjectId, modelId } = body

  let chatSession = sessionId
    ? await prisma.chatSession.findFirst({ where: { id: sessionId, userId: user.id } })
    : null

  if (!chatSession) {
    chatSession = await prisma.chatSession.create({
      data: {
        userId: user.id,
        subjectId: subjectId || null,
        title: message?.slice(0, 80) || "New Chat",
      },
    })
  }

  await prisma.message.create({
    data: { sessionId: chatSession.id, role: "user", content: sanitize(message) },
  })

  const messages = await prisma.message.findMany({
    where: { sessionId: chatSession.id },
    orderBy: { createdAt: "asc" },
    take: 50,
  })

  const history = messages.map((m: any) => ({ role: m.role, content: m.content }))

  const gatewayUrl = process.env.GATEWAY_URL || "http://localhost:8000"
  const gwHeaders: Record<string, string> = { "Content-Type": "application/json" }
  if (process.env.GATEWAY_API_KEY) gwHeaders["X-API-Key"] = process.env.GATEWAY_API_KEY
  const gatewayRes = await fetch(`${gatewayUrl}/v1/chat`, {
    method: "POST",
    headers: gwHeaders,
    body: JSON.stringify({
      messages: history,
      model: modelId || "gpt-4o-mini",
      user_role: user.role || "SMA",
      user_id: user.id,
      subject_id: subjectId,
    }),
  })

  if (!gatewayRes.ok) {
    return NextResponse.json({ error: "AI Gateway error" }, { status: 502 })
  }

  const aiData = await gatewayRes.json()
  await prisma.message.create({
    data: {
      sessionId: chatSession.id,
      role: "assistant",
      content: aiData.content,
      modelUsed: aiData.model,
    },
  })

  return NextResponse.json({
    sessionId: chatSession.id,
    content: aiData.content,
  })
}
