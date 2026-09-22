+++ 
draft = false
date = 2024-11-19T12:16:57-08:00
title = "Unclear Trajectory and Uncertain Benefit: Creating a Lexicon for Clinical Uncertainty in Patients with Critical or Advanced Illness Using a Delphi Consensus Process"
description = "Summary of a JAMA Network Open paper: a five-round Delphi consensus process produced a standardized lexicon of 44 clinical uncertainty expressions. Clinicians use this language to communicate with families and colleagues and to track their own reasoning; the lexicon lets NLP pipelines detect uncertainty in clinical notes."
slug = ""
authors = ["Hunter Mills"]
tags = []
categories = ["Publication Summary"]
externalLink = ""
series = []
+++
[Publication Link](https://pubmed.ncbi.nlm.nih.gov/39559986/)

## Why Uncertainty Matters

Intensive care runs on unknowns: whether a patient will respond to a ventilator, how a lab result will evolve, what the true prognosis is. That "not-knowing" isn't just uncomfortable. It shows up as more tests, higher costs, and burnout for the care team. We have struggled to *measure* any of it, because the uncertainty lives inside free-text notes, buried in a clinician's choice of words.

## From Words to a Structured Lexicon

Our team set out to change that. We ran a classic Delphi consensus process: physicians from multiple specialties and regions rated a curated list of candidate terms for their relevance to clinical uncertainty. Over five rounds, the group honed the list until 44 terms met a strict ≥70% agreement threshold. The final set covers hedges ("maybe," "possible"), probabilistic cues ("likely," "probable"), and explicit admissions of doubt ("I don’t know").

## What Do Doctors Actually Do With Those Words?
Beyond the checklist, we asked participants open-ended questions and ran a thematic analysis of their answers. Two clear motives emerged.

The first is communication. With families, consulting colleagues, and trainees, clinicians use uncertainty language to flag incomplete data, invite help, and model transparent decision-making. The second is thinking out loud. Writing uncertainty into the chart helps physicians track their own diagnostic reasoning, avoid premature closure, and remember the limits of current knowledge.

Interestingly, the rise of open notes (where patients can read their charts) only nudged a minority of physicians toward more cautious phrasing. Most kept their usual style, because the core purpose (capturing the clinician's thought process) hadn't changed.

## From Lexicon to Machine Learning
For us, the real payoff is automation. With a vetted list of 44 expressions, NLP pipelines can scan thousands of ICU notes and flag moments of uncertainty. That makes it possible to:

* Correlating uncertainty spikes with downstream testing or imaging.
* Predicting outcomes (e.g., prolonged ventilation) based on how often clinicians voice doubt.
* Designing decision-support tools that surface "unknowns" to multidisciplinary teams in real time.

## Looking Ahead
Our work is a first step. The lexicon was built with ICU physicians in the United States, and extending it to outpatient settings, other countries, and non-physician staff (nurses, therapists) matters. The bigger question is whether extracted uncertainty tracks concrete patient outcomes: that will tell us whether “talking about doubt” actually improves care or only reflects it.

## Take-Home Message
Clinical uncertainty isn’t a flaw; it comes with the territory in high-complexity medicine. Turning vague phrasing into a standardized, machine-readable lexicon gives researchers and health systems a way to study the hidden costs of not knowing, and maybe eventually reduce them.
