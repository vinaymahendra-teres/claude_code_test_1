import Link from "next/link";
import { cookies } from "next/headers";
import { AddCustomerButton } from "./AddCustomerButton";
import { createClient } from "@/utils/supabase/server";
import { PhoneShell } from "@/components/PhoneShell";
import { Card, Avatar, Pill, StatTile, SectionHeader } from "@/components/ui";
import { Icon } from "@/components/Icon";
import { fmtCompactMoney } from "@/lib/format";
import { listActiveBranches } from "@/lib/branches";

export const revalidate = 60;

type CustomerRow = {
  id: string;
  name: string;
  area: string | null;
  tags: string[] | null;
  order_count: number | null;
  lifetime_value: number | null;
  last_order: string | null;
  avatar_tone: string | null;
  marketing_consent: string | null;
  branch_id: string | null;
};

const SORT_KEYS: Record<string, (a: CustomerRow, b: CustomerRow) => number> = {
  recent: (a, b) => (b.last_order ?? "").localeCompare(a.last_order ?? ""),
  ltv: (a, b) => (b.lifetime_value ?? 0) - (a.lifetime_value ?? 0),
  alpha: (a, b) => a.name.localeCompare(b.name),
};

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ sort?: string; branch?: string }>;
}) {
  const { sort: rawSort, branch: rawBranch } = await searchParams;
  const sort = rawSort && SORT_KEYS[rawSort] ? rawSort : "recent";

  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const [{ data: customers }, branchRows] = await Promise.all([
    supabase
      .from("customers")
      .select(
        "id, name, area, tags, order_count, lifetime_value, last_order, avatar_tone, marketing_consent, branch_id",
      ),
    listActiveBranches(),
  ]);
  const branchOptions = branchRows.map((b) => ({
    id: b.id,
    label: b.label,
    community: b.community ?? undefined,
    neighbourhood: b.neighbourhood ?? undefined,
  }));
  const branchById = new Map(branchRows.map((b) => [b.id, b]));
  const activeBranchId = rawBranch && branchById.has(rawBranch) ? rawBranch : null;

  const all = [...((customers as CustomerRow[]) ?? [])];
  const filtered = activeBranchId
    ? all.filter((c) => c.branch_id === activeBranchId)
    : all;
  const list = filtered.sort(SORT_KEYS[sort]);
  const total = list.length;
  const vipCount = list.filter((c) => c.tags?.includes("VIP")).length;
  const avgLtv = total > 0 ? list.reduce((s, c) => s + (c.lifetime_value ?? 0), 0) / total : 0;
  const consentedCount = list.filter((c) => c.marketing_consent === "Y").length;

  return (
    <PhoneShell>
      <div data-screen-label="Customers">
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
            <Link href="/" style={chromeBtn} aria-label="Back">
              <Icon.ChevronLeft size={22} />
            </Link>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: "DM Serif Display, serif", fontSize: 21, lineHeight: 1.15 }}>
                Customers
              </div>
              <div style={{ fontSize: 12.5, color: "var(--muted)", marginTop: 2 }}>
                {total} contacts · {vipCount} VIP · {consentedCount} consented
              </div>
            </div>
            <AddCustomerButton branches={branchOptions} defaultBranchId={activeBranchId ?? undefined} />
          </div>
        </header>

        <div style={{ padding: "10px 18px 8px", borderBottom: "1px solid var(--line-soft)", background: "var(--bg)" }}>
          <BranchChipLinks branches={branchOptions} active={activeBranchId} sort={sort} />
          <div style={{ height: 6 }} />
          <SortTabs current={sort} branch={activeBranchId} />
        </div>

        <div style={{ padding: "12px 18px 100px", overflowY: "auto", flex: 1 }}>
          {/* Quick stats strip */}
          <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
            <StatTile label="Total" value={String(total)} tone="caramel" />
            <StatTile label="VIP" value={String(vipCount)} tone="sage" />
            <StatTile label="Avg LTV" value={fmtCompactMoney(Math.round(avgLtv))} tone="rose" />
          </div>

          {list.length === 0 ? (
            <Card style={{ textAlign: "center", padding: 28 }}>
              <div style={{ fontSize: 13, color: "var(--muted)" }}>
                No customers yet — seed the database from <code>web/scripts/seed.ts</code>.
              </div>
            </Card>
          ) : (
            <Card padding={0}>
              {list.map((c, i) => (
                <Link
                  key={c.id}
                  href={`/customers/${c.id}`}
                  style={{
                    display: "block",
                    padding: "12px 14px",
                    borderBottom: i < list.length - 1 ? "1px solid var(--line-soft)" : "none",
                    textDecoration: "none",
                    color: "inherit",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <Avatar
                      name={c.name}
                      tone={(c.avatar_tone as "caramel" | "rose" | "sage") || "caramel"}
                      size={42}
                    />
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div
                        style={{
                          fontSize: 13.5,
                          fontWeight: 600,
                          display: "flex",
                          gap: 6,
                          alignItems: "center",
                          flexWrap: "wrap",
                        }}
                      >
                        {c.name}
                        {c.tags?.includes("VIP") && <Pill tone="caramel" size="xs">VIP</Pill>}
                        {c.tags?.includes("Eggless") && <Pill tone="sage" size="xs">Eggless</Pill>}
                        {c.tags?.includes("New") && <Pill tone="rose" size="xs">New</Pill>}
                      </div>
                      <div
                        style={{
                          fontSize: 11.5,
                          color: "var(--muted)",
                          marginTop: 3,
                          display: "flex",
                          gap: 8,
                          alignItems: "center",
                        }}
                      >
                        <span>{c.area}</span>
                        <span style={{ width: 3, height: 3, borderRadius: 999, background: "var(--line)" }} />
                        <span>
                          {c.order_count ?? 0} {c.order_count === 1 ? "order" : "orders"}
                        </span>
                        <span style={{ width: 3, height: 3, borderRadius: 999, background: "var(--line)" }} />
                        <span>{fmtCompactMoney(c.lifetime_value ?? 0)}</span>
                      </div>
                    </div>
                    <span
                      title={c.marketing_consent === "Y" ? "Marketing consent granted" : "No marketing consent"}
                      style={{
                        width: 7,
                        height: 7,
                        borderRadius: 999,
                        background: c.marketing_consent === "Y" ? "var(--ok)" : "var(--line)",
                        flexShrink: 0,
                      }}
                    />
                    <Icon.Chevron size={16} style={{ color: "var(--muted)", flexShrink: 0 }} />
                  </div>
                </Link>
              ))}
            </Card>
          )}

          {/* Section header explaining the consent dot */}
          <SectionHeader>Legend</SectionHeader>
          <Card padding={14}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12.5 }}>
              <span style={{ width: 7, height: 7, borderRadius: 999, background: "var(--ok)" }} />
              <span>Marketing consent granted (DPDP Act 2023)</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12.5, marginTop: 6 }}>
              <span style={{ width: 7, height: 7, borderRadius: 999, background: "var(--line)" }} />
              <span style={{ color: "var(--muted)" }}>No consent — excluded from broadcasts</span>
            </div>
          </Card>
        </div>
      </div>
    </PhoneShell>
  );
}

