---
title: "Marginal Effects for StatsModels: A Stata-style `margins` in Python"
date: 2026-04-22
draft: false
tags: []
categories: ["statistics"]
math: true
description: "A technical post presenting a Python module that brings Stata-style marginal effects to StatsModels. Using a unified delta-method framework with numerical Jacobians, the module computes average and representative-value predictions, marginal effects, and discrete contrasts for any GLM-family model. It leverages patsy to handle polynomials, interactions, and splines correctly, and includes a difference-in-differences helper for nonlinear models. The whole implementation fits in roughly 500 lines."
---

> **Archived.** The module described here grew into the **smmargins**
> package, which has since been superseded by **pymargins** — a
> ground-up redesign with JAX-native autodiff, a κ curvature diagnostic,
> unified delta/simulation/bootstrap inference, and many more model
> backends. The write-up below is kept for the math and design notes,
> but new development happens on pymargins. See [pymargins: A Ground-Up
> Redesign of Marginal Effects for Python]({{< ref "pymargins_package" >}}).

If you've ever moved from Stata to Python and reached for `margins, dydx(*) at(age=(25 45 65))`, you know the feeling. StatsModels has `get_margeff`, but it's narrow: average or at-means, continuous variables, a couple of model classes. The moment you want a marginal effect *at a specific covariate profile*, or a discrete change for a factor, or a difference-in-differences on the probability scale of a logit, you're on your own.

