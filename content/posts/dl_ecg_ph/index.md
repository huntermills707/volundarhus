+++ 
draft = false
date = 2023-01-24T10:29:22-08:00
title = "Electrocardiogram Detection of Pulmonary Hypertension Using Deep Learning"
description = "This post summarizes a deep-learning study that detects pulmonary hypertension from standard 12-lead ECGs with AUC approximately 0.89. Trained on 24,470 UCSF patients, a one-dimensional ResNet flags PH up to two years before conventional diagnosis and discriminates subtypes including pre-capillary and WHO Group 1 disease. Even a single lead retained useful performance, opening the door to wearable screening. The authors discuss implications for primary care triage, resource-limited settings, and continuous remote monitoring."
slug = ""
authors = ["Hunter Mills"]
tags = []
categories = ["Publication Summary"]
externalLink = ""
series = []
+++
[Publication Link](https://pmc.ncbi.nlm.nih.gov/articles/PMC10363571/)

## Why this matters

Pulmonary hypertension (PH) is a deadly disease that often goes undiagnosed for years. The gold‑standard right‑heart catheterization (RHC) is invasive, expensive, and not routinely performed. Even echocardiography—currently the most common screening tool—requires skilled operators and still misses a substantial fraction of cases. Meanwhile, the 12‑lead electrocardiogram (ECG) is cheap, ubiquitous, and captured in virtually every outpatient visit, yet clinicians have never trusted it alone to flag PH.

Our recent study shows that a single‑lead deep‑learning model can turn that ordinary ECG into a powerful PH screener—detecting not only overt disease but also clinically important subtypes, and doing so up to two years before conventional diagnosis.

## How we built the model

* **Cohort:** 24,470 adult patients from UCSF (2012‑2019) who had an ECG within 90 days of either an RHC or an echocardiogram. 5,016 were PH positive, 19,454 controls.
* **Labeling:** PH defined as mean pulmonary arterial pressure 20mmHg (RHC) or tricuspid regurgitation velocity 3.4m/s (echo). 
	* **Sub‑labels:** pre‑capillary PH, WHO Group 1 (PAH), WHO Group 3 (lung disease).
* **Data preparation:** Raw 12‑lead ECG voltage matrices (2,500 × 12 samples) were down‑sampled as needed. One ECG per patient was retained.
* **Network:** One‑dimensional ResNet (15 conv layers, batch‑norm, ReLU, residual connections). Final sigmoid output gives a probability of PH.
* **Training / validation split:** 70% training, 10% development, 20% test (7:1:2 ratio). Hyper‑parameters tuned via grid search.
* **Explainability:** Linear Model‑Agnostic Explanations (LIME) highlighted voltage regions the network relied on (e.g., tall R‑wave in V1, right‑axis deviation).

## Performance at a glance

|Metric|PH at 20% prevalence|PH at 1% prevalence*|Pre‑capillary PH|WHO Group 1 | (PAH)_WHO Group 3|
|:---|:---|:---|:---|:---|:---|
AUC|0.89 (0.88‑0.90)|0.88 (0.83‑0.93)|0.91 (0.89‑0.94)|0.94 (0.92‑0.96)|0.90 (0.89‑0.91)|
Sensitivity|0.79 (0.76‑0.81)|0.79 (0.68‑0.90)|0.83 (0.78‑0.88)|0.88 (0.83‑0.93)|0.81 (0.77‑0.84)|
Specificity|0.84 (0.83‑0.85)|0.84 (0.83‑0.85)|0.84 (0.83‑0.88)|0.84 (0.83‑0.85)|0.84 (0.83‑0.85)|
PPV|0.56 (0.53-0.58)|0.05 (0.03-0.06)|0.17 (.14-0.19)|0.15  (0.12-0.17)|0.31 (0.29-0.34)|
NPV|0.94 (0.93-0.95)|1.00 (1.00-1.00)|0.99 (0.99-0.99)|1.00 (0.99-1.00)|0.98 (0.98-0.98)|

Simulated dataset reflecting the true population prevalence of PH (~1%).

#### Key take‑aways

* The model retains high discrimination even when disease prevalence drops dramatically—NPV stays near 1.0, meaning a negative screen reliably rules out PH.
* Subtype detection is comparable to the overall model, confirming that the network learns physiologic signals beyond generic right‑heart strain.
* Using only two leads (I + V2) or a single lead (V2) reduces AUC modestly (≈0.83‑0.84) but still yields clinically useful performance—opening the door for wearable or remote monitors.


## Early detection—up to two years ahead
When we applied the trained network to ECGs taken before the formal PH diagnosis, the AUC stayed ≥ 0.79 even at the 2‑year mark. This suggests the ECG already carries subtle electrical signatures of incipient pulmonary vascular remodeling that human readers miss.

## Clinical implications

1. **Screening in high‑risk settings:** Primary‑care or pulmonology clinics could run the model on every routine ECG. A positive flag would trigger targeted echocardiography, shortening the diagnostic odyssey.
2. **Resource‑constrained environments:** In places lacking ready access to echo, a cheap ECG‑based triage could prioritize referrals.
3. **Integration with wearables:** Since performance remains respectable with 1‑2 leads, future remote‑monitoring devices could continuously assess PH risk in at‑risk populations (e.g., systemic sclerosis, COPD).


## Limitations & next steps

* **Retrospective single‑center data:** External validation across diverse health systems and ethnic groups is essential.
* **Potential label noise:** Some PH cases were defined by echo alone; future work should rely exclusively on invasive hemodynamics.
* **Bias assessment:** Preliminary subgroup analysis shows stable performance across race and sex, but a thorough fairness audit is planned.
* **Prospective trial:** We are designing a real‑world implementation study to measure impact on time‑to‑diagnosis, downstream testing, and patient outcomes.


## Bottom line
A deep‑learning CNN can extract hidden PH signals from a standard 12‑lead ECG with AUC≈0.9, even when only a single lead is available. By leveraging an already ubiquitous test, we can bring PH screening to the bedside—and perhaps even the wrist—dramatically shrinking the lag between symptom onset and definitive diagnosis.
