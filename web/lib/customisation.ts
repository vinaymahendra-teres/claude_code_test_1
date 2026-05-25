// Shared types + helpers for customisation. Imported by both server and
// client components, so no "use server" here.

export type CustomisationBrief = {
  // Common across all lines
  occasion?: string;
  theme?: string;
  colors?: string[]; // palette swatches
  motif?: string; // typed motif description ("art-deco florals", "PSG kit")
  message?: { text: string; color?: string };
  dietary?: string[];
  notes?: string;

  // Cake-specific
  shape?: string;
  topper?: string; // "Acrylic gold monogram", "Number candle"
  figurines?: string;

  // Cupcake-specific
  flavor_mix?: string; // e.g. "6 vanilla + 6 chocolate"
  liner_colour?: string;

  // Brownie / boxed-product
  wrapping?: string;

  // Tub
  layer_notes?: string;

  // Bomboloni
  filling_mix?: string;
  glaze?: string;
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

// Per-product-line schema: which structured brief fields are surfaced when
// the operator picks that line on a New Order. Keeps cake-only fields like
// "topper" / "figurines" out of a bomboloni brief, and vice versa.
export type BriefField =
  | "occasion"
  | "theme"
  | "palette"
  | "motif"
  | "shape"
  | "message"
  | "topper"
  | "figurines"
  | "flavor_mix"
  | "liner_colour"
  | "wrapping"
  | "layer_notes"
  | "filling_mix"
  | "glaze"
  | "dietary"
  | "notes";

export const BRIEF_SCHEMAS: Record<string, BriefField[]> = {
  cake: [
    "occasion",
    "theme",
    "palette",
    "motif",
    "shape",
    "message",
    "topper",
    "figurines",
    "dietary",
    "notes",
  ],
  cupcake: [
    "occasion",
    "theme",
    "palette",
    "flavor_mix",
    "liner_colour",
    "topper",
    "message",
    "dietary",
    "notes",
  ],
  brownie: ["occasion", "message", "wrapping", "dietary", "notes"],
  tub: ["flavor_mix", "layer_notes", "dietary", "notes"],
  bomboloni: ["filling_mix", "glaze", "dietary", "notes"],
};

export function briefSchemaFor(productLine: string | null | undefined): BriefField[] {
  if (!productLine) return BRIEF_SCHEMAS.cake;
  return BRIEF_SCHEMAS[productLine] ?? BRIEF_SCHEMAS.cake;
}

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
