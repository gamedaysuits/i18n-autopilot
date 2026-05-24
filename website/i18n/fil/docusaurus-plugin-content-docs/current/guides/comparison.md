---
sidebar_position: 7
title: "Pagkukumpara"
---
# Paano I-compare ang Rosetta

Nasa ibang category ang i18n-rosetta kumpara sa karamihan ng mga localization tool. Heto po ang isang honest comparison.

## Ang Landscape

Karamihan sa mga localization tooling ay nahahati sa isa sa tatlong category:

| Category | Mga Example | Model |
|----------|----------|-------|
| **Cloud TMS Platforms** | Crowdin, Phrase, Locize, Tolgee | SaaS dashboard + mga human translator + monthly subscription |
| **Key Extraction Tools** | i18next-scanner, FormatJS CLI | Mag-scan ng source code para sa mga translation function call |
| **CLI Translation Engines** | **i18n-rosetta** | I-run sa inyong project, i-translate ang files directly, walang cloud account |

Ang Rosetta ay isang **CLI translation engine** — tina-translate nito ang inyong mga locale file directly gamit ang mga configurable backend (mga LLM, Google Translate, mga custom plugin). Walang cloud dashboard, walang human translator workflow, at walang monthly fee.

---

## Feature Comparison

| Feature | i18n-rosetta | Crowdin | Phrase | Locize |
|---------|:------------:|:-------:|:------:|:------:|
| **Nag-ru-run locally (walang cloud account)** | ✅ | ❌ | ❌ | ❌ |
| **Zero dependencies** | ✅ | ❌ | ❌ | ❌ |
| **Per-pair method configuration** | ✅ | ❌ | ❌ | ❌ |
| **Custom language registers** | ✅ | ❌ | ❌ | ❌ |
| **Content-aware (shini-shield ang mga code block)** | ✅ | ❌ | ❌ | ❌ |
| **Conlang & script conversion** | ✅ | ❌ | ❌ | ❌ |
| **Plugin architecture** | ✅ | ❌ | ❌ | ❌ |
| **Markdown / content translation** | ✅ | ✅ | ✅ | ❌ |
| **Human translator workflow** | ❌ | ✅ | ✅ | ✅ |
| **Translation memory** | ❌ | ✅ | ✅ | ✅ |
| **In-context editing (visual)** | ❌ | ✅ | ✅ | ✅ |
| **Team collaboration** | ❌ | ✅ | ✅ | ✅ |
| **File format support** | JSON, TOML, YAML, MD | 50+ | 40+ | JSON |
| **Pricing** | Libre (bayaran ang inyong LLM) | Mula $0/mo | Mula $0/mo | Mula $0/mo |

---

## Kailan Dapat Gamitin ang Rosetta

**Magandang gamitin ang Rosetta kapag:**

- Gusto ninyong naka-bake in ang machine translation sa inyong build pipeline — hindi bilang isang hiwalay na workflow
- Kailangan ninyo ng per-language method control (LLM para sa ilan, Google Translate sa iba, at mga custom plugin para sa natitira)
- Nagta-translate kayo sa mga language na walang API coverage (Indigenous, endangered, constructed)
- Gusto ninyo ng deterministic script output (Cree Syllabics, Klingon pIqaD, Tengwar)
- Gusto ninyo ng zero vendor lock-in at zero cloud dependencies
- Kayo ay isang solo developer o small team na hindi kailangan ng human translator workflow

**Mas magandang gamitin ang isang cloud TMS kapag:**

- Mayroon kayong mga professional human translator na nagre-review ng bawat string
- Kailangan ninyo ng translation memory at glossary management across projects
- Kailangan ninyo ng in-context visual editing (i-preview ang mga translation sa loob ng inyong UI)
- Mayroon kayong large team na may mga role-based access control na pangangailangan
- Kailangan ninyo ng 50+ file format support

---

## Mga Nagagawa ng Rosetta na Hindi Nagagawa ng Iba

### 1. Mga Custom Register

Bawat language pair ay nakakakuha ng culturally-appropriate na tone instructions para sa LLM:

```json
{
  "de": {
    "register": "Standard professional register. Use Sie-form for formal address."
  },
  "tl": {
    "register": "Educated Manila Taglish. Use Tagalog as the primary language but keep technical terms in English."
  },
  "tlh": {
    "register": "Warrior's honor. OVS grammar. Use Marc Okrand vocabulary."
  }
}
```

Walang ibang tool ang may kasamang 47 pre-configured language registers, o nagpapahintulot sa inyong mag-define ng mga custom register per project.

### 2. Mga Deterministic Script Converter

May kasamang limang built-in script converter ang Rosetta na nag-ru-run bilang mga post-translation hook — hindi kailangan ng LLM:

| Locale | Conversion | Example |
|--------|-----------|---------|
| `crk` | SRO → Cree Syllabics | `nêhiyawêwin` → `ᓀᐦᐃᔭᐍᐏᐣ` |
| `sr` | Latin → Cyrillic | `Beograd` → `Београд` |
| `tlh` | Romanization → pIqaD | `tlhIngan Hol` → (mga pIqaD glyph) |
| `x-elvish-s` | Latin → Tengwar | Sindarin → Tengwar (Mode of Beleriand) |
| `x-kryptonian` | Latin → Kryptonian | Cipher-substitution (kailangan ng font) |

Ang mga ito ay pure lookup-table converters — deterministic, auditable, at zero ang risk ng LLM hallucination.

### 3. Content-Aware Shielding

Kapag nagta-translate ng Markdown o rich content, shini-shield ng Rosetta ang:

- Mga fenced code block (` ``` `)
- Inline code (`` ` ` ``)
- Mga Hugo shortcode (`{{</* */>}}`, `{{%/* */%}}`)
- Mga interpolation variable (`{{ .Count }}`, `{name}`, `{{t('key')}}`)
- Mga raw HTML block

Pinapalitan ang mga ito ng mga Unicode sentinel token bago ang translation at nire-restore pagkatapos. Hindi kailanman nakikita ng LLM ang inyong code, mga shortcode, o mga variable.

### 4. Mga Coached Method Plugin

Para sa mga language na walang API coverage, maaari kayong bumuo ng isang coached translation method:

1. Magsulat ng linguistic coaching data (mga grammar rule, vocabulary, mga example)
2. I-bundle ito bilang isang plugin
3. I-benchmark ito laban sa mga reference translation gamit ang [eval harness](https://github.com/gamedaysuits/gds-mt-eval-harness)
4. I-install ito sa inyong project gamit ang `i18n-rosetta plugin install`

Ganito hina-handle ng rosetta ang Plains Cree — at kung paano ninyo maha-handle ang kahit anong language, pati na rin ang mga hindi pa nag-e-exist.

---

## Ang Bottom Line

Ang Rosetta ay hindi replacement para sa Crowdin. Ito ay isang magkaibang tool para sa isang magkaibang workflow. Kung kailangan ninyo ng mga human translator, gumamit ng TMS. Kung kailangan ninyo ng isang CLI na magta-translate ng inyong mga file gamit ang isang command at magbibigay sa inyo ng per-language control sa mga method, model, at register — gamitin ang rosetta.