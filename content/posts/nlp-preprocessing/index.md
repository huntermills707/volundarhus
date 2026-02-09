+++ 
draft = false
date = 2021-06-11T20:42:18-08:00
title = "Impact of Different Approaches to Preparing Notes for Analysis With Natural Language Processing on the Performance of Prediction Models in Intensive Care"
description = ""
slug = ""
authors = ["Hunter Mills"]
tags = []
categories = ["Publication Summary"]
externalLink = ""
series = []
+++

## Why This Matters
Predictive models built on intensive‑care unit (ICU) clinical notes are increasingly used to forecast patient mortality. Yet the pre‑processing of those free‑text notes—cleaning, tokenizing, stemming, TF‑IDF weighting, n‑gram creation, etc.—is often treated as a routine step. This study asks a simple but crucial question: Does the choice of note‑preparation strategy materially affect model performance?

## Core Objectives

1. Evaluate several common text‑pre‑processing pipelines (raw, cleaned, stemmed, TF‑IDF, n‑grams).
2. Quantify their impact on the discriminative ability (AUROC) of mortality‑prediction models.
3. Test robustness across three algorithm families: penalized logistic regression, feed‑forward neural networks, and random‑forest classifiers.


## Data & Experimental Design
* **Cohort:** Adult ICU admissions from the University of California, San Francisco (UCSF), and externally validated on Beth Israel Deaconess Medical Cente (BIDMC).
* **Outcome:** In‑hospital mortality.
* **Features:** Unstructured clinical note text (e.g., progress notes, discharge summaries).
* **Pre‑processing variants:**
  * Raw text (no processing)
  * Cleaned text (removing PHI, punctuation, stop‑words)
  * Stemming (Porter stemmer)
  * TF‑IDF vectorization
  * N‑gram generation (bi‑/tri‑grams).
* **Model training:** 10‑fold cross‑validation on the UCSF dataset.
* **Evaluation metric:** Area Under the Receiver Operating Characteristic curve (AUROC).

## Key Findings
AUROC of models trained on UCSF and validated on BIDMC.
|Pre‑processing (Stacked) |Logistic‑Regression AUROC|Neural‑Network AUROC|Random‑Forest AUROC
|:---|:---|:---|:---|
Raw text|0.72|0.76|0.67
Cleaned text|0.75|0.78|0.68
Stemming|0.77|0.80|0.71
TF‑IDF|0.83|0.81|0.79
N‑grams|0.80|0.78|0.77

Takeaway: TF‑IDF vectorization consistently yielded the highest AUROC improvement across all three model families.

## Interpretation
* **Feature representation matters:** Converting raw text into weighted term frequencies (TF‑IDF) captures both term importance and sparsity, which benefits linear models and tree‑based ensembles alike.
* **Algorithm‑agnostic effects:** The advantage of TF‑IDF persisted across penalized logistic regression, deep neural nets, and random forests, suggesting the benefit stems from the input representation rather than model architecture.
* **Practical recommendation:** For ICU mortality prediction pipelines that rely on clinical notes, adopt at least a cleaning step followed by TF‑IDF vectorization (optionally enriched with bi‑/tri‑grams) before feeding data to downstream learners.


## Limitations & Future Directions

* **Trained on single‑center data:** Results are derived from UCSF ICU records; external validation on other hospitals is needed to confirm generalizability.
* **Scope of outcomes:** The study focused solely on mortality; other clinically relevant predictions (e.g., length of stay, sepsis onset) may respond differently to preprocessing choices.

## Bottom Line for Practitioners
If you’re building a predictive model that ingests free‑text ICU notes, don’t settle for "just clean the text." Implement TF‑IDF (with optional n‑grams) as your baseline preprocessing pipeline—it delivers a measurable lift in AUROC across diverse algorithms, and it’s computationally cheap compared to deep contextual embeddings.

