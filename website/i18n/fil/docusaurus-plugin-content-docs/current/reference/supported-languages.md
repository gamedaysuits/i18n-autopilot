---
sidebar_position: 4
title: "Mga Supported Languages"
---
# Mga Supported na Language

Ang rosetta ay may kasamang mga **Language Card** — mga structured reference file para sa 42+ na language. Naglalaman ang bawat card ng mga register preset, formality system metadata, method support flags, at script information. Kahit anong language na alam ng LLM mo ay pwedeng i-add gamit ang isang config line — ito ang mga may curated at production-ready na mga register.

---

## Mga Translation Method

Ang bawat language ay pwedeng gumamit ng isa o higit pa sa mga translation method na ito:

| Icon | Method | Paano Ito Gumagana | Cost |
|------|--------|-------------|------|
| 🟢 | **Google Translate** | Neural MT baseline. 130+ languages. Key-value strings lang — hindi kayang i-translate nang safe ang Markdown content. | ~$20/1M chars |
| 🔵 | **LLM (OpenRouter)** | Kahit anong language na alam ng model. Register-steered prompts. Kayang i-handle ang key-value + Markdown content. | Depende sa model |
| 🟣 | **LLM-Coached** | LLM + grammar dictionaries + coaching data na naka-inject sa mga prompt. Best para sa mga morphologically complex na language. | Depende sa model |
| 🟠 | **API (Plugin)** | Community-hosted translation pipelines na naka-serve over HTTP. [OCAP-compatible](/docs/guides/low-resource-languages). | Depende sa provider |

I-set ang `GOOGLE_TRANSLATE_API_KEY` para sa Google Translate, o `OPENROUTER_API_KEY` para sa mga LLM method. Tingnan ang [Mga Translation Method](/docs/guides/translation-methods) para sa buong detalye.

---

## Mga Priority Language

Ito ang mga pinakamadalas i-request na locale para sa mga web at mobile application, na naka-list ayon sa recommended accessibility-first order ng rosetta.

| Flag | Language | Code | Google | LLM | Coached | Script | Notes |
|------|----------|------|:------:|:---:|:-------:|--------|-------|
| 🇸🇦 | Arabic | `ar` | ✅ | ✅ | ✅ | — | RTL. Modern Standard Arabic (فصحى). |
| 🇵🇭 | Filipino (Taglish) | `tl` | ✅ | ✅ | ✅ | — | Code-switching: Tagalog primary, technical terms in English. |
| 🇫🇷 | French | `fr` | ✅ | ✅ | ✅ | — | Vous-form. Gender-inclusive (Connecté·e). |
| 🇪🇸 | Spanish | `es` | ✅ | ✅ | ✅ | — | Neutral Latin American. |
| 🇩🇪 | German | `de` | ✅ | ✅ | ✅ | — | Sie-form. Gender-inclusive (Benutzer:innen). |
| 🇯🇵 | Japanese | `ja` | ✅ | ✅ | ✅ | — | です/ます para sa body text, する para sa mga UI label. |
| 🇨🇳 | Chinese (Simplified) | `zh` | ✅ | ✅ | ✅ | — | 简体中文. |
| 🇮🇹 | Italian | `it` | ✅ | ✅ | ✅ | — | Lei-form. |
| 🇧🇷 | Portuguese (BR) | `pt` | ✅ | ✅ | ✅ | — | Brazilian Portuguese. |
| 🇰🇷 | Korean | `ko` | ✅ | ✅ | ✅ | — | 해요체 polite register. |

## Mga Major World Language

