"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useTransition } from "react";
import { PhoneShell } from "@/components/PhoneShell";
import { Card, CakeArt, Avatar, Pill, Field } from "@/components/ui";
import { Button, TextInput, Toggle, ListRow } from "@/components/ui-client";
import { Icon } from "@/components/Icon";
import { fmtMoney, fmtDate } from "@/lib/format";
import { createOrder } from "./actions";
import type { Customer, Recipe, ProductLine } from "./page";
import { BriefForm } from "@/components/BriefForm";
import {
  ADDON_CATEGORIES,
  addonsTotal,
  briefSchemaFor,
  type CustomisationAddon,
  type CustomisationBrief,
} from "@/lib/customisation";
import type { AddonRow } from "@/app/admin/addons/actions";

type Props = {
  customers: Customer[];
  recipes: Recipe[];
  capacityCeiling: number;
  loadByDate: Record<string, number>;
  blockedByDate: Record<string, { reason: string; type: string | null }>;
  today: string;
  productLines: ProductLine[];
  addons: AddonRow[];
};

type FormState = {
  customerId: string | null;
  newCustomerName: string;
  newCustomerPhone: string;
  newCustomerInsta: string;
  productLine: string;
  title: string;
  flavor: string;
  size: string;
  servings: number;
  eggless: boolean;
  brief: CustomisationBrief;
  selectedAddons: CustomisationAddon[];
  deliveryDate: string;
  deliverySlot: string;
  deliveryArea: string;
  coldChainNotes: string;
  price: string;
  deposit: string;
  notes: string;
};

const STEPS = ["Customer", "Product", "Look", "Delivery", "Pricing", "Review"] as const;

const SLOTS = ["9 AM", "11 AM", "1 PM", "3 PM", "5 PM", "7 PM", "8 PM", "Anytime"];

// Auto-saved draft for the New Order wizard. Restores form + current step
// on mount so a tab restart or accidental back-nav keeps the in-progress
// quote. Cleared after a successful submit. Versioned so a schema change
// to FormState ignores stale shapes instead of crashing.
const DRAFT_KEY = "tieredcake-new-order-draft-v1";

