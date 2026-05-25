import NextAuth, { type DefaultSession } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { createClient } from "@supabase/supabase-js";

// Role-based access control: every authenticated user carries a single role
// stored in app_users.role. The JWT mirrors it so middleware + server
// components can authorize without an extra DB round-trip.
export type Role = "admin" | "staff" | "viewer";

declare module "next-auth" {
  interface User {
    role?: Role;
  }
  interface Session {
    user: {
      id: string;
      role: Role;
    } & DefaultSession["user"];
  }
}

function adminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      "Auth requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in env.",
    );
  }
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  // JWT sessions keep the auth layer fully serverless — no session table.
  session: { strategy: "jwt" },
  trustHost: true,
  pages: {
    signIn: "/login",
  },
  providers: [
    Credentials({
      name: "Email & password",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(creds) {
        const email = String(creds?.email ?? "").trim().toLowerCase();
        const password = String(creds?.password ?? "");
        if (!email || !password) return null;

        const sb = adminClient();
        const { data: user, error } = await sb
          .from("app_users")
          .select("id, email, name, password_hash, role")
          .eq("email", email)
          .maybeSingle();
        if (error || !user) return null;

        const ok = await bcrypt.compare(password, user.password_hash);
        if (!ok) return null;

        // Best-effort: update last_login_at. Don't block the response if it fails.
        sb.from("app_users")
          .update({ last_login_at: new Date().toISOString() })
          .eq("id", user.id)
          .then(() => {});

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role as Role,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = (user as { id?: string }).id ?? token.sub;
        token.role = (user as { role?: Role }).role ?? "staff";
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = (token.id as string) ?? token.sub ?? "";
        session.user.role = (token.role as Role) ?? "staff";
      }
      return session;
    },
  },
});

export function hasRole(role: Role | undefined, required: Role): boolean {
  if (!role) return false;
  const rank: Record<Role, number> = { viewer: 1, staff: 2, admin: 3 };
  return rank[role] >= rank[required];
}
