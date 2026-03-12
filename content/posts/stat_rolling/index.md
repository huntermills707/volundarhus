+++ 
draft = false
date = 2026-03-10T08:22:41-07:00
title = "Beyond the Roll: Deep Dive into Rolling Stat Generation in TTRPGs"
description = ""
slug = ""
authors = ["Hunter Mills"]
tags = []
categories = ["Personal Projects", "TTRPG Mechanics"]
externalLink = ""
series = []
+++

In my previous post, [Dice‑Rolling Probabilities in TTRPGs – Why a Little Math Makes Your Game Feel Fairer](/posts/dice_rolls), I introduced a Dash app that visualizes the probability distributions of common dice rolling methods. We looked at 3d6, 4d6 drop lowest, and the convergence toward Gaussian distributions with larger pools.

Since then, I've expanded the simulator to handle **full stat generation workflows** with **modification rules** like dropping or replacing specific stats.

If you're a Game Master trying to balance a campaign, a player wondering if your "heroic" house rule is actually too generous, or a developer curious about how to implement exact probability calculations without Monte Carlo sampling, this post is for you.


The app is live on [Py.Cafe](https://py.cafe/app/huntermills707/dash-dice-roll-probability) and the source is on [GitHub](https://github.com/huntermills707/DandDandD_StatRolls).

EDIT 3/12: PyCafe service is down. New link on Render.com Hobby Tier Deployment: [here](https://danddandd-statrolls.onrender.com).
Slow performance on this deployment.

---

## New Features: What's Changed?

### 1. Full Stat Generation Pipeline
The app now simulates the complete process of generating a set of ability scores (e.g., the classic 6 stats in D&D).

**What you can do now:**
- **Generate multiple stats at once**: Instead of analyzing a single roll, the app calculates the joint probability distribution of rolling *z* stats (default: 6).
- **Drop/Highest-Lowest Stats**: Apply rules like "drop the lowest stat" or "drop the two highest" *after* generating the full set.
- **Replace Rules**: Replace the lowest stat with a fixed value (e.g., "floor at 8") or the highest with a cap.

**Why it matters:**
Most online calculators stop at the single-roll distribution. But in TTRPGs, you care about the *set* of stats. How likely is it to roll a "god-tier" array (three 16+)? What's the chance of ending up with two stats below 8? The app answers these by enumerating all possible combinations of stats, not just individual rolls.

---

### 2. Custom Die Faces (The "Cheat Die" Engine)
You can now define dice with arbitrary face values. No longer limited to 1–6.

**Examples:**
- **Blessed Die**: `[2, 3, 4, 5, 6, 6]` (no 1s)
- **Cursed Die**: `[1, 1, 2, 3, 4, 5]` (double 1s)
- **Thematic Die**: `[-2, -1, 0, 0, 1, 2]` (for a "zero-based" system)

**TTRPG Implications:**
- **Elite NPCs**: Give a boss monster a "blessed" die pool to ensure they're consistently above average.
- **Conditional Bonuses**: Model effects like "reroll 1s" by replacing 1s with 2s in the face list.
- **Homebrew Systems**: Test mechanics where dice have non-standard distributions (e.g., a d6 that acts like a d8 with missing values).

---

### 3. Advanced Modification Rules
Beyond dropping dice, you can now:
- **Drop Lowest/Highest Stats**: After generating *z* stats, remove the worst (or best) ones.
- **Replace Lowest/Highest**: Swap the lowest stat with a fixed value (e.g., "floor at 10") or the highest with a cap.

**Use Case:**
A "hybrid" system where you roll 4d6 drop lowest for 6 stats, but if any stat is below 8, it's automatically raised to 8. This prevents campaign-breaking weak characters while keeping the randomness.

---

## TTRPG Implications: Balancing the Table

### The "Broken Character" Problem
With standard 4d6 drop lowest, there's still a ~15% chance a character ends up with two stats ≤ 8. In a party of 4, that's a 40% chance someone rolls a "liability." This is great for some groups, but not so great for others.

**How the app helps:**
- Run your generation method and check the **cumulative probability** for stats ≤ 8.
- If it's too high, enable the "Replace Lowest Stat" rule with a floor value.
- Compare the new distribution to see how much variance you've sacrificed for consistency.

### The "Power Creep" Trap
Some groups adopt "heroic" rules like 5d6 drop 2, thinking it just raises the mean. But it also **reduces variance**, making every character feel similarly powerful.

**What the app reveals:**
- The **skewness** and **kurtosis** metrics show how the distribution shape changes.
- A lower kurtosis means fewer outliers (both weak and strong), which can flatten the game's drama.
- Use the app to find a sweet spot: higher mean *without* killing the variance that makes rolling exciting.

This turns narrative flavor into mechanical clarity.

---

## Under the Hood: How the Code Works

Now, let's peek at the implementation. The goal was **exact probability calculation**—no Monte Carlo sampling, no approximations. Every possible outcome is enumerated, and probabilities are computed combinatorially.

### Core Architecture

The app is built with **Dash** (Python) for the UI and **Plotly** for visualization. The heavy lifting happens in three modules:

1. **`stats.py`**: Probability calculations
2. **`modifiers.py`**: Roll/stat modification logic
3. **`moments.py`**: Statistical moments (mean, std dev, skewness, kurtosis)

---

### 1. Enumerating All Rolls (`stats.py`)

The key insight: instead of simulating thousands of rolls, we **enumerate all possible outcomes**.

```python
from itertools import product

def get_rolls(dice, f=sum):
    nobs = 1
    for die in dice:
        nobs *= len(die)
    return nobs, (f(roll) for roll in product(*dice))
```

- `product(*dice)` generates every combination of dice faces.
- `f` is an aggregation function (e.g., `sum`, or a custom function that drops dice).
- `nobs` is the total number of outcomes (e.g., 6⁴ = 1296 for 4d6).

**Why this works:**
For small dice pools (≤10 dice), this is faster and more accurate than sampling. For larger pools, the app warns about computational limits.

---

### 2. Applying Drop/Replace Rules (`modifiers.py`)

The `drop_interval` function handles dropping lowest/highest dice:

```python
def drop_interval(roll, low=0, high=0, agg=sum):
    return agg(sorted(roll)[low:high])
```

- `low`: number of lowest dice to drop
- `high`: index to stop at (effectively dropping highest dice)

For stat-level modifications, `stat_mod` applies rules like "drop lowest stat" or "replace lowest with 10":

```python
def stat_mod(stats, low_drop, high_drop, low_replace, high_replace):
    stats = sorted(stats)
    stats = stats[low_drop:high_drop]
    if low_replace is not None:
        stats = [low_replace] + stats[1:]
    if high_replace is not None:
        stats = stats[:-1] + [high_replace]
    return stats
```

**Key detail:** The function sorts stats first, then slices or replaces. This ensures deterministic behavior.

---

### 3. Combinatorial Enumeration for Stat Sets (`stats.py`)

Generating *z* stats isn't just repeating the roll *z* times. We need the **joint distribution** of all stats.

The app uses `combinations_with_replacement` to efficiently enumerate stat sets:

```python
from itertools import combinations_with_replacement

for stats in combinations_with_replacement(span, z_mod):
    # Calculate probability of this stat set
    # Adjust for permutations (since order doesn't matter for the set)
```

- `span`: All possible stat values (e.g., 3–18 for 3d6)
- `z_mod`: Number of stats rolled (including extras for drops)

**Why combinations?**
Brute-forcing all ordered tuples (e.g., 16⁶ = 16M for 6 stats with 16 values) is slow. Combinations with replacement reduces this to ~54k for the same case.

**Probability adjustment:**
Each combination's probability is weighted by the number of permutations it represents:

```python
dup = factorial(len(stats)) / ∏ factorial(count_of_each_value)
```

This ensures the final distribution sums to 1.

---

### 4. Visualizing the Results (`plots.py`)

The app generates two plots:
1. **Probability Mass Function (PMF)**: Probability of each outcome.
2. **Cumulative Distribution Function (CDF)**: Probability of rolling ≤ X.

It also overlays **statistical moments**:
- Mean
- Standard Deviation
- Skewness
- Kurtosis

```python
mean, std, skew, kurt = calculate_moments(probs)
```

These metrics help you quickly assess the distribution's shape without staring at graphs.

---

## Performance & Limitations

### Computational Complexity
- **Time**: Scales with the product of dice sides (e.g., 6⁴ = 1296, 6¹⁰ = 60M).
- **Memory**: Stores all outcomes in memory for exact calculations.

### Future Improvements
- **Caching**: For app speedup with continued use.
- **Enhance Visualizations**: Allow multiple configurations to be plotted simultaenously.
- **Export**: Save distributions as CSV for further analysis.

---

## Try It Yourself

**What to test:**
1. **4d6 drop lowest** vs. **5d6 drop 2**: Which gives a better balance of mean and variance?
2. **Custom die**: Replace 1s with 2s on one die. How much does the mean shift?
3. **Stat floor**: Enable "Replace Lowest Stat = 8". What's the new probability of rolling a stat ≤ 8?

---

## Final Thoughts

Dice aren't just randomizers—they're **design tools**. By quantifying the impact of every house rule, you can:
- Prevent campaign-breaking imbalances
- Tailor character power to your campaign's tone
- Turn narrative flavor into mechanical clarity

Happy rolling, and may your distributions be ever in your favor.
