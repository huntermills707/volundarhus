+++ 
draft = false
date = 2026-04-05T19:52:47-07:00
title = "Stratified Word Embeddings with Patient and Provider Metadata"
description = "A technical post introducing FastTextContext, a C++ extension of FastText that learns patient and provider metadata embeddings jointly with word vectors. By concatenating word, patient, and provider representations through a shared projection matrix, the model produces stratified clinical embeddings that shift based on demographics and care setting. The post details the architecture, hierarchical softmax loss, Hogwild plus synchronized-averaging optimization, and applications to MIMIC-III for studying documentation disparities and care-pathway variation."
slug = ""
authors = ["Hunter Mills"]
tags = []
categories = ["Personal Projects", "FastTextContext"]
externalLink = ""
series = []
math = true
+++

Standard word embeddings treat every occurrence of a word as equivalent. "Chest pain" means the same thing whether it appears in a note written by an emergency attending about an 80-year-old Medicare patient or by a resident describing an elective pre-op. That homogeneity is a fundamental design choice in Word2Vec and FastText, and for most downstream tasks it is a reasonable one. Clinical NLP, however, operates in a domain where who is speaking, about whom, and in what care setting are inseparable from meaning. This post describes **FastTextContext**, a from-scratch C++ implementation that extends FastText's skip-gram model with learned metadata embeddings for patient demographics and provider role, fused through a shared projection matrix.
 
---
 
## Why Metadata Matters in Clinical Language
 
The distributional hypothesis --- that words appearing in similar contexts have similar meanings --- is the theoretical backbone of every embedding model. In a general corpus, "context" is defined purely by neighboring words. In a clinical corpus, context is richer: the same sentence carries different semantic weight depending on the patient's age, insurance status, and ethnicity, and depending on the provider's role and the admission type.
 
Consider the word *admitted*. In a note generated during an emergency admission for an elderly, uninsured patient, the surrounding language will differ systematically from its use in a scheduled elective note for a privately insured young adult. A model that conflates these will learn a single vector that is, in a statistical sense, the average of several distinct clinical realities.
 
The goal of this project is to make that stratification explicit and learnable. Rather than conditioning embeddings post-hoc, the model learns patient and provider representations jointly with word representations during training. At inference time, the composed vector for "chest pain" shifts in the embedding space depending on who the patient is and who is writing the note.
 
Beyond semantic accuracy, the practical motivation is downstream analysis: nearest-neighbor queries conditioned on patient group surface associations that would be invisible to a standard model, and those associations are precisely what is needed to study disparities in how clinical language is used across demographic strata.
 
---
 
## Architecture Overview
 
The model is a skip-gram FastText extended with two additional embedding matrices: one for patient group tokens and one for provider group tokens. Training data is formatted as triple-pipe-delimited lines:
 
```
elderly male white english medicare ||| attending emergency ||| the patient was admitted with chest pain
```
 
Each center word's representation is built by concatenating three components and projecting the result into a shared output space.
 
**Word and n-gram part** (dimension $d_w = 150$):
 
$$\mathbf{v}\_{\text{word}} = \mathbf{e}\_w + \sum\_{g \in \mathcal{G}(w)} \mathbf{n}\_g$$
 
where $\mathbf{e}\_w$ is the word embedding and $\mathbf{n}\_g$ are character n-gram embeddings hashed into a bucket table, inherited from FastText's subword approach. This handles out-of-vocabulary clinical abbreviations gracefully.
 
**Patient metadata part** (dimension $d_p = 30$):
 
$$\mathbf{v}\_{\text{patient}} = \frac{1}{|\mathcal{P}|} \sum\_{p \in \mathcal{P}} \mathbf{m}\_p$$
 
**Provider metadata part** (dimension $d_{pr} = 15$):
 
$$\mathbf{v}\_{\text{provider}} = \frac{1}{|\mathcal{R}|} \sum\_{r \in \mathcal{R}} \mathbf{m}\_r$$
 
The three are concatenated and projected:
 
$$\mathbf{z} = \begin{bmatrix} \mathbf{v}\_{\text{word}} \\\\ \mathbf{v}\_{\text{patient}} \\\\ \mathbf{v}\_{\text{provider}} \end{bmatrix} \in \mathbb{R}^{d_w + d_p + d_{pr}}$$
 
