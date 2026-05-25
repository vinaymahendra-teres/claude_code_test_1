"use client";

import { useState, useTransition } from "react";
import { Field } from "@/components/ui";
import { Sheet, TextInput, Button } from "@/components/ui-client";
import { Icon } from "@/components/Icon";
import { ConfirmDelete } from "@/components/ConfirmDelete";
import { deleteAppUser, resetUserPassword, updateUserRole } from "./actions";

const ROLES = ["admin", "staff", "viewer"] as const;
type Role = (typeof ROLES)[number];

export function UserRowActions({
  user,
  isSelf,
  isLastAdmin,
}: {
  user: { id: string; name: string; email: string; role: Role };
  isSelf: boolean;
  isLastAdmin: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"menu" | "role" | "password">("menu");
  const [role, setRole] = useState<Role>(user.role);
  const [pw, setPw] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function close() {
    setMode("menu");
    setRole(user.role);
    setPw("");
    setError(null);
    setOpen(false);
  }

  function saveRole() {
    setError(null);
    startTransition(async () => {
      try {
        await updateUserRole(user.id, role);
        close();
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
      }
    });
  }

  function savePassword() {
    setError(null);
    if (pw.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    startTransition(async () => {
      try {
        await resetUserPassword(user.id, pw);
        close();
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
      }
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={`Actions for ${user.name}`}
        title="Actions"
        style={iconBtn}
      >
        <Icon.More size={16} />
      </button>

      <Sheet open={open} onClose={close} title={user.name}>
        {mode === "menu" && (
          <div style={{ paddingBottom: 24 }}>
            <div style={{ fontSize: 12.5, color: "var(--muted)", marginBottom: 12 }}>
              {user.email} · {user.role}
            </div>

            <button
              type="button"
              onClick={() => setMode("role")}
              style={actionRow("caramel")}
            >
              <Icon.Edit size={18} />
              <div>
                <div style={rowLabel}>Change role</div>
                <div style={rowDesc}>
                  Promote or demote between admin / staff / viewer
                </div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setMode("password")}
              style={actionRow("rose")}
            >
              <Icon.Sparkle size={18} />
              <div>
                <div style={rowLabel}>Rotate password</div>
                <div style={rowDesc}>Set a new password; existing sessions stay valid</div>
              </div>
            </button>

            <div style={{ height: 1, background: "var(--line-soft)", margin: "12px 0" }} />

            {isSelf ? (
              <div
                style={{
                  fontSize: 12,
                  color: "var(--muted)",
                  padding: "8px 4px",
                  textAlign: "center",
                }}
              >
                You can&rsquo;t delete your own account from here.
              </div>
            ) : isLastAdmin ? (
              <div
                style={{
                  fontSize: 12,
                  color: "var(--muted)",
                  padding: "8px 4px",
                  textAlign: "center",
                }}
              >
                This is the last admin — can&rsquo;t delete.
              </div>
            ) : (
              <ConfirmDelete
                label={user.name}
                description={`Permanently removes the ${user.role} account for ${user.email}.`}
                confirmWord={user.email}
                buttonLabel="Delete user"
                onConfirm={async () => {
                  await deleteAppUser(user.id);
                  close();
                }}
              />
            )}

            <div style={{ marginTop: 14 }}>
              <Button variant="secondary" size="lg" full onClick={close}>
                Close
              </Button>
            </div>
          </div>
        )}

        {mode === "role" && (
          <div style={{ paddingBottom: 24 }}>
            <button onClick={() => setMode("menu")} type="button" style={backLink}>
              <Icon.ChevronLeft size={14} /> Back
            </button>
            <Field label="Role">
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {ROLES.map((r) => {
                  const sel = role === r;
                  const disabled = isSelf && r !== "admin" && user.role === "admin";
                  return (
                    <button
                      key={r}
                      type="button"
                      disabled={disabled}
                      onClick={() => setRole(r)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        padding: "10px 12px",
                        borderRadius: "var(--r)",
                        border: "1.5px solid " + (sel ? "var(--caramel)" : "var(--line)"),
                        background: sel ? "var(--caramel-soft)" : "var(--surface)",
                        color: disabled ? "var(--muted)" : "var(--ink)",
                        cursor: disabled ? "not-allowed" : "pointer",
                        opacity: disabled ? 0.6 : 1,
                        fontFamily: "inherit",
                      }}
                    >
                      <span
                        style={{
                          width: 18,
                          height: 18,
                          borderRadius: 999,
                          border: "1.5px solid " + (sel ? "var(--caramel-deep)" : "var(--line)"),
                          background: sel ? "var(--caramel)" : "transparent",
                          display: "grid",
                          placeItems: "center",
                          flexShrink: 0,
                        }}
                      >
                        {sel && <Icon.Check size={11} />}
                      </span>
                      <div style={{ flex: 1, textAlign: "left" }}>
                        <div style={{ fontSize: 13.5, fontWeight: 600 }}>{r}</div>
                        <div style={{ fontSize: 11.5, color: "var(--muted)", marginTop: 1 }}>
                          {r === "admin"
                            ? "Full access incl. user management and destructive ops"
                            : r === "staff"
                              ? "Daily operations — create / edit, no deletes"
                              : "Read-only"}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </Field>
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
              <Button variant="secondary" size="lg" full onClick={() => setMode("menu")}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="lg"
                full
                onClick={saveRole}
                disabled={isPending || role === user.role}
              >
                {isPending ? "Saving…" : role === user.role ? "No change" : "Save role"}
              </Button>
            </div>
          </div>
        )}

        {mode === "password" && (
          <div style={{ paddingBottom: 24 }}>
            <button onClick={() => setMode("menu")} type="button" style={backLink}>
              <Icon.ChevronLeft size={14} /> Back
            </button>
            <Field
              label="New password"
              hint="Min 6 characters. Share via a secure channel."
            >
              <TextInput
                type="password"
                value={pw}
                onChange={(e) => setPw(e.target.value)}
                autoFocus
                autoComplete="new-password"
              />
            </Field>
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
              <Button variant="secondary" size="lg" full onClick={() => setMode("menu")}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="lg"
                full
                onClick={savePassword}
                disabled={isPending || pw.length < 6}
              >
                {isPending ? "Saving…" : "Set password"}
              </Button>
            </div>
          </div>
        )}
      </Sheet>
    </>
  );
}

const iconBtn: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  width: 30,
  height: 30,
  borderRadius: 999,
  background: "var(--surface-3)",
  color: "var(--ink-soft)",
  border: "none",
  cursor: "pointer",
  flexShrink: 0,
};

function actionRow(tone: "caramel" | "rose"): React.CSSProperties {
  const palette = {
    caramel: { bg: "var(--caramel-soft)", fg: "var(--caramel-deep)" },
    rose: { bg: "var(--rose-soft)", fg: "oklch(0.38 0.10 25)" },
  } as const;
  return {
    display: "flex",
    alignItems: "center",
    gap: 12,
    width: "100%",
    padding: "12px 14px",
    marginBottom: 8,
    background: palette[tone].bg,
    color: palette[tone].fg,
    border: "none",
    borderRadius: "var(--r)",
    cursor: "pointer",
    textAlign: "left",
    fontFamily: "inherit",
  };
}

const rowLabel: React.CSSProperties = { fontSize: 14, fontWeight: 700 };
const rowDesc: React.CSSProperties = { fontSize: 12, opacity: 0.85, marginTop: 2 };
const backLink: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 4,
  background: "transparent",
  color: "var(--muted)",
  border: "none",
  fontSize: 12.5,
  fontWeight: 600,
  cursor: "pointer",
  padding: 0,
  margin: "0 0 14px",
  fontFamily: "inherit",
};
