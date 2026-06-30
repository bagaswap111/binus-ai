import { auth } from "@/auth"
import prisma from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const existing = await prisma.studyGroupMember.findUnique({
    where: { groupId_userId: { groupId: id, userId: session.user.id } },
  })
  if (existing) return NextResponse.json({ error: "Already a member" }, { status: 400 })

  await prisma.studyGroupMember.create({
    data: { groupId: id, userId: session.user.id },
  })
  return NextResponse.json({ success: true })
}
