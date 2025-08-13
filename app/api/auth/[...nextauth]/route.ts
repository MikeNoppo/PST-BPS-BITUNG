import NextAuth, { type NextAuthOptions } from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

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
        const ident = credentials.identifier.toLowerCase()
        const admin = await prisma.adminUser.findFirst({
          where: { username: ident }
        })
        if (!admin || !admin.passwordHash) return null
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
