// Centralized Prisma Client (Accelerate + Edge-ready)
// Usage: import { prisma } from '@/lib/prisma'
// Ensure you have DATABASE_URL (and if using Accelerate: PRISMA_ACCELERATE_URL or configured via the Prisma UI) in your .env

import { PrismaClient } from '@/lib/generated/prisma/edge'
import { withAccelerate } from '@prisma/extension-accelerate'

// Global instance reuse for dev (hot reload) safety.
type AnyPrisma = PrismaClient & Record<string, any>
// @ts-ignore allow extended client shape
const globalForPrisma = globalThis as unknown as { prisma?: AnyPrisma }

export const prisma: AnyPrisma =
  globalForPrisma.prisma ||
  (new PrismaClient({
    datasources: { db: { url: process.env.DATABASE_URL } },
  }).$extends(withAccelerate()) as unknown as AnyPrisma)

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

// Helper: generate complaint code like PGD123456
export function generateComplaintCode() {
  const rand = Math.floor(100000 + Math.random() * 900000)
  return `PGD${rand}`
}
