+++
draft = false
math = true
date = 2026-11-22T11:12:00-08:00
title = "Counting Dice Instead of Rolling Them: Exact Probabilities for TTRPG Mechanics"
description = "A companion post to the dice-roll and stat-generation tools. Every distribution the app shows comes from exact enumeration rather than Monte Carlo sampling. I explain why that works, when I'd simulate instead, walk through the full 20 x 20 grid behind 5e advantage and disadvantage, and show how iterating over combinations instead of permutations shrinks roll-seven-stats-drop-the-lowest from 268 million ordered arrays to 170,544 buckets."
slug = ""
authors = ["Hunter Mills"]
tags = []
categories = ["Personal Projects", "TTRPG Mechanics"]
externalLink = ""
series = []
+++

## Introduction

Two older posts on this site cover the [dice-roll visualizer](/posts/dice_rolls) and the [stat-generation tool](/posts/stat_rolling) I built on top of it. Both of them promised "exact probability calculation, no Monte Carlo sampling" and then promptly got distracted by the GM-facing parts.

This post is the math I skipped. What "deterministic" actually means when a computer says it, when I'd rather simulate than count, and two results I use at the table: the 20 × 20 grid that completely explains 5e advantage and disadvantage, and the combinations-versus-permutations trick that turns "roll seven stats, drop the lowest" from 268 million ordered arrays into 170,544 weighted multisets.

{{< app_demo site="pycafe" url="https://py.cafe/app/huntermills707/dash-dice-roll-probability" description="Explore dice probabilities on Py.Cafe" >}}

## Deterministic Means Counting

Every number the app shows you is the distribution itself, not an estimate of it. There's no seed, no sample size, and no error bars. The code walks the whole outcome space, counts up the results, and divides by the number of equally likely rolls. "Deterministic" refers to the calculation, not the dice. The game is still random, but the probabilities on screen are exact and come out the same every time you run it.

Here's the setup. Take a pool of $n$ dice, where die $i$ has face list $D_i$ (usually 1 through $m_i$, though the app lets you use whatever values you want). An ordered roll $r$ picks one face from each die, and the mechanic is some function $f(r)$: a sum, drop-the-lowest-then-sum, whatever the rule says. The outcome space is the Cartesian product:

$$\Omega = D_1 \times D_2 \times \cdots \times D_n, \qquad N = |\Omega| = \prod_{i=1}^{n} |D_i|$$

The probability of a stat value $x$ is just the fraction of ordered rolls that produce it:

$$p_s(x) = P(X=x) = \frac{1}{N}\sum_{r \in \Omega} \mathbf{1}\\{f(r)=x\\}$$

The indicator is 1 when the roll gives you $x$ and 0 otherwise. This is why the implementation uses `itertools.product`: it visits every single $r$, including the rolls that end up producing the same final value. `Counter` then groups those rolls by value before everything gets normalized.

```python
def get_rolls(dice, f=sum):
    nobs = 1
    for die in dice:
        nobs *= len(die)
    return nobs, (f(roll) for roll in product(*dice))

def get_roll_probs(nobs, rolls):
    return {val: cnt / nobs for val, cnt in Counter(rolls).items()}
```

Once you have the exact probability mass function $p_s$, the four moments overlaid on the plots fall out of it directly:

$$\mu = \sum_x x\\,p_s(x), \qquad \sigma = \sqrt{\sum_x (x-\mu)^2p_s(x)}$$

$$\mathrm{skew} = \frac{\sum_x (x-\mu)^3p_s(x)}{\sigma^3}, \qquad \mathrm{kurt} = \frac{\sum_x (x-\mu)^4p_s(x)}{\sigma^4}$$

That's Pearson kurtosis, where a normal distribution scores 3. So the 2.58 shown for 3d6 in the [first post](/posts/dice_rolls) means slightly thinner tails than a Gaussian, not that 3d6 is one.

