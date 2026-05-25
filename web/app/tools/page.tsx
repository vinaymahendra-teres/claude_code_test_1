"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { PhoneShell } from "@/components/PhoneShell";
import { Card, Field, SectionHeader } from "@/components/ui";
import { TextInput } from "@/components/ui-client";
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

type ToolKey = "cups" | "temp" | "scale" | "volume" | "length" | "weight" | "yeast";

const TOOLS: Array<{ key: ToolKey; label: string }> = [
  { key: "cups", label: "Cups ⇄ g" },
  { key: "temp", label: "°C ⇄ °F" },
  { key: "scale", label: "Scale" },
  { key: "volume", label: "Volume" },
  { key: "length", label: "Length" },
  { key: "weight", label: "Weight" },
  { key: "yeast", label: "Yeast" },
];

export default function ToolsPage() {
  const [tool, setTool] = useState<ToolKey>("cups");

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
                Timers + Converters
              </div>
            </div>
          </div>
        </header>

        <div style={{ padding: "12px 18px 8px" }}>
          <TimersCard />
        </div>

        {/* Tool selector chips */}
        <div
          style={{
            // Outer 18px padding matches the rest of the page chrome so the
            // chip strip aligns with the converter dropdown / cards below.
            padding: "6px 18px 10px",
            borderBottom: "1px solid var(--line-soft)",
          }}
        >
          <div
            className="chip-scroll"
            style={{
              display: "flex",
              gap: 6,
              overflowX: "auto",
              // Hide both Firefox and WebKit scrollbars while keeping the
              // overflow scrollable; the fade hints at more content.
              scrollbarWidth: "none",
              // Soft fade on the right edge only — left edge sits flush with
              // other controls when fully scrolled left, which is the common
              // case. The fade taper is inside the 18px-padded area so it
              // never crosses the alignment line of the cards below.
              maskImage:
                "linear-gradient(to right, black calc(100% - 18px), transparent 100%)",
              WebkitMaskImage:
                "linear-gradient(to right, black calc(100% - 18px), transparent 100%)",
              // Snap chips so taps land cleanly after a flick.
              scrollSnapType: "x proximity",
            }}
          >
            {TOOLS.map((t) => {
              const active = tool === t.key;
              return (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => setTool(t.key)}
                  style={{
                    flexShrink: 0,
                    padding: "7px 13px",
                    fontSize: 13,
                    fontWeight: 600,
                    borderRadius: 999,
                    border: "1.5px solid " + (active ? "var(--caramel)" : "var(--line)"),
                    background: active ? "var(--caramel)" : "var(--surface)",
                    color: active ? "var(--surface)" : "var(--ink-soft)",
                    cursor: "pointer",
                    fontFamily: "inherit",
                    scrollSnapAlign: "start",
                    whiteSpace: "nowrap",
                  }}
                >
                  {t.label}
                </button>
              );
            })}
          </div>
        </div>

        <div style={{ padding: "14px 18px 100px", overflowY: "auto", flex: 1 }}>
          {tool === "cups" && <CupsConverter />}
          {tool === "temp" && <TempConverter />}
          {tool === "scale" && <ScaleConverter />}
          {tool === "volume" && <VolumeConverter />}
          {tool === "length" && <LengthConverter />}
          {tool === "weight" && <WeightConverter />}
          {tool === "yeast" && <YeastConverter />}
        </div>
      </div>
    </PhoneShell>
  );
}

// ---------- Timers card (compact) ----------

function TimersCard() {
  const [count, setCount] = useState(0);
  useEffect(() => {
    try {
      const raw = localStorage.getItem("tieredcake-timers");
      const arr: Array<{ status: string }> = raw ? JSON.parse(raw) : [];
      setCount(Array.isArray(arr) ? arr.length : 0);
    } catch {
      setCount(0);
    }
  }, []);

  return (
    <Link
      href="/kitchen"
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: 14,
        background: "var(--caramel-soft)",
        border: "1px solid var(--caramel)",
        borderRadius: "var(--r-lg)",
        textDecoration: "none",
        color: "inherit",
      }}
    >
      <span
        style={{
          width: 38,
          height: 38,
          borderRadius: 999,
          background: "var(--caramel)",
          color: "var(--surface)",
          display: "grid",
          placeItems: "center",
        }}
      >
        <Icon.Clock size={18} />
      </span>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: "var(--caramel-deep)" }}>Timer rack</div>
        <div style={{ fontSize: 12, color: "var(--caramel-deep)", opacity: 0.85, marginTop: 1 }}>
          {count === 0 ? "No timers running" : `${count} timer${count === 1 ? "" : "s"} on the rack`}
        </div>
      </div>
      <Icon.Chevron size={16} style={{ color: "var(--caramel-deep)" }} />
    </Link>
  );
}

