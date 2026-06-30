import { auth } from "@/auth"
import prisma from "@/lib/prisma"
import { NextResponse } from "next/server"
import { readFile } from "fs/promises"
import { join } from "path"

// ponytail: key theme extraction by word frequency
function extractTheme(content: string): string {
  const words = content.toLowerCase().split(/\s+/).filter((w) => w.length > 4)
  const freq: Record<string, number> = {}
  words.forEach((w) => { freq[w] = (freq[w] || 0) + 1 })
  return Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([w]) => w).join(", ")
}

function extractMethodology(content: string): string[] {
  const methods = ["qualitative", "quantitative", "mixed method", "survey", "experiment", "case study", "rct", "meta-analysis", "systematic review", "grounded theory", "ethnography", "phenomenology"]
  return methods.filter((m) => content.toLowerCase().includes(m))
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { projectId } = await req.json()
  const user = await prisma.user.findUnique({ where: { id: session.user.id } })
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 })

  const project = await prisma.project.findFirst({
    where: { id: projectId, userId: user.id },
    include: { files: true },
  })
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const textExts = [".txt", ".md", ".csv", ".json", ".html"]
  const articles: Array<{ name: string; content: string; theme: string; methodology: string[] }> = []

  for (const f of project.files) {
    const ext = f.name.toLowerCase().slice(f.name.lastIndexOf("."))
    if (!textExts.includes(ext)) continue
    try {
      const content = await readFile(join(process.cwd(), "uploads", projectId, f.url.split("/").pop()!), "utf-8")
      articles.push({
        name: f.name,
        content: content.slice(0, 5000),
        theme: extractTheme(content),
        methodology: extractMethodology(content),
      })
    } catch { /* skip */ }
  }

  // ponytail: simple comparison matrix — real LLM would do proper lit review
  const matrix = articles.map((a) => ({
    title: a.name,
    theme: a.theme,
    methodology: a.methodology.join(", ") || "Not specified",
    keyFindings: a.content.slice(0, 500).replace(/\n/g, " ").trim(),
  }))

  return NextResponse.json({ articles: articles.length, matrix })
}
