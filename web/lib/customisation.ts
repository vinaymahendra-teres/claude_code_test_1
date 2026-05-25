// Shared types + helpers for customisation. Imported by both server and
// client components, so no "use server" here.

export type CustomisationBrief = {
  occasion?: string;
  theme?: string;
  colors?: string[];
  shape?: string;
  message?: { text: string; color?: string };
  figurines?: string;
  dietary?: string[];
  notes?: string;
};

export type CustomisationAddon = {
  id: string;            // catalogue id
  name: string;          // snapshot of name at time of selection
  qty: number;
  price: number;         // unit price in ₹
  notes?: string;
};

export type Customisation = {
  brief?: CustomisationBrief;
  addons?: CustomisationAddon[];
};

export type AddonCategory =
  | "figurine"
  | "topper"
  | "decor"
  | "finish"
  | "shape"
  | "technique"
  | "dietary"
  | "other";

export const ADDON_CATEGORIES: AddonCategory[] = [
  "figurine",
  "topper",
  "decor",
  "finish",
  "shape",
  "technique",
  "dietary",
  "other",
];

export const OCCASIONS = [
  "birthday",
  "anniversary",
  "wedding",
  "baby shower",
  "engagement",
  "graduation",
  "festival",
  "corporate",
  "other",
] as const;

export const SHAPES = [
  "round",
  "square",
  "heart",
  "number",
  "letter",
  "character",
  "custom",
] as const;

export function addonsTotal(addons: CustomisationAddon[] | null | undefined): number {
  if (!addons) return 0;
  return addons.reduce((s, a) => s + (a.price ?? 0) * (a.qty ?? 1), 0);
}

export function hasCustomisation(c: Customisation | null | undefined): boolean {
  if (!c) return false;
  const briefHas =
    !!c.brief &&
    Boolean(
      c.brief.occasion ||
        c.brief.theme ||
        (c.brief.colors && c.brief.colors.length) ||
        c.brief.shape ||
        (c.brief.message && c.brief.message.text) ||
        c.brief.figurines ||
        (c.brief.dietary && c.brief.dietary.length) ||
        c.brief.notes,
    );
  const addonsHas = !!c.addons && c.addons.length > 0;
  return briefHas || addonsHas;
}
