import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { humanizeClassification, humanizeStatus } from '@/lib/humanize'
import { upsertAnnualSheet, CHAIRPERSON_NAME } from '@/lib/google-sheets'
import { apiError } from '@/lib/api-response'

// POST /api/export/sheets/annual { year: '2025' }
export async function POST(req: Request) {
  try {
    const json = await req.json().catch(()=> ({}))
    const year = String(json.year || '')
    if (!/^\d{4}$/.test(year)) {
      return apiError({ code: 'INVALID_YEAR', message: 'Tahun tidak valid', status: 400 })
    }
    const spreadsheetEnv = process.env.GOOGLE_SHEETS_YEARLY_SPREADSHEET_ID || ''
    if (!spreadsheetEnv) {
      return apiError({ code: 'NO_SPREADSHEET', message: 'Spreadsheet ID belum diset', status: 500 })
    }
    const spreadsheetId = spreadsheetEnv.split('/d/')[1]?.split('/')[0] || spreadsheetEnv

    // Ambil semua complaint tahun itu
    const start = new Date(Date.UTC(parseInt(year,10),0,1))
    const end = new Date(Date.UTC(parseInt(year,10)+1,0,1))
    const complaints = await prisma.complaint.findMany({
      where: { createdAt: { gte: start, lt: end } },
      orderBy: { createdAt: 'desc' },
      select: { createdAt: true, classification: true, status: true }
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

    const rows = Array.from({ length: 12 }, (_, i) => ({
      no: i+1,
      bulan: new Date(2000, i, 1).toLocaleDateString('id-ID', { month: 'long' }),
      counts: Array(order.length).fill(0) as number[],
      proses: 0,
      selesai: 0,
    }))

    complaints.forEach(c => {
      const m = c.createdAt.getUTCMonth()
      const idx = rows[m]
      const klasHuman = humanizeClassification(c.classification as any).toUpperCase()
      const pos = order.findIndex(o => klasHuman.includes(o.split(' / ')[0]))
      if (pos >= 0) idx.counts[pos] += 1
      const statusHuman = humanizeStatus(c.status as any)
      if (statusHuman === 'Proses') idx.proses += 1
      if (statusHuman === 'Selesai') idx.selesai += 1
    })

    const classificationFootnotes = order.map((o,i)=> `${i+1}. ${o[0] + o.slice(1).toLowerCase()}`)

  const { tabTitle, sheetId } = await upsertAnnualSheet({
      year,
      spreadsheetId,
      headerMeta: { classificationNumbers: order.map((_,i)=> String(i+1)) },
      rows,
      classificationFootnotes,
      signatureLines: [
        `Bitung,      ${year}`,
        'Tim Penanganan Pengaduan',
        'Ketua,',
        '',
        '',
        '',
        CHAIRPERSON_NAME,
      ],
    })

  const url = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit#gid=${sheetId ?? 0}`

    return NextResponse.json({ success: true, sheet: { tab: tabTitle, url } })
  } catch (e: any) {
    console.error('POST /api/export/sheets/annual error', e)
    return apiError({ code: 'EXPORT_ERROR', message: 'Gagal export Sheets', status: 500 })
  }
}
