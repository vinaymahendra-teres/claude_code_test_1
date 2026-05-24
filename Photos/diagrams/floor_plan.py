"""
Tiered Cake Company — bakery operations floor plan (schematic, not to scale).

Source of truth: brainstorming/operating_envelope.md Stream 1 → Layout
Floor plan reference: Photos/floor_plan_2335sft_3bhk.webp
"""
import matplotlib.pyplot as plt
import matplotlib.patches as patches

fig, ax = plt.subplots(figsize=(13, 14))

# Rooms drawn at relative-proportional dimensions (1 unit ~ 1 foot).
# Origin bottom-left. Apartment is roughly 36 ft wide x 56 ft deep on the
# actual plan; we show only the bakery-relevant rooms + the carry corridor.
rooms = [
    # (x, y, w, h, label, facecolor)
    ( 0.0, 24.0, 10.3, 11.3, "KITCHEN  11'4\" x 10'4\"  (~117 sft)",          "#fef0e0"),
    (10.3, 24.0,  4.5, 11.3, "UTILITY  4'6\" wide",                            "#eaeaea"),
    ( 0.0,  0.0, 13.0, 12.0, "BEDROOM 2 — STUDIO  12'0\" x 13'0\"  (~156 sft)", "#e8f3e8"),
    (13.0,  0.0,  6.2,  5.0, "POOJA  5'0\" x 6'2\"  (NOT in carry path)",      "#f9f0d8"),
    ( 0.0, 12.0, 17.0, 10.5, "DINING + DRAWING  (carry corridor)",             "#f4f4f4"),
]

for x, y, w, h, label, color in rooms:
    ax.add_patch(patches.Rectangle((x, y), w, h,
                 linewidth=1.6, edgecolor='black', facecolor=color))
    ax.annotate(label, (x + w/2, y + h - 0.4),
                ha='center', va='top', fontsize=9, weight='bold')

# Equipment: (x, y, w, h, label, role)
#   role 'now' = existing; 'planned' = to acquire (Stream 1 Phase 1)
equipment = [
    # KITCHEN (production)
    ( 0.4, 33.5, 2.4, 1.2, "Convection Oven\n(planned, 60L)", 'planned'),
    ( 3.0, 33.5, 2.0, 1.2, "Stand Mixer\n(planned, 7L)",      'planned'),
    ( 5.2, 33.5, 3.0, 1.2, "Gas Hob 4-burner\n+ Chimney (now)",'now'),
    ( 0.4, 31.5, 2.4, 1.4, "Walk-in Fridge\n(future Phase 2)", 'planned'),
    ( 3.0, 31.5, 2.0, 1.4, "Microwave-Conv\n20L (aux)",        'now'),
    ( 5.2, 31.5, 2.0, 1.4, "Hand Mixer\n→ retire",             'now'),
    ( 7.4, 31.5, 2.4, 1.4, "Food Processor\n(now)",            'now'),
    ( 0.4, 25.0, 2.4, 2.0, "Prep Sink\n+ Hand Wash",           'now'),
    ( 3.0, 25.0, 4.0, 1.2, "OTG 52L (to replace)",             'now'),

    # UTILITY (cold + wet)
    (10.6, 33.0, 3.9, 1.6, "Washing Machine\n(now)",           'now'),
    (10.6, 30.5, 3.9, 1.6, "Dishwasher pt\n(unused)",          'now'),
    (10.6, 27.5, 3.9, 1.6, "Chest Freezer*\n(planned)",        'planned'),

    # STUDIO (cold finish / decorate / pack / store)
    ( 0.4,  9.5, 6.0, 1.4, "Decoration Bench\n(planned, 30x72\")", 'planned'),
    ( 0.4,  7.5, 6.0, 1.4, "Cold Finishing Bench\n(planned)",   'planned'),
    ( 7.0,  9.5, 5.4, 1.4, "Plaque Rack (vertical)\n(planned)", 'planned'),
    ( 7.0,  7.5, 5.4, 1.4, "Dry Storage Rack\n(planned)",       'planned'),
    ( 0.4,  4.5, 6.0, 1.4, "Pack / Dispatch Bench\n(planned)",  'planned'),
    ( 7.0,  4.5, 5.4, 1.4, "Under-counter Chiller\n(planned)",  'planned'),
    ( 0.4,  1.0, 4.0, 1.6, "AC unit (TBD: confirm point)",      'planned'),
]

