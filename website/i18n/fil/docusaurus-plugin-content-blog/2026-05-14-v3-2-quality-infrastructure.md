---
slug: v3-2-quality-infrastructure
title: "v3.2.0: Industrial-Grade na Quality Infrastructure"
authors: [curtisforbes]
tags: [release]
date: 2026-05-14
---
Ang v3.2.0 ay ang quality release. 702 tests, 163 test suites, at zero tolerance para sa silent failures.

<!-- truncate -->

## Mga Nagbago

### Quality Gate (5 checks)

Dumadaan na ngayon ang bawat translation sa five deterministic validation checks bago ito i-write sa disk:

1. **Empty/blank** — Walang ni-return ang model
2. **Source echo** — Ni-return ng model ang English input
3. **Hallucination loop** — Paulit-ulit na trigram patterns
4. **Length inflation** — Ang output ay 4×+ na mas mahaba kaysa sa source
5. **Script compliance** — Maling script para sa locale

Walang translation na isusulat nang hindi pumapasa sa lahat ng five checks. Ang mga failed translations ay naka-log at ire-retry.

### Retry Cascade

Kapag nag-fail ang isang batch, magre-retry ang rosetta gamit ang progressively smaller batches:

```
Full batch (30 keys) → parse error
  └→ Half batch (15 keys) → 2 failures
      └→ Individual keys (1 each) → isolates the problem keys
```

### Security Hardening

- **Prototype pollution guard** — Nire-reject ang `__proto__`, `constructor` keys sa parse time
- **Path traversal guard** — Hindi pwedeng mag-write ang mga crafted locale codes sa labas ng configured directories
- **Response validation** — Tanging ang mga keys na ipinadala lang ang tatanggapin pabalik

### Test Infrastructure

| Suite | Tests | Ano ang Sinasaklaw |
|-------|-------|---------------|
| Core (8 suites) | 280+ | Config, sync, CLI, watch, audit, pairs, format, init |
| Red team | 89 | Adversarial inputs, encoding attacks |
| Contract | 120 | API integration contracts |
| Performance | 36 | Batch optimization, throughput regression |
| Coverage | 702 total | Full pipeline |

### Prompt Caching

Naka-split na ngayon ang system messages mula sa user messages, kaya nag-e-enable ito ng prompt cache hits sa mga providers tulad ng Anthropic at Google. Malaki ang nababawas nito sa token costs para sa mga multi-batch syncs.

Tingnan ang [Quality Gate docs](/docs/concepts/quality-gate) at [Security docs](/docs/concepts/security) para sa full technical details.