+++ 
draft = false
date = 2026-03-17T17:33:25-07:00
title = "Time and Motion Analysis of Controlled Substance Disposals: A Study of Workflows at a Single Center using Automated Dispensing Cabinets"
description = "A time-and-motion study of 55 controlled substance disposals at a VA medical center revealed that the honor-system workflow is broken: 80% of disposals lacked independent verification, 38% did not show the syringe or volume to the witness, and wait times for witnesses ranged up to nine minutes. Despite this, 71% of clinicians believed diversion remained possible. The post argues for computer-vision-based automated verification and real-time anomaly detection to replace manual witnessing with intelligent accountability."
slug = ""
authors = ["Hunter Mills"]
tags = []
categories = ["Publication Summary"]
externalLink = ""
series = []
+++

[Publication Link](https://journals.lww.com/anesthesiologyopen/fulltext/2026/01000/time_and_motion_analysis_of_controlled_substance.8.aspx)

Controlled substance diversion in healthcare is a persistent, underreported problem. Estimates put diversion at 1% to 8% of controlled substances, and the true figure is likely higher because so much of it never gets reported. The consequences are serious: patient infections, compromised care, and heavy institutional penalties.

For years, hospitals have relied on an "honor system" for disposing of unused medications. Anesthesiologists and nurses manually witness the waste, enter data into automated dispensing cabinets (ADCs), and trust that the process is followed. A recent study we ran at the San Francisco Veterans Affairs Medical Center shows how that works out in practice: the system is inefficient and easy to game.

### The Reality of the Workflow

In our time-and-motion analysis published in *Anesthesiology Open*, we observed 55 controlled substance disposal events over six weeks. The findings:

*   **The "Honor System" Failure:** In 80% of observed events, the person disposing of the drug (the custodian) also entered the data into the ADC. True independent verification was the exception, not the rule.
*   **Missing Verification:** In 38.2% of disposals, neither the syringe label nor the volume was physically shown to the witness. In another 10.9%, only the label was shown.
*   **Workflow Friction:** While the actual time spent at the cabinet was relatively short (mean of 52 seconds), the process of recruiting a witness caused significant delays, with wait times ranging from 1 second to nearly 9 minutes.
*   **Clinician Skepticism:** Despite the rigid protocols, 71.5% of surveyed clinicians believed diversion could still occur within existing systems. Many felt the current processes were inadequate to prevent discrepancies.

The data points to a disconnect between policy and practice. Clinicians see the system as unreliable, and the workflow gives them trust instead of verifiable data.

|![Figure](fig.jpeg)|
|---|

### Bridging the Gap with Machine Learning

I work as a Machine Learning Engineer at a stealth startup focused on controlled substance monitoring and tracking in operating rooms, so I have some skin in this game. The problem isn't a lack of regulation. It's that nothing in the current workflow actually verifies what happened.

Traditional ADCs are passive record-keepers. They log what a user *says* happened, not what *actually* happened. The fix is active, computer-vision-based monitoring:

1.  **Automated independent verification:** Cameras and optical sensors confirm that the correct drug, label, and volume are present and destroyed, instead of leaning on human witnesses who are usually busy with patient care.
2.  **Real-time anomaly detection:** ML models can analyze disposal patterns as they happen, flagging irregularities (say, frequent waste of a specific high-risk drug by a single provider) before they become systemic.
3.  **No added friction:** Technology should reduce workflow friction, not add to it. Automated logging removes manual data entry and gives clinicians that time back for patient care.

Our research found that 67.9% of respondents would be comfortable with cameras facilitating disposal. People are open to it, and the technology is ready.

### The Path Ahead

The tension between efficiency and accountability in controlled substance disposal is solvable, but it takes moving past administrative tracking toward systems that verify what physically happens. The goal is a workflow where diversion is technically impossible to hide.

The stakes are too high for the status quo. It's time to replace the honor system with verification that actually works.