$$\mathbf{h} = W\_{\text{proj}} \, \mathbf{z} \quad \in \mathbb{R}^{d\_{\text{out}}}$$
 
$W\_{\text{proj}} \in \mathbb{R}^{150 \times 195}$ has 29,250 parameters. This is a small matrix by modern standards but it is the architectural keystone: it is the learned function that determines how much the patient and provider context shifts the final representation. The projection is shared across all words and all metadata fields, which means the model generalizes to combinations of patient and provider tokens it has not seen together.
 
---
 
## Loss Function
 
The model uses skip-gram with hierarchical softmax. For each center word $w_c$, the model attempts to predict each context word $w_o$ within a randomly sampled window. Standard softmax over a vocabulary of tens of thousands of words would require computing a partition function over all output vectors at every step. Hierarchical softmax replaces this with a binary decision tree --- specifically, a Huffman tree built over word frequencies so that frequent words sit near the root.
 
To predict context word $w_o$, the model traverses the Huffman path $\\{(n_1, d_1), \ldots, (n_L, d_L)\\}$ from root to the leaf representing $w_o$, where $n_i$ is the $i$-th internal node and $d_i \in \{0, 1\}$ is the Huffman code bit. The per-pair loss is:
 
$$\mathcal{L}(w_c, w_o) = -\sum\_{i=1}^{L} \Big[ t_i \log \sigma(\mathbf{u}\_{n_i}^\top \mathbf{h}) + (1 - t_i) \log \big(1 - \sigma(\mathbf{u}\_{n_i}^\top \mathbf{h})\big) \Big]$$
 
where $\sigma(x) = \frac{1}{1 + e^{-x}}$, $\mathbf{u}\_{n_i} \in \mathbb{R}^{d\_{\text{out}}}$ is the output vector for internal node $n_i$, and $t_i = 1 - d_i$ maps the Huffman code to a binary classification target (left branch $\to 1$, right branch $\to 0$). Each step along the path is a logistic regression: does the path go left or right from this node?
 
The total loss over a sentence with $T$ words is:
 
$$\mathcal{L}\_{\text{total}} = \sum\_{c=1}^{T} \sum\_{\substack{o = c - \tilde{w} \\\\ o \neq c}}^{c + \tilde{w}} \mathcal{L}(w_c, w_o)$$
 
where $\tilde{w} \sim \text{Uniform}\\{1, \ldots, W\\}$ is a fresh window sample for each center word. This random subsampling of window size is standard in skip-gram and acts as a soft downweighting of distant context.
 
---
 
## Gradients
 
The gradient computation has two stages: updates to the output tree nodes, then backpropagation through the projection to update the input-side parameters.
 
At each internal node $n_i$ along the Huffman path, the signed error is:
 
$$g_i = \eta \, \big(t_i - \sigma(\mathbf{u}\_{n_i}^\top \mathbf{h})\big)$$
 
where $\eta$ is the current learning rate, decayed linearly toward zero over training. This is the standard logistic gradient: positive when the model underestimates the probability of the correct branch, negative when it overestimates.
 
**Output node update** (applied immediately, clipped to L2 norm $\gamma$):
 
$$\Delta \mathbf{u}\_{n_i} = \text{clip}\_\gamma \big( g_i \, \mathbf{h} \big)$$
 
$$\mathbf{u}\_{n_i} \leftarrow \mathbf{u}\_{n_i} + \Delta \mathbf{u}\_{n_i}$$
 
**Accumulated gradient on the projected center vector** (summed across all path nodes and all context words before backprop):
 
$$\nabla\_{\mathbf{h}} = \text{clip}\_\gamma \left( \sum\_{i=1}^{L} g_i \, \mathbf{u}\_{n_i} \right)$$
 
where $\text{clip}\_\gamma(\mathbf{v}) = \mathbf{v} \cdot \min\left(1, \frac{\gamma}{\|\mathbf{v}\|\_2}\right)$ rescales the vector if its L2 norm exceeds $\gamma$. Accumulating before clipping rather than clipping per-node gives the gradient more signal before the norm constraint is enforced.
 
**Backpropagation through the projection**:
 
$$\nabla\_{\mathbf{z}} = W\_{\text{proj}}^\top \, \nabla\_{\mathbf{h}}$$
 
$$W\_{\text{proj}} \leftarrow W\_{\text{proj}} + \eta \, \nabla\_{\mathbf{h}} \, \mathbf{z}^\top$$
 
