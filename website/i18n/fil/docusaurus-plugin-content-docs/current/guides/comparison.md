---
sidebar_position: 7
title: "Pagkukumpara"
---
# Paano I-compare ang Rosetta

Nasa ibang category po ang i18n-rosetta kumpara sa karamihan ng mga localization tools. Narito po ang isang honest na comparison.

## Ang Landscape

Karamihan sa mga localization tooling ay nahahati sa isa sa tatlong categories:

| Category | Mga Example | Model |
|----------|----------|-------|
| **Cloud TMS Platforms** | Crowdin, Phrase, Locize, Tolgee | SaaS dashboard + human translators + monthly subscription |
| **Key Extraction Tools** | i18next-scanner, FormatJS CLI | Mag-scan ng source code para sa mga translation function calls |
| **CLI Translation Engines** | **i18n-rosetta** | I-run sa inyong project, i-translate ang files directly, walang cloud account |

Ang Rosetta ay isang **CLI translation engine** — tina-translate nito ang inyong mga locale files directly gamit ang mga configurable backends (LLMs, Google Translate, custom plugins). Walang cloud dashboard, walang human translator workflow, at walang monthly fee.

---

## Feature Comparison

| Feature | i18n-rosetta | Crowdin | Phrase | Locize |
|---------|:------------:|:-------:|:------:|:------:|
| **Nagra-run locally (walang cloud account)** | ✅ | ❌ | ❌ | ❌ |
| **Zero dependencies** | ✅ | ❌ | ❌ | ❌ |
| **Per-pair method configuration** | ✅ | ❌ | ❌ | ❌ |
| **Custom language registers** | ✅ | ❌ | ❌ | ❌ |
| **Content-aware (shini-shield ang code blocks)** | ✅ | ❌ | ❌ | ❌ |
| **Conlang & script conversion** | ✅ | ❌ | ❌ | ❌ |
| **Plugin architecture** | ✅ | ❌ | ❌ | ❌ |
| **Markdown / content translation** | ✅ | ✅ | ✅ | ❌ |
| **Translation Memory** | ✅ | ✅ | ✅ | ✅ |
| **XLIFF export/import** | ✅ | ✅ | ✅ | ❌ |
| **ICU plural validation** | ✅ | ✅ | ✅ | ❌ |
| **Terminology enforcement** | ✅ | ✅ | ✅ | ❌ |
| **Human translator workflow** | XLIFF-based | ✅ | ✅ | ✅ |
| **In-context editing (visual)** | ❌ | ✅ | ✅ | ✅ |
| **Team collaboration** | ❌ | ✅ | ✅ | ✅ |
| **File format support** | JSON, TOML, YAML, MD, XLIFF | 50+ | 40+ | JSON |
| **Pricing** | Libre (bayaran ang inyong LLM) | Mula $0/mo | Mula $0/mo | Mula $0/mo |

---

## Kailan Dapat Gamitin ang Rosetta

**Magandang gamitin ang Rosetta kapag:**

- Gusto niyo po ng machine translation na naka-bake na sa inyong build pipeline — hindi bilang isang separate na workflow
- Kailangan niyo ng per-language method control (LLM para sa iba, Google Translate sa iba, at custom plugins para sa natitira)
- Nagta-translate po kayo sa mga languages na walang API coverage (Indigenous, endangered, constructed)
- Gusto niyo ng deterministic na script output (Cree Syllabics, Klingon pIqaD, Tengwar)
- Gusto niyo ng zero vendor lock-in at zero cloud dependencies
- Kayo po ay isang solo developer o small team na hindi kailangan ng full TMS dashboard
- Gusto niyo ng XLIFF-based na handoff sa mga professional translators nang walang cloud subscription

**Mas magandang gamitin ang cloud TMS kapag:**

- Mayroon po kayong mga professional human translators na nagre-review ng bawat string (mas simple ang XLIFF workflow ng rosetta kumpara sa isang full TMS)
- Kailangan niyo ng cross-project translation memory at glossary management
- Kailangan niyo ng in-context visual editing (i-preview ang translations sa loob ng inyong UI)
- Mayroon kayong large team na may mga role-based access control needs
- Kailangan niyo ng 50+ file format support

---

## Mga Kayang Gawin ng Rosetta na Hindi Kaya ng Iba

### 1. Custom Registers

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

Walang ibang tool ang may kasamang 47 pre-configured language registers, o pumapayag na mag-define kayo ng custom registers per project.

### 2. Deterministic Script Converters

May kasamang limang built-in script converters ang Rosetta na nagra-run bilang mga post-translation hooks — hindi na kailangan ng LLM:

| Locale | Conversion | Example |
|--------|-----------|---------|
| `crk` | SRO → Cree Syllabics | `nêhiyawêwin` → `ᓀᐦᐃᔭᐍᐏᐣ` |
| `sr` | Latin → Cyrillic | `Beograd` → `Београд` |
| `tlh` | Romanization → pIqaD | `tlhIngan Hol` → (mga pIqaD glyph) |
| `x-elvish-s` | Latin → Tengwar | Sindarin → Tengwar (Mode of Beleriand) |
| `x-kryptonian` | Latin → Kryptonian | Cipher-substitution (kailangan ng font) |

Ang mga ito ay pure lookup-table converters — deterministic, auditable, at zero LLM hallucination risk.

### 3. Content-Aware Shielding

Kapag nagta-translate ng Markdown o rich content, shini-shield ng Rosetta ang:

- Fenced code blocks (` ``` `)
- Inline code (`` ` ` ``)
- Hugo shortcodes (`{{</* */>}}`, `{{%/* */%}}`)
- Interpolation variables (`{{ .Count }}`, `{name}`, `{{t('key')}}`)
- Raw HTML blocks

Pinapalitan po ang mga ito ng Unicode sentinel tokens bago ang translation at nire-restore pagkatapos. Hindi kailanman nakikita ng LLM ang inyong code, mga shortcodes, o mga variables.

### 4. Coached Method Plugins

Para sa mga languages na walang API coverage, pwede po kayong mag-build ng isang coached translation method:

1. Magsulat ng linguistic coaching data (grammar rules, vocabulary, mga example)
2. I-bundle ito bilang isang plugin
3. I-benchmark ito laban sa mga reference translations gamit ang [eval harness](https://github.com/gamedaysuits/gds-mt-eval-harness)
4. I-install ito sa inyong project gamit ang `i18n-rosetta plugin install`

Ganito hina-handle ng rosetta ang Plains Cree — at kung paano niyo rin maha-handle ang kahit anong language, pati na rin ang mga hindi pa nag-e-exist.

---

## Ang Bottom Line

Hindi po replacement ang Rosetta para sa Crowdin. Isa itong magkaibang tool para sa magkaibang workflow. Kung kailangan niyo ng mga human translators, gumamit po kayo ng TMS. Kung kailangan niyo ng CLI na magta-translate ng inyong files gamit ang isang command at bibigyan kayo ng per-language control sa mga methods, models, at registers — gamitin niyo po ang rosetta.