import { auth } from "@/auth"
import prisma from "@/lib/prisma"
import { NextResponse } from "next/server"

// ponytail: shared API key between gateway and Next.js for inter-service auth
const GATEWAY_API_KEY = process.env.GATEWAY_API_KEY || ""

// POST — create review (from gateway, validated via shared API key)
export async function POST(req: Request) {
  if (GATEWAY_API_KEY && req.headers.get("X-API-Key") !== GATEWAY_API_KEY) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const body = await req.json()
  const { inputText, classification, category, confidence, userId } = body

  if (!inputText || !classification) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 })
  }

  await prisma.contentReview.create({
    data: { inputText, classification, category, confidence: confidence ?? 0, submittedById: userId ?? null },
  })

  return NextResponse.json({ ok: true })
}

// GET — list pending reviews (admin only)
export async function GET(req: Request) {
  const session = await auth()
  if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const status = new URL(req.url).searchParams.get("status") || "PENDING"

  const reviews = await prisma.contentReview.findMany({
    where: { status: status as any },
    orderBy: { createdAt: "desc" },
    include: { submittedBy: { select: { name: true, email: true } } },
  })

  return NextResponse.json({ reviews })
}

// PATCH — approve/reject review (admin only)
export async function PATCH(req: Request) {
  const session = await auth()
  if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { reviewId, status, reviewerNote } = await req.json()
  if (!reviewId || !status) return NextResponse.json({ error: "Missing fields" }, { status: 400 })

  await prisma.contentReview.update({
    where: { id: reviewId },
    data: { status, reviewerNote: reviewerNote ?? null, reviewedById: session.user.id, reviewedAt: new Date() },
  })

  return NextResponse.json({ ok: true })
}
