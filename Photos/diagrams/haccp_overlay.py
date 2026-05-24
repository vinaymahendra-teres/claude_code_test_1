"""
HACCP zone overlay on bakery operations layout.

Zones (one-way only, no back-flow allowed):
  RAW (red) → WASH (red-orange) → PREP/MIX (yellow) → COOK (orange)
   → COOL (teal) → DECORATE (teal) → PACK (blue) → DISPATCH (blue)

Critical constraint: COOK → COOL crossing the family corridor is the only
cross-zone transition. It must be a single direction, sealed carry (covered
tray), with no PREP material in the corridor at the same time.
"""
import matplotlib.pyplot as plt
import matplotlib.patches as patches

fig, ax = plt.subplots(figsize=(13, 14))

# Baseline rooms (same coordinates as floor_plan.py)
rooms = [
    ( 0.0, 24.0, 10.3, 11.3, "KITCHEN",          "#fef0e0"),
    (10.3, 24.0,  4.5, 11.3, "UTILITY",          "#eaeaea"),
    ( 0.0,  0.0, 13.0, 12.0, "STUDIO (B2)",      "#e8f3e8"),
    (13.0,  0.0,  6.2,  5.0, "POOJA",            "#f9f0d8"),
    ( 0.0, 12.0, 17.0, 10.5, "DINING + DRAWING\n(carry corridor)", "#f4f4f4"),
]
for x, y, w, h, label, color in rooms:
    ax.add_patch(patches.Rectangle((x, y), w, h,
                 linewidth=1.4, edgecolor='black', facecolor=color))
    ax.annotate(label, (x + w/2, y + h - 0.3),
                ha='center', va='top', fontsize=8, weight='bold', color='#666')

# HACCP zones overlaid as translucent polygons.
zones = [
    # RAW: utility (receiving + bin) + a corner of kitchen near sink
    {
        'verts': [(10.3, 30.0), (14.8, 30.0), (14.8, 35.3), (10.3, 35.3)],
        'label': "RAW\n(receiving, wash-down,\nrefrigerated raw)",
        'color': '#d44', 'alpha': 0.28,
    },
    # WASH (hand + ingredient wash): kitchen south-west, prep sink
    {
        'verts': [(0.0, 24.0), (3.5, 24.0), (3.5, 29.0), (0.0, 29.0)],
        'label': "WASH\n(hand + ingredient)",
        'color': '#e85', 'alpha': 0.28,
    },
    # PREP/MIX: kitchen center+north
    {
        'verts': [(0.0, 29.0), (10.3, 29.0), (10.3, 33.0), (0.0, 33.0)],
        'label': "PREP / MIX",
        'color': '#dd8', 'alpha': 0.28,
    },
    # COOK: kitchen north strip (oven + hob)
    {
        'verts': [(0.0, 33.0), (10.3, 33.0), (10.3, 35.3), (0.0, 35.3)],
        'label': "COOK\n(oven + hob)",
        'color': '#e63', 'alpha': 0.30,
    },
    # COOL/DECORATE: studio main body (top half of bedroom 2)
    {
        'verts': [(0.0, 6.5), (13.0, 6.5), (13.0, 11.5), (0.0, 11.5)],
        'label': "COOL / DECORATE / FINISH",
        'color': '#3a8', 'alpha': 0.28,
    },
    # PACK / DISPATCH: studio south band
    {
        'verts': [(0.0, 2.5), (13.0, 2.5), (13.0, 6.5), (0.0, 6.5)],
        'label': "PACK / DISPATCH",
        'color': '#38a', 'alpha': 0.28,
    },
]

for z in zones:
    poly = patches.Polygon(z['verts'], closed=True,
                            facecolor=z['color'], alpha=z['alpha'],
                            edgecolor=z['color'], linewidth=1.8)
    ax.add_patch(poly)
    cx = sum(v[0] for v in z['verts']) / len(z['verts'])
    cy = sum(v[1] for v in z['verts']) / len(z['verts'])
    ax.annotate(z['label'], (cx, cy), ha='center', va='center',
                fontsize=9.5, weight='bold', color='#222')

# Forward-only flow arrows
flow = [
    # RAW -> WASH (within kitchen complex)
    ((10.5, 31.0), (3.5, 27.0), "raw → wash"),
    # WASH -> PREP
    ((1.5, 28.9), (1.5, 30.5), "wash → prep"),
    # PREP -> COOK
    ((5.0, 32.9), (5.0, 33.5), "prep → cook"),
    # COOK -> COOL (THE CARRY: only cross-zone, must be sealed)
    ((5.0, 24.0), (5.0, 11.6), "COOK → COOL\n(sealed carry,\nsingle direction)"),
    # COOL -> PACK (within studio)
    ((6.5, 6.6), (6.5, 6.4), "cool → pack"),
]
for (x1, y1), (x2, y2), label in flow:
    ax.annotate("", xy=(x2, y2), xytext=(x1, y1),
                arrowprops=dict(arrowstyle="->", lw=2.4, color='#111',
                               connectionstyle="arc3,rad=0.0"))
    if label:
        ax.text((x1 + x2) / 2 + 0.6, (y1 + y2) / 2, label,
                fontsize=8, style='italic', color='#111')

# Forbidden return: PACK → COOK or RAW (drawn faint red with X)
ax.annotate("", xy=(5.0, 24.0), xytext=(5.0, 11.6),
            arrowprops=dict(arrowstyle="->", lw=1.5, color='#c33',
                           linestyle='dashed', alpha=0.55))
ax.text(2.0, 17.5, "✗ NO RETURN PATH\n(re-work = scrap,\nnot back to PREP)",
        fontsize=8, weight='bold', color='#c33')

# Carry-corridor caveat
ax.text(8.5, 17.0,
        "Carry corridor is NEUTRAL — must be empty of\n"
        "active food work when a tray is in transit.\n"
        "No simultaneous family cooking during dispatch.",
        fontsize=8, color='#555', style='italic',
        bbox=dict(boxstyle="round,pad=0.4", facecolor='#fff', edgecolor='#888'))

# Legend
zone_legend = [
    ("RAW",                "#d44"),
    ("WASH",               "#e85"),
    ("PREP / MIX",         "#dd8"),
    ("COOK",               "#e63"),
    ("COOL / DECORATE",    "#3a8"),
    ("PACK / DISPATCH",    "#38a"),
]
lx, ly = 20.0, 30.0
for i, (lab, col) in enumerate(zone_legend):
    ax.add_patch(patches.Rectangle((lx, ly - i*1.0), 0.8, 0.6,
                  facecolor=col, alpha=0.5, edgecolor=col))
    ax.text(lx + 1.0, ly + 0.3 - i*1.0, lab, fontsize=8, va='center')

ax.set_xlim(-3.0, 27.0)
ax.set_ylim(-1.0, 36.5)
ax.set_aspect('equal')
ax.set_title("HACCP Zone Overlay — one-way flow validation\n"
             "Raw → Wash → Prep → Cook ⇒ (sealed carry) ⇒ Cool → Decorate → Pack → Dispatch",
             fontsize=11)
ax.axis('off')

plt.tight_layout()
plt.savefig("/Users/vikas/Downloads/Swetha/AMomentWithACake/Photos/diagrams/haccp_overlay.svg",
            bbox_inches='tight')
plt.savefig("/Users/vikas/Downloads/Swetha/AMomentWithACake/Photos/diagrams/haccp_overlay.png",
            dpi=140, bbox_inches='tight')
print("rendered: haccp_overlay.svg, haccp_overlay.png")