for x, y, w, h, label, role in equipment:
    face = '#ffffff' if role == 'now' else '#fff8dc'
    edge = '#444' if role == 'now' else '#b8860b'
    style = 'solid' if role == 'now' else 'dashed'
    ax.add_patch(patches.Rectangle((x, y), w, h,
                 linewidth=0.9, edgecolor=edge, facecolor=face, linestyle=style))
    ax.annotate(label, (x + w/2, y + h/2),
                ha='center', va='center', fontsize=6.5)

# Carry path: kitchen exit → dining → drawing → studio entry.
# Drawn as a thick dashed red arrow following the actual route.
carry_points = [
    (5.0, 24.0),   # exit kitchen
    (5.0, 22.0),   # into dining
    (12.0, 22.0),  # across dining
    (12.0, 14.0),  # down into drawing
    (8.0, 14.0),   # across drawing
    (8.0, 12.0),   # into studio entry
]
xs = [p[0] for p in carry_points]
ys = [p[1] for p in carry_points]
ax.plot(xs, ys, color='#c33', linewidth=2.2, linestyle=(0, (4, 3)))
ax.annotate("", xy=carry_points[-1], xytext=carry_points[-2],
            arrowprops=dict(arrowstyle='->', color='#c33', lw=2.2))
ax.text(13.5, 17.5,
        "carry path\n~25–30 ft\n2 doorway transitions\nthrough family circulation",
        fontsize=8, color='#c33', style='italic', ha='left')

# Front door + courier crossing zone (Stream 6 concern)
ax.add_patch(patches.Rectangle((15.5, 12.5), 1.5, 1.5,
              linewidth=1, edgecolor='#36c', facecolor='#dfe9ff'))
ax.text(16.25, 13.25, "FRONT\nDOOR", ha='center', va='center',
        fontsize=7, color='#36c', weight='bold')
ax.annotate("courier / pickup must cross drawing",
            xy=(15.5, 13.25), xytext=(11.0, 16.0),
            fontsize=7, color='#36c',
            arrowprops=dict(arrowstyle='->', color='#36c', lw=0.8))

# Bedroom 2 west balcony (currently prohibited)
ax.add_patch(patches.Rectangle((-2.0, 0.0), 2.0, 12.0,
              linewidth=1, edgecolor='#888', facecolor='#f0f0f0',
              linestyle='dotted'))
ax.text(-1.0, 6.0, "BEDROOM 2\nBALCONY\n5'0\" wide\n(prohibition\nhard/soft?\nTBD)",
        ha='center', va='center', fontsize=7, color='#666', style='italic')

# Legend
legend_x, legend_y = 19.5, 30.0
ax.add_patch(patches.Rectangle((legend_x, legend_y), 0.7, 0.5,
              facecolor='#ffffff', edgecolor='#444'))
ax.text(legend_x + 1.0, legend_y + 0.25, "existing equipment", fontsize=8, va='center')
ax.add_patch(patches.Rectangle((legend_x, legend_y - 1.0), 0.7, 0.5,
              facecolor='#fff8dc', edgecolor='#b8860b', linestyle='dashed'))
ax.text(legend_x + 1.0, legend_y - 0.75, "planned equipment", fontsize=8, va='center')
ax.plot([legend_x, legend_x + 0.7], [legend_y - 1.75, legend_y - 1.75],
        color='#c33', linewidth=2, linestyle=(0, (4, 3)))
ax.text(legend_x + 1.0, legend_y - 1.75, "carry path", fontsize=8, va='center', color='#c33')

ax.set_xlim(-3.0, 27.0)
ax.set_ylim(-1.0, 36.5)
ax.set_aspect('equal')
ax.set_title("Tiered Cake Company — Bakery Operations Layout (schematic, not to scale)\n"
             "Reference: Photos/floor_plan_2335sft_3bhk.webp", fontsize=11)
ax.axis('off')

plt.tight_layout()
plt.savefig("/Users/vikas/Downloads/Swetha/AMomentWithACake/Photos/diagrams/floor_plan.svg",
            bbox_inches='tight')
plt.savefig("/Users/vikas/Downloads/Swetha/AMomentWithACake/Photos/diagrams/floor_plan.png",
            dpi=140, bbox_inches='tight')
print("rendered: floor_plan.svg, floor_plan.png")
