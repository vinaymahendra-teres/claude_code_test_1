import Link from "next/link";
import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import { Icon } from "@/components/Icon";
import { BrandLogo } from "@/components/BrandLogo";
import { fmtMoney, fmtDate } from "@/lib/format";

export const dynamic = "force-dynamic";

type Receipt = {
  id: string;
  number: string;
  branch_id: string;
  order_id: string | null;
  invoice_id: string | null;
  receipt_date: string;
  amount: number;
  method: string | null;
  upi_reference_utr: string | null;
  payer_vpa: string | null;
  notes: string | null;
  customer_snapshot: {
    name?: string;
    phone?: string;
    area?: string;
    address_detail?: string;
  } | null;
  branch_snapshot: {
    label?: string;
    community?: string;
    address?: string;
    gstin?: string;
    bank_upi?: string;
    signature_label?: string;
  } | null;
};

export default async function ReceiptPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const { data } = await supabase
    .from("payment_receipts")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (!data) notFound();
  const r = data as Receipt;
  const customer = r.customer_snapshot ?? {};
  const branch = r.branch_snapshot ?? {};

  return (
    <div style={{ background: "#f6f4ef", minHeight: "100dvh", padding: "24px 16px 60px" }}>
      <div style={pageStyle}>
        <header style={headerStyle}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <BrandLogo size={56} />
            <div>
              <div style={brandName}>Tiered Cake Company</div>
              <div style={brandSub}>{branch.label ?? "—"} · {branch.community ?? ""}</div>
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={badgeLabel}>Payment receipt</div>
            <div style={number}>{r.number}</div>
            <div style={metaLine}>
              Received <strong>{fmtDate(r.receipt_date, { showYear: true })}</strong>
            </div>
          </div>
        </header>

        <section style={{ marginTop: 22 }}>
          <div style={sectionLabel}>Received from</div>
          <div style={partyName}>{customer.name ?? "—"}</div>
          <div style={partyLines}>
            {customer.address_detail && <div>{customer.address_detail}</div>}
            {customer.area && <div>{customer.area}</div>}
            {customer.phone && <div>Phone: {customer.phone}</div>}
          </div>
        </section>

        <section
          style={{
            marginTop: 22,
            padding: 18,
            background: "#fdf5e4",
            borderRadius: 10,
            border: "1px solid #ebd9b4",
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase", color: "#7a5400" }}>
            Amount received
          </div>
          <div
            style={{
              fontFamily: "DM Serif Display, serif",
              fontSize: 40,
              color: "#7a5400",
              marginTop: 4,
            }}
          >
            {fmtMoney(r.amount)}
          </div>
          <div style={{ fontSize: 12.5, color: "#7a5400", marginTop: 4 }}>
            {r.method ?? "—"}
            {r.upi_reference_utr ? ` · UTR ${r.upi_reference_utr}` : ""}
          </div>
        </section>

        {(r.payer_vpa || r.notes || r.invoice_id || r.order_id) && (
          <section style={{ marginTop: 18, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
            <div>
              <div style={sectionLabel}>Reference</div>
              {r.invoice_id && (
                <div style={partyLines}>
                  Invoice <strong>{r.invoice_id}</strong>
                </div>
              )}
              {r.order_id && (
                <div style={partyLines}>
                  Order <strong>#{r.order_id.replace(/^o-?/, "")}</strong>
                </div>
              )}
              {r.payer_vpa && <div style={partyLines}>Payer VPA: {r.payer_vpa}</div>}
            </div>
            {r.notes && (
              <div>
                <div style={sectionLabel}>Notes</div>
                <div style={partyLines}>{r.notes}</div>
              </div>
            )}
          </section>
        )}

        <section style={signatureBox}>
          <div style={{ fontSize: 11, color: "#6b6557" }}>
            Thank you for your payment. This is a system-generated receipt.
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ borderTop: "1px solid #b9b1a0", paddingTop: 6, fontSize: 12 }}>
              {branch.signature_label ?? branch.label ?? "Authorised signatory"}
            </div>
          </div>
        </section>

        <div
          className="no-print"
          style={{ marginTop: 24, display: "flex", gap: 8, justifyContent: "flex-end" }}
        >
          <Link href={r.order_id ? `/orders/${r.order_id}` : "/orders"} style={btn}>
            <Icon.ChevronLeft size={14} /> Back
          </Link>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              window.print();
            }}
            style={{ ...btn, background: "var(--caramel)", color: "var(--surface)", border: "none" }}
          >
            <Icon.Doc size={14} /> Print / Save PDF
          </button>
        </div>
      </div>

      <style>{`@media print { body { background: #fff !important; } .no-print { display: none !important; } }`}</style>
    </div>
  );
}

// ---- styles ----

const pageStyle: React.CSSProperties = {
  maxWidth: 600,
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

const badgeLabel: React.CSSProperties = {
  fontSize: 11,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  color: "#6b6557",
};

const number: React.CSSProperties = {
  fontFamily: "DM Serif Display, serif",
  fontSize: 22,
  lineHeight: 1.15,
};

const metaLine: React.CSSProperties = {
  fontSize: 12,
  color: "#3d3a35",
  marginTop: 2,
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

const signatureBox: React.CSSProperties = {
  marginTop: 30,
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
