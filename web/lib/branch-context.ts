// Global "active branch" context. Persisted in a non-HttpOnly cookie so
// Server Components can read it via cookies() — and mirrored to localStorage
// from the client so the badge stays in sync after a tab restart.

import { cookies } from "next/headers";

export const BRANCH_COOKIE = "tieredcake-branch";

/**
 * Returns the active branch id from the request cookie, or null if "All
 * branches" is selected. Use this at the top of any Server Component that
 * should scope its data to one branch.
 */
export async function getActiveBranchId(): Promise<string | null> {
  const c = await cookies();
  const v = c.get(BRANCH_COOKIE)?.value;
  if (!v || v === "all") return null;
  return v;
}
