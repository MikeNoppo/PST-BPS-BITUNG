import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'

export function auth() {
  return getServerSession(authOptions)
}

export type SessionWithRole = Awaited<ReturnType<typeof auth>> & {
  user?: { name?: string | null; email?: string | null; role?: string }
}
