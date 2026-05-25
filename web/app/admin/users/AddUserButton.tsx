"use client";

import { useState, useTransition } from "react";
import { Field } from "@/components/ui";
import { Sheet, TextInput, Button } from "@/components/ui-client";
import { Icon } from "@/components/Icon";
import { createAppUser } from "./actions";

const ROLES = [
  { v: "admin", label: "Admin", desc: "Full access + user management" },
  { v: "staff", label: "Staff", desc: "Daily operations, no destructive ops" },
  { v: "viewer", label: "Viewer", desc: "Read-only" },
];

export function AddUserButton() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("staff");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function reset() {
    setName("");
    setEmail("");
    setRole("staff");
    setPassword("");
    setError(null);
  }
  function close() {
    reset();
    setOpen(false);
  }

  function submit() {
    setError(null);
    if (!name.trim() || !email.trim() || password.length < 6) {
      setError("Name, email, and a 6+ char password are required");
      return;
    }
    startTransition(async () => {
      try {
        await createAppUser({ name, email, role, password });
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
        title="Add user"
        aria-label="Add user"
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          width: 34,
          height: 34,
          background: "var(--caramel)",
          color: "var(--surface)",
          border: "1px solid var(--caramel-deep)",
          borderRadius: 999,
          cursor: "pointer",
        }}
      >
        <Icon.Plus size={20} />
      </button>

      <Sheet open={open} onClose={close} title="Add user">
        <div style={{ paddingBottom: 24 }}>
          <Field label="Full name">
            <TextInput value={name} onChange={(e) => setName(e.target.value)} autoFocus />
          </Field>
          <Field label="Email">
            <TextInput
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="off"
            />
          </Field>
          <Field label="Role">
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {ROLES.map((r) => {
                const sel = role === r.v;
                return (
                  <button
                    key={r.v}
                    type="button"
                    onClick={() => setRole(r.v)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      padding: "10px 12px",
                      borderRadius: "var(--r)",
                      border: "1.5px solid " + (sel ? "var(--caramel)" : "var(--line)"),
                      background: sel ? "var(--caramel-soft)" : "var(--surface)",
                      color: "var(--ink)",
                      cursor: "pointer",
                      fontFamily: "inherit",
                      textAlign: "left",
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
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13.5, fontWeight: 600 }}>{r.label}</div>
                      <div style={{ fontSize: 11.5, color: "var(--muted)", marginTop: 1 }}>
                        {r.desc}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </Field>
          <Field label="Initial password" hint="Min 6 characters. Share via a secure channel.">
            <TextInput
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
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
            <Button variant="secondary" size="lg" full onClick={close}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="lg"
              full
              onClick={submit}
              disabled={isPending || !name.trim() || !email.trim() || password.length < 6}
            >
              {isPending ? "Saving…" : "Add user"}
            </Button>
          </div>
        </div>
      </Sheet>
    </>
  );
}
