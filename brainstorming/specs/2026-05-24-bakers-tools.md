# Bakers' Tools — research & scope

_2026-05-24 · for Tiered Cake Company app_

## What a working baker actually needs (research)

Spent a chunk of time looking at how custom-cake bakers actually run their day. Two patterns dominate:

1. **Concurrent processes, no fixed sequence**. A baker is rarely doing one thing. They're proofing dough while a sponge cools while ganache sets while a buttercream waits. Each has its own clock and a different cost of overshoot — burnt sponge is a wasted ingredient run; overproofed dough is a wasted slot.
2. **Reverse from delivery**. Cakes have to be delivered chilled/decorated at a window. Production is planned backwards from there, with stack-up risk at the decoration end.

Apps in the space (Yummly, Paprika, Cooklist, plus pro tools like Brigade, Wherewolf KDS) tend to embed timers _inside recipe steps_ — one tap on "bake 40 min" arms a named countdown. Anyone who has tried using the iOS clock app while their hands are in batter knows why this matters: switching apps with floury fingers is friction.

The other recurring need: **batch orders**. A Friday with three cakes shares an oven, a stand mixer, a chiller, and a single human. Tools that surface the shared-resource conflicts (oven full, mixer in use) save bakes.

## Tool inventory — what to consider shipping

Ranked roughly by "would a baker use this every shift":

| #  | Tool                                | Use moment                                | Effort | Ship? |
|----|-------------------------------------|-------------------------------------------|--------|-------|
| 1  | **Multi-timer rack**                | Every bake, every shift                   | M      | YES   |
| 2  | **Recipe-step → tap to start timer**| Mid-bake, hands free of phone             | S      | YES   |
| 3  | **Bake plan from order**            | Start of production on an order           | S      | YES   |
| 4  | **Persistent running-timer peek**   | Any screen, ambient awareness             | S      | YES   |
| 5  | **Conversions** (cups↔g, °F↔°C, scale recipe) | Adapting a recipe, halving a bake | S      | YES   |
| 6  | **Mise en place aggregator**        | Morning prep across multiple orders       | M      | Defer |
| 7  | **Oven occupancy / temp conflict**  | Scheduling two bakes on same day          | M      | Defer |
| 8  | **Buttercream colour-mix log**      | Repeat orders matching prior shades       | M      | Defer |
| 9  | **Photo log → Instagram-ready**     | After delivery                            | M      | Defer |
| 10 | **Allergen / dietary flags**        | Order intake, prep                        | S      | Defer |
| 11 | **Equipment hours / service log**   | Monthly                                   | M      | Defer |
| 12 | **Voice / Siri "set timer"**        | Hands in batter                           | L      | Defer |
| 13 | **Push notifications when phone locked** | Walking away from kitchen           | M      | Defer |

## What this iteration ships

A focused **Kitchen Tools** slice:

- **`Timer` engine** (`src/timers.jsx`) — concurrent named timers, each tagged with color + optional recipe/order link. Survives page reloads via localStorage. Single 1 Hz tick. Chime + visual flash on expire.
- **Timers panel** at More → "Timers" — full rack with status, pause/resume, +1m / +5m, dismiss.
- **"Now in the kitchen" strip** on the Bakes (Production) screen — shows the currently active timers above the schedule.
- **Persistent peek** floating just above the bottom tab bar whenever any timer is running — tap to jump to the timers panel.
- **Recipe step tap-to-start** — every step in a recipe's Method gets a tappable affordance. Steps with a detectable duration ("5 min", "40 min", "165°C / 40 min") pre-fill the timer; others let you pick from presets.
- **Bake plan from order** — Order detail gets a "Start bake plan" button that spawns a sequence of timers (prep / bake / cool / decorate) drawn from the linked recipe.
- **Conversions** at More → "Tools" — cups→grams (ingredient-aware), °F↔°C, recipe scaling by factor or by target servings.

## What's intentionally deferred

- **Push notifications when screen is off** — needs a service worker + asking for permission, which complicates the AirDrop-able single file. Browser-tab-must-be-open is acceptable for this iteration.
- **Mise en place aggregator** — already partially in the Bakes "Oven plan" tab. A richer version (per-day, with check-off) is the next pass.
- **Oven conflict view** — would need an `ovenTemp` and `ovenMins` on the recipe; the data model can take it but the UI is a bigger build.
- **Voice / Siri** — out of scope for a browser prototype.

## Design notes

- Timers use the active palette accent for the progress ring so they fit the warm-cream aesthetic.
- Chime is a soft two-note bell, inlined as a data URI WAV so the standalone file stays self-contained.
- Time format is `m:ss` for under an hour, `h:mm:ss` over. Always rounds down (a "40 min" timer hits 0 at 40:00 elapsed, not 39:59).
- A timer can carry an optional `link` ({ kind, id, label }) — tapping the timer in the rack offers to jump to the linked recipe/order.

## Open questions (for next pass, not blocking)

- Should completed-but-undismissed timers stack indefinitely, or auto-clear after N minutes? Currently: stack indefinitely, manual dismiss.
- Sound on by default, or opt-in? Currently: on, with a mute toggle in Tweaks.
- Should the bake plan auto-advance (start the next timer when the previous expires)? Currently: manual — too risky to auto-start a 4-hour chill if the baker is mid-step.
