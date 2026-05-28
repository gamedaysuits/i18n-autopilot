---
sidebar_position: 1
slug: /
title: "Panimula"
---
# i18n-rosetta

Isang fully customizable na internationalization framework. Isang command lang para i-translate ang inyong mga locale files. Isang config ang kumokontrol sa bawat method, model, at language pair. At kung hindi sapat ang mga built-in methods — gumawa ng sarili ninyo, patunayang gumagana ito, at i-deploy.

```bash
npx i18n-rosetta sync
```

Ina-auto-detect ng rosetta ang inyong mga locale files, format, at target languages. Tinu-translate nito kung ano ang kulang, ini-skip ang mga tapos na, vina-validate ang bawat result, at nag-o-output ng malinis na code. Simula pa lang 'yan.

---

## Bakit Hindi Na Lang Gawan ng Sariling Script?

Pwede po kayong gumawa ng quick loop na tumatawag sa Google Translate para sa bawat key. Karamihan sa mga developers ay ginagawa ito — aabutin lang ito ng mga 30 lines. Pero dito nagkakaproblema:

- **Walang change detection.** Kapag nag-update kayo ng English string — mananatiling stale ang translation forever. Tinu-track ng rosetta ang bawat source value gamit ang SHA-256 hashes at ire-re-translate lang kung ano ang nagbago.
- **Walang batching.** Ang isang API call per key ay nangangahulugang 200 keys = 200 round trips. Matalinong nagba-batch ang rosetta (configurable, default ay 80 keys/batch para sa LLM, 128 para sa Google).
- **Walang caching.** Bawat sync ay nire-re-translate ang lahat. Kina-cache ng Translation Memory ng rosetta ang mga translations by source text + locale + method — kaya kapag nag-re-run ng sync pagkatapos magbago ng isang key, ita-translate lang nito ang isang key na 'yon, hindi ang buong file.
- **Walang quality gate.** Nagha-hallucinate ang machine translation, inuulit ang source, o nag-o-output sa maling script. Vina-validate ng rosetta ang bawat translation bago ito isulat — ang mga wrong-script, length inflation, at source echoes ay nade-detect at nire-reject.
- **Walang format awareness.** Hardcoded sa JSON? Hina-handle ng rosetta ang JSON, TOML, YAML, at Hugo Markdown (frontmatter + body) na may auto-detection.
- **Walang method control.** Parehong method ang ginagamit sa bawat pair. Hinahayaan kayo ng rosetta na gumamit ng Google Translate para sa French, isang LLM para sa Japanese, at isang custom community-hosted pipeline para sa Cree — sa iisang config file lang.

Ang rosetta ay ang production version ng script na 'yon.

---

## Ano ang Pinagkaiba Nito

### Bawat method ay isang plugin

Ang translation method ay **configurable per language pair**. Pwedeng i-mix ang Google Translate, mga LLM, coached prompts, at custom APIs sa iisang project:

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

Sa French, Google Translate ang gagamitin (mabilis, mura). Sa Japanese, premium LLM (nuanced). Sa Plains Cree, isang coached plugin na may grammar rules, dictionaries, at morphological validation. Parehong `sync` command. Parehong quality gate. Parehong CLI.

### Patunayan ito

Tingin niyo ba kaya ng method ninyo na mag-translate ng English to Spanish? Turkish to Azerbaijani? English to Cree?