export function NewOrderForm({
  customers,
  recipes,
  capacityCeiling,
  loadByDate,
  blockedByDate,
  today,
  productLines,
  addons,
}: Props) {
  const [step, setStep] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const defaultLineName = productLines[0]?.name ?? "cake";
  const [form, setForm] = useState<FormState>({
    customerId: null,
    newCustomerName: "",
    newCustomerPhone: "",
    newCustomerInsta: "",
    productLine: defaultLineName,
    title: "",
    flavor: "",
    size: "",
    servings: 0,
    eggless: false,
    brief: {},
    selectedAddons: [],
    deliveryDate: "",
    deliverySlot: "",
    deliveryArea: "",
    coldChainNotes: "",
    price: "",
    deposit: "",
    notes: "",
  });
  // Hydration guard — once the saved draft (if any) is read, future renders
  // are allowed to write back. Stops the initial render's blank form from
  // clobbering whatever was saved.
  const [hydrated, setHydrated] = useState(false);
  const [restoredDraft, setRestoredDraft] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as { form?: FormState; step?: number };
        if (parsed && parsed.form && typeof parsed.form === "object") {
          setForm((f) => ({ ...f, ...parsed.form }));
          if (typeof parsed.step === "number" && parsed.step >= 0 && parsed.step < STEPS.length) {
            setStep(parsed.step);
          }
          setRestoredDraft(true);
        }
      }
    } catch {
      /* ignore corrupt draft */
    }
    setHydrated(true);
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      try {
        localStorage.setItem(DRAFT_KEY, JSON.stringify({ form, step }));
      } catch {
        /* storage full / private mode — ignore */
      }
    }, 200);
  }, [form, step, hydrated]);

  function clearDraft() {
    try {
      localStorage.removeItem(DRAFT_KEY);
    } catch {
      /* ignore */
    }
  }

  function set<K extends keyof FormState>(k: K, v: FormState[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  function validate(s: number): Record<string, string> {
    const e: Record<string, string> = {};
    if (s === 0) {
      if (!form.customerId && !form.newCustomerName) e.customer = "Pick or add a customer";
      if (!form.customerId && form.newCustomerName && !form.newCustomerPhone && !form.newCustomerInsta)
        e.contact = "Add a phone or Instagram handle";
    }
    if (s === 1) {
      if (!form.title) e.title = "Give the order a name";
      if (!form.flavor) e.flavor = "Pick a flavor";
      if (!form.size) e.size = "Pick a size";
    }
    // s === 2 ("Look") — brief is optional; skip validation
    if (s === 3) {
      if (!form.deliveryDate) e.deliveryDate = "Pick a date";
      if (!form.deliverySlot) e.deliverySlot = "Pick a time slot";
      if (!form.deliveryArea) e.deliveryArea = "Where is this going?";
    }
    if (s === 4) {
      const p = +form.price;
      if (!form.price || isNaN(p)) e.price = "Enter a number";
      else if (p < 500) e.price = "Hmm, ₹500 floor for custom orders";
      const d = +form.deposit;
      if (form.deposit && isNaN(d)) e.deposit = "Enter a number";
      else if (form.deposit && d > p) e.deposit = "Deposit cannot exceed price";
    }
    return e;
  }

  function next() {
    const e = validate(step);
    setErrors(e);
    if (Object.keys(e).length > 0) return;
    if (step === STEPS.length - 1) {
      submit();
    } else {
      setStep((s) => s + 1);
    }
  }

  function back() {
    if (step === 0) {
      window.history.length > 1 ? window.history.back() : (window.location.href = "/orders");
    } else {
      setStep((s) => s - 1);
    }
  }

  function submit() {
    setSubmitError(null);
    // Pre-clear the draft so a server redirect (which throws NEXT_REDIRECT
    // in dev) doesn't leave a stale draft behind. If submit throws, we
    // re-save below so the form isn't lost.
    clearDraft();
    startTransition(async () => {
      try {
        await createOrder({
          customerId: form.customerId,
          newCustomer: form.customerId
            ? null
            : {
                name: form.newCustomerName,
                phone: form.newCustomerPhone,
                instagram: form.newCustomerInsta,
              },
          productLine: form.productLine,
          title: form.title,
          flavor: form.flavor,
          size: form.size,
          servings: form.servings,
          eggless: form.eggless,
          // Legacy fields preserved for backward compat; brief is the new
          // structured source of truth.
          theme: form.brief.theme ?? "",
          addOns: [],
          customisation: { brief: form.brief, addons: form.selectedAddons },
          deliveryDate: form.deliveryDate,
          deliverySlot: form.deliverySlot,
          deliveryArea: form.deliveryArea,
          coldChainNotes: form.coldChainNotes,
          price: +form.price || 0,
          deposit: +form.deposit || 0,
          notes: form.notes,
        });
      } catch (err) {
        setSubmitError(err instanceof Error ? err.message : String(err));
        // Re-stash the draft so an error mid-submit doesn't lose work.
        try {
          localStorage.setItem(DRAFT_KEY, JSON.stringify({ form, step }));
        } catch {
          /* ignore */
        }
      }
    });
  }

  function discardDraft() {
    clearDraft();
    setRestoredDraft(false);
    setForm({
      customerId: null,
      newCustomerName: "",
      newCustomerPhone: "",
      newCustomerInsta: "",
      productLine: defaultLineName,
      title: "",
      flavor: "",
      size: "",
      servings: 0,
      eggless: false,
      brief: {},
      selectedAddons: [],
      deliveryDate: "",
      deliverySlot: "",
      deliveryArea: "",
      coldChainNotes: "",
      price: "",
      deposit: "",
      notes: "",
    });
    setStep(0);
  }

  return (
    <PhoneShell>
      <div data-screen-label="New Order">
        <header style={chromeHeader}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, minHeight: 32 }}>
            <Link href="/orders" style={chromeBtn} aria-label="Back">
              <Icon.ChevronLeft size={22} />
            </Link>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: "DM Serif Display, serif", fontSize: 21, lineHeight: 1.15 }}>
                New order
              </div>
              <div style={{ fontSize: 12.5, color: "var(--muted)", marginTop: 2 }}>
                {STEPS[step]}
              </div>
            </div>
          </div>
        </header>

        <div
          style={{
            padding: "6px 18px 14px",
            background: "var(--bg)",
            borderBottom: "1px solid var(--line-soft)",
          }}
        >
          <div style={{ display: "flex", gap: 4 }}>
            {STEPS.map((s, i) => (
              <div key={s} style={{ flex: 1 }}>
                <div
                  style={{
                    height: 4,
                    borderRadius: 999,
                    background: i <= step ? "var(--caramel)" : "var(--line)",
                    transition: "background .2s",
                  }}
                />
                <div
                  style={{
                    fontSize: 10.5,
                    marginTop: 5,
                    textAlign: "center",
                    fontWeight: i === step ? 600 : 500,
                    color: i === step ? "var(--ink)" : "var(--muted)",
                  }}
                >
                  {s}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ padding: "16px 18px 120px", overflowY: "auto", flex: 1, minHeight: 0 }}>
          {restoredDraft && (
            <div
              style={{
                marginBottom: 12,
                padding: "8px 12px",
                background: "var(--sage-soft)",
                border: "1px solid var(--sage)",
                borderRadius: "var(--r)",
                fontSize: 12,
                color: "var(--ink-soft)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 8,
              }}
            >
              <span>Draft restored from your last session.</span>
              <button
                type="button"
                onClick={discardDraft}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "var(--caramel-deep)",
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer",
                  fontFamily: "inherit",
                  textDecoration: "underline",
                }}
              >
                Start fresh
              </button>
            </div>
          )}
          {step === 0 && (
            <StepCustomer customers={customers} form={form} set={set} errors={errors} />
          )}
          {step === 1 && (
            <StepCake
              productLines={productLines}
              recipes={recipes}
              form={form}
              set={set}
              errors={errors}
            />
          )}
          {step === 2 && (
            <StepTheme
              form={form}
              set={set}
              catalogue={addons}
            />
          )}
          {step === 3 && (
            <StepDelivery
              form={form}
              set={set}
              errors={errors}
              today={today}
              capacityCeiling={capacityCeiling}
              loadByDate={loadByDate}
              blockedByDate={blockedByDate}
            />
          )}
          {step === 4 && (
            <StepPricing
              productLines={productLines}
              recipes={recipes}
              form={form}
              set={set}
              errors={errors}
            />
          )}
          {step === 5 && <StepReview customers={customers} form={form} />}

          {submitError && (
            <div
              style={{
                marginTop: 14,
                padding: 12,
                background: "oklch(0.94 0.05 28)",
                border: "1px solid var(--danger)",
                borderRadius: "var(--r)",
                fontSize: 12.5,
                color: "var(--danger)",
              }}
            >
              {submitError}
            </div>
          )}
        </div>

        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            padding: "12px 18px 24px",
            background: "var(--bg)",
            borderTop: "1px solid var(--line-soft)",
            display: "flex",
            gap: 10,
          }}
        >
          <Button variant="secondary" size="lg" onClick={back} style={{ width: 100 }}>
            {step === 0 ? "Cancel" : "Back"}
          </Button>
          <Button
            variant="primary"
            size="lg"
            full
            onClick={next}
            disabled={isPending}
          >
            {isPending
              ? "Saving…"
              : step === STEPS.length - 1
                ? "Create order"
                : "Continue"}
          </Button>
        </div>
      </div>
    </PhoneShell>
  );
}

