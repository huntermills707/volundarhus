+++ 
draft = false
date = 2023-05-15T07:44:15-08:00
title = "Machine‑Learning Algorithm to Improve Cohort Identification in Interstitial Lung Disease"
description = "A publication summary describing a gradient-boosted classifier that identifies interstitial lung disease from EHR data with AUC 0.929. By combining structured codes, pulmonary function tests, and NLP-extracted concepts, the model outperformed code-only approaches. NLP features comprised only 15% of variables but 40% of top predictors. The post offers a blueprint for rare-disease cohort identification: combine structured and unstructured data, use gradient-boosted trees, and prioritize interpretability via ANOVA screening and feature importance."
slug = ""
authors = ["Hunter Mills"]
tags = []
categories = ["Publication Summary"]
externalLink = ""
series = []
+++
[Publication Link](https://academic.oup.com/ajrccm/article/207/10/1398/8428048)

## Why this work matters
Identifying patients with rare diseases such as interstitial lung disease (ILD) from electronic health records (EHRs) is notoriously hard. Traditional approaches rely on diagnostic codes (ICD‑10) that miss many cases, limiting epidemiologic studies and trial recruitment. We demonstrate that a carefully engineered machine‑learning (ML) pipeline can accurately flag ILD cases by pulling together structured data (billing codes, pulmonary function tests) and unstructured clinical notes processed with natural‑language‑processing (NLP).

## Core objectives

1. **Proof‑of‑concept:** Test whether supervised ML can reliably classify prevalent ILD in a large adult population.
2. **Feature breadth:** Compare models that 
	* Use all data types.
	* Omit pulmonary function tests (PFTs).
	* Omit unstructured NLP data.
3. **Interpretability:** Identify which variables drive classification performance.

## Data & cohort

* **Source:** De‑identified UCSF Clinical Data Warehouse (≈5.5 million patients, 117 million encounters, >3k variables).
* **Gold‑standard:** UCSF ILD Clinic registry with multidisciplinary diagnoses, linked back to the warehouse for training labels.
* **Inclusion:** Adults ≥ 18 years of age with ≥ 5 encounters; ~1.4 million patients met criteria, ~200k used for training, remainder for testing.

## Modeling pipeline

1. **Variable selection:** ANOVA identified the most discriminative candidates from four groups: demographics, billing codes, PFTs, and NLP‑derived clinical concepts (via cTAKES).
2. **Algorithm:** Gradient‑boosted decision trees trained with five‑fold cross‑validation.
3. **Metrics:** Precision, recall, F1‑score, and area under the ROC curve (AUC) evaluated under class‑imbalance conditions.

## Key results
|Input variables|AUC|Precision|Recall|AUPRC|F1|
|:---|:---|:---|:---|:---|:---|
|Full|0.929|0.791|0.871|0.931|0.829|
|Minus PFT|0.929|0.851|.803|0.933|0.827|
|Minus NLP|0.837|0.719|.820|0.864|0.766|

* **Performance:** All three models achieved strong discrimination; the full model was best, but dropping PFTs barely hurt AUC, while removing NLP reduced performance noticeably.
* **Top predictors** (shared across models): age, utilization counts (especially pulmonology and cytopathology visits), ILD ICD‑10 codes J84 (other interstitial pulmonary diseases) and J67 (hypersensitivity pneumonitis).
* **NLP impact:** Although NLP concepts comprised only 15% of the 334 candidate variables, they represented 40% of the top‑25 features—terms like “idiopathic pulmonary fibrosis,” “interstitial lung disease,” and “extrinsic allergic alveolitis” drove classification.

## Interpretation & implications

* **Feasibility:** Even for a rare, heterogeneous condition, supervised ML can achieve >0.9 AUC using routinely collected EHR data.
* **Utility of unstructured text:** Clinical notes add substantial signal beyond codes and labs, underscoring the value of NLP pipelines in health‑record mining.
* **Scalability:** EHR‑agnostic could be deployed across institutions to automate cohort assembly for ILD studies, clinical trials, and potentially for sub‑phenotype identification (e.g., idiopathic pulmonary fibrosis).

## Limitations

* Single‑institution data (UCSF) may limit external validity; broader validation is needed.
* Some variables (e.g., PFTs) are inconsistently captured across sites, which could affect transportability.
* The model currently outputs a binary ILD label; finer granularity (specific ILD subtypes) remains a future goal.

## Bottom line for a Machine Learning Engineer
This is a concrete blueprint for building interpretable, high‑performing cohort‑identification models in rare diseases:

1. **Combine structured and unstructured EHR streams:** the synergy yields the biggest boost.
2. **Use gradient‑boosted trees with careful cross‑validation:** they handle mixed data types and class imbalance well.
3. **Prioritize feature interpretability:** ANOVA screening plus SHAP‑style importance plots keep the model transparent for clinicians.

If you’re looking to replicate or extend this workflow (e.g., for other rare pulmonary conditions), start with a gold‑standard registry for labeling, extract a wide set of candidate variables, and test the incremental value of NLP features. The metrics you can expect AUCs in the high‑0.8 to low‑0.9 range even when some data modalities are missing.
