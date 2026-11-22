+++
draft = false
date = 2026-11-21T22:26:18-08:00
title = "Scaling D&D Monsters Without Making Them Generic"
description = "The third post in a series on D&D monster modeling tools. A Plotly Dash difficulty scaler moves monsters to a new level or CR within their own edition. Additive curves handle AC, attacks, abilities, and defenses; multiplicative curves handle HP and damage. By shifting each original stat rather than replacing it with an average, the scaler preserves what makes a monster unusually tough, accurate, strong, or dexterous."
slug = ""
authors = ["Hunter Mills"]
tags = []
categories = ["Personal Projects", "TTRPG Mechanics"]
externalLink = ""
series = ["D&D Monster Modeling"]
+++

## Introduction

The [edition converter](/posts/monster_conversion) answers a cross-edition question: what might this 4e monster look like in 5e, or vice versa? A different problem comes up just as often during encounter prep:

**I like this monster, but I need it a few levels or challenge ratings higher.**

The obvious approach is to find an average stat block at the new difficulty and copy its numbers. That works, but it throws away useful information. If the original monster was unusually tough for its level, I want the scaled version to stay unusually tough. If it had great DEX but poor STR, I don't want a generic higher-CR stat block reversing that personality.

So the difficulty scaler follows a different rule:

**Don't replace the monster with an average. Move it along the edition's average scaling curve.**

