+++
draft = false
date = 2026-11-19T22:24:18-08:00
title = "Matching Monsters Across Editions: Building a Dataset from Messy PDFs"
description = "The first post in a series on D&D monster modeling tools. Before fitting conversion rules, I had to extract stat blocks from two very different Monster Manual PDFs and decide which creatures belonged together. This post covers geometry-aware PDF parsing, OCR repairs, name matching, non-numeric metadata, and the evaluation checks that keep bad pairs out of the training data."
slug = ""
authors = ["Hunter Mills"]
tags = []
categories = ["Personal Projects", "TTRPG Mechanics"]
externalLink = ""
series = ["D&D Monster Modeling"]
+++

## Introduction

In my earlier posts on [dice-rolling probabilities](/posts/dice_rolls) and [stat generation](/posts/stat_rolling), the data was the easy part: define some dice, enumerate the outcomes, compute the distribution. Converting monsters between D&D editions starts with a less glamorous problem. Before I could model anything, I had to answer two questions:

1. Can I reliably turn two Monster Manual PDFs into structured stat blocks?
2. Which stat blocks actually describe the same creature?

Those two questions became a project of their own. The eventual converter trains on 154 cross-edition pairs, but every pair sits at the end of a pipeline involving page geometry, OCR repair, parsers, aliases, metadata, and a final name-similarity check:

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
    A["4e Monster Manual<br/>text-layer PDF"] --> B["Split columns,<br/>cluster lines"]
    B --> C["479 complete<br/>stat blocks"]
    D["5e Monster Manual<br/>OCR scan"] --> E["Parse + repair names<br/>from the index"]
    E --> F["376 reliable<br/>stat blocks"]
    C --> G["Common schema<br/>stats + non-numeric metadata"]
    F --> G
    G --> H{"Names match?<br/>exact / alias / OCR"}
    H -->|Yes| I["Same-creature pairs<br/>87"]
    H -->|No| J["Metadata model<br/>proposes top 5"]
    J --> K{"Name similarity<br/>clears threshold?"}
    K -->|Yes| L["Related pairs<br/>67, half weight"]
    K -->|No| M["Rejected"]
    I --> N["154 training pairs<br/>grouped CV folds"]
    L --> N
{{< /mermaid >}}

{{< app_demo site="pycafe" url="https://py.cafe/app/huntermills707/dnd-monster-stat-converter" description="Convert monsters between 4e and 5e on Py.Cafe" >}}

This post is about the dataset behind that app. The conversion equations come in the next post.

## Why Not Just Match the Names?

For plenty of monsters, matching names works exactly as you'd expect. Same name in both books, and you very likely have the same creature.

The exceptions pile up quickly, though:

* OCR can split or garble a name in the 5e scan.
* A 4e name may include an alternate name in parentheses.
* Terminology changed: 4e's **Elder** dragons are 5e's **Ancient** dragons.
* Some 4e variants correspond to a broader 5e creature rather than an identically named counterpart.
* Similar names don't guarantee a useful match, either. Dragon ages, for example, have to agree.

There's also a statistical trap here. I want to learn how numeric stats change between editions, so I can't use those same numeric stats to choose the training pairs. Otherwise, pair selection could quietly favor exactly the relationships the later regression is supposed to discover. Matching therefore relies on names and non-numeric metadata, never HP, AC, attack bonuses, or damage.

## Step 1: Rebuild the Page Before Parsing It

The 4e PDF already contains text, but ordinary text extraction doesn't always respect visual reading order. When a stat block crosses a column or page boundary, its name drifts away from its body, and block-level extraction can merge most of a busy page into a single line.

The fix was to stop treating the page as a stream of text and start treating it as positioned words. `parsers/extract_text.py` splits words into left and right columns, clusters them into lines by vertical position, and emits one column at a time:

```python
mid = page.rect.width / 2
words = page.get_text("words")
columns = ([], [])
for w in words:
    columns[(w[0] + w[2]) / 2 >= mid].append(w)

for col in columns:
    col.sort(key=lambda w: (w[1], w[0]))
    # Group nearby y-coordinates into visual lines.
```

That small change in representation fixed most of the page and column scrambling. The resulting 4e parser recovers **479 complete stat blocks**. Where headers were lost, they're reconstructed from the book's level appendix and other internal evidence; nine orphan bodies remain unidentified.

The 5e book had a different problem: my source was an OCR scan. Its parser recovers 381 blocks, then drops five scrambled ones after cross-checking, leaving **376 reliable blocks**. A separate three-column index parser helps recover lost names and repair OCR-garbled ones using entries from the same printed page.

