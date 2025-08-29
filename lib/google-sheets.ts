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

  // Get spreadsheet metadata
  const meta = await sheets.spreadsheets.get({ spreadsheetId })
  const sheet = meta.data.sheets?.find((s: any) => s.properties?.title === tabTitle)
  let sheetId = sheet?.properties?.sheetId
  if (!sheet) {
    // create sheet
    const addRes = await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: {
        requests: [{ addSheet: { properties: { title: tabTitle } } }]
      }
    })
    sheetId = addRes.data.replies?.[0]?.addSheet?.properties?.sheetId
  } else {
    // clear existing content
    await sheets.spreadsheets.values.clear({ spreadsheetId, range: `${tabTitle}!A:Z` })
  }

  // Build values
  const header = ['No.', 'Bulan', ...headerMeta.classificationNumbers, 'Dalam Proses', 'Selesai']
  const values = [header]
  rows.forEach(r => {
    values.push([
      String(r.no),
      r.bulan,
      ...r.counts.map(c => String(c || 0)),
      String(r.proses || 0),
      String(r.selesai || 0),
    ])
  })
  values.push([])
  classificationFootnotes.forEach(f => values.push([`*) ${f}`]))

  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: `${tabTitle}!A1`,
    valueInputOption: 'RAW',
    requestBody: { values }
  })

  return { tabTitle, sheetId }
}