// ---------- Step 1: Customer ----------

function StepCustomer({
  customers,
  form,
  set,
  errors,
}: {
  customers: Customer[];
  form: FormState;
  set: <K extends keyof FormState>(k: K, v: FormState[K]) => void;
  errors: Record<string, string>;
}) {
  const [search, setSearch] = useState("");
  const [adding, setAdding] = useState(false);

  const filtered = customers
    .filter(
      (c) =>
        !search ||
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.phone.includes(search) ||
        c.instagram.toLowerCase().includes(search.toLowerCase()),
    )
    .slice(0, 6);

  if (adding) {
    return (
      <div>
        <h2 style={stepHeading}>Add new customer</h2>
        <p style={stepLede}>We&rsquo;ll auto-create their profile.</p>
        <Field
          label="Full name"
          error={errors.contact && !form.newCustomerName ? "Required" : undefined}
        >
          <TextInput
            value={form.newCustomerName}
            onChange={(e) => set("newCustomerName", e.target.value)}
            placeholder="e.g. Aanya Reddy"
          />
        </Field>
        <Field label="Instagram handle" optional>
          <TextInput
            value={form.newCustomerInsta}
            onChange={(e) => set("newCustomerInsta", e.target.value)}
            placeholder="username"
            prefix="@"
          />
        </Field>
        <Field label="Phone" optional error={errors.contact}>
          <TextInput
            value={form.newCustomerPhone}
            onChange={(e) => set("newCustomerPhone", e.target.value)}
            placeholder="+91 …"
          />
        </Field>
        <Button variant="ghost" size="sm" onClick={() => setAdding(false)}>
          <Icon.ChevronLeft size={14} /> Back to search
        </Button>
      </div>
    );
  }

  return (
    <div>
      <h2 style={stepHeading}>Who&rsquo;s the order for?</h2>
      <p style={stepLede}>Search existing or add a new contact.</p>

      <div style={{ position: "relative", marginBottom: 14 }}>
        <Icon.Search
          size={16}
          style={{
            position: "absolute",
            left: 12,
            top: "50%",
            transform: "translateY(-50%)",
            color: "var(--muted)",
          }}
        />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, phone, @handle"
          style={{
            width: "100%",
            fontFamily: "inherit",
            fontSize: 14,
            padding: "11px 12px 11px 36px",
            borderRadius: "var(--r)",
            border: "1px solid var(--line)",
            background: "var(--surface)",
            outline: "none",
            boxSizing: "border-box",
          }}
        />
      </div>

      <Card padding={0}>
        <ListRow
          onClick={() => setAdding(true)}
          left={
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 999,
                  background: "var(--caramel-soft)",
                  color: "var(--caramel-deep)",
                  display: "grid",
                  placeItems: "center",
                }}
              >
                <Icon.Plus size={18} />
              </span>
              <div>
                <div style={{ fontSize: 13.5, fontWeight: 600 }}>Add new customer</div>
                <div style={{ fontSize: 11.5, color: "var(--muted)", marginTop: 2 }}>
                  First time ordering
                </div>
              </div>
            </div>
          }
          right={<Icon.Chevron size={16} style={{ color: "var(--muted)" }} />}
        />
        {filtered.map((c, i) => {
          const selected = form.customerId === c.id;
          return (
            <ListRow
              key={c.id}
              divider={i < filtered.length - 1}
              onClick={() => set("customerId", selected ? null : c.id)}
              left={
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <Avatar name={c.name} tone={c.avatarTone as "caramel" | "rose" | "sage"} size={40} />
                  <div>
                    <div
                      style={{
                        fontSize: 13.5,
                        fontWeight: 600,
                        display: "flex",
                        gap: 6,
                        alignItems: "center",
                      }}
                    >
                      {c.name}
                      {c.tags.includes("VIP") && (
                        <Pill tone="caramel" size="xs">
                          VIP
                        </Pill>
                      )}
                    </div>
                    <div style={{ fontSize: 11.5, color: "var(--muted)", marginTop: 2 }}>
                      {c.area} · {c.orderCount} {c.orderCount === 1 ? "order" : "orders"}
                    </div>
                  </div>
                </div>
              }
              right={
                selected ? (
                  <span
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: 999,
                      background: "var(--caramel)",
                      color: "var(--surface)",
                      display: "grid",
                      placeItems: "center",
                    }}
                  >
                    <Icon.Check size={14} />
                  </span>
                ) : null
              }
            />
          );
        })}
      </Card>
      {errors.customer && (
        <div style={{ fontSize: 12, color: "var(--danger)", marginTop: 8 }}>{errors.customer}</div>
      )}
    </div>
  );
}