// ---------- Cups ⇄ g ----------

function CupsConverter() {
  const [value, setValue] = useState("1");
  const [ingredient, setIngredient] = useState("All-purpose flour");
  const cupsN = parseCups(value);
  const grams =
    cupsN != null && isFinite(cupsN) ? Math.round((CUP_GRAMS[ingredient] || 0) * cupsN) : null;

  return (
    <div>
      <Field label="Ingredient">
        <select
          value={ingredient}
          onChange={(e) => setIngredient(e.target.value)}
          style={selectStyle}
        >
          {Object.keys(CUP_GRAMS).map((k) => (
            <option key={k} value={k}>
              {k}
            </option>
          ))}
        </select>
      </Field>
      <Field
        label="Cups"
        hint={
          value && cupsN != null
            ? `Reading as ${formatCups(cupsN)} cup${cupsN === 1 ? "" : "s"}`
            : "Accepts 1, 1.5, 1/2, half, two and a half…"
        }
        error={value && cupsN == null ? "Hmm, couldn't read that" : undefined}
      >
        <TextInput
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="e.g. 1/2 or half"
          error={!!value && cupsN == null}
          style={bigInput}
        />
      </Field>
      <ResultCard tone="caramel" label="Grams" value={grams != null ? `${grams} g` : "—"}>
        {CUP_GRAMS[ingredient]} g per cup
      </ResultCard>
    </div>
  );
}

// ---------- °C ⇄ °F ----------

function TempConverter() {
  const [value, setValue] = useState("180");
  const [dir, setDir] = useState<"c-to-f" | "f-to-c">("c-to-f");
  const n = parseFloat(value);
  const out = isFinite(n)
    ? dir === "c-to-f"
      ? Math.round((n * 9) / 5 + 32)
      : Math.round(((n - 32) * 5) / 9)
    : null;

  return (
    <div>
      <Field label="Direction">
        <div style={twoSegStyle}>
          {(
            [
              { v: "c-to-f", label: "°C → °F" },
              { v: "f-to-c", label: "°F → °C" },
            ] as const
          ).map((o) => {
            const sel = dir === o.v;
            return (
              <button
                key={o.v}
                type="button"
                onClick={() => setDir(o.v)}
                style={{ ...segItem, background: sel ? "var(--surface)" : "transparent", color: sel ? "var(--ink)" : "var(--ink-soft)" }}
              >
                {o.label}
              </button>
            );
          })}
        </div>
      </Field>
      <Field label={dir === "c-to-f" ? "Celsius" : "Fahrenheit"}>
        <TextInput
          value={value}
          onChange={(e) => setValue(e.target.value.replace(/[^0-9.\-]/g, ""))}
          placeholder="0"
          style={bigInput}
        />
      </Field>
      <ResultCard tone="rose" label={dir === "c-to-f" ? "Fahrenheit" : "Celsius"} value={out != null ? `${out} ${dir === "c-to-f" ? "°F" : "°C"}` : "—"} />
      <SectionHeader>Common bake temps</SectionHeader>
      <Card padding={0}>
        {(
          [
            ["Low / proof", "50 °C", "120 °F"],
            ["Slow bake / meringue", "100 °C", "212 °F"],
            ["Cheesecake water bath", "150 °C", "300 °F"],
            ["Sponge cake", "165 °C", "325 °F"],
            ["Standard bake / butter cake", "180 °C", "350 °F"],
            ["Brownies / cookies", "190 °C", "375 °F"],
            ["Bread", "200 °C", "395 °F"],
            ["Choux / puff pastry", "220 °C", "425 °F"],
            ["Pizza", "230 °C", "450 °F"],
          ] as const
        ).map(([k, c, f], i, arr) => (
          <RefRow key={k} label={k} value={`${c} · ${f}`} last={i === arr.length - 1} />
        ))}
      </Card>
    </div>
  );
}

// ---------- Scale ----------

