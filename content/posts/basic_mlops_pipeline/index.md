+++
draft = false
date = 2026-07-20T18:46:00-07:00
title = "A Full-Loop MLOps Platform on Two Homelab Kubernetes Clusters"
description = "A walkthrough of a reproducible MLOps platform built from scratch: a DistilBERT toxicity classifier is trained, registered in MLflow, exported to ONNX and TensorRT, and served on two k3s clusters (a CPU laptop and a 2-GPU workstation) running identical manifests. KServe, Triton, KEDA autoscaling on queue depth, and Argo Rollouts canaries with Prometheus analysis gates handle the path from training run to production traffic, while a web UI feeds user corrections back into training data. The post covers the architecture, the canary/promotion flow, and the debugging war stories (NordVPN vs. k3s DNS, an MLflow image missing boto3, and a KServe ingress that silently 404s)."
slug = ""
authors = ["Hunter Mills"]
tags = []
categories = ["Personal Projects", "MLOps"]
externalLink = ""
series = []
+++
[GitHub Repo](https://github.com/huntermills707/haterade)

## Why I built this

Most MLOps tutorials stop at "model in a notebook, Dockerfile around it." The hard part is everything after: how a trained artifact moves from a training run into a production-grade serving topology, how a new model version earns its way into production, and what it costs to serve. I wanted that whole path to be concrete and reproducible on hardware I own, so I built it: a text-toxicity classifier that goes train → register → export → serve → canary → promote (or roll back), with a feedback loop that routes user corrections back into training data.

Two design rules shaped everything:

* **The model is intentionally trivial.** DistilBERT fine-tuned on the Jigsaw toxicity dataset, six sigmoid labels (`toxic`, `severe_toxic`, `obscene`, `threat`, `insult`, `identity_hate`). The interesting work is the platform — the model could be swapped for anything without changing the machinery around it.
* **Everything is a script or a manifest.** No console click-ops. Bootstrap, deploy, query, canary, promote, and roll back are all runnable commands, and the scripts are idempotent.

## Two clusters, one set of manifests

The demo runs in two acts. Both clusters are k3s, both install the same platform stack from a single shared script — the only differences are the Triton backend, the node selector, and the autoscaler trigger.

| | Act 1 — CPU (laptop) | Act 2 — GPU (workstation) |
|:---|:---|:---|
| Cluster | `mlops-cpu` (k3s) | `mlops-gpu` (k3s on bare metal) |
| Runtime | Triton + ONNX backend | Triton + TensorRT (fp16 plan, sm_75) |
| Autoscaler signal | Triton queue depth | Triton queue depth + DCGM GPU util |
| Headline demo | Autoscaling, canary | GPU cost optimization, autoscaling, canary |

The point of running identical manifests on very different hardware is that CPU-vs-GPU serving cost and autoscaling behavior can be compared honestly, without "well, the configs also differ" caveats.

## The stack

| Layer | Choice | Why |
|:---|:---|:---|
| Orchestration | k3s (both clusters) | Same runtime in dev and prod-like envs |
| Model serving | KServe (RawDeployment mode) | De-facto standard CRD; portable |
| Inference runtime | NVIDIA Triton (both) | One runtime, one config format |
| CPU backend | ONNX Runtime via Triton | Runtime-agnostic; no version mismatch |
| GPU backend | TensorRT via Triton | First-class TRT backend in KServe |
| Experiment tracking | MLflow + MinIO | Artifact + param/metric registry |
| Autoscaling | KEDA | Scales on Prometheus queries |
| Progressive delivery | Argo Rollouts | Canary with Prometheus `AnalysisTemplate` |
| Service mesh | Istio (minimal) | Traffic split for Argo Rollouts |
| Observability | kube-prometheus-stack | Prometheus + Grafana |
| GPU metrics | NVIDIA DCGM exporter | Per-pod `DCGM_FI_DEV_GPU_UTIL` |

Bringing a cluster up from bare metal is one command per machine:

```bash
sudo -E ./infra/cpu-cluster/bootstrap.sh   # laptop
sudo -E ./infra/gpu-cluster/bootstrap.sh   # workstation
```

The GPU bootstrap additionally preps the NVIDIA container toolkit, installs the GPU Operator (device plugin + DCGM exporter), and runs an `nvidia-smi` smoke test from inside a pod before touching the platform stack.

## The full loop

**Train and register.** Training runs on the host against the in-cluster MLflow over a port-forward. With the promotion gate enabled, a run only gets registered in the model registry if it beats the current production metric:

```bash
cd training
MLFLOW_REGISTER_MODEL=true MLFLOW_PROMOTE_MODEL=true \
  .venv/bin/python -m training.train
```

**Export and stage.** `serving/gpu/build-model-repo.sh` pulls the run's artifact from MLflow, exports ONNX with INT32 inputs (TensorRT requires INT32; the CPU path keeps INT64 — the export wraps the model to cast INT32→INT64 before the embedding layer), then bakes the TensorRT engine in a Kubernetes Job running the *same* Triton 23.05 image that will serve it. Baking the plan inside the serving container sidesteps host TensorRT version skew, at the cost of ~10 minutes of image pull on first deploy.

**Serve.** Both predictors are Argo Rollouts (plain KServe InferenceServices turned out to be a dead end here — more on that below) fronted by an Istio ingress gateway with a VirtualService splitting stable/canary traffic.

**Autoscale.** KEDA ScaledObjects scale the rollout on Prometheus queries: Triton queue depth on CPU (1–3 replicas), queue depth plus DCGM GPU utilization on GPU (1–2 replicas, one pod per GPU on the single-node cluster).

**Canary the next version.** Retrain, then one script validates the run, builds the v2 model repo, deploys the canary, and optionally promotes:

```bash
./serving/gpu/canary/promote-and-canary.sh <run-id> --promote
kubectl argo rollouts get rollout toxicity-gpu --watch
```

Traffic shifts 5% → 25% → 50% → 100%, and at each step an Argo `AnalysisRun` checks canary Triton metrics (filtered to `version="2"`) against Prometheus gates. Fail a gate and the rollout aborts back to stable; `./serving/gpu/rollback.sh` is the manual escape hatch. On the 2-GPU node, `setCanaryScale: 1` plus a wrapper that pauses KEDA at 1 replica keeps stable + canary from fighting over the second GPU.

**Close the feedback loop.** A small FastAPI UI (`frontend/`) accepts raw text, does the tokenization Triton doesn't, returns per-label scores, and logs every input with a UUID. Users who disagree with a prediction submit their own labels; `export_feedback.py` joins prediction and feedback logs into Jigsaw-schema CSVs, and training appends them to the Jigsaw split when `FEEDBACK_CSV_DIR` is set. The promotion gate and canary pipeline are unchanged — corrections flow through exactly the same gauntlet as any new training run.

## Takeaways

The model was never the point. What I wanted was a place where the unglamorous questions have runnable answers: how does an artifact get from `mlflow.register` to serving traffic, what does a new version have to prove before it takes over, what does an inference actually cost on CPU vs. GPU, and how do real user corrections get back into training. Having it all on homelab hardware means every claim in the README is something I ran, broke, and fixed — and the next model I care about can inherit the whole path by swapping one training script.
