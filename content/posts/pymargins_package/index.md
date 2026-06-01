---
title: "pymargins: A Ground-Up Redesign of Marginal Effects for Python"
date: 2026-05-31
draft: false
tags: []
categories: ["open-source", "statistics"]
math: true
description: "pymargins is a from-scratch redesign of my earlier smmargins package: expert-mode marginal effects for Python — adjusted predictions, slopes, contrasts, and difference-in-differences — built around a session that pre-commits to its inference posture, JAX-native autodiff for exact gradients and Hessians, a κ curvature diagnostic that knows when the delta method is unsafe, and auto-detected adapters spanning statsmodels, linearmodels, lifelines, and scikit-learn."
---

A while back I wrote about [marginal effects for StatsModels]({{< ref "smmargins" >}})
and then [released that work as **smmargins**]({{< ref "smmargins_package" >}}),
a package that brought Stata-style `margins` to the StatsModels
ecosystem. This post is about its successor, **pymargins** — which is
not a new version of smmargins but a complete, ground-up redesign.

```bash
pip install pymargins
```

## Where this came from

smmargins started as research code. I was doing population-study work
at UCSF, and the recurring need was to turn fitted models into
quantities people could actually act on: a risk difference in
percentage points, an adjusted prediction at a representative patient
profile, a subgroup average marginal effect. StatsModels'
`get_margeff()` covered a sliver of that, so I kept accreting helpers
until the helpers were the size of a package. smmargins was me carving
the useful parts out of that research code and giving them a public
API.

It worked, and people use it. But the moment I tried to push past the
original feature set — more model families, simulation and bootstrap
inference, survey designs, joint tests across calls — the design
started to fight me. The research code had grown organically around
one set of assumptions (a single model class, the delta method, a
patsy design matrix), and every new feature meant threading state
through functions that were never meant to carry it. Each addition
made the next one harder. It got chaotic, and I could feel that I was
spending more effort working around the architecture than building on
it.

That's the honest reason pymargins exists. Rather than keep bolting
features onto a foundation that wasn't built for them, I sat down and
asked what the foundation *should* be if I'd known from the start
everything I wanted it to do. pymargins is the answer to that
question.

## The core idea: a session is a methodological commitment

The single biggest design change is that a `Margins` object is a
**session**. When you construct one, it commits — up front, in the
constructor — to:

- the **inference scale** (linear, log, logit, correlation, …),
- the **variance estimator** (`vcov`: HC0–HC3, cluster, HAC, …),
- the **confidence level**,
- the **default evaluation point**, and
- the **inference method** (delta, simulation, bootstrap).

Every computation you run on that session inherits those commitments.
Want a different posture? You open a new session.

```python
import statsmodels.formula.api as smf
import statsmodels.api as sm
from pymargins import Margins

fit = smf.glm(
    "diabetes ~ treatment + bmi + age + sex",
    data=df,
    family=sm.families.Binomial(),
).fit()

# Open a session: log-scale analysis, HC3 SEs, 95% intervals.
m = Margins.log_scale(fit, vcov="HC3", level=0.95)

m.dydx("bmi")                              # AME: ΔP(diabetes) per unit BMI
m.predict(atexog={"bmi": [25, 30, 35]})    # adjusted P at profiles
m.contrasts(                               # treated-vs-control risk difference
    scenarios=[
        {"atexog": {"treatment": 1}, "label": "treated"},
        {"atexog": {"treatment": 0}, "label": "control"},
    ],
    contrasts=[+1, -1],
)
```

This sounds like a small ergonomics tweak, but it's the thing that
unfit smmargins for growth. In the old design, every method took its
own `vcov`, its own `at`, its own everything — which meant the
methodological posture of an analysis was scattered across a dozen
call sites, and nothing stopped two calls from silently disagreeing
about how standard errors were computed. In pymargins, a reviewer sees
the *entire* methodological posture in one constructor call, and a
change of posture shows up as a new session in the audit trail.

It also has teeth under the hood. A session commits not just to the
*parameters* of inference but to the **random objects** that implement
them. The parameter covariance $\hat\Sigma$ is resolved once and
frozen onto every result. Bootstrap resample indices are drawn once
and reused. Simulation $\beta^*$ draws are generated once and shared.
So two bootstrap calls on the same session evaluate their estimands on
the *exact same* sequence of refitted models — which is what makes
joint inference across calls (a contrast between a result from one
call and a result from another) actually valid. Mutating an input that
already fed one of these caches raises rather than silently changing
your answers.

## JAX-native gradients instead of finite differences

smmargins computed its delta-method standard errors with central
finite differences on a closure — perturb $\beta$ in each coordinate,
re-evaluate, divide. That's robust and easy to reason about, and it
was the right call for a ~500-line module. But it's $O(p)$
re-evaluations per gradient, it carries step-size error, and it gives
you no clean path to second-order information.

pymargins is **JAX-native**. Gradients and Hessians of every estimand
are exact autodiff, not differences. That's faster, has no step-size
knob to get wrong, and — crucially — it hands you the Hessian for
free, which is what enables the next piece.

## Knowing when the delta method lies: the κ diagnostic

