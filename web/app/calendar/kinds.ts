export const EVENT_KINDS = [
  "event",
  "festival",
  "milestone",
  "marketing",
  "personal",
  "reminder",
] as const;
export type EventKind = (typeof EVENT_KINDS)[number];
