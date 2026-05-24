// UI primitives — buttons, inputs, cards, pills, avatars, sheets, screen scaffolds.
// All exposed on window so other Babel scripts can use them.

// ---------- Screen scaffold ----------

function Screen({ children, scrollable = true, style }) {
  return (
    <div
      style={{
        position: 'absolute',
        top: 0, left: 0, right: 0, bottom: 0,
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--bg)',
        ...style,
      }}
    >
      {children}
    </div>
  );
}

function ScreenHeader({ title, subtitle, onBack, right, sticky = true, large = false }) {
  return (
    <header
      style={{
        position: sticky ? 'sticky' : 'relative',
        top: 0, zIndex: 5,
        background: 'var(--bg)',
        padding: large ? '54px 22px 12px' : '54px 18px 14px',
        borderBottom: large ? 'none' : '1px solid var(--line-soft)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, minHeight: 32 }}>
        {onBack ? (
          <IconButton onClick={onBack} aria-label="Back">
            <Icon.ChevronLeft size={22} />
          </IconButton>
        ) : null}
        <div style={{ flex: 1, paddingLeft: onBack ? 0 : 4 }}>
          {!large && (
            <div style={{ fontFamily: 'DM Serif Display, serif', fontSize: 21, lineHeight: 1.15 }}>
              {title}
            </div>
          )}
          {!large && subtitle && (
            <div style={{ fontSize: 12.5, color: 'var(--muted)', marginTop: 2 }}>{subtitle}</div>
          )}
        </div>
        <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>{right}</div>
      </div>
      {large && (
        <div style={{ paddingTop: 10 }}>
          <div style={{ fontFamily: 'DM Serif Display, serif', fontSize: 30, lineHeight: 1.1, letterSpacing: '-0.01em' }}>
            {title}
          </div>
          {subtitle && (
            <div style={{ fontSize: 13.5, color: 'var(--muted)', marginTop: 6 }}>{subtitle}</div>
          )}
        </div>
      )}
    </header>
  );
}

function ScreenBody({ children, padding = '14px 18px 100px', style }) {
  return (
    <div
      style={{
        flex: 1,
        overflowY: 'auto',
        overflowX: 'hidden',
        padding,
        WebkitOverflowScrolling: 'touch',
        ...style,
      }}
    >
      {children}
    </div>
  );
}

// ---------- Buttons ----------

function Button({ children, variant = 'primary', size = 'md', icon, full, ...rest }) {
  const variants = {
    primary: {
      background: 'var(--caramel)',
      color: 'var(--surface)',
      border: '1px solid var(--caramel-deep)',
      boxShadow: 'inset 0 1px 0 oklch(0.99 0.01 75 / 0.25), 0 1px 2px oklch(0.40 0.12 50 / 0.20)',
    },
    secondary: {
      background: 'var(--surface)',
      color: 'var(--ink)',
      border: '1px solid var(--line)',
    },
    ghost: {
      background: 'transparent',
      color: 'var(--ink)',
      border: '1px solid transparent',
    },
    danger: {
      background: 'transparent',
      color: 'var(--danger)',
      border: '1px solid oklch(0.85 0.06 28)',
    },
    soft: {
      background: 'var(--caramel-soft)',
      color: 'var(--caramel-deep)',
      border: '1px solid oklch(0.86 0.05 70)',
    },
  };
  const sizes = {
    sm: { padding: '7px 12px', fontSize: 13, height: 32 },
    md: { padding: '10px 16px', fontSize: 14, height: 42 },
    lg: { padding: '13px 20px', fontSize: 15, height: 50 },
  };
  return (
    <button
      {...rest}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        borderRadius: 'var(--r)',
        fontFamily: 'inherit',
        fontWeight: 600,
        cursor: 'pointer',
        transition: 'transform .08s, box-shadow .12s, background .12s',
        width: full ? '100%' : 'auto',
        ...sizes[size],
        ...variants[variant],
        ...(rest.style || {}),
      }}
      onMouseDown={e => e.currentTarget.style.transform = 'scale(0.98)'}
      onMouseUp={e => e.currentTarget.style.transform = ''}
      onMouseLeave={e => e.currentTarget.style.transform = ''}
    >
      {icon}{children}
    </button>
  );
}

