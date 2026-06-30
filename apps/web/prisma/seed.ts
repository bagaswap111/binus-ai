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

  console.log(`Seed done: ${Object.keys(created).length} schools, admin@binus.edu / admin123`)
}

main().catch(console.error).finally(async () => {
  await prisma.$disconnect()
})
