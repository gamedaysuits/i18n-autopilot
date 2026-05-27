# Agent Guide

This file redirects to the three purpose-specific agent guides. Each is tailored to a different audience.

## Using i18n-rosetta (Public)

**For AI agents and developers who want to translate locale files.**

→ [Agent Guide: Using i18n-rosetta](https://i18n-rosetta.com/docs/guides/agent-guide)

Covers: install, configuration, translation methods, coaching data, quality gate, translation memory, common patterns.

## Winning the Arena (Public)

**For AI agents and ML researchers who want to build translation methods and submit to the leaderboard.**

→ [Agent Guide: Winning the Arena](https://mtevalarena.org/docs/getting-started/agent-guide)

Covers: TranslationProcess protocol, method ideas, understanding scores, submitting to the leaderboard, deploying to production.

## Working on This Project (Internal)

**For AI agents and developers contributing to the codebase.**

→ [`crk-translate/docs/internal/AGENTS.md`](../crk-translate/docs/internal/AGENTS.md)

Covers: monorepo structure, SSOT hierarchy, code conventions, what not to break, development workflows.

---

## SSOT Hierarchy (Quick Reference)

```
SCORING_SPEC.md (this dir)    → metrics, weights, tiers
BENCHMARK_SPEC.md (this dir)  → corpus format, run card schema, protocol
HOW_IT_WORKS.md (this dir)    → competitive crowdsourcing narrative

These docs are also committed in the Arena repo at their Docusaurus paths
(e.g., website/docs/specifications/scoring.md). Edit here first — these
are the canonical source. Then update the Arena copies to match.
```
