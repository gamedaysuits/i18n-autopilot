# Scoring Specification

> **Executive Summary.** This is the single source of truth for all evaluation metrics, composite scoring, quality tiers, and cost analysis in the Rosetta MT evaluation ecosystem. Every metric computed by the harness, every weight in the composite formula, and every tier threshold is defined here — and only here. Code, documentation, and database schemas derive from this document. When they conflict, this document is authoritative.
>
> **Scope.** This document defines *what* we measure and *how we score it*. It does not define the run card schema (see BENCHMARK_SPEC §3), the benchmark protocol (BENCHMARK_SPEC §6), or the leaderboard rules (see arena docs). Those documents reference this one for metric definitions and scoring logic.
>
> Last updated: 2026-05-26

---

## 1. Scoring Philosophy

### 1.1 Automated Metrics Are Proxies

Every metric defined here is machine-computed. They are useful for rapid iteration, systematic comparison, and detecting regressions. They are **not substitutes for human judgment**. The quality tiers in §5 are heuristic labels — only human review can confirm actual usability.

### 1.2 Multi-Signal Design

No single metric captures translation quality. A translation can have perfect chrF++ overlap but fail morphological validation. It can pass FST checks but carry the wrong meaning. It can be semantically accurate but stylistically alien to the target language. The composite score in §4 aggregates multiple independent signals, each capturing a different dimension of quality.

### 1.3 Extensibility

This metric inventory is not closed. New languages bring new requirements: tone accuracy for tonal languages, diacritical precision for Semitic scripts, syllabary correctness for Cree. The architecture (MetricPlugin protocol, weighted composite with re-normalization) is designed for metrics to be added without breaking existing scores.

### 1.4 Three Dimensions of Evaluation

Every run card measures three independent dimensions:

```
Quality   — How good is the translation?   (composite score, §4)
Cost      — How much does it cost?          (cost metrics, §6)
Speed     — How fast does it run?           (speed metrics, §7)
```

These are independent axes. A method can be high-quality but expensive, fast but inaccurate, or any combination. The leaderboard enables sorting by any dimension. The cost-adjusted score (§6.3) is the only metric that combines dimensions.

---

## 2. Metric Inventory

Metrics are organized into four categories. Each metric has an implementation status, scale, and level (per-entry, corpus-level, or both).

### 2.1 Surface Metrics

Surface metrics compare the predicted translation to the reference translation at the string level. They require no linguistic tools — just string comparison.

| ID | Metric | Status | Scale | Level | Implementation |
|----|--------|--------|-------|-------|---------------|
| `exact_match_rate` | Exact Match | ✅ Implemented | 0.0–1.0 | Both | Binary: does predicted == reference? Corpus rate = matches / total. |
| `equivalent_match_rate` | Equivalent Match | ⚡ Partial | 0.0–1.0 | Both | Does the predicted output match any accepted variant? For CRK: implemented via `CrkLinterMetric` plugin using deterministic variant-class rules (word order, orthographic, optional particle, lemma synonym, progressive ambiguity). Generic cross-language implementation requires per-entry `variants[]` in corpus. |
| `chrf_plus_plus` | chrF++ | ✅ Implemented | 0–100 | Both | Character n-gram F-score (sacrebleu). Robust to morphological variation. The primary surface metric for agglutinative/polysynthetic languages. Per-entry uses `sentence_chrf`; corpus uses `corpus_chrf`. |
| `bleu` | BLEU | ✅ Implemented | 0–100 | Corpus | Word-level n-gram precision (sacrebleu). **Excluded from composite** — word-level scoring penalizes morphological variation unfairly. Computed and reported for compatibility with MT literature. |
| `ter` | Translation Edit Rate | 🔲 Planned | 0–∞ (lower is better) | Both | Minimum edit distance between predicted and reference, normalized by reference length (sacrebleu `corpus_ter`). Already available in our sacrebleu dependency. |
| `length_ratio` | Length Ratio | 🔲 Planned | 0–∞ (1.0 is ideal) | Both | `len(predicted) / len(reference)` in characters. Detects truncation (<0.5) and inflation/hallucination (>2.0). Trivial to implement. |

### 2.2 Structural Metrics

Structural metrics validate the linguistic well-formedness of the translation. They require language-specific tools (FST analyzers, morphological parsers) and are the strongest signals for morphologically rich languages.

