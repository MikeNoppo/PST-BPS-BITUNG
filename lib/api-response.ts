import { NextResponse } from 'next/server'

export interface ApiErrorOptions {
  code: string
  message: string
  status?: number
  details?: any
}

export function apiError({ code, message, status = 400, details }: ApiErrorOptions) {
  const payload: any = { error: { code, message } }
  if (details !== undefined) payload.error.details = details
  return NextResponse.json(payload, { status })
}

// Simple success wrapper (optional use)
export function apiOk<T>(data: T, status = 200) {
  return NextResponse.json({ data }, { status })
}
