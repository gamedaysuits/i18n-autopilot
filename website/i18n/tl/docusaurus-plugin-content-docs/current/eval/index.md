---
sidebar_position: 1
title: "MT Evaluation"
---
# MT Evaluation

Kasama sa rosetta ang isang machine translation evaluation framework na naka-design para sa **reproducible benchmarking** ng mga translation methods — lalo na para sa mga low-resource at Indigenous languages kung saan walang mga standard MT benchmarks at mahirap i-verify ang mga quality claims.

---

## The Leaderboard

Ang centerpiece nito ay ang **[Method Leaderboard](/leaderboard)** — isang live at Supabase-backed na scoreboard kung saan ang mga researchers at community members ay nagsu-submit at nagko-compare ng mga translation methods gamit ang fingerprinted at reproducible evaluation.

Bawat submission po ay may kasamang:

- **Fingerprinted pipeline** — naka-tie sa isang specific na Git commit at config hash, kaya ang mga results ay nate-trace back sa mismong code na nag-produce sa kanila
- **Versioned dataset** — content-hashed at versioned; ang mga scores ay pwede lang i-compare sa loob ng parehong dataset version
- **Standardised metrics** — lahat ng scoring ay kino-compute ng shared evaluation harness, para ma-eliminate ang mga implementation differences
- **Trust tiers** — self-benchmarked, GDS Verified, o Community Validated
- **Cost tracking** — API cost per submission, para transparent ang mga cost–quality tradeoffs

Kasalukuyang tina-track ng leaderboard ang tatlong metrics:

| Metric | Type | Ano ang Sinusukat Nito |
|--------|------|------------------|
| **chrF++** | Character n-gram F-score | Primary quality metric — nagko-correlate nang maayos sa human judgement, lalo na para sa mga morphologically rich languages |
| **Exact Match** | Proportion of perfect matches | Strict accuracy — gaano kadalas nagiging eksaktong gold standard ang translation? |
| **FST Acceptance** | Morphological gate pass rate | Para sa mga methods na may finite-state transducer verification — anong proportion ng mga outputs ang morphologically valid? |

**[→ Tingnan ang leaderboard](/leaderboard)**

---

## Available Datasets

### EDTeKLA Development Set v1

