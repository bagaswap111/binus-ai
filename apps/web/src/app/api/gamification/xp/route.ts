import { auth } from "@/auth"
import prisma from "@/lib/prisma"
import { NextResponse } from "next/server"

const XP_PER_ACTION: Record<string, number> = {
  chat: 10, exam_submit: 50, exam_pass: 100, project_create: 30,
  forum_post: 15, group_message: 5, daily_login: 20,
}

function levelForXp(xp: number) {
  return Math.floor(Math.sqrt(xp / 100)) + 1
}

function checkBadges(xp: number, streak: number): string[] {
  const earned: string[] = []
  if (xp >= 100) earned.push("First Steps")
  if (xp >= 500) earned.push("Getting Started")
  if (xp >= 1000) earned.push("Century Club")
  if (xp >= 5000) earned.push("Power Learner")
  if (xp >= 10000) earned.push("XP Master")
  if (streak >= 3) earned.push("Streak Starter")
  if (streak >= 7) earned.push("Week Warrior")
  if (streak >= 30) earned.push("Monthly Champion")
  return earned
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { action } = await req.json()
  const xpGain = XP_PER_ACTION[action] || 10

  const userXp = await prisma.userXp.upsert({
    where: { userId: session.user.id },
    update: { xp: { increment: xpGain }, lastActiveAt: new Date() },
    create: { userId: session.user.id, xp: xpGain, lastActiveAt: new Date() },
  })

  const newLevel = levelForXp(userXp.xp)
  const leveledUp = newLevel > userXp.level
  if (leveledUp) await prisma.userXp.update({ where: { userId: session.user.id }, data: { level: newLevel } })

  const newStreak = userXp.streak + (userXp.lastActiveAt ? 1 : 0)
  await prisma.userXp.update({ where: { userId: session.user.id }, data: { streak: newStreak } })

  const badges = checkBadges(userXp.xp + xpGain, newStreak)
  for (const name of badges) {
    const type = name.toLowerCase().replace(/\s+/g, "_")
    await prisma.badge.upsert({
      where: { userId_type: { userId: session.user.id, type } },
      update: {},
      create: { userId: session.user.id, type, name },
    })
  }

  return NextResponse.json({ xp: userXp.xp + xpGain, level: newLevel, streak: newStreak, leveledUp, newBadges: badges })
}

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const xp = await prisma.userXp.findUnique({ where: { userId: session.user.id } })
  const badges = await prisma.badge.findMany({ where: { userId: session.user.id }, orderBy: { earnedAt: "desc" } })

  return NextResponse.json({ xp: xp?.xp || 0, level: xp?.level || 1, streak: xp?.streak || 0, badges })
}
