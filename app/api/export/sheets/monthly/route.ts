import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { humanizeClassification, humanizeStatus } from '@/lib/humanize'
import { upsertMonthlySheet } from '@/lib/google-sheets'
import { apiError } from '@/lib/api-response'

// POST /api/export/sheets/monthly { year: '2025', month: '07' }
export async function POST(req: Request) {
  try {
    const json = await req.json().catch(() => ({}))
    const year = String(json.year || '')
    const month = String(json.month || '')
    if (!/^\d{4}$/.test(year)) {
      return apiError({ code: 'INVALID_YEAR', message: 'Tahun tidak valid', status: 400 })
    }
    if (!/^(0[1-9]|1[0-2])$/.test(month)) {
      return apiError({ code: 'INVALID_MONTH', message: 'Bulan tidak valid', status: 400 })
    }

    const spreadsheetEnv = process.env.GOOGLE_SHEETS_MONTHLY_SPREADSHEET_ID || ''
    if (!spreadsheetEnv) {
      return apiError({ code: 'NO_SPREADSHEET', message: 'Spreadsheet ID bulanan belum diset', status: 500 })
    }
    const spreadsheetId = spreadsheetEnv.split('/d/')[1]?.split('/')[0] || spreadsheetEnv

    const start = new Date(Date.UTC(parseInt(year, 10), parseInt(month, 10) - 1, 1))
    const end = new Date(Date.UTC(parseInt(year, 10), parseInt(month, 10), 1))

    const complaints = await prisma.complaint.findMany({
      where: { createdAt: { gte: start, lt: end } },
      orderBy: { createdAt: 'asc' },
      select: { code: true, createdAt: true, classification: true, status: true, reporterName: true, email: true, phone: true, description: true, rtl: true, completedAt: true }
    })

    const order = [
      'PERSYARATAN LAYANAN',
      'PROSEDUR LAYANAN',
      'WAKTU PELAYANAN',
      'BIAYA/TARIF PELAYANAN',
      'PRODUK PELAYANAN',
      'KOMPETENSI PELAKSANA PELAYANAN',
      'PERILAKU PETUGAS PELAYANAN',
      'SARANA DAN PRASARANA'
    ]
    const classificationFootnotes = order.map((o, i) => `${i + 1}. ${o[0] + o.slice(1).toLowerCase()}`)

    const { tabTitle, sheetId } = await upsertMonthlySheet({
      spreadsheetId,
      year,
      month,
      complaints: complaints.map((c, i) => ({
        no: i + 1,
        date: c.createdAt,
        reporterName: c.reporterName || '',
        email: c.email || '',
        phone: c.phone || '',
        description: c.description || '',
        classification: humanizeClassification(c.classification as any),
        rtl: c.rtl || '',
        status: humanizeStatus(c.status as any),
        completedAt: c.completedAt || null,
      })),
      classificationFootnotes,
    })

    const url = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit#gid=${sheetId ?? 0}`
    return NextResponse.json({ success: true, sheet: { tab: tabTitle, url } })
  } catch (e: any) {
    console.error('POST /api/export/sheets/monthly error', e)
    return apiError({ code: 'EXPORT_ERROR', message: 'Gagal export Sheets bulanan', status: 500 })
  }
}