| ID | Metric | Status | Scale | Level | Implementation |
|----|--------|--------|-------|-------|---------------|
| `fst_acceptance_rate` | FST Acceptance | ✅ Implemented | 0.0–1.0 | Both | Proportion of output words accepted by a finite-state transducer (GiellaLT). A word is "valid" if the FST returns at least one morphological analysis. Available for any language with a GiellaLT `.hfstol` analyzer. |
| `morphological_accuracy` | Morphological Accuracy | 🔲 Planned | 0.0–1.0 | Both | A word can be FST-valid but have the wrong inflection (right root, wrong suffix). This metric compares the FST analysis of the predicted word against the expected morphological features. Requires per-entry morphological annotations in the corpus. |
| `orthographic_accuracy` | Orthographic Accuracy | 🔲 Planned | 0.0–1.0 | Both | Validates script-specific correctness: SRO macron/circumflex usage for Cree, diacritical marks for Inuktitut, vowel length markers for Ojibwe. Per-language rule sets. |

### 2.3 Semantic Metrics

Semantic metrics measure meaning preservation using embeddings or learned models. They catch translations that are surface-different but meaning-equivalent, and flag translations that are surface-similar but semantically wrong.

| ID | Metric | Status | Scale | Level | Implementation |
|----|--------|--------|-------|-------|---------------|
| `semantic_score` | Semantic Similarity | 🔲 Planned | 0.0–1.0 | Both | Cosine similarity of sentence embeddings (source + predicted vs source + reference). Model TBD — must support low-resource languages, which rules out most English-centric embedding models. |
| `comet_score` | COMET | ✅ Implemented | ~0.0–1.0 | Both | Learned MT evaluation metric (Unbabel). Trained on human quality judgments. **Excluded from composite** — training data is biased toward high-resource European languages; scores for LRLs are unreliable. Computed when `unbabel-comet` is installed. Reported with a low-resource warning flag. |

> **Why COMET is excluded from the composite.** COMET is trained on WMT human evaluation data, which is overwhelmingly high-resource European language pairs. When applied to Plains Cree or other LRLs, the model's internal representations have no exposure to those languages — it's extrapolating from languages with fundamentally different morphological systems. The scores are still directionally useful (higher COMET ≈ more fluent-sounding output in general) but the absolute values are not calibrated. We report COMET for transparency but don't let it influence the composite score until we can validate it against human judgments for each target language.

### 2.4 Behavioral Metrics

Behavioral metrics detect specific failure modes in translation output. They don't measure quality directly — they detect problems.

| ID | Metric | Status | Scale | Level | Implementation |
|----|--------|--------|-------|-------|---------------|
| `code_switching_rate` | Code-Switching Rate | 🔲 Planned | 0.0–1.0 (lower is better) | Both | Proportion of output words that are in the source language (typically English). Detected via Unicode script analysis and/or a source-language word list. Very common LLM failure mode: the model inserts English words when it doesn't know the target-language equivalent. |
| `hallucination_rate` | Hallucination Rate | 🔲 Planned | 0.0–1.0 (lower is better) | Both | Proportion of output content that has no corresponding source content. Detected via word alignment or cross-lingual embedding overlap. Catches the model generating plausible-sounding but fabricated translations. |
| `terminology_adherence` | Terminology Adherence | 🔲 Planned | 0.0–1.0 | Both | For coached methods: proportion of prescribed terminology terms that appear in the output. Requires coaching dictionary data. Measures whether the model respects expert-provided vocabulary. |
| `consistency_score` | Cross-Entry Consistency | 🔲 Planned | 0.0–1.0 | Corpus only | Does the model translate the same source term the same way across entries? Low consistency suggests the model is guessing rather than applying learned patterns. Requires repeated terms across corpus entries. |

### 2.5 Compliance Metrics

Compliance metrics validate that translations preserve structural integrity — placeholders, formatting, and typography conventions. They are quality-gate checks, not quality scores.

| ID | Metric | Status | Scale | Level | Implementation |
|----|--------|--------|-------|-------|---------------|
| `compliance_index` | Double-Pass Compliance | ✅ Implemented | 0.0–1.0 | Both | Weighted composite: 60% variable integrity (are `{placeholder}` vars preserved?) + 20% quote compliance (correct quote characters per language card) + 20% casing compliance (no Latin letter leakage for caseless languages). Computed on both raw and post-processed output. Via `DoublePassCompliancePlugin`. |
| `repair_effectiveness` | Repair Effectiveness | ✅ Implemented | 0.0–1.0 | Corpus | Proportion of compliance violations that were automatically repaired by post-translation hooks. Measures how much the quality gate improved the raw output. |