The delta method is a first-order Taylor approximation,

$$
\widehat{\mathrm{Var}}\bigl[h(\hat\beta)\bigr]
  \;\approx\; g^\top \widehat V\, g, \qquad
  g = \left.\frac{\partial h}{\partial\beta}\right|_{\hat\beta}.
$$

It's exact for linear estimands and excellent for mildly nonlinear
ones. But for a strongly curved estimand — a relative risk, a ratio,
a prediction far out on a logistic curve — that linearization can be
badly wrong, and nothing in the delta-method output tells you so. You
get a tidy symmetric interval that happens to be a lie.

pymargins ships a **κ (kappa) curvature diagnostic** that measures
exactly this. For an estimand $h(\beta)$ with gradient $g$ and Hessian
$H$, and $L L^\top = \widehat V$ the Cholesky factor of the parameter
covariance, it forms the *whitened* gradient and Hessian
$\tilde g = L^\top g$, $\tilde H = L^\top H L$ and computes Skovgaard's
relative curvature

$$
\kappa = \frac{\lVert \tilde H \rVert}{\lVert \tilde g \rVert^2}.
$$

The whitening is what makes κ meaningful — it's invariant to affine
reparameterization, so it measures curvature *in the metric the
sampling distribution actually lives in* rather than in whatever units
you happened to write the model in. When κ crosses a calibrated
threshold, the session can warn you, or automatically fall back to
simulation, where no linearization is assumed:

```python
print(m.diagnose().summary())   # pre-flight: is the delta method safe here?
```

This is the feature I most wanted in smmargins and most couldn't
retrofit. It needs the Hessian (so it needs the autodiff backend) and
it needs a clean fallback to simulation (so it needs the unified
inference layer) — neither of which the old architecture had a place
for.

## Three inference methods, one interface

Because the session abstracts the inference distribution, all three
methods are interchangeable behind the same calls:

- **Delta method** — JAX-exact gradients and Hessians.
- **Krinsky–Robb simulation** — parametric Monte Carlo on the
  coefficient distribution; the safe harbor when κ is large.
- **Bootstrap** — nonparametric, plus cluster and block variants,
  parallelizable, with percentile / BCa / normal intervals.

Simultaneous confidence intervals (Bonferroni, Šidák, sup-t),
multiple-comparison adjustment, elasticities, jackknife influence
diagnostics, and — new in 0.2 — complex **survey designs** with
Taylor-linearization standard errors that match R's
`survey::svyglm` all sit on top of this one layer.

## Many more model backends

smmargins targeted StatsModels' linear models. pymargins detects the
backend from the fitted object and ships adapters for a much wider
field:

- **statsmodels** — OLS/WLS/GLS, GLM, discrete
  (Logit/Probit/Poisson/NegBin/zero-inflated), MNLogit, ordered, GEE,
  MixedLM, RLM, QuantReg, PHReg
- **linearmodels** — IV/2SLS, panel fixed/random effects, absorbing
  regression, Fama–MacBeth
- **lifelines** — CoxPH, time-varying Cox, Weibull/LogNormal/LogLogistic
  AFT, generalized gamma, piecewise exponential, cubic-spline survival,
  with survival-curve estimands
- **scikit-learn** — any estimator, via bootstrap inference
- **custom** — register your own with `register_adapter`

The estimand vocabulary stays the same across all of them:
`predict` (adjusted predictions), `dydx` (slopes), and
`contrasts` / `evaluate` (differences and arbitrary differentiable
combinations). Picking *whose* effect — the sample average (AME), a
typical unit (MEM), or a representative profile (MER) — is a separate,
orthogonal axis.

## smmargins vs. pymargins

| | smmargins | pymargins |
|---|---|---|
| Origin | research code, carved into a package | clean redesign |
| Core object | function calls | a **session** that pre-commits its posture |
| Differentiation | finite differences | JAX autodiff (exact gradients + Hessians) |
| Curvature check | — | **κ diagnostic** + auto-fallback to simulation |
| Inference | delta (+ some sim/bootstrap) | delta / Krinsky–Robb / bootstrap, unified |
| Model backends | statsmodels linear models | statsmodels, linearmodels, lifelines, sklearn, custom |
| Survey designs | — | Taylor-linearization SEs (matches `svyglm`) |

## Should you switch?

If smmargins covers what you need today, it still works and I'm not
yanking it. But pymargins is where the design can actually carry the
features I kept wanting to add — so it's where new work goes.

Reach for it when the model is nonlinear, when effects are conditional
on interactions or splines, when your audience needs outcome units
instead of log-odds, when heterogeneity across subgroups *is* the
question, or when the answer is a counterfactual contrast. And reach
for it specifically when you care that the standard error is *right* —
the κ diagnostic exists precisely because a confident-looking interval
from a curved estimand is the easiest way to be wrong.

pymargins is **alpha**; APIs may still shift before 1.0. Docs,
per-backend tutorials, and the theory write-ups are at
[pymargins.readthedocs.io](https://pymargins.readthedocs.io), and the
code is on [GitHub](https://github.com/huntermills707/pymargins).
Bug reports and feedback welcome.
