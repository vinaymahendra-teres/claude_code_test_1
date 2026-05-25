// Shared types + server-side helpers for branches.

import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";

export type BranchRow = {
  id: string;
  name: string;
  label: string;
  community: string | null;
  neighbourhood: string | null;
  address: string | null;
  is_active: boolean;
  sort_order: number;
};

export async function listActiveBranches(): Promise<BranchRow[]> {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const { data } = await supabase
    .from("branches")
    .select("id, name, label, community, neighbourhood, address, is_active, sort_order")
    .eq("is_active", true)
    .order("sort_order");
  return (data ?? []) as BranchRow[];
}

export async function listAllBranches(): Promise<BranchRow[]> {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const { data } = await supabase
    .from("branches")
    .select("id, name, label, community, neighbourhood, address, is_active, sort_order")
    .order("sort_order");
  return (data ?? []) as BranchRow[];
}
