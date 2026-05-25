"use client";

import Link from "next/link";
import { useState } from "react";
import { PhoneShell } from "@/components/PhoneShell";
import { Card, Field, SectionHeader } from "@/components/ui";
import { SegmentedControl, TextInput } from "@/components/ui-client";
import { Icon } from "@/components/Icon";

const CUP_GRAMS: Record<string, number> = {
  "All-purpose flour": 125,
  "Cake flour": 115,
  "Caster sugar": 200,
  "Brown sugar (packed)": 220,
  "Icing sugar": 120,
  "Butter (softened)": 227,
  "Cocoa powder": 90,
  "Milk (whole)": 240,
  "Greek yogurt": 245,
  "Honey": 340,
  "Pistachio paste": 270,
  "Heavy cream": 240,
};

export default function ToolsPage() {
  const [tab, setTab] = useState("cups");
  const [cupsValue, setCupsValue] = useState("1");
  const [cupsIngredient, setCupsIngredient] = useState("All-purpose flour");
  const [tempValue, setTempValue] = useState("180");
  const [tempDir, setTempDir] = useState("c-to-f");
  const [scaleFrom, setScaleFrom] = useState("8");
  const [scaleTo, setScaleTo] = useState("12");

  const cupsN = parseCups(cupsValue);
  const cupsGrams =
    cupsN != null && isFinite(cupsN)
      ? Math.round((CUP_GRAMS[cupsIngredient] || 0) * cupsN)
      : null;

  const tempN = parseFloat(tempValue);
  const tempOut = isFinite(tempN)
    ? tempDir === "c-to-f"
      ? Math.round((tempN * 9) / 5 + 32)
      : Math.round(((tempN - 32) * 5) / 9)
    : null;

  const scaleFromN = parseFloat(scaleFrom);
  const scaleToN = parseFloat(scaleTo);
  const scaleFactor =
    isFinite(scaleFromN) && isFinite(scaleToN) && scaleFromN > 0 ? scaleToN / scaleFromN : null;

  return (
    <PhoneShell>
      <div data-screen-label="Tools">
        <header style={chromeHeader}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, minHeight: 32 }}>
            <Link href="/" style={chromeBtn} aria-label="Back">
              <Icon.ChevronLeft size={22} />
            </Link>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: "DM Serif Display, serif", fontSize: 21, lineHeight: 1.15 }}>
                Tools
              </div>
              <div style={{ fontSize: 12.5, color: "var(--muted)", marginTop: 2 }}>
                Cup-grams, temp, scale
              </div>
            </div>
          </div>
        </header>

        <div
          style={{
            padding: "10px 18px 8px",
            borderBottom: "1px solid var(--line-soft)",
            background: "var(--bg)",
          }}
        >
          <SegmentedControl
            value={tab}
            onChange={setTab}
            options={[
              { value: "cups", label: "Cups ⇄ g" },
              { value: "temp", label: "°C ⇄ °F" },
              { value: "scale", label: "Scale" },
            ]}
          />
        </div>

        <div style={{ padding: "14px 18px 100px", overflowY: "auto", flex: 1 }}>
          {tab === "cups" && (
            <div>
              <Field label="Ingredient">
                <select
                  value={cupsIngredient}
                  onChange={(e) => setCupsIngredient(e.target.value)}
                  style={{
                    width: "100%",
                    padding: 12,
                    background: "var(--surface)",
                    border: "1px solid var(--line)",
                    borderRadius: "var(--r)",
                    fontSize: 14,
                    fontFamily: "inherit",
                  }}
                >
                  {Object.keys(CUP_GRAMS).map((k) => (
                    <option key={k} value={k}>{k}</option>
                  ))}
                </select>
              </Field>
              <Field
                label="Cups"
                hint={
                  cupsValue && cupsN != null
                    ? `Reading as ${formatCups(cupsN)} cup${cupsN === 1 ? "" : "s"}`
                    : "Accepts 1, 1.5, 1/2, half, two and a half…"
                }
                error={cupsValue && cupsN == null ? "Hmm, couldn't read that" : undefined}
              >
                <TextInput
                  value={cupsValue}
                  onChange={(e) => setCupsValue(e.target.value)}
                  placeholder="e.g. 1/2 or half"
                  error={!!cupsValue && cupsN == null}
                  style={{
                    fontSize: 22,
                    padding: "14px 12px",
                    fontWeight: 600,
                    fontFamily: "DM Serif Display, serif",
                  }}
                />
              </Field>
              <Card
                padding={18}
                style={{
                  marginTop: 14,
                  background: "var(--caramel-soft)",
                  border: "1px solid var(--caramel)",
                }}
              >
                <div style={uppercase("caramel")}>Grams</div>
                <div
                  style={{
                    fontFamily: "DM Serif Display, serif",
                    fontSize: 36,
                    color: "var(--caramel-deep)",
                    marginTop: 4,
                  }}
                >
                  {cupsGrams != null ? `${cupsGrams} g` : "—"}
                </div>
                <div style={{ fontSize: 12, color: "var(--ink-soft)", marginTop: 2 }}>
                  {CUP_GRAMS[cupsIngredient]} g per cup
                </div>
              </Card>
            </div>
          )}

          {tab === "temp" && (
            <div>
              <Field label="Direction">
                <SegmentedControl
                  value={tempDir}
                  onChange={setTempDir}
                  options={[
                    { value: "c-to-f", label: "°C → °F" },
                    { value: "f-to-c", label: "°F → °C" },
                  ]}
                />
              </Field>
              <Field label={tempDir === "c-to-f" ? "Celsius" : "Fahrenheit"}>
                <TextInput
                  value={tempValue}
                  onChange={(e) => setTempValue(e.target.value.replace(/[^0-9.\-]/g, ""))}
                  placeholder="0"
                  style={{
                    fontSize: 22,
                    padding: "14px 12px",
                    fontWeight: 600,
                    fontFamily: "DM Serif Display, serif",
                  }}
                />
              </Field>
              <Card
                padding={18}
                style={{
                  marginTop: 14,
                  background: "var(--rose-soft)",
                  border: "1px solid var(--rose)",
                }}
              >
                <div style={uppercase("rose")}>
                  {tempDir === "c-to-f" ? "Fahrenheit" : "Celsius"}
                </div>
                <div
                  style={{
                    fontFamily: "DM Serif Display, serif",
                    fontSize: 36,
                    color: "oklch(0.38 0.10 25)",
                    marginTop: 4,
                  }}
                >
                  {tempOut != null
                    ? `${tempOut} ${tempDir === "c-to-f" ? "°F" : "°C"}`
                    : "—"}
                </div>
              </Card>
              <SectionHeader>Common bake temps</SectionHeader>
              <Card padding={0}>
                {(
                  [
                    ["Low / proof", "50 °C", "120 °F"],
                    ["Sponge cake", "165 °C", "325 °F"],
                    ["Standard bake", "180 °C", "350 °F"],
                    ["Bread", "200 °C", "395 °F"],
                    ["Pizza", "230 °C", "450 °F"],
                  ] as const
                ).map(([k, c, f], i, arr) => (
                  <div
                    key={k}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "10px 14px",
                      borderBottom: i < arr.length - 1 ? "1px solid var(--line-soft)" : "none",
                    }}
                  >
                    <span style={{ fontSize: 13.5 }}>{k}</span>
                    <span
                      style={{
                        fontSize: 12.5,
                        color: "var(--ink-soft)",
                        fontFamily: "JetBrains Mono, monospace",
                      }}
                    >
                      {c} · {f}
                    </span>
                  </div>
                ))}
              </Card>
            </div>
          )}

          {tab === "scale" && (
            <div>
              <Field label="Original servings">
                <TextInput
                  value={scaleFrom}
                  onChange={(e) => setScaleFrom(e.target.value.replace(/[^0-9.]/g, ""))}
                  placeholder="8"
                />
              </Field>
              <Field label="Target servings">
                <TextInput
                  value={scaleTo}
                  onChange={(e) => setScaleTo(e.target.value.replace(/[^0-9.]/g, ""))}
                  placeholder="12"
                />
              </Field>
              <Card
                padding={18}
                style={{
                  marginTop: 14,
                  background: "var(--sage-soft)",
                  border: "1px solid var(--sage)",
                }}
              >
                <div style={uppercase("sage")}>Multiply every ingredient by</div>
                <div
                  style={{
                    fontFamily: "DM Serif Display, serif",
                    fontSize: 36,
                    color: "oklch(0.34 0.07 145)",
                    marginTop: 4,
                  }}
                >
                  {scaleFactor != null ? "×" + scaleFactor.toFixed(2) : "—"}
                </div>
                <div style={{ fontSize: 12, color: "var(--ink-soft)", marginTop: 4 }}>
                  Bake time scales less than linearly — add 10–15% time, keep temp the same.
                </div>
              </Card>
            </div>
          )}
        </div>
      </div>
    </PhoneShell>
  );
}

