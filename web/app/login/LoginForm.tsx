"use client";

import { signIn } from "next-auth/react";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

export function LoginForm({
  callbackUrl,
  initialError,
}: {
  callbackUrl: string;
  initialError?: string;
}) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(
    initialError === "CredentialsSignin" ? "Incorrect email or password." : initialError ?? null,
  );
  const [isPending, startTransition] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await signIn("credentials", {
        email: email.trim().toLowerCase(),
        password,
        redirect: false,
      });
      if (!result || result.error) {
        setError("Incorrect email or password.");
        return;
      }
      router.replace(callbackUrl);
      router.refresh();
    });
  }

  return (
    <form onSubmit={submit}>
      <label style={fieldLabel}>Email</label>
      <input
        type="email"
        autoComplete="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="swetha@tieredcake.in"
        style={inputStyle}
      />

      <label style={{ ...fieldLabel, marginTop: 14 }}>Password</label>
      <input
        type="password"
        autoComplete="current-password"
        required
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="••••••••"
        style={inputStyle}
      />

      {error && (
        <div
          style={{
            marginTop: 12,
            padding: "10px 12px",
            fontSize: 12.5,
            background: "oklch(0.94 0.05 28)",
            color: "var(--danger)",
            border: "1px solid var(--danger)",
            borderRadius: "var(--r)",
          }}
        >
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={isPending}
        style={{
          width: "100%",
          marginTop: 18,
          padding: "13px",
          fontSize: 15,
          fontWeight: 600,
          background: "var(--caramel)",
          color: "var(--surface)",
          border: "1px solid var(--caramel-deep)",
          borderRadius: "var(--r)",
          cursor: isPending ? "not-allowed" : "pointer",
          opacity: isPending ? 0.6 : 1,
          fontFamily: "inherit",
        }}
      >
        {isPending ? "Signing in…" : "Sign in"}
      </button>

      <div
        style={{
          marginTop: 16,
          fontSize: 11.5,
          color: "var(--muted)",
          textAlign: "center",
          lineHeight: 1.5,
        }}
      >
        Admins only. Seeded accounts: <strong>swetha@tieredcake.in</strong> ·{" "}
        <strong>shreya@tieredcake.in</strong>.
      </div>
    </form>
  );
}

const fieldLabel: React.CSSProperties = {
  display: "block",
  fontSize: 12,
  fontWeight: 600,
  color: "var(--ink-soft)",
  marginBottom: 6,
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  fontFamily: "inherit",
  fontSize: 14,
  padding: "11px 12px",
  borderRadius: "var(--r)",
  border: "1px solid var(--line)",
  background: "var(--surface)",
  color: "var(--ink)",
  outline: "none",
  boxSizing: "border-box",
};
