import { getSessionUser, unauthorized, forbidden } from "@/lib/guards"
import prisma from "@/lib/prisma"
import { NextResponse } from "next/server"

const ADMIN_ROLES = new Set(["ADMIN", "SUPER_ADMIN"])

export async function GET() {
  const user = await getSessionUser()
  if (!user) return unauthorized()
  if (!ADMIN_ROLES.has(user.role)) return forbidden()

  const models = await prisma.modelRegistry.findMany({
    where: { schoolId: user.schoolId },
    orderBy: { name: "asc" },
  })
  return NextResponse.json(models)
}

export async function POST(req: Request) {
  const user = await getSessionUser()
  if (!user) return unauthorized()
  if (!ADMIN_ROLES.has(user.role)) return forbidden()

  const data = await req.json()
  const model = await prisma.modelRegistry.create({
    data: { ...data, schoolId: user.schoolId },
  })
  return NextResponse.json(model, { status: 201 })
}

export async function PATCH(req: Request) {
  const user = await getSessionUser()
  if (!user) return unauthorized()
  if (!ADMIN_ROLES.has(user.role)) return forbidden()

  const { id, ...data } = await req.json()
  const model = await prisma.modelRegistry.update({
    where: { id },
    data,
  })
  return NextResponse.json(model)
}
