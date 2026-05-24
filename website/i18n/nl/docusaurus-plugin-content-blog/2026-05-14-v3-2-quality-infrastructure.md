---
slug: v3-2-quality-infrastructure
title: "v3.2.0: Kwaliteitsinfrastructuur van industrieel niveau"
authors: [curtisforbes]
tags: [release]
date: 2026-05-14
---
v3.2.0 is de kwaliteitsrelease. 702 tests, 163 test suites, nultolerantie voor silent failures.

<!-- truncate -->

## Wat er is gewijzigd

### Quality Gate (5 controles)

Elke vertaling doorloopt nu vijf deterministische validatiecontroles voordat deze naar de schijf wordt geschreven:

1. **Empty/blank** — Model heeft niets geretourneerd
2. **Source echo** — Model heeft de Engelse invoer geretourneerd
3. **Hallucination loop** — Herhaalde trigrampatronen
4. **Length inflation** — Uitvoer is 4×+ langer dan de bron
5. **Script compliance** — Verkeerd script voor de locale

Geen enkele vertaling wordt weggeschreven zonder voor alle vijf de controles te slagen. Mislukte vertalingen worden gelogd en opnieuw geprobeerd.

### Retry Cascade

Wanneer een batch mislukt, probeert rosetta het opnieuw met steeds kleinere batches:

```
Full batch (30 keys) → parse error
  └→ Half batch (15 keys) → 2 failures
      └→ Individual keys (1 each) → isolates the problem keys
```

### Security Hardening

- **Prototype pollution guard** — `__proto__`, `constructor` keys worden geweigerd tijdens het parsen
- **Path traversal guard** — Gemanipuleerde locale-codes kunnen niet buiten de geconfigureerde directory's schrijven
- **Response validation** — Alleen keys die zijn verzonden, worden teruggeaccepteerd

### Testinfrastructuur

| Suite | Tests | Wat het omvat |
|-------|-------|---------------|
| Core (8 suites) | 280+ | Config, sync, CLI, watch, audit, pairs, format, init |
| Red team | 89 | Adversarial inputs, encoding-aanvallen |
| Contract | 120 | API-integratiecontracten |
| Performance | 36 | Batch-optimalisatie, throughput-regressie |
| Coverage | 702 totaal | Volledige pipeline |

### Prompt Caching

Systeemberichten worden nu gescheiden van gebruikersberichten, wat prompt cache hits mogelijk maakt bij providers zoals Anthropic en Google. Dit verlaagt de tokenkosten voor multi-batch syncs aanzienlijk.

Raadpleeg de [Quality Gate-documentatie](/docs/concepts/quality-gate) en [Security-documentatie](/docs/concepts/security) voor de volledige technische details.