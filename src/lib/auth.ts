import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import prisma from "@/lib/prisma";

/**
 * NextAuth.js configuration.
 *
 * Uses JWT strategy (no DB sessions) for simplicity.
 * The Credentials provider authenticates users via email + password.
 */
export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Sign in with Email or Username",
      credentials: {
        identifier: {
          label: "Email or Username",
          type: "text",
          placeholder: "example@school.edu or student_1",
        },
        password: {
          label: "Password",
          type: "password",
        },
      },
      async authorize(credentials) {
        if (!credentials?.identifier || !credentials?.password) {
          throw new Error("Email/Username and password are required.");
        }

        const searchIdentifier = credentials.identifier.toLowerCase().trim();
        
        const user = await prisma.user.findFirst({
          where: {
            OR: [
              { email: { equals: searchIdentifier, mode: "insensitive" } },
              { username: { equals: searchIdentifier, mode: "insensitive" } },
            ],
          },
        });

        if (!user) {
          throw new Error("No user found with these details.");
        }

        if (!user.password) {
          throw new Error(
            "This account was created with a different method. Please use that method to sign in."
          );
        }

        const isPasswordValid = await compare(
          credentials.password,
          user.password
        );

        if (!isPasswordValid) {
          throw new Error("Incorrect password. Please try again.");
        }

        // Check soft-delete
        if (user.deletedAt) {
          throw new Error("This account has been disabled.");
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          role: user.role,
          language: user.language,
        };
      },
    }),
  ],

  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },

  pages: {
    signIn: "/auth/login",
    error: "/auth/login",
  },

  callbacks: {
    async jwt({ token, user }) {
      // On initial sign-in, persist user data into the JWT
      if (user) {
        token.id = user.id;
        token.role = (user as { role?: string }).role ?? "teacher";
        token.language = (user as { language?: string }).language ?? "en";
      }
      return token;
    },

    async session({ session, token }) {
      // Expose user id and role on the client-side session
      if (session.user) {
        (session.user as { id: string }).id = token.id as string;
        (session.user as { role: string }).role = token.role as string;
        (session.user as { language: string }).language = token.language as string;
      }
      return session;
    },

    async signIn({ user }) {
      // Block deleted users from signing in
      if (!user?.id) return false;

      const dbUser = await prisma.user.findUnique({
        where: { id: user.id },
        select: { deletedAt: true },
      });

      if (dbUser?.deletedAt) return false;
      return true;
    },
  },

  secret: process.env.NEXTAUTH_SECRET,

  debug: process.env.NODE_ENV === "development",
};

/**
 * Extend the default NextAuth type declarations to include custom fields.
 */
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name: string;
      email: string;
      image?: string | null;
      role: string;
      language: string;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: string;
    language: string;
  }
}