> **Why compliance is not in the composite.** Compliance metrics measure structural preservation (placeholders, quotes), not translation quality. A translation can be perfect linguistically but fail compliance because it dropped a `{name}` variable. These are quality gates — they block bad output from shipping, but they don't rank translation quality.

---

## 3. Metric Status Tiers

Every metric in §2 falls into one of three implementation tiers:

| Tier | Meaning | Run Card Behavior |
|------|---------|-------------------|
| **✅ Implemented** | Code exists, tested, producing values in run cards today | Numeric value in run card |
| **🔲 Planned** | Specified but not yet implemented | `null` in run card (field present, value absent) |
| **💡 Proposed** | Under discussion, not yet specified | Not in run card |

A metric moves from Planned → Implemented when:
1. Implementation is merged and tested
2. It has been validated on at least one real evaluation run
3. This document is updated with its implementation details

A metric moves from Proposed → Planned when:
1. Its definition, scale, and computation method are agreed upon
2. It is added to this document with a `🔲 Planned` status
3. A null placeholder is added to the run card schema

---

## 4. Composite Score

### 4.1 Formula

The composite score is a weighted average of all *available* metrics, re-normalized so the weights of available metrics sum to 1.0:

```
composite = Σ (weight_i × value_i)    for all available metrics
             ─────────────────────
             Σ weight_i               (re-normalization denominator)
```

A metric is "available" if its value in the run card is a number (not `null`). When a metric is unavailable — because the language has no FST, or because a metric is not yet implemented — its weight is redistributed proportionally across the remaining metrics.

**This means the composite is always comparable within a run:** it uses whatever metrics are available and normalizes accordingly. Cross-run comparison is valid when runs use the same set of available metrics.

### 4.2 Input Normalization

Before entering the composite formula, all metrics must be on a **0.0–1.0 scale** where 1.0 = perfect:

| Metric | Native Scale | Normalization |
|--------|-------------|---------------|
| `exact_match_rate` | 0.0–1.0 | None (already normalized) |
| `equivalent_match_rate` | 0.0–1.0 | None |
| `fst_acceptance_rate` | 0.0–1.0 | None |
| `morphological_accuracy` | 0.0–1.0 | None |
| `chrf_plus_plus` | 0–100 | **Divide by 100** |
| `semantic_score` | 0.0–1.0 | None |
| `code_switching_rate` | 0.0–1.0 (lower = better) | **`1.0 - value`** (invert: 0% code-switching = 1.0) |
| `hallucination_rate` | 0.0–1.0 (lower = better) | **`1.0 - value`** (invert) |
| `terminology_adherence` | 0.0–1.0 | None |

Metrics excluded from the composite (`bleu`, `comet_score`, `ter`, `length_ratio`, `consistency_score`) are not normalized for this purpose.

### 4.3 Weight Tables

#### Profile A: Languages WITH FST Coverage

For languages that have a GiellaLT finite-state transducer available. Structural metrics carry 50% of the composite, reflecting the primacy of morphological correctness for polysynthetic/agglutinative languages.

| Metric | Target Weight | Rationale |
|--------|--------------|-----------|
| `fst_acceptance_rate` | **0.25** | Highest weight. If the FST rejects a word, it's not a valid form in the language — regardless of what other metrics say. Binary, structurally grounded. |
| `morphological_accuracy` | **0.15** | A word can be FST-valid but morphologically wrong (right root, wrong inflection). Together with FST, structural metrics carry 40%. |
| `chrf_plus_plus` | **0.15** | Character n-gram overlap: the best surface-level proxy for polysynthetic languages. Handles agglutinative morphology better than word-level metrics. |
| `semantic_score` | **0.15** | Meaning preservation when surface form diverges. Catches semantically wrong translations that pass structural checks. |
| `equivalent_match_rate` | **0.10** | Rewards acceptable variants, not just the one reference translation. Important for languages with flexible word order. |
| `code_switching_rate` | **0.05** | Penalizes source-language leakage. Inverted: 0% code-switching = 1.0. |
| `terminology_adherence` | **0.05** | Rewards coached methods that respect prescribed vocabulary. Only active when coaching data is present. |
| `hallucination_rate` | **0.05** | Penalizes fabricated content. Inverted: 0% hallucination = 1.0. |
| `exact_match_rate` | **0.05** | Lowest weight. Too strict for polysynthetic languages — multiple correct translations exist. Kept as a ceiling check. |