function ScaleConverter() {
  const [from, setFrom] = useState("8");
  const [to, setTo] = useState("12");
  const f = parseFloat(from);
  const t = parseFloat(to);
  const factor = isFinite(f) && isFinite(t) && f > 0 ? t / f : null;

  return (
    <div>
      <Field label="Original servings">
        <TextInput value={from} onChange={(e) => setFrom(e.target.value.replace(/[^0-9.]/g, ""))} placeholder="8" />
      </Field>
      <Field label="Target servings">
        <TextInput value={to} onChange={(e) => setTo(e.target.value.replace(/[^0-9.]/g, ""))} placeholder="12" />
      </Field>
      <ResultCard tone="sage" label="Multiply every ingredient by" value={factor != null ? "×" + factor.toFixed(2) : "—"}>
        Bake time scales less than linearly — add 10–15% time, keep temp the same.
      </ResultCard>
    </div>
  );
}

// ---------- Volume ----------
// Internal canonical unit: ml. Most baking liquids fall in 1–500 ml range.

type VolUnit = "ml" | "tsp" | "tbsp" | "cup" | "floz" | "litre";
const VOL_PER_ML: Record<VolUnit, number> = {
  ml: 1,
  tsp: 5,
  tbsp: 15,
  cup: 240,
  floz: 30,
  litre: 1000,
};
const VOL_LABEL: Record<VolUnit, string> = {
  ml: "ml",
  tsp: "tsp",
  tbsp: "tbsp",
  cup: "cup",
  floz: "fl oz",
  litre: "L",
};

function VolumeConverter() {
  const [value, setValue] = useState("1");
  const [from, setFrom] = useState<VolUnit>("cup");
  const [to, setTo] = useState<VolUnit>("ml");
  const n = parseCups(value); // reuse decimal/fraction/word parser
  const result =
    n != null && isFinite(n) ? (n * VOL_PER_ML[from]) / VOL_PER_ML[to] : null;

  return (
    <div>
      <UnitPickerRow value={from} onChange={setFrom} options={["ml", "tsp", "tbsp", "cup", "floz", "litre"]} labels={VOL_LABEL} label="From" />
      <UnitPickerRow value={to} onChange={setTo} options={["ml", "tsp", "tbsp", "cup", "floz", "litre"]} labels={VOL_LABEL} label="To" />
      <Field
        label="Amount"
        hint={
          value && n != null
            ? `Reading as ${formatCups(n)} ${VOL_LABEL[from]}`
            : "Accepts 1, 1.5, 1/2, half…"
        }
      >
        <TextInput value={value} onChange={(e) => setValue(e.target.value)} style={bigInput} />
      </Field>
      <ResultCard tone="caramel" label={VOL_LABEL[to]} value={result != null ? formatNum(result) + " " + VOL_LABEL[to] : "—"} />

      <SectionHeader>Reference</SectionHeader>
      <Card padding={0}>
        {[
          ["1 tsp", "5 ml"],
          ["1 tbsp", "15 ml · 3 tsp"],
          ["1 fl oz", "30 ml · 2 tbsp"],
          ["1/4 cup", "60 ml · 4 tbsp"],
          ["1/3 cup", "80 ml"],
          ["1/2 cup", "120 ml · 8 tbsp"],
          ["1 cup", "240 ml · 16 tbsp"],
          ["1 litre", "1000 ml · ~4.2 cups"],
        ].map(([k, v], i, arr) => (
          <RefRow key={k} label={k} value={v} last={i === arr.length - 1} />
        ))}
      </Card>
    </div>
  );
}

// ---------- Length (cm ⇄ inch + tin sizes) ----------