function IconButton({ children, ...rest }) {
  return (
    <button
      {...rest}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 36,
        height: 36,
        borderRadius: 999,
        background: 'transparent',
        color: 'var(--ink)',
        border: 'none',
        cursor: 'pointer',
        ...(rest.style || {}),
      }}
    >
      {children}
    </button>
  );
}

// ---------- Card ----------

function Card({ children, padding = 16, onClick, style }) {
  return (
    <div
      onClick={onClick}
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--line-soft)',
        borderRadius: 'var(--r-lg)',
        padding,
        boxShadow: 'var(--shadow-sm)',
        cursor: onClick ? 'pointer' : 'default',
        ...style,
      }}
    >
      {children}
    </div>
  );
}

// ---------- Pill / Tag ----------

function Pill({ children, tone = 'neutral', size = 'sm', style }) {
  const tones = {
    neutral: { bg: 'var(--surface-3)', fg: 'var(--ink-soft)' },
    caramel: { bg: 'var(--caramel-soft)', fg: 'var(--caramel-deep)' },
    rose: { bg: 'var(--rose-soft)', fg: 'oklch(0.38 0.10 25)' },
    sage: { bg: 'var(--sage-soft)', fg: 'oklch(0.34 0.07 145)' },
    warn: { bg: 'oklch(0.95 0.07 80)', fg: 'oklch(0.42 0.12 70)' },
    danger: { bg: 'oklch(0.93 0.05 28)', fg: 'var(--danger)' },
    ok: { bg: 'var(--sage-soft)', fg: 'oklch(0.34 0.07 145)' },
  };
  const t = tones[tone] || tones.neutral;
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        padding: size === 'xs' ? '2px 7px' : '3px 9px',
        fontSize: size === 'xs' ? 10.5 : 11.5,
        fontWeight: 600,
        letterSpacing: '0.01em',
        color: t.fg,
        background: t.bg,
        borderRadius: 999,
        ...style,
      }}
    >
      {children}
    </span>
  );
}

function StatusPill({ status, dot = true }) {
  const c = window.statusColor(status);
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '3px 9px 3px 8px',
        fontSize: 11.5,
        fontWeight: 600,
        background: c.bg,
        color: c.fg,
        borderRadius: 999,
      }}
    >
      {dot && (
        <span style={{ width: 6, height: 6, borderRadius: 999, background: c.dot }} />
      )}
      {window.statusLabel(status)}
    </span>
  );
}

// ---------- Avatar ----------

function Avatar({ name = '', tone = 'caramel', size = 40, style }) {
  const initials = name
    .split(' ')
    .slice(0, 2)
    .map(s => s[0])
    .join('')
    .toUpperCase();
  const tones = {
    caramel: { bg: 'var(--caramel-soft)', fg: 'var(--caramel-deep)' },
    rose: { bg: 'var(--rose-soft)', fg: 'oklch(0.38 0.10 25)' },
    sage: { bg: 'var(--sage-soft)', fg: 'oklch(0.34 0.07 145)' },
  };
  const t = tones[tone] || tones.caramel;
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: size,
        height: size,
        borderRadius: 999,
        background: t.bg,
        color: t.fg,
        fontWeight: 700,
        fontSize: size * 0.36,
        flexShrink: 0,
        ...style,
      }}
    >
      {initials}
    </span>
  );
}

// ---------- Image placeholder (cake) ----------