Ang unang evaluation dataset, na binuo para sa English→Plains Cree (SRO) translation. Ginawa ng [EdTeKLA research group](https://spaces.facsci.ualberta.ca/edtekla/) sa University of Alberta.

| Property | Value |
|----------|-------|
| **ID** | `edtekla-dev-v1` |
| **Language pair** | EN → CRK (Plains Cree, SRO orthography) |
| **Entry count** | 124 |
| **License** | [CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/) |
| **Provenance** | `gold_standard` (verified by speakers), `textbook` (published educational materials) |

### FLORES+ Devtest

Isang broad-coverage multilingual benchmark na minemaintain ng [Open Language Data Initiative (OLDI)](https://huggingface.co/datasets/openlanguagedata/flores_plus).

| Property | Value |
|----------|-------|
| **Language pairs** | EN → 39 languages (lahat ng rosetta registered languages) |
| **Entry count** | 1,012 sentences per language |
| **License** | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/) |
| **Source** | Originally Meta FLORES-200, ngayon ay OLDI-maintained na |
| **Location** | Pre-extracted fixtures sa `test/benchmark/fixtures/` sa main rosetta repo |

Tingnan ang [Evaluation Datasets](/docs/eval/datasets) para sa buong dataset schema, difficulty tiers, at kung paano gumawa ng sarili ninyo.

:::danger HUWAG MAG-TRAIN sa evaluation data

**Ang mga datasets na ito ay para sa evaluation-only.** Ang mga methods na na-train, na-fine-tune, na-few-shot-prompt, o na-expose sa evaluation data ay magpo-produce ng artificially inflated scores at madi-**disqualify sa leaderboard.**

Hindi po ito isang suggestion — ito ang pinaka-importanteng rule ng evaluation integrity. Gumamit ng separate corpora para sa training. Ang mga evaluation sets ay dapat manatiling unseen ng inyong model habang nasa development.

Kung gumagamit kayo ng coaching data o few-shot examples, dapat manggaling ang mga ito sa **completely separate sources**. Kung nagdududa, huwag na lang isama.
:::

:::warning LLM non-determinism

Ang mga LLM outputs ay non-deterministic. Ang mga scores ay nagre-represent ng point-in-time measurements sa ilalim ng specific na model versions at API configurations. Maaaring i-update ng mga model providers ang weights, decoding strategies, o safety filters anumang oras, na pwedeng mag-cause ng score drift sa pagitan ng mga runs. Nire-record ng leaderboard ang eksaktong model slug at timestamp para sa bawat submission.
:::

---

## Ano ang Katangian ng Isang Magandang Method

Hindi lahat ng methods ay pare-pareho. Narito ang naghihiwalay sa rigorous work mula sa mga inflated scores.

### Mga katangian ng isang strong method

- **Clean separation ng train at eval data** — hindi pa nakikita ng inyong method ang evaluation set habang nagde-development, tuning, prompt engineering, o few-shot example selection
- **Reproducible** — pwedeng i-clone ng iba ang inyong repo, i-run ang harness, at makuha ang parehong scores (sa loob ng LLM non-determinism bounds)
- **Documented** — naka-describe sa inyong [method card](/docs/eval/methods) kung ano ang ginagawa ng inyong method, anong tools ang ginagamit nito, at ano ang mga limitations nito
- **Honest sa scope** — kung gumagana lang ang inyong method para sa isang language pair, sabihin niyo po; kung nagde-degrade ito sa mga piling morphological patterns, i-document iyon
- **Community-aware** — para sa mga Indigenous languages, nire-respeto ng inyong method ang data sovereignty. Kumonsulta po kayo sa mga language communities o gumamit lang ng openly licensed data

### Mga red flags (kung ano ang nadi-disqualify)

| Red Flag | Bakit Ito Problema |
|----------|--------------------|
| Training sa eval data | Nasisira nito ang buong purpose ng evaluation. Nakaka-mislead sa lahat ang mga inflated scores. |
| Cherry-picking ng results | Pag-run ng 10 beses at pag-submit ng pinakamagandang run nang hindi dini-disclose ang iba |
| Undisclosed post-processing | Pag-fix nang manual sa mga outputs bago ang scoring |
| Contaminated coaching data | Paggamit ng eval set examples bilang few-shot prompts o dictionary entries |
| Pag-claim ng commercial readiness nang walang provenance | Kung gumagamit ang inyong method ng CC BY-NC-SA data, hindi pa ito commercially ready |

### Quality tiers sa leaderboard

Sinu-support ng leaderboard ang tatlong trust levels:

| Tier | Meaning | Paano Ito Makuha |
|------|---------|---------------|
| **Self-benchmarked** | Kayo mismo ang nag-run ng harness at nag-submit ng results | Mag-open ng PR kasama ang inyong run card |
| **GDS Verified** | Na-reproduce ng mga rosetta maintainers ang inyong results | I-submit ang inyong method bilang isang installable plugin |
| **Community Validated** | Na-reproduce ng mga independent community members ang results | Coming soon |

---

## Paano Mag-submit

1. **I-build ang inyong method** — tingnan ang [Building a Method](/docs/eval/methods) para sa method interface
2. **I-run ang harness** — tingnan ang [Eval Harness](/docs/eval/harness) para sa setup at usage
3. **Mag-generate ng run card** — nagpo-produce ang harness ng JSON run card kasama ang inyong scores, fingerprint, at metadata
4. **Mag-open ng PR** — i-submit ang inyong run card sa [eval harness repository](https://github.com/gamedaysuits/gds-mt-eval-harness)
5. **Lumabas sa leaderboard** — kapag na-merge na, lalabas ang inyong results sa [Method Leaderboard](/leaderboard)

---

## Future Directions

- **FLORES+ model comparison runs** — systematic evaluation ng mga frontier models (GPT-5.5, Claude Opus 4.7, Gemini 3.1 Pro, etc.) sa lahat ng 39 rosetta languages
- **Mas maraming language pairs** — Quechua, Inuktitut, at iba pang low-resource languages kapag naging available na ang mga community-verified datasets
- **Dataset import** — tooling para i-convert ang mga external evaluation datasets (WMT, Tatoeba, etc.) papunta sa rosetta evaluation format
- **Automated re-runs** — pag-detect ng model version changes at pag-re-run ng benchmarks para ma-track ang score drift

---

## Tingnan Din

- **[Method Leaderboard](/leaderboard)** — live scores at submissions
- **[Eval Harness](/docs/eval/harness)** — paano mag-run ng evaluations
- **[Evaluation Datasets](/docs/eval/datasets)** — dataset format at available datasets
- **[Building a Method](/docs/eval/methods)** — ang method interface specification
- **[Run Card Specification](/docs/eval/run-card)** — ang run card JSON schema
- **[Support a Low-Resource Language](/docs/guides/low-resource-languages)** — ang mas malawak na context kung bakit nag-e-exist ang framework na ito