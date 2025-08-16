import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendWhatsAppMessage, isFonnteSuccess, normalizePhone } from '@/lib/fonnte'

function humanStatus(s: string): string {
  switch (s) {
    case 'BARU': return 'Baru'
    case 'PROSES': return 'Proses'
    case 'SELESAI': return 'Selesai'
    default: return s
  }
}

export async function POST(_req: Request, context: { params: { code: string } }) {
  const rawCode = context.params.code
  if (!rawCode) return NextResponse.json({ ok: false, error: 'MISSING_CODE' }, { status: 400 })
  let body: any = {}
  try { body = await _req.json().catch(() => ({})) } catch {}

  try {
    const code = decodeURIComponent(rawCode).trim().toUpperCase()
    const complaint = await prisma.complaint.findFirst({ where: { code }, select: { id: true, code: true, status: true, rtl: true, completedAt: true, phone: true } })
    if (!complaint) return NextResponse.json({ ok: false, error: 'NOT_FOUND' }, { status: 404 })

    const status = (body.statusOverride || complaint.status) as string
    const rtl = (body.rtlOverride ?? complaint.rtl) as string | null
    const tanggalSelesai = body.tanggalSelesaiOverride || complaint.completedAt

    const baseUrl = process.env.APP_BASE_URL?.replace(/\/$/, '')
    const trackLink = baseUrl ? `${baseUrl}/status?ref=${complaint.code}` : ''
    const footer = process.env.WA_MESSAGE_FOOTER || 'Jangan balas pesan ini.'

    const lines: string[] = []
    lines.push(`*Update Pengaduan* (${complaint.code})`)
    lines.push('')
    lines.push(`*Status:* ${humanStatus(status)}`)
    if (status === 'PROSES' && rtl) lines.push(`*RTL:* ${rtl.trim().slice(0, 300)}`)
    if (status === 'SELESAI') {
      if (rtl) lines.push(`*Ringkasan:* ${rtl.trim().slice(0, 300)}`)
      if (tanggalSelesai) {
        const d = new Date(tanggalSelesai)
        lines.push(`Selesai pada: ${d.getDate().toString().padStart(2,'0')}/${(d.getMonth()+1).toString().padStart(2,'0')}/${d.getFullYear()}`)
      }
    }
    if (trackLink) {
      lines.push('')
      lines.push('Lacak status:')
      lines.push(trackLink)
    }
    lines.push('')
    lines.push(footer)
    const message = lines.join('\n')

    let sendResp: any = { skipped: true }
    let sent = false
    if (process.env.FONNTE_TOKEN) {
      const target = normalizePhone(complaint.phone)
      if (target) {
        sendResp = await sendWhatsAppMessage(target, message)
        sent = isFonnteSuccess(sendResp)
      } else {
        sendResp = { error: 'NO_PHONE' }
      }
    } else {
      sendResp = { error: 'FONNTE_TOKEN_MISSING' }
    }

    try {
      await prisma.notification.create({
        data: {
          complaintId: complaint.id,
          channel: 'WHATSAPP',
          status: sent ? 'SUCCESS' : 'FAILED',
          detail: JSON.stringify({ kind: 'STATUS_UPDATE', status, message, response: sendResp }).slice(0, 950)
        }
      })
    } catch (e) {
      console.error('Gagal mencatat notification', e)
    }

    if (!sent) {
      return NextResponse.json({ ok: false, sent, provider: sendResp }, { status: 500 })
    }
    return NextResponse.json({ ok: true, sent })
  } catch (e) {
    console.error('POST /api/pengaduan/[code]/notify error', e)
    return NextResponse.json({ ok: false, error: 'SERVER_ERROR' }, { status: 500 })
  }
}
