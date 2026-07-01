import { auth } from "@/auth"
import prisma from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const badges = await prisma.badge.findMany({
    where: { userId: session.user.id },
    orderBy: { earnedAt: "desc" },
  })

  return NextResponse.json({ badges })
}
