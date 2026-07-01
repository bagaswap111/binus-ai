import { auth } from "@/auth"
import prisma from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { name: true, email: true, id: true },
  })
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 })

  const projects = await prisma.project.findMany({
    where: { userId: user.id },
    include: { files: { select: { name: true, type: true, createdAt: true } } },
    orderBy: { updatedAt: "desc" },
  })

  const portfolio = {
    name: user.name,
    email: user.email,
    projects: projects.map((p) => ({
      name: p.name,
      description: p.description,
      files: p.files.length,
      createdAt: p.createdAt,
    })),
  }

  return NextResponse.json({ portfolio })
}
