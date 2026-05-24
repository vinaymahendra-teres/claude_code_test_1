# Stream 5 — Marketing Strategy (Google Sheets — Phase 3)

> _Last updated: 2026-05-24_
> _Status: Phase 3 complete. All Marketing tabs anchored: Content Calendar · Asset Library · Performance · Hashtag Library · Reviews Tracker. No Apps Scripts — MBS handles scheduling; all metrics logged manually._
> _Operators: Shreya (Sh) — primary owner. Swetha (S) — content creation, photo/video capture._
> _Parent spec: [unified cottage stack design](specs/2026-05-24-cottage-stack-design.md)._

This document is **canonical** for the Marketing module. It defines the Instagram-WhatsApp-Facebook content planning loop, asset management, performance tracking, and the reviews inbox that feeds back into the CRM.

---

## 1. Why Marketing in its own file

Three reasons for a dedicated Marketing spreadsheet rather than folding it into CRM or Operations:

**Ownership cadence.** Sh owns the marketing rhythm on a weekly planning cycle (Saturday afternoon). Swetha owns the production queue on a daily cycle. Mixing these into the same file creates conflicting edit patterns and muddies the operational picture.

**Instagram-WhatsApp-Facebook triad.** Tiered Cake Company operates on three channels:
- **Instagram** (Feed, Reel, Story) — primary reach and discovery engine. Hyderabad food communities, neighbourhood groups, and the Financial District / Eterna / Provincia cluster are the core audiences.
- **WhatsApp** (Status, broadcast) — primary conversion engine. Inquiries from Instagram close over WhatsApp DMs. Status posts reach warm contacts directly without the algorithm.
- **Facebook Page** — secondary. Useful for Meta Business Suite scheduling and for reaching the slightly older Hyderabad demographic that books anniversary cakes and office orders.

**Separation of planning and execution.** Content Calendar is a planning artifact. Operations (Bake Plan) is an execution artifact. Keeping them separate avoids the case where a bake-plan generator script accidentally overwrites a scheduled post row or vice versa.

---

## 2. Tab schemas

### 2.1 `Content Calendar`

One row per planned or published post. Primary planning surface for Sh.

| Col | Header | Type | Source / formula |
|---|---|---|---|
| A | **Post ID** | text | `=IF(B2="","","POST-"&TEXT(ROW()-1,"0000"))` |
| B | **Planned date** | date | manual — target publish date |
| C | **Channel** | text | list: Instagram Feed, Instagram Reel, Instagram Story, WhatsApp Status, Facebook Page |
| D | **Status** | text | list: Idea, Draft, Scheduled, Posted, Archived |
| E | **Caption** | text | manual — full caption including hashtags inline or referencing Hashtag Library |
| F | **Asset link** | text | manual — Google Drive direct link to photo/video |
| G | **MBS scheduled URL** | text | manual — paste MBS confirmation URL after scheduling (closes the planning loop) |
| H | **Theme / Tag** | text | list: Product Showcase, Behind the Scenes, Customer Story, Festival, Educational, Promotion |
| I | **Hashtag set ID** | text | manual — e.g., SET-001; look up in Hashtag Library tab |
| J | **Posted on (actual)** | date | manual — actual publish date (may differ from planned); update when Status → Posted |
| K | **Notes** | text | free — reach/likes recap after posting, campaign context, customer tag notes |

10 sample rows shipped: mix of Posted (Sneha birthday, Vikram anniversary, Lakshmi repeat-customer, Myra unicorn reel), Scheduled (Aarav Spider-Man, WA open-orders promo), Draft (bomboloni story), and Idea rows (heat reel, Eid, Raksha Bandhan).

### 2.2 `Asset Library`

One row per media asset stored in Google Drive. Keeps Sh from hunting for files when building the weekly content plan.

