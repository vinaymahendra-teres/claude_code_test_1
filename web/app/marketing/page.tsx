import Link from "next/link";
import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import { PhoneShell } from "@/components/PhoneShell";
import { Card, SectionHeader, Pill, StatTile } from "@/components/ui";
import { Icon } from "@/components/Icon";
import { fmtMoney, fmtDate } from "@/lib/format";

export const revalidate = 60;

type Campaign = {
  id: string;
  name: string;
  status: string;
  channels?: string[];
  audience?: string;
  sent?: string;
  endsOn?: string;
  subject?: string;
  preview?: string;
  openRate?: number;
  clickRate?: number;
  orders?: number;
  revenue?: number;
  spend?: number;
};

type Template = {
  id: string;
  name: string;
  preview?: string;
};

const TABS = [
  { value: "campaigns", label: "Campaigns" },
  { value: "templates", label: "Templates" },
];

export default async function MarketingPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab: rawTab } = await searchParams;
  const tab = TABS.some((t) => t.value === rawTab) ? rawTab! : "campaigns";

  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const [{ data: campRows }, { data: tmplRows }] = await Promise.all([
    supabase.from("campaigns").select("data"),
    supabase.from("templates").select("data"),
  ]);

  const campaigns: Campaign[] = (campRows ?? []).map((r) => r.data as Campaign);
  const templates: Template[] = (tmplRows ?? []).map((r) => r.data as Template);

  const live = campaigns.filter((c) => c.status === "live");
  const totalRoasNum =
    campaigns.reduce((s, c) => s + (c.revenue ?? 0), 0);
  const totalSpend = campaigns.reduce((s, c) => s + (c.spend ?? 0), 0);

  return (
    <PhoneShell>
      <div data-screen-label="Marketing">
        <header style={chromeHeader}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, minHeight: 32 }}>
            <Link href="/" style={chromeBtn} aria-label="Back">
              <Icon.ChevronLeft size={22} />
            </Link>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: "var(--font-serif), DM Serif Display, serif", fontSize: 21, lineHeight: 1.15 }}>
                Marketing
              </div>
              <div style={{ fontSize: 12.5, color: "var(--muted)", marginTop: 2 }}>
                {live.length} live · {campaigns.length} total
              </div>
            </div>
          </div>
        </header>

        <div
          style={{
            padding: "10px 18px 8px",
            borderBottom: "1px solid var(--line-soft)",
            background: "var(--bg)",
          }}
        >
          <TabRow current={tab} />
        </div>

        <div style={{ padding: "14px 18px 100px", overflowY: "auto", flex: 1, minHeight: 0 }}>
          {tab === "campaigns" ? (
            <>
              {/* ROAS card */}
              <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
                <StatTile label="Revenue" value={fmtMoney(totalRoasNum)} tone="caramel" />
                <StatTile label="Spend" value={fmtMoney(totalSpend)} tone="rose" />
                <StatTile
                  label="ROAS"
                  value={totalSpend > 0 ? (totalRoasNum / totalSpend).toFixed(1) + "×" : "—"}
                  tone="sage"
                />
              </div>

              <SectionHeader>Campaigns</SectionHeader>
              <Card padding={0}>
                {campaigns.length === 0 && (
                  <div style={{ padding: 18, textAlign: "center", color: "var(--muted)", fontSize: 13 }}>
                    No campaigns yet.
                  </div>
                )}
                {campaigns.map((c, i) => (
                  <div
                    key={c.id}
                    style={{
                      padding: "12px 14px",
                      borderBottom: i < campaigns.length - 1 ? "1px solid var(--line-soft)" : "none",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10 }}>
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <span style={{ fontSize: 13.5, fontWeight: 600 }}>{c.name}</span>
                          <Pill
                            size="xs"
                            tone={c.status === "live" ? "ok" : c.status === "draft" ? "neutral" : "caramel"}
                          >
                            {c.status}
                          </Pill>
                        </div>
                        {c.subject && (
                          <div style={{ fontSize: 12, color: "var(--ink-soft)", marginTop: 4, lineHeight: 1.4 }}>
                            {c.subject}
                          </div>
                        )}
                        <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 4, display: "flex", gap: 6, flexWrap: "wrap" }}>
                          {c.channels?.join(" · ")}
                          {c.audience && <span>· {c.audience}</span>}
                          {c.sent && <span>· sent {fmtDate(c.sent)}</span>}
                        </div>
                      </div>
                    </div>
                    {(c.orders || c.revenue || c.openRate) && (
                      <div
                        style={{
                          marginTop: 10,
                          paddingTop: 10,
                          borderTop: "1px solid var(--line-soft)",
                          display: "flex",
                          gap: 16,
                          fontSize: 11.5,
                        }}
                      >
                        {c.openRate !== undefined && (
                          <span>
                            <span style={{ color: "var(--muted)" }}>open</span>{" "}
                            <b>{Math.round(c.openRate * 100)}%</b>
                          </span>
                        )}
                        {c.clickRate !== undefined && (
                          <span>
                            <span style={{ color: "var(--muted)" }}>click</span>{" "}
                            <b>{Math.round(c.clickRate * 100)}%</b>
                          </span>
                        )}
                        {c.orders !== undefined && (
                          <span>
                            <span style={{ color: "var(--muted)" }}>orders</span> <b>{c.orders}</b>
                          </span>
                        )}
                        {c.revenue !== undefined && (
                          <span style={{ marginLeft: "auto", fontWeight: 600 }}>
                            {fmtMoney(c.revenue)}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </Card>
            </>
          ) : (
            <>
              <SectionHeader>Templates</SectionHeader>
              <Card padding={0}>
                {templates.length === 0 && (
                  <div style={{ padding: 18, textAlign: "center", color: "var(--muted)", fontSize: 13 }}>
                    No templates yet.
                  </div>
                )}
                {templates.map((t, i) => (
                  <div
                    key={t.id}
                    style={{
                      padding: "12px 14px",
                      borderBottom: i < templates.length - 1 ? "1px solid var(--line-soft)" : "none",
                    }}
                  >
                    <div style={{ fontSize: 13.5, fontWeight: 600 }}>{t.name}</div>
                    {t.preview && (
                      <div
                        style={{
                          fontSize: 12,
                          color: "var(--ink-soft)",
                          marginTop: 4,
                          lineHeight: 1.4,
                          fontStyle: "italic",
                        }}
                      >
                        &ldquo;{t.preview}&rdquo;
                      </div>
                    )}
                  </div>
                ))}
              </Card>
            </>
          )}
        </div>
      </div>
    </PhoneShell>
  );
}

function TabRow({ current }: { current: string }) {
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
            href={`/marketing?tab=${t.value}`}
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

const chromeHeader: React.CSSProperties = {
  position: "sticky",
  top: 0,
  background: "var(--bg)",
  padding: "54px 18px 14px",
  borderBottom: "1px solid var(--line-soft)",
  zIndex: 5,
};

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
