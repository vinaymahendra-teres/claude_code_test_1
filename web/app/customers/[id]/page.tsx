import Link from "next/link";
import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import { PhoneShell } from "@/components/PhoneShell";
import { Card, CakeArt, StatusPill, SectionHeader, Pill, Avatar } from "@/components/ui";
import { Icon } from "@/components/Icon";
import { fmtMoney, fmtCompactMoney, fmtDate } from "@/lib/format";
import { toggleConsent, deleteCustomer } from "./actions";
import { EditCustomerSheet } from "./EditCustomerSheet";
import { ConfirmDelete } from "@/components/ConfirmDelete";
import { listActiveBranches } from "@/lib/branches";
import type { BranchOption } from "@/components/BranchPicker";

export const dynamic = "force-dynamic";

type Customer = {
  id: string;
  name: string;
  phone: string | null;
  instagram: string | null;
  area: string | null;
  tags: string[] | null;
  since: string | null;
  order_count: number | null;
  lifetime_value: number | null;
  last_order: string | null;
  preferred_flavors: string[] | null;
  notes: string | null;
  avatar_tone: string | null;
  marketing_consent: string | null;
  consent_date: string | null;
};

type Order = {
  id: string;
  title: string | null;
  flavor: string | null;
  price: number | null;
  delivery_date: string | null;
  delivery_slot: string | null;
  status: string;
};

const TABS = [
  { value: "overview", label: "Overview" },
  { value: "orders", label: "Orders" },
];

export default async function CustomerDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { id } = await params;
  const { tab: rawTab } = await searchParams;
  const tab = TABS.some((t) => t.value === rawTab) ? rawTab! : "overview";

  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { data: customer } = await supabase
    .from("customers")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!customer) notFound();
  const c = customer as Customer;

  const [{ data: orders }, branchList] = await Promise.all([
    supabase
      .from("orders")
      .select("id, title, flavor, price, delivery_date, delivery_slot, status")
      .eq("customer_id", id)
      .order("created_at", { ascending: false }),
    listActiveBranches(),
  ]);
  const ordersList = (orders as Order[]) ?? [];
  const branchOptions: BranchOption[] = branchList.map((b) => ({
    id: b.id,
    label: b.label,
    community: b.community ?? undefined,
    neighbourhood: b.neighbourhood ?? undefined,
  }));

  return (
    <PhoneShell>
      <div data-screen-label="Customer Detail">
        <header
          style={{
            position: "sticky",
            top: 0,
            background: "var(--bg)",
            padding: "54px 18px 14px",
            borderBottom: "1px solid var(--line-soft)",
            zIndex: 5,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 6, minHeight: 32 }}>
            <Link href="/customers" style={chromeBtn} aria-label="Back">
              <Icon.ChevronLeft size={22} />
            </Link>
          </div>
        </header>

        <div style={{ padding: "0 0 100px", overflowY: "auto", flex: 1 }}>
          {/* Profile hero */}
          <div style={{ padding: "12px 22px 20px", textAlign: "center" }}>
            <Avatar
              name={c.name}
              tone={(c.avatar_tone as "caramel" | "rose" | "sage") || "caramel"}
              size={84}
              style={{ margin: "0 auto 12px", fontSize: 28 }}
            />
            <h2 style={{ fontFamily: "DM Serif Display, serif", fontSize: 24, margin: 0 }}>{c.name}</h2>
            <div style={{ fontSize: 13, color: "var(--muted)", marginTop: 4 }}>
              {c.area}
              {c.since && ` · since ${fmtDate(c.since, { showYear: true })}`}
            </div>
            <div style={{ display: "flex", justifyContent: "center", gap: 6, marginTop: 10, flexWrap: "wrap" }}>
              {c.tags?.map((t) => (
                <Pill
                  key={t}
                  tone={t === "VIP" ? "caramel" : t === "Eggless" ? "sage" : t === "New" ? "rose" : "neutral"}
                >
                  {t}
                </Pill>
              ))}
            </div>
          </div>

          {/* Quick contact actions */}
          <div style={{ padding: "0 18px" }}>
            <Card padding={0}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)" }}>
                <ContactBtn href={c.phone ? `tel:${c.phone}` : "#"} icon={<Icon.Phone size={18} />} label="Call" disabled={!c.phone} />
                <ContactBtn href={c.phone ? `https://wa.me/${c.phone.replace(/\D/g, "")}` : "#"} icon={<Icon.Whatsapp size={18} />} label="WhatsApp" disabled={!c.phone} />
                <ContactBtn href={c.instagram ? `https://instagram.com/${c.instagram.replace(/^@/, "")}` : "#"} icon={<Icon.Instagram size={18} />} label="DM" disabled={!c.instagram} />
                <ContactBtn href="/" icon={<Icon.Cake size={18} />} label="New order" last />
              </div>
            </Card>
          </div>

          {/* Edit / Delete row */}
          <div style={{ padding: "0 18px", display: "flex", gap: 8, marginTop: 12 }}>
            <EditCustomerSheet
              customerId={id}
              initial={{
                name: c.name,
                phone: c.phone ?? "",
                instagram: c.instagram ?? "",
                branchId: (c as { branch_id?: string }).branch_id ?? "",
                addressDetail:
                  (c as { address_detail?: string }).address_detail ?? c.area ?? "",
                tags: c.tags ?? [],
                notes: c.notes ?? "",
              }}
              branches={branchOptions}
            />
            <ConfirmDelete
              label={c.name}
              description={`Removes this customer permanently. Their past orders stay, but lose the link to this profile.`}
              confirmWord="DELETE"
              buttonLabel="Delete customer"
              onConfirm={deleteCustomer.bind(null, id)}
            />
          </div>

          {/* Tabs */}
          <div style={{ padding: "14px 18px 8px" }}>
            <TabRow current={tab} customerId={id} />
          </div>

          <div style={{ padding: "4px 18px" }}>
            {tab === "overview" && <OverviewTab c={c} orders={ordersList} />}
            {tab === "orders" && <OrdersTab orders={ordersList} avatarTone={c.avatar_tone} />}
          </div>
        </div>
      </div>
    </PhoneShell>
  );
}


