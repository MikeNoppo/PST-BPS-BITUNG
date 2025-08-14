import { PrismaClient } from '@/lib/generated/prisma/edge'
import { withAccelerate } from '@prisma/extension-accelerate'

type AnyPrisma = PrismaClient & Record<string, any>
const globalForPrisma = globalThis as unknown as { prisma?: AnyPrisma }

function createClient(): AnyPrisma {
  const url = process.env.DATABASE_URL
  if (!url) {
    throw new Error(
      'DATABASE_URL environment variable is missing'
    )
  }
  return new PrismaClient({ datasources: { db: { url } } }).$extends(withAccelerate()) as unknown as AnyPrisma
}

let _client: AnyPrisma | undefined = globalForPrisma.prisma

export const prisma: AnyPrisma = new Proxy({}, {
  get(_target, prop) {
    if (!_client) {
      _client = createClient()
      if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = _client
    }
    return _client[prop]
  }
}) as AnyPrisma
