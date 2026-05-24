---
sidebar_position: 3
title: "Quality Gate"
---
# Quality Gate

Dumadaan po ang bawat translation sa isang deterministic validation gate bago ito ma-write sa disk. Sinasalo ng quality gate ang mga common machine translation failure modes — walang silent fallbacks, at walang garbage na maisusulat sa inyong mga locale files.

## Mga Validation Check

| Check | Ano ang Sinasalo Nito | Gate Label |
|-------|----------------|-----------|
| **Empty/blank** | Nag-return ang model ng empty string o whitespace | `[GATE] empty` |
| **Source echo** | Nag-return ang model ng original na English input | `[GATE] source-echo` |
| **Hallucination loop** | Paulit-ulit na trigram patterns (hal., `"Qo' Qo' Qo'"`) | `[GATE] hallucination` |
| **Length inflation** | Sobrang haba ng output kumpara sa source | `[GATE] length` |
| **Script compliance** | Maling script para sa target locale | `[GATE] script` |

### Empty/Blank

Nire-reject nito ang mga translation na empty strings, whitespace-only, o `null`. Sinasalo po nito ang mga model na walang nire-return para sa mga difficult keys.

### Source Echo

Nadi-detect nito kapag nag-return ang model ng English source text imbes na i-translate ito. Common po ito sa mga short strings at under-specified prompts.

### Hallucination Loop

Ina-analyze nito ang mga trigram (3-character) patterns sa output. Kung may anumang trigram na umulit nang higit sa isang threshold number of times relative sa output length, ire-reject ang translation. Sinasalo po nito ang mga degenerate outputs tulad ng `"Qo' Qo' Qo' Qo' Qo'"`.

### Length Inflation

Nire-reject nito ang mga translation kung saan ang output length ay lumampas sa `maxLengthRatio × source length` (default: 4×). Sinasalo po nito ang mga model hallucination na nagpo-produce ng walls of text para sa isang short input.

Configurable ito via `maxLengthRatio` sa inyong config.

### Script Compliance

Para sa mga locale na may configured na `script` field (hal., `"script": "cans"` para sa Plains Cree Syllabics), vina-validate nito na ang output ay may mga non-ASCII character na appropriate para sa target script. Nire-reject po ang Latin-only output para sa isang Arabic, CJK, o Syllabics locale.

## Ano ang Mangyayari Kapag Nag-fail

1. Nalo-log sa stderr ang nag-fail na translation na may `[GATE]` prefix, ang key name, ang reason, at isang preview ng value
2. **Hindi** isusulat ang key sa locale file
3. Magki-kick in ang retry cascade (tingnan sa ibaba)

```
[GATE] hero.title: source-echo — "Welcome to our platform"
[GATE] nav.about: hallucination — "À À À À À À À À"
```

## Retry Cascade

Kapag nag-fail ang isang batch (JSON parse error o quality gate rejections), magre-retry ang rosetta gamit ang progressively smaller batches:

```
Full batch (30 keys) → parse error
  └→ Half batch (15 keys) → 2 failures
      └→ Individual keys (1 each) → isolates the 2 problem keys
```

Naka-cap po ang retry budget sa `maxRetries` (default: 3, configurable per-language). Pinipigilan nito ang runaway token spend sa mga key na consistently nagfe-fail.

Pagkatapos ma-exhaust ang mga retry, nalo-log at ini-skip ang mga problem key. Ire-retry po ang mga ito sa susunod na `sync` run.

## Prompt Caching

Naka-split ang system message (register, grammar rules, style notes) mula sa user message (ang mga key na ita-translate). Intentional po ang split na ito:

- Ang system message ay **identical across batches** para sa isang given locale
- Kina-cache ng mga provider tulad ng Anthropic at Google ang mga repeated system messages
- Resulta: magbabayad ng full token cost ang unang batch, habang ang mga subsequent batches ay magbabayad lang para sa user message

Malaki po ang maitutulong nito para ma-reduce ang token costs para sa mga project na may maraming batch.

---

## Tingnan Din

- [Paano Gumagana ang Sync](/docs/concepts/how-sync-works) — kung saan nagfi-fit ang quality gate sa pipeline
- [Mga Translation Method](/docs/guides/translation-methods) — mga method na nagfi-feed papunta sa gate
- [Mga Script Converter](/docs/concepts/script-converters) — post-gate script conversion
- [Coaching Data](/docs/concepts/coaching-data) — pag-improve ng translation quality upstream
- [CLI Reference — sync](/docs/reference/cli#sync) — mga sync flag kasama ang retry behavior