**Patunayan ito.** Bine-benchmark ng kasamang [eval harness](https://mtevalarena.org/docs/specifications/harness) ang anumang translation method gamit ang reproducible at fingerprinted na scoring. Tinu-track ng [leaderboard](/leaderboard) ang bawat submission.

Pareho ang plugin interface na ginagamit ng eval harness at ng production CLI. Ang isang method na may mataas na score sa harness ay pwedeng gamitin sa production — kung magbibigay ng consent ang community ng wikang sineserbisyuhan nito. Para sa mga Indigenous at low-resource languages, mahalaga ang consent na 'yan. Tingnan ang [Data Sovereignty](https://mtevalarena.org/docs/sovereignty/data-sovereignty).

```bash
# Benchmark your method (in the eval harness repo)
cd gds-mt-eval-harness
python eval/baseline_experiment.py --dataset data/edtekla-dev-v1.json --submit

# Use it locally
npx i18n-rosetta sync
```

Parehong plugin. Plug and test na lang.

### Ang kumpletong toolkit

Hindi lang `sync` ang rosetta. Isa itong kumpletong i18n pipeline:

| Command | Ano ang Ginagawa Nito |
|---------|-------------|
| `sync` | I-translate ang mga missing at stale keys (may post-sync verification) |
| `watch` | Mag-auto-sync kapag nagbago ang inyong source file |
| `lint` | I-scan ang source code para sa mga hardcoded strings |
| `wrap` | I-auto-wrap ang mga hardcoded strings sa mga `t()` calls |
| `audit` | I-list ang lahat ng `[EN]` fallback markers mula sa mga nakaraang runs |
| `verify` | I-verify kung present at tama ang mga translations (CI gate) |
| `integrity` | I-detect ang placeholder corruption, encoding issues, at ICU plural completeness |
| `seo` | Mag-generate ng hreflang tags, sitemaps, at JSON-LD schema |
| `status` | Ipakita ang pair config, plugins, at benchmark scores |
| `provenance` | I-audit ang translation resource licensing |
| `plugin` | Mag-install, mag-remove, at mag-list ng mga method plugins |
| `fonts` | Mag-download ng web fonts para sa mga PUA script converters |
| `tm` | I-manage ang Translation Memory cache (stats, clear, per-locale) |
| `xliff` | Mag-export/import ng XLIFF 1.2 para sa professional translator review |

Apat sa mga ito — `lint`, `sync`, `verify`, `audit` — ay bumubuo ng isang CI pipeline na sumasalo sa mga hardcoded strings, tinu-translate ang mga ito, vina-validate kung tama, at nagfe-fail sa build kung may anumang locale na hindi kumpleto.

---

## Ang Arena

Ang [Method Leaderboard](/leaderboard) ang nagsisilbing scoreboard. Bawat submission ay naka-fingerprint sa isang Git commit, naka-version sa isang specific na dataset, at ini-score ng parehong harness. Kahit sino ay pwedeng mag-submit.

**Ano ang kaya ninyong patunayan?** Tumatanggap ng JSON ang harness. Tumatanggap ng JSON ang mga plugins. Anumang method na nagpo-produce ng JSON ay pwedeng i-test:

| Approach | Halimbawa |
|----------|---------|
| **Coached LLM** | Mag-inject ng grammar rules at dictionaries sa prompt ng isang frontier model |
| **Fine-tuned model** | I-train ang isang open model gamit ang parallel text — huwag lang sa eval data |
| **FST-gated pipeline** | Magge-generate ang LLM → iva-validate ng finite-state transducer ang morphology → magre-retry |
| **Chained models** | Magda-draft ang Model A → magpo-post-edit ang Model B → mag-i-score ang Model C |
| **Dictionary + LLM** | I-force ang mga kilalang terms mula sa isang dictionary, at hayaan ang LLM sa natitira |
| **Evolutionary** | Mag-generate ng candidates, i-score ang mga ito, i-mutate ang pinakamaganda, at ulitin |
| **Partial translation** | I-translate ang isang sample nang manual, patunayang nagma-match ang inyong LLM, at i-auto-translate ang natitira |

Mag-fine-tune ng mga models. Mag-deploy ng evolutionary algorithms. I-test ang mga sagot ng estudyante sa mga language exams. Gumawa ng mga lookup tables. I-chain ang tatlong models nang magkakasama. Basta't nagpo-produce ng JSON ang method ninyo, i-i-score ito ng harness at ira-run ito ng framework.

:::danger Ang nag-iisang rule
**Huwag mag-train sa evaluation data.** Ang mga methods na na-expose sa benchmark dataset ay madi-disqualify. Mag-fine-tune kayo kahit saan niyo gusto. Huwag lang sa test set.
:::

Isa itong open invitation. Kung nagtatrabaho kayo gamit ang isang low-resource language — bilang isang researcher, community member, estudyante, o kahit sinong may paki — gumawa ng method, i-run ang harness, at kunin ang top score. Hindi pa solved ang problemang ito. Nandito na ang infrastructure.

**[→ Tingnan ang leaderboard](/leaderboard)**

---

## Mga Susunod na Hakbang

**Pagsisimula:**
- [Installation](/docs/getting-started/installation) — I-set up sa loob ng 2 minutes
- [Quick Start](/docs/getting-started/quick-start) — I-run ang inyong unang sync
- [Supported Languages](/docs/reference/supported-languages) — Mga available out of the box

**Pag-customize ng inyong setup:**
- [Translation Methods](/docs/guides/translation-methods) — Piliin ang tamang method per pair
- [Translation Memory](/docs/concepts/translation-memory) — Paano nakakatipid ng pera ang caching
- [Configuration](/docs/getting-started/configuration) — Buong config reference
- [Hugo Multilingual Site](/docs/tutorials/hugo-multilingual-site) — Markdown content translation

**Para sa mas malalim na pag-aaral:**
- [Working with Professional Translators](/docs/guides/professional-translators) — XLIFF export/import workflow
- [Data Sovereignty](https://mtevalarena.org/docs/sovereignty/data-sovereignty) — OCAP, CARE, at Māori Data Sovereignty principles
- [Support a Low-Resource Language](https://mtevalarena.org/docs/community/low-resource-languages) — Ang challenge kung saan nagsimula ang lahat
- [Cookbook: FST-Gated Pipeline](https://mtevalarena.org/docs/tutorials/fst-gated-pipeline) — Gumawa ng decomposition pipeline
- [MT Evaluation](https://mtevalarena.org/docs/leaderboard/rules) — Paano gumagana ang harness at leaderboard
- [Method Leaderboard](/leaderboard) — Live scores at submissions