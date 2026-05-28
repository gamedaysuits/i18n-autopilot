---
sidebar_position: 4
title: "Mga Supported na Wika"
---
# Mga Supported na Language

Ang rosetta ay may kasamang **Language Cards** — mga structured configuration file para sa 50 na language. Ang bawat card ay naglalaman ng mga register preset, formality system metadata, method support flags, typography rules, at script information. Kahit anong language na alam ng inyong LLM ay pwedeng i-add gamit ang isang config line — ito po ang mga may curated at production-ready na mga register.

---

## Mga Translation Method

Ang bawat language ay pwedeng gumamit ng isa o higit pa sa mga translation method na ito:

| Icon | Method | Paano Ito Gumagana | Cost |
|------|--------|-------------|------|
| 🟢 | **Google Translate** | Neural MT baseline. 130+ na language. Key-value strings lang — hindi safe na i-translate ang Markdown content. | ~$20/1M chars |
| 🔵 | **LLM (OpenRouter)** | Kahit anong language na alam ng model. Register-steered prompts. Kayang i-handle ang key-value + Markdown content. | Nakadepende sa model |
| 🟣 | **LLM-Coached** | LLM + grammar dictionaries + coaching data na naka-inject sa mga prompt. Best para sa mga morphologically complex na language. | Nakadepende sa model |
| 🟠 | **API (Plugin)** | Mga community-hosted na translation pipeline na sineserve over HTTP. [OCAP-compatible](https://mtevalarena.org/docs/community/low-resource-languages). | Nakadepende sa provider |

I-set ang `GOOGLE_TRANSLATE_API_KEY` para sa Google Translate, o `OPENROUTER_API_KEY` para sa mga LLM method. Tingnan po ang [Mga Translation Method](/docs/guides/translation-methods) para sa buong detalye.

---

## Mga Priority Language

Ito po ang mga pinakamadalas i-request na locale para sa mga web at mobile application, na naka-list sa recommended accessibility-first order ng rosetta.

| Flag | Language | Code | Google | LLM | Coached | Script | Notes |
|------|----------|------|:------:|:---:|:-------:|--------|-------|
| 🇸🇦 | Arabic | `ar` | ✅ | ✅ | ✅ | — | RTL. Modern Standard Arabic (فصحى). |
| 🇵🇭 | Filipino (Taglish) | `tl` / `fil` | ✅ | ✅ | ✅ | — | Gamitin ang `fil` sa mga Docusaurus config. Nire-resolve ng rosetta pareho. |
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
| 🇮🇳 | Hindi | `hi` | ✅ | ✅ | ✅ | — | शुद्ध हिन्दी. Minimal na mga English loanword. |
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
| 🇬🇪 | Georgian | `ka` | ✅ | ✅ | — | — | ქართული. Kartvelian family. |
| 🇳🇬 | Yoruba | `yo` | ✅ | ✅ | — | — | Èdè Yorùbá. Tonal (3 tones). |

## Mga Regional Variant

| Flag | Language | Code | Google | LLM | Coached | Script | Notes |
|------|----------|------|:------:|:---:|:-------:|--------|-------|
| 🇲🇽 | Mexican Spanish | `es-MX` | ✅ | ✅ | ✅ | — | Tú-form. Warm register. |
| 🇨🇦 | Canadian French | `fr-CA` | ✅ | ✅ | ✅ | — | Mga Québécois idiom. |

---

## Mga Indigenous & Low-Resource Language

Ang mga language na ito ay hindi supported ng mga commercial MT service. Nagpo-provide ang rosetta ng tooling para sa mga language community upang makabuo ng sarili nilang mga method sa ilalim ng [mga OCAP principle](https://mtevalarena.org/docs/community/low-resource-languages).

| | Language | Code | Google | LLM | Coached | Script | Status |
|---|----------|------|:------:|:---:|:-------:|--------|--------|
| 🪶 | Plains Cree | `crk` | ❌ | ✅ | ✅ | 🔤 SRO→Syllabics | 🚧 Under development |
| 🌄 | Quechua | `qu` | ✅ | ✅ | — | — | Runasimi. Mga evidential suffix. |

:::info Ang Plains Cree ay under active development
Functional na po ang register, coaching infrastructure, script converter, at evaluation harness para sa Plains Cree, pero **hindi pa narerelease** ang translation pipeline. Nakikipag-work kami sa mga language community sa ilalim ng [mga OCAP principle](https://mtevalarena.org/docs/community/low-resource-languages) para masiguro ang quality bago ito i-release. Tingnan ang [Suportahan ang isang Low-Resource Language](https://mtevalarena.org/docs/community/low-resource-languages) para sa buong kwento — at kung paano kayo pwedeng mag-contribute.
:::

:::tip Pag-add ng mas marami pang low-resource language
Naka-design ang method plugin system ng rosetta para dito. Pwedeng gumawa ang isang language community ng custom translation method, i-host ito under their own control, at i-serve ito via the [API method](/docs/guides/serving-a-method). Tinu-track ng [Method Leaderboard](/leaderboard) ang mga score para sa kahit anong language pair — mag-build ng method, i-run ang harness, at i-claim ang top score.
:::

---

## Mga Constructed Language

Supported ang mga conlang via LLM registers at optional na mga script converter. Gumagamit sila ng parehong infrastructure tulad ng mga totoong language — identically na gumagana ang quality gate, coaching system, at script conversion pipeline.

| | Language | Code | Google | LLM | Script | Notes |
|---|----------|------|:------:|:---:|--------|-------|
| 🖖 | Klingon | `tlh` | ❌ | ✅ | 🔤 Romanization→pIqaD | Kailangan ng PUA font. Marc Okrand vocabulary. |
| 🧝 | Sindarin (Tolkien Elvish) | `x-elvish-s` | ❌ | ✅ | 🔤 Latin→Tengwar | Kailangan ng CSUR PUA font. |
| 🏴‍☠️ | Pirate English | `x-pirate` | ❌ | ✅ | — | Register lang. Mga nautical metaphor. |
| 🦸 | Kryptonian | `x-kryptonian` | ❌ | ✅ | 🔤 Latin→Kryptonian | Kailangan ng PUA font. |
| 🎭 | Shakespearean English | `x-shakespeare` | ❌ | ✅ | — | Register lang. Thee/thou, -eth/-est forms. |
| 🐸 | Yoda-speak | `x-yoda` | ❌ | ✅ | — | Register lang. OSV word order. |

Tingnan po ang [Mga Conlang, Script, at Orthography](/docs/guides/conlangs-scripts-orthography) para sa mga PUA font requirement, Unicode limitation, at kung paano i-add ang inyong sariling conlang.

---

## Mga Language Preset

Sinu-support ng `init` wizard ang mga preset name para sa quick setup. Pwede ninyong i-mix ang mga preset sa mga individual code.

| Preset | Nag-eexpand Sa |
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

Kaya ng rosetta na mag-translate sa **kahit anong language na alam ng inyong LLM** — naka-list lang sa table sa itaas ang mga language na may built-in na mga register preset. Para mag-add ng unlisted language, i-include lang ang BCP-47 code nito sa inyong config:

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

Magta-translate ang LLM gamit ang training knowledge nito sa language. Ang pag-set ng `register` ay magbibigay sa inyo ng control sa tone, formality, at mga orthographic convention. Tingnan ang [Configuration](/docs/getting-started/configuration) para sa mga detalye.

---

## Mga Language Card

Ang bawat built-in na language ay may **Language Card** — structured JSON configuration na naka-split sa dalawang tier para sa performance:

### Two-Tier Architecture

| Tier | Directory | Na-load | Purpose |
|------|-----------|--------|--------|
| **Runtime** | `lib/data/language-cards/` | Eagerly sa `import` | Translation engine: mga register, formality, mga rule, method support |
| **Reference** | `lib/data/language-reference/` | Lazily on demand | Developer docs: mga linguistic challenge, encyclopedic data, mga NLP resource |

Nananatiling maliit ang runtime tier (~2 KB/card) kaya hindi naglo-load ng megabytes ng documentation data kapag nag-import ng rosetta. Available ang reference tier via `getLanguageReference(code)` para sa mga tool, sa website, at sa eval harness.

### Mga Runtime Card Field

| Field | Nilalaman Nito |
|-------|------------------|
| **`nativeName`** | Endonym — ang pangalan ng language para sa sarili nito, sa sarili nitong script (hal., ქართული, Runasimi) |
| **Formality system** | T-V distinction, speech levels, keigo, mga particle, atbp. |
| **Register presets** | Mga named LLM prompt preset na specific sa character ng language |
| **Method support** | Kung aling mga translation API ang nagsu-support sa language na ito |
| **Gender guidance** | Mga grammatical gender rule at inclusive writing tip |
| **Script/direction** | ISO 15924 script code at RTL/LTR |
| **Rules** | Typography (mga quote, spacing), capitalization, mga plural category |
| **Eval datasets** | Kung aling mga benchmark ang nagco-cover sa language na ito |
| **`glottocode`** | Canonical Glottolog identifier para sa cross-referencing |
| **`humanReviewed`** | Kung na-review na ang card ng isang speaker |

### Mga Reference Card Field

| Field | Nilalaman Nito |
|-------|------------------|
| **Linguistic challenges** | Mga MT-specific pitfall (hal., evidentiality, tonal diacritics, agglutination) |
| **Encyclopedic** | Language family, classification, speaker count, mga region |
| **Resources** | Mga NLP tool, parallel corpora, mga pre-trained model |

### Pag-scaffold ng Bagong Language Card

Gamitin ang generator para i-scaffold ang parehong tier mula sa mga authoritative data source (IANA, CLDR, Glottolog):

```bash
# Preview what would be generated
node scripts/generate-language-card.mjs sw --dry-run

# Generate both runtime + reference cards
node scripts/generate-language-card.mjs sw
```

Ina-auto-populate ng generator ang metadata (mga code, script, direction, mga plural, mga quote, method support, language family) at minamarkahan ang mga linguistic judgment field bilang TODO para sa human curation.

### Paggamit ng mga Preset Key

Imbes na isulat ang buong register text, pwede po kayong gumamit ng preset key name:

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

Tingnan ang [Pag-contribute ng Language Card](https://github.com/gamedaysuits/i18n-rosetta) para sa buong spec, kasama na ang field validation at PR checklist.

---

## Tingnan Din

- [Configuration](/docs/getting-started/configuration) — buong config reference kasama ang language setup
- [Mga Translation Method](/docs/guides/translation-methods) — kung paano gumagana ang bawat method
- [Mga Script Converter](/docs/concepts/script-converters) — deterministic script conversion pipeline
- [Mga Conlang, Script, at Orthography](/docs/guides/conlangs-scripts-orthography) — mga PUA font, Unicode, pag-add ng mga conlang
- [Suportahan ang isang Low-Resource Language](https://mtevalarena.org/docs/community/low-resource-languages) — pag-build ng mga method para sa mga underserved na language