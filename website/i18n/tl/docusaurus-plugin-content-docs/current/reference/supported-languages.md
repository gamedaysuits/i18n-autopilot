---
sidebar_position: 4
title: "Mga Supported Languages"
---
# Mga Supported Languages

Ang rosetta ay may kasamang **Language Cards** — mga structured reference files para sa 42+ na languages. Bawat card ay naglalaman ng register presets, formality system metadata, method support flags, at script information. Kahit anong language na alam ng LLM mo ay pwedeng i-add gamit ang isang config line — ito po ang mga may curated at production-ready na registers.

---

## Mga Translation Methods

Bawat language ay pwedeng gumamit ng isa o higit pa sa mga translation methods na ito:

| Icon | Method | Paano Ito Gumagana | Cost |
|------|--------|-------------|------|
| 🟢 | **Google Translate** | Neural MT baseline. 130+ languages. Key-value strings lang — hindi kayang i-translate nang safe ang Markdown content. | ~$20/1M chars |
| 🔵 | **LLM (OpenRouter)** | Kahit anong language na alam ng model. Register-steered prompts. Kayang i-handle ang key-value + Markdown content. | Depende sa model |
| 🟣 | **LLM-Coached** | LLM + grammar dictionaries + coaching data na naka-inject sa prompts. Best para sa mga morphologically complex na languages. | Depende sa model |
| 🟠 | **API (Plugin)** | Community-hosted translation pipelines na sineserve over HTTP. [OCAP-compatible](https://mtevalarena.org/docs/community/low-resource-languages). | Depende sa provider |

I-set ang `GOOGLE_TRANSLATE_API_KEY` para sa Google Translate, o `OPENROUTER_API_KEY` para sa LLM methods. Tingnan ang [Translation Methods](/docs/guides/translation-methods) para sa buong detalye.

---

## Mga Priority Languages

Ito po ang mga pinaka-commonly requested na locales para sa web at mobile applications, na naka-list in rosetta's recommended accessibility-first order.

| Flag | Language | Code | Google | LLM | Coached | Script | Notes |
|------|----------|------|:------:|:---:|:-------:|--------|-------|
| 🇸🇦 | Arabic | `ar` | ✅ | ✅ | ✅ | — | RTL. Modern Standard Arabic (فصحى). |
| 🇵🇭 | Filipino (Taglish) | `tl` | ✅ | ✅ | ✅ | — | Code-switching: Tagalog primary, technical terms in English. |
| 🇫🇷 | French | `fr` | ✅ | ✅ | ✅ | — | Vous-form. Gender-inclusive (Connecté·e). |
| 🇪🇸 | Spanish | `es` | ✅ | ✅ | ✅ | — | Neutral Latin American. |
| 🇩🇪 | German | `de` | ✅ | ✅ | ✅ | — | Sie-form. Gender-inclusive (Benutzer:innen). |
| 🇯🇵 | Japanese | `ja` | ✅ | ✅ | ✅ | — | です/ます para sa body text, する para sa UI labels. |
| 🇨🇳 | Chinese (Simplified) | `zh` | ✅ | ✅ | ✅ | — | 简体中文. |
| 🇮🇹 | Italian | `it` | ✅ | ✅ | ✅ | — | Lei-form. |
| 🇧🇷 | Portuguese (BR) | `pt` | ✅ | ✅ | ✅ | — | Brazilian Portuguese. |
| 🇰🇷 | Korean | `ko` | ✅ | ✅ | ✅ | — | 해요체 polite register. |

## Mga Major World Languages

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
| 🇮🇳 | Hindi | `hi` | ✅ | ✅ | ✅ | — | शुद्ध हिन्दी. Minimal English loanwords. |
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

## Mga Regional Variants

| Flag | Language | Code | Google | LLM | Coached | Script | Notes |
|------|----------|------|:------:|:---:|:-------:|--------|-------|
| 🇲🇽 | Mexican Spanish | `es-MX` | ✅ | ✅ | ✅ | — | Tú-form. Warm register. |
| 🇨🇦 | Canadian French | `fr-CA` | ✅ | ✅ | ✅ | — | Québécois idioms. |

---

## Indigenous & Low-Resource Languages

Ang mga languages na ito ay hindi supported ng commercial MT services. Nagpo-provide ang rosetta ng tooling para sa mga language communities para makapag-build sila ng sarili nilang methods under [OCAP principles](https://mtevalarena.org/docs/community/low-resource-languages).

| | Language | Code | Google | LLM | Coached | Script | Status |
|---|----------|------|:------:|:---:|:-------:|--------|--------|
| 🪶 | Plains Cree | `crk` | ❌ | ✅ | ✅ | 🔤 SRO→Syllabics | 🚧 Under development |

:::info Ang Plains Cree ay under active development
Functional na po ang register, coaching infrastructure, script converter, at evaluation harness para sa Plains Cree, pero ang translation pipeline ay **hindi pa nare-release**. Nakikipag-work kami sa mga language communities under [OCAP principles](https://mtevalarena.org/docs/community/low-resource-languages) para ma-ensure ang quality bago i-release. Tingnan ang [Support a Low-Resource Language](https://mtevalarena.org/docs/community/low-resource-languages) para sa buong kwento — at kung paano kayo pwedeng mag-contribute.
:::

:::tip Pag-add ng mas maraming low-resource languages
Naka-design ang method plugin system ng rosetta para dito. Pwedeng mag-build ang isang language community ng custom translation method, i-host ito under their own control, at i-serve via the [API method](/docs/guides/serving-a-method). Tinu-track ng [Method Leaderboard](/leaderboard) ang scores para sa kahit anong language pair — mag-build ng method, i-run ang harness, at i-claim ang top score.
:::

---

## Mga Constructed Languages

Supported ang mga Conlangs via LLM registers at optional script converters. Gumagamit sila ng same infrastructure gaya ng mga totoong languages — identically nagwo-work ang quality gate, coaching system, at script conversion pipeline.

| | Language | Code | Google | LLM | Script | Notes |
|---|----------|------|:------:|:---:|--------|-------|
| 🖖 | Klingon | `tlh` | ❌ | ✅ | 🔤 Romanization→pIqaD | PUA font required. Marc Okrand vocabulary. |
| 🧝 | Sindarin (Tolkien Elvish) | `x-elvish-s` | ❌ | ✅ | 🔤 Latin→Tengwar | CSUR PUA font required. |
| 🏴‍☠️ | Pirate English | `x-pirate` | ❌ | ✅ | — | Register only. Nautical metaphors. |
| 🦸 | Kryptonian | `x-kryptonian` | ❌ | ✅ | 🔤 Latin→Kryptonian | PUA font required. |
| 🎭 | Shakespearean English | `x-shakespeare` | ❌ | ✅ | — | Register only. Thee/thou, -eth/-est forms. |
| 🐸 | Yoda-speak | `x-yoda` | ❌ | ✅ | — | Register only. OSV word order. |

Tingnan ang [Conlangs, Scripts & Orthography](/docs/guides/conlangs-scripts-orthography) para sa PUA font requirements, Unicode limitations, at kung paano mag-add ng sarili ninyo.

---

## Mga Language Presets

Sinu-support ng `init` wizard ang preset names para sa quick setup. Pwede ninyong i-mix ang presets sa mga individual codes.

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

Kayang mag-translate ng rosetta sa **kahit anong language na alam ng LLM mo** — naka-list lang sa table sa itaas ang mga languages na may built-in register presets. Para mag-add ng unlisted language, i-include ang BCP-47 code nito sa inyong config:

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

Magta-translate ang LLM gamit ang training knowledge nito sa language. Ang pag-set ng `register` ay nagbibigay sa inyo ng control sa tone, formality, at orthographic conventions. Tingnan ang [Configuration](/docs/getting-started/configuration) para sa detalye.

---

## Mga Language Cards

Bawat built-in language ay may **Language Card** — isang JSON file sa `lib/data/language-cards/` na naglalaman ng:

| Field | Ano ang Laman Nito |
|-------|------------------|
| **Formality system** | T-V distinction, speech levels, keigo, particles, etc. |
| **Register presets** | Named presets na specific sa character ng language |
| **Method support** | Kung aling translation APIs ang nagsu-support sa language na ito |
| **Gender guidance** | Grammatical gender rules at inclusive writing tips |
| **Script/direction** | ISO 15924 script code at RTL/LTR |
| **Eval datasets** | Kung aling benchmarks ang nagco-cover sa language na ito |

### Paggamit ng Preset Keys

Imbes na magsulat ng full register text, pwede kayong gumamit ng preset key name:

```json
{
  "languages": {
    "fr": "casual-tu",
    "ko": "formal-hapsyo",
    "ja": "polite"
  }
}
```

Nire-resolve ng Rosetta ang key papunta sa full register prompt. I-run ang `npx i18n-rosetta init` para makita ang mga available presets para sa bawat language.

### Mga Example Presets

| Language | Presets | Default |
|----------|---------|--------|
| French | `formal-vous`, `casual-tu` | `formal-vous` |
| Korean | `polite-haeyo`, `formal-hapsyo`, `casual-hae` | `polite-haeyo` |
| Japanese | `polite`, `formal-keigo`, `casual` | `polite` |
| German | `formal-Sie`, `casual-du` | `formal-Sie` |
| Thai | `neutral-professional`, `polite-male`, `polite-female` | `neutral-professional` |
| Spanish | `neutral-professional`, `formal-usted`, `casual-tuteo` | `neutral-professional` |

Tingnan ang [Contributing a Language Card](https://github.com/nicholasgriffintn/i18n-rosetta/blob/main/docs/planning/LANGUAGE_CARD_SPEC.md) para sa kung paano mag-add o mag-improve ng presets.

---

## Tingnan Din

- [Configuration](/docs/getting-started/configuration) — full config reference kasama ang language setup
- [Translation Methods](/docs/guides/translation-methods) — kung paano gumagana ang bawat method
- [Script Converters](/docs/concepts/script-converters) — deterministic script conversion pipeline
- [Conlangs, Scripts & Orthography](/docs/guides/conlangs-scripts-orthography) — PUA fonts, Unicode, pag-add ng conlangs
- [Support a Low-Resource Language](https://mtevalarena.org/docs/community/low-resource-languages) — pag-build ng methods para sa mga underserved languages