function uppercase(tone: "caramel" | "rose" | "sage"): React.CSSProperties {
  const fg = tone === "caramel" ? "var(--caramel-deep)" : tone === "rose" ? "oklch(0.38 0.10 25)" : "oklch(0.34 0.07 145)";
  return {
    fontSize: 11.5,
    color: fg,
    letterSpacing: "0.04em",
    textTransform: "uppercase",
  };
}

// ---------- parseCups: accept decimals, fractions, and English words ----------
// Examples:
//   "1"           -> 1
//   "0.5", ".5"   -> 0.5
//   "1/2"         -> 0.5
//   "1 1/2"       -> 1.5
//   "half"        -> 0.5
//   "a half"      -> 0.5
//   "two thirds"  -> 0.6667
//   "1 and 1/2"   -> 1.5
//   "two and a half cups" -> 2.5
function parseCups(raw: string): number | null {
  if (!raw) return null;
  let s = raw.toLowerCase().trim();
  if (!s) return null;

  // Strip "cup" / "cups" / "c." for forgiveness
  s = s.replace(/\b(cups?|c\.?)\b/g, " ").trim();

  // English word fractions first (order matters — handle "three quarters" before "three")
  const wordFractions: Array<[RegExp, string]> = [
    [/\bthree[\s-]?quarters?\b/g, "3/4"],
    [/\btwo[\s-]?thirds?\b/g, "2/3"],
    [/\btwo[\s-]?fifths?\b/g, "2/5"],
    [/\bthree[\s-]?fifths?\b/g, "3/5"],
    [/\bfour[\s-]?fifths?\b/g, "4/5"],
    [/\bthree[\s-]?eighths?\b/g, "3/8"],
    [/\bfive[\s-]?eighths?\b/g, "5/8"],
    [/\bseven[\s-]?eighths?\b/g, "7/8"],
    // Match "one half"/"a half"/"an half" as a single 1/2, before the
    // standalone "half" rule that follows (otherwise "one half" leaves an
    // orphan "one" that gets read as the integer 1 and yields 1.5).
    [/\b(?:one|a|an)[\s-]+(?:halves|half)\b/g, "1/2"],
    [/\b(?:halves|half)\b/g, "1/2"],
    [/\b(?:one|a)[\s-]+quarter\b/g, "1/4"],
    [/\bquarter\b/g, "1/4"],
    [/\b(?:one|a)[\s-]+third\b/g, "1/3"],
    [/\bthird\b/g, "1/3"],
    [/\b(?:one|a)[\s-]+fifth\b/g, "1/5"],
    [/\bfifth\b/g, "1/5"],
    [/\b(?:one|an)[\s-]+eighth\b/g, "1/8"],
    [/\beighth\b/g, "1/8"],
  ];
  for (const [re, val] of wordFractions) s = s.replace(re, ` ${val} `);

  // Whole-number words
  const wordNums: Record<string, string> = {
    one: "1", two: "2", three: "3", four: "4", five: "5",
    six: "6", seven: "7", eight: "8", nine: "9", ten: "10",
  };
  for (const [w, n] of Object.entries(wordNums)) {
    s = s.replace(new RegExp(`\\b${w}\\b`, "g"), n);
  }

  // "and" and stray "a/an" → space (used as connectors in "one and a half")
  s = s.replace(/\b(and|a|an)\b/g, " ");

  // Collapse whitespace
  s = s.replace(/\s+/g, " ").trim();
  if (!s) return null;

  // Now: mixed "N M/D"
  let m = s.match(/^(\d+)\s+(\d+)\/(\d+)$/);
  if (m) {
    const whole = parseInt(m[1], 10);
    const num = parseInt(m[2], 10);
    const den = parseInt(m[3], 10);
    if (den === 0) return null;
    return whole + num / den;
  }

  // Pure fraction "M/D"
  m = s.match(/^(\d+)\/(\d+)$/);
  if (m) {
    const num = parseInt(m[1], 10);
    const den = parseInt(m[2], 10);
    if (den === 0) return null;
    return num / den;
  }

  // Plain number "1", "0.5", "1.5", ".5"
  m = s.match(/^(\d+(?:\.\d+)?|\.\d+)$/);
  if (m) return parseFloat(m[1]);

  // Two numbers separated by whitespace, e.g. "1 0.5" — treat as sum (rare but
  // covers "one zero point five" weirdness, mainly here as safety net).
  m = s.match(/^(\d+(?:\.\d+)?)\s+(\d+(?:\.\d+)?)$/);
  if (m) return parseFloat(m[1]) + parseFloat(m[2]);

  return null;
}

// Show parsed value back to user — small mixed-fraction-ish format
function formatCups(n: number): string {
  if (!isFinite(n) || n < 0) return "—";
  if (Number.isInteger(n)) return String(n);
  // Two-decimal max, strip trailing zeros
  const rounded = Math.round(n * 100) / 100;
  return String(rounded).replace(/\.?0+$/, "");
}

const chromeHeader: React.CSSProperties = {
  position: "sticky",
  top: 0,
  background: "var(--bg)",
  padding: "54px 18px 14px",
  borderBottom: "1px solid var(--line-soft)",
  zIndex: 5,
};

const chromeBtn: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  width: 36,
  height: 36,
  borderRadius: 999,
  background: "transparent",
  color: "var(--ink)",
  textDecoration: "none",
};