function CakeArt({ tone = 'caramel', size = 64, label, style }) {
  const tones = {
    caramel: ['oklch(0.93 0.045 70)', 'oklch(0.78 0.10 55)'],
    rose: ['oklch(0.94 0.04 25)', 'oklch(0.78 0.09 20)'],
    sage: ['oklch(0.94 0.03 145)', 'oklch(0.78 0.07 140)'],
    plum: ['oklch(0.92 0.04 340)', 'oklch(0.70 0.10 340)'],
  };
  const [c1, c2] = tones[tone] || tones.caramel;
  return (
    <div style={{
      width: size,
      height: size,
      borderRadius: 14,
      background: `repeating-linear-gradient(45deg, ${c1} 0, ${c1} 6px, ${c2} 6px, ${c2} 7px)`,
      position: 'relative',
      overflow: 'hidden',
      flexShrink: 0,
      ...style,
    }}>
      <div style={{
        position: 'absolute', inset: 0,
        display: 'grid', placeItems: 'center',
        fontFamily: 'JetBrains Mono, monospace',
        fontSize: Math.max(9, size * 0.13),
        color: 'oklch(0.30 0.05 50 / 0.55)',
        textAlign: 'center',
        padding: 4,
        lineHeight: 1.2,
      }}>{label || ''}</div>
    </div>
  );
}

// ---------- Inputs ----------

function Field({ label, hint, error, children, optional }) {
  return (
    <label style={{ display: 'block', marginBottom: 14 }}>
      {label && (
        <div style={{
          fontSize: 12.5,
          fontWeight: 600,
          color: 'var(--ink-soft)',
          marginBottom: 6,
          display: 'flex',
          gap: 8,
          alignItems: 'baseline',
        }}>
          <span>{label}</span>
          {optional && <span style={{ fontSize: 11, fontWeight: 500, color: 'var(--muted)' }}>optional</span>}
        </div>
      )}
      {children}
      {hint && !error && <div style={{ fontSize: 11.5, color: 'var(--muted)', marginTop: 5 }}>{hint}</div>}
      {error && <div style={{ fontSize: 11.5, color: 'var(--danger)', marginTop: 5 }}>{error}</div>}
    </label>
  );
}

function TextInput({ multiline, error, prefix, ...rest }) {
  const baseStyle = {
    width: '100%',
    fontFamily: 'inherit',
    fontSize: 15,
    padding: prefix ? '11px 12px 11px 30px' : '11px 12px',
    borderRadius: 'var(--r)',
    border: `1px solid ${error ? 'var(--danger)' : 'var(--line)'}`,
    background: 'var(--surface)',
    color: 'var(--ink)',
    outline: 'none',
    transition: 'border-color .12s, box-shadow .12s',
    boxSizing: 'border-box',
    resize: multiline ? 'vertical' : 'none',
    minHeight: multiline ? 80 : undefined,
    ...(rest.style || {}),
  };
  const handleFocus = (e) => {
    e.target.style.borderColor = error ? 'var(--danger)' : 'var(--caramel)';
    e.target.style.boxShadow = `0 0 0 3px ${error ? 'oklch(0.93 0.05 28)' : 'var(--caramel-soft)'}`;
  };
  const handleBlur = (e) => {
    e.target.style.borderColor = error ? 'var(--danger)' : 'var(--line)';
    e.target.style.boxShadow = 'none';
  };
  if (prefix) {
    return (
      <div style={{ position: 'relative' }}>
        <span style={{
          position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
          color: 'var(--muted)', fontSize: 14, fontWeight: 500,
          pointerEvents: 'none',
        }}>{prefix}</span>
        <input {...rest} style={baseStyle} onFocus={handleFocus} onBlur={handleBlur} />
      </div>
    );
  }
  if (multiline) {
    return <textarea {...rest} style={baseStyle} onFocus={handleFocus} onBlur={handleBlur} />;
  }
  return <input {...rest} style={baseStyle} onFocus={handleFocus} onBlur={handleBlur} />;
}

