import { PrismaClient } from '@/lib/generated/prisma/client'
type AnyPrisma = PrismaClient & Record<string, any>
const globalForPrisma = globalThis as unknown as { prisma?: AnyPrisma }
const prismaClientSingleton = () => {
  return new PrismaClient()
}

export const prisma: AnyPrisma = globalForPrisma.prisma ?? prismaClientSingleton()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma