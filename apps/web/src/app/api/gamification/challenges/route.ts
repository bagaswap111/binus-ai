import { auth } from "@/auth"
import prisma from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  const challenges = await prisma.dailyChallenge.findMany({
    where: { date: { gte: today, lt: tomorrow } },
    include: { completions: { where: { userId: session.user.id }, select: { id: true } } },
  })

  const mapped = challenges.map((c) => ({ ...c, completed: c.completions.length > 0, completions: undefined }))

  return NextResponse.json({ challenges: mapped })
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { challengeId } = await req.json()

  const existing = await prisma.challengeCompletion.findUnique({
    where: { challengeId_userId: { challengeId, userId: session.user.id } },
  })
  if (existing) return NextResponse.json({ error: "Already completed" }, { status: 400 })

  const challenge = await prisma.dailyChallenge.findUnique({ where: { id: challengeId } })
  if (!challenge) return NextResponse.json({ error: "Not found" }, { status: 404 })

  await prisma.challengeCompletion.create({ data: { challengeId, userId: session.user.id } })

  await prisma.userXp.upsert({
    where: { userId: session.user.id },
    update: { xp: { increment: challenge.xpReward } },
    create: { userId: session.user.id, xp: challenge.xpReward },
  })

  return NextResponse.json({ completed: true, xpReward: challenge.xpReward })
}
