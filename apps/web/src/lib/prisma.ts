// ponytail: singleton PrismaClient — API routes jalan di Node.js, middleware (edge) gak pake ini
import { PrismaClient } from "../generated/prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import { Pool } from "pg"

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined }

const prisma = globalForPrisma.prisma ?? new PrismaClient({
  adapter: new PrismaPg(new Pool({ connectionString: process.env.DATABASE_URL })),
})

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma

export default prisma
