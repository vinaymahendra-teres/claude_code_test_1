"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Card, Pill } from "@/components/ui";
import { Sheet, TextInput, Button, SegmentedControl } from "@/components/ui-client";
import { Icon } from "@/components/Icon";
import { fmtMoney, fmtDate } from "@/lib/format";
import { createInvoiceForOrder, createReceiptForOrder } from "@/lib/billing-actions";

type Invoice = {
  id: string;
  number: string;
  status: string;
  total: number;
  amount_paid: number;
  issue_date: string;
};

type Receipt = {
  id: string;
  number: string;
  amount: number;
  method: string | null;
  receipt_date: string;
};

const METHODS = ["UPI", "Cash", "Card", "Bank transfer"];

export function BillingSection({
  orderId,
  balance,
  invoices,
  receipts,
}: {
  orderId: string;
  balance: number;
  invoices: Invoice[];
  receipts: Receipt[];
}) {
  const router = useRouter();
  const [genPending, startGen] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [paySheetOpen, setPaySheetOpen] = useState(false);

  function generateInvoice() {
    setError(null);
    startGen(async () => {
      try {
        const id = await createInvoiceForOrder(orderId);
        router.push(`/invoices/${id}`);
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
      }
    });
  }

  return (
    <>
      <Card padding={14}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <div>
            <div style={{ fontSize: 11.5, color: "var(--muted)", letterSpacing: "0.04em", textTransform: "uppercase" }}>
              Balance due
            </div>
            <div style={{ fontFamily: "var(--font-serif), DM Serif Display, serif", fontSize: 22, color: balance > 0 ? "var(--danger)" : "var(--ok)" }}>
              {fmtMoney(balance)}
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button type="button" onClick={generateInvoice} disabled={genPending} style={pillBtn("caramel")}>
              <Icon.Doc size={14} /> {genPending ? "Issuing…" : "Generate invoice"}
            </button>
            <button type="button" onClick={() => setPaySheetOpen(true)} style={pillBtn("sage")}>
              <Icon.Wallet size={14} /> Record payment
            </button>
          </div>
        </div>

        {error && (
          <div
            style={{
              marginTop: 10,
              padding: 10,
              background: "oklch(0.94 0.05 28)",
              border: "1px solid var(--danger)",
              borderRadius: "var(--r)",
              fontSize: 12.5,
              color: "var(--danger)",
            }}
          >
            {error}
          </div>
        )}

        {invoices.length > 0 && (
          <>
            <div style={subHeader}>Invoices</div>
            {invoices.map((i) => (
              <Link key={i.id} href={`/invoices/${i.id}`} style={billLink}>
                <div>
                  <div style={{ fontSize: 13.5, fontWeight: 600 }}>{i.number}</div>
                  <div style={{ fontSize: 11.5, color: "var(--muted)", marginTop: 2 }}>
                    issued {fmtDate(i.issue_date, { showYear: true })}
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 13, fontWeight: 600 }}>{fmtMoney(i.total)}</span>
                  <Pill
                    size="xs"
                    tone={i.status === "paid" ? "ok" : i.status === "issued" ? "caramel" : "neutral"}
                  >
                    {i.status}
                  </Pill>
                  <Icon.Chevron size={14} style={{ color: "var(--muted)" }} />
                </div>
              </Link>
            ))}
          </>
        )}

        {receipts.length > 0 && (
          <>
            <div style={subHeader}>Receipts</div>
            {receipts.map((r) => (
              <Link key={r.id} href={`/receipts/${r.id}`} style={billLink}>
                <div>
                  <div style={{ fontSize: 13.5, fontWeight: 600 }}>{r.number}</div>
                  <div style={{ fontSize: 11.5, color: "var(--muted)", marginTop: 2 }}>
                    {fmtDate(r.receipt_date, { showYear: true })}
                    {r.method ? ` · ${r.method}` : ""}
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 13, fontWeight: 600 }}>{fmtMoney(r.amount)}</span>
                  <Icon.Chevron size={14} style={{ color: "var(--muted)" }} />
                </div>
              </Link>
            ))}
          </>
        )}
      </Card>

      <RecordPaymentSheet
        open={paySheetOpen}
        orderId={orderId}
        suggestedAmount={balance}
        invoices={invoices}
        onClose={() => setPaySheetOpen(false)}
      />
    </>
  );
}

