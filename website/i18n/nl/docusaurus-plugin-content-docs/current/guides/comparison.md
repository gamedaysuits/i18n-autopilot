---
sidebar_position: 7
title: "Vergelijking"
---
# Hoe Rosetta zich verhoudt

i18n-rosetta bevindt zich in een andere categorie dan de meeste lokalisatietools. Hier is een eerlijke vergelijking.

## Het landschap

De meeste lokalisatietools vallen in een van de volgende drie categorieën:

| Categorie | Voorbeelden | Model |
|----------|----------|-------|
| **Cloud TMS Platforms** | Crowdin, Phrase, Locize, Tolgee | SaaS-dashboard + menselijke vertalers + maandelijks abonnement |
| **Key Extraction Tools** | i18next-scanner, FormatJS CLI | Broncode scannen op aanroepen van vertaalfuncties |
| **CLI Translation Engines** | **i18n-rosetta** | Draait in uw project, vertaalt bestanden rechtstreeks, geen cloudaccount nodig |

Rosetta is een **CLI translation engine** — het vertaalt uw locale-bestanden rechtstreeks met behulp van configureerbare backends (LLM's, Google Translate, aangepaste plug-ins). Geen cloud-dashboard, geen workflow voor menselijke vertalers, geen maandelijkse kosten.

---

## Vergelijking van functies

| Functie | i18n-rosetta | Crowdin | Phrase | Locize |
|---------|:------------:|:-------:|:------:|:------:|
| **Draait lokaal (geen cloudaccount)** | ✅ | ❌ | ❌ | ❌ |
| **Geen afhankelijkheden** | ✅ | ❌ | ❌ | ❌ |
| **Methodeconfiguratie per talenpaar** | ✅ | ❌ | ❌ | ❌ |
| **Aangepaste taalregisters** | ✅ | ❌ | ❌ | ❌ |
| **Content-aware (schermt codeblokken af)** | ✅ | ❌ | ❌ | ❌ |
| **Conlang- & scriptconversie** | ✅ | ❌ | ❌ | ❌ |
| **Plug-in-architectuur** | ✅ | ❌ | ❌ | ❌ |
| **Markdown- / contentvertaling** | ✅ | ✅ | ✅ | ❌ |
| **Translation Memory** | ✅ | ✅ | ✅ | ✅ |
| **XLIFF-export/-import** | ✅ | ✅ | ✅ | ❌ |
| **ICU-meervoudsvalidatie** | ✅ | ✅ | ✅ | ❌ |
| **Terminologiehandhaving** | ✅ | ✅ | ✅ | ❌ |
| **Workflow voor menselijke vertalers** | Op basis van XLIFF | ✅ | ✅ | ✅ |
| **In-context bewerken (visueel)** | ❌ | ✅ | ✅ | ✅ |
| **Teamsamenwerking** | ❌ | ✅ | ✅ | ✅ |
| **Ondersteuning voor bestandsindelingen** | JSON, TOML, YAML, MD, XLIFF | 50+ | 40+ | JSON |
| **Prijzen** | Gratis (u betaalt voor uw LLM) | Vanaf $0/mnd | Vanaf $0/mnd | Vanaf $0/mnd |

---

## Wanneer u Rosetta kunt gebruiken

**Rosetta is een goede keuze wanneer:**

- U machinevertaling in uw build-pipeline wilt integreren — niet als een afzonderlijke workflow
- U controle over de methode per taal nodig heeft (LLM voor sommige, Google Translate voor andere, aangepaste plug-ins voor de rest)
- U vertaalt naar talen zonder API-dekking (inheemse, bedreigde of geconstrueerde talen)
- U deterministische scriptuitvoer wilt (Cree Syllabics, Klingon pIqaD, Tengwar)
- U geen vendor lock-in en geen cloud-afhankelijkheden wilt
- U een solo-ontwikkelaar of een klein team bent dat geen volledig TMS-dashboard nodig heeft
- U een op XLIFF gebaseerde overdracht aan professionele vertalers wilt zonder een cloudabonnement

**Een cloud-TMS is een betere keuze wanneer:**

- U professionele menselijke vertalers heeft die elke string beoordelen (de XLIFF-workflow van rosetta is eenvoudiger dan een volledig TMS)
- U projectoverschrijdend Translation Memory en woordenlijstbeheer nodig heeft
- U in-context visueel wilt bewerken (vertalingen bekijken in uw UI)
- U een groot team heeft met behoefte aan toegangsbeheer op basis van rollen (Role-Based Access Control)
- U ondersteuning voor meer dan 50 bestandsindelingen nodig heeft

---

## Wat Rosetta doet dat niemand anders doet

### 1. Aangepaste registers

Elk talenpaar krijgt cultureel passende tooninstructies voor de LLM:

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

Geen enkele andere tool wordt geleverd met 47 vooraf geconfigureerde taalregisters, of laat u aangepaste registers per project definiëren.

### 2. Deterministische scriptconverters

Rosetta wordt geleverd met vijf ingebouwde scriptconverters die als post-translation hooks draaien — geen LLM nodig:

| Locale | Conversie | Voorbeeld |
|--------|-----------|---------|
| `crk` | SRO → Cree Syllabics | `nêhiyawêwin` → `ᓀᐦᐃᔭᐍᐏᐣ` |
| `sr` | Latijn → Cyrillisch | `Beograd` → `Београд` |
| `tlh` | Romanisatie → pIqaD | `tlhIngan Hol` → (pIqaD-tekens) |
| `x-elvish-s` | Latijn → Tengwar | Sindarijns → Tengwar (Modus van Beleriand) |
| `x-kryptonian` | Latijn → Kryptoniaans | Cijfersubstitutie (vereist lettertype) |

Dit zijn pure lookup-table converters — deterministisch, controleerbaar en zonder risico op LLM-hallucinaties.

### 3. Content-Aware afscherming

Bij het vertalen van Markdown of rich content schermt Rosetta het volgende af:

- Fenced codeblokken (` ``` `)
- Inline code (`` ` ` ``)
- Hugo-shortcodes (`{{</* */>}}`, `{{%/* */%}}`)
- Interpolatievariabelen (`{{ .Count }}`, `{name}`, `{{t('key')}}`)
- Ruwe HTML-blokken

Deze worden vóór de vertaling vervangen door Unicode sentinel-tokens en achteraf hersteld. De LLM ziet uw code, uw shortcodes of uw variabelen nooit.

### 4. Coached Method-plug-ins

Voor talen zonder API-dekking kunt u een gecoachte vertaalmethode bouwen:

1. Schrijf linguïstische coachingsgegevens (grammaticaregels, woordenschat, voorbeelden)
2. Bundel het als een plug-in
3. Benchmark het tegen referentievertalingen met behulp van de [eval harness](https://github.com/gamedaysuits/gds-mt-eval-harness)
4. Installeer het in uw project met `i18n-rosetta plugin install`

Dit is hoe rosetta omgaat met Plains Cree — en hoe u elke taal kunt verwerken, inclusief talen die nog niet bestaan.

---

## Conclusie

Rosetta is geen vervanging voor Crowdin. Het is een andere tool voor een andere workflow. Als u menselijke vertalers nodig heeft, gebruik dan een TMS. Als u een CLI nodig heeft die uw bestanden met één commando vertaalt en u per taal controle geeft over methoden, modellen en registers — gebruik dan rosetta.