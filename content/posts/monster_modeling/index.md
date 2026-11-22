+++
draft = false
math = true
date = 2026-11-22T07:45:33-08:00
title = "When Monster Stats Interact: Modeling 4e and 5e on Their Own Terms"
description = "The fourth post in a series on D&D monster modeling tools. A closer look at the modeling choices behind the converter: why target level or CR comes first, how solo and combat-role interactions encode 4e's design math, why max(STR, DEX) beats extra coefficients in one rule but not others, and how Huber loss stacks up against plain and ridge-regularized least squares on messy monster data."
slug = ""
authors = ["Hunter Mills"]
tags = []
categories = ["Personal Projects", "TTRPG Mechanics"]
externalLink = ""
series = ["D&D Monster Modeling"]
+++

## Introduction

The first three posts in this series walked the monster tools from [parsing and matching](/posts/monster_matching), through [cross-edition conversion](/posts/monster_conversion), to [scaling within an edition](/posts/monster_scaling). If you only skimmed the fitted rules, they look almost boring: a counterpart stat, the level or CR, maybe a role adjustment, and an intercept.

Most of the real work is hiding in the decisions around those short equations. Which stats earn a place in a rule? When does a role need its own slope instead of a flat bonus? Why does a source stat survive in one conversion direction but vanish in the other? And what should the fit do with a monster that's real, official, and nothing like its peers?

That's what this post is about. The short equations are the output; they were never the starting assumption.

## There's No Exchange Rate

A monster conversion isn't a unit conversion. There's no fixed exchange rate between a 4e level and a 5e CR, and there definitely isn't one between 4e AC and 5e AC.

The question I actually want to answer is conditional:

```text
What target stat should I expect, given the source monster,
my chosen target level/CR, and the role I want it to play?
```

That's why the converter asks for the destination first. Once the target level or CR is known, every other rule can describe the target edition's own monster math, instead of first guessing the difficulty and then compensating for the guess.

It's also why the two directions are two separate models rather than algebraic inverses. Converting 5e to 4e means placing a creature inside 4e's level-and-role framework. Converting 4e to 5e means deciding how much of that framework should survive inside 5e's looser stat budgets. Inverting an equation would quietly pretend those are the same design task. They aren't.

For convenience, the app keeps direct rules based on the source level/CR for when no target is supplied. They're a fine fallback, but the target-first rules usually win, because they condition on a decision the GM actually wanted to make anyway.

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
flowchart LR
    A["Source monster<br/>numeric stats"] --> D{"Conversion<br/>direction"}
    B["Chosen target<br/>level or CR"] --> D
    C["4e role<br/>source or destination"] --> D
    D -->|"4e → 5e"| E["5e rules<br/>CR budget + source identity"]
    D -->|"5e → 4e"| F["4e rules<br/>level chassis + role"]
    E --> G["Prediction +<br/>80% range"]
    F --> G
    G --> H["GM judgment<br/>powers and tactics"]
{{< /mermaid >}}

## A Chassis Versus a Budget

The fitted curves make the two editions' design philosophies easy to see:

| Within-edition stat | 4e R² vs. level | 5e R² vs. CR |
|:---|---:|---:|
| AC | 0.953 | 0.561 |
| Attack bonus | 0.966 | 0.827 |
| HP, fitted on the log scale | 0.215 | 0.562 |
| DEX | 0.252 | 0.002 |

In **4e**, level is a mathematical chassis. AC, attacks, Fortitude, Reflex, and Will rise almost in lockstep with it. Role then modifies the chassis: soldiers are harder to hit, brutes hit harder but less accurately, elites and solos get their own durability budgets, and minions break the ordinary HP rule entirely.

In **5e**, CR behaves more like an encounter budget. HP and damage grow quickly, AC and attack bonuses grow slowly — the familiar bounded-accuracy pattern — and ability scores stay much more creature-specific. A high-CR monster doesn't automatically have a high DEX, and forcing DEX to follow CR would erase that design freedom on purpose.

That sad-looking 4e HP R² of 0.215 isn't evidence that 4e HP is unstructured. It's what happens when you ask a single curve to describe standard monsters, elites, solos, and minions at once. Add the intended role and target level to the 5e → 4e conversion, and HP reaches R² **0.99**. The structure was always there; the one-variable model just couldn't represent it.

That's the lesson that stuck with me: an omitted structural variable looks exactly like unexplained noise.

## Even Exact Matches Are Messy Targets