> **Total: 1.00.** When metrics are unavailable, their weights are redistributed proportionally across available metrics. For example, if only `fst_acceptance_rate`, `chrf_plus_plus`, and `exact_match_rate` are available (current state), the effective weights become:
> - FST: 0.25/0.45 = 0.556
> - chrF++: 0.15/0.45 = 0.333
> - EM: 0.05/0.45 = 0.111

#### Profile B: Languages WITHOUT FST Coverage

For languages without morphological validation tools. Semantic and surface metrics carry equal weight.

| Metric | Target Weight | Rationale |
|--------|--------------|-----------|
| `semantic_score` | **0.25** | Without structural validation, meaning preservation is the strongest available signal. |
| `chrf_plus_plus` | **0.25** | Without FST, character-level overlap becomes the primary surface check. |
| `equivalent_match_rate` | **0.15** | Variant matching provides structured quality assessment without requiring morphological tools. |
| `exact_match_rate` | **0.10** | Without FST, exact match carries more weight as the only structural validation proxy. |
| `code_switching_rate` | **0.10** | Source language leakage matters more when there's no FST to catch bad output. |
| `terminology_adherence` | **0.05** | Coached vocabulary compliance. |
| `hallucination_rate` | **0.05** | Fabricated content detection. |
| `orthographic_accuracy` | **0.05** | Script-specific correctness fills part of the gap left by absent FST. |

> **Note on weight evolution.** These weights are provisional and will be recalibrated as human validation data accumulates. The long-term goal is to derive weights empirically: which automated metrics best predict human quality judgments for each language family?

### 4.4 Adding a New Metric to the Composite

To add a new metric to the composite:

1. **Define it** in §2 with status `🔲 Planned`, including scale, level, and computation method.
2. **Implement it** as a MetricPlugin (or in `tester.py` for core metrics).
3. **Add a null placeholder** in the run card scores block.
4. **Assign it a target weight** in §4.3 by adjusting existing weights downward. Weights must sum to 1.00.
5. **Update BENCHMARK_SPEC.md** §3 if the run card schema changes.
6. **Update `scoring.py`** weight tables (the code must mirror this document).
7. **Run a validation benchmark** to confirm the metric produces sensible values on real data.
8. **Update this document** to change status from `🔲` to `✅`.

---

## 5. Quality Tiers

These tiers are heuristic labels on automated composite scores. They describe what the scores tend to mean in practice, based on human review of outputs at each level. **They are not validated quality judgments** — only human review can confirm actual usability.

| Tier | Composite Range | What a Speaker Typically Sees |
|------|----------------|-------------------------------|
| **Baseline** | 0.00–0.30 | Raw LLM output with no language-specific support. Morphology is mostly hallucinated. |
| **Emerging** | 0.30–0.50 | Some correct patterns appearing. Coaching is helping, but output is not reliable. |
| **Functional** | 0.50–0.70 | Output is recognizable to a speaker. Major grammatical categories usually correct. Frequent morphological errors. |
| **Deployable** | 0.70–0.85 | Suitable for draft translation with human review. Most morphology is correct. |
| **Fluent** | 0.85–1.00 | Approaching competent human translation. Errors are rare and minor. |

These tiers are provisional. They will be recalibrated as human validation data accumulates and we learn where the "a speaker finds this useful" threshold actually falls for each language. No method can claim **Deployable** or above without community review confirming bilingual speakers agree the output is usable.

### 5.1 Tier Thresholds (Machine-Readable)

For code implementations, the thresholds are (evaluated top-down, first match wins):

```
composite >= 0.85  →  "fluent"
composite >= 0.70  →  "deployable"
composite >= 0.50  →  "functional"
composite >= 0.30  →  "emerging"
composite >= 0.00  →  "baseline"
composite is null  →  "unscored"
```

---

## 6. Cost Metrics

Cost metrics measure the financial efficiency of a translation method. They are reported separately from quality — cost does not influence the composite score (except in the cost-adjusted secondary ranking).

### 6.1 Token Metrics

