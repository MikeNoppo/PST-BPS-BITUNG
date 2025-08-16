// Fonnte WhatsApp sending helper
// POST https://api.fonnte.com/send
// Requires env FONNTE_TOKEN

export interface FonnteSendOptions {
  url?: string
  filename?: string
  schedule?: number
  delay?: string
  countryCode?: string
}

export interface FonnteResponseSuccess {
  detail: string
  id: string[]
  process: string
  requestid: number
  status: true
  target: string[]
  [k: string]: any
}

export interface FonnteResponseError {
  status: false
  reason: string
  requestid?: number
  [k: string]: any
}

export type FonnteResponse = FonnteResponseSuccess | FonnteResponseError

export function normalizePhone(raw: string): string {
  let digits = raw.replace(/[^0-9]/g, '')
  if (!digits) return ''
  if (digits.startsWith('0')) digits = '62' + digits.slice(1)
  else if (digits.startsWith('8')) digits = '62' + digits
  return digits
}

export async function sendWhatsAppMessage(targets: string | string[], message: string, opts: FonnteSendOptions = {}): Promise<FonnteResponse | { error: string; detail?: string }> {
  const token = process.env.FONNTE_TOKEN
  if (!token) return { error: 'FONNTE_TOKEN_MISSING' }
  const list = Array.isArray(targets) ? targets : [targets]
  const cleaned = list.map(normalizePhone).filter(Boolean)
  if (!cleaned.length) return { error: 'NO_VALID_TARGET' }
  try {
    const fd = new FormData()
    fd.append('target', cleaned.join(','))
    fd.append('message', message)
    if (opts.url) fd.append('url', opts.url)
    if (opts.filename) fd.append('filename', opts.filename)
    if (opts.schedule) fd.append('schedule', String(opts.schedule))
    if (opts.delay) fd.append('delay', opts.delay)
    fd.append('countryCode', opts.countryCode || '62')
    const res = await fetch('https://api.fonnte.com/send', {
      method: 'POST',
      headers: { Authorization: token },
      body: fd,
    })
    const data = await res.json().catch(() => ({}))
    return data as FonnteResponse
  } catch (e: any) {
    return { error: 'SEND_FAILED', detail: e?.message }
  }
}

export function isFonnteSuccess(resp: any): resp is FonnteResponseSuccess {
  return resp && typeof resp === 'object' && resp.status === true
}