// ---------- Step 2: Cake ----------

function StepCake({
  productLines,
  recipes,
  form,
  set,
  errors,
}: {
  productLines: ProductLine[];
  recipes: Recipe[];
  form: FormState;
  set: <K extends keyof FormState>(k: K, v: FormState[K]) => void;
  errors: Record<string, string>;
}) {
  const activeLine =
    productLines.find((p) => p.name === form.productLine) ?? productLines[0];
  const sizes = activeLine?.sizes ?? [];

  return (
    <div>
      <h2 style={stepHeading}>What are we making?</h2>
      <p style={stepLede}>Pick the product line, then flavour and size.</p>

      <Field label="Product line">
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {productLines.map((p) => {
            const sel = form.productLine === p.name;
            return (
              <span
                key={p.id}
                onClick={() => {
                  set("productLine", p.name);
                  // Reset size + servings — old selection probably doesn't apply.
                  set("size", "");
                  set("servings", 0);
                }}
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
                {p.label}
              </span>
            );
          })}
        </div>
      </Field>

      <Field
        label="Order name"
        hint={'A short title for your kitchen — "Pastel floral 6″ — Aanya"'}
        error={errors.title}
      >
        <TextInput
          value={form.title}
          onChange={(e) => set("title", e.target.value)}
          placeholder={'e.g. Pastel floral 6″ — Aanya'}
          error={!!errors.title}
        />
      </Field>

      <Field label="Flavour" error={errors.flavor}>
        <div
          style={{
            display: "flex",
            gap: 8,
            overflowX: "auto",
            margin: "0 -18px",
            padding: "4px 18px 4px",
            scrollbarWidth: "none",
          }}
        >
          {recipes.map((r) => {
            const selected = form.flavor === r.name;
            return (
              <div
                key={r.id}
                onClick={() => set("flavor", r.name)}
                style={{
                  flexShrink: 0,
                  width: 130,
                  background: selected ? "var(--caramel-soft)" : "var(--surface)",
                  border: "1.5px solid " + (selected ? "var(--caramel)" : "var(--line-soft)"),
                  borderRadius: 14,
                  padding: 10,
                  cursor: "pointer",
                  transition: "border-color .12s",
                }}
              >
                <CakeArt
                  tone={r.eggless ? "sage" : "caramel"}
                  size={110}
                  label={r.name.split(" ")[0]}
                  style={{ width: "100%", height: 78, marginBottom: 8 }}
                />
                <div style={{ fontSize: 12.5, fontWeight: 600, lineHeight: 1.2 }}>{r.name}</div>
                <div style={{ fontSize: 10.5, color: "var(--muted)", marginTop: 2 }}>
                  {r.eggless && (
                    <Pill tone="sage" size="xs" style={{ marginRight: 4 }}>
                      Eggless
                    </Pill>
                  )}
                  cost {fmtMoney(r.costPerCake)}
                </div>
              </div>
            );
          })}
        </div>
      </Field>

      <Field
        label={activeLine ? `Size · ${activeLine.label}` : "Size"}
        error={errors.size}
      >
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
          {sizes.map((s) => {
            const sel = form.size === s.name;
            return (
              <div
                key={s.name}
                onClick={() => {
                  set("size", s.name);
                  set("servings", s.servings);
                  // Pre-fill price field if blank, using the line's hint
                  if (!form.price && s.price_hint) {
                    set("price", String(s.price_hint));
                  }
                }}
                style={{
                  padding: "10px 8px",
                  border: "1.5px solid " + (sel ? "var(--caramel)" : "var(--line)"),
                  background: sel ? "var(--caramel-soft)" : "var(--surface)",
                  borderRadius: "var(--r)",
                  cursor: "pointer",
                  textAlign: "center",
                }}
              >
                <div style={{ fontSize: 13, fontWeight: 600 }}>{s.name}</div>
                <div style={{ fontSize: 10.5, color: "var(--muted)", marginTop: 2 }}>
                  {s.servings} servings
                  {s.price_hint ? ` · ${fmtMoney(s.price_hint)}` : ""}
                </div>
              </div>
            );
          })}
        </div>
      </Field>

      <Field label="Eggless?">
        <Toggle
          checked={form.eggless}
          onChange={(v) => set("eggless", v)}
          label={form.eggless ? "Yes — eggless build" : "Regular (with eggs)"}
        />
      </Field>
    </div>
  );
}