function Select({ value, onChange, options, placeholder, error }) {
  return (
    <div style={{ position: 'relative' }}>
      <select
        value={value || ''}
        onChange={onChange}
        style={{
          width: '100%',
          appearance: 'none',
          fontFamily: 'inherit',
          fontSize: 15,
          padding: '11px 36px 11px 12px',
          borderRadius: 'var(--r)',
          border: `1px solid ${error ? 'var(--danger)' : 'var(--line)'}`,
          background: 'var(--surface)',
          color: value ? 'var(--ink)' : 'var(--muted)',
          outline: 'none',
        }}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map(o => (
          typeof o === 'string'
            ? <option key={o} value={o}>{o}</option>
            : <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      <Icon.ChevronDown size={16} style={{
        position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
        color: 'var(--muted)', pointerEvents: 'none',
      }} />
    </div>
  );
}

function SegmentedControl({ value, onChange, options }) {
  return (
    <div style={{
      display: 'inline-flex',
      background: 'var(--surface-3)',
      padding: 3,
      borderRadius: 'var(--r)',
      gap: 2,
      width: '100%',
    }}>
      {options.map(o => {
        const v = typeof o === 'string' ? o : o.value;
        const label = typeof o === 'string' ? o : o.label;
        const active = value === v;
        return (
          <button
            key={v}
            onClick={() => onChange(v)}
            style={{
              flex: 1,
              padding: '7px 10px',
              fontSize: 13,
              fontWeight: 600,
              fontFamily: 'inherit',
              border: 'none',
              borderRadius: 'calc(var(--r) - 3px)',
              cursor: 'pointer',
              background: active ? 'var(--surface)' : 'transparent',
              color: active ? 'var(--ink)' : 'var(--ink-soft)',
              boxShadow: active ? 'var(--shadow-sm)' : 'none',
              transition: 'background .15s',
            }}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}

function Toggle({ checked, onChange, label }) {
  return (
    <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, cursor: 'pointer' }}>
      <span style={{ fontSize: 14 }}>{label}</span>
      <span
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        style={{
          width: 44, height: 26, borderRadius: 999,
          background: checked ? 'var(--caramel)' : 'var(--surface-3)',
          border: '1px solid ' + (checked ? 'var(--caramel-deep)' : 'var(--line)'),
          position: 'relative',
          transition: 'background .15s',
          flexShrink: 0,
        }}
      >
        <span style={{
          position: 'absolute',
          top: 2, left: checked ? 20 : 2,
          width: 20, height: 20, borderRadius: 999,
          background: 'var(--surface)',
          boxShadow: '0 1px 3px oklch(0.20 0.02 50 / 0.20)',
          transition: 'left .15s',
        }} />
      </span>
    </label>
  );
}

// ---------- Section / List items ----------

function SectionHeader({ children, action }) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'baseline',
      justifyContent: 'space-between',
      margin: '20px 4px 10px',
    }}>
      <h3 style={{
        fontFamily: 'DM Serif Display, serif',
        fontSize: 15,
        fontWeight: 400,
        margin: 0,
        color: 'var(--ink)',
        letterSpacing: '0.005em',
        textTransform: 'uppercase',
        opacity: 0.7,
      }}>{children}</h3>
      {action && <div style={{ fontSize: 12.5 }}>{action}</div>}
    </div>
  );
}

function ListRow({ left, right, onClick, divider = true, padding = '12px 14px' }) {
  return (
    <div
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding,
        borderBottom: divider ? '1px solid var(--line-soft)' : 'none',
        cursor: onClick ? 'pointer' : 'default',
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>{left}</div>
      {right}
    </div>
  );
}

// ---------- Sheet (bottom drawer) ----------

function Sheet({ open, onClose, title, children, snap = 'auto' }) {
  if (!open) return null;
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 100,
        background: 'oklch(0.20 0.02 50 / 0.40)',
        display: 'flex',
        alignItems: 'flex-end',
        animation: 'fadeIn .18s',
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxHeight: snap === 'full' ? '95%' : '85%',
          background: 'var(--bg)',
          borderTopLeftRadius: 'var(--r-xl)',
          borderTopRightRadius: 'var(--r-xl)',
          paddingBottom: 30,
          display: 'flex',
          flexDirection: 'column',
          animation: 'slideUp .25s cubic-bezier(.2,.8,.2,1)',
          boxShadow: '0 -10px 40px oklch(0.20 0.02 50 / 0.20)',
        }}
      >
        <div style={{
          width: 38, height: 4, borderRadius: 999,
          background: 'var(--line)',
          margin: '8px auto 4px',
        }} />
        {title && (
          <div style={{
            padding: '12px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid var(--line-soft)',
          }}>
            <div style={{ fontFamily: 'DM Serif Display, serif', fontSize: 18 }}>{title}</div>
            <IconButton onClick={onClose}><Icon.X size={20} /></IconButton>
          </div>
        )}
        <div style={{ flex: 1, overflowY: 'auto', padding: '8px 20px 0' }}>
          {children}
        </div>
      </div>
    </div>
  );
}

