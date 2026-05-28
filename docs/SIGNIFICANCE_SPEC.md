# Statistical Significance Testing — Implementation Spec

> **Target codebase**: `gds-mt-eval-harness` (specifically `tester.py` and `compare.py`)
> **Purpose**: Enable researchers to determine whether the difference between two evaluation runs is statistically significant or just noise.
> **Priority**: High — this is the single most important missing feature for publishable results.

---

## Why This Matters

When comparing two runs (e.g., Gemini 3.1 Pro chrF++ 42.96 vs Claude Sonnet chrF++ 41.80 on 92 entries), we currently cannot say whether the difference is real or noise. With only ~92 test entries, random variation can easily produce 1-2 point swings. Experts will ask for significance tests. We need to answer.

---

## Algorithm: Paired Bootstrap Resampling

This is the standard method used by SacreBLEU, MT-Lens, and WMT shared tasks. It's well-understood by MT researchers and produces results they trust.

### How It Works

Given two systems A and B evaluated on the same N test entries:

1. Compute the actual metric difference: `Δ = metric(A) - metric(B)`
2. Repeat `n_bootstrap` times (default 1000):
   a. Sample N entries **with replacement** from the shared test set
   b. Compute the metric for both A and B on this bootstrap sample
   c. Compute the bootstrap difference: `Δ_boot = metric(A_boot) - metric(B_boot)`
3. The p-value = fraction of bootstrap samples where `Δ_boot` has the opposite sign from `Δ`
4. If p-value < α (default 0.05), the difference is statistically significant

### Key Properties

- **Paired**: Both systems are evaluated on the same bootstrap sample, preserving entry-level correlation
- **Non-parametric**: No assumption about the distribution of scores
- **Standard**: This is exactly what `sacrebleu --paired-bs` does under the hood

---

## Important: sacrebleu Is a Hard Dependency

sacrebleu is currently listed under `[project.optional-dependencies]` and guarded by `try/except` in `tester.py`. **This should be changed.** An MT eval harness that cannot compute chrF++ or BLEU is not an MT eval harness. sacrebleu should be:

1. Moved to `[project.dependencies]` in `pyproject.toml`
2. Imported directly in `tester.py` (remove the `try/except HAS_SACREBLEU` guard)
3. Imported directly in the new `significance.py` module

The `HAS_SACREBLEU` conditional paths in `tester.py` should be removed — they make the code more complex for a scenario (running without sacrebleu) that should not be supported.

---

## Implementation Plan

### 1. Promote sacrebleu to hard dependency

**`pyproject.toml`**: Move `sacrebleu>=2.3` from `[project.optional-dependencies].metrics` to `[project.dependencies]`.

**`tester.py`**: Replace:
```python
# Optional: sacrebleu for chrF++ and BLEU
try:
    from sacrebleu.metrics import CHRF, BLEU
    HAS_SACREBLEU = True
except ImportError:
    HAS_SACREBLEU = False
```
With:
```python
from sacrebleu.metrics import CHRF, BLEU
```

Remove all `if HAS_SACREBLEU:` guards throughout `tester.py`.

---

### 2. New module: `mt_eval_harness/significance.py`

```python
"""
Statistical significance testing via paired bootstrap resampling.

Standard method used by WMT shared tasks, SacreBLEU, and MT-Lens.
Compares two runs on the same corpus to determine if the performance
difference is statistically significant.
"""

from __future__ import annotations

import random
from dataclasses import dataclass
from sacrebleu.metrics import CHRF, BLEU


@dataclass
class SignificanceResult:
    """Result of a paired bootstrap significance test."""
    metric_name: str           # e.g., "corpus_chrf", "exact_match_rate"
    system_a_score: float      # Score for system A
    system_b_score: float      # Score for system B
    delta: float               # A - B
    p_value: float             # Two-sided p-value
    n_bootstrap: int           # Number of bootstrap iterations
    confidence_level: float    # 1 - alpha
    significant: bool          # p_value < alpha
    winner: str | None         # "A", "B", or None if not significant
    ci_lower: float            # Lower bound of 95% CI on the delta
    ci_upper: float            # Upper bound of 95% CI on the delta


def paired_bootstrap(
    entries_a: list[dict],
    entries_b: list[dict],
    metric_fn: callable,
    n_bootstrap: int = 1000,
    alpha: float = 0.05,
    seed: int = 12345,
    metric_name: str = "metric",
) -> SignificanceResult:
    """Run paired bootstrap resampling significance test.

    Args:
        entries_a: Per-entry results from system A (from TestReport["entries"])
        entries_b: Per-entry results from system B (must be same length, same IDs)
        metric_fn: Function(list[dict]) -> float that computes the corpus-level
                   metric from a list of entry dicts. Must handle the entry format
                   from TestReport.
        n_bootstrap: Number of bootstrap iterations (1000 is standard)
        alpha: Significance level (0.05 = 95% confidence)
        seed: RNG seed for reproducibility (12345 matches SacreBLEU default)
        metric_name: Human-readable name for the metric being tested

    Returns:
        SignificanceResult with all fields populated.

    Raises:
        ValueError: If entries_a and entries_b have different lengths or IDs.
    """
    ...
```

