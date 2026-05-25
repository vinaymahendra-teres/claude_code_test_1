"use client";

// Interactive UI primitives — anything with event handlers or local state.
// Ported from app/src/ui.jsx.

import { type CSSProperties, type ReactNode, useState } from "react";
import { Icon } from "./Icon";

// ---------- Button + IconButton ----------

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "soft";
type ButtonSize = "sm" | "md" | "lg";

export function Button({
  children,
  variant = "primary",
  size = "md",
  icon,
  full,
  onClick,
  style,
  type = "button",
  disabled,
  ...rest
}: {
  children?: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: ReactNode;
  full?: boolean;
  onClick?: () => void;
  style?: CSSProperties;
  type?: "button" | "submit" | "reset";
  disabled?: boolean;
  // Allow extra style/aria props through
  [key: string]: unknown;
}) {
  const variants: Record<ButtonVariant, CSSProperties> = {
    primary: {
      background: "var(--caramel)",
      color: "var(--surface)",
      border: "1px solid var(--caramel-deep)",
      boxShadow:
        "inset 0 1px 0 oklch(0.99 0.01 75 / 0.25), 0 1px 2px oklch(0.40 0.12 50 / 0.20)",
    },
    secondary: {
      background: "var(--surface)",
      color: "var(--ink)",
      border: "1px solid var(--line)",
    },
    ghost: {
      background: "transparent",
      color: "var(--ink)",
      border: "1px solid transparent",
    },
    danger: {
      background: "transparent",
      color: "var(--danger)",
      border: "1px solid oklch(0.85 0.06 28)",
    },
    soft: {
      background: "var(--caramel-soft)",
      color: "var(--caramel-deep)",
      border: "1px solid oklch(0.86 0.05 70)",
    },
  };
  const sizes: Record<ButtonSize, CSSProperties> = {
    sm: { padding: "7px 12px", fontSize: 13, height: 32 },
    md: { padding: "10px 16px", fontSize: 14, height: 42 },
    lg: { padding: "13px 20px", fontSize: 15, height: 50 },
  };
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        borderRadius: "var(--r)",
        fontFamily: "inherit",
        fontWeight: 600,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.6 : 1,
        transition: "transform .08s, box-shadow .12s, background .12s",
        width: full ? "100%" : "auto",
        ...sizes[size],
        ...variants[variant],
        ...style,
      }}
      {...rest}
    >
      {icon}
      {children}
    </button>
  );
}

export function IconButton({
  children,
  onClick,
  style,
  title,
}: {
  children: ReactNode;
  onClick?: () => void;
  style?: CSSProperties;
  title?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: 36,
        height: 36,
        borderRadius: 999,
        background: "transparent",
        color: "var(--ink)",
        border: "none",
        cursor: "pointer",
        ...style,
      }}
    >
      {children}
    </button>
  );
}

// ---------- ListRow ----------

export function ListRow({
  left,
  right,
  onClick,
  divider = true,
  padding = "12px 14px",
}: {
  left: ReactNode;
  right?: ReactNode;
  onClick?: () => void;
  divider?: boolean;
  padding?: string;
}) {
  return (
    <div
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding,
        borderBottom: divider ? "1px solid var(--line-soft)" : "none",
        cursor: onClick ? "pointer" : "default",
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>{left}</div>
      {right}
    </div>
  );
}

// ---------- TextInput ----------

export function TextInput({
  multiline,
  error,
  prefix,
  style,
  ...rest
}: React.InputHTMLAttributes<HTMLInputElement> &
  React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
    multiline?: boolean;
    error?: boolean;
    prefix?: string;
  }) {
  const baseStyle: CSSProperties = {
    width: "100%",
    fontFamily: "inherit",
    fontSize: 15,
    padding: prefix ? "11px 12px 11px 30px" : "11px 12px",
    borderRadius: "var(--r)",
    border: `1px solid ${error ? "var(--danger)" : "var(--line)"}`,
    background: "var(--surface)",
    color: "var(--ink)",
    outline: "none",
    transition: "border-color .12s, box-shadow .12s",
    boxSizing: "border-box",
    resize: multiline ? "vertical" : "none",
    minHeight: multiline ? 80 : undefined,
    ...style,
  };
  const handleFocus = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    e.target.style.borderColor = error ? "var(--danger)" : "var(--caramel)";
    e.target.style.boxShadow = `0 0 0 3px ${error ? "oklch(0.93 0.05 28)" : "var(--caramel-soft)"}`;
  };
  const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    e.target.style.borderColor = error ? "var(--danger)" : "var(--line)";
    e.target.style.boxShadow = "none";
  };
  if (prefix) {
    return (
      <div style={{ position: "relative" }}>
        <span
          style={{
            position: "absolute",
            left: 12,
            top: "50%",
            transform: "translateY(-50%)",
            color: "var(--muted)",
            fontSize: 14,
            fontWeight: 500,
            pointerEvents: "none",
          }}
        >
          {prefix}
        </span>
        <input {...(rest as React.InputHTMLAttributes<HTMLInputElement>)} style={baseStyle} onFocus={handleFocus} onBlur={handleBlur} />
      </div>
    );
  }
  if (multiline) {
    return (
      <textarea
        {...(rest as React.TextareaHTMLAttributes<HTMLTextAreaElement>)}
        style={baseStyle}
        onFocus={handleFocus}
        onBlur={handleBlur}
      />
    );
  }
  return <input {...(rest as React.InputHTMLAttributes<HTMLInputElement>)} style={baseStyle} onFocus={handleFocus} onBlur={handleBlur} />;
}

