---
sidebar_position: 3
title: "Quality Gate"
---
# Quality Gate

Dumadaan po ang bawat translation sa isang deterministic validation gate bago ito ma-write sa disk. Sinasalo ng quality gate ang mga common machine translation failure modes — walang silent fallbacks, at walang garbage na maisusulat sa inyong mga locale files.

## Validation Checks

| Check | Ano ang Sinasalo Nito | Gate Label |
|-------|----------------|-----------|
| **Empty/blank** | Nag-return ang model ng empty string o whitespace | `[GATE] empty` |
| **Source echo** | Nag-return ang model ng original English input | `[GATE] source-echo` |
| **Hallucination loop** | Paulit-ulit na trigram patterns (hal., `"Qo' Qo' Qo'"`) | `[GATE] hallucination` |
| **Length inflation** | Mas mahaba nang sobra ang output kaysa sa source | `[GATE] length` |
| **Script compliance** | Maling script para sa target locale | `[GATE] script` |

### Empty/Blank

Nire-reject po nito ang mga translations na empty strings, whitespace-only, o `null`. Sinasalo nito ang mga models na walang nire-return para sa mga difficult keys.

### Source Echo

Dine-detect nito kapag nag-return ang model ng English source text sa halip na i-translate ito. Common po ito sa mga short strings at under-specified prompts.

### Hallucination Loop

Ina-analyze nito ang mga trigram (3-character) patterns sa output. Kung may anumang trigram na umulit nang higit sa isang threshold number of times relative sa output length, ire-reject po ang translation. Sinasalo nito ang mga degenerate outputs tulad ng `"Qo' Qo' Qo' Qo' Qo'"`.

### Length Inflation

Nire-reject nito ang mga translations kung saan ang output length ay lumampas sa `maxLengthRatio × source length` (default: 4×). Sinasalo nito ang mga model hallucinations na nagpo-produce ng walls of text para sa isang short input.

Configurable po ito via `maxLengthRatio` sa inyong config.

### Script Compliance

Para sa mga locales na may configured na `script` field (hal., `"script": "cans"` para sa Plains Cree Syllabics), vina-validate nito na ang output ay naglalaman ng mga non-ASCII characters na appropriate para sa target script. Ang Latin-only output para sa isang Arabic, CJK, o Syllabics locale ay ire-reject po.

## Ano ang Nangyayari sa Failure

1. Ilo-log ang failing translation sa stderr na may `[GATE]` prefix, ang key name, ang reason, at isang preview ng value
2. **Hindi** isusulat ang key sa locale file
3. Magki-kick in ang retry cascade (tingnan sa ibaba)

```
[GATE] hero.title: source-echo — "Welcome to our platform"
[GATE] nav.about: hallucination — "À À À À À À À À"
```

## Retry Cascade

Kapag nag-fail ang isang batch (JSON parse error o quality gate rejections), magre-retry po ang rosetta gamit ang progressively smaller batches:

```
Full batch (30 keys) → parse error
  └→ Half batch (15 keys) → 2 failures
      └→ Individual keys (1 each) → isolates the 2 problem keys
```

Naka-cap po ang retry budget sa `maxRetries` (default: 3, configurable per-language). Pinipigilan nito ang runaway token spend sa mga keys na consistently nagfe-fail.

Pagkatapos ma-exhaust ang mga retries, ilo-log at isi-skip ang mga problem keys. Ire-retry po ang mga ito sa susunod na `sync` run.

## Prompt Caching

Naka-split po ang system message (register, grammar rules, style notes) mula sa user message (ang mga keys na ita-translate). Intentional po ang split na ito:

- Ang system message ay **identical across batches** para sa isang given locale
- Kina-cache ng mga providers tulad ng Anthropic at Google ang mga repeated system messages
- Resulta: magbabayad ng full token cost ang unang batch, habang ang mga subsequent batches ay magbabayad lamang para sa user message

Maaari po nitong ma-reduce nang malaki ang token costs para sa mga projects na may maraming batches.

---

## Tingnan Din

- [Paano Gumagana ang Sync](/docs/concepts/how-sync-works) — kung saan nagfi-fit ang quality gate sa pipeline
- [Translation Methods](/docs/guides/translation-methods) — mga methods na nagfi-feed sa gate
- [Script Converters](/docs/concepts/script-converters) — post-gate script conversion
- [Coaching Data](/docs/concepts/coaching-data) — pag-improve ng translation quality upstream
- [CLI Reference — sync](/docs/reference/cli#sync) — sync flags kasama ang retry behavior