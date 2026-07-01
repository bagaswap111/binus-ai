// ponytail: singleton PrismaClient — API routes jalan di Node.js, middleware (edge) gak pake ini
import { PrismaClient } from "../generated/prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import { Pool } from "pg"

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined }

// ponytail: add ?sslmode=require in production DATABASE_URL; pool max=10 prevents connection exhaustion
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 10,
})

const prisma = globalForPrisma.prisma ?? new PrismaClient({
  adapter: new PrismaPg(pool),
})

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma

export default prisma
