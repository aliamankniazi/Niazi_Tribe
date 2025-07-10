import NextAuth, { AuthOptions, DefaultSession } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import api from '@/lib/api';

// Extend the built-in session types
declare module 'next-auth' {
  interface Session extends DefaultSession {
    user: {
      id: string;
      role: string;
    } & DefaultSession['user']
  }
  interface User {
    id: string;
    role: string;
  }
}

if (!process.env.NEXTAUTH_SECRET) {
  throw new Error('NEXTAUTH_SECRET must be set');
}

if (!process.env.NEXTAUTH_URL) {
  throw new Error('NEXTAUTH_URL must be set');
}

const authOptions: AuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
        name: { label: 'Name', type: 'text' },
        isRegister: { label: 'isRegister', type: 'text' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email and password are required');
        }

        const { email, password, name, isRegister } = credentials;

        try {
          if (isRegister === 'true') {
            if (!name) {
              throw new Error('Name is required for registration');
            }
            await api.post('/api/register', { 
              name, 
              email, 
              password, 
              password_confirmation: password 
            });
          }
          
          await api.post('/api/login', { email, password });
          const { data: user } = await api.get('/api/user');
          
          if (!user) {
            throw new Error('Failed to fetch user data');
          }

          return user;
        } catch (error: any) {
          console.error('Authentication error:', error.response?.data || error.message);
          throw new Error(error.response?.data?.message || 'Authentication failed');
        }
      },
    }),
  ],
  pages: {
    signIn: '/login',
    error: '/auth/error',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.name = user.name;
        token.email = user.email;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session?.user) {
        session.user.id = token.id as string;
        session.user.name = token.name;
        session.user.email = token.email;
        session.user.role = token.role;
      }
      return session;
    },
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST }; 