// ---------- Step 3: Theme ----------

function StepTheme({
  form,
  set,
  catalogue,
}: {
  form: FormState;
  set: <K extends keyof FormState>(k: K, v: FormState[K]) => void;
  catalogue: AddonRow[];
}) {
  const schema = briefSchemaFor(form.productLine);

  function toggleAddon(row: AddonRow) {
    const next = form.selectedAddons.find((a) => a.id === row.id)
      ? form.selectedAddons.filter((a) => a.id !== row.id)
      : [
          ...form.selectedAddons,
          {
            id: row.id,
            name: row.name,
            qty: row.default_qty,
            price: row.default_cost,
            notes: row.notes ?? undefined,
          },
        ];
    set("selectedAddons", next);
  }

  return (
    <div>
      <h2 style={stepHeading}>Describe the look</h2>
      <p style={stepLede}>
        Capture the structured brief — the fields below adapt to the product line.
      </p>

      <BriefForm
        schema={schema}
        brief={form.brief}
        onChange={(b) => set("brief", b)}
      />

      <div style={addonsHeader}>Addons</div>
      {ADDON_CATEGORIES.map((cat) => {
        const items = catalogue.filter((r) => r.category === cat && r.is_active);
        if (items.length === 0) return null;
        return (
          <div key={cat} style={{ marginBottom: 10 }}>
            <div
              style={{
                fontSize: 11.5,
                color: "var(--muted)",
                marginBottom: 4,
                textTransform: "capitalize",
              }}
            >
              {cat}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {items.map((row) => {
                const sel = form.selectedAddons.find((a) => a.id === row.id);
                return (
                  <button
                    key={row.id}
                    type="button"
                    onClick={() => toggleAddon(row)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      padding: "8px 10px",
                      background: sel ? "var(--caramel-soft)" : "var(--surface)",
                      border:
                        "1.5px solid " + (sel ? "var(--caramel)" : "var(--line-soft)"),
                      borderRadius: "var(--r)",
                      cursor: "pointer",
                      fontFamily: "inherit",
                      textAlign: "left",
                    }}
                  >
                    <span
                      style={{
                        width: 22,
                        height: 22,
                        borderRadius: 999,
                        background: sel ? "var(--caramel)" : "transparent",
                        border:
                          "1.5px solid " + (sel ? "var(--caramel-deep)" : "var(--line)"),
                        color: "var(--surface)",
                        display: "grid",
                        placeItems: "center",
                        flexShrink: 0,
                      }}
                    >
                      {sel && <Icon.Check size={12} />}
                    </span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>{row.name}</div>
                      {row.notes && (
                        <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 1 }}>
                          {row.notes}
                        </div>
                      )}
                    </div>
                    <div style={{ fontSize: 12, color: "var(--muted)", fontWeight: 600 }}>
                      {row.default_cost > 0 ? fmtMoney(row.default_cost) : "free"}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}

      {form.selectedAddons.length > 0 && (
        <Card
          padding={12}
          style={{
            marginTop: 12,
            background: "var(--sage-soft)",
            border: "1px solid var(--sage)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700 }}>
            <span>Addons total</span>
            <span>{fmtMoney(addonsTotal(form.selectedAddons))}</span>
          </div>
          <div style={{ fontSize: 11, color: "var(--ink-soft)", marginTop: 4 }}>
            The Pricing step will fold this into the suggested all-in quote.
          </div>
        </Card>
      )}
    </div>
  );
}

const addonsHeader: React.CSSProperties = {
  fontFamily: "DM Serif Display, serif",
  fontSize: 17,
  margin: "16px 0 10px",
};

// ---------- Step 4: Delivery ----------

function StepDelivery({
  form,
  set,
  errors,
  today,
  capacityCeiling,
  loadByDate,
  blockedByDate,
}: {
  form: FormState;
  set: <K extends keyof FormState>(k: K, v: FormState[K]) => void;
  errors: Record<string, string>;
  today: string;
  capacityCeiling: number;
  loadByDate: Record<string, number>;
  blockedByDate: Record<string, { reason: string; type: string | null }>;
}) {
  const startDate = new Date(today);
  const dates = Array.from({ length: 14 }, (_, i) => {
    const d = new Date(startDate);
    d.setDate(d.getDate() + i);
    return d.toISOString().slice(0, 10);
  });

  const selDate = form.deliveryDate;
  const selBlock = selDate ? blockedByDate[selDate] : null;
  const selLoad = selDate ? loadByDate[selDate] || 0 : 0;
  const selFull = selLoad >= capacityCeiling;

  const showColdChain =
    !!selDate &&
    (() => {
      const m = parseInt(selDate.slice(5, 7), 10);
      return m >= 3 && m <= 9;
    })();

  return (
    <div>
      <h2 style={stepHeading}>When &amp; where?</h2>
      <p style={stepLede}>Block delivery slots to avoid kitchen pile-ups.</p>

      <Field label="Delivery date" error={errors.deliveryDate}>
        <div
          style={{
            display: "flex",
            gap: 6,
            overflowX: "auto",
            margin: "0 -18px",
            padding: "0 18px 4px",
            scrollbarWidth: "none",
          }}
        >
          {dates.map((d) => {
            const dt = new Date(d);
            const selected = form.deliveryDate === d;
            const isToday = d === today;
            const load = loadByDate[d] || 0;
            const full = load >= capacityCeiling;
            const blocked = !!blockedByDate[d];
            const heat = blocked
              ? "var(--danger)"
              : full
                ? "var(--warn)"
                : load > 0
                  ? "var(--caramel)"
                  : "var(--ok)";
            return (
              <div
                key={d}
                onClick={() => set("deliveryDate", d)}
                style={{
                  flexShrink: 0,
                  width: 58,
                  padding: "10px 0 8px",
                  border: "1.5px solid " + (selected ? "var(--caramel)" : "var(--line)"),
                  background: selected ? "var(--caramel)" : "var(--surface)",
                  color: selected ? "var(--surface)" : "var(--ink)",
                  borderRadius: "var(--r)",
                  cursor: "pointer",
                  textAlign: "center",
                  position: "relative",
                }}
              >
                <div style={{ fontSize: 10.5, opacity: 0.8 }}>
                  {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][dt.getDay()]}
                </div>
                <div
                  style={{
                    fontFamily: "DM Serif Display, serif",
                    fontSize: 18,
                    lineHeight: 1.1,
                    marginTop: 4,
                  }}
                >
                  {dt.getDate()}
                </div>
                {isToday && (
                  <div style={{ fontSize: 9, marginTop: 2, opacity: 0.8 }}>today</div>
                )}
                <div
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: 999,
                    background: heat,
                    margin: "4px auto 0",
                    opacity: selected ? 0.9 : 0.85,
                  }}
                />
              </div>
            );
          })}
        </div>
      </Field>

      {selDate && (
        <div
          style={{
            padding: "10px 12px",
            marginTop: -6,
            marginBottom: 16,
            borderRadius: "var(--r)",
            background: selBlock
              ? "oklch(0.94 0.05 28)"
              : selFull
                ? "oklch(0.95 0.07 80)"
                : "var(--sage-soft)",
            border:
              "1px solid " +
              (selBlock ? "var(--danger)" : selFull ? "oklch(0.82 0.12 80)" : "var(--sage)"),
            fontSize: 12.5,
            lineHeight: 1.5,
            color: selBlock
              ? "var(--danger)"
              : selFull
                ? "oklch(0.40 0.10 70)"
                : "oklch(0.32 0.06 145)",
          }}
        >
          {selBlock ? (
            <>
              <strong>
                {selBlock.type === "festival" ? "🪔 Festival" : "🚧 Blocked"}
              </strong>{" "}
              · {selBlock.reason}
            </>
          ) : selFull ? (
            <>
              <strong>At capacity</strong> · {selLoad} cake{selLoad === 1 ? "" : "s"} already on
              this date (ceiling {capacityCeiling}). Push to next day or quote a premium.
            </>
          ) : (
            <>
              <strong>
                {selLoad}/{capacityCeiling} cakes
              </strong>{" "}
              already booked · {capacityCeiling - selLoad} slot
              {capacityCeiling - selLoad === 1 ? "" : "s"} left for this date.
            </>
          )}
        </div>
      )}

      <Field label="Time slot" error={errors.deliverySlot}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 6 }}>
          {SLOTS.map((s) => {
            const sel = form.deliverySlot === s;
            return (
              <div
                key={s}
                onClick={() => set("deliverySlot", s)}
                style={{
                  padding: "9px 4px",
                  fontSize: 12.5,
                  border: "1.5px solid " + (sel ? "var(--caramel)" : "var(--line)"),
                  background: sel ? "var(--caramel-soft)" : "var(--surface)",
                  borderRadius: "var(--r)",
                  textAlign: "center",
                  cursor: "pointer",
                  fontWeight: sel ? 600 : 500,
                }}
              >
                {s}
              </div>
            );
          })}
        </div>
      </Field>

      <Field label="Area / address" error={errors.deliveryArea}>
        <TextInput
          value={form.deliveryArea}
          onChange={(e) => set("deliveryArea", e.target.value)}
          placeholder="Madhapur, near IKEA"
          error={!!errors.deliveryArea}
        />
      </Field>

      {showColdChain && (
        <Field label="Cold-chain notes" optional>
          <TextInput
            value={form.coldChainNotes}
            onChange={(e) => set("coldChainNotes", e.target.value)}
            placeholder="Insulated box + 4 ice packs · keep upright"
          />
          <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 6, lineHeight: 1.45 }}>
            Hyderabad heat / monsoon (Mar–Sep) — buttercream and cream cakes need ice packs and
            short transit.
          </div>
        </Field>
      )}
    </div>
  );
}