function LengthConverter() {
  const [value, setValue] = useState("8");
  const [dir, setDir] = useState<"in-to-cm" | "cm-to-in">("in-to-cm");
  const n = parseFloat(value);
  const result = isFinite(n) ? (dir === "in-to-cm" ? n * 2.54 : n / 2.54) : null;

  return (
    <div>
      <Field label="Direction">
        <div style={twoSegStyle}>
          {(
            [
              { v: "in-to-cm", label: "inch → cm" },
              { v: "cm-to-in", label: "cm → inch" },
            ] as const
          ).map((o) => {
            const sel = dir === o.v;
            return (
              <button
                key={o.v}
                type="button"
                onClick={() => setDir(o.v)}
                style={{ ...segItem, background: sel ? "var(--surface)" : "transparent", color: sel ? "var(--ink)" : "var(--ink-soft)" }}
              >
                {o.label}
              </button>
            );
          })}
        </div>
      </Field>
      <Field label={dir === "in-to-cm" ? "Inches" : "Centimetres"}>
        <TextInput
          value={value}
          onChange={(e) => setValue(e.target.value.replace(/[^0-9.]/g, ""))}
          style={bigInput}
        />
      </Field>
      <ResultCard tone="rose" label={dir === "in-to-cm" ? "Centimetres" : "Inches"} value={result != null ? formatNum(result) + (dir === "in-to-cm" ? " cm" : " in") : "—"} />

      <SectionHeader>Round cake tin sizes</SectionHeader>
      <Card padding={0}>
        {(
          [
            ["4″ bento", "10 cm", "~2 servings"],
            ["6″", "15 cm", "~12 servings"],
            ["7″", "18 cm", "~16 servings"],
            ["8″", "20 cm", "~22 servings"],
            ["9″", "23 cm", "~32 servings"],
            ["10″", "25 cm", "~40 servings"],
            ["12″", "30 cm", "~58 servings"],
          ] as const
        ).map(([k, cm, s], i, arr) => (
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
            <span style={{ fontSize: 13.5, fontWeight: 600 }}>{k}</span>
            <span style={refValue}>
              {cm} · {s}
            </span>
          </div>
        ))}
      </Card>
    </div>
  );
}

// ---------- Weight ----------

type WeightUnit = "g" | "kg" | "oz" | "lb";
const WEIGHT_PER_G: Record<WeightUnit, number> = {
  g: 1,
  kg: 1000,
  oz: 28.3495,
  lb: 453.592,
};
const WEIGHT_LABEL: Record<WeightUnit, string> = {
  g: "g",
  kg: "kg",
  oz: "oz",
  lb: "lb",
};

function WeightConverter() {
  const [value, setValue] = useState("1");
  const [from, setFrom] = useState<WeightUnit>("oz");
  const [to, setTo] = useState<WeightUnit>("g");
  const n = parseCups(value);
  const result =
    n != null && isFinite(n) ? (n * WEIGHT_PER_G[from]) / WEIGHT_PER_G[to] : null;

  return (
    <div>
      <UnitPickerRow value={from} onChange={setFrom} options={["g", "kg", "oz", "lb"]} labels={WEIGHT_LABEL} label="From" />
      <UnitPickerRow value={to} onChange={setTo} options={["g", "kg", "oz", "lb"]} labels={WEIGHT_LABEL} label="To" />
      <Field label="Amount">
        <TextInput value={value} onChange={(e) => setValue(e.target.value)} style={bigInput} />
      </Field>
      <ResultCard tone="sage" label={WEIGHT_LABEL[to]} value={result != null ? formatNum(result) + " " + WEIGHT_LABEL[to] : "—"} />

      <SectionHeader>Reference</SectionHeader>
      <Card padding={0}>
        {[
          ["1 oz", "≈ 28 g"],
          ["1 lb", "≈ 454 g"],
          ["1 stick butter (US)", "≈ 113 g · 4 oz"],
          ["Large egg (no shell)", "≈ 50 g"],
          ["Egg white (large)", "≈ 30 g"],
          ["Egg yolk (large)", "≈ 18 g"],
          ["1 cup flour", "≈ 125 g"],
          ["1 cup sugar", "≈ 200 g"],
        ].map(([k, v], i, arr) => (
          <RefRow key={k} label={k} value={v} last={i === arr.length - 1} />
        ))}
      </Card>
    </div>
  );
}

// ---------- Yeast substitution ----------

