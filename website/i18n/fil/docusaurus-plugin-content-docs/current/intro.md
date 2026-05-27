---
sidebar_position: 1
slug: /
title: "Panimula"
---
# i18n-rosetta

Isang fully customizable na internationalization framework. Isang command lang para i-translate ang inyong locale files. Isang config ang kumokontrol sa bawat method, model, at language pair. At kung hindi sapat ang mga built-in methods — gumawa ng sarili ninyo, patunayan na gumagana ito, at i-deploy.

```bash
npx i18n-rosetta sync
```

Ina-auto-detect ng rosetta ang inyong locale files, format, at target languages. Tinu-translate nito kung ano ang missing, ini-skip ang mga tapos na, vina-validate ang bawat result, at nagsusulat ng clean output. Yan po ang starting line.

---

## Bakit Hindi Na Lang Gawan ng Sariling Script?

Pwede naman kayong magsulat ng quick loop na tumatawag sa Google Translate para sa bawat key. Karamihan sa mga developers ay ginagawa ito — aabutin lang ito ng mga 30 lines. Pero dito po nagkakaproblema:

- **Walang change detection.** Kapag nag-update kayo ng English string — mananatiling stale ang translation forever. Tinu-track ng rosetta ang bawat source value gamit ang SHA-256 hashes at nire-retranslate lang kung ano ang nagbago.
- **Walang batching.** Ang isang API call per key ay nangangahulugang 200 keys = 200 round trips. Matalinong nagba-batch ang rosetta (configurable, default ay 30 keys/batch para sa LLM, 128 para sa Google).
- **Walang caching.** Bawat sync ay nire-retranslate ang lahat. Kina-cache ng Translation Memory ng rosetta ang mga translations by source text + locale + method — kapag nag-re-run ng sync pagkatapos ng isang key change, ita-translate lang nito ang isang key na iyon, hindi ang buong file.
- **Walang quality gate.** Ang machine translation ay nagha-hallucinate, inuulit ang source, o nag-o-output sa maling script. Vina-validate ng rosetta ang bawat translation bago ito isulat — ang wrong-script, length inflation, at source echoes ay nade-detect at nire-reject.
- **Walang format awareness.** Hardcoded sa JSON? Hina-handle ng rosetta ang JSON, TOML, YAML, at Hugo Markdown (frontmatter + body) na may auto-detection.
- **Walang method control.** Parehong method ang nakukuha ng bawat pair. Hinahayaan kayo ng rosetta na gumamit ng Google Translate para sa French, isang LLM para sa Japanese, at isang custom community-hosted pipeline para sa Cree — sa iisang config file lang.

Ang rosetta ay ang production version ng script na iyon.

---

## Ano ang Pinagkaiba Nito

### Bawat method ay isang plugin

Ang translation method ay **configurable per language pair**. Pwedeng i-mix ang Google Translate, LLMs, coached prompts, at custom APIs sa iisang project:

```json title="i18n-rosetta.config.json"
{
  "version": 3,
  "pairs": {
    "en:fr": { "method": "google-translate" },
    "en:ja": { "method": "llm", "model": "google/gemini-2.5-pro" },
    "en:crk": { "methodPlugin": "crk-coached-v1" }
  }
}
```

Ang French ay gagamit ng Google Translate (fast, cheap). Ang Japanese ay gagamit ng premium LLM (nuanced). Ang Plains Cree ay gagamit ng coached plugin na may grammar rules, dictionaries, at morphological validation. Parehong `sync` command. Parehong quality gate. Parehong CLI.

### Patunayan mo

Tingin niyo ba kaya ng method ninyo na mag-translate ng English to Spanish? Turkish to Azerbaijani? English to Cree?

