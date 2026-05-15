---
slug: v3-2-quality-infrastructure
title: "v3.2.0: Industrial-Grade Quality Infrastructure"
authors: [curtisforbes]
tags: [release]
date: 2026-05-14
---

v3.2.0 is the quality release. 702 tests, 163 test suites, zero tolerance for silent failures.

<!-- truncate -->

## What Changed

### Quality Gate (5 checks)

Every translation now passes through five deterministic validation checks before it's written to disk:

1. **Empty/blank** — Model returned nothing
2. **Source echo** — Model returned the English input
3. **Hallucination loop** — Repeated trigram patterns
4. **Length inflation** — Output 4×+ longer than source
5. **Script compliance** — Wrong script for the locale

No translation is written without passing all five checks. Failed translations are logged and retried.

### Retry Cascade

When a batch fails, rosetta retries with progressively smaller batches:

```
Full batch (30 keys) → parse error
  └→ Half batch (15 keys) → 2 failures
      └→ Individual keys (1 each) → isolates the problem keys
```

### Security Hardening

- **Prototype pollution guard** — `__proto__`, `constructor` keys rejected at parse time
- **Path traversal guard** — Crafted locale codes can't write outside configured directories
- **Response validation** — Only keys that were sent are accepted back

### Test Infrastructure

| Suite | Tests | What It Covers |
|-------|-------|---------------|
| Core (8 suites) | 280+ | Config, sync, CLI, watch, audit, pairs, format, init |
| Red team | 89 | Adversarial inputs, encoding attacks |
| Contract | 120 | API integration contracts |
| Performance | 36 | Batch optimization, throughput regression |
| Coverage | 702 total | Full pipeline |

### Prompt Caching

System messages are now split from user messages, enabling prompt cache hits on providers like Anthropic and Google. This significantly reduces token costs for multi-batch syncs.

See the [Quality Gate docs](/docs/concepts/quality-gate) and [Security docs](/docs/concepts/security) for the full technical details.
