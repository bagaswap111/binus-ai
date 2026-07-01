import { auth } from "@/auth"
import { NextResponse } from "next/server"

// ponytail: career recommendations from hardcoded dataset + gateway fallback
const careers = [
  { id: "software-engineer", title: "Software Engineer", field: "Teknologi", minScore: 75, tags: ["informatika", "coding", "tech"], description: "Membangun dan mengembangkan aplikasi & sistem", outlook: "Sangat tinggi (pertumbuhan 25%/thn)", salary: "Rp 8-25 jt/bln" },
  { id: "data-scientist", title: "Data Scientist", field: "Teknologi", minScore: 80, tags: ["matematika", "statistika", "coding"], description: "Menganalisis data untuk insight bisnis", outlook: "Sangat tinggi", salary: "Rp 10-30 jt/bln" },
  { id: "doctor", title: "Dokter", field: "Kesehatan", minScore: 85, tags: ["biologi", "kimia", "ipa"], description: "Diagnosis & perawatan pasien", outlook: "Stabil tinggi", salary: "Rp 15-50 jt/bln" },
  { id: "teacher", title: "Guru/Dosen", field: "Pendidikan", minScore: 65, tags: ["pendidikan", "komunikasi"], description: "Mengajar dan mendidik", outlook: "Stabil", salary: "Rp 5-15 jt/bln" },
  { id: "lawyer", title: "Pengacara", field: "Hukum", minScore: 78, tags: ["hukum", "argumentasi"], description: "Praktik hukum & advis klien", outlook: "Tinggi", salary: "Rp 10-40 jt/bln" },
  { id: "architect", title: "Arsitek", field: "Teknik", minScore: 72, tags: ["desain", "matematika", "fisika"], description: "Merancang bangunan & struktur", outlook: "Sedang", salary: "Rp 8-25 jt/bln" },
  { id: "accountant", title: "Akuntan", field: "Bisnis", minScore: 70, tags: ["matematika", "ekonomi", "bisnis"], description: "Mengelola keuangan & audit", outlook: "Stabil", salary: "Rp 7-20 jt/bln" },
  { id: "psychologist", title: "Psikolog", field: "Kesehatan", minScore: 75, tags: ["psikologi", "sosial"], description: "Konseling & terapi mental", outlook: "Tinggi", salary: "Rp 8-20 jt/bln" },
]

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { scores, interests } = await req.json()
  // scores: { subject: number }[], interests: string[]
  const tags = (interests || []).map((i: string) => i.toLowerCase())

  const recommendations = careers
    .map((c) => {
      const tagMatch = c.tags.filter((t) => tags.some((ti: string) => t.includes(ti) || ti.includes(t))).length
      const avgScore = scores?.length ? scores.reduce((a: number, s: { score: number }) => a + s.score, 0) / scores.length : 0
      const scoreFit = avgScore >= c.minScore ? 1 : avgScore / c.minScore
      const relevance = Math.round(((tagMatch / c.tags.length) * 0.6 + scoreFit * 0.4) * 100)
      return { ...c, relevance }
    })
    .filter((c) => c.relevance > 20)
    .sort((a, b) => b.relevance - a.relevance)
    .slice(0, 5)

  return NextResponse.json({ recommendations })
}