### 3. Built-in metric functions

```python
def exact_match_rate(entries: list[dict]) -> float:
    """Compute exact match rate from a list of entry dicts."""
    non_error = [e for e in entries if not e.get("error")]
    if not non_error:
        return 0.0
    exact = sum(1 for e in non_error if e.get("exact_match"))
    return exact / len(non_error)


def corpus_chrf(entries: list[dict]) -> float:
    """Compute corpus-level chrF++ from a list of entry dicts."""
    chrf = CHRF(word_order=2)
    refs = [e["expected"] for e in entries if e.get("expected", "").strip()]
    hyps = [e["predicted"] if e.get("predicted", "").strip() else "EMPTY"
            for e in entries if e.get("expected", "").strip()]
    if not refs:
        return 0.0
    return chrf.corpus_score(hyps, [refs]).score


def corpus_bleu(entries: list[dict]) -> float:
    """Compute corpus-level BLEU from a list of entry dicts."""
    bleu = BLEU()
    refs = [e["expected"] for e in entries if e.get("expected", "").strip()]
    hyps = [e["predicted"] if e.get("predicted", "").strip() else "EMPTY"
            for e in entries if e.get("expected", "").strip()]
    if not refs:
        return 0.0
    return bleu.corpus_score(hyps, [refs]).score
```

### 4. Integration into `compare.py`

The existing `compare.py` already does side-by-side comparison of multiple TestReports. Add significance testing:

```python
# In compare_reports(), after computing deltas:
if len(reports) == 2:
    sig_results = run_significance_tests(reports[0], reports[1])
    comparison["significance"] = [asdict(r) for r in sig_results]
```

When more than 2 reports are compared, run pairwise significance tests for all pairs. Store results keyed by `"(run_a_id, run_b_id)"`.

### 5. CLI integration

Add a `--significance` flag to `mt-eval compare`:

```bash
# Compare two runs with significance testing
mt-eval compare report_a.json report_b.json --significance

# Custom bootstrap count
mt-eval compare report_a.json report_b.json --significance --n-bootstrap 5000
```

Also consider a standalone command:

```bash
# Quick significance check between two reports
mt-eval significance report_a.json report_b.json
```

### 6. Output format

**Console output:**
```
  Significance Tests (paired bootstrap, n=1000, α=0.05):

  Metric              A         B       Δ      p-value  Sig?
  ─────────────────── ──────── ──────── ─────── ──────── ────
  corpus_chrf         42.96    41.80    +1.16   0.142    No
  exact_match_rate     0.198    0.185   +0.013  0.381    No
  corpus_bleu          6.80     3.81    +2.99   0.018    Yes *
```

**JSON output** (added to comparison report):
```json
{
  "significance": [
    {
      "metric_name": "corpus_chrf",
      "system_a_score": 42.96,
      "system_b_score": 41.80,
      "delta": 1.16,
      "p_value": 0.142,
      "n_bootstrap": 1000,
      "confidence_level": 0.95,
      "significant": false,
      "winner": null,
      "ci_lower": -0.85,
      "ci_upper": 3.12
    }
  ]
}
```

### 7. Dashboard integration

If significance data is present in the comparison JSON, the dashboard should display it. Show a row in the comparison table with significance indicators (e.g., `*` for p < 0.05, `**` for p < 0.01). This is a nice-to-have, not blocking.

---

## Edge Cases and Validation

1. **Mismatched entries**: The two TestReports must have the same entry IDs. If they don't (e.g., one ran on a subset), only test significance on the intersection. Warn about excluded entries.

2. **Too few entries**: If N < 10, warn that significance tests are unreliable with so few entries. Still run them, but print the warning.

3. **Identical scores**: If both systems produce identical per-entry results, p_value should be 1.0 (no difference at all).

