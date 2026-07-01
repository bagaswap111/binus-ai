import { auth } from "@/auth"
import prisma from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const top = await prisma.userXp.findMany({
    orderBy: { xp: "desc" },
    take: 10,
    select: { xp: true, level: true, user: { select: { name: true, schoolId: true } } },
  })

  const leaderboard = top.map((entry, i) => ({
    rank: i + 1,
    nickname: entry.user.name.substring(0, 2) + "***", // anonim
    xp: entry.xp,
    level: entry.level,
  }))

  return NextResponse.json({ leaderboard })
}