| Col | Header | Type | Source / formula |
|---|---|---|---|
| A | **Asset ID** | text | `=IF(B2="","","AST-"&TEXT(ROW()-1,"0000"))` |
| B | **Type** | text | list: Photo, Video, Reel clip, Graphic, Logo |
| C | **Title** | text | manual — descriptive name |
| D | **Drive URL** | text | manual — direct Google Drive link to the file |
| E | **Tags (Product)** | text | manual — Cake, Bomboloni, Cupcakes, Cake Tub, Brand, etc. |
| F | **Tags (Occasion/Theme)** | text | manual — Birthday (kid), Anniversary, Dinner party, Festival, etc. |
| G | **Date created** | date | manual — shoot/creation date |
| H | **Used in posts (count)** | number | `=COUNTIF('Content Calendar'!F:F,D2)` — how many Content Calendar rows reference this asset's Drive URL |
| I | **Notes** | text | free — permission status, watermark notes, hero shot flag |

12 sample rows: product hero shots (Sneha butterscotch, Aarav Spider-Man, bomboloni flat-lay, Myra unicorn reel), brand assets (primary logo, festival calendar graphic, studio shot), and catalogue shots (red velvet, cupcakes, cake tubs).

### 2.3 `Performance`

One row per published post. Manual paste from Instagram Insights each week (or after any high-reach post).

| Col | Header | Type | Source / formula |
|---|---|---|---|
| A | **Post ID** | text | manual — paste from Content Calendar (e.g., POST-0001) |
| B | **Posted on** | date | `=IFERROR(VLOOKUP(A2,'Content Calendar'!A:J,10,FALSE),"")` — auto-pulled from CC col J |
| C | **Channel** | text | `=IFERROR(VLOOKUP(A2,'Content Calendar'!A:C,3,FALSE),"")` — auto-pulled from CC col C |
| D | **Reach** | number | manual — from Instagram Insights |
| E | **Likes** | number | manual |
| F | **Saves** | number | manual — saves are the strongest signal for Instagram's algorithm |
| G | **DMs received** | number | manual — count DMs triggered by the post (check within 48h) |
| H | **Inquiries triggered** | number | manual — subset of DMs that became formal inquiries (logged in CRM) |
| I | **Notes** | text | free — context for spikes, conversion commentary |

5 sample rows for the 4 Posted entries in Content Calendar, plus the WhatsApp Status post. Myra unicorn reel (POST-0010): 3.2K reach, 245 likes, 38 saves, 11 DMs, 4 new inquiries — the clearest evidence of what high-quality reel content can do at cottage scale.

### 2.4 `Hashtag Library`

One row per hashtag set. Sets are referenced by ID from Content Calendar (col I). Keeps hashtag management out of the caption column.

| Col | Header | Type | Source |
|---|---|---|---|
| A | **Set ID** | text | manual — e.g., SET-001 |
| B | **Theme** | text | manual — descriptive label |
| C | **Tag list (semicolon-separated)** | text | manual — full hashtag string; paste into caption or MBS |
| D | **Last used** | date | manual — update after use |
| E | **Performance note** | text | manual — observed effect on reach / engagement |

6 sets shipped: kid birthday cakes, customer stories, bomboloni/dinner party, educational/BTS, festivals (generic), and promotions/open-for-orders.

### 2.5 `Reviews Tracker`

One row per customer review, regardless of platform. Acts as the reviews inbox and the source for the Google Business reputation loop.

| Col | Header | Type | Source / formula |
|---|---|---|---|
| A | **Review ID** | text | `=IF(B2="","","REV-"&TEXT(ROW()-1,"0000"))` |
| B | **Date received** | date | manual |
| C | **Platform** | text | list: Google Business, Instagram comment, WhatsApp, Word-of-mouth |
| D | **Reviewer** | text | manual — name or @handle |
| E | **Star rating** | number | manual — 1–5 |
| F | **Excerpt** | text | manual — quote or paraphrase |
| G | **Replied?** | text | list: Y, N, N/A |
| H | **Linked Order ID** | text | manual — ORD-XXXX or "(no order yet)" |
| I | **Notes** | text | free — conversion notes, permission status, follow-up context |

5 sample rows: Arjun (WhatsApp, ORD-0001), Priya (WhatsApp, ORD-0002), Anjali (Google Business — first 5-star Google review, ORD-0004), Sandeep (WhatsApp, Diwali trigger, ORD-0006), Meera Joshi (Instagram comment — no order yet, converted to INQ-0001).

---

## 3. The MBS integration pattern

