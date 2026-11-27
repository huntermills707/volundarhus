+++ 
draft = false
date = 2026-05-15T09:00:00-07:00
title = "Real-World Differences in ILD Diagnosis, Management, and Outcomes Across Subspecialty and Non-Specialty Care Settings: Clinical and Health System Implications"
description = "A summary of a retrospective cohort study of 6,637 adults with interstitial lung disease at a single academic health system. Patients seen in an ILD subspecialty clinic had more CT imaging and antifibrotic use, less lung biopsy and chronic prednisone use, delayed acute-care utilization, and lower mortality than patients in other ambulatory settings. Non-specialty pathways disproportionately served younger, racially and ethnically minoritized, and socioeconomically disadvantaged patients."
slug = ""
authors = ["Hunter Mills"]
tags = ["ild", "ehr"]
categories = ["Publications"]
externalLink = ""
series = []
+++

{{< app_demo site="paper" url="https://doi.org/10.1093/ajrccm/aamag162.2858" description="Published in the American Journal of Respiratory and Critical Care Medicine" >}}

## Why This Matters

Subspecialty interstitial lung disease (ILD) clinics bring together multidisciplinary expertise that can improve diagnostic accuracy and treatment. But having an ILD clinic inside a health system does not mean every patient can access it. Geographic, socioeconomic, and referral barriers can leave patients in other ambulatory care pathways.

We wanted to understand who receives care outside the subspecialty clinic and whether care setting is associated with differences in diagnosis, treatment, healthcare utilization, and survival—even within one academic health system with established ILD expertise.

## The Study in a Nutshell

We conducted a retrospective cohort study of **6,637 adults with ILD** seen between **2013 and 2024**.

* **Cohort identification:** We combined an institutional ILD database with a validated machine-learning classification algorithm, allowing us to identify patients beyond the subspecialty clinic.
* **Data sources:** A de-identified clinical data warehouse integrated structured and unstructured electronic health record data with state death records.
* **Comparison:** Patients were stratified by whether they received care in the ILD subspecialty clinic or in other ambulatory settings.
* **Analysis:** Multivariable regression and Cox proportional hazards models adjusted for age, sex, race/ethnicity, ILD subtype, comorbidity, and socioeconomic status.

Two-thirds of patients were seen in the ILD clinic; the remaining one-third received care in non-specialty settings.

## Who Was Reached by Each Care Pathway?

Patients in non-specialty settings were more likely to be younger, identify as Black or Latinx, live in lower-socioeconomic areas, and have nonspecific ILD diagnoses (p < 0.001 for each comparison).

That pattern matters as much as the treatment differences. It suggests that unequal access to specialty expertise is not just a problem between institutions—it can persist within a health system that already has the necessary expertise.

## Key Results

Compared with patients in other ambulatory settings, ILD-clinic patients had the following adjusted outcomes:

|Outcome|Adjusted effect|95% confidence interval|p-value|
|:---|:---|:---|:---|
|CT chest as part of diagnostic evaluation|**OR 3.32**|2.84–3.88|< 0.01|
|Lung biopsy as part of diagnostic evaluation|**OR 0.52**|0.45–0.59|< 0.01|
|Treatment with an antifibrotic|**OR 2.85**|2.31–3.51|< 0.001|
|Treatment with chronic prednisone|**OR 0.72**|0.66–0.82|0.04|
|Mortality|**HR 0.57**|0.45–0.72|< 0.001|

ILD-clinic patients also had a longer time from diagnosis to their first emergency department visit or hospitalization.

## What This Means for Health Systems

1. **Specialty access is a quality-of-care issue.** The combination of more CT imaging, less biopsy, more antifibrotic treatment, and less chronic prednisone use is consistent with more guideline-concordant care in the ILD clinic.
2. **Referral pathways need active design.** Simply offering a subspecialty clinic is insufficient if structural barriers determine who reaches it. Streamlined referrals and interventions targeting those barriers are logical next steps.
3. **Scalable expertise matters.** Health systems need ways to extend ILD knowledge beyond a single clinic, particularly for patients facing geographic or socioeconomic obstacles.
4. **Broad cohort identification changes the question.** Restricting a study to an ILD clinic would miss the one-third of patients in other care pathways. Combining a clinical database with a validated classifier made those patients visible.

## Caveats & Limitations

* **Associations are not causation:** This was an observational study. The mortality association does not establish that clinic placement alone caused improved survival.
* **Residual confounding remains possible:** Although the models adjusted for several demographic and clinical factors, referral patterns, disease severity, and unmeasured patient characteristics may still differ between groups.
* **Single-system evidence:** The study captured care within one academic health system. The magnitude of these differences may vary across institutions and regions.
* **Abstract-level reporting:** The conference abstract does not provide the full cohort definitions, model diagnostics, or sensitivity analyses needed to assess every methodological detail.

## Take-Home Message

Within a single academic health system, where patients received ILD care was associated with substantial differences in diagnosis, treatment, acute-care utilization, and survival. Patients outside the subspecialty pathway were also disproportionately from racially and ethnically minoritized and socioeconomically disadvantaged groups.

The central lesson is straightforward: **building specialty expertise is only part of the job; health systems also have to make that expertise reachable.**
