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
