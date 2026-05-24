"""
Room-equipment topology. No scale — only "what's where, what crosses what."
Cross-zone edges are the contract surface between bounded contexts (rooms).
"""
from graphviz import Digraph

g = Digraph(
    "facility",
    format='svg',
    graph_attr={
        'rankdir': 'LR',
        'splines': 'ortho',
        'fontname': 'Helvetica',
        'fontsize': '11',
        'pad': '0.4',
        'nodesep': '0.3',
        'ranksep': '0.7',
    },
    node_attr={
        'shape': 'box',
        'style': 'rounded,filled',
        'fontname': 'Helvetica',
        'fontsize': '10',
        'margin': '0.15,0.08',
    },
    edge_attr={'fontname': 'Helvetica', 'fontsize': '9'},
)

# KITCHEN (production)
with g.subgraph(name='cluster_kitchen') as k:
    k.attr(label='KITCHEN  (production · hot)',
           style='filled', fillcolor='#fef0e0', color='#c97',
           fontname='Helvetica', fontsize='13', fontcolor='#933')
    k.node('oven',     'Convection Oven\n(planned, 60L)',  fillcolor='#fff8dc')
    k.node('hob',      'Gas Hob 4-burner\n+ Chimney',       fillcolor='#fff')
    k.node('mixer',    'Stand Mixer\n(planned, 7L)',        fillcolor='#fff8dc')
    k.node('proc',     'Food Processor',                    fillcolor='#fff')
    k.node('mwc',      'Microwave-Conv 20L\n(aux only)',    fillcolor='#fff')
    k.node('sink',     'Prep Sink\n+ Hand Wash',            fillcolor='#fff')
    k.node('fridge',   'Walk-in Fridge\n(Phase 2)',         fillcolor='#fff8dc')

# UTILITY (raw + wet)
with g.subgraph(name='cluster_utility') as u:
    u.attr(label='UTILITY  (raw + wet)',
           style='filled', fillcolor='#eaeaea', color='#888',
           fontname='Helvetica', fontsize='13', fontcolor='#444')
    u.node('washer',   'Washing Machine',                   fillcolor='#fff')
    u.node('freezer',  'Chest Freezer*\n(planned)',         fillcolor='#fff8dc')
    u.node('receive',  'Receiving / Bin',                   fillcolor='#fff')

# STUDIO (cold + decorate + pack + storage)
with g.subgraph(name='cluster_studio') as s:
    s.attr(label='BEDROOM 2 — STUDIO  (cold · decorate · pack)',
           style='filled', fillcolor='#e8f3e8', color='#3a8',
           fontname='Helvetica', fontsize='13', fontcolor='#262')
    s.node('coldbench', 'Cold Finishing\nBench (planned)',  fillcolor='#fff8dc')
    s.node('decobench', 'Decoration\nBench (planned)',      fillcolor='#fff8dc')
    s.node('uchiller',  'Under-counter\nChiller (planned)', fillcolor='#fff8dc')
    s.node('drystore',  'Dry Storage Rack\n(planned)',      fillcolor='#fff8dc')
    s.node('plaque',    'Plaque Rack\nvertical (planned)',  fillcolor='#fff8dc')
    s.node('packbench', 'Pack / Dispatch\nBench (planned)', fillcolor='#fff8dc')
    s.node('ac',        'AC unit\n(TBD: confirm point)',    fillcolor='#fff8dc')

# CORRIDOR (carry path — explicit as a single node so cross-zone is visible)
g.node('corridor',
       'Dining + Drawing\n(NEUTRAL carry corridor\n~25–30 ft)',
       shape='cylinder', fillcolor='#f4f4f4', style='filled',
       fontcolor='#666', fontsize='9')

# Intra-cluster wiring (mise-en-place adjacency)
g.edge('sink',  'mixer', style='dotted', color='#888')
g.edge('mixer', 'oven',  style='dotted', color='#888')
g.edge('mixer', 'hob',   style='dotted', color='#888')

g.edge('coldbench', 'decobench', style='dotted', color='#888')
g.edge('uchiller',  'coldbench', style='dotted', color='#888')
g.edge('decobench', 'packbench', style='dotted', color='#888')
g.edge('drystore',  'coldbench', style='dotted', color='#888')

# Cross-zone edges — these are the allowed contract surfaces.
# Anything not drawn here is forbidden.

# UTILITY → KITCHEN: raw ingredients enter wash zone
g.edge('receive', 'sink',
       label='raw ingredients\n(washed before prep)',
       color='#c33', penwidth='2.0')
g.edge('freezer', 'fridge',
       label='frozen → cold-store transfer',
       color='#c33', penwidth='1.5', style='dashed')

# KITCHEN → CORRIDOR: only baked/cooked output, sealed
g.edge('oven', 'corridor',
       label='baked\n(SEALED tray)',
       color='#36c', penwidth='2.0')
g.edge('hob',  'corridor',
       label='fried bomboloni\n(SEALED tray)',
       color='#36c', penwidth='2.0')

# CORRIDOR → STUDIO: receive cooled output
g.edge('corridor', 'coldbench',
       label='to cool / decorate',
       color='#36c', penwidth='2.0')

# STUDIO outbound: dispatch
g.node('dispatch_node', 'DISPATCH\n(courier / pickup\nvia FRONT DOOR)',
       shape='cds', fillcolor='#dfe9ff', style='filled', fontcolor='#36c',
       fontname='Helvetica-Bold')
g.edge('packbench', 'dispatch_node',
       label='packed orders',
       color='#36c', penwidth='2.0')

# Explicit NEGATIVE annotation — forbidden cross-zone edges
g.node('forbidden',
       'FORBIDDEN cross-zone movements:\n'
       '  • packed/decorated → kitchen (no rework)\n'
       '  • raw → studio (allergen/HACCP)\n'
       '  • pooja ⇄ any (out of scope)\n'
       '  • balcony → any (current prohibition)',
       shape='note', fillcolor='#ffe8e8', style='filled',
       fontcolor='#933', fontsize='9')

g.render(
    '/Users/vikas/Downloads/Swetha/AMomentWithACake/Photos/diagrams/topology',
    cleanup=True,
)
# Also render PNG for inline viewing
g.format = 'png'
g.render(
    '/Users/vikas/Downloads/Swetha/AMomentWithACake/Photos/diagrams/topology',
    cleanup=True,
)
print("rendered: topology.svg, topology.png")
