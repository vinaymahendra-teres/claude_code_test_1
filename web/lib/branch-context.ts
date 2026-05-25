// Global "active branch" context. Persisted in a non-HttpOnly cookie so
// Server Components can read it via cookies() — and mirrored to localStorage
// from the client so the badge stays in sync after a tab restart.
//
// When no cookie is present we fall back to the signed-in operator's home
// branch (branches.operator_id matches the user) — so Swetha defaults to
// Provincia and Shreya to Eterna on first visit. Explicit "All branches"
// is encoded by the literal cookie value "all".

import { cookies } from "next/headers";
import { auth } from "@/auth";
import { createClient } from "@supabase/supabase-js";

export const BRANCH_COOKIE = "tieredcake-branch";

function adminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

/**
 * Resolves the effective branch the operator should see right now.
 * - cookie = "all"        → null (no filter)
 * - cookie = branch id    → that branch
 * - cookie missing/blank  → operator's default branch (via operator_id), or
 *                            null if the operator isn't tied to a branch.
 */
export async function getActiveBranchId(): Promise<string | null> {
  const c = await cookies();
  const v = c.get(BRANCH_COOKIE)?.value;
  if (v === "all") return null;
  if (v) return v;

  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return null;

  const sb = adminClient();
  if (!sb) return null;
  const { data } = await sb
    .from("branches")
    .select("id")
    .eq("operator_id", userId)
    .eq("is_active", true)
    .order("sort_order")
    .limit(1)
    .maybeSingle();
  return data?.id ?? null;
}
