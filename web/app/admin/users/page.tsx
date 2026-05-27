import Link from "next/link";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import { auth, hasRole } from "@/auth";
import { PhoneShell } from "@/components/PhoneShell";
import { Card, Pill } from "@/components/ui";
import { Icon } from "@/components/Icon";
import { UserRowActions } from "./UserRowActions";
import { AddUserButton } from "./AddUserButton";
import { fmtRelative } from "@/lib/format";

export const dynamic = "force-dynamic";

type AppUserRow = {
  id: string;
  email: string;
  name: string;
  role: "admin" | "staff" | "viewer";
  created_at: string;
  last_login_at: string | null;
};

export default async function AdminUsersPage() {
  const session = await auth();
  if (!session?.user) redirect("/login?callbackUrl=/admin/users");
  if (!hasRole(session.user.role, "admin")) redirect("/");

  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const { data } = await supabase
    .from("app_users")
    .select("id, email, name, role, created_at, last_login_at")
    .order("created_at", { ascending: true });
  const users = (data as AppUserRow[] | null) ?? [];

  const adminCount = users.filter((u) => u.role === "admin").length;
  const meId = session.user.id;

  return (
    <PhoneShell>
      <div data-screen-label="Users">
        <header style={chromeHeader}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, minHeight: 32 }}>
            <Link href="/" style={chromeBtn} aria-label="Back">
              <Icon.ChevronLeft size={22} />
            </Link>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: "var(--font-serif), DM Serif Display, serif", fontSize: 21, lineHeight: 1.15 }}>
                Users
              </div>
              <div style={{ fontSize: 12.5, color: "var(--muted)", marginTop: 2 }}>
                {users.length} accounts · {adminCount} admin
              </div>
            </div>
            <AddUserButton />
          </div>
        </header>

        <div style={{ padding: "12px 18px 100px", overflowY: "auto", flex: 1, minHeight: 0 }}>
          <Card padding={0}>
            {users.map((u, i) => (
              <div
                key={u.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "12px 14px",
                  borderBottom: i < users.length - 1 ? "1px solid var(--line-soft)" : "none",
                }}
              >
                <span
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 999,
                    background:
                      u.role === "admin"
                        ? "var(--caramel-soft)"
                        : u.role === "staff"
                          ? "var(--rose-soft)"
                          : "var(--sage-soft)",
                    color:
                      u.role === "admin"
                        ? "var(--caramel-deep)"
                        : u.role === "staff"
                          ? "oklch(0.38 0.10 25)"
                          : "oklch(0.34 0.07 145)",
                    display: "grid",
                    placeItems: "center",
                    fontWeight: 700,
                    fontSize: 13,
                    flexShrink: 0,
                  }}
                >
                  {u.name
                    .split(" ")
                    .slice(0, 2)
                    .map((s) => s[0])
                    .join("")
                    .toUpperCase()}
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}
                  >
                    <span style={{ fontSize: 13.5, fontWeight: 600 }}>{u.name}</span>
                    {u.id === meId && (
                      <Pill tone="neutral" size="xs">
                        you
                      </Pill>
                    )}
                    <Pill
                      tone={u.role === "admin" ? "caramel" : u.role === "staff" ? "rose" : "sage"}
                      size="xs"
                    >
                      {u.role}
                    </Pill>
                  </div>
                  <div style={{ fontSize: 11.5, color: "var(--muted)", marginTop: 2 }}>
                    {u.email}
                  </div>
                  <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 1 }}>
                    {u.last_login_at
                      ? `last seen ${fmtRelative(u.last_login_at.slice(0, 10))}`
                      : "never signed in"}
                  </div>
                </div>
                <UserRowActions
                  user={{ id: u.id, name: u.name, email: u.email, role: u.role }}
                  isSelf={u.id === meId}
                  isLastAdmin={u.role === "admin" && adminCount <= 1}
                />
              </div>
            ))}
          </Card>

          <div
            style={{
              marginTop: 18,
              padding: 12,
              background: "var(--surface-2)",
              border: "1px dashed var(--line)",
              borderRadius: "var(--r)",
              fontSize: 12,
              color: "var(--muted)",
              lineHeight: 1.5,
            }}
          >
            Only admins reach this screen. Sessions stay valid for 30 days; rotating a password
            doesn&rsquo;t kick existing sessions — share the new value out of band.
          </div>
        </div>
      </div>
    </PhoneShell>
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