// ---------- Toast ----------

function Toast({ open, message, tone = 'caramel' }) {
  if (!open) return null;
  const tones = {
    caramel: { bg: 'var(--caramel)', fg: 'var(--surface)' },
    sage: { bg: 'oklch(0.40 0.08 145)', fg: 'var(--surface)' },
  };
  const t = tones[tone] || tones.caramel;
  return (
    <div style={{
      position: 'absolute',
      bottom: 92,
      left: '50%',
      transform: 'translateX(-50%)',
      background: t.bg,
      color: t.fg,
      padding: '10px 16px',
      borderRadius: 'var(--r)',
      fontSize: 13.5,
      fontWeight: 500,
      boxShadow: 'var(--shadow-lg)',
      zIndex: 80,
      animation: 'toastIn .25s',
    }}>{message}</div>
  );
}

// ---------- Sparkline / mini chart ----------

function Sparkline({ data, width = 80, height = 28, color = 'var(--caramel)', fill = true }) {
  if (!data || data.length === 0) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const step = width / (data.length - 1);
  const points = data.map((d, i) => [i * step, height - ((d - min) / range) * (height - 4) - 2]);
  const path = points.map((p, i) => (i === 0 ? 'M' : 'L') + p[0] + ',' + p[1]).join(' ');
  const area = path + ` L ${width},${height} L 0,${height} Z`;
  return (
    <svg width={width} height={height} style={{ display: 'block' }}>
      {fill && <path d={area} fill={color} fillOpacity="0.12" />}
      <path d={path} fill="none" stroke={color} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function Bars({ data, height = 60, color = 'var(--caramel)', secondary = 'var(--rose)' }) {
  const max = Math.max(...data.map(d => Math.max(d.in || 0, d.out || 0)));
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height }}>
      {data.map((d, i) => (
        <div key={i} style={{ flex: 1, display: 'flex', alignItems: 'flex-end', gap: 2, height: '100%' }}>
          <div style={{
            flex: 1,
            background: color,
            borderRadius: 3,
            height: ((d.in / max) * 100) + '%',
            minHeight: 2,
          }} />
          <div style={{
            flex: 1,
            background: secondary,
            opacity: 0.7,
            borderRadius: 3,
            height: ((d.out / max) * 100) + '%',
            minHeight: 2,
          }} />
        </div>
      ))}
    </div>
  );
}

// ---------- Animations ----------

const __style = document.createElement('style');
__style.textContent = `
  @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
  @keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
  @keyframes toastIn { from { opacity: 0; transform: translate(-50%, 10px); } to { opacity: 1; transform: translate(-50%, 0); } }
  @keyframes screenIn { from { opacity: 0; transform: translateX(20px); } to { opacity: 1; transform: translateX(0); } }
  @keyframes pulse { 0%, 100% { box-shadow: 0 0 0 0 var(--caramel-soft); } 50% { box-shadow: 0 0 0 6px transparent; } }
  [data-screen-label] { flex: 1; min-height: 0; display: flex; flex-direction: column; }
`;
document.head.appendChild(__style);

// ---------- Expose ----------
Object.assign(window, {
  Screen, ScreenHeader, ScreenBody,
  Button, IconButton,
  Card,
  Pill, StatusPill,
  Avatar, CakeArt,
  Field, TextInput, Select, SegmentedControl, Toggle,
  SectionHeader, ListRow,
  Sheet, Toast,
  Sparkline, Bars,
});
