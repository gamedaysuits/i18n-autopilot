---
sidebar_position: 1
slug: /
title: "Panimula"
---
# i18n-rosetta

Isang fully customizable na internationalization framework. Isang command lang, translated na ang iyong mga locale files. Isang config lang ang kumokontrol sa bawat method, model, at language pair. At kung hindi sapat ang mga built-in methods — pwede kang mag-build ng sarili mo, patunayan na gumagana ito, at i-deploy.

```bash
npx i18n-rosetta sync
```

Nag-a-auto-detect ang rosetta ng iyong mga locale files, format, at target languages. Tina-translate nito kung ano ang missing, ini-skip ang mga tapos na, vina-validate ang bawat result, at nagra-write ng clean output. Iyan po ang starting line.

---

## Bakit Hindi Mo Na Lang I-Script Mismo?

Pwede ka namang gumawa ng quick loop na nagco-call sa Google Translate para sa bawat key. Karamihan sa mga developers ay ginagawa ito — aabutin lang ng mga 30 lines. Pero dito po nagkakaproblema:

- **Walang change detection.** Kapag nag-update ka ng English string — mananatiling stale ang translation forever. Tinu-track ng rosetta ang bawat source value gamit ang SHA-256 hashes at nire-re-translate lang kung ano ang nagbago.
- **Walang batching.** Ang isang API call per key ay nangangahulugang 200 keys = 200 round trips. Nagba-batch nang intelligently ang rosetta (configurable, default ay 30 keys/batch para sa LLM, 128 para sa Google).
- **Walang quality gate.** Nagha-hallucinate ang machine translation, nag-e-echo pabalik ng source, o nag-o-output sa maling script. Vina-validate ng rosetta ang bawat translation bago ito i-write — ang wrong-script, length inflation, at source echoes ay naca-catch at nire-reject.
- **Walang format awareness.** Hardcoded ba sa JSON? Hinahandle ng rosetta ang JSON, TOML, YAML, at Hugo Markdown (frontmatter + body) na may auto-detection.
- **Walang method control.** Parehong method ang nakukuha ng bawat pair. Hinahayaan ka ng rosetta na gumamit ng Google Translate para sa French, isang LLM para sa Japanese, at isang custom community-hosted pipeline para sa Cree — sa iisang config file lang.

Ang rosetta ay ang production version ng script na iyon.

---

## Ano Ang Pinagkaiba Nito

### Bawat method ay isang plugin

Ang translation method ay **configurable per language pair**. Pagsama-samahin ang Google Translate, mga LLMs, coached prompts, at custom APIs sa iisang project:

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

Sa French, Google Translate ang gamit (fast, cheap). Sa Japanese, premium LLM ang gamit (nuanced). Sa Plains Cree, coached plugin na may grammar rules, dictionaries, at morphological validation. Parehong `sync` command. Parehong quality gate. Parehong CLI.

### Patunayan mo

Tingin mo ba kaya ng method mo na mag-translate ng English to Spanish? Turkish to Azerbaijani? English to Cree?