An exact cross-edition match establishes identity, not numerical agreement. Two stat blocks can absolutely describe the same creature while disagreeing about how dangerous that creature should be.

**Relative difficulty can flip between editions.** If monster A is tougher than monster B in 4e, their 5e counterparts don't have to preserve that order. HP might move one way while AC moves the other, and even their relative level or CR can change. Different stats can reorder the same pair of creatures in different ways.

So an exact match is a valid training example, but not a noise-free target. The residual can be genuine redesign rather than a bad match or a parsing failure. Related variants add a second layer of uncertainty about whether two creatures are even interchangeable; exact pairs still carry disagreement between the editions' designers.

That distinction belongs in how I interpret the models. Huber loss can keep one large disagreement from dominating a fit, and prediction ranges can acknowledge it, but neither should treat every departure from the trend as an error to be repaired.

## Solos Don't Get a Bonus, They Get a Slope

An ordinary role effect is additive. A soldier's AC adjustment, for instance, is just a flat bonus.

Solo HP refuses to work that way. The fitted 5e → 4e rule is:

```text
HP = 9 × level + 13
     elite: +130
     solo:  +37 × level
     brute: +24
     minion: 1 HP
```

At level 10, the standard baseline is 103 HP, and a solo adds another 370, for 473. At level 20, the solo adjustment is 740 rather than 370. The `solo × level` interaction lets the role change the **slope**, not just the intercept.

That's not a regression trick; it's the design showing through. Solo durability scales with level rather than adding the same fixed pool everywhere. A flat solo bonus would be too small at high levels and comically large at low ones.

One subtlety: the interaction *replaces* the flat solo bonus. Keeping both fit slightly better in one comparison, but the combined rule implied a negative solo adjustment below CR 5 — outside the observed solo range entirely. That's exactly the kind of improvement I don't want: better average error, worse model behavior.

## Combat Roles Belong to the Destination

Combat roles earn their keep when converting **to 4e**, with the target level chosen:

```text
4e attack = level + 5
            brute:     -1.3
            artillery: -1.4
            soldier:   +1.2
```

Those terms make sense because the GM is the one choosing a destination role. A 5e monster being rebuilt as a 4e soldier should pick up soldier-like accuracy; one being rebuilt as a brute should trade accuracy for damage. Brute and soldier terms improved held-out results often enough to enter several 5e → 4e rules, including AC, attack, HP, Reflex, and damage.

Offering the same combat-role terms everywhere didn't help. In the 4e → 5e rules they mostly chased noise, so that direction doesn't even expose a combat-role selector.

I've come to like that asymmetry. A feature isn't universally "important" or "unimportant" — its value depends on the prediction question. Here, combat role is part of the target's design specification, not a label obligated to appear in every equation.

## When the Rule Is a Max, Not a Sum

A linear model normally adds independent contributions from each input. But some game rules don't add two abilities; they take whichever is better.

For 4e → 5e attacks, the selected rule is:

```text
5e attack = 0.12 × max(STR, DEX) + 0.43 × target CR + 1.6
```

That shape mirrors 5e weapon attacks, which commonly use proficiency plus the better applicable physical ability modifier. It also carries information the original 4e attack bonus literally cannot: 4e attack is so tightly determined by level that two monsters with the same attack bonus can have very different physical ability profiles.

Adding `max(STR, DEX)` reduced held-out error for this rule by about **10%**, and the original 4e attack term dropped out of the equation entirely. A similar `max(STR, CON)` term helped the 5e CON save rule, which tracks the ability pair behind 4e Fortitude.

But I'm not going to claim `max()` features are generally superior. They did nothing for several defenses and made some damage rules worse. A feature inspired by the game's actual rules still has to earn its place on held-out data.

## When a Useful Stat Vanishes From a Rule

Some final equations look suspiciously incomplete:

```text
4e → 5e AC:     0.34 × target CR + 12.6
4e → 5e damage: target CR + 8
5e → 4e attack: target level + 5, plus combat-role adjustments
```

Where did the source AC, damage, or attack go?

Usually, the target difficulty term is already doing that work. Source stats correlate with source level or CR, which correlates with target level or CR. Once the destination is known, an extra source coefficient often adds little new information — and it can even go negative as the regression haggles over credit among correlated inputs.

So the selection process removes counterpart stats with negative coefficients and prunes terms whose removal changes cross-validated error by less than 1%. Candidate combat roles face the opposite bar: they enter only when they improve error by at least 3%. Rounding the surviving coefficients to two significant figures cost nothing measurable.

