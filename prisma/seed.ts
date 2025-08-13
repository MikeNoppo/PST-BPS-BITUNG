import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

async function main() {
  const adminUser = await prisma.adminUser.findFirst({ where: { username: 'admin' } })
  if (!adminUser) {
    const password = process.env.INIT_ADMIN_PASSWORD || 'admin123'
    const hash = await bcrypt.hash(password, 10)
    await prisma.adminUser.create({
      data: {
        username: 'admin',
        passwordHash: hash,
        role: 'ADMIN'
      }
    })
    console.log(`Seeded admin user: admin / ${password}`)
  } else {
    console.log('Admin user already exists; skipping seed.')
  }
}

main().catch(e => {
  console.error(e)
  process.exit(1)
}).finally(async () => {
  // @ts-ignore
  if ((prisma as any).$disconnect) await (prisma as any).$disconnect()
})