Counting everything is affordable because character-creation pools are small:

| Mechanic | Ordered rolls to enumerate |
|:---|---:|
| 2d20 (advantage) | 400 |
| 3d6 | 216 |
| 4d6 | 1,296 |
| 8d6 | 1,679,616 |
| 10d6 | 60,466,176 |

The generator returned by `get_rolls` means the code never stores every ordered roll at once, but the runtime still grows with the product of the dice sizes.

## When I'd Simulate Instead

None of this is an argument against Monte Carlo. If a mechanic mixes exploding dice, limited rerolls, conditional bonuses, and rolls that depend on each other, a short simulation is a lot easier to write and check than a custom exact algorithm. It also handles genuinely unbounded mechanics like exploding dice without inventing a truncation rule.

The upsides are real. Anything you can express in code can be sampled, including order-dependent and stateful rules. Prototyping is direct: you simulate the procedure instead of first having to derive a counting strategy for it. You can draw a fixed number of samples no matter how huge the full outcome space is. And a simulation is a good cross-check on an exact implementation, since agreement within sampling error tells you both are probably fine.

But the costs are worth knowing about:

* **Error shrinks as $1/\sqrt{N}$.** For an event with probability $p$, the standard error of its simulated proportion is $\sqrt{p(1-p)/N}$. Estimating a 1-in-10,000 probability to about 1% *relative* standard error takes on the order of 100 million trials, not 10,000.
* **Rare outcomes can look impossible.** Six 18s from six independent 4d6-drop-lowest rolls has probability $(21/1296)^6 \approx 1.81\times10^{-11}$. A million simulated characters will almost certainly report zero of them, even though the outcome is possible.
* **Small differences can drown in noise.** Comparing two similar house rules means comparing two estimates. If the true difference is smaller than the sampling noise, the only fix is more trials.
* **Reproducibility takes bookkeeping.** A seed makes one run repeatable, but different sample sizes and seeds still give you different plots. Exact counting gives you the same probabilities every time.

The line cuts both ways, though. Enumeration cost multiplies with each die you add: $6^{10}$ is about 60 million rolls and $6^{12}$ is about 2.2 billion, and six d20s already get you to 64 million. Past some point simulation is simply the practical choice. Character generation happens to sit comfortably on the exact-counting side of that line.

## Advantage and Disadvantage, Read Off a Grid

5e's most common mechanical modifier is also its most enumerable. Advantage: roll 2d20, keep the higher. Disadvantage: keep the lower. Two dice, 400 equiprobable ordered pairs, and all of the math fits in one grid.

Rows are the first die, columns the second, and each cell holds what advantage keeps, which is the max. On smaller screens the grid scrolls horizontally while the row and column labels stay put:

{{< d20_advantage_grid >}}

Stare at it for a minute and the structure shows up. The cells where advantage reports exactly $k$ form an L-shaped band along row $k$ and column $k$. That band contains $k^2 - (k-1)^2 = 2k-1$ cells, so:

$$P(\mathrm{adv} = k) = \frac{2k - 1}{400}$$

Disadvantage is the same grid mirrored, meaning $P(\mathrm{dis} = k) = P(\mathrm{adv} = 21 - k)$:

$$P(\mathrm{dis} = k) = \frac{2(21 - k) - 1}{400}$$

