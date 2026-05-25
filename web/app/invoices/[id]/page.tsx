import Link from "next/link";
import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import { Icon } from "@/components/Icon";
import { BrandLogo } from "@/components/BrandLogo";
import { fmtMoney, fmtDate } from "@/lib/format";

export const dynamic = "force-dynamic";

type LineItem = {
  description: string;
  qty: number;
  unit_price: number;
  total: number;
  hsn?: string;
};

type Invoice = {
  id: string;
  number: string;
  branch_id: string;
  order_id: string | null;
  customer_id: string | null;
  status: "draft" | "issued" | "paid" | "cancelled" | "voided";
  issue_date: string;
  due_date: string | null;
  subtotal: number;
  tax_total: number;
  total: number;
  amount_paid: number;
  line_items: LineItem[];
  customer_snapshot: {
    name?: string;
    phone?: string;
    instagram?: string;
    area?: string;
    address_detail?: string;
  } | null;
  branch_snapshot: {
    id?: string;
    label?: string;
    community?: string;
    address?: string;
    gstin?: string;
    operator_id?: string;
    bank_name?: string;
    bank_account_number?: string;
    bank_ifsc?: string;
    bank_upi?: string;
    signature_label?: string;
    invoice_terms?: string;
    invoice_footer?: string;
  } | null;
  gst_enabled: boolean;
  customer_gstin: string | null;
  notes: string | null;
  terms: string | null;
};