function YeastConverter() {
  const [value, setValue] = useState("7");
  const [from, setFrom] = useState<"instant" | "active" | "fresh">("instant");
  const n = parseCups(value);
  // Substitution factors (mass-based): instant 1.0, active dry 1.25, fresh 3.0.
  const FACTOR: Record<"instant" | "active" | "fresh", number> = {
    instant: 1,
    active: 1.25,
    fresh: 3,
  };
  const LABEL: Record<"instant" | "active" | "fresh", string> = {
    instant: "Instant",
    active: "Active dry",
    fresh: "Fresh / cake",
  };
  const grams = n != null && isFinite(n) ? n : null;
  const others = (["instant", "active", "fresh"] as const).filter((k) => k !== from);

  return (
    <div>
      <Field label="I have">
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {(["instant", "active", "fresh"] as const).map((k) => {
            const sel = from === k;
            return (
              <span
                key={k}
                onClick={() => setFrom(k)}
                style={{
                  padding: "7px 12px",
                  fontSize: 12.5,
                  fontWeight: 600,
                  borderRadius: 999,
                  border: "1.5px solid " + (sel ? "var(--caramel)" : "var(--line)"),
                  background: sel ? "var(--caramel-soft)" : "var(--surface)",
                  color: sel ? "var(--caramel-deep)" : "var(--ink-soft)",
                  cursor: "pointer",
                }}
              >
                {LABEL[k]}
              </span>
            );
          })}
        </div>
      </Field>
      <Field label="Grams">
        <TextInput value={value} onChange={(e) => setValue(e.target.value)} prefix="g" style={bigInput} />
      </Field>

      <Card
        padding={14}
        style={{ marginTop: 14, background: "var(--caramel-soft)", border: "1px solid var(--caramel)" }}
      >
        <div style={uppercase("caramel")}>Equivalent</div>
        {others.map((k) => {
          const ratio = FACTOR[k] / FACTOR[from];
          return (
            <div
              key={k}
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: 14,
                marginTop: 8,
                color: "var(--caramel-deep)",
              }}
            >
              <span>{LABEL[k]}</span>
              <span style={{ fontFamily: "DM Serif Display, serif", fontSize: 18 }}>
                {grams != null ? formatNum(grams * ratio) : "—"} g
              </span>
            </div>
          );
        })}
      </Card>

      <SectionHeader>Typical batch</SectionHeader>
      <Card padding={14}>
        <div style={{ fontSize: 12.5, color: "var(--ink-soft)", lineHeight: 1.55 }}>
          1 sachet of instant yeast is <strong>7 g</strong> — enough for ~500 g of bread flour.
          Active dry needs proofing in warm water first; instant goes straight into the dry mix.
        </div>
      </Card>
    </div>
  );
}

// ---------- Shared bits ----------

function ResultCard({
  tone,
  label,
  value,
  children,
}: {
  tone: "caramel" | "rose" | "sage";
  label: string;
  value: string;
  children?: React.ReactNode;
}) {
  const palette = {
    caramel: { bg: "var(--caramel-soft)", border: "var(--caramel)", fg: "var(--caramel-deep)" },
    rose: { bg: "var(--rose-soft)", border: "var(--rose)", fg: "oklch(0.38 0.10 25)" },
    sage: { bg: "var(--sage-soft)", border: "var(--sage)", fg: "oklch(0.34 0.07 145)" },
  } as const;
  const p = palette[tone];
  return (
    <Card
      padding={18}
      style={{ marginTop: 14, background: p.bg, border: `1px solid ${p.border}` }}
    >
      <div style={uppercase(tone)}>{label}</div>
      <div
        style={{
          fontFamily: "DM Serif Display, serif",
          fontSize: 36,
          color: p.fg,
          marginTop: 4,
        }}
      >
        {value}
      </div>
      {children && (
        <div style={{ fontSize: 12, color: "var(--ink-soft)", marginTop: 4 }}>{children}</div>
      )}
    </Card>
  );
}

function UnitPickerRow<T extends string>({
  value,
  onChange,
  options,
  labels,
  label,
}: {
  value: T;
  onChange: (v: T) => void;
  options: T[];
  labels: Record<T, string>;
  label: string;
}) {
  return (
    <Field label={label}>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        {options.map((o) => {
          const sel = value === o;
          return (
            <span
              key={o}
              onClick={() => onChange(o)}
              style={{
                padding: "6px 12px",
                fontSize: 12.5,
                fontWeight: 600,
                borderRadius: 999,
                border: "1.5px solid " + (sel ? "var(--caramel)" : "var(--line)"),
                background: sel ? "var(--caramel-soft)" : "var(--surface)",
                color: sel ? "var(--caramel-deep)" : "var(--ink-soft)",
                cursor: "pointer",
              }}
            >
              {labels[o]}
            </span>
          );
        })}
      </div>
    </Field>
  );
}

function RefRow({ label, value, last }: { label: string; value: string; last?: boolean }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "10px 14px",
        borderBottom: last ? "none" : "1px solid var(--line-soft)",
      }}
    >
      <span style={{ fontSize: 13.5 }}>{label}</span>
      <span style={refValue}>{value}</span>
    </div>
  );
}

