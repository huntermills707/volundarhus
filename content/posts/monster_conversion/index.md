+++
draft = false
date = 2026-11-20T22:25:18-08:00
title = "Converting D&D Monsters with Formulas a GM Can Actually Use"
description = "The second post in a series on D&D monster modeling tools. Using 154 matched cross-edition monster pairs, I fit short, explainable conversion rules for HP, AC, attacks, damage, abilities, defenses, and saving throws. A worked example shows how target level or CR, monster roles, and 80% prediction ranges turn the models into practical GM tools rather than black-box stat generators."
slug = ""
authors = ["Hunter Mills"]
tags = []
categories = ["Personal Projects", "TTRPG Mechanics"]
externalLink = ""
series = ["D&D Monster Modeling"]
+++

## Introduction

In the [previous post](/posts/monster_matching), I built a dataset of matched monsters from the 4e and 5e Monster Manuals. Now for the obvious question: given a monster from one edition, what should its numbers look like in the other?

The naive answer is to fit the most flexible model available and let it spit out a stat block. But that misses what I actually want at the table. I don't just need a number; I need a starting point I can understand, question, and adjust.

So the converter uses small linear models. Every result can be written as a short formula over a handful of inputs, like the source monster's HP, the target level or CR, and the intended 4e role. With no computer nearby, you can apply the same rules by hand.

{{< app_demo site="pycafe" url="https://py.cafe/app/huntermills707/dnd-monster-stat-converter" description="Convert monsters between 4e and 5e on Py.Cafe" >}}

The app converts in both directions and covers level/CR, HP, AC, attack bonus, damage, all six ability scores, 4e defenses, and 5e saving throws. Its **Explain** tab shows the fitted equation and validation results for every stat.

## Pick the Destination Before Converting the Stats

The most useful modeling decision wasn't a new algorithm. It was changing the order of operations:

**Pick the target level or CR first, then convert everything else.**

That mirrors how each edition designs monsters. In 4e especially, level sets most of the basic math. A level 12 monster's attack bonus and defenses aren't independent creative choices the way its powers might be; they sit close to level-based curves.

With a target level chosen, for instance, the 5e → 4e attack rule is simply:

```text
attack = level + 5
```

Combat roles adjust that baseline: brute −1.3, artillery −1.4, or soldier +1.2. The HP rule is recognizable as 4e monster math too:

```text
HP = 9 × level + 13
     elite: +130
     solo:  +37 × level
     brute: +24
     minion: 1 HP
```

The models never saw those design formulas. They recovered them from the matched stat blocks, which was a good sign the fit was on track.

If you leave the target blank, the app first estimates level or CR and then applies separate direct rules based on the source monster's own level/CR. That's convenient, but choosing the destination yourself usually works better, because it removes a large source of uncertainty.

The decision flow looks like this:

{{< mermaid >}}
%%{init: {
  "theme": "base",
  "htmlLabels": false,
  "themeVariables": {
    "fontFamily": "-apple-system, BlinkMacSystemFont, Segoe UI, sans-serif",
    "fontSize": "16px",
    "primaryColor": "#182840",
    "primaryTextColor": "#e6edf3",
    "primaryBorderColor": "#79c0ff",
    "lineColor": "#8bb8e8",
    "clusterBkg": "#142237",
    "clusterBorder": "#4b6785",
    "edgeLabelBackground": "#1e2d47"
  },
  "flowchart": {
    "curve": "basis",
    "htmlLabels": false,
    "nodeSpacing": 40,
    "rankSpacing": 45
  }
}}%%
flowchart TD
    A["Source stat block"] --> B{"Target level or CR<br/>chosen up front?"}
    B -->|Yes| C["Per-stat rules over<br/>target + role tier"]
    B -->|No| D["Estimate level/CR first,<br/>then direct rules"]
    C --> E["Prediction +<br/>80% interval"]
    D --> E
    E --> F["GM adjusts within range,<br/>powers converted by hand"]
{{< /mermaid >}}

