import "dotenv/config"
import prisma from "../src/lib/prisma"
import bcrypt from "bcryptjs"

const schools = [
  { name: "BINUS University", domain: "binus.edu", type: "university" },
  { name: "BINUS School Serpong", domain: "serpong.binus.sch.id", type: "SMA" },
  { name: "BINUS School Simprug", domain: "simprug.binus.sch.id", type: "SMA" },
  { name: "BINUS School Bekasi", domain: "bekasi.binus.sch.id", type: "SMA" },
  { name: "BINUS School Semarang", domain: "semarang.binus.sch.id", type: "SMA" },
  { name: "BINUS School Bandung", domain: "bandung.binus.sch.id", type: "SMA" },
  { name: "BINUS School Malang", domain: "malang.binus.sch.id", type: "SMA" },
  { name: "BINUS School Pekanbaru", domain: "pekanbaru.binus.sch.id", type: "SMA" },
  { name: "BINUS School BSD", domain: "bsd.binus.sch.id", type: "SMA" },
]

async function main() {
  const created: Record<string, string> = {}

  for (const s of schools) {
    const school = await prisma.school.upsert({
      where: { domain: s.domain },
      update: {},
      create: { name: s.name, domain: s.domain, type: s.type },
    })
    created[s.domain] = school.id
  }

  const hashed = await bcrypt.hash("admin123", 10)
  await prisma.user.upsert({
    where: { email: "admin@binus.edu" },
    update: {},
    create: {
      email: "admin@binus.edu",
      name: "Super Admin",
      password: hashed,
      role: "SUPER_ADMIN",
      schoolId: created["binus.edu"],
    },
  })

  // Seed daily challenges
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const challenges = [
    { title: "Chat dengan AI", description: "Kirim 5 pesan ke AI Assistant", xpReward: 50 },
    { title: "Diskusi Forum", description: "Buat 1 posting di forum diskusi", xpReward: 30 },
    { title: "Kerjakan Soal", description: "Selesaikan 1 soal dari bank soal", xpReward: 40 },
    { title: "Belajar 30 Menit", description: "Akses knowledge base selama 30 menit", xpReward: 60 },
    { title: "Review Materi", description: "Baca 1 dokumen di project folder", xpReward: 25 },
  ]
  for (const c of challenges) {
    await prisma.dailyChallenge.upsert({
      where: { id: `${c.title}-${today.toISOString()}` },
      update: {},
      create: { id: `${c.title}-${today.toISOString()}`, ...c, date: today },
    })
  }

  console.log(`Seed done: ${Object.keys(created).length} schools, ${challenges.length} challenges, admin@binus.edu / admin123`)
}

main().catch(console.error).finally(async () => {
  await prisma.$disconnect()
})
