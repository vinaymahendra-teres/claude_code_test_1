import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { LoginForm } from "./LoginForm";
import { BrandLogo } from "@/components/BrandLogo";

export const dynamic = "force-dynamic";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string; error?: string }>;
}) {
  const session = await auth();
  const { callbackUrl, error } = await searchParams;
  if (session?.user) {
    redirect(callbackUrl || "/");
  }

  return (
    <div
      style={{
        minHeight: "100dvh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--bg-deep)",
        padding: "32px 18px",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 380,
          background: "var(--surface)",
          padding: "32px 28px",
          borderRadius: 20,
          boxShadow: "var(--shadow-lg)",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <BrandLogo size={64} style={{ margin: "0 auto 12px" }} />
          <div
            style={{
              fontFamily: "var(--font-serif), DM Serif Display, serif",
              fontSize: 26,
              lineHeight: 1.15,
            }}
          >
            Tiered Cake Company
          </div>
          <div style={{ fontSize: 13, color: "var(--muted)", marginTop: 4 }}>
            Sign in to the bakery workspace
          </div>
        </div>

        <LoginForm callbackUrl={callbackUrl || "/"} initialError={error} />
      </div>
    </div>
  );
}