| 5e → 4e stat | Error with target level | Error with direct rule |
|:---|---:|---:|
| HP | 10% | 26% |
| AC | 14% | 53% |
| Attack | 11% | 55% |
| Fortitude | 25% | 52% |
| Reflex | 24% | 53% |

Here, **error** means mean absolute error divided by the error you'd get from always guessing the training data's average target. Lower is better; it is not the percentage of monsters converted correctly.

## A Worked 4e → 5e Example

Suppose I have a standard 4e monster with these stats:

* HP 120
* AC 26
* STR 20, DEX 14, CON 18
* I want it to be **CR 8** in 5e

The fitted HP rule is:

```text
5e HP = 0.088 × 4e HP + 11 × target CR + 9.4
```

Plugging in:

```text
0.088 × 120 + 11 × 8 + 9.4 = 107.96 ≈ 108 HP
```

The source HP still matters, but the chosen CR does much more of the work. That's a useful reminder: this isn't a unit conversion like inches to centimeters. It's an estimate of how designers tended to rebuild creatures under a different edition's math.

A few more rules produce this starting point:

| Stat | Rule | Result |
|:---|:---|---:|
| HP | 0.088 × HP + 11 × CR + 9.4 | 108 |
| AC | 0.34 × CR + 12.6 | 15 |
| Attack | 0.12 × max(STR, DEX) + 0.43 × CR + 1.6 | +7 |
| Damage per attack | CR + 8 | 16 |
| STR | 0.71 × STR + 2.2 | 16 |
| CON | 0.28 × CON + 0.4 × CR + 8.4 | 17 |

The app isn't just copying a source stat through a coefficient. It's combining what was unusual about the original creature with what the target edition expects at the chosen difficulty.

## A Range Is More Honest Than a Single Number

The HP prediction above comes with an 80% range of roughly **73–143**. The AC prediction of 15 has a range of about **13–18**, and the attack prediction of +7 lands at **+6 to +9**.

Those ranges are 80% cross-conformal prediction intervals. In practical terms: under grouped cross-validation, the real target landed inside a stat's range about four times out of five. The width scales with the prediction plus a typical value for that stat, so small values get nearly absolute ranges while large values like HP get wider proportional ones.

This changed how I use the results. I take the middle number first, then nudge within the range based on the creature's fiction and intended role. A heavily armored monster can sit toward the top of its AC range; nothing says the fitted center is mandatory.

The interval isn't a promise about every homebrew monster, though. It's a summary of held-out performance on the matched Monster Manual data.

## Roles Matter More Than Extra Features

Adding the 4e role tier (minion, standard, elite, or solo) was the single largest improvement to the conversion models. In one grouped comparison, median error fell from 70% to 59% of the mean-guessing baseline.

That makes sense at the table. A solo isn't a standard monster with bigger numbers; 4e gives it a different HP budget and often different defenses. Converting to 4e, then, is really asking what role you want the result to play. The optional combat-role selector adds adjustments where they improved held-out results, especially for AC, attacks, HP, Reflex, and damage.

Other, more sophisticated-looking additions did much less. Log-scale targets, ridge regression, extra role interactions, hit-chance calculations, and several attempts to model an edition's combat economy either failed to improve results or helped only a few fields. Terms without a measurable benefit got pruned.

The final models use Huber loss, which limits the influence of a few unusual monsters, and related cross-edition pairs count at half weight. Rounding the coefficients to two significant figures cost nothing measurable and made the rules much easier to read.

## Damage Needed Its Own Measurement Rules

Damage was initially measured as the damage of the single biggest attack. That sounds reasonable, but it mixed together several different ideas:

* In 5e, it ignored additional damage riders and Multiattack.
* In 4e, it could pick a large recharge power rather than a basic attack.
* A monster with several moderate attacks could look weaker than one with a single large attack.