function OverviewTab({ c, orders }: { c: Customer; orders: Order[] }) {
  const inProgress = orders.filter(
    (o) => o.status === "in-production" || o.status === "confirmed" || o.status === "ready",
  );
  const nextConsent: "Y" | "N" = c.marketing_consent === "Y" ? "N" : "Y";
  const boundAction = toggleConsent.bind(null, c.id, nextConsent);

  return (
    <div>
      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, marginTop: 4 }}>
        <Card padding={12}>
          <StatLine label="Orders" value={String(c.order_count ?? 0)} />
        </Card>
        <Card padding={12}>
          <StatLine label="Spent" value={fmtCompactMoney(c.lifetime_value ?? 0)} />
        </Card>
        <Card padding={12}>
          <StatLine label="Last" value={fmtDate(c.last_order)} />
        </Card>
      </div>

      {inProgress.length > 0 && (
        <>
          <SectionHeader>Active order</SectionHeader>
          <Card padding={0}>
            <Link
              href={`/orders/${inProgress[0].id}`}
              style={{ display: "block", padding: 14, textDecoration: "none", color: "inherit" }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <CakeArt
                  tone={(c.avatar_tone as "caramel" | "rose" | "sage" | "plum") || "caramel"}
                  size={48}
                  label={(inProgress[0].flavor ?? "").split(" ")[0]}
                />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 600 }}>{inProgress[0].title}</div>
                  <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 3 }}>
                    {fmtDate(inProgress[0].delivery_date)} · {inProgress[0].delivery_slot}
                  </div>
                  <div style={{ marginTop: 6 }}>
                    <StatusPill status={inProgress[0].status} />
                  </div>
                </div>
                <Icon.Chevron size={16} style={{ color: "var(--muted)" }} />
              </div>
            </Link>
          </Card>
        </>
      )}

      <SectionHeader>Profile</SectionHeader>
      <Card padding={0}>
        <ProfileRow label="Phone" value={c.phone ?? "—"} icon={<Icon.Phone size={15} />} />
        <ProfileRow label="Instagram" value={c.instagram ?? "—"} icon={<Icon.Instagram size={15} />} />
        <ProfileRow label="Area" value={c.area ?? "—"} icon={<Icon.Pin size={15} />} />
        <ProfileRow
          label="Loves"
          value={(c.preferred_flavors ?? []).join(", ") || "—"}
          icon={<Icon.Heart size={15} />}
          last
        />
      </Card>

      {c.notes && (
        <>
          <SectionHeader>Notes</SectionHeader>
          <Card padding={14}>
            <div style={{ fontSize: 13.5, lineHeight: 1.55, fontStyle: "italic", color: "var(--ink-soft)" }}>
              &ldquo;{c.notes}&rdquo;
            </div>
          </Card>
        </>
      )}

      {/* DPDP — marketing consent. Server Action wired below. */}
      <SectionHeader>Compliance</SectionHeader>
      <Card padding={14}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <div style={{ minWidth: 0 }}>
            <div
              style={{
                fontSize: 11,
                color: "var(--muted)",
                letterSpacing: "0.04em",
                textTransform: "uppercase",
              }}
            >
              Marketing consent
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4 }}>
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 999,
                  background: c.marketing_consent === "Y" ? "var(--ok)" : "var(--line)",
                }}
              />
              <span style={{ fontSize: 14, fontWeight: 600 }}>
                {c.marketing_consent === "Y" ? "Granted" : "Not granted"}
              </span>
              {c.consent_date && (
                <span style={{ fontSize: 11.5, color: "var(--muted)" }}>
                  · since {fmtDate(c.consent_date, { showYear: true })}
                </span>
              )}
            </div>
            <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 6, lineHeight: 1.4 }}>
              DPDP Act 2023 — explicit consent required for campaigns, broadcasts, birthday auto-reminders.
            </div>
          </div>
          <form action={boundAction}>
            <button
              type="submit"
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                borderRadius: "var(--r)",
                fontFamily: "inherit",
                fontWeight: 600,
                cursor: "pointer",
                transition: "background .12s",
                padding: "7px 12px",
                fontSize: 13,
                height: 32,
                background: c.marketing_consent === "Y" ? "var(--surface)" : "var(--caramel)",
                color: c.marketing_consent === "Y" ? "var(--ink)" : "var(--surface)",
                border:
                  "1px solid " +
                  (c.marketing_consent === "Y" ? "var(--line)" : "var(--caramel-deep)"),
                boxShadow:
                  c.marketing_consent === "Y"
                    ? "none"
                    : "inset 0 1px 0 oklch(0.99 0.01 75 / 0.25), 0 1px 2px oklch(0.40 0.12 50 / 0.20)",
              }}
            >
              {c.marketing_consent === "Y" ? "Revoke" : "Request"}
            </button>
          </form>
        </div>
      </Card>
    </div>
  );
}

