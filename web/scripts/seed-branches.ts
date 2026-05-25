/**
 * Seed the two branches (Eterna, Provincia) and backfill branch_id on
 * existing operational rows. Idempotent: deterministic IDs + upsert + a
 * conditional update for unassigned rows.
 *
 *   npm run seed:branches
 *
 * Backfill heuristic for existing customers:
 *   - "provincia" or "narsingi" in their area / instagram / phone → Provincia
 *   - everything else (incl. blank) → Eterna
 *
 * Orders inherit their customer's branch. Inventory + shopping lists, with no
 * better signal yet, get assigned to the Eterna branch and the operator can
 * move them with the row's Edit sheet.
 */

import { createClient } from "@supabase/supabase-js";
import { resolve } from "node:path";
import fs from "node:fs";

const envPath = resolve(process.cwd(), ".env.local");
if (fs.existsSync(envPath)) {
  fs.readFileSync(envPath, "utf-8").split("\n").forEach((line) => {
    const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  });
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const sb = createClient(url, key, { auth: { persistSession: false } });

// Sh runs Eterna out of Nanakramguda; S runs Provincia out of Narsingi.
// Operator IDs match the seed in scripts/seed-admins.ts.
const BRANCHES = [
  {
    id: "br-eterna",
    name: "eterna",
    label: "Rajapushpa Eterna",
    community: "Rajapushpa Eterna",
    neighbourhood: "Nanakramguda",
    address: "Rajapushpa Eterna, Nanakramguda, Hyderabad 500032",
    operator_id: "u-shreya",
    is_active: true,
    sort_order: 10,
  },
  {
    id: "br-provincia",
    name: "provincia",
    label: "Rajapushpa Provincia",
    community: "Rajapushpa Provincia",
    neighbourhood: "Narsingi",
    address: "Rajapushpa Provincia, Narsingi, Hyderabad 500075",
    operator_id: "u-swetha",
    is_active: true,
    sort_order: 20,
  },
];

const ETERNA = "br-eterna";
const PROVINCIA = "br-provincia";

function decideBranchFromArea(area: string | null): string {
  const a = (area ?? "").toLowerCase();
  if (a.includes("provincia") || a.includes("narsingi")) return PROVINCIA;
  return ETERNA;
}

async function main() {
  console.log("→ Upserting branches");
  {
    const { error } = await sb.from("branches").upsert(BRANCHES, { onConflict: "id" });
    if (error) {
      console.error("Branches upsert failed:", error.message);
      process.exit(1);
    }
    console.log(`  ✓ ${BRANCHES.length} branches in place`);
  }

  console.log("→ Backfilling customer branches");
  {
    const { data: customers, error } = await sb
      .from("customers")
      .select("id, area, branch_id")
      .is("branch_id", null);
    if (error) {
      console.error("Customers fetch failed:", error.message);
      process.exit(1);
    }
    let stamped = 0;
    for (const c of customers ?? []) {
      const branch = decideBranchFromArea(c.area);
      const { error: e } = await sb
        .from("customers")
        .update({
          branch_id: branch,
          address_detail: c.area ?? null,
        })
        .eq("id", c.id);
      if (!e) stamped += 1;
    }
    console.log(`  ✓ ${stamped} customers assigned`);
  }

  console.log("→ Backfilling order branches (inherit from customer)");
  {
    const { data: orders, error } = await sb
      .from("orders")
      .select("id, customer_id, branch_id, delivery_area")
      .is("branch_id", null);
    if (error) {
      console.error("Orders fetch failed:", error.message);
      process.exit(1);
    }
    // Get all customers' branches in one shot
    const { data: customerRows } = await sb.from("customers").select("id, branch_id");
    const branchByCustomer = new Map<string, string | null>();
    for (const c of customerRows ?? []) branchByCustomer.set(c.id, c.branch_id);

    let stamped = 0;
    for (const o of orders ?? []) {
      let branch =
        (o.customer_id && branchByCustomer.get(o.customer_id)) ||
        decideBranchFromArea(o.delivery_area);
      if (!branch) branch = ETERNA;
      const { error: e } = await sb.from("orders").update({ branch_id: branch }).eq("id", o.id);
      if (!e) stamped += 1;
    }
    console.log(`  ✓ ${stamped} orders assigned`);
  }

  console.log("→ Backfilling inventory_items + shopping_lists to Eterna (default)");
  {
    const { error: e1 } = await sb
      .from("inventory_items")
      .update({ branch_id: ETERNA })
      .is("branch_id", null);
    if (e1) console.error("inventory_items backfill:", e1.message);
    const { error: e2 } = await sb
      .from("shopping_lists")
      .update({ branch_id: ETERNA })
      .is("branch_id", null);
    if (e2) console.error("shopping_lists backfill:", e2.message);
    console.log("  ✓ backfilled");
  }

  console.log("\n✓ Done — manage branches at /admin/branches");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
