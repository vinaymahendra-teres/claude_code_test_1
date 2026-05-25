"use client";

import { TextInput } from "@/components/ui-client";
import { Field } from "@/components/ui";
import {
  OCCASIONS,
  SHAPES,
  type BriefField,
  type CustomisationBrief,
} from "@/lib/customisation";

// Reusable brief form: pass a schema (subset of fields) and the current brief,
// renders only the relevant inputs. Used by NewOrder "Describe the look" and
// the Customisation sheet on /orders/[id].

const COLOR_SWATCHES = [
  "#f8c7c9",
  "#fde2c0",
  "#fffbe6",
  "#cfe8d0",
  "#bedfff",
  "#d6c5ea",
  "#1a1a1a",
  "#ffffff",
  "#d4af37",
];

// "eggless" lives on its own Step 2 toggle (and on every recipe row), so
// keep it out of these chips to avoid the operator setting it in two places.
const DIETARY_OPTIONS = ["gluten-free", "sugar-free", "nut-free", "vegan"];

export function BriefForm({
  schema,
  brief,
  onChange,
}: {
  schema: BriefField[];
  brief: CustomisationBrief;
  onChange: (b: CustomisationBrief) => void;
}) {
  function patch<K extends keyof CustomisationBrief>(key: K, value: CustomisationBrief[K]) {
    onChange({ ...brief, [key]: value });
  }

  return (
    <>
      {schema.map((f) => {
        switch (f) {
          case "occasion":
            return (
              <Field key={f} label="Occasion">
                <ChipRow
                  options={OCCASIONS as readonly string[]}
                  selected={brief.occasion}
                  onSelect={(v) => patch("occasion", v === brief.occasion ? undefined : v)}
                />
              </Field>
            );

          case "theme":
            return (
              <Field key={f} label="Theme / vibe" hint="Palette + motifs + reference vibe">
                <TextInput
                  multiline
                  value={brief.theme ?? ""}
                  onChange={(e) => patch("theme", e.target.value || undefined)}
                  placeholder="Pastel floral, ivory + dusty pink. Hand-piped peonies."
                />
              </Field>
            );

          case "palette":
            return (
              <Field key={f} label="Palette" hint="Tap one or more">
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {COLOR_SWATCHES.map((c) => {
                    const sel = (brief.colors ?? []).includes(c);
                    return (
                      <button
                        key={c}
                        type="button"
                        onClick={() => {
                          const list = brief.colors ?? [];
                          patch(
                            "colors",
                            sel ? list.filter((x) => x !== c) : [...list, c],
                          );
                        }}
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: 999,
                          background: c,
                          border:
                            "2px solid " + (sel ? "var(--caramel-deep)" : "var(--line)"),
                          cursor: "pointer",
                        }}
                        aria-label={c}
                      />
                    );
                  })}
                </div>
                {(brief.colors ?? []).length > 0 && (
                  <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 6 }}>
                    {brief.colors!.join(" · ")}
                  </div>
                )}
              </Field>
            );

          case "motif":
            return (
              <Field
                key={f}
                label="Motif"
                hint="Hand-piped peonies, art-deco geometry, PSG kit, etc."
              >
                <TextInput
                  value={brief.motif ?? ""}
                  onChange={(e) => patch("motif", e.target.value || undefined)}
                  placeholder="Recurring shape / pattern to feature"
                />
              </Field>
            );

          case "shape":
            return (
              <Field key={f} label="Shape">
                <ChipRow
                  options={SHAPES as readonly string[]}
                  selected={brief.shape}
                  onSelect={(v) => patch("shape", v === brief.shape ? undefined : v)}
                />
              </Field>
            );

          case "message":
            return (
              <Field key={f} label="Piped message" optional>
                <TextInput
                  value={brief.message?.text ?? ""}
                  onChange={(e) =>
                    patch(
                      "message",
                      e.target.value
                        ? { text: e.target.value, color: brief.message?.color }
                        : undefined,
                    )
                  }
                  placeholder='e.g. "Sixty & Glowing"'
                />
                <TextInput
                  value={brief.message?.color ?? ""}
                  onChange={(e) =>
                    patch("message", {
                      text: brief.message?.text ?? "",
                      color: e.target.value,
                    })
                  }
                  placeholder="Message colour (gold, deep red, ivory…)"
                  style={{ marginTop: 6 }}
                />
              </Field>
            );

          case "topper":
            return (
              <Field
                key={f}
                label="Topper"
                hint="Acrylic monogram, fondant figure, number candle…"
                optional
              >
                <TextInput
                  value={brief.topper ?? ""}
                  onChange={(e) => patch("topper", e.target.value || undefined)}
                  placeholder="Describe the topper"
                />
              </Field>
            );

          case "figurines":
            return (
              <Field key={f} label="Figurines / hand-piped detail" optional>
                <TextInput
                  multiline
                  value={brief.figurines ?? ""}
                  onChange={(e) => patch("figurines", e.target.value || undefined)}
                  placeholder="Fondant bride + groom · hand-piped peonies"
                />
              </Field>
            );

          case "flavor_mix":
            return (
              <Field
                key={f}
                label="Flavour mix"
                hint='e.g. "6 vanilla + 6 chocolate fudge"'
              >
                <TextInput
                  value={brief.flavor_mix ?? ""}
                  onChange={(e) => patch("flavor_mix", e.target.value || undefined)}
                  placeholder="How to split the box?"
                />
              </Field>
            );

          case "liner_colour":
            return (
              <Field key={f} label="Liner colour" optional>
                <TextInput
                  value={brief.liner_colour ?? ""}
                  onChange={(e) => patch("liner_colour", e.target.value || undefined)}
                  placeholder="Gold foil, kraft, white pleated…"
                />
              </Field>
            );

          case "wrapping":
            return (
              <Field key={f} label="Wrapping / box style" optional>
                <TextInput
                  value={brief.wrapping ?? ""}
                  onChange={(e) => patch("wrapping", e.target.value || undefined)}
                  placeholder="Brown kraft box · custom sticker · sleeve"
                />
              </Field>
            );

          case "layer_notes":
            return (
              <Field key={f} label="Layer notes" optional>
                <TextInput
                  multiline
                  value={brief.layer_notes ?? ""}
                  onChange={(e) => patch("layer_notes", e.target.value || undefined)}
                  placeholder="Sponge / ganache / praline order"
                />
              </Field>
            );

          case "filling_mix":
            return (
              <Field key={f} label="Filling mix">
                <TextInput
                  value={brief.filling_mix ?? ""}
                  onChange={(e) => patch("filling_mix", e.target.value || undefined)}
                  placeholder="3 nutella + 3 vanilla cream"
                />
              </Field>
            );

          case "glaze":
            return (
              <Field key={f} label="Glaze / coating" optional>
                <TextInput
                  value={brief.glaze ?? ""}
                  onChange={(e) => patch("glaze", e.target.value || undefined)}
                  placeholder="Castor sugar · chocolate drizzle · plain"
                />
              </Field>
            );

          case "dietary":
            return (
              <Field key={f} label="Dietary" optional>
                <ChipRow
                  options={DIETARY_OPTIONS}
                  multi
                  selectedSet={new Set(brief.dietary ?? [])}
                  onSelect={(v) => {
                    const list = brief.dietary ?? [];
                    patch(
                      "dietary",
                      list.includes(v) ? list.filter((x) => x !== v) : [...list, v],
                    );
                  }}
                />
              </Field>
            );

          case "notes":
            return (
              <Field key={f} label="Notes" optional>
                <TextInput
                  multiline
                  value={brief.notes ?? ""}
                  onChange={(e) => patch("notes", e.target.value || undefined)}
                  placeholder="Anything that hasn't fit above"
                />
              </Field>
            );

          default:
            return null;
        }
      })}
    </>
  );
}

function ChipRow({
  options,
  selected,
  onSelect,
  multi,
  selectedSet,
}: {
  options: readonly string[];
  selected?: string;
  onSelect: (v: string) => void;
  multi?: boolean;
  selectedSet?: Set<string>;
}) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
      {options.map((o) => {
        const sel = multi ? selectedSet?.has(o) : selected === o;
        return (
          <span
            key={o}
            onClick={() => onSelect(o)}
            style={{
              padding: "6px 12px",
              fontSize: 12.5,
              fontWeight: 600,
              borderRadius: 999,
              border: "1.5px solid " + (sel ? "var(--caramel)" : "var(--line)"),
              background: sel ? "var(--caramel-soft)" : "var(--surface)",
              color: sel ? "var(--caramel-deep)" : "var(--ink-soft)",
              cursor: "pointer",
              textTransform: "capitalize",
            }}
          >
            {o}
          </span>
        );
      })}
    </div>
  );
}