// ---------- SegmentedControl ----------

type SegOption = string | { value: string; label: string };

export function SegmentedControl({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: SegOption[];
}) {
  return (
    <div
      style={{
        display: "inline-flex",
        background: "var(--surface-3)",
        padding: 3,
        borderRadius: "var(--r)",
        gap: 2,
        width: "100%",
      }}
    >
      {options.map((o) => {
        const v = typeof o === "string" ? o : o.value;
        const label = typeof o === "string" ? o : o.label;
        const active = value === v;
        return (
          <button
            key={v}
            type="button"
            onClick={() => onChange(v)}
            style={{
              flex: 1,
              padding: "7px 10px",
              fontSize: 13,
              fontWeight: 600,
              fontFamily: "inherit",
              border: "none",
              borderRadius: "calc(var(--r) - 3px)",
              cursor: "pointer",
              background: active ? "var(--surface)" : "transparent",
              color: active ? "var(--ink)" : "var(--ink-soft)",
              boxShadow: active ? "var(--shadow-sm)" : "none",
              transition: "background .15s",
            }}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}

// ---------- Toggle ----------

export function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <label
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
        cursor: "pointer",
      }}
    >
      <span style={{ fontSize: 14 }}>{label}</span>
      <span
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        style={{
          width: 44,
          height: 26,
          borderRadius: 999,
          background: checked ? "var(--caramel)" : "var(--surface-3)",
          border: "1px solid " + (checked ? "var(--caramel-deep)" : "var(--line)"),
          position: "relative",
          transition: "background .15s",
          flexShrink: 0,
        }}
      >
        <span
          style={{
            position: "absolute",
            top: 2,
            left: checked ? 20 : 2,
            width: 20,
            height: 20,
            borderRadius: 999,
            background: "var(--surface)",
            boxShadow: "0 1px 3px oklch(0.20 0.02 50 / 0.20)",
            transition: "left .15s",
          }}
        />
      </span>
    </label>
  );
}

// ---------- Sheet (bottom drawer) ----------

export function Sheet({
  open,
  onClose,
  title,
  snap = "auto",
  children,
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  snap?: "auto" | "full";
  children: ReactNode;
}) {
  if (!open) return null;
  return (
    <div
      onClick={onClose}
      style={{
        position: "absolute",
        inset: 0,
        // Above the phone chrome (notch/status-bar/home-indicator at 150-200)
        // and the bottom nav (10).
        zIndex: 300,
        background: "oklch(0.20 0.02 50 / 0.40)",
        display: "flex",
        alignItems: "flex-end",
        animation: "fadeIn .18s",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxHeight: snap === "full" ? "95%" : "85%",
          background: "var(--bg)",
          borderTopLeftRadius: "var(--r-xl)",
          borderTopRightRadius: "var(--r-xl)",
          paddingBottom: 30,
          display: "flex",
          flexDirection: "column",
          animation: "slideUp .25s cubic-bezier(.2,.8,.2,1)",
          boxShadow: "0 -10px 40px oklch(0.20 0.02 50 / 0.20)",
        }}
      >
        <div
          style={{
            width: 38,
            height: 4,
            borderRadius: 999,
            background: "var(--line)",
            margin: "8px auto 4px",
          }}
        />
        {title && (
          <div
            style={{
              padding: "12px 20px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              borderBottom: "1px solid var(--line-soft)",
            }}
          >
            <div style={{ fontFamily: "DM Serif Display, serif", fontSize: 18 }}>{title}</div>
            <IconButton onClick={onClose}>
              <Icon.X size={20} />
            </IconButton>
          </div>
        )}
        <div style={{ flex: 1, overflowY: "auto", padding: "8px 20px 0" }}>{children}</div>
      </div>
    </div>
  );
}

// Re-export useState so consumers can construct simple Sheet open/close pairs without separate imports.
export { useState };
