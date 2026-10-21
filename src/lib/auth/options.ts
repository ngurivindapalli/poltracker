import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import {
  getAuthSecret,
  getAuthUrl,
  getGoogleClientId,
  getGoogleClientSecret,
  isGoogleAuthConfigured,
} from "@/lib/auth/env";
import { upsertAppUserFromGoogle } from "@/lib/auth/users";

if (!process.env.NEXTAUTH_URL) {
  process.env.NEXTAUTH_URL = getAuthUrl();
}
if (!process.env.NEXTAUTH_SECRET && getAuthSecret()) {
  process.env.NEXTAUTH_SECRET = getAuthSecret();
}

export const authOptions: NextAuthOptions = {
  secret: getAuthSecret(),
  providers: isGoogleAuthConfigured()
    ? [
        GoogleProvider({
          clientId: getGoogleClientId() as string,
          clientSecret: getGoogleClientSecret() as string,
          authorization: {
            params: {
              prompt: "select_account",
              scope: "openid email profile",
            },
          },
        }),
      ]
    : [],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
  },
  useSecureCookies: process.env.NODE_ENV === "production",
  callbacks: {
    async signIn({ account, profile }) {
      if (account?.provider !== "google") return false;
      const googleProfile = profile as {
        sub?: string;
        email?: string;
        email_verified?: boolean;
      };
      if (!googleProfile?.sub) return false;
      try {
        await upsertAppUserFromGoogle(googleProfile);
        return true;
      } catch (error) {
        console.error("[auth] Google sign-in failed");
        return false;
      }
    },
    async jwt({ token, account, profile }) {
      if (account?.provider === "google" && profile) {
        const user = await upsertAppUserFromGoogle(
          profile as {
            sub?: string;
            email?: string;
            name?: string;
            picture?: string;
            email_verified?: boolean;
          }
        );
        token.userId = user.id;
        token.name = user.name;
        token.picture = user.image;
        token.email = user.email;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = String(token.userId || "");
        session.user.name = (token.name as string | undefined) || session.user.name;
        session.user.image =
          (token.picture as string | undefined) || session.user.image;
        session.user.email =
          (token.email as string | undefined) || session.user.email;
      }
      return session;
    },
  },
  pages: {
    signIn: "/signin",
    error: "/signin",
  },
};