| ID | Metric | Computation |
|----|--------|-------------|
| `prompt_tokens` | Total input tokens | Sum of `usage.prompt_tokens` across all API calls |
| `completion_tokens` | Total output tokens | Sum of `usage.completion_tokens` |
| `reasoning_tokens` | Chain-of-thought tokens | Sum of `usage.completion_tokens_details.reasoning_tokens` (0 for most models) |
| `cached_tokens` | Provider-cached tokens | Sum of `usage.prompt_tokens_details.cached_tokens` |
| `total_tokens` | Total tokens consumed | `prompt_tokens + completion_tokens` |
| `tokens_per_entry` | Average tokens per translation | `total_tokens / entry_count` |

### 6.2 Cost Metrics

| ID | Metric | Computation | Use Case |
|----|--------|-------------|----------|
| `total_cost_usd` | Total run cost | Provider-reported pricing × token counts | "How much did this benchmark cost?" |
| `cost_per_entry_usd` | Cost per corpus entry | `total_cost_usd / entry_count` | Comparing methods on the same corpus |
| `cost_per_1k_tokens` | Cost per 1,000 tokens | `total_cost_usd / total_tokens × 1000` | Universal LLM efficiency — comparable across corpora |
| `cost_per_source_char` | Cost per source character | `total_cost_usd / total_source_chars` | Comparable across languages with different tokenization |

> **Why multiple cost metrics?** An "entry" varies in length — a 3-word phrase costs less than a paragraph. `cost_per_entry_usd` is useful for comparing methods on the *same* corpus (same entries = same lengths = fair comparison). `cost_per_1k_tokens` is the standard LLM efficiency metric, comparable *across* corpora. `cost_per_source_char` normalizes for tokenization differences — the same sentence may tokenize into different numbers of tokens depending on the model's vocabulary.

### 6.3 Cost-Adjusted Score

For methods using paid APIs, we compute a secondary ranking:

```
cost_adjusted = composite / log2(1 + cost_per_entry_usd × 1000)
```

This rewards methods that achieve good scores efficiently. It uses `cost_per_entry_usd` (not per-token) because the cost-adjusted score is always computed within a single benchmark (same corpus), making per-entry comparison fair.

The cost-adjusted score is a **secondary ranking** — the primary leaderboard ranks by composite score. It answers a different question: "given a budget, which method gives the best results?"

---

## 7. Speed Metrics

Speed metrics measure the latency and throughput of a translation method. Like cost, speed does not influence the composite score.

| ID | Metric | Computation | Level |
|----|--------|-------------|-------|
| `elapsed_seconds` | Wall-clock run duration | `time_end - time_start` | Run |
| `avg_latency_seconds` | Mean per-entry latency | `Σ latency_s / n_entries` | Corpus |
| `median_latency_seconds` | Median per-entry latency | 50th percentile of `latency_s` | Corpus |
| `p95_latency_seconds` | 95th percentile latency | 95th percentile of `latency_s` | Corpus |
| `tokens_per_second` | Throughput | `total_tokens / elapsed_seconds` | Run |
| `entries_per_minute` | Translation rate | `entry_count / (elapsed_seconds / 60)` | Run |

---

## 8. Confidence and Significance

### 8.1 Bootstrap Confidence Intervals

All key metrics support bootstrap confidence intervals (percentile method, n=1000 resamples, α=0.05):

| Metric | CI Reported |
|--------|------------|
| `chrf_plus_plus` | ✅ `chrf_ci_lower`, `chrf_ci_upper` |
| `exact_match_rate` | ✅ `exact_match_ci_lower`, `exact_match_ci_upper` |
| `fst_acceptance_rate` | 🔲 Planned |
| `comet_score` | 🔲 Planned (metric function exists in `metrics_comet.py` but not wired into `compute_all_cis()`) |
| `composite` | 🔲 Planned |

### 8.2 Paired Bootstrap Significance Tests

For comparing two methods, the harness computes paired bootstrap resampling tests:

```
H₀: The two methods perform equally on this corpus.
H₁: One method is significantly better.
```

If the p-value < 0.05 and the confidence interval of the difference excludes zero, the difference is statistically significant at the 95% level.

---

## 9. Run Card Scores Schema

This section defines the hierarchical structure of the `scores` block in a run card. This schema is derived from the metrics defined in §2–§7 and must be kept in sync.

