/**
 * Seed the two admin operators (Swetha + Shreya) into public.app_users.
 *
 *   npm run seed:admins
 *
 * Uses bcrypt to hash a password sourced from INITIAL_ADMIN_PASSWORD (or
 * "changeme" if not set). Upserts on the static IDs so re-running with a new
 * password rotates it cleanly.
 *
 * Requires SUPABASE_SERVICE_ROLE_KEY in .env.local (bypasses RLS).
 */

import { createClient } from "@supabase/supabase-js";
import bcrypt from "bcryptjs";
import { resolve } from "node:path";
import fs from "node:fs";

const envPath = resolve(process.cwd(), ".env.local");
if (fs.existsSync(envPath)) {
  fs.readFileSync(envPath, "utf-8").split("\n").forEach((line) => {
    const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  });
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local.",
  );
  process.exit(1);
}

const sb = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false },
});

const password = process.env.INITIAL_ADMIN_PASSWORD || "changeme";

const ADMINS = [
  { id: "u-swetha", email: "swetha@tieredcake.in", name: "Swetha" },
  { id: "u-shreya", email: "shreya@tieredcake.in", name: "Shreya" },
];

async function main() {
  const password_hash = await bcrypt.hash(password, 10);

  const rows = ADMINS.map((a) => ({
    ...a,
    password_hash,
    role: "admin" as const,
  }));

  const { error } = await sb.from("app_users").upsert(rows, { onConflict: "id" });
  if (error) {
    console.error("Failed to seed admins:", error.message);
    process.exit(1);
  }

  console.log(`✓ Seeded ${ADMINS.length} admins:`);
  for (const a of ADMINS) {
    console.log(`  - ${a.name}  ${a.email}`);
  }
  console.log(
    `\nInitial password is "${password}". Change it via the dashboard or by re-running this script with INITIAL_ADMIN_PASSWORD=<new-password>.`,
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
