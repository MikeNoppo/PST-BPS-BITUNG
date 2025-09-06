import { google } from 'googleapis'

const SCOPES = ['https://www.googleapis.com/auth/spreadsheets']

function getAuth() {
  const email = process.env.GOOGLE_SA_EMAIL
  const key = (process.env.GOOGLE_SA_KEY || '').replace(/\\n/g, '\n')
  if (!email || !key) throw new Error('Google service account env missing')
  return new google.auth.JWT({ email, key, scopes: SCOPES })
}
 

export interface AnnualSummaryRow {
  no: number
  bulan: string
  counts: number[]
  proses: number
  selesai: number
}

// ---------- Monthly Report Interfaces ----------
export interface MonthlyComplaintRowInput {
  no: number
  date: Date
  reporterName: string
  email: string
  phone: string
  description: string
  classification: string
  rtl: string
  status: string
  completedAt?: Date | null
}

export async function upsertAnnualSheet({
  year,
  spreadsheetId,
  headerMeta,
  rows,
  classificationFootnotes,
}: {
  year: string
  spreadsheetId: string
  headerMeta: { classificationNumbers: string[] }
  rows: AnnualSummaryRow[]
  classificationFootnotes: string[]
}) {
  const auth = getAuth()
  const sheets = google.sheets({ version: 'v4', auth })
  const tabTitle = `LAPORAN_${year}`
  const TEMPLATE_TITLE = 'TEMPLATE_LAPORAN'

  // Get spreadsheet metadata (template + possible existing target)
  const meta = await sheets.spreadsheets.get({ spreadsheetId })
  const existing = meta.data.sheets?.find((s: any) => s.properties?.title === tabTitle)
  let sheetId = existing?.properties?.sheetId as number | undefined

  if (!existing) {
    const templateSheet = meta.data.sheets?.find((s: any) => s.properties?.title === TEMPLATE_TITLE)
    if (!templateSheet) {
      throw new Error(`Template sheet '${TEMPLATE_TITLE}' tidak ditemukan`)
    }
    const duplicateRes = await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: {
        requests: [
          {
            duplicateSheet: {
              sourceSheetId: templateSheet.properties?.sheetId,
              newSheetName: tabTitle,
            }
          }
        ]
      }
    })
  const dupId = duplicateRes.data.replies?.[0]?.duplicateSheet?.properties?.sheetId
  sheetId = (dupId ?? undefined) as number | undefined
  }

  // Build only the data region (classification + status) WITHOUT touching numbering & month labels (kept by template)
  // Range: C7:L18 (12 rows, 8 klasifikasi + 2 status)
  const dataValues: string[][] = rows.map(r => [
    ...r.counts.map(c => String(c || 0)),
    String(r.proses || 0),
    String(r.selesai || 0),
  ])

  // Footnotes start at A20 downward; prefix with '*) '
  const footnoteStartRow = 20
  const footnoteValues: string[][] = classificationFootnotes.map(f => [`*) ${f}`])

  // Batch update values; we intentionally do NOT clear formatting/merged cells
  await sheets.spreadsheets.values.batchUpdate({
    spreadsheetId,
    requestBody: {
      valueInputOption: 'RAW',
      data: [
        { range: `${tabTitle}!C7:L18`, values: dataValues },
        { range: `${tabTitle}!A${footnoteStartRow}:A${footnoteStartRow + footnoteValues.length - 1}`, values: footnoteValues },
      ]
    }
  })

  return { tabTitle, sheetId }
}