function OrdersTab({ orders, avatarTone }: { orders: Order[]; avatarTone: string | null }) {
  if (orders.length === 0) {
    return (
      <Card style={{ marginTop: 4, textAlign: "center", padding: 20 }}>
        <div style={{ color: "var(--muted)", fontSize: 13 }}>No orders yet</div>
      </Card>
    );
  }
  return (
    <Card padding={0} style={{ marginTop: 4 }}>
      {orders.map((o, i) => (
        <Link
          key={o.id}
          href={`/orders/${o.id}`}
          style={{
            display: "block",
            padding: "11px 14px",
            borderBottom: i < orders.length - 1 ? "1px solid var(--line-soft)" : "none",
            textDecoration: "none",
            color: "inherit",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <CakeArt
              tone={(avatarTone as "caramel" | "rose" | "sage" | "plum") || "caramel"}
              size={44}
              label={(o.flavor ?? "").split(" ")[0]}
            />
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ fontSize: 13.5, fontWeight: 600, lineHeight: 1.3 }}>{o.title}</div>
              <div style={{ fontSize: 11.5, color: "var(--muted)", marginTop: 3 }}>
                {fmtDate(o.delivery_date, { showYear: true })} · {fmtMoney(o.price ?? 0)}
              </div>
              <div style={{ marginTop: 5 }}>
                <StatusPill status={o.status} dot={false} />
              </div>
            </div>
          </div>
        </Link>
      ))}
    </Card>
  );
}

