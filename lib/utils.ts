import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Build an absolute base URL usable during server-side rendering or static generation.
// Order of precedence:
// 1. APP_BASE_URL (explicit, with protocol)
// 2. VERCEL_URL (auto provided by Vercel – add https://)
// 3. http://localhost:3000 fallback for dev / build previews.
export function getBaseUrl() {
  if (process.env.APP_BASE_URL) {
    return process.env.APP_BASE_URL.replace(/\/$/, '')
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`
  }
  return 'http://localhost:3000'
}