4. **Plugin metrics**: The significance module should also test any plugin metrics that appear in BOTH reports. Use a generic approach: if both reports have `plugin_metrics.crk_fst_validity.avg_fst_validity`, test it.

5. **Reproducibility**: The RNG seed must be logged in the output so results are exactly reproducible. Default to 12345 (matching SacreBLEU convention).

---

## What NOT to Build

- **No separate COMET significance**: COMET is now integrated as a corpus metric via `metrics_comet.py`. Bootstrap CIs are computed over COMET scores just like chrF++/BLEU. For pairwise COMET significance between two systems, use `comet-compare` from Unbabel.
- **No Bayesian analysis**: Stick to frequentist bootstrap. It's what the MT community expects and understands.
- **No multi-test correction**: When testing multiple metrics, don't apply Bonferroni or similar corrections. The convention in MT evaluation is to report raw p-values per metric and let the reader interpret.

---

## Files to Modify

| File | Change |
|---|---|
| `pyproject.toml` | Move sacrebleu from optional to hard dependency |
| `mt_eval_harness/tester.py` | Remove `HAS_SACREBLEU` guards, direct import |
| `mt_eval_harness/significance.py` | **[NEW]** Core implementation |
| `mt_eval_harness/__init__.py` | Export `SignificanceResult`, `paired_bootstrap` |
| `mt_eval_harness/compare.py` | Wire significance tests into report comparison |
| `mt_eval_harness/cli.py` | Add `--significance` and `--n-bootstrap` flags |
| `mt_eval_harness/dashboard.py` | Display significance in comparison table (nice-to-have) |
| `tests/test_significance.py` | **[NEW]** Unit tests |

---

## Testing Requirements

1. **Deterministic with seed**: Same inputs + same seed = same p-value, every time
2. **Known-answer test**: Two identical result sets → p_value = 1.0
3. **Known-significant test**: Construct two result sets where one is clearly better (e.g., all exact matches vs all misses) → p_value ≈ 0.0
4. **Mismatched IDs**: Should raise ValueError or warn and compute on intersection
5. **Empty inputs**: Should handle gracefully (return p_value = 1.0 or raise)

---

## Confidence Intervals (Companion Feature)

> **Status**: ✅ IMPLEMENTED in `confidence.py`

Confidence intervals (CIs) answer a different question from significance testing:

- **Significance testing** (`significance.py`): "Is the difference between system A and system B real?"
- **Confidence intervals** (`confidence.py`): "How uncertain is this system's score on its own?"

### Implementation: `confidence.py`

Uses the same percentile bootstrap resampling method as significance testing:

| Parameter | Value | Justification |
|---|---|---|
| `n_bootstrap` | 1000 | SacreBLEU default, WMT 2024 convention |
| `seed` | 12345 | SacreBLEU default seed for reproducibility |
| `alpha` | 0.05 | Standard 95% confidence level |
| Method | Percentile bootstrap | Koehn (2004), Efron (1979) |

### What Gets CIs

All corpus-level metrics computed by the harness:
- `corpus_chrf` (chrF++ score)
- `corpus_bleu` (BLEU score)
- `exact_match_rate` (0.0–1.0)

### CLI Flags

```bash
# Default: CIs are computed automatically
mt-eval test run_log.json

# Skip CI computation (faster, for quick iteration)
mt-eval test run_log.json --no-ci

# More bootstrap iterations (more precise, slower)
mt-eval test run_log.json --n-bootstrap-ci 2000
```

### Small Sample Warning

When N < 30 entries, the module emits a warning that CIs may have poor coverage. The bootstrap cannot create information absent from the sample — with very few entries, the intervals will be wide, correctly reflecting high uncertainty.

### COMET Integration

COMET (`metrics_comet.py`) is now integrated as a first-class metric:
- Model: `Unbabel/wmt22-comet-da` (WMT 2022 winning reference-based model)
- Automatically computed when `unbabel-comet` is installed
- Per-entry scores stored in TestReport entries
- Low-resource language detection via XLM-R coverage table
- Optional dependency: `pip install mt-eval-harness[comet]`

### Supabase Migration

New columns added to `run_cards` table:
- `comet_score` (FLOAT8, nullable)
- `corpus_bleu` (FLOAT8, nullable)
- `chrf_ci_lower` / `chrf_ci_upper` (FLOAT8, nullable)
- `exact_match_ci_lower` / `exact_match_ci_upper` (FLOAT8, nullable)

See `migrations/001_add_comet_and_ci_columns.sql` for the migration script.

