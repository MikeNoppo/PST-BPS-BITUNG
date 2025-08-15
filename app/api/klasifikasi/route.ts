import { NextResponse } from 'next/server'

// Static mapping of enum values to human-friendly labels (could be generated from Prisma enum in future)
const klasifikasi = [
  { value: 'PERSYARATAN_LAYANAN', label: 'Persyaratan Layanan' },
  { value: 'PROSEDUR_LAYANAN', label: 'Prosedur Layanan' },
  { value: 'WAKTU_PELAYANAN', label: 'Waktu Pelayanan' },
  { value: 'BIAYA_TARIF_PELAYANAN', label: 'Biaya/Tarif Pelayanan' },
  { value: 'PRODUK_PELAYANAN', label: 'Produk Pelayanan' },
  { value: 'KOMPETENSI_PELAKSANA_PELAYANAN', label: 'Kompetensi Pelaksana Pelayanan' },
  { value: 'PERILAKU_PETUGAS_PELAYANAN', label: 'Perilaku Petugas Pelayanan' },
  { value: 'SARANA_DAN_PRASARANA', label: 'Sarana dan Prasarana' },
]

export async function GET() {
  return NextResponse.json({ data: klasifikasi })
}