Meta Business Suite (business.facebook.com) is the scheduling tool for Phase 3. The pattern:

1. **Plan** — Sh drafts the post in Content Calendar (Status = Draft). Caption in col E, asset link in col F, hashtag set ID in col I.
2. **Schedule** — Sh opens MBS, creates the scheduled post, selects publish date/time, uploads the asset (or links from Drive if MBS supports it), pastes the caption + hashtags.
3. **Close the loop** — After scheduling in MBS, Sh copies the MBS post URL and pastes it into Content Calendar col G (MBS scheduled URL). Status → Scheduled.
4. **Confirm** — When MBS publishes the post, update Status → Posted. Fill in col J (Posted on actual) with the real publish date.
5. **Log** — Within 48 hours, pull Insta Insights for that post and add a row to the Performance tab.

The MBS URL in col G serves two purposes: (a) quick link back to the scheduled post for last-minute edits, and (b) a paper trail proving the post was actually queued rather than just drafted.

**WhatsApp Status** posts cannot be scheduled via MBS. These are handled directly from the phone (typically Shreya's). After posting, update Status → Posted and fill in col J.

---

## 4. The Reviews Tracker → CRM feedback loop

The Reviews Tracker is intentionally linked to the CRM via the `Linked Order ID` column. The loop:

1. A customer sends a WhatsApp review after receiving their order.
2. Sh (or S) adds a row to Reviews Tracker: platform, reviewer, rating, excerpt.
3. If the review references a future order ("Let's plan Diwali boxes"), that intent is noted in Reviews Tracker Notes. When the inquiry is formally created in CRM, the Order ID is backfilled into col H.
4. The `feedback_request.gs` Apps Script in the CRM module triggers a WhatsApp message template requesting a review 2 days after order delivery. Reviews captured through this prompt should reference the `ORD-XXXX` that triggered the request — making it easy to backfill.

**Google Business reviews** arrive as email notifications (enable in Google Business Profile settings). Each notification becomes a Reviews Tracker row immediately. The first 5-star Google review (Anjali Agarwal, ORD-0004) is a meaningful trust signal for the Hyderabad premium-bakery positioning — it should be screenshotted and pinned to the Instagram bio link.

---

## 5. Why no Apps Scripts in Phase 3

The decision to omit Apps Scripts from the Marketing module is deliberate. At current cottage volumes:

- Post frequency: 2–4 posts per week across all channels.
- Review frequency: 1–3 WhatsApp reviews per week; Google reviews arrive monthly at most.
- Performance logging: 5–10 rows per weekly roll-up from Insta Insights.

Manual logging for these volumes takes under 15 minutes per week. The marginal automation benefit — say, auto-populating Performance rows from the Instagram Graph API — does not justify the engineering overhead or the OAuth complexity of connecting to Meta's API as a non-business-verified developer.

**Revisit if:** posts exceed 5/week sustained for 4+ weeks, or if Sh is consistently spending >30 minutes per week on Performance logging. At that point, a lightweight Instagram Insights CSV import (or a Zapier trigger from MBS webhook) is the right next step.

---

## 6. Open dependencies on other Streams

| From Stream | What it sharpens |
|---|---|
| Stream 5 — Brand identity | Brand voice, visual identity, and colour palette are set upstream in Stream 5 (identity work). The Content Calendar theme/tag taxonomy and hashtag sets should be reviewed once Stream 5 brand guidelines land. The "Customer Story" and "Behind the Scenes" themes may be renamed or split. |
| Stream 1 — Equipment / photo setup | Asset Library quality depends on the studio setup (Bedroom 2 shoot corner, lighting). Stream 1's pending convection oven decision also affects which products can be shot for catalogue. Once the Stream 1 equipment assessment completes, prioritise a hero-shot session to fill gaps in the Asset Library (Cake Tub, Cupcakes, Bomboloni action shot). |
| CRM (Stream 3) | Customer Story posts require permission from the customer — typically via WhatsApp. The `feedback_request.gs` CRM script is the cleanest trigger for this: when an order is marked Delivered, the script can also send a "may we post about your cake?" message. Until that script lands, permission must be logged manually in Asset Library col I (Notes). |
