import 'dotenv/config'
import { prisma } from '../lib/prisma'
import bcrypt from 'bcryptjs'

// Helper: generate code like production logic
function generateComplaintCode(): string {
  const now = new Date()
  const datePart = now.toISOString().slice(2,10).replace(/-/g,'')
  const yymmdd = datePart.slice(0,2) + datePart.slice(3,5) + datePart.slice(6,8)
  const rand = Math.random().toString(36).toUpperCase().replace(/[^A-Z0-9]/g,'').slice(0,3)
  return `PGD${yymmdd}${rand}`
}

async function createUniqueCode(attempt = 0): Promise<string> {
  if (attempt > 10) throw new Error('Failed to create unique complaint code')
  const code = generateComplaintCode()
  const exists = await prisma.complaint.findFirst({ where: { code }, select: { id: true } })
  return exists ? createUniqueCode(attempt + 1) : code
}

const CLASSIFICATIONS = [
  'PERSYARATAN_LAYANAN',
  'PROSEDUR_LAYANAN',
  'WAKTU_PELAYANAN',
  'BIAYA_TARIF_PELAYANAN',
  'PRODUK_PELAYANAN',
  'KOMPETENSI_PELAKSANA_PELAYANAN',
  'PERILAKU_PETUGAS_PELAYANAN',
  'SARANA_DAN_PRASARANA'
] as const

const NAMES = [
  'Andi', 'Budi', 'Citra', 'Dewi', 'Eko', 'Fajar', 'Gita', 'Hadi', 'Intan', 'Joko',
  'Kurnia', 'Lestari', 'Made', 'Nadia', 'Oki', 'Putri', 'Qori', 'Rama', 'Sari', 'Teguh'
]

function randomItem<T>(arr: readonly T[]): T { return arr[Math.floor(Math.random() * arr.length)] }

interface SeedComplaintPlan {
  createdAt: Date
  status: 'BARU' | 'PROSES' | 'SELESAI'
  classification: typeof CLASSIFICATIONS[number]
}

function buildPlans(year: number, count: number): SeedComplaintPlan[] {
  const plans: SeedComplaintPlan[] = []
  for (let i = 0; i < count; i++) {
    const month = Math.floor(Math.random() * 12) // 0-11
    const day = Math.max(1, Math.floor(Math.random() * 28)) // safe day
    const createdAt = new Date(Date.UTC(year, month, day, Math.floor(Math.random()*23), Math.floor(Math.random()*59)))
    // Weighted status distribution: more PROSES & SELESAI than BARU for past months
    const r = Math.random()
    let status: SeedComplaintPlan['status']
    if (r < 0.25) status = 'BARU'
    else if (r < 0.65) status = 'PROSES'
    else status = 'SELESAI'
    const classification = randomItem(CLASSIFICATIONS)
    plans.push({ createdAt, status, classification })
  }
  return plans
}

async function seedComplaints() {
  const existing = await prisma.complaint.count()
  if (existing > 0) {
    console.log(`Complaints already exist (${existing}); skipping complaint seed.`)
    return
  }

  const currentYear = new Date().getFullYear()
  const lastYear = currentYear - 1

  const plans = [
    ...buildPlans(lastYear, 60),
    ...buildPlans(currentYear, 120)
  ]

  console.log(`Seeding ${plans.length} complaints for years ${lastYear} & ${currentYear}...`)

  for (const plan of plans) {
    const code = await createUniqueCode()
    const reporterName = randomItem(NAMES) + ' ' + randomItem(['A','B','C','D','E','F'])
    const email = reporterName.replace(/\s+/g,'.').toLowerCase()+ '@example.test'
    const phone = '+6281' + Math.floor(100000000 + Math.random()*900000000).toString().slice(0,8)
    const baseDescription = `Keluhan terkait ${plan.classification.replace(/_/g,' ').toLowerCase()}.` 

    // Determine completedAt if status SELESAI (1-20 days after createdAt)
    let completedAt: Date | undefined
    if (plan.status === 'SELESAI') {
      completedAt = new Date(plan.createdAt.getTime() + (Math.floor(Math.random()*20)+1)*24*60*60*1000)
      if (completedAt.getFullYear() !== plan.createdAt.getFullYear()) {
        // keep within same year boundary
        completedAt = new Date(Date.UTC(plan.createdAt.getFullYear(), 11, 31, 23, 59, 0))
      }
    }

    const complaint = await prisma.complaint.create({
      data: {
        code,
        reporterName,
        email,
        phone,
        classification: plan.classification as any,
        description: baseDescription,
        status: plan.status as any,
        createdAt: plan.createdAt,
        completedAt,
        rtl: plan.status === 'PROSES' || plan.status === 'SELESAI' ? 'Sedang ditindaklanjuti.' : null
      }
    })

    // Create status update history (simple simulation)
    if (plan.status !== 'BARU') {
      // first transition to PROSES if final is PROSES/SELESAI
      await prisma.statusUpdate.create({ data: { complaintId: complaint.id, status: 'PROSES', note: 'Pengaduan sedang diproses.' } })
      if (plan.status === 'SELESAI') {
        await prisma.statusUpdate.create({ data: { complaintId: complaint.id, status: 'SELESAI', note: 'Pengaduan telah selesai ditangani.' } })
      }
    }
  }
  console.log('Complaint seeding done.')
}

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

  await seedComplaints()
}

main().catch(e => {
  console.error(e)
  process.exit(1)
}).finally(async () => {
  // @ts-ignore
  if ((prisma as any).$disconnect) await (prisma as any).$disconnect()
})
