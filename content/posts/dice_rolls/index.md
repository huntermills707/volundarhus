+++ 
draft = false
date = 2026-03-04T20:35:11-08:00
title = "Dice‑Rolling Probabilities in TTRPGs – Why a Little Math Makes Your Game Feel Fairer (and More Fun)"
description = ""
slug = ""
authors = ["Hunter Mills"]
tags = []
categories = ["Personal Projects", "TTRPG Mechanics"]
externalLink = ""
series = []
+++

## Introduction
Every tabletop RPG (TTRPG) starts with a roll of the dice. Whether you’re generating heroic ability scores for a new character or handing out modest stats to a legion of NPC followers, the distribution of those rolls shapes the entire campaign. Too much variance can leave players feeling under‑powered; too little can make every character feel the same.

[![py.cafe](https://py.cafe/logos/pycafe_logo.png)](https://py.cafe/app/huntermills707/dash-dice-roll-probability) <-- Py.Cafe Demo App.

To explore the impact of different rolling procedures I built a Plotly Dash app (see the source files app.py, stats.py, modifiers.py, moments.py, etc.). The app lets you:

* **Add or remove dice** of any size (d4, d6, d10, …).
* **Edit individual face values** – perfect for “cheat” dice that have duplicate numbers or missing/negative sides.
* **Drop the lowest or highest dice** before summing, mimicking popular house rules such as “4d6 drop the lowest”.

The UI instantly updates two graphs: a *probability mass function* (individual outcomes) and a *cumulative distribution* (chance of meeting or exceeding a threshold). Mass plot also display the four statistical moments—mean, standard deviation, skewness, and kurtosis—so you can see at a glance how “tight” or “wild” a method is.

Below I’ll walk through a few classic and experimental methods, illustrate what the app shows, and discuss why understanding the underlying distribution matters for balanced play.

## Classic 3d6 – The Old‑School Baseline

**Procedure:** Roll three six‑sided dice and sum them.

**What the app tells us:**
|Statistic|Value|
|:---|:---|
|Mean|10.5|
|Std‑dev|2.96|
|Skewness|0 (perfectly symmetric)|
|Kurtosis|2.58 (slightly platykurtic)|

The distribution is a classic bell‑shaped triangle: most results cluster around 10–11, with extremes (3 or 18) being rare (≈0.5%). Because the variance is relatively high, you’ll see characters ranging from feeble to heroic even before any class bonuses.

**Why it matters:**
If your campaign leans heavily on combat, those low‑stat characters can become liabilities. Conversely, a story‑driven game might enjoy the dramatic swings that 3d6 provides.

## 4d6 Drop the Lowest – The “Heroic” Upgrade

**Procedure:** Roll four d6, discard the smallest die, then sum the remaining three.

**App output:**

|Statistic|Value|
|:---|:---|
|Mean|12.24|
|Std‑dev|2.85|
|Skewness|–0.28 (slightly left‑skewed)|
|Kurtosis|2.66|

The mean jumps by ~1.7 points, while the spread tightens. You get **higher average ability scores** with **fewer extreme lows**, which translates into more competent PCs right out of the gate.

**Visual cue:** The probability curve peaks sharply around 12–13, and the tail toward 3‑4 almost disappears.

**Design implication:** If you want a party that can tackle tougher challenges early, this rule is a quick way to boost competence without adding extra mechanics.

## “Cheat” Dice – Custom Faces for Controlled Outcomes

Suppose you create a d6 that replaces the 1 with another 6 (faces: 2, 3, 4, 5, 6, 6). Using the app you can edit each die’s face values directly, then run the same 3‑die procedure.
Resulting stats (3 × cheat d6):

|Statistic|Value|
|:---|:---|
|Mean|13.00|
|Std‑dev|2.58|
|Skewness|–0.16|
|Kurtosis|2.55|

The mean climbs further, and the distribution becomes even tighter. The chance of rolling a 3‑5 becomes impossible, while hitting 15‑18 becomes noticeably more common.

**Use case:**
You might reserve cheat dice for heroic NPCs or elite monsters whose power level should exceed that of ordinary PCs, or for a “blessing” mechanic that temporarily upgrades a player’s dice.

## Scaling Dice Pools – Convergence Toward a Gaussian

One of the most fascinating insights from the app is how larger dice pools tend toward a normal (Gaussian) distribution. If you roll, say, 10d6 and drop the two lowest, the resulting histogram looks almost perfectly bell‑shaped.
Statistic (Ex: 10d6).

The central limit theorem explains this: as you sum more independent random variables, the shape of the distribution approaches a normal curve regardless of the original dice shape.

**Practical takeaway:**
When you need predictable, balanced outcomes—for example, determining the total hit points of a large army of minions—you can safely use a bigger pool with a simple modifier (e.g., “8d6 + 15”) instead of fiddling with complex dice pools. The resulting variance will be low enough that the GM can plan encounters without worrying about wildly out‑of‑range totals.

Not every table wants to juggle a handfuls of dice. The app makes it easy to compare a **complex method** (many dice) against a **simpler equivalent** (fewer dice plus a static modifier).

## How I Use the App in My Campaigns

1. **Heroic Character Creation:** Before a new player joins, I spin up the app, select “4d6 drop lowest”, maybe swap one die for a cheat d6, and watch the probability curves. It helps me decide whether to give the player a modest bonus (+1) or let the dice speak for themselves.
2. **NPC Follower Stats:** For a legion of low‑level soldiers, I use a larger pool (3d6 down the line) to keep their abilities less heroic on average. The Gaussian shape reassures me that I won’t end up with a handful of absurdly strong footmen.
3. **Balancing House Rules:** When a group proposes a homebrew rule like “5d6 drop the two highest”, I plug it into the app, compare the moments to our baseline, and quickly gauge whether it will make the game too swingy or just a tad more heroic.

## Takeaways for GMs

* **Visualize before you adopt:** A quick glance at the probability and cumulative graphs tells you more than a description ever could.
* **Mean vs. Variance:** Raising the average is great, but tightening the variance (lower std‑dev) often matters more for consistent gameplay.
* **Cheat dice are a powerful lever:** Changing face values can shift the distribution dramatically without adding extra dice. Use sparingly for special events or elite NPCs.
* **Large pools ≈ normal distribution:** When you need predictability, increase the number of dice and optionally drop extremes; the result will behave like a bell curve.
* **Simplify when possible:** If a complex rule only marginally improves the mean, consider swapping it for a flat modifier to speed up play.

## Final Word

Dice are the heartbeat of any TTRPG, but they don’t have to be a mystery. By leveraging a small Plotly Dash app—just a few lines of Python—you can **quantify** the impact of every house rule, **visualize** how stats will spread across your party, and make informed design choices that keep the table both **fun** and **fair**.

The source is availble [here](https://github.com/huntermills707/DandDandD_StatRolls) with very few dependincies. Let me know what you think, or if other ideas should be added.

Give it a try, tweak the parameters, and watch the curves dance. You’ll soon discover that a little math can turn a chaotic roll into a well‑balanced storytelling tool. Happy rolling!