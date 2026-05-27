import type { Metadata } from "next";
import { DM_Sans, DM_Serif_Display, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { AppShell } from "@/components/AppShell";
import { ServiceWorkerRegister } from "@/components/ServiceWorkerRegister";
import { auth, hasRole } from "@/auth";
import { listActiveBranches } from "@/lib/branches";
import { getActiveBranchId } from "@/lib/branch-context";

// Fonts: downloaded at build time and served from /_next/static — no
// runtime fetch to fonts.googleapis.com / fonts.gstatic.com. Latin-only
// subset; swap-display so first paint isn't blocked on font download.
const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  variable: "--font-sans",
});

const dmSerif = DM_Serif_Display({
  subsets: ["latin"],
  weight: ["400"],
  style: ["normal", "italic"],
  display: "swap",
  variable: "--font-serif",
});

const jetBrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "Tiered Cake Company — Run the bakery",
  description:
    "All-in-one workspace for a Hyderabad home bakery — CRM, sales, operations, marketing, accounting and reports in one phone-first app.",
  manifest: "/manifest.webmanifest",
  themeColor: "#c98a3d",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [session, branches, activeBranchId] = await Promise.all([
    auth(),
    listActiveBranches(),
    getActiveBranchId(),
  ]);
  const isAdmin = hasRole(session?.user?.role, "admin");
  const appBranches = branches.map((b) => ({
    id: b.id,
    label: b.label,
    community: b.community,
    neighbourhood: b.neighbourhood,
  }));

  return (
    <html
      lang="en"
      className={`${dmSans.variable} ${dmSerif.variable} ${jetBrainsMono.variable}`}
    >
      <body>
        <ServiceWorkerRegister />
        <AppShell isAdmin={isAdmin} branches={appBranches} activeBranchId={activeBranchId}>
          {children}
        </AppShell>
      </body>
    </html>
  );
}
