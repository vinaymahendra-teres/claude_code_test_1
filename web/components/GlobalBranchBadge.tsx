"use client";

import { usePathname } from "next/navigation";
import { BranchBadge } from "./BranchBadge";
import { useAppShell } from "./AppShell";

// Branch badge that reads branches + active id from the AppShell context
// (populated by the root layout). Lets us drop it inside the Server-rendered
// PhoneShell without making PhoneShell async — keeping client pages like
// /tools and /kitchen working.
//
// `hideOnHome` lets the PhoneShell overlay opt out on "/" where HomeHeader
// already renders an inline copy next to the ModePill.
export function GlobalBranchBadge({
  hideOnHome = false,
  dropdownAlign = "left",
}: {
  hideOnHome?: boolean;
  dropdownAlign?: "left" | "right";
}) {
  const { branches, activeBranchId } = useAppShell();
  const pathname = usePathname();
  if (branches.length === 0) return null;
  if (hideOnHome && pathname === "/") return null;
  return (
    <BranchBadge
      branches={branches.map((b) => ({
        id: b.id,
        label: b.label,
        community: b.community,
        neighbourhood: b.neighbourhood,
      }))}
      initial={activeBranchId}
      compact
      dropdownAlign={dropdownAlign}
    />
  );
}