| Stage | Result |
|:---|---:|
| Complete 4e stat blocks | 479 |
| Reliable 5e stat blocks | 376 |
| Final cross-edition training pairs | 154 |
| Same-creature pairs | 87 |
| Related variants or analogues | 67 |

A conversion model is only as trustworthy as the stat blocks underneath it. A beautifully fitted equation trained on a merged stat block is still learning from a bad stat block.

## Step 2: Parse Each Edition on Its Own Terms

The two editions don't present monsters in the same format, so each gets its own parser. Both feed a common schema containing fields like level or CR, HP, AC, attacks, damage, abilities, defenses, and saving throws.

The parsers also retain non-numeric information for matching: creature type, alignment, languages, senses, movement, skills, power names, damage types, lore, and other descriptive text. That information stays local; the published surrogate dataset contains numeric stats with opaque IDs rather than monster names or descriptive rule-book text.

Not every parsing failure deserves its own special case, either. When a source block is genuinely ambiguous, a small manual override is usually safer than a new rule that might silently break ten other blocks. Corrections are tracked separately, and patched records are flagged for review.

The design rule I settled on: **automate the pattern, override the exception, and make both visible.**

## Step 3: Separate Same Creatures from Relatives

The matcher has two paths.

### Approximately exact names

The first path handles same-creature matches:

* **Exact:** normalized names agree, including OCR word splits and Elder/Ancient dragon terminology.
* **Alias:** a parenthetical alternate name agrees.
* **OCR:** the spellings are nearly identical after spaces are removed.

These become same-creature pairs.

### Related creatures

Everything else goes to a metadata model that proposes its five best candidates. A candidate is accepted only if its name similarity also clears a threshold. That catches relationships like a named 4e variant corresponding to a broader 5e base creature, while preventing the metadata model from freely pairing unrelated monsters.

The name score is IDF-weighted fuzzy ROUGE-1 recall. In plain language: how much of the 5e name appears in the 4e name, with rare words counting for more. It fits cases where 4e adds descriptors to a base name, and it helps separate similarly named dragons whose important words differ.

Related pairs are useful, but they aren't interchangeable with exact counterparts, so they carry half weight when the conversion models are fit.

## Under the Hood: What the Metadata Model Sees

The candidate ranker is a logistic regression over structured agreement, TF-IDF features from masked block text, and sentence embeddings of a name-free creature profile, trained on exact-name pairs.

Its job isn't to declare a match by itself. It just needs to put plausible candidates near the top so the independent name check can accept or reject them.

That distinction shows up in the evaluation. On 85 same-name pairs in a name-blind retrieval test, the correct counterpart ranked first 41% of the time and appeared in the top ten 72% of the time, with a median rank of three. Not good enough for autonomous matching, but plenty good for candidate generation.

The final acceptance rule was checked separately on hand-labeled candidates. Among 79 4e monsters with a correct candidate available, taking the top five and applying the name threshold gave **98% precision and 82% recall**. Taking only the model's single favorite candidate dropped recall to roughly 40%, usually because a sibling outranked the base creature.

The lesson I keep from this part: a mediocre standalone classifier can still be a good component when its role is narrow and another feature gates its output.

## What This Means for the Conversion Model

The final default dataset has 154 pairs, covering 154 unique 4e monsters and 104 unique 5e monsters. Some creatures have several cross-edition partners, so evaluation keeps all pairs involving the same monster in one fold. Otherwise, a close relative in the training set can make a held-out prediction look better than it really is.

The matching work also tells me what the later converter should and shouldn't claim:

* A same-creature pair and a related analogue provide different kinds of evidence.
* More pairs aren't automatically better if the matches are dubious.
* Parser errors can look like modeling discoveries until someone goes back to the source.
* The numbers can describe general design patterns without capturing everything that makes a particular monster distinctive.

## Takeaways for Modeling TTRPG Data

* Fix reading order before writing more parser rules. Page geometry was the real problem in many 4e extraction failures.
* Don't leak the outcome into dataset construction. Numeric monster stats play no role in choosing conversion pairs.
* Separate candidate generation from acceptance. Metadata proposes; name evidence decides.
* Keep same creatures and relatives distinct. Related pairs add coverage, at lower weight.
* Prefer visible manual corrections to invisible parser cleverness, especially when the exception is genuinely exceptional.

## Final Word

The converter's visible output is a collection of numbers. Most of the work, though, went into deciding what those numbers should be learned from.

In the next post, I'll turn these matched stat blocks into short conversion formulas a GM can use by hand, and look at where those formulas work well, where they struggle, and why the app reports a range instead of pretending there's one correct answer.

The source is available [on GitHub](https://github.com/huntermills707/DandDandD_4e-5e-MonsterConverter). The published data is a numeric surrogate; source PDFs, extracted rule-book text, and parsed descriptive stat blocks remain local.