A pruned stat is not a claim that the original creature's design is irrelevant. It means that, for this one narrow numeric prediction, the remaining terms summarize the available signal better. AC may still matter enormously when a GM decides where inside the prediction range the converted monster should sit.

## Why the Models Don't Use Plain Least Squares

The training data is messy in several distinct ways. Some pairs are exact counterparts; others are related variants. Some monsters are deliberate extremes. Some 5e saving throws have only a few dozen usable observations. And despite the parsing checks, unusual values always deserve a second look.

Ordinary least squares minimizes the sum of squared residuals:

$$\hat\beta\_{\text{OLS}} = \arg\min\_{\beta} \\; \sum\_{i=1}^{n} \bigl(y\_i - \mathbf{x}\_i^{\top} \beta\bigr)^{2}$$

The squaring is what bites. A miss of 2 contributes 4 to the loss; a miss of 20 contributes 400. You can see the same problem in the estimating equation, where least squares settles at $\sum\_i r\_i \mathbf{x}\_i = 0$: each pair pushes on the coefficients with force proportional to its residual $r\_i$, with no cap. One exceptional monster — a deliberate redesign that moved a stat by 20 points — can drag a coefficient toward itself, and in a dataset of 154 pairs there isn't much of a crowd to outvote it.

The final models use **Huber loss** instead, with sample weights $w\_i$ for how much I trust each pairing:

$$L\_{\delta}(r) = \begin{cases} \tfrac{1}{2}\\, r^{2} & \text{if } |r| \le \delta, \\\\[2pt] \delta \bigl(|r| - \tfrac{1}{2}\\,\delta\bigr) & \text{if } |r| > \delta, \end{cases} \qquad \hat\beta\_{\text{Huber}} = \arg\min\_{\beta} \\; \sum\_{i=1}^{n} w\_i \\, L\_{\delta}\bigl(y\_i - \mathbf{x}\_i^{\top} \beta\bigr)$$

The clearest way to see what this buys is the derivative of the loss:

$$\psi\_{\delta}(r) = \frac{dL\_{\delta}}{dr} = \begin{cases} r & \text{if } |r| \le \delta, \\\\ \delta \\,\operatorname{sign}(r) & \text{if } |r| > \delta. \end{cases}$$

Least squares uses $\psi(r) = r$, unbounded. Huber clips it at $\pm\delta$. Past the threshold, a monster can sit arbitrarily far from its prediction without pulling on the fit any harder — big misses still count, but their influence stops exploding. In scikit-learn's `HuberRegressor`, $\delta$ isn't a fixed number of stat points; it's scaled by a robust estimate of the residual scale, so `epsilon=1.35` works out to roughly 1.35 noise standard deviations. That's the classic value: about 95% of least squares' efficiency on clean data, with the tails defanged.

The $w\_i$ in the objective is the other half of the story. Same-creature pairs get $w\_i = 1$; related cross-edition variants get $w\_i = \tfrac{1}{2}$, because their targets are inherently noisier. The two mechanisms do different jobs: Huber bounds the influence of an unusual *residual*, while sample weights encode how much I trust each *pairing*.

This is also not outlier deletion. A genuinely unusual monster stays in the fit, just with bounded pull. And robustness is no excuse for bad data: the pipeline still turned up real extraction errors, including an OCR-produced STR of 116 and several AC values of 1. Those need source-level fixes, not a more tolerant loss function. Huber can shrug at an exceptional monster; it can't tell an exceptional monster from a broken parse.

### What Regularization Would (and Wouldn't) Fix

Ridge regression is the other lever people reach for, and it's worth being precise about how it differs:

$$\hat\beta\_{\text{ridge}} = \arg\min\_{\beta} \\; \sum\_{i=1}^{n} \bigl(y\_i - \mathbf{x}\_i^{\top} \beta\bigr)^{2} + \lambda \lVert \beta \rVert\_{2}^{2} \qquad \Longrightarrow \qquad \hat\beta\_{\text{ridge}} = \bigl(X^{\top} X + \lambda I\bigr)^{-1} X^{\top} y$$