So I wrote a small module — [`marginal_effects.py`](#) — that fills in the gap. This post is a tour of what it does, the math that makes it work, and the design decisions that kept it small.

## What marginal effects actually are

For a fitted model with parameters $\hat\beta$ and a conditional mean $E[Y \mid X] = f(X\beta)$, a **marginal effect** is the partial derivative of that conditional mean with respect to a covariate, possibly evaluated somewhere specific. An **adjusted prediction** is the conditional mean itself, again evaluated somewhere specific.

Richard Williams' [Margins01 notes](https://academicweb.nd.edu/~rwilliam/stats/Margins01.pdf) lay out the useful catalogue, and they all fit a single schema — statistics of $\beta$ that happen to also depend on the data:

| Statistic | What it is | $g(\beta)$ |
|---|---|---|
| **AAP** | Average Adjusted Prediction | $\frac{1}{n}\sum_i f(x_i^\top\beta)$ |
| **APM** | Adjusted Prediction at Means | $f(\bar x^\top\beta)$ |
| **APR** | Adjusted Prediction at Representative values | $\frac{1}{n}\sum_i f(x_i^\top\beta)$ with some $x$ fixed |
| **AME** | Average Marginal Effect | $\frac{1}{n}\sum_i \partial f(x_i^\top\beta)/\partial x_j$ |
| **MEM** | Marginal Effect at Means | $\partial f(\bar x^\top\beta)/\partial x_j$ |
| **MER** | Marginal Effect at Representative values | AME with some $x$ fixed |
| Contrast | Discrete change | $E[f \mid x_j=\text{level}] - E[f \mid x_j=\text{ref}]$ |

Seven names, one unifying form. Every one of these is $g(\beta)$ for some $g$ — which turns out to be the whole game.

## The delta method, and why it's enough

Given that unifying form, standard errors are cheap. If $\hat\beta$ has estimated covariance $\widehat V$, then for any smooth vector-valued $g$,

$$
\widehat{\mathrm{Var}}\bigl[g(\hat\beta)\bigr] \;\approx\; G\,\widehat V\,G^\top, \qquad G = \left.\frac{\partial g}{\partial \beta}\right|_{\hat\beta}.
$$

This is [exactly what Stata's `margins` does](https://www.stata.com/support/faqs/statistics/compute-standard-errors-with-margins/). The only thing that changes between AAP, AME, MER, and the rest is *which $g$ you're plugging in*. Everything downstream — point estimate, SE, Wald z, CI, p-value — is the same linear algebra.

So the module has one worker:

```python
def _delta(self, statistic, labels, stat_name):
    beta = self.params
    est = statistic(beta)
    J = _central_jacobian(statistic, beta)   # <- G in the math above
    V = J @ self.cov @ J.T                   # <- delta method
    return MarginsResult(est, V, labels, ...)
```

…and every public method's job is to *construct the right `statistic` closure*. AAP builds one that averages `model.predict(beta, X)` over the sample. MER builds one that averages it after fixing `age=45`. AME builds one that numerically differentiates that prediction with respect to a column. They're one-liners, and they all route through the same delta-method machinery.

Computing $G$ analytically for every link × statistic × data configuration would be a nightmare. Instead we use **central finite differences** on the closure:

$$
\frac{\partial g}{\partial \beta_k} \approx \frac{g(\beta + h_k e_k) - g(\beta - h_k e_k)}{2 h_k}.
$$

For the step size we use $h_k = \epsilon^{1/3}\cdot\max(|\beta_k|, 1)$, where $\epsilon$ is machine precision. That's the textbook trade-off between truncation error ($O(h^2)$) and rounding error ($O(\epsilon/h)$) for central differences, and in practice it recovers analytic SEs to 5–6 decimal places. No autodiff dependency, no fragile hand derivations — just numerics, and tests to keep us honest.

## Why patsy is the right abstraction

Here's the subtle bit that makes everything else work. Suppose the formula is

```
y ~ x1 + I(x1**2) + x1:x2 + C(group)
```

and we want the marginal effect of `x1`. The column `x1` appears in **three** columns of the design matrix: itself, its square, and the interaction. You cannot just nudge "the `x1` column" of $X$ — a change in `x1` has to propagate to $x_1^2$ and $x_1 x_2$ too, and the chain rule has to line up.

What we *can* nudge is `x1` in the **original data frame**, and then ask patsy to rebuild the design matrix using the stored `DesignInfo`:

```python
patsy.dmatrix(self.design_info, perturbed_frame, return_type="matrix")
```

That single call does all the bookkeeping for us. Polynomials, interactions, `C(...)` categorical contrasts, `bs(x, df=4)` splines — they all rebuild correctly, because patsy knows the formula. It's also the right abstraction for "hold `age=45`" or "set `group='b'`": you mutate the data frame, not the design matrix.

This is why the whole module fits in one file. The moment you try to manipulate design matrices directly, you end up rewriting patsy, and you get it wrong for splines.

## Genericity through `model.predict`

The other load-bearing idea is that we never hardcode a link function. Every computation goes through

```python
self.model.predict(params, exog)
```

StatsModels' `predict` already applies the inverse link for GLMs, respects offsets and exposures, and handles whatever model-specific wrinkles exist. So the same code works for OLS, Logit, Probit, Poisson, Negative Binomial, GLM with any family, GEE, mixed effects — anything that exposes `params`, `cov_params()`, and a usable `predict(params, exog)`.

Response scale is the default, which matches Stata and is almost always what people actually want. For a logit, `dydx("x1")` gives you $\partial \hat p / \partial x_1$, not $\partial \hat\eta / \partial x_1$. A log-odds derivative is rarely the question anyone is actually asking.

## The API, briefly

The surface is small on purpose:

```python
from marginal_effects import Margins

M = Margins(fit)

# Adjusted predictions
M.predict()                                    # AAP
M.predict(atmeans=True)                        # APM
M.predict(at={"x1": [0, 1, 2]})                # APR
M.predict(at={"x1": [0, 1, 2]}, atmeans=True)  # APR, others at means

# Marginal effects
M.dydx("x1")                                   # AME (continuous auto-detected)
M.dydx("x1", atmeans=True)                     # MEM
M.dydx("x1", at={"x2": [0, 1]})                # MER
M.dydx("group")                                # discrete contrasts vs reference
M.dydx("group", reference="b")                 # discrete contrasts vs "b"
```

Each call returns a `MarginsResult` with `.estimate`, `.se`, `.vcov`, `.ci_lower`, `.ci_upper`, `.pvalue`, and a `.summary()` DataFrame. Pass `use_t=True` to `Margins(...)` to get t-distribution inference using `results.df_resid`.

Continuous vs. discrete is auto-detected from dtype and cardinality — booleans, strings, and numerics with ≤ 2 unique values are treated as discrete; everything else gets a numerical derivative. You can override with `discrete=True/False` when the heuristic guesses wrong.

## One design choice worth flagging: `atmeans`

Stata's `atmeans` averages the **design matrix**, which means a factor variable gets held at its sample proportion. A "person" who is 0.33 female. My `atmeans` averages the **data frame**, which means numeric columns get the column mean and categoricals get the modal level. A "person" who is male (if that's the mode).

These give different numbers. Williams himself points out that atmeans-on-dummies is usually a worse choice than AME — the "average person" on a design matrix is literally a fractional entity — so I sided with him by default. If you want Stata's behavior exactly, encode your factors as numeric dummies before fitting. The test suite verifies that this recipe matches `statsmodels.get_margeff(at='mean')` to machine precision.

## Extending to difference-in-differences

Once you have the delta-method machinery, DiD falls out of it almost for free — and it solves a problem that's genuinely hard to do by hand on nonlinear models.

The problem, due to [Ai & Norton (2003)](https://www.sciencedirect.com/science/article/abs/pii/S0165176503000326): in a logit, the coefficient on the `group × condition` interaction is on the **log-odds** scale. On the **probability** scale — which is what the clinical or policy question is actually about — the DiD is a nonlinear function of *every* parameter and *every* covariate profile. You can't read it off the interaction coefficient. You have to compute all four cells on the response scale and difference them, and you need a correctly propagated SE.

That's what `Margins.did(...)` does:

```python
res = M.did(
    "group", "preexist_Y",
    group_levels=["A", "B"], condition_levels=[0, 1],
    at={"age": 60, "female": 0},   # optional: fix other covariates
)
print(res)                    # cells + simple effects + DiD in one table
res.did.estimate              # the DiD point estimate
res.did.ci_lower              # lower 95% CI
res.cells.vcov                # 4×4 joint covariance of cell predictions
```

Under the hood, `did()` builds the 2×2 grid of adjusted predictions (so all four cells share a single delta-method Jacobian against $\beta$, which gives you their full 4×4 joint covariance), then applies three linear contrasts: the two simple effects and the DiD. Because we already have the cells' joint covariance, the three contrasts are exact under the same approximation — no extra differentiation needed. That's the role of `MarginsResult.contrast`:

```python
# Same DiD, via the contrast API
cells = M.predict(at={"treat": [0, 1], "post": [0, 1]})
did = cells.contrast([1, -1, -1, 1], labels=["DiD"])
```

The two paths give identical numbers to the last decimal place, which is a nice sanity check that falls out of the algebra.

## Closing thoughts

The fun of building this was realizing how much of it was already sitting in StatsModels and patsy, waiting to be composed:

- `model.predict(params, exog)` gives you every link function, offset, and exposure for free.
- `patsy.DesignInfo` gives you the chain rule for interactions, polynomials, splines, and factors for free.
- `results.cov_params()` gives you $\widehat V$.
- Central differences give you $G$.

The module is essentially just glue between those four pieces, plus a bit of labeling and a `contrast()` helper that turns out to be the cleanest way to express DiD. The whole thing fits in ~500 lines and handles any GLM-ish model you throw at it.

If you find yourself typing `logit.get_margeff(at='overall')` and wishing it did more, give it a try. And if you find a case it gets wrong, please open an issue — the tests are the module's conscience, and they can always be more.
