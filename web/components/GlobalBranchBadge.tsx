"use client";

import { BranchBadge } from "./BranchBadge";
import { useAppShell } from "./AppShell";

// Branch badge that reads branches + active id from the AppShell context
// (populated by the root layout). Lets us drop it inside the Server-rendered
// PhoneShell without making PhoneShell async — keeping client pages like
// /tools and /kitchen working.
export function GlobalBranchBadge() {
  const { branches, activeBranchId } = useAppShell();
  if (branches.length === 0) return null;
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
    />
  );
}
