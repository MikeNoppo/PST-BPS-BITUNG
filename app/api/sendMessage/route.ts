import { NextResponse } from 'next/server'
import { z } from 'zod'
import { sendWhatsAppMessage, isFonnteSuccess } from '@/lib/fonnte'
import { prisma } from '@/lib/prisma'

interface RL { perIp: Record<string, number[]> }
const g = globalThis as any
if (!g.__sendMsgRL) g.__sendMsgRL = { perIp: {} } as RL
const rl: RL = g.__sendMsgRL

function rateLimit(ip: string) {
  const now = Date.now()
  const windowMs = 10 * 60 * 1000
  const limit = 15
  const arr = rl.perIp[ip] || (rl.perIp[ip] = [])
  rl.perIp[ip] = arr.filter(ts => ts > now - windowMs)
  if (rl.perIp[ip].length >= limit) return false
  rl.perIp[ip].push(now)
  return true
}

export async function POST(req: Request) {
  const internalKey = process.env.INTERNAL_API_KEY
  if (internalKey) {
    const provided = req.headers.get('x-internal-key')
    if (provided !== internalKey) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })
  }
  const ip = (req.headers.get('x-forwarded-for') || '').split(',')[0].trim() || 'unknown'
  if (!rateLimit(ip)) return NextResponse.json({ error: 'RATE_LIMIT' }, { status: 429 })

  const body = await req.json().catch(() => null)
  if (!body) return NextResponse.json({ error: 'INVALID_JSON' }, { status: 400 })

  const schema = z.object({
    target: z.union([z.string(), z.array(z.string()).nonempty()]),
    message: z.string().min(1).max(60000),
    url: z.string().url().optional(),
    filename: z.string().max(200).optional(),
    schedule: z.number().int().optional(),
    delay: z.union([z.string(), z.number()]).optional(),
    countryCode: z.string().max(4).optional(),
    complaintCode: z.string().max(30).optional(),
  })
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'VALIDATION_ERROR', details: parsed.error.flatten() }, { status: 400 })
  const { target, message, url, filename, schedule, delay, countryCode, complaintCode } = parsed.data

  if (!process.env.FONNTE_TOKEN) return NextResponse.json({ error: 'CONFIG_ERROR', message: 'FONNTE_TOKEN missing' }, { status: 500 })
  const resp = await sendWhatsAppMessage(target, message, { url, filename, schedule, delay: delay?.toString(), countryCode })
  // If complaintCode provided, attempt to link notification
  if (complaintCode) {
    try {
      const comp = await prisma.complaint.findFirst({ where: { code: complaintCode.toUpperCase().trim() }, select: { id: true } })
      if (comp) {
        await prisma.notification.create({
          data: {
            complaintId: comp.id,
            channel: 'WHATSAPP',
            status: isFonnteSuccess(resp) ? 'SUCCESS' : 'FAILED',
            detail: JSON.stringify(isFonnteSuccess(resp) ? { detail: (resp as any).detail, id: (resp as any).id } : resp).slice(0,950)
          }
        })
      }
    } catch (e) {
      console.error('Gagal simpan Notification sendMessage', e)
    }
  }
  if ((resp as any).error || (resp as any).status === false) {
    return NextResponse.json({ error: 'SEND_FAILED', provider: resp }, { status: 500 })
  }
  return NextResponse.json({ data: resp })
}