export async function upsertMonthlySheet({
  spreadsheetId,
  year,
  month,
  complaints,
  classificationFootnotes,
}: {
  spreadsheetId: string
  year: string
  month: string // 01-12
  complaints: MonthlyComplaintRowInput[]
  classificationFootnotes: string[]
}) {
  const auth = getAuth()
  const sheets = google.sheets({ version: 'v4', auth })
  const TEMPLATE_TITLE = 'TEMPLATE_LAPORAN'

  // Month names (Indonesian)
  const monthNames = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember']
  const monthIdx = parseInt(month, 10) - 1
  const monthName = monthNames[monthIdx]?.toUpperCase() || month.toUpperCase()
  const tabTitle = `${monthName}_${year}`

  // Fetch metadata
  const meta = await sheets.spreadsheets.get({ spreadsheetId })
  const existing = meta.data.sheets?.find((s: any) => s.properties?.title === tabTitle)
  let sheetId = existing?.properties?.sheetId as number | undefined
  if (!existing) {
    const templateSheet = meta.data.sheets?.find((s: any) => s.properties?.title === TEMPLATE_TITLE)
    if (!templateSheet) throw new Error(`Template sheet '${TEMPLATE_TITLE}' tidak ditemukan`)
    const duplicateRes = await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: { requests: [{ duplicateSheet: { sourceSheetId: templateSheet.properties?.sheetId, newSheetName: tabTitle } }] }
    })
    const dupId = duplicateRes.data.replies?.[0]?.duplicateSheet?.properties?.sheetId
    sheetId = (dupId ?? undefined) as number | undefined
  } else {
    // Clear previous data area generously (A8:S1000) without touching header layout
    await sheets.spreadsheets.values.clear({ spreadsheetId, range: `${tabTitle}!A8:S1000` })
  }

  // Classification order (same as annual) for marking 'v'
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

  function formatDate(d: Date | null | undefined) {
    if (!d) return ''
    const day = d.getUTCDate()
    const mon = d.getUTCMonth() + 1
    const yearNum = d.getUTCFullYear()
    return `${day}/${mon}/${yearNum}`
  }

  const dataStartRow = 8
  const values: string[][] = []
  complaints.forEach((c, i) => {
    const klasHuman = c.classification.toUpperCase()
    const klasIndex = order.findIndex(o => klasHuman.includes(o.split(' / ')[0])) // fallback contains
    const klasCols = Array.from({ length: 8 }, (_, k) => (k === klasIndex ? 'v' : ''))
    const statusHuman = c.status
    const dalamProses = statusHuman === 'Proses' ? 'v' : ''
    const selesai = statusHuman === 'Selesai' ? 'v' : ''
    values.push([
      String(i + 1),
      formatDate(c.date),
      c.reporterName || '',
      c.email || '',
      c.phone || '',
      c.description || '',
      ...klasCols,
      c.rtl || '',
      dalamProses,
      selesai,
      formatDate(c.completedAt || null),
      'Notifikasi sudah dikirimkan ke email/WA pengguna',
    ])
  })

  // Footnotes placement: one blank row after data
  const blankRowIndex = dataStartRow + values.length
  const footnoteStart = blankRowIndex + 1
  const footnoteValues: string[][] = classificationFootnotes.map(f => [`*) ${f}`])

  // Batch update: data + footnotes
  const batchData: any[] = []
  if (values.length) {
    batchData.push({ range: `${tabTitle}!A${dataStartRow}:S${dataStartRow + values.length - 1}`, values })
  }
  // Write a blank row (optional) then footnotes in column A
  if (footnoteValues.length) {
    batchData.push({ range: `${tabTitle}!A${footnoteStart}:A${footnoteStart + footnoteValues.length - 1}`, values: footnoteValues })
  }

  if (batchData.length) {
    await sheets.spreadsheets.values.batchUpdate({
      spreadsheetId,
      requestBody: { valueInputOption: 'RAW', data: batchData }
    })
  }

  // Ensure new rows keep table formatting/borders by copying the format of the first data row (A8:S8)
  // to the entire written data range. This avoids rows appearing "outside" the table.
  if (sheetId !== undefined && values.length > 0) {
    const startRowIndex = dataStartRow - 1 // zero-based index for row 8 -> 7
    const endRowIndex = startRowIndex + values.length // exclusive
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: {
        requests: [
          {
            copyPaste: {
              source: {
                sheetId,
                startRowIndex,
                endRowIndex: startRowIndex + 1, // only the first data row
                startColumnIndex: 0, // A
                endColumnIndex: 19, // up to S (exclusive)
              },
              destination: {
                sheetId,
                startRowIndex,
                endRowIndex, // all data rows
                startColumnIndex: 0,
                endColumnIndex: 19,
              },
              pasteType: 'PASTE_FORMAT',
              pasteOrientation: 'NORMAL',
            }
          },
          {
            repeatCell: {
              range: { sheetId, startRowIndex, endRowIndex, startColumnIndex: 15, endColumnIndex: 16 },
              cell: { userEnteredFormat: { horizontalAlignment: 'CENTER' } },
              fields: 'userEnteredFormat.horizontalAlignment'
            }
          },
          {
            repeatCell: {
              range: { sheetId, startRowIndex, endRowIndex, startColumnIndex: 16, endColumnIndex: 17 },
              cell: { userEnteredFormat: { horizontalAlignment: 'CENTER' } },
              fields: 'userEnteredFormat.horizontalAlignment'
            }
          },
          {
            repeatCell: {
              range: { sheetId, startRowIndex, endRowIndex, startColumnIndex: 17, endColumnIndex: 18 },
              cell: { userEnteredFormat: { horizontalAlignment: 'CENTER' } },
              fields: 'userEnteredFormat.horizontalAlignment'
            }
          },
          // Wrap text in column F (Ringkasan Pengaduan)
          {
            repeatCell: {
              range: { sheetId, startRowIndex, endRowIndex, startColumnIndex: 5, endColumnIndex: 6 },
              cell: { userEnteredFormat: { wrapStrategy: 'WRAP' } },
              fields: 'userEnteredFormat.wrapStrategy'
            }
          },
          // Wrap text in column S (Keterangan)
          {
            repeatCell: {
              range: { sheetId, startRowIndex, endRowIndex, startColumnIndex: 18, endColumnIndex: 19 },
              cell: { userEnteredFormat: { wrapStrategy: 'WRAP' } },
              fields: 'userEnteredFormat.wrapStrategy'
            }
          },
          // Center align all data cells in table A..S
          {
            repeatCell: {
              range: { sheetId, startRowIndex, endRowIndex, startColumnIndex: 0, endColumnIndex: 19 },
              cell: { userEnteredFormat: { horizontalAlignment: 'CENTER', verticalAlignment: 'MIDDLE' } },
              fields: 'userEnteredFormat.horizontalAlignment,userEnteredFormat.verticalAlignment'
            }
          }
        ]
      }
    })
  }

  return { tabTitle, sheetId }
}
