import { auth } from "@/auth"
import { NextResponse } from "next/server"

// ponytail: static dataset, expand via API in production
const universities = [
  { name: "BINUS University", location: "Jakarta", majors: ["Teknik Informatika", "Sistem Informasi", "Manajemen", "Akuntansi", "Desain Komunikasi Visual"], minGpa: 3.0, acceptance: "35%", type: "Swasta", accreditasi: "Unggul" },
  { name: "Universitas Indonesia", location: "Depok", majors: ["Kedokteran", "Teknik", "Hukum", "Ekonomi", "Psikologi"], minGpa: 3.2, acceptance: "8%", type: "Negeri", accreditasi: "Unggul" },
  { name: "Institut Teknologi Bandung", location: "Bandung", majors: ["Teknik Elektro", "Informatika", "Fisika", "Matematika", "Arsitektur"], minGpa: 3.3, acceptance: "6%", type: "Negeri", accreditasi: "Unggul" },
  { name: "Universitas Gadjah Mada", location: "Yogyakarta", majors: ["Kedokteran", "Farmasi", "Teknik", "Hukum", "Filsafat"], minGpa: 3.2, acceptance: "10%", type: "Negeri", accreditasi: "Unggul" },
  { name: "Universitas Airlangga", location: "Surabaya", majors: ["Kedokteran", "Keperawatan", "Hukum", "Ekonomi"], minGpa: 3.0, acceptance: "12%", type: "Negeri", accreditasi: "Unggul" },
  { name: "Universitas Diponegoro", location: "Semarang", majors: ["Teknik", "Hukum", "Ekonomi", "Peternakan"], minGpa: 2.8, acceptance: "15%", type: "Negeri", accreditasi: "Baik Sekali" },
  { name: "Institut Teknologi Sepuluh Nopember", location: "Surabaya", majors: ["Teknik Mesin", "Informatika", "Statistika", "Desain"], minGpa: 3.1, acceptance: "12%", type: "Negeri", accreditasi: "Unggul" },
  { name: "Telkom University", location: "Bandung", majors: ["Informatika", "Sistem Informasi", "Teknik Telekomunikasi", "Desain"], minGpa: 2.8, acceptance: "25%", type: "Swasta", accreditasi: "Unggul" },
]

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { gpa, majorInterest, location } = await req.json()
  const interest = (majorInterest || "").toLowerCase()

  const matches = universities
    .map((u) => {
      const majorMatch = u.majors.some((m) => m.toLowerCase().includes(interest) || interest.includes(m.toLowerCase()))
      const gpaFit = gpa >= u.minGpa ? 1 : gpa / u.minGpa
      const probability = Math.round(((majorMatch ? 0.4 : 0) + gpaFit * 0.3 + (location ? 0.1 : 0)) * 100)
      return { ...u, probability: Math.min(probability + 30, 95), match: majorMatch, gpaFit: gpaFit >= 1 }
    })
    .sort((a, b) => b.probability - a.probability)

  return NextResponse.json({ universities: matches })
}
