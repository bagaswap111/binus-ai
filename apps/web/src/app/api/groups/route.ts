import { auth } from "@/auth"
import prisma from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const groups = await prisma.studyGroup.findMany({
    where: { members: { some: { userId: session.user.id } } },
    include: {
      _count: { select: { members: true, messages: true } },
      subject: { select: { name: true } },
    },
    orderBy: { updatedAt: "desc" },
  })
  return NextResponse.json(groups)
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { name, description, subjectId } = await req.json()
  const group = await prisma.studyGroup.create({
    data: {
      name, description, subjectId,
      createdById: session.user.id,
      members: { create: { userId: session.user.id, role: "admin" } },
    },
  })
  return NextResponse.json(group, { status: 201 })
}
