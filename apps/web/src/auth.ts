import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import MicrosoftEntraID from "next-auth/providers/microsoft-entra-id"
import bcrypt from "bcryptjs"

declare module "next-auth" {
  interface User { role?: string; schoolId?: string }
  interface Session { user: { id: string; role: string; email: string; name: string; schoolId?: string; image?: string | null } }
}
declare module "@auth/core/jwt" {
  interface JWT { id?: string; role?: string; schoolId?: string }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null
        const { default: prisma } = await import("@/lib/prisma")
        const user = await prisma.user.findUnique({ where: { email: credentials.email as string } })
        if (!user) return null
        const valid = await bcrypt.compare(credentials.password as string, user.password)
        if (!valid) return null
        return { id: user.id, email: user.email, name: user.name, role: user.role, schoolId: user.schoolId }
      },
    }),
    MicrosoftEntraID({
      clientId: process.env.AUTH_MICROSOFT_ENTRA_ID_ID!,
      clientSecret: process.env.AUTH_MICROSOFT_ENTRA_ID_SECRET!,
      issuer: `https://login.microsoftonline.com/${process.env.AUTH_MICROSOFT_ENTRA_ID_TENANT_ID || "common"}/v2.0`,
      authorization: {
        params: { scope: "openid profile email User.Read" },
      },
    }),
  ],
  callbacks: {
    async signIn({ account, profile }) {
      if (account?.provider === "microsoft-entra-id") {
        const email = profile?.email as string | undefined
        if (!email || !email.endsWith("@binus.ac.id")) {
          return "/login?error=Only @binus.ac.id accounts are allowed"
        }
        const { default: prisma } = await import("@/lib/prisma")
        const existing = await prisma.user.findUnique({ where: { email } })
        if (!existing) {
          const school = await prisma.school.findFirst()
          if (!school) return false
          await prisma.user.create({
            data: {
              email,
              name: (profile?.name as string) || email.split("@")[0],
              password: "", // ponytail: Microsoft SSO users don't use password
              role: "SMA",
              schoolId: school.id,
            },
          })
        }
      }
      return true
    },
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id ?? token.id
        token.role = user.role ?? token.role
        token.schoolId = user.schoolId ?? token.schoolId
      }
      // ponytail: Microsoft SSO users need role/schoolId fetched from DB
      if (account?.provider === "microsoft-entra-id" && !token.role) {
        const email = token.email || user?.email
        if (email) {
          const { default: prisma } = await import("@/lib/prisma")
          const dbUser = await prisma.user.findUnique({ where: { email: email as string } })
          if (dbUser) {
            token.id = dbUser.id
            token.role = dbUser.role
            token.schoolId = dbUser.schoolId
          }
        }
      }
      return token
    },
    session({ session, token }) {
      if (token.id) session.user.id = token.id
      if (token.role) session.user.role = token.role
      if (token.schoolId) session.user.schoolId = token.schoolId
      return session
    },
  },
})
