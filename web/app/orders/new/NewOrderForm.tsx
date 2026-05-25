"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { PhoneShell } from "@/components/PhoneShell";
import { Card, CakeArt, Avatar, Pill, Field } from "@/components/ui";
import { Button, TextInput, Toggle, ListRow } from "@/components/ui-client";
import { Icon } from "@/components/Icon";
import { fmtMoney, fmtDate } from "@/lib/format";
import { createOrder } from "./actions";
import type { Customer, Recipe } from "./page";

type Props = {
  customers: Customer[];
  recipes: Recipe[];
  capacityCeiling: number;
  loadByDate: Record<string, number>;
  blockedByDate: Record<string, { reason: string; type: string | null }>;
  today: string;
};

type FormState = {
  customerId: string | null;
  newCustomerName: string;
  newCustomerPhone: string;
  newCustomerInsta: string;
  title: string;
  flavor: string;
  size: string;
  servings: number;
  eggless: boolean;
  theme: string;
  addOns: string[];
  deliveryDate: string;
  deliverySlot: string;
  deliveryArea: string;
  coldChainNotes: string;
  price: string;
  deposit: string;
  notes: string;
};

const STEPS = ["Customer", "Cake", "Theme", "Delivery", "Pricing", "Review"] as const;

const SIZES = [
  { v: "Bento", servings: 2, price: "₹1.2k" },
  { v: '4 inch', servings: 6, price: "₹1.8k" },
  { v: '6 inch', servings: 12, price: "₹3.5k" },
  { v: '7 inch', servings: 16, price: "₹4.5k" },
  { v: '8 inch', servings: 22, price: "₹5.5k" },
  { v: "Two-tier", servings: 38, price: "₹12k+" },
];

const SLOTS = ["9 AM", "11 AM", "1 PM", "3 PM", "5 PM", "7 PM", "8 PM", "Anytime"];

const ADD_ONS = [
  "Matching cupcakes (12)",
  "Cake topper",
  "Number candle",
  "Custom message card",
  "Edible photo print",
  "Gold leaf finish",
];

export function NewOrderForm({
  customers,
  recipes,
  capacityCeiling,
  loadByDate,
  blockedByDate,
  today,
}: Props) {
  const [step, setStep] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [form, setForm] = useState<FormState>({
    customerId: null,
    newCustomerName: "",
    newCustomerPhone: "",
    newCustomerInsta: "",
    title: "",
    flavor: "",
    size: "",
    servings: 0,
    eggless: false,
    theme: "",
    addOns: [],
    deliveryDate: "",
    deliverySlot: "",
    deliveryArea: "",
    coldChainNotes: "",
    price: "",
    deposit: "",
    notes: "",
  });

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
    if (s === 2) {
      if (!form.theme) e.theme = "Describe the theme — even a sentence helps";
    }
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
          title: form.title,
          flavor: form.flavor,
          size: form.size,
          servings: form.servings,
          eggless: form.eggless,
          theme: form.theme,
          addOns: form.addOns,
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
      }
    });
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

        <div style={{ padding: "16px 18px 120px", overflowY: "auto", flex: 1 }}>
          {step === 0 && (
            <StepCustomer customers={customers} form={form} set={set} errors={errors} />
          )}
          {step === 1 && <StepCake recipes={recipes} form={form} set={set} errors={errors} />}
          {step === 2 && <StepTheme form={form} set={set} errors={errors} />}
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
          {step === 4 && <StepPricing recipes={recipes} form={form} set={set} errors={errors} />}
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
  recipes,
  form,
  set,
  errors,
}: {
  recipes: Recipe[];
  form: FormState;
  set: <K extends keyof FormState>(k: K, v: FormState[K]) => void;
  errors: Record<string, string>;
}) {
  return (
    <div>
      <h2 style={stepHeading}>What are we baking?</h2>
      <p style={stepLede}>Pick a flavor from your menu and size it up.</p>

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

      <Field label="Flavor" error={errors.flavor}>
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

      <Field label="Size" error={errors.size}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
          {SIZES.map((s) => {
            const sel = form.size === s.v;
            return (
              <div
                key={s.v}
                onClick={() => {
                  set("size", s.v);
                  set("servings", s.servings);
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
                <div style={{ fontSize: 13, fontWeight: 600 }}>{s.v}</div>
                <div style={{ fontSize: 10.5, color: "var(--muted)", marginTop: 2 }}>
                  {s.servings} servings · {s.price}
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
  errors,
}: {
  form: FormState;
  set: <K extends keyof FormState>(k: K, v: FormState[K]) => void;
  errors: Record<string, string>;
}) {
  return (
    <div>
      <h2 style={stepHeading}>Describe the look</h2>
      <p style={stepLede}>Paste the brief from their DM. References help.</p>

      <Field
        label="Theme & vibe"
        hint="Be specific — palette, motifs, message text"
        error={errors.theme}
      >
        <TextInput
          multiline
          value={form.theme}
          onChange={(e) => set("theme", e.target.value)}
          placeholder="e.g. Pastel floral, ivory + dusty pink. Hand-piped peonies. Topper: 'Sixty & Glowing'"
          error={!!errors.theme}
        />
      </Field>

      <Field label="Add-ons" optional>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {ADD_ONS.map((a) => {
            const selected = form.addOns.includes(a);
            return (
              <span
                key={a}
                onClick={() => {
                  const nextAddOns = selected
                    ? form.addOns.filter((x) => x !== a)
                    : [...form.addOns, a];
                  set("addOns", nextAddOns);
                }}
                style={{
                  padding: "7px 11px",
                  fontSize: 12.5,
                  fontWeight: 600,
                  borderRadius: 999,
                  border: "1.5px solid " + (selected ? "var(--caramel)" : "var(--line)"),
                  background: selected ? "var(--caramel-soft)" : "var(--surface)",
                  color: selected ? "var(--caramel-deep)" : "var(--ink-soft)",
                  cursor: "pointer",
                  display: "inline-flex",
                  gap: 4,
                  alignItems: "center",
                }}
              >
                {selected && <Icon.Check size={12} />}
                {a}
              </span>
            );
          })}
        </div>
      </Field>
    </div>
  );
}

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
  recipes,
  form,
  set,
  errors,
}: {
  recipes: Recipe[];
  form: FormState;
  set: <K extends keyof FormState>(k: K, v: FormState[K]) => void;
  errors: Record<string, string>;
}) {
  const price = +form.price || 0;
  const deposit = +form.deposit || 0;
  const recipe = recipes.find((r) => r.name === form.flavor);
  const ingCost = recipe?.costPerCake || 0;
  const margin = price - ingCost;
  const marginPct = price > 0 ? Math.round((margin / price) * 100) : 0;

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
          label="Flavor & size"
          value={`${form.flavor} · ${form.size}${form.eggless ? " · Eggless" : ""}`}
        />
        <ReviewRow label="Theme" value={form.theme} small />
        {form.addOns.length > 0 && (
          <ReviewRow label="Add-ons" value={form.addOns.join(", ")} small />
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
