import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { compare } from "bcryptjs";
import prisma from "@/lib/prisma";

/**
 * NextAuth.js configuration.
 *
 * Uses JWT strategy for simplicity.
 * Includes Google OAuth and Credentials providers.
 */
export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),
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
            "This account was created with Google or another provider. Please sign in with Google."
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
    async jwt({ token, user, account }) {
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

    async signIn({ user, account }) {
      if (!user) return false;

      // Handle OAuth (Google) user provisioning
      if (account?.provider === "google") {
        if (!user.email) return false;

        let dbUser = await prisma.user.findUnique({
          where: { email: user.email },
        });

        if (!dbUser) {
          // Create new teacher user for Google Sign-In
          dbUser = await prisma.user.create({
            data: {
              name: user.name || "Google User",
              email: user.email,
              image: user.image,
              role: "teacher",
              language: "en",
            },
          });
        }

        if (dbUser.deletedAt) return false;

        user.id = dbUser.id;
        (user as any).role = dbUser.role;
        (user as any).language = dbUser.language;
        return true;
      }

      // Check soft-delete for Credentials provider
      if (!user.id) return false;
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
