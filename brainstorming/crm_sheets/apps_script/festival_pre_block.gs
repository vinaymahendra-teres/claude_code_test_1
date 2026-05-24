/**
 * festival_pre_block.gs — auto-block Capacity Calendar 21 days before festivals
 *
 * INSTALL
 *   1. In 01_CRM_Sales.xlsx: Extensions → Apps Script → new file "festival_pre_block"
 *   2. Triggers → Add Trigger:
 *        - Function: preBlockFestivalDays
 *        - Event source: Time-driven
 *        - Type: Week timer → Monday 06:00–07:00 IST
 *
 * WHAT IT DOES
 *   For each Indian festival in the FESTIVALS table below, if the festival
 *   falls within the next 21 days, sets the Capacity Calendar row for that
 *   date to Blocked = "Y" with a Block reason (festival name).
 *   Skips if already blocked (manual block or prior run).
 *
 *   This protects production capacity around personal/family time AND signals
 *   the Dashboard's festival cash-cycle panel to flag ingredient outflow
 *   timing.
 *
 * EDIT the FESTIVALS array yearly to keep dates current (most festivals are
 * lunar/lunisolar and shift each year).
 */

const FESTIVALS = [
  // 2026 Indian festival dates (verify each year)
  { name: 'Eid al-Fitr', date: new Date(2026, 2, 21) },        // 21 Mar 2026
  { name: 'Holi', date: new Date(2026, 2, 4) },                 // 04 Mar 2026
  { name: 'Ram Navami', date: new Date(2026, 2, 27) },          // 27 Mar 2026
  { name: 'Eid al-Adha', date: new Date(2026, 4, 28) },         // 28 May 2026 (overlaps current week — example)
  { name: 'Bathukamma (Day 1)', date: new Date(2026, 9, 9) },   // ~9 Oct 2026 (Telangana)
  { name: 'Bathukamma (Day 9 — Saddula)', date: new Date(2026, 9, 17) },
  { name: 'Dussehra (Vijayadashami)', date: new Date(2026, 9, 18) },
  { name: 'Diwali (Lakshmi Puja)', date: new Date(2026, 10, 8) },     // 08 Nov 2026
  { name: 'Karva Chauth', date: new Date(2026, 9, 29) },
  { name: 'Christmas', date: new Date(2026, 11, 25) },          // 25 Dec
  { name: 'Ganesh Chaturthi', date: new Date(2026, 7, 26) },    // 26 Aug 2026
  // 2027 placeholders — update with verified dates each Jan
  { name: 'New Year’s Day', date: new Date(2027, 0, 1) },
];

const CAPACITY_SHEET = 'Capacity Calendar';
const PREBLOCK_DAYS = 21;

function preBlockFestivalDays() {
  const sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CAPACITY_SHEET);
  if (!sh) {
    Logger.log('Capacity Calendar sheet not found — abort');
    return;
  }

  const today = new Date(); today.setHours(0, 0, 0, 0);
  const horizon = new Date(today); horizon.setDate(horizon.getDate() + PREBLOCK_DAYS);

  // Festivals in window
  const upcoming = FESTIVALS.filter(f => {
    const fd = new Date(f.date); fd.setHours(0, 0, 0, 0);
    return fd >= today && fd <= horizon;
  });

  if (!upcoming.length) {
    Logger.log('No festivals in next ' + PREBLOCK_DAYS + ' days');
    return;
  }

  // Load Capacity Calendar
  const lastRow = sh.getLastRow();
  if (lastRow < 2) return;
  const data = sh.getRange(2, 1, lastRow - 1, 12).getValues();

  // Build date → row lookup
  const tz = Session.getScriptTimeZone();
  const rowByDate = {};
  data.forEach((r, idx) => {
    if (r[0] instanceof Date) {
      const k = Utilities.formatDate(r[0], tz, 'yyyy-MM-dd');
      rowByDate[k] = { rowIdx: idx + 2, row: r };
    }
  });

  // For each upcoming festival, block its calendar date if not already
  const blocked = [];
  upcoming.forEach(f => {
    const k = Utilities.formatDate(f.date, tz, 'yyyy-MM-dd');
    const target = rowByDate[k];
    if (!target) return;  // outside seeded calendar window
    if (target.row[8] === 'Y') return;  // already blocked (manual or prior run)
    sh.getRange(target.rowIdx, 9).setValue('Y');           // col I: Blocked
    sh.getRange(target.rowIdx, 10).setValue(f.name);       // col J: Block reason
    blocked.push({ date: k, name: f.name });
  });

  if (blocked.length) {
    Logger.log('Blocked ' + blocked.length + ' festival day(s): ' +
               blocked.map(b => b.date + ' ' + b.name).join(', '));
  } else {
    Logger.log('All upcoming festival days already blocked');
  }
}
