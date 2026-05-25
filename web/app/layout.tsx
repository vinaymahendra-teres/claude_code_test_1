import type { Metadata } from "next";
import "./globals.css";
import { AppShell } from "@/components/AppShell";
import { auth, hasRole } from "@/auth";

export const metadata: Metadata = {
  title: "Tiered Cake Company — Run the bakery",
  description:
    "All-in-one workspace for a Hyderabad home bakery — CRM, sales, operations, marketing, accounting and reports in one phone-first app.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();
  const isAdmin = hasRole(session?.user?.role, "admin");

  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700&family=JetBrains+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <AppShell isAdmin={isAdmin}>{children}</AppShell>
      </body>
    </html>
  );
}
