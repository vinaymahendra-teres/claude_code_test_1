/**
 * feedback_request.gs — T+2 review-request queue
 *
 * INSTALL
 *   1. Extensions → Apps Script → new script file "feedback_request"
 *   2. Triggers → Add Trigger:
 *        - Function: queueFeedbackRequests
 *        - Event source: Time-driven
 *        - Type: Day timer → 10am-11am
 *
 * WHAT IT DOES
 *   Each morning, finds Orders where:
 *     - delivery_status = "Delivered"
 *     - feedback_received = "N" (or blank)
 *     - TODAY - delivery_date >= 2 days
 *   Emails Sh a list with pre-drafted WhatsApp click-to-chat URLs that
 *   request a Google Maps review. Sh taps each link and reviews-go-up.
 *
 *   Why not auto-send? WhatsApp Business API auto-send needs verified
 *   templates + Meta Cloud setup. Overkill for ≤20 customers/week. Click-
 *   to-chat is 99% of the value at 0% of the friction.
 *
 * CONFIG — edit RECIPIENT, BAKERY_BRAND, GOOGLE_REVIEW_URL below.
 */

const RECIPIENT = 'shreya@example.com';                            // EDIT
const BAKERY_BRAND_FB = 'Tiered Cake Company';                    // EDIT
const GOOGLE_REVIEW_URL = 'https://g.page/r/REPLACE_WITH_PLACE_ID/review';  // EDIT
const ORDERS_SHEET_FB = 'Orders';
const CUSTOMERS_SHEET_FB = 'Customers';
const FOLLOWUP_DAYS = 2;

function queueFeedbackRequests() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const orders = ss.getSheetByName(ORDERS_SHEET_FB);
  const customers = ss.getSheetByName(CUSTOMERS_SHEET_FB);

  const ordersData = orders.getRange(2, 1, orders.getLastRow() - 1, 22).getValues();
  const today = new Date(); today.setHours(0,0,0,0);

  const phoneByCustomerId = {};
  customers.getRange(2, 1, customers.getLastRow() - 1, 3).getValues()
    .forEach(r => { if (r[0]) phoneByCustomerId[r[0]] = r[2]; });

  const queue = ordersData
    .map((r, i) => ({ row: i + 2, data: r }))
    .filter(({ data }) => {
      const customerId = data[1];
      const deliveryDate = data[4];
      const product = data[5];
      const deliveryStatus = data[20];   // col 21 = 'Delivery'
      const feedbackReceived = data[21]; // col 22 = 'Feedback received'
      if (!customerId || !(deliveryDate instanceof Date)) return false;
      if (deliveryStatus !== 'Delivered') return false;
      if (feedbackReceived === 'Y') return false;
      const days = Math.round((today - deliveryDate) / 86400000);
      return days >= FOLLOWUP_DAYS && days <= 7;  // keep window tight
    });

  if (!queue.length) {
    Logger.log('No feedback requests to queue today');
    return;
  }

  let html = `<h2>${BAKERY_BRAND_FB} — feedback requests to send today</h2>`;
  html += `<p>Tap each link to open WhatsApp with the message ready. Hit send. Done.</p>`;
  html += '<table border="1" cellpadding="6" cellspacing="0" style="border-collapse:collapse;font-family:sans-serif;font-size:13px;">';
  html += '<tr style="background:#1F2937;color:#fff;"><th>Order</th><th>Customer</th><th>Delivered</th><th>Product</th><th>Tap to message</th></tr>';

  queue.forEach(({ row, data }) => {
    const [orderId, customerId, customerName, _od, deliveryDate, product] = data;
    const phone = (phoneByCustomerId[customerId] || '').replace(/[^0-9]/g, '');
    const firstName = String(customerName || '').split(' ')[0] || 'there';
    const msg = `Hi ${firstName}! Hope the ${String(product).toLowerCase()} was loved 🎂 ` +
      `If you have 30 seconds, a kind Google review really helps a 2-person home bakery: ` +
      `${GOOGLE_REVIEW_URL}\n\n— ${BAKERY_BRAND_FB}`;
    const waUrl = phone
      ? `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`
      : '';
    const link = waUrl ? `<a href="${waUrl}">Open WhatsApp →</a>` : '<i>no phone</i>';
    html += `<tr>
      <td>${orderId}</td>
      <td>${escapeHtmlFb(customerName)}</td>
      <td>${deliveryDate.toDateString()}</td>
      <td>${escapeHtmlFb(product)}</td>
      <td>${link}</td>
    </tr>`;
  });
  html += '</table>';
  html += `<p style="color:#6B7280;font-size:12px;">After sending, set feedback_received=Y on the Orders row so this doesn't re-queue.</p>`;

  MailApp.sendEmail({
    to: RECIPIENT,
    subject: `[${BAKERY_BRAND_FB}] ${queue.length} feedback request${queue.length > 1 ? 's' : ''} to send`,
    htmlBody: html,
  });
}

function escapeHtmlFb(s) {
  return String(s).replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));
}
