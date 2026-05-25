"use client";

import type { ComponentType } from "react";
import { useAppShell } from "@/components/AppShell";
import { QuickActions } from "./QuickActions";
import {
  Hero,
  Today,
  Tomorrow,
  LowStock,
  OpenLists,
  Campaigns,
  Leads,
  ReviewsDue,
  ComplianceDue,
  MonthlySnapshot,
  Outstanding,
  UpcomingEvents,
  type HomeData,
} from "./sections";

type SectionComponent = ComponentType<{ data: HomeData }>;

const RENDERERS: Record<string, SectionComponent> = {
  hero: Hero,
  today: Today,
  tomorrow: Tomorrow,
  lowStock: LowStock,
  openLists: OpenLists,
  campaigns: Campaigns,
  leads: Leads,
  reviewsDue: ReviewsDue,
  complianceDue: ComplianceDue,
  monthlySnapshot: MonthlySnapshot,
  outstanding: Outstanding,
  upcomingEvents: UpcomingEvents,
};

export function HomeDashboard({ data }: { data: HomeData }) {
  const { modeDef } = useAppShell();
  const sections = modeDef.home.sections;

  return (
    <div style={{ padding: "6px 18px 100px", overflowY: "auto", flex: 1 }}>
      {sections.map((s) => {
        if (s === "quickActions") return <QuickActions key={s} />;
        const Comp = RENDERERS[s];
        return Comp ? <Comp key={s} data={data} /> : null;
      })}
    </div>
  );
}
