import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { db } from "./db";
import { matchmakers } from "./schema";
import { eq } from "drizzle-orm";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const [matchmaker] = await db
          .select()
          .from(matchmakers)
          .where(eq(matchmakers.email, credentials.email))
          .limit(1);

        if (!matchmaker) return null;

        const isValid = await bcrypt.compare(
          credentials.password,
          matchmaker.passwordHash
        );
        if (!isValid) return null;

        return {
          id: String(matchmaker.id),
          email: matchmaker.email,
          name: matchmaker.name,
        };
      },
    }),
  ],
  session: { strategy: "jwt" },
  pages: { signIn: "/" },
  callbacks: {
    async jwt({ token, user }) {
      if (user) token.id = user.id;
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        (session.user as { id?: string }).id = token.id as string;
      }
      return session;
    },
  },
};