// ---------- Step 5: Pricing ----------

function StepPricing({
  productLines,
  recipes,
  form,
  set,
  errors,
}: {
  productLines: ProductLine[];
  recipes: Recipe[];
  form: FormState;
  set: <K extends keyof FormState>(k: K, v: FormState[K]) => void;
  errors: Record<string, string>;
}) {
  const price = +form.price || 0;
  const deposit = +form.deposit || 0;
  const recipe = recipes.find((r) => r.name === form.flavor);
  const ingCost = recipe?.costPerCake || 0;
  const addonsCost = addonsTotal(form.selectedAddons);
  const totalCost = ingCost + addonsCost;
  const margin = price - totalCost;
  const marginPct = price > 0 ? Math.round((margin / price) * 100) : 0;

  // Suggested all-in price = size's price hint (the base MSRP) + addons.
  // Tap "Use suggested" to fill or align form.price so the operator never
  // has to do the addition by hand — which is where double-counting and
  // forgotten addons creep in.
  const activeLine = productLines.find((p) => p.name === form.productLine);
  const sizeRow = activeLine?.sizes.find((s) => s.name === form.size);
  const baseHint = sizeRow?.price_hint ?? 0;
  const suggested = baseHint + addonsCost;
  const showSuggestion =
    suggested > 0 && suggested !== price && (baseHint > 0 || addonsCost > 0);

  return (
    <div>
      <h2 style={stepHeading}>Price it out</h2>
      <p style={stepLede}>Cost auto-pulled from the recipe. Margin updates live.</p>

      <Field label="Quoted price" error={errors.price}>
        <TextInput
          value={form.price}
          onChange={(e) => set("price", e.target.value.replace(/[^0-9.]/g, ""))}
          placeholder="0"
          prefix="₹"
          error={!!errors.price}
        />
        {showSuggestion && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 8,
              marginTop: 8,
              padding: "8px 10px",
              background: "var(--sage-soft)",
              border: "1px solid var(--sage)",
              borderRadius: "var(--r)",
              fontSize: 12,
              color: "var(--ink-soft)",
            }}
          >
            <span>
              Suggested {fmtMoney(suggested)} ={" "}
              {fmtMoney(baseHint)} base
              {addonsCost > 0 ? ` + ${fmtMoney(addonsCost)} addons` : ""}
            </span>
            <button
              type="button"
              onClick={() => set("price", String(suggested))}
              style={{
                background: "var(--caramel)",
                color: "var(--surface)",
                border: "none",
                padding: "5px 10px",
                fontSize: 11.5,
                fontWeight: 600,
                borderRadius: 999,
                cursor: "pointer",
                fontFamily: "inherit",
                flexShrink: 0,
              }}
            >
              Use
            </button>
          </div>
        )}
      </Field>

      <Field
        label="Deposit / advance"
        hint="Standard practice: 50% upfront"
        optional
        error={errors.deposit}
      >
        <TextInput
          value={form.deposit}
          onChange={(e) => set("deposit", e.target.value.replace(/[^0-9.]/g, ""))}
          placeholder="0"
          prefix="₹"
          error={!!errors.deposit}
        />
        {price > 0 && !form.deposit && (
          <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
            {[0.3, 0.5, 1.0].map((pct) => (
              <Button
                key={pct}
                size="sm"
                variant="secondary"
                onClick={() => set("deposit", String(Math.round(price * pct)))}
              >
                {(pct * 100).toFixed(0)}% · ₹
                {Math.round(price * pct).toLocaleString("en-IN")}
              </Button>
            ))}
          </div>
        )}
      </Field>

      <Card style={{ background: "var(--surface-2)", marginTop: 4 }}>
        <div
          style={{
            fontSize: 11.5,
            color: "var(--muted)",
            letterSpacing: "0.04em",
            textTransform: "uppercase",
            marginBottom: 10,
          }}
        >
          Cost breakdown
        </div>
        <Row label="Ingredients cost" value={fmtMoney(ingCost)} />
        {addonsCost > 0 && <Row label="Addons cost" value={fmtMoney(addonsCost)} />}
        {addonsCost > 0 && <Row label="Total cost" value={fmtMoney(totalCost)} />}
        <Row label="Quoted price" value={fmtMoney(price)} />
        <div style={{ borderTop: "1px dashed var(--line)", margin: "10px 0" }} />
        <Row
          label="Gross margin"
          value={`${fmtMoney(margin)} (${marginPct}%)`}
          valueColor={
            marginPct >= 50 ? "var(--ok)" : marginPct >= 30 ? "var(--warn)" : "var(--danger)"
          }
        />
        <Row label="Deposit" value={fmtMoney(deposit)} />
        <Row label="Balance on delivery" value={fmtMoney(price - deposit)} bold />
      </Card>

      <Field label="Internal notes" optional>
        <TextInput
          multiline
          value={form.notes}
          onChange={(e) => set("notes", e.target.value)}
          placeholder="Allergies, special instructions for the kitchen…"
        />
      </Field>
    </div>
  );
}