**Patunayan niyo po.** Ang companion na [eval harness](https://mtevalarena.org/docs/specifications/harness) ay nagbe-benchmark ng kahit anong translation method na may reproducible, fingerprinted scoring. Tinu-track ng [leaderboard](/leaderboard) ang bawat submission.

Ang eval harness at ang production CLI ay nagse-share ng parehong plugin interface. Ang isang method na may magandang score sa harness ay pwedeng gamitin sa production — kung magbibigay ng consent ang community na gumagamit ng language na iyon. Para sa Indigenous at low-resource languages, mahalaga po ang consent na iyon. Tingnan ang [Data Sovereignty](https://mtevalarena.org/docs/sovereignty/data-sovereignty).

```bash
# Benchmark your method (in the eval harness repo)
cd gds-mt-eval-harness
python eval/baseline_experiment.py --dataset data/edtekla-dev-v1.json --submit

# Use it locally
npx i18n-rosetta sync
```

Parehong plugin. Plug and test lang.

### Ang buong toolkit

Ang rosetta ay hindi lang `sync`. Isa itong kumpletong i18n pipeline:

| Command | Ano ang Ginagawa Nito |
|---------|-------------|
| `sync` | I-translate ang missing, stale, at fallback keys |
| `watch` | Mag-auto-sync kapag nagbago ang inyong source file |
| `lint` | I-scan ang source code para sa hardcoded strings |
| `wrap` | I-auto-wrap ang hardcoded strings sa `t()` calls |
| `audit` | I-list ang lahat ng untranslated `[EN]` fallback values |
| `integrity` | I-detect ang placeholder corruption, encoding issues, at ICU plural completeness |
| `seo` | Mag-generate ng hreflang tags, sitemaps, at JSON-LD schema |
| `status` | I-show ang pair config, plugins, at benchmark scores |
| `provenance` | I-audit ang translation resource licensing |
| `plugin` | Mag-install, mag-remove, at mag-list ng method plugins |
| `fonts` | Mag-download ng web fonts para sa PUA script converters |
| `tm` | I-manage ang Translation Memory cache (stats, clear, per-locale) |
| `xliff` | Mag-export/import ng XLIFF 1.2 para sa professional translator review |

Tatlo sa mga ito — `lint`, `sync`, `audit` — ay bumubuo ng isang CI pipeline na sumasalo sa hardcoded strings, tinu-translate ang mga ito, at nagfe-fail sa build kung may anumang locale na incomplete.

---

## Ang Arena

Ang [Method Leaderboard](/leaderboard) ang nagsisilbing scoreboard. Bawat submission ay naka-fingerprint sa isang Git commit, naka-version sa isang specific na dataset, at ini-score ng parehong harness. Kahit sino ay pwedeng mag-submit.

**Ano ang kaya ninyong patunayan?** Tumatanggap ng JSON ang harness. Tumatanggap din ng JSON ang mga plugins. Kahit anong method na nagpo-produce ng JSON ay pwedeng i-test:

| Approach | Example |
|----------|---------|
| **Coached LLM** | Mag-inject ng grammar rules at dictionaries sa prompt ng isang frontier model |
| **Fine-tuned model** | I-train ang isang open model sa parallel text — huwag lang sa eval data |
| **FST-gated pipeline** | Magge-generate ang LLM → iva-validate ng finite-state transducer ang morphology → magre-retry |
| **Chained models** | Magda-draft ang Model A → magpo-post-edit ang Model B → mag-i-score ang Model C |
| **Dictionary + LLM** | I-force ang known terms mula sa isang dictionary, hayaan ang LLM na mag-handle sa iba |
| **Evolutionary** | Mag-generate ng candidates, i-score ang mga ito, i-mutate ang the best, at ulitin |
| **Partial translation** | I-translate ang isang sample by hand, patunayan na nagma-match ang inyong LLM, i-auto-translate ang natitira |

Mag-fine-tune ng models. Mag-deploy ng evolutionary algorithms. I-test ang mga sagot ng estudyante sa language exams. Gumawa ng lookup tables. I-chain ang tatlong models nang magkakasama. Basta't nagpo-produce ng JSON ang inyong method, isko-score ito ng harness at ira-run ito ng framework.

:::danger Ang nag-iisang rule
**Huwag mag-train sa evaluation data.** Ang mga methods na na-expose sa benchmark dataset ay madi-disqualify. Mag-fine-tune kayo kahit saan niyo gusto. Huwag lang sa test set.
:::

Isa po itong open invitation. Kung nagtatrabaho kayo gamit ang isang low-resource language — bilang isang researcher, community member, estudyante, o kahit sinong may pakialam — gumawa ng method, i-run ang harness, at i-claim ang top score. Unsolved pa ang problemang ito. Nandito na ang infrastructure.

**[→ Tingnan ang leaderboard](/leaderboard)**

---

## Next Steps

**Getting started:**
- [Installation](/docs/getting-started/installation) — I-set up sa loob ng 2 minutes
- [Quick Start](/docs/getting-started/quick-start) — I-run ang inyong unang sync
- [Supported Languages](/docs/reference/supported-languages) — Kung ano ang available out of the box

**Pag-customize ng inyong setup:**
- [Translation Methods](/docs/guides/translation-methods) — Piliin ang tamang method per pair
- [Translation Memory](/docs/concepts/translation-memory) — Paano nakakatipid ng pera ang caching
- [Configuration](/docs/getting-started/configuration) — Full config reference
- [Hugo Multilingual Site](/docs/tutorials/hugo-multilingual-site) — Markdown content translation

**Going deeper:**
- [Working with Professional Translators](/docs/guides/professional-translators) — XLIFF export/import workflow
- [Data Sovereignty](https://mtevalarena.org/docs/sovereignty/data-sovereignty) — OCAP, CARE, at Māori Data Sovereignty principles
- [Support a Low-Resource Language](https://mtevalarena.org/docs/community/low-resource-languages) — Ang challenge na nagpasimula ng lahat
- [Cookbook: FST-Gated Pipeline](https://mtevalarena.org/docs/tutorials/fst-gated-pipeline) — Gumawa ng decomposition pipeline
- [MT Evaluation](https://mtevalarena.org/docs/leaderboard/rules) — Paano gumagana ang harness at leaderboard
- [Method Leaderboard](/leaderboard) — Live scores at submissions