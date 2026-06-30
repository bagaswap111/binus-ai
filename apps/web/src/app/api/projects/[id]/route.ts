import { auth } from "@/auth"
import prisma from "@/lib/prisma"
import { NextResponse } from "next/server"
import { writeFile, mkdir } from "fs/promises"
import { join, basename } from "path"
import { randomUUID } from "crypto"

const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50MB
const ALLOWED_TYPES = ["image/", "application/pdf", "text/", "application/vnd", "application/msword", "application/zip"]

// ponytail: strip EXIF from JPEG by removing APP1 marker (0xFFE1)
function stripExif(buf: Buffer<ArrayBufferLike>): Buffer<ArrayBufferLike> {
  let i = 2
  while (i < buf.length - 1) {
    if (buf[i] === 0xFF && buf[i + 1] === 0xE1) {
      const len = buf.readUInt16BE(i + 2) + 2
      return Buffer.concat([buf.subarray(0, i), buf.subarray(i + len)])
    }
    i++
  }
  return buf
}

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await params
  
  const project = await prisma.project.findFirst({
    where: { id, userId: session.user.id },
    include: { files: true, chatSessions: true },
  })
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 })
  return NextResponse.json(project)
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await params
  
  const { name, description } = await req.json()
  await prisma.project.updateMany({
    where: { id, userId: session.user.id },
    data: { name, description },
  })
  return NextResponse.json({ ok: true })
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await params
  
  const project = await prisma.project.findFirst({ where: { id, userId: session.user.id } })
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const form = await req.formData()
  const file = form.get("file") as File
  if (!file) return NextResponse.json({ error: "No file" }, { status: 400 })

  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json({ error: "File too large (max 50MB)" }, { status: 413 })
  }
  if (!ALLOWED_TYPES.some((t) => file.type.startsWith(t)) && file.type !== "") {
    return NextResponse.json({ error: "File type not allowed" }, { status: 415 })
  }

  const raw = Buffer.from(await file.arrayBuffer())
  // ponytail: strip EXIF from JPEG — removes APP1 marker segment
  const buffer = file.type === "image/jpeg" || file.type === "image/jpg" ? stripExif(raw) : raw
  const safeName = `${randomUUID()}-${basename(file.name).replace(/[^a-zA-Z0-9._-]/g, "_")}`
  const uploadDir = join(process.cwd(), "uploads", id)
  await mkdir(uploadDir, { recursive: true })
  const filePath = join(uploadDir, safeName)
  await writeFile(filePath, buffer)

  const record = await prisma.projectFile.create({
    data: {
      name: file.name,
      type: file.type || "application/octet-stream",
      size: file.size,
      url: `/uploads/${id}/${safeName}`,
      projectId: id,
    },
  })
  return NextResponse.json(record, { status: 201 })
}
