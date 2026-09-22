+++ 
draft = true
date = 2026-02-11T20:41:22-08:00
title = "All That Shines Is Not Gold: Maintaining Scientific Rigor When Evaluating, Interpreting, and Reviewing Studies Using Large Language Models"
description = "A summary of principles for keeping scientific rigor when using large language models in research: methodological transparency, secure handling of protected health information, quantitative validation with objective metrics, active bias auditing, and clear reporting of computational resources. The core challenges are black-box opacity, hallucinations, and how fast the tooling goes stale."
slug = ""
authors = ["Hunter Mills"]
tags = []
categories = ["Publication Summary"]
externalLink = ""
series = []
+++

## Why This Matters

Using Large Language Models (LLMs) in research creates a specific set of rigor problems: black-box behavior, embedded bias, and hallucination. Working around them takes discipline about transparency, data privacy, and evaluation. In practice that means disclosing training data, keeping protected health information (PHI) off public models, validating prompt strategies, and scoring outputs with quantitative metrics for accuracy and fairness instead of eyeballing a few good examples.

## Core Principles for Rigorous LLM Utilization:

* **Methodological Transparency:** Document the specific model version, training data, and prompting strategies used.
* **Data Privacy & Security:** Sending data to external, public LLMs risks exposing PHI. Studies need local or otherwise secured pipelines with de-identified data.
* **Evaluation & Validation:** Use objective metrics (semantic similarity, accuracy, hallucination rates), not anecdotal results.
* **Addressing Bias:** Actively audit and report societal, cultural, and clinical biases in the training data and the generated outputs.
* **Reproducibility:** Report all computational resources and environmental impact so findings can be replicated.
* **Explainability:** Prefer techniques that make the model's decision-making process more transparent.

## Key Challenges to Address:

* **Black Box Nature:** Limited visibility into how LLMs reach their conclusions.
* **Hallucinations:** Plausible but inaccurate output.
* **Rapid Obsolescence:** LLM tooling moves fast enough that findings can be stale by the time they are published.

For researchers and reviewers, holding to these practices is what keeps LLM-driven research valid and clinically useful.