Look at what actually changed: every residual is still squared at full strength. The penalty shrinks the whole coefficient vector toward zero — and steadies it when inputs are collinear — but a redesign-heavy dragon still speaks at full volume in the gradient; everything it says just gets multiplied by a slightly smaller number. Ridge treats high-*variance* coefficients. Huber treats high-*influence* observations. Those are different diseases, and with only a handful of features per rule against 154 pairs, variance was never my bottleneck. (I did try ridge on its own earlier in the series; it didn't move results much.)

You can combine them, and scikit-learn's Huber objective does exactly that:

$$\hat\beta = \arg\min\_{\beta} \\; \sum\_{i=1}^{n} w\_i \\, L\_{\delta}\bigl(y\_i - \mathbf{x}\_i^{\top} \beta\bigr) + \alpha \lVert \beta \rVert\_{2}^{2}$$

| | Plain OLS | Ridge (OLS + $\lambda \lVert \beta \rVert\_2^2$) | Huber |
|:---|:---|:---|:---|
| One wild pair's pull on the fit | unbounded ($\propto r\_i$) | still unbounded, slightly muted | capped at $\delta$ |
| Built to fix | — | variance, collinearity | heavy-tailed residuals |
| Doesn't fix | outliers, collinearity | outliers | collinearity, broken data |

In practice the L2 term is doing almost nothing here; the *shape* of the loss did the work. Huber loss plus the half-weight variants dropped median held-out error from **60.2% to 55.4%** of the mean-guessing baseline, improving 23 fields and worsening two. A useful gain, not a universal victory.

## Small Data Turns Feature Selection Into a Modeling Problem

Every candidate interaction is another opportunity to fit noise. That risk is worst for the 5e saves, where only proficient saves are listed and some rules have just 27–35 scored same-creature pairs. The listed saves aren't a random sample, either: they skew toward strong abilities.

Chaining saves through 5e's own formula — ability modifier plus proficiency bonus — helped DEX and CON but hurt WIS and CHA. Promising elite/solo slopes helped some saves while hurting others, sometimes producing odd shapes like a flat standard-monster save at every level. Those variants were not adopted wholesale.

The evaluation has to guard against a subtler trap, too. If I try a stack of feature sets and then report the best result on the same held-out folds, the test data has quietly helped choose the model. So the experiments use **nested cross-validation**: feature selection is repeated inside each outer training fold, and the outer test fold stays untouched until prediction. Pairs sharing either monster stay in the same fold so relatives can't leak across the split.

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
    A["Game-design hypothesis<br/>role, interaction, or max(...)"] --> B["Candidate features"]
    B --> C["Outer training fold only<br/>prune and add terms"]
    C --> D["Fit Huber model<br/>related pairs at half weight"]
    D --> E["Predict untouched<br/>outer test fold"]
    E --> F["Score exact matches<br/>with monster groups intact"]
    F --> G{"Better held-out error<br/>and sensible shape?"}
    G -->|Yes| H["Keep the candidate"]
    G -->|No| I["Prune the candidate"]
    H --> J["Compare across<br/>repeated outer folds"]
    I --> J
    J --> K["Refit the selected rule<br/>on all pairs"]
{{< /mermaid >}}

Even then, a small gain on 27 monsters is a clue, not a law. The goal was never to discover the one true equation — just to keep the equations useful, stable, and honest about their limits.

## Takeaways

* Condition on the destination. Target level or CR is a design decision, not merely another source stat to estimate.
* Represent each edition's structure. In 4e, level and role explain much of the math; in 5e, CR coexists with far more creature-specific variation.
* Use interactions when they mean something. `solo × level` changes a durability slope; `max(STR, DEX)` mirrors an actual rule.
* Let features be direction-specific. A role that specifies the 4e destination has no obligation to help in the other direction.
* Treat exact identity as noisy agreement. Designers reorder relative difficulty when they rebuild a creature for another edition.
* Match the tool to the disease. Huber caps influence, ridge shrinks variance, pair weights encode trust — and none of them substitutes for fixing broken parses.

## Final Word

The converter's equations are short because extra complexity kept failing to justify itself, not because monster design is simple. The useful work was deciding which structure deserved representation and which apparent patterns were just noise wearing a convincing costume.

That distinction travels well beyond D&D. A good small model is mostly a set of deliberate choices about the question, the features, and the loss function. The arithmetic at the end is the easy part.

The equations and evaluation results are available in the [project repository](https://github.com/huntermills707/DandDandD_4e-5e-MonsterConverter), including the modeling code in [`models/fit_models.py`](https://github.com/huntermills707/DandDandD_4e-5e-MonsterConverter/blob/main/models/fit_models.py) and the comparisons in [`models/experiments.py`](https://github.com/huntermills707/DandDandD_4e-5e-MonsterConverter/blob/main/models/experiments.py).