function uppercase(tone: "caramel" | "rose" | "sage"): React.CSSProperties {
  const fg =
    tone === "caramel"
      ? "var(--caramel-deep)"
      : tone === "rose"
        ? "oklch(0.38 0.10 25)"
        : "oklch(0.34 0.07 145)";
  return {
    fontSize: 11.5,
    color: fg,
    letterSpacing: "0.04em",
    textTransform: "uppercase",
  };
}

// Round to at most 2 decimals, drop trailing zeros; pretty-print integers.
function formatNum(n: number): string {
  if (!isFinite(n)) return "—";
  if (Math.abs(n) >= 100) return Math.round(n).toLocaleString("en-IN");
  const r = Math.round(n * 100) / 100;
  return String(r).replace(/\.?0+$/, "");
}

// Parser shared with cups input: accepts decimals, fractions, English words.
function parseCups(raw: string): number | null {
  if (!raw) return null;
  let s = raw.toLowerCase().trim();
  if (!s) return null;
  s = s.replace(/\b(cups?|c\.?)\b/g, " ").trim();
  const wordFractions: Array<[RegExp, string]> = [
    [/\bthree[\s-]?quarters?\b/g, "3/4"],
    [/\btwo[\s-]?thirds?\b/g, "2/3"],
    [/\btwo[\s-]?fifths?\b/g, "2/5"],
    [/\bthree[\s-]?fifths?\b/g, "3/5"],
    [/\bfour[\s-]?fifths?\b/g, "4/5"],
    [/\bthree[\s-]?eighths?\b/g, "3/8"],
    [/\bfive[\s-]?eighths?\b/g, "5/8"],
    [/\bseven[\s-]?eighths?\b/g, "7/8"],
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
  const wordNums: Record<string, string> = {
    one: "1", two: "2", three: "3", four: "4", five: "5",
    six: "6", seven: "7", eight: "8", nine: "9", ten: "10",
  };
  for (const [w, n] of Object.entries(wordNums)) {
    s = s.replace(new RegExp(`\\b${w}\\b`, "g"), n);
  }
  s = s.replace(/\b(and|a|an)\b/g, " ");
  s = s.replace(/\s+/g, " ").trim();
  if (!s) return null;

  let m = s.match(/^(\d+)\s+(\d+)\/(\d+)$/);
  if (m) {
    const whole = parseInt(m[1], 10);
    const num = parseInt(m[2], 10);
    const den = parseInt(m[3], 10);
    if (den === 0) return null;
    return whole + num / den;
  }
  m = s.match(/^(\d+)\/(\d+)$/);
  if (m) {
    const num = parseInt(m[1], 10);
    const den = parseInt(m[2], 10);
    if (den === 0) return null;
    return num / den;
  }
  m = s.match(/^(\d+(?:\.\d+)?|\.\d+)$/);
  if (m) return parseFloat(m[1]);
  m = s.match(/^(\d+(?:\.\d+)?)\s+(\d+(?:\.\d+)?)$/);
  if (m) return parseFloat(m[1]) + parseFloat(m[2]);
  return null;
}

function formatCups(n: number): string {
  if (!isFinite(n) || n < 0) return "—";
  if (Number.isInteger(n)) return String(n);
  const r = Math.round(n * 100) / 100;
  return String(r).replace(/\.?0+$/, "");
}

const bigInput: React.CSSProperties = {
  fontSize: 22,
  padding: "14px 12px",
  fontWeight: 600,
  fontFamily: "DM Serif Display, serif",
};

const selectStyle: React.CSSProperties = {
  width: "100%",
  padding: 12,
  background: "var(--surface)",
  border: "1px solid var(--line)",
  borderRadius: "var(--r)",
  fontSize: 14,
  fontFamily: "inherit",
};

const twoSegStyle: React.CSSProperties = {
  display: "inline-flex",
  background: "var(--surface-3)",
  padding: 3,
  borderRadius: "var(--r)",
  gap: 2,
  width: "100%",
};

const segItem: React.CSSProperties = {
  flex: 1,
  padding: "7px 10px",
  fontSize: 13,
  fontWeight: 600,
  textAlign: "center",
  borderRadius: "calc(var(--r) - 3px)",
  border: "none",
  cursor: "pointer",
  fontFamily: "inherit",
};

const refValue: React.CSSProperties = {
  fontSize: 12.5,
  color: "var(--ink-soft)",
  fontFamily: "JetBrains Mono, monospace",
};

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