export default async function InvoicePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const { data } = await supabase.from("invoices").select("*").eq("id", id).maybeSingle();
  if (!data) notFound();
  const inv = data as Invoice;
  const customer = inv.customer_snapshot ?? {};
  const branch = inv.branch_snapshot ?? {};
  const items = Array.isArray(inv.line_items) ? inv.line_items : [];
  const balance = inv.total - inv.amount_paid;

  return (
    <div style={{ background: "#f6f4ef", minHeight: "100dvh", padding: "24px 16px 60px" }}>
      <div style={pageStyle}>
        {/* Header band */}
        <header style={headerStyle}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <BrandLogo size={56} />
            <div>
              <div style={brandName}>Tiered Cake Company</div>
              <div style={brandSub}>{branch.label ?? "—"} · {branch.community ?? ""}</div>
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={invoiceLabel}>Invoice</div>
            <div style={invoiceNumber}>{inv.number}</div>
            <div style={metaLine}>
              Issued <strong>{fmtDate(inv.issue_date, { showYear: true })}</strong>
            </div>
            {inv.due_date && (
              <div style={metaLine}>Due <strong>{fmtDate(inv.due_date, { showYear: true })}</strong></div>
            )}
            <StatusBadge status={inv.status} />
          </div>
        </header>

        {/* Parties */}
        <section style={partiesStyle}>
          <div>
            <div style={sectionLabel}>Billed to</div>
            <div style={partyName}>{customer.name ?? "—"}</div>
            <div style={partyLines}>
              {customer.address_detail && <div>{customer.address_detail}</div>}
              {customer.area && <div>{customer.area}</div>}
              {customer.phone && <div>Phone: {customer.phone}</div>}
              {customer.instagram && <div>IG: @{customer.instagram.replace(/^@/, "")}</div>}
              {inv.customer_gstin && <div>GSTIN: {inv.customer_gstin}</div>}
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={sectionLabel}>Issued by</div>
            <div style={partyName}>{branch.label ?? "—"}</div>
            <div style={partyLines}>
              {branch.address && <div>{branch.address}</div>}
              {inv.gst_enabled && branch.gstin && <div>GSTIN: {branch.gstin}</div>}
            </div>
          </div>
        </section>

        {/* Line items */}
        <section style={{ marginTop: 18 }}>
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thLeft}>Description</th>
                {inv.gst_enabled && <th style={thNum}>HSN</th>}
                <th style={thNum}>Qty</th>
                <th style={thNum}>Unit</th>
                <th style={thNum}>Amount</th>
              </tr>
            </thead>
            <tbody>
              {items.map((it, i) => (
                <tr key={i}>
                  <td style={tdLeft}>{it.description}</td>
                  {inv.gst_enabled && <td style={tdNum}>{it.hsn ?? "—"}</td>}
                  <td style={tdNum}>{it.qty}</td>
                  <td style={tdNum}>{fmtMoney(it.unit_price)}</td>
                  <td style={tdNum}>{fmtMoney(it.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        {/* Totals */}
        <section style={totalsBox}>
          <Row label="Subtotal" value={fmtMoney(inv.subtotal)} />
          {inv.gst_enabled && <Row label="GST" value={fmtMoney(inv.tax_total)} />}
          <Row label="Total" value={fmtMoney(inv.total)} strong />
          <Row label="Amount paid" value={fmtMoney(inv.amount_paid)} />
          <Row
            label="Balance due"
            value={fmtMoney(balance)}
            strong
            danger={balance > 0}
          />
        </section>

        {/* Bank + UPI */}
        {(branch.bank_upi || branch.bank_account_number) && (
          <section style={bankBox}>
            <div style={sectionLabel}>Payment</div>
            {branch.bank_upi && (
              <div style={partyLines}>UPI: <strong>{branch.bank_upi}</strong></div>
            )}
            {branch.bank_account_number && (
              <div style={partyLines}>
                {branch.bank_name ?? "Bank"} · A/c {branch.bank_account_number} · IFSC {branch.bank_ifsc ?? "—"}
              </div>
            )}
          </section>
        )}

        {/* Terms + footer */}
        {(inv.terms || inv.notes) && (
          <section style={{ marginTop: 18 }}>
            {inv.notes && (
              <>
                <div style={sectionLabel}>Notes</div>
                <div style={partyLines}>{inv.notes}</div>
              </>
            )}
            {inv.terms && (
              <>
                <div style={{ ...sectionLabel, marginTop: 12 }}>Terms</div>
                <div style={partyLines}>{inv.terms}</div>
              </>
            )}
          </section>
        )}

        <section style={signatureBox}>
          <div>
            {branch.invoice_footer && (
              <div style={{ fontSize: 11, color: "#6b6557" }}>{branch.invoice_footer}</div>
            )}
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ borderTop: "1px solid #b9b1a0", paddingTop: 6, fontSize: 12 }}>
              {branch.signature_label ?? "Authorised signatory"}
            </div>
          </div>
        </section>

        {/* On-screen controls — hidden on print */}
        <div className="no-print" style={{ marginTop: 24, display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <Link href={inv.order_id ? `/orders/${inv.order_id}` : "/invoices"} style={btn}>
            <Icon.ChevronLeft size={14} /> Back
          </Link>
          <form action={`/api/print`} method="get" style={{ display: "inline" }}>
            <button type="button" onClick={(e) => { e.preventDefault(); window.print(); }} style={{ ...btn, background: "var(--caramel)", color: "var(--surface)", border: "none" }}>
              <Icon.Doc size={14} /> Print / Save PDF
            </button>
          </form>
        </div>
      </div>

      {/* Print-only style overrides */}
      <style>
        {`@media print {
          body { background: #fff !important; }
          .no-print { display: none !important; }
          a { color: inherit; text-decoration: none; }
        }`}
      </style>
    </div>
  );
}

function Row({
  label,
  value,
  strong,
  danger,
}: {
  label: string;
  value: string;
  strong?: boolean;
  danger?: boolean;
}) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0" }}>
      <span style={{ color: "#6b6557", fontSize: 13 }}>{label}</span>
      <span
        style={{
          fontWeight: strong ? 700 : 600,
          fontSize: 13.5,
          color: danger ? "#9d2235" : "#1a1814",
        }}
      >
        {value}
      </span>
    </div>
  );
}

function StatusBadge({ status }: { status: Invoice["status"] }) {
  const palette: Record<Invoice["status"], { bg: string; fg: string }> = {
    draft: { bg: "#e9e6df", fg: "#6b6557" },
    issued: { bg: "#fdf1d6", fg: "#7a5400" },
    paid: { bg: "#d8efd1", fg: "#2e6b22" },
    cancelled: { bg: "#f0d6d6", fg: "#7d2424" },
    voided: { bg: "#e1d4d4", fg: "#5d3a3a" },
  };
  const p = palette[status];
  return (
    <span
      style={{
        display: "inline-block",
        marginTop: 6,
        padding: "3px 10px",
        background: p.bg,
        color: p.fg,
        borderRadius: 999,
        fontSize: 11,
        fontWeight: 700,
        textTransform: "uppercase",
        letterSpacing: "0.06em",
      }}
    >
      {status}
    </span>
  );
}

// ---- styles ----

const pageStyle: React.CSSProperties = {
  maxWidth: 760,
  margin: "0 auto",
  background: "#ffffff",
  borderRadius: 14,
  boxShadow: "0 8px 30px oklch(0.35 0.06 50 / 0.10)",
  padding: 32,
  fontFamily: "DM Sans, system-ui, sans-serif",
  color: "#1a1814",
};

const headerStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  paddingBottom: 18,
  borderBottom: "2px solid #1a1814",
};

