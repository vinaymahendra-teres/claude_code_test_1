# Marketing Sheets — Phase 3 Install Guide

> Read [marketing_strategy.md](../marketing_strategy.md) for the design rationale. This file is the **operator-facing install path** — get from zero to a working sheet in ~15 minutes.

## What's in this folder

| File | What it does |
|---|---|
| `TieredCakeCompany_Marketing.xlsx` | Starter spreadsheet. Import to Google Sheets. |
| `build_xlsx.py` | Regenerator. Re-run after any schema change. |

No Apps Scripts. Phase 3 uses Meta Business Suite (MBS) for scheduling. All performance and review data is logged manually.

---

## Phase 0 — Import the spreadsheet (5 min)

1. Open https://sheets.google.com → blank spreadsheet.
2. `File` → `Import` → `Upload` → drop `TieredCakeCompany_Marketing.xlsx`.
3. Import location: **Replace spreadsheet**.
4. Click `Import data`.
5. Rename the spreadsheet (top-left) to `04_Marketing`.
6. Verify all 6 tabs landed: `README`, `Content Calendar`, `Asset Library`, `Performance`, `Hashtag Library`, `Reviews Tracker`.
7. Open `Performance` — cells in columns B and C should show VLOOKUP formulas (they resolve once you add Content Calendar data).
8. Delete the yellow-highlighted EXAMPLE rows once you've eyeballed them.

---

## Phase 1 — Seed Hashtag Library + Asset Library (10–20 min, one-time)

### Hashtag Library

1. Open the `Hashtag Library` tab.
2. Review the 6 seeded sets (SET-001 through SET-006). These are starting points — tune based on your actual posting experience.
3. Add new sets as new content themes emerge (e.g., a corporate gifting set once B2B orders pick up).
4. Keep Set IDs sequential (SET-007, SET-008, …). They're referenced by ID from Content Calendar column I.

### Asset Library

1. Open the `Asset Library` tab.
2. For each photo/video/graphic you've already shot and uploaded to Google Drive:
   - Add a row: Type, Title, Drive URL (right-click the file in Drive → "Copy link"), product tag, occasion tag, date created.
3. The `Used in posts (count)` column (H) auto-populates via COUNTIF — it counts how many Content Calendar rows reference this asset's Drive URL. This tells you which assets are being reused and which are sitting idle.
4. **Permission flag:** if a photo includes a customer's cake, note "Permission obtained" or "No permission yet" in the Notes column (I). Don't post customer content without explicit consent.

---

## Phase 2 — Weekly Content Calendar planning cadence (Sh, Saturday afternoon)

This is the core weekly ritual. Allocate 30–45 minutes.

1. Open the `Content Calendar` tab. Review all rows in Status = **Idea** or **Draft** with a Planned date in the next 2 weeks.
2. For each **Idea** row that has a caption and an asset ready:
   - Fill in caption (col E) and Asset link (col F).
   - Set Status → **Draft**.
3. For each **Draft** row where the post is ready to go:
   - Open Meta Business Suite (business.facebook.com → your Instagram/Facebook page).
   - Create the scheduled post: upload the asset, paste the caption, select publish date/time.
   - After scheduling, copy the MBS post URL and paste into Content Calendar col G (**MBS scheduled URL**).
   - Set Status → **Scheduled**.
4. For **WhatsApp Status** posts (cannot be scheduled in MBS):
   - Set a phone reminder for the planned date.
   - Post directly from the phone on the day.
   - After posting: Status → **Posted**, fill col J with today's date.
5. Glance at the next 4 weeks. Identify any festivals, local events, or customer delivery dates that should have a post. Add **Idea** rows with tentative captions so they're not forgotten.

**Cadence summary:** Saturday planning session → posts go live Mon–Fri → Performance logged the following Saturday.

---

## Phase 3 — Monthly Performance roll-up (manual paste from Insta Insights)

Do this once per month (or after any post that surprises you with reach).

1. Open Instagram app → your profile → tap the bar chart icon (Insights).
2. Switch to "Content you shared" → filter by the month you're reviewing.
3. For each post you want to log:
   - Find its Post ID in the Content Calendar (match by planned date + channel).
   - Add a row to the `Performance` tab: paste the Post ID into col A.
   - Col B (Posted on) and col C (Channel) auto-fill via VLOOKUP.
   - Fill in Reach, Likes, Saves, DMs received, Inquiries triggered manually from Insights.
4. Add a note in col I for any post with a notable result (high reach, many saves, or DM spike).

**Key metric to watch:** Saves. Instagram's algorithm treats saves as the strongest interest signal. Posts with saves > 2% of reach are worth studying for what content theme or format drove the engagement.

---

## Phase 4 (later) — Reviews Tracker as inbox for Google review notifications

Once Google Business Profile is set up and receiving reviews:

1. Enable email notifications in Google Business Profile (Settings → Notifications → "New reviews").
2. Each notification email becomes a Reviews Tracker row immediately — don't batch them.
3. Reply to the review on Google within 24 hours (mark Replied? = Y in col G).
4. Screenshot 5-star reviews. First verified 5-star review on Google should be:
   - Added to Instagram bio link page.
   - Saved as a Graphic asset in Asset Library (Type = Graphic, Occasion = Customer review).
   - Optionally posted as a Customer Story (with permission — Google reviews are public, but a repost still benefits from a warm DM).
5. If a review triggers a future order (e.g., "Loved the Diwali boxes — want to do Christmas too"), note the CRM Inquiry ID in Linked Order ID (col H) once the inquiry is created.

---

## Regenerating the .xlsx

If you change the schema (add a column, change a validation list, etc.):

```bash
cd brainstorming/marketing_sheets
python3 build_xlsx.py
```

Requires Python 3 + openpyxl (`pip install openpyxl`).

The generator is the **single source of truth** for headers, formulas, validations, and seeded sample data. Don't edit the xlsx by hand and expect the regenerator to honour it.

---

## Troubleshooting

### Performance tab columns B and C show blank or `#N/A`
- Columns B and C use `VLOOKUP` against Content Calendar column A (Post ID).
- Make sure the Post ID in Performance col A exactly matches the Post ID in Content Calendar col A (e.g., "POST-0001" not "post-0001").
- If Content Calendar col A shows a formula result (it's derived), the VLOOKUP should work once the formula resolves. Confirm the tab is named exactly "Content Calendar" (with the space).

### Asset Library col H (Used in posts) always shows 0
- Col H uses `COUNTIF('Content Calendar'!F:F, D2)` — it counts exact matches of the Drive URL.
- The Drive URL in Asset Library col D must be character-for-character identical to the URL in Content Calendar col F. Copy-paste from Drive each time; don't retype.

### MBS won't let me schedule Instagram Stories
- Instagram Stories cannot be scheduled via MBS in all regions/account types. If Stories scheduling is unavailable:
  - Set Status = "Scheduled" in Content Calendar anyway (as a reminder).
  - Post manually from the phone on the planned date.
  - Update Status → "Posted" and fill Posted on (actual).

### Content Calendar Post IDs are not sequential (gaps appear)
- The formula `=IF(B2="","","POST-"&TEXT(ROW()-1,"0000"))` generates Post IDs from the row number minus 1. If you delete a row, IDs re-sequence. This is expected — Post IDs are position-based, not persistent. If you need persistent IDs (e.g., for Performance VLOOKUP), don't delete posted rows; archive them instead (Status = "Archived").