The rank-1 outer product update to $W\_{\text{proj}}$ costs $O(d\_{\text{out}} \cdot d\_{\text{concat}})$ --- cheap relative to the full softmax it replaces.
 
The concatenated gradient $\nabla\_{\mathbf{z}}$ is sliced and distributed to its constituent embedding matrices:
 
$$\nabla\_{\mathbf{z}} = \begin{bmatrix} \nabla\_{\text{word}} \\\\ \nabla\_{\text{patient}} \\\\ \nabla\_{\text{provider}} \end{bmatrix}$$
 
**Word and n-gram updates**:
 
$$\mathbf{e}\_w \leftarrow \mathbf{e}\_w + \eta \, \nabla\_{\text{word}}$$
 
$$\mathbf{n}\_g \leftarrow \mathbf{n}\_g + \eta \, \nabla\_{\text{word}} \quad \forall \, g \in \mathcal{G}(w)$$
 
**Patient and provider updates** (scaled by the number of active metadata fields):
 
$$\mathbf{m}\_p \leftarrow \mathbf{m}\_p + \frac{\eta}{|\mathcal{P}|} \, \nabla\_{\text{patient}} \quad \forall \, p \in \mathcal{P}$$
 
$$\mathbf{m}\_r \leftarrow \mathbf{m}\_r + \frac{\eta}{|\mathcal{R}|} \, \nabla\_{\text{provider}} \quad \forall \, r \in \mathcal{R}$$
 
Optional L2 weight decay is applied to $W\_{\text{proj}}$ after each synchronization cycle:
 
$$W\_{\text{proj}} \leftarrow (1 - \lambda) \, W\_{\text{proj}}$$
 
This is applied only to the projection matrix, not to the sparse embedding matrices, since decay on sparse parameters would penalize infrequently updated rows disproportionately.
 
---
 
## Optimization: Dense and Hogwild
 
Training a model like this efficiently on a multi-core machine requires treating sparse and dense parameters differently.
 
### Hogwild for Sparse Parameters
 
The input word matrix, n-gram matrix, and output tree node matrix are all sparse in the sense that any given training sample touches only a small subset of rows. The Hogwild algorithm exploits this by simply ignoring locks: multiple threads write to the same shared arrays concurrently, accepting occasional clobbered updates. The theoretical justification is that with sparse access patterns, the probability that two threads collide on the same row is low, and the gradient noise introduced by the rare collision is indistinguishable from the noise already present in stochastic gradient descent. In practice, Hogwild achieves near-linear scaling on sparse problems and is the standard approach in word embedding training.
 
### Synchronized Averaging for Dense Parameters
 
The projection matrix $W\_{\text{proj}}$, the patient matrix, and the provider matrix are dense in the relevant sense: every training sample updates all of them. Concurrent lock-free writes to a dense matrix produce heavily corrupted gradients that destroy convergence. The solution used here is a broadcast-process-reduce cycle per chunk:
 
1. **Broadcast**: before each chunk of samples, the shared dense parameters are copied to per-thread local matrices.
2. **Process**: threads train on their assigned samples in parallel, updating only their local copies. No contention.
3. **Reduce**: after the chunk, all thread-local copies are averaged back into the shared matrices.
 
With a chunk size of 1,000, this means one synchronization point per 1,000 samples rather than one per center word. The reduction in synchronization overhead is roughly four orders of magnitude relative to a mutex-per-update approach, while the gradient staleness introduced is bounded by the chunk size and manageable with a modest learning rate.
 
This hybrid strategy --- Hogwild for sparse, synchronized averaging for dense --- is what makes it practical to train on a dataset the size of MIMIC-III without sacrificing either speed or correctness on the projection.
 
---
 
## Hierarchical Softmax
 
Computing the full softmax over a vocabulary of $V$ words requires $O(V)$ work per prediction. For a clinical corpus with tens of thousands of unique tokens, this is the dominant training cost. Hierarchical softmax reduces this to $O(\log V)$ by replacing the flat output layer with a binary tree.
 
A Huffman tree is built over the word frequency distribution: frequent words receive short codes (few binary decisions from root to leaf) and rare words receive long codes. This is optimal in an information-theoretic sense --- the expected path length is minimized given the frequency distribution, so the model spends less time on predictions that are already well-constrained by frequency.
 