const brandName: React.CSSProperties = {
  fontFamily: "DM Serif Display, serif",
  fontSize: 20,
  lineHeight: 1.1,
};

const brandSub: React.CSSProperties = {
  fontSize: 12,
  color: "#6b6557",
  marginTop: 2,
};

const invoiceLabel: React.CSSProperties = {
  fontSize: 11,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  color: "#6b6557",
};

const invoiceNumber: React.CSSProperties = {
  fontFamily: "DM Serif Display, serif",
  fontSize: 22,
  lineHeight: 1.15,
};

const metaLine: React.CSSProperties = {
  fontSize: 12,
  color: "#3d3a35",
  marginTop: 2,
};

const partiesStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: 24,
  marginTop: 18,
};

const sectionLabel: React.CSSProperties = {
  fontSize: 11,
  letterSpacing: "0.06em",
  textTransform: "uppercase",
  color: "#6b6557",
  marginBottom: 4,
};

const partyName: React.CSSProperties = {
  fontFamily: "DM Serif Display, serif",
  fontSize: 16,
  lineHeight: 1.2,
};

const partyLines: React.CSSProperties = {
  fontSize: 12.5,
  color: "#3d3a35",
  lineHeight: 1.55,
  marginTop: 2,
};

const tableStyle: React.CSSProperties = {
  width: "100%",
  borderCollapse: "collapse",
  fontSize: 13,
};

const thLeft: React.CSSProperties = {
  textAlign: "left",
  padding: "8px 6px",
  borderBottom: "1px solid #d8d4c8",
  fontWeight: 600,
  fontSize: 11.5,
  textTransform: "uppercase",
  letterSpacing: "0.04em",
  color: "#6b6557",
};

const thNum: React.CSSProperties = {
  ...thLeft,
  textAlign: "right",
};

const tdLeft: React.CSSProperties = {
  padding: "10px 6px",
  borderBottom: "1px solid #f0ede5",
};

const tdNum: React.CSSProperties = {
  ...tdLeft,
  textAlign: "right",
  fontFamily: "JetBrains Mono, monospace",
};

const totalsBox: React.CSSProperties = {
  marginTop: 16,
  marginLeft: "auto",
  width: "60%",
};

const bankBox: React.CSSProperties = {
  marginTop: 18,
  padding: 12,
  background: "#f6f1e3",
  borderRadius: 8,
};

const signatureBox: React.CSSProperties = {
  marginTop: 28,
  display: "grid",
  gridTemplateColumns: "1.5fr 1fr",
  gap: 24,
  alignItems: "flex-end",
};

const btn: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  padding: "8px 14px",
  fontSize: 13,
  fontWeight: 600,
  background: "var(--surface)",
  color: "var(--ink)",
  border: "1px solid var(--line)",
  borderRadius: "var(--r)",
  cursor: "pointer",
  textDecoration: "none",
  fontFamily: "inherit",
};