| Flag | Language | Code | Google | LLM | Coached | Script | Notes |
|------|----------|------|:------:|:---:|:-------:|--------|-------|
| 🇧🇩 | Bengali | `bn` | ✅ | ✅ | ✅ | — | শুদ্ধ ভাষা preference. |
| 🇧🇬 | Bulgarian | `bg` | ✅ | ✅ | ✅ | — | |
| 🇨🇿 | Czech | `cs` | ✅ | ✅ | ✅ | — | Vykání (vy-form). |
| 🇩🇰 | Danish | `da` | ✅ | ✅ | ✅ | — | |
| 🇬🇷 | Greek | `el` | ✅ | ✅ | ✅ | — | Modern Δημοτική. |
| 🇮🇷 | Persian | `fa` | ✅ | ✅ | ✅ | — | RTL. |
| 🇫🇮 | Finnish | `fi` | ✅ | ✅ | ✅ | — | Walang grammatical gender. |
| 🇮🇱 | Hebrew | `he` | ✅ | ✅ | ✅ | — | RTL. |
| 🇮🇳 | Hindi | `hi` | ✅ | ✅ | ✅ | — | शुद्ध हिन्दी. Minimal na English loanwords. |
| 🇭🇺 | Hungarian | `hu` | ✅ | ✅ | ✅ | — | Ön-form. |
| 🇮🇩 | Indonesian | `id` | ✅ | ✅ | ✅ | — | |
| 🇲🇾 | Malay | `ms` | ✅ | ✅ | ✅ | — | |
| 🇳🇱 | Dutch | `nl` | ✅ | ✅ | ✅ | — | U-form. |
| 🇳🇴 | Norwegian | `nb` | ✅ | ✅ | ✅ | — | Bokmål. |
| 🇵🇱 | Polish | `pl` | ✅ | ✅ | ✅ | — | Pan/Pani form. |
| 🇵🇹 | Portuguese (EU) | `pt-PT` | ✅ | ✅ | ✅ | — | European Portuguese. |
| 🇷🇴 | Romanian | `ro` | ✅ | ✅ | ✅ | — | |
| 🇷🇺 | Russian | `ru` | ✅ | ✅ | ✅ | — | Вы-form. |
| 🇸🇰 | Slovak | `sk` | ✅ | ✅ | ✅ | — | Vykanie (vy-form). |
| 🇷🇸 | Serbian | `sr` | ✅ | ✅ | ✅ | 🔤 Latin→Cyrillic | Deterministic script converter. |
| 🇸🇪 | Swedish | `sv` | ✅ | ✅ | ✅ | — | |
| 🇰🇪 | Swahili | `sw` | ✅ | ✅ | ✅ | — | |
| 🇹🇭 | Thai | `th` | ✅ | ✅ | ✅ | — | ครับ/ค่ะ politeness particles. |
| 🇹🇷 | Turkish | `tr` | ✅ | ✅ | ✅ | — | Siz-form. |
| 🇺🇦 | Ukrainian | `uk` | ✅ | ✅ | ✅ | — | Ви-form. |
| 🇵🇰 | Urdu | `ur` | ✅ | ✅ | ✅ | — | RTL. آپ form. |
| 🇻🇳 | Vietnamese | `vi` | ✅ | ✅ | ✅ | — | |
| 🇹🇼 | Chinese (Traditional) | `zh-TW` | ✅ | ✅ | ✅ | — | 繁體中文. |

## Mga Regional Variant

| Flag | Language | Code | Google | LLM | Coached | Script | Notes |
|------|----------|------|:------:|:---:|:-------:|--------|-------|
| 🇲🇽 | Mexican Spanish | `es-MX` | ✅ | ✅ | ✅ | — | Tú-form. Warm register. |
| 🇨🇦 | Canadian French | `fr-CA` | ✅ | ✅ | ✅ | — | Québécois idioms. |

---

## Mga Indigenous & Low-Resource Language

Hindi supported ang mga language na ito ng mga commercial MT service. Nagpo-provide ang rosetta ng tooling para sa mga language community na i-build ang sarili nilang mga method sa ilalim ng [mga OCAP principle](/docs/guides/low-resource-languages).

| | Language | Code | Google | LLM | Coached | Script | Status |
|---|----------|------|:------:|:---:|:-------:|--------|--------|
| 🪶 | Plains Cree | `crk` | ❌ | ✅ | ✅ | 🔤 SRO→Syllabics | 🚧 Under development |

:::info Ang Plains Cree ay under active development
Functional na ang register, coaching infrastructure, script converter, at evaluation harness para sa Plains Cree, pero **hindi pa nare-release** ang translation pipeline. Nakikipagtulungan po kami sa mga language community sa ilalim ng [mga OCAP principle](/docs/guides/low-resource-languages) para masiguro ang quality bago ito i-release. Tingnan ang [Suportahan ang isang Low-Resource Language](/docs/guides/low-resource-languages) para sa buong kwento — at kung paano ka makakapag-contribute.
:::

:::tip Pag-add ng mas marami pang low-resource language
Naka-design para dito ang method plugin system ng rosetta. Pwedeng mag-build ang isang language community ng custom translation method, i-host ito under their own control, at i-serve via the [API method](/docs/guides/serving-a-method). Tinu-track ng [Method Leaderboard](/leaderboard) ang mga score para sa kahit anong language pair — mag-build ng method, i-run ang harness, at i-claim ang top score.
:::

---

## Mga Constructed Language

Supported ang mga conlang via LLM registers at optional script converters. Gumagamit sila ng parehong infrastructure tulad ng mga totoong language — magkapareho ang paggana ng quality gate, coaching system, at script conversion pipeline.

