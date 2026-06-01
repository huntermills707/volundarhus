+++ 
date = 2026-05-03T21:46:31-07:00
title = "Introducing smmargins: Stata-Style Margins for Python StatsModels"
draft = false
tags = []
categories = ["open-source", "Statistics"]
summary = "A new Python package bringing Stata's margins command to the StatsModels ecosystem."
+++

> **Archived.** smmargins has been superseded by **pymargins**, a
> ground-up redesign with JAX-native autodiff, a κ curvature diagnostic,
> unified delta/simulation/bootstrap inference, and many more model
> backends. smmargins still works, but new development happens on
> pymargins. See [pymargins: A Ground-Up Redesign of Marginal Effects
> for Python]({{< ref "pymargins_package" >}}).

If you've used Stata's `margins` command and then tried to replicate the same analysis in Python, you know the gap. StatsModels has `get_margeff()`, but it covers a fraction of what `margins` does. I just released **smmargins** to close that gap.

## The Problem

StatsModels' `get_margeff()` gives you marginal effects at the mean or overall—but that's where it stops. Stata's `margins` does far more: adjusted predictions at arbitrary covariate profiles, subgroup average marginal effects, elasticities, difference-in-differences, joint tests, simultaneous confidence intervals, and flexible specification of counterfactual scenarios.

If you're migrating from Stata to Python—or just want that level of rigor without leaving your notebook—you were out of luck. Until now.

## Why Marginal Effects Matter

Model coefficients live in abstract space. A logit coefficient tells you the change in log-odds per unit increase in a predictor. That's useful for fitting, but it's not what stakeholders care about.

Marginal effects translate those coefficients into **natural terms**:

- "A 1-unit increase in income is associated with a 3.2 percentage point decrease in default probability"
- "Treatment A increased outcomes by 1.8 units compared to treatment B, holding other factors constant"
- "The effect of education on earnings varies by gender: 4.2% for men, 5.1% for women"

These are the numbers you put in slides, policy briefs, and executive summaries. smmargins makes it easy to get them right.

## What smmargins Does

smmargins brings Stata-style `margins` functionality to StatsModels' linear models:

- **Adjusted predictions** at specified covariate values
- **Marginal effects** (dydx, dyex, eydx, eyex)
- **Elasticities** with proper chain rule handling
- **Difference-in-differences** estimates on the correct scale
- **Joint Wald tests** and pairwise contrasts with simultaneous confidence intervals

It works with any fitted model that exposes `params`, `cov_params()`, and `predict(params, exog)`.

## Bridging the Gap

Here's what `get_margeff()` doesn't give you that smmargins does:

| Feature | `get_margeff()` | smmargins |
|---|---|---|
| Marginal effects at mean / overall | ✅ | ✅ |
| Subgroup AMEs (`over=`) | ❌ | ✅ |
| Elasticities (eyex, dyex, eydx) | Partial | ✅ |
| Adjusted predictions at covariate grids | ❌ | ✅ |
| Counterfactual specification (`values=`) | ❌ | ✅ |
| Difference-in-differences | ❌ | ✅ |
| Joint Wald tests | ❌ | ✅ |
| Pairwise contrasts | ❌ | ✅ |
| Simultaneous CIs (Bonferroni, Šidák, sup-t) | ❌ | ✅ |
| Robust covariance passthrough (HC0–HC3, cluster, HAC) | Limited | ✅ |

## Inference Options

Choose your variance-covariance estimator:

- **Delta method** (fast, analytic derivatives)
- **Krinsky-Robb simulation**
- **Bootstrap**

Plus robust covariance passthrough: HC0–HC3, cluster-robust, HAC.

### Simultaneous Confidence Intervals

Multiple comparisons? Bonferroni gets conservative fast. smmargins supports:

- Bonferroni
- Šidák correction
- **sup-t** (narrower when contrasts are correlated)

## Counterfactual Specification

Hold variables at specific values without restating every column:

```python
Margins(model, at={'age': 'mean', 'income': [30000, 50000, 70000]}, 
        over='treatment_group')
```

Or pass arbitrary frames for out-of-sample evaluation via `newdata=`.

## Verified Against Established Packages

The test suite checks parity against:

- StatsModels' own `get_margeff()` (at `'overall'` and `'mean'`)
- R's [`marginaleffects`](https://marginaleffects.com/) package

If the output diverges from either, it's a bug.

## Installation


```bash
pip install smmargins
```

Docs are at [smmargins.readthedocs.io](https://smmargins.readthedocs.io/en/latest/), and the code is on [GitHub](https://github.com/huntermills707/smmargins).

## Who Should Use This

- **Economists and social scientists** migrating from Stata to Python
- **Analysts** who need subgroup AMEs, DiD, or joint tests that `get_margeff()` doesn't provide
- **Researchers** publishing with marginal effects who want reproducible Python workflows
- **ML practitioners** who need to communicate model effects in stakeholder-friendly terms
