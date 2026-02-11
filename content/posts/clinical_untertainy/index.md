+++ 
draft = false
date = 2024-11-19T12:16:57-08:00
title = "Unclear Trajectory and Uncertain Benefit: Creating a Lexicon for Clinical Uncertainty in Patients with Critical or Advanced Illness Using a Delphi Consensus Process"
description = ""
slug = ""
authors = ["Hunter Mills"]
tags = []
categories = ["Publication Summary"]
externalLink = ""
series = []
+++
[Publication Link](https://pubmed.ncbi.nlm.nih.gov/39559986/)

## Why Uncertainty Matters

In the high‑stakes world of intensive care, clinicians constantly wrestle with unknowns—whether a patient will respond to a ventilator, how a lab result will evolve, or what the true prognosis is. That “not‑knowing” isn’t just uncomfortable; it translates into more tests, higher costs, and even burnout for the care team. Yet, we have struggled to *measure* this uncertainty because it lives inside free‑text notes, hidden behind a clinician’s choice of words.

## From Words to a Structured Lexicon

Our team set out to change that. Using a **classic Delphi consensus process,** we gathered physicians from multiple specialties and regions, gave them a curated list of candidate terms, and asked them to rate each one’s relevance to clinical uncertainty. Over five iterative rounds, the group honed the list until **44 terms** met a strict ≥70% agreement threshold. The final set spans classic hedges ("maybe," "possible"), probabilistic cues ("likely," "probable"), and explicit admissions of doubt ("I don’t know").

## What Do Doctors Actually Do With Those Words?
Beyond the checklist, we asked participants open‑ended questions and performed a thematic analysis. Two clear motives emerged:
* **Communicating to Others:** Whether addressing a patient’s family, a consulting colleague, or a trainee, clinicians use uncertainty language to flag incomplete data, invite help, and model transparent decision‑making.
* **Thinking Out Loud:** Writing uncertainty into the chart helps physicians keep track of their own diagnostic reasoning, avoid premature closure, and remind themselves of the limits of current knowledge.

Interestingly, the rise of **open notes** (where patients can read their charts) only nudged a minority of physicians toward more cautious phrasing; most kept their usual style because the core purpose—capturing the clinician’s thought process—remained unchanged.

## From Lexicon to Machine Learning
For us, the real payoff is automation. With a vetted list of 44 expressions, natural‑language‑processing pipelines can now scan thousands of ICU notes and flag moments of uncertainty. That opens doors to:

* Correlating uncertainty spikes with downstream testing or imaging.
* Predicting outcomes (e.g., prolonged ventilation) based on how often clinicians voice doubt.
* Designing decision‑support tools that surface "unknowns" to multidisciplinary teams in real time.

## Looking Ahead
Our work is a first step. The lexicon was built with ICU physicians in the United States; extending it to outpatient settings, other countries, and non‑physician staff (nurses, therapists) will be crucial. Moreover, linking extracted uncertainty to concrete patient outcomes will tell us whether “talking about doubt” truly improves care—or merely reflects it.

## Take‑Home Message
Clinical uncertainty isn’t a flaw; it’s an integral part of high‑complexity medicine. By turning vague phrasing into a *standardized, machine‑readable lexicon,* we give researchers and health systems a powerful lens to study—and eventually mitigate—the hidden costs of not knowing.
