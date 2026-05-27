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
| **Source echo** | Nag-return ang model ng original na English input | `[GATE] source-echo` |
| **Hallucination loop** | Paulit-ulit na trigram patterns (hal., `"Qo' Qo' Qo'"`) | `[GATE] hallucination` |
| **Length inflation** | Sobrang haba ng output kumpara sa source | `[GATE] length` |
| **Script compliance** | Maling script para sa target locale | `[GATE] script` |
| **ICU plural categories** | Kulang ng required plural forms para sa locale | `[GATE] icu-plural` |

### Empty/Blank

Nire-reject nito ang mga translation na empty strings, whitespace-only, o `null`. Sinasalo nito ang mga model na walang nire-return para sa mga difficult keys.

### Source Echo

Nadi-detect nito kapag nag-return ang model ng English source text imbes na i-translate ito. Common po ito sa mga short strings at under-specified prompts.

### Hallucination Loop

Ina-analyze nito ang mga trigram (3-character) patterns sa output. Kung may anumang trigram na umulit nang higit sa threshold number of times relative sa output length, ire-reject ang translation. Sinasalo nito ang mga degenerate outputs tulad ng `"Qo' Qo' Qo' Qo' Qo'"`.

### Length Inflation

Nire-reject nito ang mga translation kung saan lumagpas ang output length sa `maxLengthRatio × source length` (default: 4×). Sinasalo nito ang mga model hallucinations na nagpo-produce ng walls of text para sa isang short input.

Configurable po ito via `maxLengthRatio` sa inyong config.

### Script Compliance

Para sa mga locale na may configured na `script` field (hal., `"script": "cans"` para sa Plains Cree Syllabics), vina-validate nito na ang output ay naglalaman ng mga non-ASCII characters na angkop para sa target script. Ang Latin-only output para sa isang Arabic, CJK, o Syllabics locale ay ire-reject.

## Ano ang Mangyayari Kapag Nag-fail

1. Ilo-log ang nag-fail na translation sa stderr na may `[GATE]` prefix, ang key name, ang reason, at isang preview ng value
2. **Hindi** isusulat ang key sa locale file
3. Magti-trigger ang retry cascade (tingnan sa ibaba)

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

Naka-cap ang retry budget sa `maxRetries` (default: 3, configurable per-language). Pinipigilan nito ang runaway token spend sa mga keys na palaging nagfe-fail.

Kapag naubos na ang retries, ilo-log at isi-skip ang mga problem keys. Ire-retry po ang mga ito sa susunod na `sync` run.

## Prompt Caching

Naka-split ang system message (register, grammar rules, style notes) mula sa user message (ang mga keys na ita-translate). Intentional po ang split na ito:

- Ang system message ay **identical across batches** para sa isang given locale
- Kina-cache ng mga providers tulad ng Anthropic at Google ang mga repeated system messages
- Result: magbabayad ng full token cost ang unang batch, habang ang mga subsequent batches ay magbabayad lang para sa user message

Malaki po ang maitutulong nito para ma-reduce ang token costs para sa mga projects na may maraming batches.

## ICU MessageFormat Validation

Vina-validate ng `integrity` command ang mga ICU MessageFormat plural patterns laban sa CLDR plural rules. Kung gumagamit ang inyong source file ng ICU syntax tulad ng:

```json
"items": "{count, plural, one {# item} other {# items}}"
```

Vini-verify ng Rosetta na kasama sa mga translated versions ang lahat ng required plural categories para sa target locale. Halimbawa, nangangailangan ang Arabic ng anim na categories (`zero`, `one`, `two`, `few`, `many`, `other`) — hindi lang `one` at `other`.

I-run ang `i18n-rosetta integrity` para i-check ang plural completeness sa lahat ng locales.

## Terminology Enforcement

Para sa mga coached pairs na may dictionary, nagra-run ang rosetta ng isang post-translation terminology check. Pagkatapos pumasa sa quality gate, vini-verify nito kung ginamit ba talaga ng LLM ang mga required dictionary terms.

```
[TERM] en→fr: 2 term violation(s)
  • hero.title: "dashboard" → expected "tableau de bord" but got "panneau de contrôle"
```

Ang mga terminology violations ay **mga warnings, hindi blocking errors**. Isusulat pa rin ang translation sa disk. Intentional po ito — maaaring may valid reasons ang LLM sa pagpili ng alternative (context, grammar), at ang pag-block dahil sa term mismatches ay magdudulot ng mas maraming problema kaysa tulong.

Para ma-fix ang mga violations, i-update ang coaching dictionary o i-manually edit ang locale file.

---

## Tingnan Din

- [Paano Gumagana ang Sync](/docs/concepts/how-sync-works) — kung saan pumapasok ang quality gate sa pipeline
- [Mga Translation Methods](/docs/guides/translation-methods) — mga methods na pumapasok sa gate
- [Mga Script Converters](/docs/concepts/script-converters) — post-gate script conversion
- [Coaching Data](/docs/concepts/coaching-data) — pag-improve ng translation quality upstream
- [Translation Memory](/docs/concepts/translation-memory) — pag-cache ng mga validated translations
- [CLI Reference — sync](/docs/reference/cli#sync) — mga sync flags kasama ang retry behavior
- [CLI Reference — integrity](/docs/reference/cli#integrity) — ICU plural auditing