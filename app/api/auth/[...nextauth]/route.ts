import NextAuth, { type NextAuthOptions } from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

// Basic in-memory rate limiter (per-identifier) - reset on server restart.
const loginAttempts = new Map<string, { count: number; first: number }>()
const MAX_ATTEMPTS = 5
const WINDOW_MS = 5 * 60 * 1000 // 5 minutes

async function checkRateLimit(identifier: string) {
  const now = Date.now()
  const rec = loginAttempts.get(identifier)
  if (!rec) {
    loginAttempts.set(identifier, { count: 1, first: now })
    return true
  }
  if (now - rec.first > WINDOW_MS) {
    loginAttempts.set(identifier, { count: 1, first: now })
    return true
  }
  rec.count += 1
  if (rec.count > MAX_ATTEMPTS) return false
  return true
}

// Pre-compute a dummy hash to normalize timing when user not found.
const DUMMY_HASH = bcrypt.hashSync('dummy_password_value', 10)

export const authOptions: NextAuthOptions = {
  session: { strategy: 'jwt' },
  providers: [
    Credentials({
      name: 'Credentials',
      credentials: {
        identifier: { label: 'Username', type: 'text' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.identifier || !credentials.password) return null
        const ident = credentials.identifier.toLowerCase().trim()

        // Rate limit check
        const allowed = await checkRateLimit(ident)
        if (!allowed) return null

        const admin = await prisma.adminUser.findFirst({
          where: { username: ident }
        })
        if (!admin || !admin.passwordHash) {
          // Dummy compare to equalize timing
            await bcrypt.compare(credentials.password, DUMMY_HASH)
          return null
        }
        const valid = await bcrypt.compare(credentials.password, admin.passwordHash)
        if (!valid) return null
        return { id: admin.id, name: admin.username || 'Admin', role: admin.role }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) token.role = (user as any).role
      return token
    },
    async session({ session, token }) {
      if (session.user) (session.user as any).role = token.role
      return session
    }
  }
}

const handler = NextAuth(authOptions)
export { handler as GET, handler as POST }