Each internal node of the tree holds an output vector $\mathbf{u}\_{n_i} \in \mathbb{R}^{d\_{\text{out}}}$. Predicting a context word is a sequence of left/right binary decisions along the path from root to that word's leaf. Each decision is a sigmoid-activated dot product between the current node's output vector and the projected center vector $\mathbf{h}$. The total number of such decisions is the depth of the leaf in the Huffman tree, which is $O(\log V)$ on average and, by the Huffman property, minimized in expectation.
 
At inference time, nearest-neighbor search operates entirely in the $d\_{\text{out}}$ space. A cache of precomputed word-only projected vectors (vocabulary size $\times$ $d\_{\text{out}}$) is held in memory. A query with metadata constructs its full composed vector including patient and provider terms, and cosine similarity against the cache is well-defined because both query and candidate vectors live in the same $d\_{\text{out}}$ space.
 
---
 
## Applied to MIMIC-III
 
The MIMIC-III preprocessing pipeline converts the raw database tables into the triple-pipe training format in three steps. Step one joins the relevant tables into a merged Parquet file using Polars lazy frames to keep peak memory low. Step two runs sentence segmentation on the clinical notes in parallel batches, producing a sentence-level Parquet. Step three explodes the sentences into the final training text with one sentence per line, shuffled, annotating each line with patient demographics (MeSH age category, gender, ethnicity, language, insurance) and provider fields (caregiver title, admission type).
 
A two-stage hierarchical bootstrap is implemented for statistical robustness: stage one resamples patient IDs with replacement, stage two resamples each sampled patient's notes with replacement, preserving the note count. This respects the clustered correlation structure --- notes from the same patient are not independent observations --- which matters for any downstream analysis that uses bootstrap confidence intervals.
 
---
 
## Future Directions: Quality of Care and Social Determinants of Health
 
The architecture as described learns to represent how clinical language varies with metadata. The more consequential question is what those variations reveal.
 
**Measuring documentation disparities.** If the nearest neighbors of "pain" shift systematically when the patient group changes from "elderly white medicare" to "young adult hispanic medicaid," that shift is a measurable signal. Documentation practices are known to differ across patient demographics --- the frequency of certain terms, the level of detail in subjective sections, the language used to characterize patient behavior. Embeddings trained with stratified metadata make these differences legible as geometric distances in a shared space.
 
**Social determinants of health as first-class features.** Insurance type, language, and ethnicity are already present in the training format as patient metadata tokens. Marital status, housing instability, and other social determinants could be added from structured fields in MIMIC-III or similar datasets. The architecture is extensible: adding a fourth metadata group requires widening $W\_{\text{proj}}$ by $d\_{\text{new}}$ columns and adding the corresponding embedding matrix. No structural changes to the training loop or hierarchical softmax are needed.
 
**Detecting care pathway variation.** Provider role and admission type as conditioning variables open the door to studying how the same clinical presentation is described differently across care settings. An attending's emergency note about chest pain and a resident's elective note use the same vocabulary but with different distributional properties. Conditioned nearest-neighbor queries can surface these differences systematically across large corpora, providing an empirical basis for studying whether and how care varies by provider type and setting.
 
**Outcome-conditioned embeddings.** The most direct extension is adding a fourth group for clinical outcomes: discharge disposition, 30-day readmission, mortality. A model trained with outcome as a conditioning variable would learn to represent language in a space where the direction toward "readmission" or "discharge to SNF" is geometrically meaningful. This would enable outcome-risk-conditioned similarity queries and, potentially, a richer feature representation for downstream risk stratification models than bag-of-words or standard embeddings provide.
 
**Bias auditing.** Embeddings encode the statistical regularities of the corpus they are trained on, which means they also encode its biases. Stratified embeddings make it possible to ask whether the association between a clinical term and a sentiment or severity indicator changes across patient demographic groups. If "noncompliant" is more proximate to terms indicating poor outcomes in notes about patients of certain demographic groups than others, that is an auditable signal in the embedding geometry --- one that a single unstratified model would obscure.
 
The common thread across these directions is the same motivation that drove the original design: clinical meaning is not context-free, and a representation model that treats it as such forfeits the most clinically and ethically significant variation in the data.
 
---
 
The code, preprocessing pipeline, and a synthetic data generator are available on [GitHub](https://github.com/huntermills707/FastText-with-Context). The model trains on MIMIC-III in a few hours on a modern multi-core machine with default settings.
