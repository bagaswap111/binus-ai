import { auth } from "@/auth"
import prisma from "@/lib/prisma"
import { NextResponse } from "next/server"
import { readFile } from "fs/promises"
import { join } from "path"

// ponytail: same similarity function as auto-grade, extracted to shared util in future
function textSimilarity(a: string, b: string): number {
  const wa = new Set(a.toLowerCase().split(/\s+/).filter(Boolean))
  const wb = new Set(b.toLowerCase().split(/\s+/).filter(Boolean))
  if (wa.size === 0 && wb.size === 0) return 1
  const intersection = new Set([...wa].filter((w) => wb.has(w)))
  return intersection.size / Math.max(wa.size, wb.size)
}

function findMatches(a: string, b: string): Array<{ text: string; similarity: number }> {
  const sentencesA = a.split(/[.!?]+/).filter(Boolean)
  const sentencesB = b.split(/[.!?]+/).filter(Boolean)
  const matches: Array<{ text: string; similarity: number }> = []
  for (const sa of sentencesA) {
    for (const sb of sentencesB) {
      const sim = textSimilarity(sa.trim(), sb.trim())
      if (sim > 0.6 && sa.trim().length > 20) {
        matches.push({ text: sa.trim().slice(0, 200), similarity: Math.round(sim * 100) })
      }
    }
  }
  return matches.slice(0, 10)
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const user = await prisma.user.findUnique({ where: { id: session.user.id } })
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 })

  const { projectId } = await req.json()

  const project = await prisma.project.findFirst({
    where: { id: projectId, userId: user.id },
    include: { files: true },
  })
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const textFiles = [".txt", ".md", ".csv", ".json", ".xml", ".html", ".css", ".js", ".ts", ".py", ".java", ".cpp", ".tex"]
  const fileContents: Array<{ id: string; name: string; content: string }> = []

  for (const f of project.files) {
    const ext = f.name.toLowerCase().slice(f.name.lastIndexOf("."))
    if (!textFiles.includes(ext)) continue
    try {
      const content = await readFile(join(process.cwd(), "uploads", projectId, f.url.split("/").pop()!), "utf-8")
      fileContents.push({ id: f.id, name: f.name, content })
    } catch { /* skip unreadable */ }
  }

  const results: Array<{
    fileA: string; fileB: string
    similarity: number; matches: Array<{ text: string; similarity: number }>
  }> = []

  for (let i = 0; i < fileContents.length; i++) {
    for (let j = i + 1; j < fileContents.length; j++) {
      const sim = textSimilarity(fileContents[i].content, fileContents[j].content)
      if (sim > 0.3) {
        results.push({
          fileA: fileContents[i].name,
          fileB: fileContents[j].name,
          similarity: Math.round(sim * 100),
          matches: findMatches(fileContents[i].content, fileContents[j].content),
        })
      }
    }
  }

  // also compare against all other user's text files in same school
  const otherFiles = await prisma.projectFile.findMany({
    where: { project: { userId: { not: user.id }, subject: { schoolId: user.schoolId } } },
    include: { project: { select: { id: true, name: true, userId: true } } },
    take: 50,
  })

  for (const f of project.files) {
    const ext = f.name.toLowerCase().slice(f.name.lastIndexOf("."))
    if (!textFiles.includes(ext)) continue
    const fc = fileContents.find((fc) => fc.id === f.id)
    if (!fc) continue
    for (const of_ of otherFiles) {
      const oext = of_.name.toLowerCase().slice(of_.name.lastIndexOf("."))
      if (!textFiles.includes(oext)) continue
      try {
        const oc = await readFile(join(process.cwd(), "uploads", of_.projectId, of_.url.split("/").pop()!), "utf-8")
        const sim = textSimilarity(fc.content, oc)
        if (sim > 0.5) {
          results.push({
            fileA: `${f.name} (yours)`,
            fileB: `${of_.name} (${of_.project.name})`,
            similarity: Math.round(sim * 100),
            matches: findMatches(fc.content, oc),
          })
        }
      } catch { /* skip */ }
    }
  }

  return NextResponse.json({ results })
}