The revised measurement uses the 4e basic attack's average damage, includes riders in the 5e damage per attack, and sums the 5e Multiattack routine for damage per round. If a Multiattack routine can't be measured reliably, the app doesn't invent a value.

Damage per round tracks CR better than a single attack does in the 5e data. The 4e → 5e rule:

```text
damage per round = 5.9 × attacks per round + 2.5 × CR + 2.1
```

Once attack count and CR are known, more elaborate expected-damage formulas added little. Sometimes the useful modeling result is discovering which extra machinery you can remove.

## Under the Hood: One Equation per Stat

Each target stat has its own feature list, coefficients, intercept, and interval rule. At prediction time, the core calculation is just a dot product:

```python
z = model["intercept"]
for coef, feature in zip(model["coef"], model["features"]):
    z += coef * values[feature]
```

`values[feature]` may be a typed stat, a role indicator, a role interaction like `solo × level`, or `max(STR, DEX)` where that rule improved validation. The app then applies the stored interval calculation and rounds the display.

Validation uses repeated grouped five-fold cross-validation, with ten repeats. Every pair sharing a 4e or 5e monster stays in the same fold, and reported scores use held-out same-creature pairs. This matters, because related variants can otherwise leak information between training and test sets.

Resulting quality varies a lot by field:

| Direction and stat | Error | R² |
|:---|---:|---:|
| 4e → 5e HP | 34% | 0.86 |
| 4e → 5e attack | 31% | 0.89 |
| 4e → 5e DEX | 78% | 0.27 |
| 4e → 5e WIS | 81% | 0.27 |
| 5e → 4e HP | 10% | 0.99 |
| 5e → 4e AC | 14% | 0.98 |
| 5e → 4e attack | 11% | 0.98 |
| 5e → 4e DEX | 84% | 0.27 |

HP, attacks, level/CR, and 4e defenses convert well. DEX and WIS are only a little better than guessing, and some of that looks like creature-by-creature design disagreement rather than a relationship a better regression could recover.

## How I Use the Converter

1. **Choose the destination.** Set the level or CR you want instead of treating the automatically converted value as mandatory.
2. **Set the role.** Especially when converting to 4e, decide whether the result should be a minion, standard monster, elite, or solo.
3. **Use the middle, then adjust.** The prediction is a starting point, and the range is room for judgment.
4. **Convert the interesting parts yourself.** Powers, traits, spells, recharge abilities, legendary actions, and conditions are outside the numeric models.
5. **Check the weak fields.** Be extra skeptical of DEX, WIS, and the sparse saving-throw estimates.

There are known edge cases, too. A 4e minion has no direct 5e equivalent, so the app warns that its conversion behaves like a standard monster of the same level and should be treated as an upper bound. Low-level 4e monsters can produce an overly low estimated CR; choosing the target CR yourself avoids that problem.

## Takeaways for GMs

* Choose the level or CR first. It removes uncertainty and follows each edition's own monster math.
* Simple equations are a feature. You can inspect them, use them offline, and disagree with them intelligently.
* Roles carry real information. For 4e HP and attacks in particular, role terms matter more than extra model complexity.
* Damage means more than one attack. Riders and Multiattack have to be part of the measurement.
* Use the range. Conversion is informed redesign, not exact translation.

## Final Word

A good conversion tool should shorten the boring arithmetic without taking the design decisions away from the GM. These formulas recover broad patterns between editions, but the monster's powers, behavior, and table role still need a human pass.

The [next post](/posts/monster_scaling) takes on a related but distinct problem: keeping a monster inside its own edition while moving it to a new level or CR without erasing what makes its stats unusual.

The source is available [on GitHub](https://github.com/huntermills707/DandDandD_4e-5e-MonsterConverter), including the generated [conversion rules](https://github.com/huntermills707/DandDandD_4e-5e-MonsterConverter/blob/main/models/conversion_rules.md).
