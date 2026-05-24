---
sidebar_position: 3
title: Quality Gate
---

# Quality Gate

Every translation passes through a deterministic validation gate before it's written to disk. The quality gate catches common machine translation failure modes — no silent fallbacks, no garbage written to your locale files.

## Validation Checks

| Check | What It Catches | Gate Label |
|-------|----------------|-----------|
| **Empty/blank** | Model returned empty string or whitespace | `[GATE] empty` |
| **Source echo** | Model returned the original English input | `[GATE] source-echo` |
| **Hallucination loop** | Repeated trigram patterns (e.g., `"Qo' Qo' Qo'"`) | `[GATE] hallucination` |
| **Length inflation** | Output is significantly longer than source | `[GATE] length` |
| **Script compliance** | Wrong script for the target locale | `[GATE] script` |
| **ICU plural categories** | Missing required plural forms for the locale | `[GATE] icu-plural` |

### Empty/Blank

Rejects translations that are empty strings, whitespace-only, or `null`. This catches models that return nothing for difficult keys.

### Source Echo

Detects when the model returns the English source text instead of translating it. Common with short strings and under-specified prompts.

### Hallucination Loop

Analyzes trigram (3-character) patterns in the output. If any trigram repeats more than a threshold number of times relative to the output length, the translation is rejected. This catches degenerate outputs like `"Qo' Qo' Qo' Qo' Qo'"`.

### Length Inflation

Rejects translations where the output length exceeds `maxLengthRatio × source length` (default: 4×). This catches model hallucinations that produce walls of text for a short input.

Configurable via `maxLengthRatio` in your config.

### Script Compliance

For locales with a configured `script` field (e.g., `"script": "cans"` for Plains Cree Syllabics), validates that the output contains non-ASCII characters appropriate for the target script. Latin-only output for an Arabic, CJK, or Syllabics locale is rejected.

## What Happens on Failure

1. The failing translation is logged to stderr with a `[GATE]` prefix, the key name, the reason, and a preview of the value
2. The key is **not** written to the locale file
3. The retry cascade kicks in (see below)

```
[GATE] hero.title: source-echo — "Welcome to our platform"
[GATE] nav.about: hallucination — "À À À À À À À À"
```

## Retry Cascade

When a batch fails (JSON parse error or quality gate rejections), rosetta retries with progressively smaller batches:

```
Full batch (30 keys) → parse error
  └→ Half batch (15 keys) → 2 failures
      └→ Individual keys (1 each) → isolates the 2 problem keys
```

The retry budget is capped by `maxRetries` (default: 3, configurable per-language). This prevents runaway token spend on keys that consistently fail.

After exhausting retries, the problem keys are logged and skipped. They'll be retried on the next `sync` run.

## Prompt Caching

The system message (register, grammar rules, style notes) is split from the user message (the keys to translate). This split is intentional:

- The system message is **identical across batches** for a given locale
- Providers like Anthropic and Google cache repeated system messages
- Result: the first batch pays full token cost, subsequent batches pay only for the user message

This can significantly reduce token costs for projects with many batches.

## ICU MessageFormat Validation

The `integrity` command validates ICU MessageFormat plural patterns against CLDR plural rules. If your source file uses ICU syntax like:

```json
"items": "{count, plural, one {# item} other {# items}}"
```

Rosetta verifies that translated versions include all required plural categories for the target locale. For example, Arabic requires six categories (`zero`, `one`, `two`, `few`, `many`, `other`) — not just `one` and `other`.

Run `i18n-rosetta integrity` to check plural completeness across all locales.

## Terminology Enforcement

For coached pairs with a dictionary, rosetta runs a post-translation terminology check. After the quality gate passes, it verifies whether the LLM actually used the required dictionary terms.

```
[TERM] en→fr: 2 term violation(s)
  • hero.title: "dashboard" → expected "tableau de bord" but got "panneau de contrôle"
```

Terminology violations are **warnings, not blocking errors**. The translation is still written to disk. This is intentional — the LLM may have valid reasons for choosing an alternative (context, grammar), and blocking on term mismatches would cause more harm than good.

To fix violations, update the coaching dictionary or manually edit the locale file.

---

## See Also

- [How Sync Works](/docs/concepts/how-sync-works) — where the quality gate fits in the pipeline
- [Translation Methods](/docs/guides/translation-methods) — methods that feed into the gate
- [Script Converters](/docs/concepts/script-converters) — post-gate script conversion
- [Coaching Data](/docs/concepts/coaching-data) — improving translation quality upstream
- [Translation Memory](/docs/concepts/translation-memory) — caching validated translations
- [CLI Reference — sync](/docs/reference/cli#sync) — sync flags including retry behavior
- [CLI Reference — integrity](/docs/reference/cli#integrity) — ICU plural auditing