| d20 result | P(adv = k) | P(dis = k) | P(adv ≥ k) | P(dis ≥ k) |
|:---:|---:|---:|---:|---:|
| 1 | 0.25% | 9.75% | 100.00% | 100.00% |
| 2 | 0.75% | 9.25% | 99.75% | 90.25% |
| 3 | 1.25% | 8.75% | 99.00% | 81.00% |
| 4 | 1.75% | 8.25% | 97.75% | 72.25% |
| 5 | 2.25% | 7.75% | 96.00% | 64.00% |
| 6 | 2.75% | 7.25% | 93.75% | 56.25% |
| 7 | 3.25% | 6.75% | 91.00% | 49.00% |
| 8 | 3.75% | 6.25% | 87.75% | 42.25% |
| 9 | 4.25% | 5.75% | 84.00% | 36.00% |
| 10 | 4.75% | 5.25% | 79.75% | 30.25% |
| 11 | 5.25% | 4.75% | 75.00% | 25.00% |
| 12 | 5.75% | 4.25% | 69.75% | 20.25% |
| 13 | 6.25% | 3.75% | 64.00% | 16.00% |
| 14 | 6.75% | 3.25% | 57.75% | 12.25% |
| 15 | 7.25% | 2.75% | 51.00% | 9.00% |
| 16 | 7.75% | 2.25% | 43.75% | 6.25% |
| 17 | 8.25% | 1.75% | 36.00% | 4.00% |
| 18 | 8.75% | 1.25% | 27.75% | 2.25% |
| 19 | 9.25% | 0.75% | 19.00% | 1.00% |
| 20 | 9.75% | 0.25% | 9.75% | 0.25% |

Every advantage fact you've heard quoted at a table is sitting somewhere in that grid. The means are:

$$E[\mathrm{adv}] = \sum\_{k=1}^{20} k \cdot \frac{2k-1}{400} = 13.825\\,, \qquad E[\mathrm{dis}] = 7.175$$

So that's **+3.325 / −3.325** against the flat-d20 mean of 10.5. How much that helps depends on where the DC sits, though. At DC 11, advantage moves success from 50% to 75%, which works out to the same as a +5 bonus. At DC 20 it only moves 5% to 9.75%, worth less than +1. A natural 20 needs at least one 20 somewhere on the grid: 5% becomes **9.75%** with advantage and **0.25%** with disadvantage. Meeting DC 10 goes from 55% to **79.75%** with advantage, or **30.25%** with disadvantage.

A nice side effect fell out of the code too: the app never needed an advantage mode. A pool of two d20s with "drop lowest 1" *is* advantage. Drop one die from a two-dice pool and sum what's left, and you've kept the max. Disadvantage is drop-highest. The stat-generation machinery ends up computing d20 mechanics for free.

## Six Stats at Once Blows Up Fast

The [stat-generation post](/posts/stat_rolling) computes joint distributions over whole ability arrays: six or seven stats at once, with values dropped or replaced afterward. This is where naive counting hits a wall, and where the interesting optimization lives.

The dice-level outcome space for six stats of 4d6-drop-lowest is $1296^6 \approx 4.74 \times 10^{18}$. Not happening. But the first collapse is free: since the stats are independent, nothing downstream cares *which dice* produced a stat, only what the stat's value is. Each stat reduces to its 16-value pmf $p_s(x)$, computed once from 1,296 dice rolls, and after that the dice never enter the array math again.

Even so, six ordered stats over 16 values gives $16^6 = 16{,}777{,}216$ arrays. Seven stats gives $16^7 = 268{,}435{,}456$. Those arrays are probability-weighted rather than equally likely, but a brute-force implementation would still have to visit every one of them.

## Combinations Beat Permutations

The observation that shrinks the problem: these house rules are **order-blind**. "Drop the lowest stat," "drop the two highest," and "replace the lowest with 18" each sort the array and then slice or replace. Permutations of the same multiset always produce the same final array, so there's no reason to visit them separately.

So the code enumerates *multisets* with `combinations_with_replacement` instead. For $n$ possible stat values and $r$ stats rolled, the count is:

$$C_R(n, r) = \binom{n + r - 1}{r} = \frac{(n + r - 1)!}{r!\,(n - 1)!}$$

For six stats over 16 values that's $\binom{21}{6} = 54{,}264$ multisets instead of 16.8 million ordered arrays, roughly **309× fewer**. For "roll seven stats and drop the lowest," six stats are kept but seven are rolled:

