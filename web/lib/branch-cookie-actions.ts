"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { BRANCH_COOKIE } from "./branch-context";

const ONE_YEAR = 60 * 60 * 24 * 365;

/**
 * Persist the active branch to the request cookie (so Server Components on
 * subsequent navigation can read it) and trigger a revalidate of the path
 * the operator was on so its server-rendered slices refresh.
 *
 * Pass `null` for "All branches".
 */
export async function setActiveBranch(branchId: string | null, path?: string) {
  const c = await cookies();
  c.set({
    name: BRANCH_COOKIE,
    value: branchId ?? "all",
    path: "/",
    maxAge: ONE_YEAR,
    sameSite: "lax",
  });
  // Revalidate the current path so server-rendered lists/dashboards refresh.
  if (path) revalidatePath(path);
  else {
    revalidatePath("/");
    revalidatePath("/orders");
    revalidatePath("/customers");
    revalidatePath("/inventory");
    revalidatePath("/shopping");
    revalidatePath("/bakes");
    revalidatePath("/reviews");
    revalidatePath("/books");
    revalidatePath("/invoices");
  }
}