function TabRow({ current, customerId }: { current: string; customerId: string }) {
  return (
    <div
      style={{
        display: "inline-flex",
        background: "var(--surface-3)",
        padding: 3,
        borderRadius: "var(--r)",
        gap: 2,
        width: "100%",
      }}
    >
      {TABS.map((t) => {
        const active = current === t.value;
        return (
          <Link
            key={t.value}
            href={`/customers/${customerId}?tab=${t.value}`}
            style={{
              flex: 1,
              padding: "7px 10px",
              fontSize: 13,
              fontWeight: 600,
              textAlign: "center",
              textDecoration: "none",
              borderRadius: "calc(var(--r) - 3px)",
              background: active ? "var(--surface)" : "transparent",
              color: active ? "var(--ink)" : "var(--ink-soft)",
              boxShadow: active ? "var(--shadow-sm)" : "none",
            }}
          >
            {t.label}
          </Link>
        );
      })}
    </div>
  );
}

function ContactBtn({
  href,
  icon,
  label,
  last,
  disabled,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  last?: boolean;
  disabled?: boolean;
}) {
  return (
    <a
      href={disabled ? "#" : href}
      target={href.startsWith("http") ? "_blank" : undefined}
      rel="noreferrer"
      style={{
        padding: "12px 0",
        background: "transparent",
        textDecoration: "none",
        color: disabled ? "var(--muted)" : "inherit",
        borderRight: last ? "none" : "1px solid var(--line-soft)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 4,
        pointerEvents: disabled ? "none" : "auto",
      }}
    >
      <span style={{ color: disabled ? "var(--muted)" : "var(--caramel-deep)" }}>{icon}</span>
      <span style={{ fontSize: 11, fontWeight: 600 }}>{label}</span>
    </a>
  );
}

function StatLine({ label, value }: { label: string; value: string }) {
  return (
    <>
      <div
        style={{
          fontSize: 10.5,
          color: "var(--muted)",
          letterSpacing: "0.04em",
          textTransform: "uppercase",
        }}
      >
        {label}
      </div>
      <div style={{ fontFamily: "DM Serif Display, serif", fontSize: 22, marginTop: 4 }}>{value}</div>
    </>
  );
}

function ProfileRow({
  label,
  value,
  icon,
  last,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  last?: boolean;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "11px 14px",
        borderBottom: last ? "none" : "1px solid var(--line-soft)",
      }}
    >
      <span style={{ color: "var(--muted)" }}>{icon}</span>
      <div style={{ flex: 1 }}>
        <div
          style={{
            fontSize: 11,
            color: "var(--muted)",
            letterSpacing: "0.04em",
            textTransform: "uppercase",
          }}
        >
          {label}
        </div>
        <div style={{ fontSize: 13.5, marginTop: 1 }}>{value}</div>
      </div>
    </div>
  );
}

const chromeBtn: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  width: 36,
  height: 36,
  borderRadius: 999,
  background: "transparent",
  color: "var(--ink)",
  textDecoration: "none",
};
