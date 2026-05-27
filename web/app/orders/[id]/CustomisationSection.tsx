"use client";

import { useEffect, useState, useTransition } from "react";
import { Card, Pill } from "@/components/ui";
import { Sheet, TextInput, Button } from "@/components/ui-client";
import { Icon } from "@/components/Icon";
import { fmtMoney } from "@/lib/format";
import {
  ADDON_CATEGORIES,
  addonsTotal,
  briefSchemaFor,
  hasCustomisation,
  type Customisation,
  type CustomisationAddon,
  type CustomisationBrief,
} from "@/lib/customisation";
import { updateOrderCustomisation } from "./actions";
import type { AddonRow } from "@/app/admin/addons/actions";
import { BriefForm } from "@/components/BriefForm";

export function CustomisationSection({
  orderId,
  productLine,
  catalogue,
  initial,
  recipeCost,
}: {
  orderId: string;
  productLine: string;
  catalogue: AddonRow[];
  initial: Customisation;
  recipeCost: number;
}) {
  const briefSchema = briefSchemaFor(productLine);
  const [open, setOpen] = useState(false);
  const [brief, setBrief] = useState<CustomisationBrief>(initial.brief ?? {});
  const [addons, setAddons] = useState<CustomisationAddon[]>(initial.addons ?? []);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setBrief(initial.brief ?? {});
    setAddons(initial.addons ?? []);
  }, [initial]);

  const addonsCost = addonsTotal(addons);
  const totalCustomisationCost = addonsCost;

  function toggleAddon(row: AddonRow) {
    setAddons((arr) => {
      const exists = arr.find((a) => a.id === row.id);
      if (exists) return arr.filter((a) => a.id !== row.id);
      return [
        ...arr,
        {
          id: row.id,
          name: row.name,
          qty: row.default_qty,
          price: row.default_cost,
          notes: row.notes ?? undefined,
        },
      ];
    });
  }

  function patchAddon(id: string, patch: Partial<CustomisationAddon>) {
    setAddons((arr) => arr.map((a) => (a.id === id ? { ...a, ...patch } : a)));
  }

  function save() {
    setError(null);
    startTransition(async () => {
      try {
        await updateOrderCustomisation(orderId, { brief, addons });
        setOpen(false);
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
      }
    });
  }

  return (
    <>
      {hasCustomisation({ brief, addons }) ? (
        <Card padding={14}>
          <BriefSummary brief={brief} />
          {addons.length > 0 && (
            <>
              <div style={{ height: 1, background: "var(--line-soft)", margin: "10px 0" }} />
              <div
                style={{
                  fontSize: 11.5,
                  color: "var(--muted)",
                  letterSpacing: "0.04em",
                  textTransform: "uppercase",
                  marginBottom: 6,
                }}
              >
                Addons
              </div>
              {addons.map((a) => (
                <div
                  key={a.id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "4px 0",
                    fontSize: 13,
                  }}
                >
                  <div>
                    <span style={{ fontWeight: 600 }}>{a.name}</span>
                    {a.qty !== 1 && (
                      <span style={{ color: "var(--muted)", marginLeft: 4 }}>× {a.qty}</span>
                    )}
                    {a.notes && (
                      <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 1 }}>
                        {a.notes}
                      </div>
                    )}
                  </div>
                  <span style={{ fontWeight: 600 }}>{fmtMoney(a.price * a.qty)}</span>
                </div>
              ))}
              <div
                style={{
                  borderTop: "1px dashed var(--line)",
                  margin: "10px 0 6px",
                  paddingTop: 8,
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: 13,
                }}
              >
                <span style={{ color: "var(--ink-soft)" }}>Recipe ingredient cost</span>
                <span>{fmtMoney(recipeCost)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                <span style={{ color: "var(--ink-soft)" }}>Addons cost</span>
                <span>{fmtMoney(totalCustomisationCost)}</span>
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontWeight: 700,
                  fontSize: 13.5,
                  marginTop: 4,
                }}
              >
                <span>Total bake cost</span>
                <span>{fmtMoney(recipeCost + totalCustomisationCost)}</span>
              </div>
              <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 4, lineHeight: 1.4 }}>
                Cost basis — separate from the all-in quoted price billed to the customer.
              </div>
            </>
          )}
          <button type="button" onClick={() => setOpen(true)} style={editBtn}>
            <Icon.Edit size={14} /> Edit customisation
          </button>
        </Card>
      ) : (
        <Card
          padding={14}
          style={{
            background: "var(--surface-2)",
            border: "1px dashed var(--line)",
          }}
        >
          <div style={{ fontSize: 12.5, color: "var(--ink-soft)", lineHeight: 1.5 }}>
            No customisation captured yet. Add the brief — occasion, theme, message, figurines —
            and pick addons from your catalogue.
          </div>
          <button
            type="button"
            onClick={() => setOpen(true)}
            style={{ ...editBtn, marginTop: 12 }}
          >
            <Icon.Plus size={14} /> Add customisation
          </button>
        </Card>
      )}

      <Sheet open={open} onClose={() => setOpen(false)} title="Customisation" snap="full">
        <div style={{ paddingBottom: 24 }}>
          {/* Brief (fields adapt to product line) */}
          <div style={sectionLabel}>Brief</div>
          <BriefForm schema={briefSchema} brief={brief} onChange={setBrief} />

          {/* Addons picker */}
          <div style={{ ...sectionLabel, marginTop: 8 }}>Addons</div>

          {ADDON_CATEGORIES.map((cat) => {
            const items = catalogue.filter((r) => r.category === cat && r.is_active);
            if (items.length === 0) return null;
            return (
              <div key={cat} style={{ marginBottom: 10 }}>
                <div style={{ fontSize: 11.5, color: "var(--muted)", marginBottom: 4, textTransform: "capitalize" }}>
                  {cat}
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {items.map((row) => {
                    const sel = addons.find((a) => a.id === row.id);
                    return (
                      <div
                        key={row.id}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 10,
                          padding: "8px 10px",
                          background: sel ? "var(--caramel-soft)" : "var(--surface)",
                          border: "1.5px solid " + (sel ? "var(--caramel)" : "var(--line-soft)"),
                          borderRadius: "var(--r)",
                        }}
                      >
                        <button
                          type="button"
                          onClick={() => toggleAddon(row)}
                          aria-label={sel ? `Remove ${row.name}` : `Add ${row.name}`}
                          style={{
                            width: 24,
                            height: 24,
                            borderRadius: 999,
                            background: sel ? "var(--caramel)" : "transparent",
                            border: "1.5px solid " + (sel ? "var(--caramel-deep)" : "var(--line)"),
                            color: "var(--surface)",
                            display: "grid",
                            placeItems: "center",
                            cursor: "pointer",
                            flexShrink: 0,
                          }}
                        >
                          {sel && <Icon.Check size={12} />}
                        </button>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 13, fontWeight: 600 }}>{row.name}</div>
                          {row.notes && (
                            <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 1 }}>
                              {row.notes}
                            </div>
                          )}
                        </div>
                        {sel ? (
                          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                            <input
                              value={String(sel.qty)}
                              onChange={(e) => {
                                const q = parseFloat(e.target.value.replace(/[^0-9.]/g, "")) || 0;
                                patchAddon(row.id, { qty: q });
                              }}
                              style={qtyInput}
                            />
                            <input
                              value={String(sel.price)}
                              onChange={(e) => {
                                const p = parseFloat(e.target.value.replace(/[^0-9.]/g, "")) || 0;
                                patchAddon(row.id, { price: p });
                              }}
                              style={{ ...qtyInput, width: 60 }}
                            />
                          </div>
                        ) : (
                          <div style={{ fontSize: 12, color: "var(--muted)", fontWeight: 600 }}>
                            {row.default_cost > 0 ? fmtMoney(row.default_cost) : "free"}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {addons.length > 0 && (
            <Card
              padding={12}
              style={{
                marginTop: 12,
                background: "var(--sage-soft)",
                border: "1px solid var(--sage)",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700 }}>
                <span>Customisation addons total</span>
                <span>{fmtMoney(addonsTotal(addons))}</span>
              </div>
              <div style={{ fontSize: 11, color: "var(--ink-soft)", marginTop: 4 }}>
                Add this to the recipe base when quoting the customer.
              </div>
            </Card>
          )}

          {error && (
            <div
              style={{
                marginTop: 12,
                padding: 10,
                background: "oklch(0.94 0.05 28)",
                border: "1px solid var(--danger)",
                borderRadius: "var(--r)",
                fontSize: 12.5,
                color: "var(--danger)",
              }}
            >
              {error}
            </div>
          )}

          <div style={{ display: "flex", gap: 10, marginTop: 18 }}>
            <Button variant="secondary" size="lg" full onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="lg" full onClick={save} disabled={isPending}>
              {isPending ? "Saving…" : "Save customisation"}
            </Button>
          </div>
        </div>
      </Sheet>
    </>
  );
}

function BriefSummary({ brief }: { brief: CustomisationBrief }) {
  const lines: Array<[string, string]> = [];
  if (brief.occasion) lines.push(["Occasion", brief.occasion]);
  if (brief.shape) lines.push(["Shape", brief.shape]);
  if (brief.theme) lines.push(["Theme", brief.theme]);
  if (brief.colors && brief.colors.length) lines.push(["Colours", brief.colors.join(" · ")]);
  if (brief.message && brief.message.text)
    lines.push([
      "Message",
      brief.message.text + (brief.message.color ? ` (${brief.message.color})` : ""),
    ]);
  if (brief.figurines) lines.push(["Figurines", brief.figurines]);
  if (brief.dietary && brief.dietary.length) lines.push(["Dietary", brief.dietary.join(", ")]);
  if (brief.notes) lines.push(["Notes", brief.notes]);

  if (lines.length === 0) return null;
  return (
    <div style={{ fontSize: 13, lineHeight: 1.55 }}>
      {lines.map(([k, v]) => (
        <div key={k} style={{ marginTop: 2 }}>
          <span style={{ color: "var(--muted)", fontSize: 11.5 }}>{k}</span>
          <div style={{ fontWeight: 500 }}>{v}</div>
        </div>
      ))}
    </div>
  );
}

const sectionLabel: React.CSSProperties = {
  fontFamily: "var(--font-serif), DM Serif Display, serif",
  fontSize: 17,
  margin: "12px 0 10px",
};

const qtyInput: React.CSSProperties = {
  width: 44,
  padding: "6px 8px",
  border: "1px solid var(--line)",
  borderRadius: "var(--r)",
  background: "var(--surface)",
  fontSize: 12.5,
  textAlign: "center",
  fontFamily: "inherit",
  outline: "none",
};

const editBtn: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  padding: "7px 12px",
  fontSize: 12.5,
  fontWeight: 600,
  background: "var(--surface)",
  color: "var(--ink)",
  border: "1px solid var(--line)",
  borderRadius: "var(--r)",
  cursor: "pointer",
  fontFamily: "inherit",
  marginTop: 12,
};
