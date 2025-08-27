// Centralized humanization helpers for classification & status values.
// Avoid duplication across multiple API route handlers.

export const CLASSIFICATION_LABEL: Record<string, string> = {
  PERSYARATAN_LAYANAN: 'Persyaratan Layanan',
  PROSEDUR_LAYANAN: 'Prosedur Layanan',
  WAKTU_PELAYANAN: 'Waktu Pelayanan',
  BIAYA_TARIF_PELAYANAN: 'Biaya/Tarif Pelayanan',
  PRODUK_PELAYANAN: 'Produk Pelayanan',
  KOMPETENSI_PELAKSANA_PELAYANAN: 'Kompetensi Pelaksana Pelayanan',
  PERILAKU_PETUGAS_PELAYANAN: 'Perilaku Petugas Pelayanan',
  SARANA_DAN_PRASARANA: 'Sarana dan Prasarana'
}

export const STATUS_LABEL: Record<string, string> = {
  BARU: 'Baru',
  PROSES: 'Proses',
  SELESAI: 'Selesai'
}

export function humanizeClassification(value: string) {
  return CLASSIFICATION_LABEL[value] || value
}

export function humanizeStatus(value: string) {
  return STATUS_LABEL[value] || value
}
