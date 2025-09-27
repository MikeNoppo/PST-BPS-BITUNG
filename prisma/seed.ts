import 'dotenv/config'
import { prisma } from '../lib/prisma'
import bcrypt from 'bcryptjs'

async function main() {
  const username = 'adminPST7172'
  const password = process.env.INIT_ADMIN_PASSWORD || 'admin123'
  const hash = await bcrypt.hash(password, 10)

  const existed = await prisma.adminUser.findUnique({ where: { username } })
  await prisma.adminUser.upsert({
    where: { username },
    update: { passwordHash: hash, role: 'ADMIN' },
    create: { username, passwordHash: hash, role: 'ADMIN' }
  })
  console.log(`${existed ? 'Updated' : 'Seeded'} admin user: ${username} / ${password}`)
}

main().catch(e => {
  console.error(e)
  process.exit(1)
}).finally(async () => {
  // @ts-ignore
  if ((prisma as any).$disconnect) await (prisma as any).$disconnect()
})