```jsonc
{
  "scores": {
    // §2.1 Surface metrics
    "exact_match_rate":       0.6613,       // 0.0–1.0
    "exact_matches":          41,           // count
    "equivalent_match_rate":  null,         // 🔲 planned
    "equivalent_matches":     null,         // 🔲 planned
    "chrf_plus_plus":         80.65,        // 0–100 (sacrebleu native scale)
    "bleu":                   54.78,        // 0–100, NOT in composite
    "ter":                    null,         // 🔲 planned, 0–∞ (lower=better)
    "length_ratio":           null,         // 🔲 planned, ideal=1.0

    // §2.2 Structural metrics
    "fst_acceptance_rate":    1.0,          // 0.0–1.0
    "fst_accepted":           74,           // count
    "morphological_accuracy": null,         // 🔲 planned
    "orthographic_accuracy":  null,         // 🔲 planned

    // §2.3 Semantic metrics
    "semantic_score":         null,         // 🔲 planned
    "comet_score":            null,         // nullable, NOT in composite
    "comet_model":            "",           // model ID used for COMET

    // §2.4 Behavioral metrics
    "code_switching_rate":    null,         // 🔲 planned (lower=better)
    "hallucination_rate":     null,         // 🔲 planned (lower=better)
    "terminology_adherence":  null,         // 🔲 planned
    "consistency_score":      null,         // 🔲 planned

    // §4 Composite
    "composite":              0.8988,       // 0.0–1.0
    "quality_tier":           "fluent",     // §5 tier label
    "cost_adjusted":          null,         // §6.3 secondary ranking

    // §8.1 Confidence intervals
    "confidence_intervals": {
      "chrf_plus_plus":     { "ci_lower": 78.2, "ci_upper": 83.1 },
      "exact_match_rate":   { "ci_lower": 0.54, "ci_upper": 0.78 }
    },

    // Breakdowns
    "by_difficulty":          {},           // scores grouped by difficulty tier
    "by_provenance":          {},           // scores grouped by entry provenance

    // Counts
    "total":                  62,
    "evaluated":              62,
    "errors":                 0
  },

  "cost": {
    "total_cost_usd":         1.7114,
    "cost_per_entry_usd":     0.027603,
    "cost_per_1k_tokens":     0.00848,
    "cost_per_source_char":   null          // 🔲 needs source char counting
  },

  "speed": {
    "elapsed_seconds":        45.2,
    "avg_latency_seconds":    0.234,
    "median_latency_seconds": 0.190,
    "p95_latency_seconds":    0.415,
    "tokens_per_second":      null,         // 🔲 needs total_tokens / elapsed
    "entries_per_minute":     null          // 🔲 needs entry_count / (elapsed/60)
  },

  "tokens": {
    "prompt_tokens":          13985,
    "completion_tokens":      187822,
    "reasoning_tokens":       175726,
    "cached_tokens":          0,
    "total_tokens":           201807,       // prompt + completion
    "tokens_per_entry":       3255          // total / entry_count
  }
}
```

### 9.1 Schema–Database Mapping

The run card JSON is stored in full as a `jsonb` column in Supabase. Key metrics are also denormalized into top-level columns for sort/filter performance:

| Run Card Field | Supabase Column | Type | Index |
|---------------|----------------|------|-------|
| `scores.composite` | `composite_score` | `real` | `idx_composite` |
| `scores.quality_tier` | `quality_tier` | `text` | — |
| `scores.chrf_plus_plus` | `chrf_plus_plus` | `real` | `idx_leaderboard` |
| `scores.exact_match_rate` | `exact_match_rate` | `real` | — |
| `scores.fst_acceptance_rate` | `fst_acceptance_rate` | `real` | — |
| `scores.bleu` | `corpus_bleu` | `real` | — |
| `scores.comet_score` | `comet_score` | `real` | — |
| `cost.total_cost_usd` | `total_cost_usd` | `real` | — |
| `cost.cost_per_1k_tokens` | `cost_per_1k_tokens` | `real` | — |
| `speed.avg_latency_seconds` | `avg_latency_seconds` | `real` | — |
| `model_slug` | `model_slug` | `text` | `idx_model` |
| `condition` | `condition` | `text` | — |
| `dataset.id` | `dataset_id` | `text` | `idx_leaderboard` |
| `dataset.language_pair` | `language_pair` | `text` | — |
| `fingerprint.hash` | `fingerprint_hash` | `text` | `idx_fingerprint` |
| *(full card)* | `run_card` | `jsonb` | — |

When new metrics are implemented, the corresponding column should be added via a numbered migration in `gds-mt-eval-harness/migrations/`.

---

## 10. Code–Spec Synchronization

### 10.1 Canonical Source

