import { getSessionUser, isTeacher, unauthorized } from "@/lib/guards"
import prisma from "@/lib/prisma"
import { NextResponse } from "next/server"
import { sanitize } from "@/lib/security"

export async function GET() {
  const user = await getSessionUser()
  if (!user) return unauthorized()

  const subjects = await prisma.subject.findMany({
    where: { schoolId: user.schoolId },
    orderBy: { name: "asc" },
  })
  return NextResponse.json(subjects)
}

export async function POST(req: Request) {
  const user = await getSessionUser()
  if (!user) return unauthorized()
  if (!isTeacher(user)) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const { name, code, description, agentPrompt } = await req.json()
  const subject = await prisma.subject.create({
    data: {
      name: sanitize(name),
      code: sanitize(code),
      description: description ? sanitize(description) : null,
      agentPrompt: agentPrompt ? sanitize(agentPrompt) : null,
      schoolId: user.schoolId!,
    },
  })
  return NextResponse.json(subject, { status: 201 })
}
