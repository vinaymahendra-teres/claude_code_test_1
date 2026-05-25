"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { createClient } from "@/utils/supabase/server";
import { requireRole } from "@/lib/auth-helpers";
import { auth, type Role } from "@/auth";

const ROLES: Role[] = ["admin", "staff", "viewer"];

function assertRole(role: string): asserts role is Role {
  if (!ROLES.includes(role as Role)) throw new Error(`Unknown role "${role}"`);
}

export type NewUserInput = {
  name: string;
  email: string;
  role: string;
  password: string;
};

export async function createAppUser(input: NewUserInput): Promise<string> {
  await requireRole("admin");
  const email = input.email.trim().toLowerCase();
  if (!input.name.trim()) throw new Error("Name is required");
  if (!email || !email.includes("@")) throw new Error("Valid email required");
  if (input.password.length < 6) throw new Error("Password must be at least 6 characters");
  assertRole(input.role);

  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { data: existing } = await supabase
    .from("app_users")
    .select("id")
    .eq("email", email)
    .maybeSingle();
  if (existing) throw new Error("A user with that email already exists");

  const id = `u-${email.split("@")[0].replace(/[^a-z0-9]+/g, "-")}-${Date.now().toString(36)}`;
  const password_hash = await bcrypt.hash(input.password, 10);
  const { error } = await supabase.from("app_users").insert({
    id,
    email,
    name: input.name.trim(),
    role: input.role,
    password_hash,
  });
  if (error) throw new Error(`Failed to add user: ${error.message}`);
  revalidatePath("/admin/users");
  return id;
}

export async function updateUserRole(id: string, role: string) {
  await requireRole("admin");
  assertRole(role);
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const { error } = await supabase.from("app_users").update({ role }).eq("id", id);
  if (error) throw new Error(`Failed to update role: ${error.message}`);
  revalidatePath("/admin/users");
}

export async function resetUserPassword(id: string, newPassword: string) {
  await requireRole("admin");
  if (newPassword.length < 6) throw new Error("Password must be at least 6 characters");
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const password_hash = await bcrypt.hash(newPassword, 10);
  const { error } = await supabase
    .from("app_users")
    .update({ password_hash })
    .eq("id", id);
  if (error) throw new Error(`Failed to reset password: ${error.message}`);
  revalidatePath("/admin/users");
}

export async function deleteAppUser(id: string) {
  const session = await requireRole("admin");
  if (session.user.id === id) {
    throw new Error("You can't delete your own account from here");
  }
  // Also block deleting the last remaining admin so the system isn't locked.
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const { data: admins } = await supabase
    .from("app_users")
    .select("id")
    .eq("role", "admin");
  if ((admins?.length ?? 0) <= 1 && admins?.[0]?.id === id) {
    throw new Error("Can't delete the last admin");
  }
  const { error } = await supabase.from("app_users").delete().eq("id", id);
  if (error) throw new Error(`Failed to delete user: ${error.message}`);
  revalidatePath("/admin/users");
}

export async function meId(): Promise<string | null> {
  const session = await auth();
  return session?.user?.id ?? null;
}
