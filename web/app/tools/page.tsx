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

  const cupsN = parseFloat(cupsValue);
  const cupsGrams = isFinite(cupsN) ? Math.round((CUP_GRAMS[cupsIngredient] || 0) * cupsN) : null;

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
              <Field label="Cups">
                <TextInput
                  value={cupsValue}
                  onChange={(e) => setCupsValue(e.target.value.replace(/[^0-9./]/g, ""))}
                  placeholder="1"
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
