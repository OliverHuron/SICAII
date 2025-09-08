import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import { query } from '@/lib/db'
import bcrypt from 'bcryptjs'

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        console.log('🔐 Intento de login:', credentials?.email)
        
        if (!credentials?.email || !credentials?.password) {
          console.log('❌ Credenciales vacías')
          return null
        }

        try {
          console.log('🔍 Buscando usuario en la base de datos...')
          const result = await query(
            'SELECT id, username, email, password, role, first_name, last_name, is_active FROM users WHERE email = $1',
            [credentials.email]
          )

          console.log('📊 Resultado de la consulta:', {
            rowCount: result.rows.length,
            user: result.rows[0] ? {
              id: result.rows[0].id,
              email: result.rows[0].email,
              role: result.rows[0].role,
              is_active: result.rows[0].is_active
            } : null
          })

          const user = result.rows[0]

          if (!user) {
            console.log('❌ Usuario no encontrado')
            return null
          }

          if (!user.is_active) {
            console.log('❌ Usuario no está activo')
            return null
          }

          console.log('🔑 Verificando contraseña...')
          const isPasswordValid = await bcrypt.compare(
            credentials.password as string,
            user.password
          )

          console.log('🔑 Contraseña válida:', isPasswordValid)

          if (!isPasswordValid) {
            console.log('❌ Contraseña incorrecta')
            return null
          }

          console.log('✅ Login exitoso')
          return {
            id: user.id.toString(),
            email: user.email,
            name: `${user.first_name} ${user.last_name}`,
            username: user.username,
            role: user.role,
          }
        } catch (error) {
          console.error('❌ Error en autenticación:', error)
          return null
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role
        token.username = user.username
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.role = token.role as string
        session.user.username = token.username as string
      }
      return session
    }
  },
  pages: {
    signIn: '/login',
  },
})