function Row({
  label,
  value,
  bold,
  valueColor,
}: {
  label: string;
  value: string;
  bold?: boolean;
  valueColor?: string;
}) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "4px 0",
      }}
    >
      <span style={{ fontSize: 13, color: "var(--ink-soft)" }}>{label}</span>
      <span
        style={{
          fontSize: 13.5,
          fontWeight: bold ? 700 : 600,
          color: valueColor || "var(--ink)",
        }}
      >
        {value}
      </span>
    </div>
  );
}

// ---------- Step 6: Review ----------

function StepReview({
  customers,
  form,
}: {
  customers: Customer[];
  form: FormState;
}) {
  const customer = form.customerId ? customers.find((c) => c.id === form.customerId) : null;
  const customerName = customer?.name || form.newCustomerName;

  return (
    <div>
      <h2 style={stepHeading}>Looks good?</h2>
      <p style={stepLede}>This creates the order and starts a WhatsApp draft.</p>

      <CakeArt
        tone={(customer?.avatarTone as "sage" | "caramel" | "rose" | undefined) || "caramel"}
        label={form.flavor}
        style={{ width: "100%", height: 140, borderRadius: 14, marginBottom: 14 }}
      />

      <Card padding={0}>
        <ReviewRow label="Customer" value={customerName} />
        <ReviewRow label="Order" value={form.title} />
        <ReviewRow
          label="Line"
          value={`${form.productLine}${form.eggless ? " · eggless" : ""}`}
          small
        />
        <ReviewRow
          label="Flavour & size"
          value={`${form.flavor} · ${form.size}`}
        />
        {form.brief.occasion && (
          <ReviewRow label="Occasion" value={form.brief.occasion} small />
        )}
        {form.brief.theme && <ReviewRow label="Theme" value={form.brief.theme} small />}
        {form.brief.message?.text && (
          <ReviewRow
            label="Message"
            value={
              form.brief.message.text +
              (form.brief.message.color ? ` (${form.brief.message.color})` : "")
            }
            small
          />
        )}
        {form.selectedAddons.length > 0 && (
          <ReviewRow
            label="Addons"
            value={
              form.selectedAddons
                .map((a) => `${a.name}${a.qty !== 1 ? ` ×${a.qty}` : ""}`)
                .join(", ") + ` — ${fmtMoney(addonsTotal(form.selectedAddons))}`
            }
            small
          />
        )}
        <ReviewRow
          label="Delivery"
          value={`${fmtDate(form.deliveryDate, { showYear: true })} · ${form.deliverySlot}`}
          sub={form.deliveryArea}
        />
        <div style={{ padding: "10px 14px" }}>
          <div style={{ fontSize: 11.5, color: "var(--muted)" }}>Price</div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 2 }}>
            <div style={{ fontFamily: "DM Serif Display, serif", fontSize: 22 }}>
              {fmtMoney(+form.price || 0)}
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 12, color: "var(--muted)" }}>
                Deposit · {fmtMoney(+form.deposit || 0)}
              </div>
              <div style={{ fontSize: 12, color: "var(--danger)" }}>
                Balance · {fmtMoney((+form.price || 0) - (+form.deposit || 0))}
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

function ReviewRow({
  label,
  value,
  sub,
  small,
}: {
  label: string;
  value: string;
  sub?: string;
  small?: boolean;
}) {
  return (
    <div style={{ padding: "10px 14px", borderBottom: "1px solid var(--line-soft)" }}>
      <div style={{ fontSize: 11.5, color: "var(--muted)" }}>{label}</div>
      <div
        style={{
          fontSize: small ? 13 : 13.5,
          fontWeight: small ? 500 : 600,
          marginTop: 2,
          lineHeight: 1.4,
        }}
      >
        {value || "—"}
      </div>
      {sub && (
        <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 2 }}>{sub}</div>
      )}
    </div>
  );
}

// ---------- shared styles ----------

const stepHeading: React.CSSProperties = {
  fontFamily: "DM Serif Display, serif",
  fontSize: 22,
  margin: "0 0 4px",
};

const stepLede: React.CSSProperties = {
  fontSize: 13.5,
  color: "var(--muted)",
  margin: "0 0 18px",
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