function RecordPaymentSheet({
  open,
  orderId,
  suggestedAmount,
  invoices,
  onClose,
}: {
  open: boolean;
  orderId: string;
  suggestedAmount: number;
  invoices: Invoice[];
  onClose: () => void;
}) {
  const router = useRouter();
  const [amount, setAmount] = useState(String(Math.max(0, suggestedAmount)));
  const [method, setMethod] = useState("UPI");
  const [utr, setUtr] = useState("");
  const [vpa, setVpa] = useState("");
  const [notes, setNotes] = useState("");
  // Default to the most-recent unpaid invoice when one exists.
  const defaultInvoice = invoices.find((i) => i.status !== "paid")?.id ?? "";
  const [invoiceId, setInvoiceId] = useState(defaultInvoice);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function close() {
    setAmount(String(Math.max(0, suggestedAmount)));
    setMethod("UPI");
    setUtr("");
    setVpa("");
    setNotes("");
    setInvoiceId(defaultInvoice);
    setError(null);
    onClose();
  }

  function submit() {
    setError(null);
    const amt = parseFloat(amount);
    if (!isFinite(amt) || amt <= 0) {
      setError("Amount must be greater than zero");
      return;
    }
    startTransition(async () => {
      try {
        const id = await createReceiptForOrder({
          orderId,
          amount: amt,
          method,
          upiReferenceUtr: utr,
          payerVpa: vpa,
          notes,
          invoiceId: invoiceId || undefined,
        });
        onClose();
        router.push(`/receipts/${id}`);
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
      }
    });
  }

  return (
    <Sheet open={open} onClose={close} title="Record payment">
      <div style={{ paddingBottom: 24 }}>
        <FieldLite label="Amount received">
          <TextInput
            value={amount}
            onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ""))}
            prefix="₹"
            autoFocus
            style={{
              fontSize: 22,
              padding: "14px 12px",
              fontWeight: 600,
              fontFamily: "var(--font-serif), DM Serif Display, serif",
            }}
          />
        </FieldLite>

        <FieldLite label="Method">
          <SegmentedControl value={method} onChange={setMethod} options={METHODS} />
        </FieldLite>

        {method === "UPI" && (
          <>
            <FieldLite label="UPI reference (UTR)" optional>
              <TextInput
                value={utr}
                onChange={(e) => setUtr(e.target.value.replace(/[^0-9]/g, "").slice(0, 12))}
                placeholder="12-digit"
              />
            </FieldLite>
            <FieldLite label="Payer VPA" optional>
              <TextInput value={vpa} onChange={(e) => setVpa(e.target.value)} placeholder="name@bank" />
            </FieldLite>
          </>
        )}

        {invoices.length > 0 && (
          <FieldLite label="Apply against invoice" optional>
            <select
              value={invoiceId}
              onChange={(e) => setInvoiceId(e.target.value)}
              style={{
                width: "100%",
                padding: 12,
                background: "var(--surface)",
                border: "1px solid var(--line)",
                borderRadius: "var(--r)",
                fontSize: 14,
                fontFamily: "inherit",
              }}
            >
              <option value="">— receipt only —</option>
              {invoices.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.number} · {fmtMoney(i.total)}
                </option>
              ))}
            </select>
          </FieldLite>
        )}

        <FieldLite label="Notes" optional>
          <TextInput multiline value={notes} onChange={(e) => setNotes(e.target.value)} />
        </FieldLite>

        {error && (
          <div
            style={{
              padding: 10,
              background: "oklch(0.94 0.05 28)",
              border: "1px solid var(--danger)",
              borderRadius: "var(--r)",
              fontSize: 12.5,
              color: "var(--danger)",
              marginBottom: 12,
            }}
          >
            {error}
          </div>
        )}

        <div style={{ display: "flex", gap: 10 }}>
          <Button variant="secondary" size="lg" full onClick={close}>
            Cancel
          </Button>
          <Button variant="primary" size="lg" full onClick={submit} disabled={isPending}>
            {isPending ? "Recording…" : "Record + open receipt"}
          </Button>
        </div>
      </div>
    </Sheet>
  );
}

function FieldLite({
  label,
  optional,
  children,
}: {
  label: string;
  optional?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label style={{ display: "block", marginBottom: 14 }}>
      <div style={{ fontSize: 12.5, fontWeight: 600, color: "var(--ink-soft)", marginBottom: 6 }}>
        {label}
        {optional && (
          <span style={{ fontSize: 11, color: "var(--muted)", fontWeight: 500, marginLeft: 6 }}>
            optional
          </span>
        )}
      </div>
      {children}
    </label>
  );
}

function pillBtn(tone: "caramel" | "sage"): React.CSSProperties {
  const palette = {
    caramel: { bg: "var(--caramel-soft)", fg: "var(--caramel-deep)", border: "var(--caramel)" },
    sage: { bg: "var(--sage-soft)", fg: "oklch(0.34 0.07 145)", border: "var(--sage)" },
  } as const;
  return {
    display: "inline-flex",
    alignItems: "center",
    gap: 5,
    padding: "8px 14px",
    fontSize: 13,
    fontWeight: 600,
    background: palette[tone].bg,
    color: palette[tone].fg,
    border: `1px solid ${palette[tone].border}`,
    borderRadius: "var(--r)",
    cursor: "pointer",
    fontFamily: "inherit",
  };
}

const subHeader: React.CSSProperties = {
  fontSize: 11.5,
  color: "var(--muted)",
  letterSpacing: "0.04em",
  textTransform: "uppercase",
  marginTop: 14,
  marginBottom: 6,
};

const billLink: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: "10px 0",
  borderTop: "1px solid var(--line-soft)",
  textDecoration: "none",
  color: "inherit",
};
