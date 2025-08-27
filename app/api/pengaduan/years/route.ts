import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { apiError } from '@/lib/api-response'

// GET /api/pengaduan/years -> list distinct years descending where complaints exist
export async function GET() {
  try {
    // Query only createdAt (indexed) to reduce payload
    const rows = await prisma.complaint.findMany({
      select: { createdAt: true },
      orderBy: { createdAt: 'desc' },
    })
    const years = Array.from(new Set(rows.map(r => r.createdAt.getFullYear().toString()))).sort((a,b)=> parseInt(b)-parseInt(a))
  return NextResponse.json({ data: { years } })
  } catch (e) {
    console.error('GET /api/pengaduan/years error', e)
  return apiError({ code: 'SERVER_ERROR', message: 'Terjadi kesalahan server', status: 500 })
  }
}