**Patunayan mo.** Ang kasamang [eval harness](https://mtevalarena.org/docs/specifications/harness) ay nagbe-benchmark ng kahit anong translation method na may reproducible at fingerprinted na scoring. Tinu-track ng [leaderboard](/leaderboard) ang bawat submission.

Ang eval harness at ang production CLI ay nagse-share ng parehong plugin interface. Ang isang method na may magandang score sa harness ay pwedeng gamitin sa production — kung magbibigay ng consent ang community ng wikang sineserbisyuhan nito. Para sa mga Indigenous at low-resource languages, mahalaga po ang consent na iyan. Tingnan ang [Data Sovereignty](https://mtevalarena.org/docs/sovereignty/data-sovereignty).

```bash
# Benchmark your method (in the eval harness repo)
cd gds-mt-eval-harness
python eval/baseline_experiment.py --dataset data/edtekla-dev-v1.json --submit

# Use it locally
npx i18n-rosetta sync
```

Parehong plugin. Plug and test lang po.

### Ang buong toolkit

Ang rosetta ay hindi lang basta `sync`. Isa itong kumpletong i18n pipeline:

| Command | Ano Ang Ginagawa Nito |
|---------|-------------|
| `sync` | Mag-translate ng missing, stale, at fallback keys |
| `watch` | Mag-auto-sync kapag nagbago ang iyong source file |
| `lint` | Mag-scan ng source code para sa mga hardcoded strings |
| `wrap` | Mag-auto-wrap ng hardcoded strings sa mga `t()` calls |
| `audit` | I-list ang lahat ng untranslated na `[EN]` fallback values |
| `integrity` | Mag-detect ng placeholder corruption at encoding issues |
| `seo` | Mag-generate ng hreflang tags, sitemaps, at JSON-LD |
| `status` | I-show ang pair config, plugins, at benchmark scores |
| `provenance` | Mag-audit ng translation resource licensing |
| `plugin` | Mag-install, remove, at mag-list ng method plugins |

Tatlo sa mga ito — `lint`, `sync`, `audit` — ay bumubuo ng isang CI pipeline na nagca-catch ng mga hardcoded strings, tina-translate ang mga ito, at nagfe-fail ng build kung may anumang locale na incomplete.

---

## Ang Arena

Ang [Method Leaderboard](/leaderboard) ay ang scoreboard. Ang bawat submission ay naka-fingerprint sa isang Git commit, naka-version sa isang specific na dataset, at ini-score ng parehong harness. Kahit sino ay pwedeng mag-submit.

**Ano ang kaya mong patunayan?** Tumatanggap ng JSON ang harness. Tumatanggap ng JSON ang mga plugins. Kahit anong method na nagpo-produce ng JSON ay pwedeng ma-test:

| Approach | Example |
|----------|---------|
| **Coached LLM** | Mag-inject ng grammar rules at dictionaries sa prompt ng isang frontier model |
| **Fine-tuned model** | Mag-train ng open model sa parallel text — huwag lang sa eval data |
| **FST-gated pipeline** | Magge-generate ang LLM → iva-validate ng finite-state transducer ang morphology → magre-retry |
| **Chained models** | Magda-draft ang Model A → magpo-post-edit ang Model B → mag-i-score ang Model C |
| **Dictionary + LLM** | I-force ang mga known terms mula sa isang dictionary, hayaan ang LLM na mag-handle sa iba |
| **Evolutionary** | Mag-generate ng candidates, i-score ang mga ito, i-mutate ang the best, at ulitin |
| **Partial translation** | Mag-translate ng sample by hand, patunayan na nagma-match ang iyong LLM, i-auto-translate ang natitira |

Mag-fine-tune ng mga models. Mag-deploy ng mga evolutionary algorithms. I-test ang mga sagot ng estudyante sa mga language exams. Mag-build ng mga lookup tables. I-chain ang tatlong models nang magkakasama. Basta't nagpo-produce ng JSON ang method mo, i-i-score ito ng harness at ira-run ito ng framework.

:::danger Ang nag-iisang rule
**Huwag mag-train sa evaluation data.** Ang mga methods na na-expose sa benchmark dataset ay madi-disqualify. Mag-fine-tune ka sa kahit anong gusto mo. Huwag lang sa test set.
:::

Isa itong open invitation. Kung nagtatrabaho ka gamit ang isang low-resource language — bilang isang researcher, community member, estudyante, o kahit sinong may paki — mag-build ka ng method, i-run ang harness, at i-claim ang top score. Unsolved pa ang problemang ito. Nandito na ang infrastructure.

**[→ Tingnan ang leaderboard](/leaderboard)**

---

## Next Steps

**Getting started:**
- [Installation](/docs/getting-started/installation) — I-set up sa loob ng 2 minutes
- [Quick Start](/docs/getting-started/quick-start) — I-run ang iyong unang sync
- [Supported Languages](/docs/reference/supported-languages) — Kung ano ang available out of the box

**Customizing your setup:**
- [Translation Methods](/docs/guides/translation-methods) — Piliin ang tamang method per pair
- [Configuration](/docs/getting-started/configuration) — Full config reference
- [Hugo Multilingual Site](/docs/tutorials/hugo-multilingual-site) — Markdown content translation

**Going deeper:**
- [Data Sovereignty](https://mtevalarena.org/docs/sovereignty/data-sovereignty) — Mga prinsipyo ng OCAP, CARE, at Māori Data Sovereignty
- [Support a Low-Resource Language](https://mtevalarena.org/docs/community/low-resource-languages) — Ang challenge na nagpasimula ng lahat
- [Cookbook: FST-Gated Pipeline](https://mtevalarena.org/docs/tutorials/fst-gated-pipeline) — Mag-build ng decomposition pipeline
- [MT Evaluation](https://mtevalarena.org/docs/leaderboard/rules) — Paano gumagana ang harness at leaderboard
- [Method Leaderboard](/leaderboard) — Mga live scores at submissions