| | Language | Code | Google | LLM | Script | Notes |
|---|----------|------|:------:|:---:|--------|-------|
| 🖖 | Klingon | `tlh` | ❌ | ✅ | 🔤 Romanization→pIqaD | Kailangan ng PUA font. Marc Okrand vocabulary. |
| 🧝 | Sindarin (Tolkien Elvish) | `x-elvish-s` | ❌ | ✅ | 🔤 Latin→Tengwar | Kailangan ng CSUR PUA font. |
| 🏴‍☠️ | Pirate English | `x-pirate` | ❌ | ✅ | — | Register only. Mga nautical metaphor. |
| 🦸 | Kryptonian | `x-kryptonian` | ❌ | ✅ | 🔤 Latin→Kryptonian | Kailangan ng PUA font. |
| 🎭 | Shakespearean English | `x-shakespeare` | ❌ | ✅ | — | Register only. Thee/thou, -eth/-est forms. |
| 🐸 | Yoda-speak | `x-yoda` | ❌ | ✅ | — | Register only. OSV word order. |

Tingnan ang [Mga Conlang, Script at Orthography](/docs/guides/conlangs-scripts-orthography) para sa mga PUA font requirement, Unicode limitation, at kung paano mag-add ng sarili mo.

---

## Mga Language Preset

Supported ng `init` wizard ang mga preset name para sa quick setup. Pwede mong i-mix ang mga preset sa mga individual code.

| Preset | Expands To |
|--------|-----------|
| `european` | fr, de, es, it, pt, nl |
| `asian` | ja, zh, ko |
| `global` | fr, es, de, ja, zh, ko, pt, ar |
| `nordic` | da, fi, nb, sv |

```bash
# Mix presets with individual codes
i18n-rosetta init
# → Target languages: european, ja
# → Resolves to: fr, de, es, it, pt, nl, ja
```

---

## Pag-add ng Kahit Anong Language

Kayang mag-translate ng rosetta sa **kahit anong language na alam ng LLM mo** — naka-list lang sa table sa itaas ang mga language na may built-in register presets. Para mag-add ng unlisted language, i-include ang BCP-47 code nito sa config mo:

```json
{
  "languages": {
    "sw": {},
    "am": {
      "register": "Formal Amharic. Professional register with Geʽez script."
    }
  }
}
```

Magta-translate ang LLM gamit ang training knowledge nito sa language. Ang pag-set ng `register` ay magbibigay sa iyo ng control sa tone, formality, at orthographic conventions. Tingnan ang [Configuration](/docs/getting-started/configuration) para sa mga detalye.

---

## Mga Language Card

Ang bawat built-in na language ay may **Language Card** — isang JSON file sa `lib/data/language-cards/` na naglalaman ng:

| Field | Ano Ang Laman Nito |
|-------|------------------|
| **Formality system** | T-V distinction, speech levels, keigo, particles, atbp. |
| **Register presets** | Mga named preset na specific sa character ng language |
| **Method support** | Kung aling mga translation API ang nagsu-support sa language na ito |
| **Gender guidance** | Mga grammatical gender rule at inclusive writing tips |
| **Script/direction** | ISO 15924 script code at RTL/LTR |
| **Eval datasets** | Kung aling mga benchmark ang nagco-cover sa language na ito |

### Paggamit ng mga Preset Key

Sa halip na magsulat ng buong register text, pwede kang gumamit ng preset key name:

```json
{
  "languages": {
    "fr": "casual-tu",
    "ko": "formal-hapsyo",
    "ja": "polite"
  }
}
```

Nire-resolve ng Rosetta ang key papunta sa buong register prompt. I-run ang `npx i18n-rosetta init` para makita ang mga available na preset para sa bawat language.

### Mga Example Preset

| Language | Mga Preset | Default |
|----------|---------|--------|
| French | `formal-vous`, `casual-tu` | `formal-vous` |
| Korean | `polite-haeyo`, `formal-hapsyo`, `casual-hae` | `polite-haeyo` |
| Japanese | `polite`, `formal-keigo`, `casual` | `polite` |
| German | `formal-Sie`, `casual-du` | `formal-Sie` |
| Thai | `neutral-professional`, `polite-male`, `polite-female` | `neutral-professional` |
| Spanish | `neutral-professional`, `formal-usted`, `casual-tuteo` | `neutral-professional` |

Tingnan ang [Pag-contribute ng Language Card](https://github.com/nicholasgriffintn/i18n-rosetta/blob/main/docs/planning/LANGUAGE_CARD_SPEC.md) para sa kung paano mag-add o mag-improve ng mga preset.

---

## Tingnan Din

- [Configuration](/docs/getting-started/configuration) — buong config reference kasama ang language setup
- [Mga Translation Method](/docs/guides/translation-methods) — kung paano gumagana ang bawat method
- [Mga Script Converter](/docs/concepts/script-converters) — deterministic script conversion pipeline
- [Mga Conlang, Script at Orthography](/docs/guides/conlangs-scripts-orthography) — mga PUA font, Unicode, pag-add ng mga conlang
- [Suportahan ang isang Low-Resource Language](/docs/guides/low-resource-languages) — pag-build ng mga method para sa mga underserved language