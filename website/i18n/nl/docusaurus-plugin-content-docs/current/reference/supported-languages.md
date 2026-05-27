---
sidebar_position: 4
title: "Ondersteunde talen"
---
# Ondersteunde talen

rosetta wordt geleverd met **Language Cards** — gestructureerde configuratiebestanden voor 50 talen. Elke kaart bevat register-presets, metagegevens van het formaliteitssysteem, vlaggen voor methode-ondersteuning, typografieregels en scriptinformatie. Elke taal die uw LLM kent, kan met één enkele configuratieregel worden toegevoegd — dit zijn de talen met gecureerde, voor productie geschikte registers.

---

## Vertaalmethoden

Elke taal kan een of meer van deze vertaalmethoden gebruiken:

| Icoon | Methode | Hoe het werkt | Kosten |
|------|--------|-------------|------|
| 🟢 | **Google Translate** | Neural MT baseline. 130+ talen. Alleen key-value strings — kan Markdown-content niet veilig vertalen. | ~$20/1M tekens |
| 🔵 | **LLM (OpenRouter)** | Elke taal die het model kent. Register-gestuurde prompts. Verwerkt key-value + Markdown-content. | Varieert per model |
| 🟣 | **LLM-Coached** | LLM + grammaticewoordenboeken + coaching-data geïnjecteerd in prompts. Het beste voor morfologisch complexe talen. | Varieert per model |
| 🟠 | **API (Plugin)** | Door de community gehoste vertaalpijplijnen die via HTTP worden aangeboden. [OCAP-compatibel](https://mtevalarena.org/docs/community/low-resource-languages). | Varieert per aanbieder |

Stel `GOOGLE_TRANSLATE_API_KEY` in voor Google Translate, of `OPENROUTER_API_KEY` voor LLM-methoden. Zie [Vertaalmethoden](/docs/guides/translation-methods) voor volledige details.

---

## Prioriteitstalen

Dit zijn de meest aangevraagde locales voor web- en mobiele applicaties, gerangschikt in de door rosetta aanbevolen accessibility-first volgorde.

| Vlag | Taal | Code | Google | LLM | Coached | Script | Opmerkingen |
|------|----------|------|:------:|:---:|:-------:|--------|-------|
| 🇸🇦 | Arabisch | `ar` | ✅ | ✅ | ✅ | — | RTL. Modern Standaard Arabisch (فصحى). |
| 🇵🇭 | Filipijns (Taglish) | `tl` | ✅ | ✅ | ✅ | — | Code-switching: Tagalog primair, technische termen in het Engels. |
| 🇫🇷 | Frans | `fr` | ✅ | ✅ | ✅ | — | Vous-vorm. Genderinclusief (Connecté·e). |
| 🇪🇸 | Spaans | `es` | ✅ | ✅ | ✅ | — | Neutraal Latijns-Amerikaans. |
| 🇩🇪 | Duits | `de` | ✅ | ✅ | ✅ | — | Sie-vorm. Genderinclusief (Benutzer:innen). |
| 🇯🇵 | Japans | `ja` | ✅ | ✅ | ✅ | — | です/ます voor platte tekst, する voor UI-labels. |
| 🇨🇳 | Chinees (Vereenvoudigd) | `zh` | ✅ | ✅ | ✅ | — | 简体中文. |
| 🇮🇹 | Italiaans | `it` | ✅ | ✅ | ✅ | — | Lei-vorm. |
| 🇧🇷 | Portugees (BR) | `pt` | ✅ | ✅ | ✅ | — | Braziliaans-Portugees. |
| 🇰🇷 | Koreaans | `ko` | ✅ | ✅ | ✅ | — | 해요체 beleefdheidsregister. |

## Belangrijkste wereldtalen

| Vlag | Taal | Code | Google | LLM | Coached | Script | Opmerkingen |
|------|----------|------|:------:|:---:|:-------:|--------|-------|
| 🇧🇩 | Bengaals | `bn` | ✅ | ✅ | ✅ | — | শুদ্ধ ভাষা voorkeur. |
| 🇧🇬 | Bulgaars | `bg` | ✅ | ✅ | ✅ | — | |
| 🇨🇿 | Tsjechisch | `cs` | ✅ | ✅ | ✅ | — | Vykání (vy-vorm). |
| 🇩🇰 | Deens | `da` | ✅ | ✅ | ✅ | — | |
| 🇬🇷 | Grieks | `el` | ✅ | ✅ | ✅ | — | Modern Δημοτική. |
| 🇮🇷 | Perzisch | `fa` | ✅ | ✅ | ✅ | — | RTL. |
| 🇫🇮 | Fins | `fi` | ✅ | ✅ | ✅ | — | Geen grammaticaal geslacht. |
| 🇮🇱 | Hebreeuws | `he` | ✅ | ✅ | ✅ | — | RTL. |
| 🇮🇳 | Hindi | `hi` | ✅ | ✅ | ✅ | — | शुद्ध हिन्दी. Minimale Engelse leenwoorden. |
| 🇭🇺 | Hongaars | `hu` | ✅ | ✅ | ✅ | — | Ön-vorm. |
| 🇮🇩 | Indonesisch | `id` | ✅ | ✅ | ✅ | — | |
| 🇲🇾 | Maleis | `ms` | ✅ | ✅ | ✅ | — | |
| 🇳🇱 | Nederlands | `nl` | ✅ | ✅ | ✅ | — | U-vorm. |
| 🇳🇴 | Noors | `nb` | ✅ | ✅ | ✅ | — | Bokmål. |
| 🇵🇱 | Pools | `pl` | ✅ | ✅ | ✅ | — | Pan/Pani-vorm. |
| 🇵🇹 | Portugees (EU) | `pt-PT` | ✅ | ✅ | ✅ | — | Europees-Portugees. |
| 🇷🇴 | Roemeens | `ro` | ✅ | ✅ | ✅ | — | |
| 🇷🇺 | Russisch | `ru` | ✅ | ✅ | ✅ | — | Вы-vorm. |
| 🇸🇰 | Slowaaks | `sk` | ✅ | ✅ | ✅ | — | Vykanie (vy-vorm). |
| 🇷🇸 | Servisch | `sr` | ✅ | ✅ | ✅ | 🔤 Latijns→Cyrillisch | Deterministische scriptconverter. |
| 🇸🇪 | Zweeds | `sv` | ✅ | ✅ | ✅ | — | |
| 🇰🇪 | Swahili | `sw` | ✅ | ✅ | ✅ | — | |
| 🇹🇭 | Thais | `th` | ✅ | ✅ | ✅ | — | ครับ/ค่ะ beleefdheidspartikels. |
| 🇹🇷 | Turks | `tr` | ✅ | ✅ | ✅ | — | Siz-vorm. |
| 🇺🇦 | Oekraïens | `uk` | ✅ | ✅ | ✅ | — | Ви-vorm. |
| 🇵🇰 | Urdu | `ur` | ✅ | ✅ | ✅ | — | RTL. آپ-vorm. |
| 🇻🇳 | Vietnamees | `vi` | ✅ | ✅ | ✅ | — | |
| 🇹🇼 | Chinees (Traditioneel) | `zh-TW` | ✅ | ✅ | ✅ | — | 繁體中文. |
| 🇬🇪 | Georgisch | `ka` | ✅ | ✅ | — | — | ქართული. Kartvelische taalfamilie. |
| 🇳🇬 | Yoruba | `yo` | ✅ | ✅ | — | — | Èdè Yorùbá. Tonaal (3 tonen). |

## Regionale varianten

| Vlag | Taal | Code | Google | LLM | Coached | Script | Opmerkingen |
|------|----------|------|:------:|:---:|:-------:|--------|-------|
| 🇲🇽 | Mexicaans-Spaans | `es-MX` | ✅ | ✅ | ✅ | — | Tú-vorm. Warm register. |
| 🇨🇦 | Canadees-Frans | `fr-CA` | ✅ | ✅ | ✅ | — | Québécois-idiomen. |

---

## Inheemse & Low-Resource Talen

Deze talen worden niet ondersteund door commerciële MT-diensten. rosetta biedt de tooling voor taalgemeenschappen om hun eigen methoden te bouwen volgens de [OCAP-principes](https://mtevalarena.org/docs/community/low-resource-languages).

| | Taal | Code | Google | LLM | Coached | Script | Status |
|---|----------|------|:------:|:---:|:-------:|--------|--------|
| 🪶 | Plains Cree | `crk` | ❌ | ✅ | ✅ | 🔤 SRO→Syllabics | 🚧 In ontwikkeling |
| 🌄 | Quechua | `qu` | ✅ | ✅ | — | — | Runasimi. Evidentiële achtervoegsels. |

:::info Plains Cree is volop in ontwikkeling
Het register, de coaching-infrastructuur, de scriptconverter en het evaluatieharnas voor Plains Cree zijn allemaal functioneel, maar de vertaalpijplijn is **nog niet vrijgegeven**. Wij werken samen met taalgemeenschappen volgens de [OCAP-principes](https://mtevalarena.org/docs/community/low-resource-languages) om de kwaliteit vóór de release te waarborgen. Zie [Ondersteun een Low-Resource Taal](https://mtevalarena.org/docs/community/low-resource-languages) voor het volledige verhaal — en hoe u kunt bijdragen.
:::

:::tip Meer low-resource talen toevoegen
Het methode-pluginsysteem van rosetta is hiervoor ontworpen. Een taalgemeenschap kan een aangepaste vertaalmethode bouwen, deze onder eigen beheer hosten en aanbieden via de [API-methode](/docs/guides/serving-a-method). Het [Method Leaderboard](/leaderboard) houdt de scores bij voor elk talenpaar — bouw een methode, voer het harnas uit en claim de topscore.
:::

---

## Geconstrueerde talen

Conlangs worden ondersteund via LLM-registers en optionele scriptconverters. Ze gebruiken dezelfde infrastructuur als echte talen — de quality gate, het coachingsysteem en de scriptconversiepijplijn werken identiek.

| | Taal | Code | Google | LLM | Script | Opmerkingen |
|---|----------|------|:------:|:---:|--------|-------|
| 🖖 | Klingon | `tlh` | ❌ | ✅ | 🔤 Romanisatie→pIqaD | PUA-lettertype vereist. Marc Okrand-vocabulaire. |
| 🧝 | Sindarijns (Tolkien-Elfs) | `x-elvish-s` | ❌ | ✅ | 🔤 Latijns→Tengwar | CSUR PUA-lettertype vereist. |
| 🏴‍☠️ | Piraten-Engels | `x-pirate` | ❌ | ✅ | — | Alleen register. Nautische metaforen. |
| 🦸 | Kryptoniaans | `x-kryptonian` | ❌ | ✅ | 🔤 Latijns→Kryptoniaans | PUA-lettertype vereist. |
| 🎭 | Shakespeareaans Engels | `x-shakespeare` | ❌ | ✅ | — | Alleen register. Thee/thou, -eth/-est-vormen. |
| 🐸 | Yoda-taal | `x-yoda` | ❌ | ✅ | — | Alleen register. OSV-woordvolgorde. |

Zie [Conlangs, Scripts & Orthografie](/docs/guides/conlangs-scripts-orthography) voor PUA-lettertypevereisten, Unicode-beperkingen en hoe u uw eigen taal kunt toevoegen.

---

## Taal-presets

De `init`-wizard ondersteunt preset-namen voor een snelle installatie. U kunt presets combineren met individuele codes.

| Preset | Breidt uit naar |
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

## Elke taal toevoegen

rosetta kan vertalen naar **elke taal die uw LLM kent** — de bovenstaande tabel toont alleen talen met ingebouwde register-presets. Om een niet-vermelde taal toe te voegen, neemt u de BCP-47-code op in uw configuratie:

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

De LLM zal vertalen met behulp van zijn getrainde kennis van de taal. Door een `register` in te stellen, krijgt u controle over de toon, formaliteit en orthografische conventies. Zie [Configuratie](/docs/getting-started/configuration) voor details.

---

## Language Cards

Elke ingebouwde taal heeft een **Language Card** — een gestructureerde JSON-configuratie die voor prestatiedoeleinden in twee lagen is opgesplitst:

### Tweelagenarchitectuur

| Laag | Map | Geladen | Doel |
|------|-----------|--------|--------|
| **Runtime** | `lib/data/language-cards/` | Direct bij `import` | Vertaal-engine: registers, formaliteit, regels, methode-ondersteuning |
| **Referentie** | `lib/data/language-reference/` | Lazy on-demand | Ontwikkelaarsdocumentatie: linguïstische uitdagingen, encyclopedische gegevens, NLP-bronnen |

De runtime-laag blijft klein (~2 KB/kaart) zodat het importeren van rosetta geen megabytes aan documentatiegegevens laadt. De referentielaag is beschikbaar via `getLanguageReference(code)` voor tools, de website en het evaluatieharnas.

### Runtime Card-velden

| Veld | Wat het bevat |
|-------|------------------|
| **`nativeName`** | Endoniem — de naam van de taal voor zichzelf, in het eigen script (bijv. ქართული, Runasimi) |
| **Formaliteitssysteem** | T-V-onderscheid, spraakniveaus, keigo, partikels, enz. |
| **Register-presets** | Benoemde LLM-prompt-presets specifiek voor het karakter van de taal |
| **Methode-ondersteuning** | Welke vertaal-API's deze taal ondersteunen |
| **Genderrichtlijnen** | Grammaticale geslachtsregels en tips voor inclusief schrijven |
| **Script/richting** | ISO 15924-scriptcode en RTL/LTR |
| **Regels** | Typografie (aanhalingstekens, spatiëring), hoofdlettergebruik, meervoudscategorieën |
| **Eval-datasets** | Welke benchmarks deze taal dekken |
| **`glottocode`** | Canonieke Glottolog-identifier voor kruisverwijzingen |
| **`humanReviewed`** | Of de kaart is beoordeeld door een spreker |

### Reference Card-velden

| Veld | Wat het bevat |
|-------|------------------|
| **Linguïstische uitdagingen** | MT-specifieke valkuilen (bijv. evidentialiteit, tonale diakritische tekens, agglutinatie) |
| **Encyclopedisch** | Taalfamilie, classificatie, aantal sprekers, regio's |
| **Bronnen** | NLP-tools, parallelle corpora, vooraf getrainde modellen |

### Een nieuwe Language Card opzetten

Gebruik de generator om beide lagen op te zetten vanuit gezaghebbende gegevensbronnen (IANA, CLDR, Glottolog):

```bash
# Preview what would be generated
node scripts/generate-language-card.mjs sw --dry-run

# Generate both runtime + reference cards
node scripts/generate-language-card.mjs sw
```

De generator vult automatisch metagegevens in (codes, script, richting, meervouden, aanhalingstekens, methode-ondersteuning, taalfamilie) en markeert linguïstische beoordelingsvelden als TODO voor menselijke curatie.

### Preset-sleutels gebruiken

In plaats van volledige registertekst te schrijven, kunt u een preset-sleutelnaam gebruiken:

```json
{
  "languages": {
    "fr": "casual-tu",
    "ko": "formal-hapsyo",
    "ja": "polite"
  }
}
```

Rosetta herleidt de sleutel naar de volledige register-prompt. Voer `npx i18n-rosetta init` uit om de beschikbare presets voor elke taal te bekijken.

### Voorbeeld-presets

| Taal | Presets | Standaard |
|----------|---------|--------|
| Frans | `formal-vous`, `casual-tu` | `formal-vous` |
| Koreaans | `polite-haeyo`, `formal-hapsyo`, `casual-hae` | `polite-haeyo` |
| Japans | `polite`, `formal-keigo`, `casual` | `polite` |
| Duits | `formal-Sie`, `casual-du` | `formal-Sie` |
| Thais | `neutral-professional`, `polite-male`, `polite-female` | `neutral-professional` |
| Spaans | `neutral-professional`, `formal-usted`, `casual-tuteo` | `neutral-professional` |

Zie [Bijdragen aan een Language Card](https://github.com/gamedaysuits/i18n-rosetta) voor de volledige specificatie, inclusief veldvalidatie en PR-checklist.

---

## Zie ook

- [Configuratie](/docs/getting-started/configuration) — volledige configuratiereferentie inclusief taalinstellingen
- [Vertaalmethoden](/docs/guides/translation-methods) — hoe elke methode werkt
- [Scriptconverters](/docs/concepts/script-converters) — deterministische scriptconversiepijplijn
- [Conlangs, Scripts & Orthografie](/docs/guides/conlangs-scripts-orthography) — PUA-lettertypen, Unicode, conlangs toevoegen
- [Ondersteun een Low-Resource Taal](https://mtevalarena.org/docs/community/low-resource-languages) — methoden bouwen voor onderbediende talen