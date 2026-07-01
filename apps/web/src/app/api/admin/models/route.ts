import { getSessionUser, unauthorized, forbidden } from "@/lib/guards"
import prisma from "@/lib/prisma"
import { NextResponse } from "next/server"

const ADMIN_ROLES = new Set(["ADMIN", "SUPER_ADMIN"])

// ponytail: explicit field whitelist prevents mass assignment
function pickModelFields(body: Record<string, unknown>, isUpdate = false) {
  const fields: Record<string, unknown> = {}
  const allowed = ["name", "modelId", "provider", "providerUrl", "capabilities", "maxTokens", "costPerInput", "costPerOutput", "isLocal", "allowedRoles", "minGradeLevel"]
  if (isUpdate) allowed.push("isActive")
  for (const k of allowed) {
    if (k in body) fields[k] = body[k]
  }
  return fields
}

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

  const body = await req.json()
  const model = await prisma.modelRegistry.create({
    data: { ...pickModelFields(body), schoolId: user.schoolId } as any,
  })
  return NextResponse.json(model, { status: 201 })
}

export async function PATCH(req: Request) {
  const user = await getSessionUser()
  if (!user) return unauthorized()
  if (!ADMIN_ROLES.has(user.role)) return forbidden()

  const body = await req.json()
  const { id } = body
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 })

  const model = await prisma.modelRegistry.update({
    where: { id },
    data: pickModelFields(body, true) as any,
  })
  return NextResponse.json(model)
}