[![py.cafe](https://py.cafe/logos/pycafe_logo.png)](https://py.cafe/app/huntermills707/dnd-monster-scaling) <-- Py.Cafe Demo App.

Choose 4e or 5e, enter the current level/CR and any stats you want to scale, then choose a new level/CR. The app shows each new value along with its change from the original, and its **Method** tab lists every fitted curve, sample size, and R².

## The Baseline: What Changes per Level or CR?

I fit a separate curve for each numeric stat within each edition:

* **4e:** stat versus level, using 479 monsters.
* **5e:** stat versus CR, using 350 monsters.

Most stats use an additive model:

```text
stat = intercept + slope × level or CR
```

HP and damage use a multiplicative model, fitted on the log scale:

```text
log(stat) = intercept + slope × level or CR
```

That distinction matters. Adding one point of AC per 4e level is reasonable; adding a fixed number of HP forever is not. HP and damage grow much faster at high difficulties, so they scale by a ratio instead.

A few fitted per-step changes show how differently the two editions spend a difficulty bump:

| Stat | 4e change per level | 5e change per CR |
|:---|---:|---:|
| HP | ×1.107 | ×1.197 |
| AC | +1.041 | +0.420 |
| Attack bonus | +0.989 | +0.529 |
| Damage per attack | ×1.044 | ×1.084 |
| 5e damage per round | — | ×1.120 |
| STR | +0.552 | +0.746 |
| DEX | +0.328 | +0.023 |

A difficulty increase doesn't move every number by the same amount, and in 5e it isn't close: HP and damage rise much faster than AC. If you've heard the term "bounded accuracy," this is what it looks like in fitted curves.

The nearly flat 5e DEX curve is worth a look, too. Its R² is **0.002**, meaning CR explains essentially none of the variation in DEX across these monsters; a higher-CR creature doesn't automatically need higher DEX. Contrast 4e attack bonus, with R² **0.966**, where attack is tied tightly to level.

## A Worked Example: CR 5 to CR 9

Suppose a 5e monster at CR 5 has:

* HP 110
* AC 16
* Attack +6
* Damage per attack 22
* Damage per round 45
* STR 18, DEX 16, CON 16

and I want a version at CR 9, four CR steps higher.

For AC, the curve adds about 0.420 per CR:

```text
new AC = 16 + 0.419865 × 4
        = 17.67946
        ≈ 18
```

For HP, the curve multiplies by about 1.197 per CR:

```text
new HP = 110 × 1.1966⁴
       = 225.521878
       ≈ 226
```

Applying the other fitted curves fills in the rest:

| Stat | CR 5 original | CR 9 scaled | Change |
|:---|---:|---:|---:|
| HP | 110 | 226 | +116 |
| AC | 16 | 18 | +2 |
| Attack | +6 | +8 | +2 |
| Damage per attack | 22 | 30.5 | +8.5 |
| Damage per round | 45 | 71 | +26 |
| STR | 18 | 21 | +3 |
| DEX | 16 | 16 | ±0 |
| CON | 16 | 19 | +3 |

HP roughly doubles, AC rises by two, and DEX stays put. That's exactly why a single flat bonus to every stat would be the wrong model: the result looks like a stronger version of this particular monster, not a generic CR 9 template.

## Preserving the Monster's Deviation

The key idea is easiest to see with an additive stat. Instead of calculating the average AC at CR 9 and using it directly, the scaler calculates only the **difference** between the curves at CR 5 and CR 9:

```text
new stat = old stat + slope × (new CR − old CR)
```

Another way to think about it: the original stat is the edition's average at the old CR plus the monster's own deviation from that average,

```text
original = edition average at old CR + monster's deviation
```

and the scaler keeps the deviation while moving only the average. A monster with AC two points above its peers starts with that same two-point advantage after scaling, before display rounding.

Multiplicative stats do the same thing in ratio form:

```text
new stat = old stat × per-step ratio^(new CR − old CR)
```

A monster with twice the expected HP for its old CR keeps roughly twice the expected HP after scaling. Fragile but hard-hitting stays fragile but hard-hitting.

This is the main feature of the tool. The fitted curves know how an edition scales; the original stat block supplies the individuality.

## Under the Hood: Two Kinds of Shift

The whole scaling operation fits in one small function:

```python
def scale_stat(edition, stat, value, delta_axis):
    model = SCALE_MODELS[edition]["stats"].get(stat)
    if model is None or delta_axis == 0:
        return value
    if model["kind"] == "multiplicative":
        return value * (model["per_step_ratio"] ** delta_axis)
    return value + model["slope"] * delta_axis
```

`delta_axis` is the change in 4e level or 5e CR. Positive values strengthen the monster, negative values weaken it, and because only the difference is used, each fitted curve's intercept cancels out.

The app accepts fractional 5e challenge ratings down to 1/8 and 4e levels from 1 to 40. Damage is displayed in half-point steps, while integer stats round to integers.

Each curve also reports how much evidence is behind it. An individual fit needs at least 30 observations. Sparse 5e saving throws can fall back to a pooled curve built from all available save values, and the Method tab labels those pooled estimates. That fallback keeps the app usable, but it's less specific than a well-supported individual curve, so treat it with extra judgment.

## Scaling Is Not Conversion

The two apps deliberately solve different problems:

| Tool | Question | Main inputs |
|:---|:---|:---|
| Edition converter | How might this monster translate to the other edition? | Cross-edition stats, target level/CR, 4e role |
| Difficulty scaler | How should this monster change within its current edition? | Current stats and the change in level/CR |

The converter needs paired monsters and bidirectional models. The scaler needs no cross-edition pairs at all; its curves come from every usable monster within each edition.

That gives the scaler broader coverage, but it doesn't make its output authoritative. It's fitting broad trends, not recovering a designer's exact intent for one creature.

## What the Scaler Does Not Do

This is still a numeric tool, and the usual limits apply:

* **Powers do not scale themselves.** A higher-level version may need different traits, spells, or action options.
* **Action economy can dominate the math.** Legendary actions, extra reactions, summons, and control effects aren't captured by HP and damage curves.
* **The target label is not a guarantee.** Assigning CR 9 and shifting stats along fitted curves doesn't certify that the result plays at exactly CR 9.
* **Large jumps deserve scrutiny.** Multiplicative HP and damage changes become dramatic over many levels or CR steps.
* **Weak curves should guide less.** A stat with little relationship to CR is mostly preserving the original value, not discovering a meaningful trend.

The app won't redesign the monster's fiction for you, either. A CR 5 scout scaled to CR 15 may need a reason to exist alongside much more powerful creatures, not just larger numbers.

## How I Use the Scaler

1. **Start with a monster whose behavior fits the encounter.** Scaling preserves numeric identity; choosing the right powers still comes first.
2. **Change one variable at a time.** Set the new level/CR and watch which stats actually moved.
3. **Look at the deltas, not just the outputs.** They show where the edition expects difficulty to come from.
4. **Keep the unusual weaknesses.** Don't manually “fix” every below-average stat; those weaknesses make the monster playable and recognizable.
5. **Finish with a table check.** Adjust damage, conditions, and action economy for your party rather than trusting the target label alone.

One experiment worth trying: scale the same monster up and down. The downward direction exposes assumptions quickly. If the lower-CR version still has an oppressive control power, changing HP won't solve the encounter.

## Takeaways for GMs

* Shift stats instead of replacing them, so strengths and weaknesses survive the trip.
* Use additive and multiplicative changes where each belongs. AC is not HP, and their curves shouldn't look alike.
* Let each edition set the pace. 4e attacks track level tightly; 5e HP grows much faster than AC.
* Read R² as a design clue. It tells you which stats are really difficulty-scaled and which stay creature-specific.
* Balance more than the numbers. Powers and action economy still need a human encounter-design pass.

## Final Word

The scaler is built around a simple belief: making a monster stronger shouldn't mean making it less itself. A few fitted curves handle the repetitive arithmetic, while the original stat block keeps supplying the creature's numeric personality.

Together with the parser/matcher and edition converter, this completes the small toolkit: find reliable counterparts, translate between systems, and rescale within a system. The goal isn't to automate monster design. It's to leave more time for the interesting parts of it.

Try the [difficulty scaler](https://py.cafe/app/huntermills707/dnd-monster-scaling), or browse the [source on GitHub](https://github.com/huntermills707/DandDandD_4e-5e-MonsterConverter). Happy scaling!
