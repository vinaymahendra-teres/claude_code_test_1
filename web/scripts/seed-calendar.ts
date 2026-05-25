/**
 * Seed calendar_events with the 2026 Telangana holiday calendar + the
 * bakery-relevant "hallmark" days. Upserts on `id`, so it's safe to
 * re-run after edits in the UI — only the rows whose IDs match this
 * script's slug-of-date will be touched.
 *
 *   npm run seed:calendar
 *
 * Lunar / panchang dates for 2026 are best-effort (using widely-published
 * Indian government and panchang sources); operators can edit any of them
 * from /calendar.
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

type Kind = "event" | "festival" | "milestone" | "marketing" | "personal" | "reminder";
type Row = {
  date: string; // YYYY-MM-DD
  end_date?: string;
  title: string;
  kind: Kind;
  notes?: string;
};

// 2026 dates — Telangana state + national + observed hallmarks for a bakery.
// Where the date follows a lunar / Islamic calendar it's best-effort; operators
// can adjust on /calendar.
const EVENTS: Row[] = [
  // ===== January =====
  { date: "2026-01-01", title: "New Year's Day", kind: "festival", notes: "Cake demand spike Dec 30–Jan 1" },
  { date: "2026-01-14", title: "Bhogi", kind: "festival", notes: "Day 1 of Sankranti" },
  { date: "2026-01-15", title: "Makar Sankranti / Pongal", kind: "festival", notes: "Telangana gazetted holiday" },
  { date: "2026-01-16", title: "Kanuma", kind: "festival", notes: "Day 3 of Sankranti — Telangana holiday" },
  { date: "2026-01-26", title: "Republic Day", kind: "milestone", notes: "Gazetted national holiday" },

  // ===== February =====
  { date: "2026-02-14", title: "Valentine's Day", kind: "marketing", notes: "Heart-shape cake spike · pair with cupcakes" },
  { date: "2026-02-15", title: "Maha Shivaratri", kind: "festival", notes: "Restricted holiday" },

  // ===== March =====
  { date: "2026-03-03", title: "Holika Dahan", kind: "festival" },
  { date: "2026-03-04", title: "Holi", kind: "festival", notes: "Telangana gazetted holiday" },
  { date: "2026-03-19", title: "Ugadi (Telugu New Year)", kind: "festival", notes: "Gazetted — large pre-order surge" },
  { date: "2026-03-21", title: "Eid-ul-Fitr (Ramzan)", kind: "festival", notes: "Approx — depends on moon sighting" },
  { date: "2026-03-27", title: "Sri Rama Navami", kind: "festival", notes: "Gazetted" },

  // ===== April =====
  { date: "2026-04-01", title: "Mahavir Jayanti", kind: "festival" },
  { date: "2026-04-03", title: "Good Friday", kind: "festival" },
  { date: "2026-04-05", title: "Easter Sunday", kind: "marketing", notes: "Easter egg cupcakes / hot cross buns" },
  { date: "2026-04-14", title: "Dr. B. R. Ambedkar Jayanti", kind: "milestone", notes: "Telangana holiday" },

  // ===== May =====
  { date: "2026-05-01", title: "Labour Day", kind: "milestone", notes: "Gazetted national holiday" },
  { date: "2026-05-01", title: "Buddha Purnima", kind: "festival", notes: "Approx" },
  { date: "2026-05-10", title: "Mother's Day", kind: "marketing", notes: "2nd Sun — sentimental + tiered cakes" },
  { date: "2026-05-17", title: "World Baking Day", kind: "marketing", notes: "Storytelling / behind-the-scenes" },
  { date: "2026-05-27", title: "Eid-ul-Adha (Bakrid)", kind: "festival", notes: "Approx — moon sighting dependent" },

  // ===== June =====
  { date: "2026-06-02", title: "Telangana Formation Day", kind: "milestone", notes: "State gazetted holiday" },
  { date: "2026-06-21", title: "Father's Day", kind: "marketing", notes: "3rd Sun — themed cakes, less volume than Mother's" },
  { date: "2026-06-26", title: "Muharram (Ashura)", kind: "festival", notes: "Approx — moon sighting dependent" },

  // ===== July =====
  { date: "2026-07-07", title: "World Chocolate Day", kind: "marketing", notes: "Chocolate-forward marketing" },
  { date: "2026-07-12", title: "Bonalu — Golconda", kind: "festival", notes: "Telangana — first Sun of Ashada" },
  { date: "2026-07-19", title: "Bonalu — Secunderabad", kind: "festival", notes: "Telangana — second Sun of Ashada" },

  // ===== August =====
  { date: "2026-08-02", title: "Friendship Day", kind: "marketing", notes: "1st Sun — cupcakes for groups" },
  { date: "2026-08-15", title: "Independence Day", kind: "milestone", notes: "Gazetted — tricolour cakes" },
  { date: "2026-08-26", title: "Onam (Thiruvonam)", kind: "festival", notes: "Approx — Kerala diaspora orders" },
  { date: "2026-08-28", title: "Raksha Bandhan", kind: "festival", notes: "Sibling-themed boxes, hampers with rakhi" },

  // ===== September =====
  { date: "2026-09-04", title: "Janmashtami", kind: "festival", notes: "Approx" },
  { date: "2026-09-14", title: "Ganesh Chaturthi (Vinayaka Chavithi)", kind: "festival", notes: "Telangana gazetted — 10-day festival" },

  // ===== October =====
  { date: "2026-10-02", title: "Gandhi Jayanti", kind: "milestone", notes: "Gazetted dry day" },
  { date: "2026-10-05", end_date: "2026-10-12", title: "Bathukamma", kind: "festival", notes: "Telangana state festival, 9 days — peak floral cake demand" },
  { date: "2026-10-11", title: "Vijayadashami (Dussehra)", kind: "festival", notes: "Telangana gazetted — Saddula Bathukamma" },
  { date: "2026-10-29", title: "Karva Chauth", kind: "marketing", notes: "Couples ordering thalis & cakes" },
  { date: "2026-10-31", title: "Halloween", kind: "marketing", notes: "Themed cupcakes / spooky cakes for international set" },

  // ===== November =====
  { date: "2026-11-08", title: "Diwali", kind: "festival", notes: "Telangana gazetted — peak gifting / hamper season" },
  { date: "2026-11-10", title: "Bhai Dooj", kind: "festival" },
  { date: "2026-11-14", title: "Children's Day", kind: "marketing", notes: "Nehru Jayanti — school orders" },
  { date: "2026-11-26", title: "World Cake Day", kind: "marketing", notes: "PR moment — feature your signature" },

  // ===== December =====
  { date: "2026-12-25", title: "Christmas Day", kind: "festival", notes: "Gazetted — yule logs, fruitcake, plum cake" },
  { date: "2026-12-31", title: "New Year's Eve", kind: "marketing", notes: "Party cakes / midnight cutting" },
];

function slug(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 32);
}

async function main() {
  const rows = EVENTS.map((e) => ({
    // Deterministic ID so a re-run is an upsert, not a duplicate.
    id: `ce-seed-${e.date}-${slug(e.title)}`,
    title: e.title,
    date: e.date,
    end_date: e.end_date ?? null,
    kind: e.kind,
    notes: e.notes ?? null,
    all_day: true,
  }));

  const { error } = await sb.from("calendar_events").upsert(rows, { onConflict: "id" });
  if (error) {
    console.error("Seed failed:", error.message);
    process.exit(1);
  }
  console.log(`✓ Seeded ${rows.length} calendar entries for 2026`);
  console.log("  · Telangana gazetted: Sankranti, Ugadi, Bathukamma, Bonalu, Ganesh Chaturthi, Diwali …");
  console.log("  · Hallmark days: Valentine's, Mother's, Father's, Friendship, Halloween, World Cake Day …");
  console.log("\nRe-run after editing in the UI is safe — only seeded rows are touched.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
