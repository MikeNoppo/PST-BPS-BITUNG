import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/pengaduan/years -> list distinct years descending where complaints exist
export async function GET() {
  try {
    // Query only createdAt (indexed) to reduce payload
    const rows = await prisma.complaint.findMany({
      select: { createdAt: true },
      orderBy: { createdAt: 'desc' },
    })
    const years = Array.from(new Set(rows.map(r => r.createdAt.getFullYear().toString()))).sort((a,b)=> parseInt(b)-parseInt(a))
    return NextResponse.json({ years })
  } catch (e) {
    console.error('GET /api/pengaduan/years error', e)
    return NextResponse.json({ error: 'SERVER_ERROR' }, { status: 500 })
  }
}
