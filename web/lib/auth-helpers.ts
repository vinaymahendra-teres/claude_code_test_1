/**
 * Server-side authorization guards. Import in every Server Action; never
 * trust the UI alone.
 *
 *   const session = await requireAuth();           // throws if no session
 *   await requireRole("admin");                    // throws if role < admin
 */

import { auth, hasRole, type Role } from "@/auth";

export class AuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AuthError";
  }
}

export async function requireAuth() {
  const session = await auth();
  if (!session?.user) {
    throw new AuthError("Not signed in");
  }
  return session;
}

export async function requireRole(min: Role) {
  const session = await requireAuth();
  if (!hasRole(session.user.role, min)) {
    throw new AuthError(`Requires ${min} role`);
  }
  return session;
}