This document (`docs/SCORING_SPEC.md`) is the canonical source for:
- Metric definitions (§2)
- Composite weight tables (§4.3)
- Quality tier thresholds (§5.1)
- Cost metric formulas (§6.2)
- Run card scores schema (§9)

### 10.2 Code Mirror

The file `gds-mt-eval-harness/mt_eval_harness/scoring.py` mirrors the weight tables and tier thresholds from this document. It is the **code implementation** of §4.3 and §5.1. When this document is updated:

1. Update `scoring.py` to match
2. Run `pytest tests/test_scoring_ssot.py` to validate alignment
3. Update FAQ and website docs that summarize the weights

### 10.3 Documents That Reference This Spec

| Document | What It References | How to Keep in Sync |
|----------|-------------------|---------------------|
| `docs/BENCHMARK_SPEC.md` §4–§5 | Composite formula, weight tables, tier thresholds | Cross-reference this doc; do not duplicate tables |
| `website/docs/getting-started/faq.md` | Simplified weight summary | Must match §4.3; link back to this doc |
| `docs/AGENTS.md` | Quality tier names + thresholds | Must match §5 |
| `docs/HOW_IT_WORKS.md` | Deployable threshold | Must match §5 |
| `publish.py` via `scoring.py` | Weight dicts + tier function | Automated test validates match |

---

## Appendix A: Metrics NOT in Composite (and Why)

| Metric | Why Excluded |
|--------|-------------|
| **BLEU** | Word-level scoring penalizes morphological variation in polysynthetic languages. A minor inflectional difference (correct meaning, slightly different suffix) counts as a complete miss. chrF++ handles this better at the character level. |
| **COMET** | Trained on WMT data (high-resource European pairs). Scores for LRLs are unreliable — the model is extrapolating from languages with different morphological systems. Reported for transparency, not for scoring. |
| **TER** | Edit distance correlates with chrF++ for most use cases. Including both would double-count surface similarity. TER is reported for reference. |
| **Length Ratio** | A diagnostic, not a quality signal. A ratio of 1.02 and a ratio of 0.98 are both fine. Only extreme values indicate problems. |
| **Consistency Score** | Corpus-level only — no per-entry value to aggregate. Also, some inconsistency is legitimate (same English word → different target-language translations depending on context). |
| **Compliance Index** | Quality gate, not quality signal. Measures structural preservation (placeholders, quotes), not translation accuracy. |

## Appendix B: Language-Specific Metric Implementations

Some metrics have language-specific implementations that predate the generic harness metrics:

| Language | Plugin | Metric | Notes |
|----------|--------|--------|-------|
| CRK (Plains Cree) | `CrkLinterMetric` | `equivalent_match_rate` | Deterministic variant-class rules: word order, orthographic, optional particle, lemma synonym, progressive ambiguity, inclusive/exclusive. Produces per-entry `lint_verdict` (EXACT/EQUIVALENT/MISS/NO_OUTPUT). |
| CRK | `CrkFSTMetric` | `fst_acceptance_rate` | Superseded by `GiellaLTFSTMetric` but produces identical results. |
| CRK | `CrkSemanticMetric` | Semantic validation | Deterministic: FST lemma extraction + dictionary glosses + spaCy content-word overlap. Produces verdicts (EXACT_MATCH/VALID/WRONG_ORDER/PARTIAL/INCOMPLETE/WRONG/NO_OUTPUT). |
| GiellaLT langs | `GiellaLTFSTMetric` | `fst_acceptance_rate` | Generic: works for CRK, SME, SMA, SMJ, SMN, SMS, FIN, NOB, IKU — any language with a `.hfstol` analyzer. |

When a language has a specific implementation, it takes precedence over the generic. The generic implementation is the fallback for languages without specialized tooling.

## Appendix C: Metrics Under Consideration

These are ideas being evaluated but not yet specified enough for §2:

| Idea | What It Would Measure | Blockers |
|------|----------------------|----------|
| Fluency (LM perplexity) | Is the output well-formed prose in the target language? | Requires a target-language LM. No good models exist for most LRLs. |
| Register match | Does the translation match the expected formality level? | Requires sociolinguistic classifiers. Research problem. |
| Cultural appropriateness | Are cultural references handled correctly? | Cannot be automated — inherently requires human review. |
| Discourse coherence | Do consecutive translations form a coherent passage? | Requires document-level evaluation, not sentence-level. |