function SortTabs({ current, branch }: { current: string; branch: string | null }) {
  const tabs = [
    { value: "recent", label: "Recent" },
    { value: "ltv", label: "Top spenders" },
    { value: "alpha", label: "A–Z" },
  ];
  const branchQuery = branch ? `&branch=${branch}` : "";
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
      {tabs.map((t) => {
        const active = current === t.value;
        return (
          <Link
            key={t.value}
            href={`/customers?sort=${t.value}${branchQuery}`}
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

function BranchChipLinks({
  branches,
  active,
  sort,
}: {
  branches: { id: string; label: string }[];
  active: string | null;
  sort: string;
}) {
  const opts: Array<{ id: string | null; label: string }> = [
    { id: null, label: "All branches" },
    ...branches,
  ];
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
      {opts.map((o) => {
        const sel = active === o.id;
        const href =
          o.id == null ? `/customers?sort=${sort}` : `/customers?sort=${sort}&branch=${o.id}`;
        return (
          <Link
            key={o.id ?? "__all__"}
            href={href}
            style={{
              padding: "5px 10px",
              fontSize: 12,
              fontWeight: 600,
              borderRadius: 999,
              border: "1.5px solid " + (sel ? "var(--caramel)" : "var(--line)"),
              background: sel ? "var(--caramel)" : "var(--surface)",
              color: sel ? "var(--surface)" : "var(--ink-soft)",
              textDecoration: "none",
            }}
          >
            {o.label}
          </Link>
        );
      })}
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