$$16^7 = 268{,}435{,}456 \\;\text{ordered arrays} \quad \longrightarrow \quad \binom{22}{7} = 170{,}544 \\;\text{multisets}$$

That's about **1,574× fewer** iterations, and it doesn't even count the extra merging that happens after the drop.

One catch: combinations are not equally likely, so the probability adjustment matters. If multiset $S$ contains value $v$ exactly $c_v$ times, the number of distinct orderings is the multinomial coefficient:

$$h(S) = \frac{r!}{\prod_v c_v!}$$

and its probability is that ordering count times the product of the independent per-stat probabilities:

$$p_c(S) = h(S)\prod_v p_s(v)^{c_v}$$

For example, $\\{15,15,14,13,12,8\\}$ stands in for $6!/2! = 360$ ordered arrays. The code computes its probability once and multiplies by 360 instead of visiting all 360 arrays. Summing $p_c(S)$ over every multiset gets you back to 1. Leave out $h(S)$ and you'll silently get the wrong distribution.

The implementation does the adjustment while it accumulates:

```python
for stats in combinations_with_replacement(span, z_mod):
    combo_probs[tuple(sorted(f(stats)))] += \
        get_stat_prob(stats, probs) * get_stat_dup(stats)
```

Here `get_stat_dup` computes $h(S)$, `get_stat_prob` computes the product of per-stat probabilities, and `f` applies the drop/replace rule.

"Replace the lowest stat with 18" collapses things one more time. The operation removes one copy of the minimum and inserts an 18:

$$g_{\text{replace}}(Y) = \bigl(Y \setminus \\{\min Y\\}\bigr) \cup \\{18\\}$$

This replaces only one stat, even when several are tied for lowest. It doesn't turn every low stat into an 18. The mapping is many-to-one: $\\{6,9,10,12,14,15\\}$ and $\\{7,9,10,12,14,15\\}$ both become $\\{9,10,12,14,15,18\\}$. Since `combo_probs` is keyed by the modified array, both contributions land in the same bucket. The two optimizations are doing different jobs here: combinations cut down the number of loop iterations, while merging modified arrays cuts down the number of output buckets and the work of aggregating them afterward. Merging doesn't remove the original combination iterations.

The limit of the trick is exactly its premise. If a rule is order-dependent, say "assign stats to abilities in the order rolled," or anything where the first stat means something the sixth doesn't, then a multiset doesn't carry enough information anymore. At that point you need ordered arrays, a different state representation, or simulation. The common unordered stat-generation rules happen to be exactly the cases where combinations shine.

## Takeaways

* Exact enumeration is cheap at character-creation scale, and it buys you the whole distribution. Tails included, no error bars, no seed.
* Simulation is the right tool for mechanics that are easier to sample than enumerate: exploding dice, rerolls, chained conditions. You pay for it with $1/\sqrt{N}$ error, especially in the tails.
* Advantage and disadvantage are a 20 × 20 grid of maxes and mins. Counting L-shaped bands gives you $P(\mathrm{adv} = k) = (2k-1)/400$, and everything else follows.
* Order-blind rules let you enumerate multisets and weight by the multinomial coefficient. That's 268 million ordered seven-stat arrays down to 170,544 buckets.
* Replacement rules collapse further, since different rolls can merge into one final-array bucket.
* The trick ends where order starts to matter. Symmetric rules only.

## Final Word

None of this needed clever randomized algorithms, just a refusal to roll dice when counting would do. What I like about a deterministic tool is that every number on screen is checkable by hand, at least in principle. That 400-cell grid above really is the entire advantage mechanic.

Most of this math is written out in the [project repository](https://github.com/huntermills707/DandDandD_StatRolls) — the theory in [`theory.py`](https://github.com/huntermills707/DandDandD_StatRolls/blob/master/theory.py) and the implementation in [`stats.py`](https://github.com/huntermills707/DandDandD_StatRolls/blob/master/stats.py). Happy rolling, or in this case, happy counting.
