---
sidebar_position: 5
title: "Coachinggegevens"
---
# Coaching Data

Coaching data is het mechanisme van rosetta om LLM's te onderwijzen over talen waarop ze niet zijn getraind. Door grammaticaregels, woordenboeken en stijlaantekeningen te verstrekken bij elk vertaalverzoek, transformeert u een algemene LLM in een contextbewuste vertaler voor elke taal — inclusief talen zonder enige bestaande MT-ondersteuning.

## Hoe het werkt

Wanneer u de methode van een paar instelt op `llm-coached`, laadt rosetta een coachingbestand uit `.rosetta/coaching/<locale>.json` en injecteert de inhoud ervan in elke LLM-prompt als onderdeel van het system message. De LLM ziet uw taalkundige regels naast het vertaalverzoek, waardoor er uitvoer wordt geproduceerd die uw grammatica en terminologie volgt in plaats van te raden.

```
┌──────────────────────────────────────────────────────┐
│ System Message (cached across batches)               │
│ ┌──────────────────────────────────────────────────┐ │
│ │ Base translation rules                           │ │
│ │ + Register instructions                          │ │
│ │ + Grammar rules (from coaching data)             │ │
│ │ + Dictionary entries (from coaching data)         │ │
│ │ + Style notes (from coaching data)               │ │
│ └──────────────────────────────────────────────────┘ │
├──────────────────────────────────────────────────────┤
│ User Message (per batch)                             │
│ ┌──────────────────────────────────────────────────┐ │
│ │ Keys to translate (JSON)                         │ │
│ └──────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────┘
```

Omdat de coaching data deel uitmaakt van het system message, profiteert het van **prompt caching** — providers zoals Anthropic en Google cachen herhaalde system prefixes, zodat u slechts één keer per sessie betaalt voor de coachingcontext, en niet één keer per batch.

## Formaat van het coachingbestand

Maak één JSON-bestand per locale aan in `.rosetta/coaching/`:

```json title=".rosetta/coaching/crk.json"
{
  "grammar_rules": [
    "Plains Cree is polysynthetic — a single word can express what English needs a full sentence for",
    "Animate/inanimate noun distinction affects verb conjugation",
    "Use SRO (Standard Roman Orthography) unless script converter handles conversion",
    "Verb stems are modified by prefixes and suffixes to indicate person, number, tense, and evidentiality"
  ],
  "dictionary": {
    "home": "kīwēwin",
    "settings": "isi-nākatohkēwin",
    "search": "nānātawāpahtam",
    "welcome": "tānisi",
    "submit": "ispīhci",
    "cancel": "pōni"
  },
  "style_notes": "Use formal register. Preserve English technical terms in parentheses when no Cree equivalent exists. Avoid loanwords when a descriptive Cree expression exists."
}
```

### Velden

| Veld | Type | Vereist | Beschrijving |
|-------|------|----------|-------------|
| `grammar_rules` | `string[]` | Nee | Array van grammaticaregels die in de system prompt worden geïnjecteerd. Elke regel moet een beknopte, uitvoerbare instructie zijn die de LLM kan volgen. |
| `dictionary` | `object` | Nee | Key-value map van Engelse term → term in de doeltaal. Gebruikt voor domeinspecifieke woordenschat die de LLM niet zou kennen. |
| `style_notes` | `string` | Nee | Vrije-vorm stijlinstructies (register, toon, formaliteitsconventies). |

Alle velden zijn optioneel — u kunt beginnen met alleen een woordenboek en grammaticaregels toevoegen naarmate u deze verfijnt.

## Fallback-gedrag

Als een paar is geconfigureerd voor `llm-coached`, maar er geen coachingbestand bestaat voor die locale, valt rosetta **terug op de standaard `llm` methode** met een consolewaarschuwing:

```
[INFO] No coaching data for "crk" at .rosetta/coaching/crk.json
       Falling back to standard LLM method. Create coaching data for better results.
```

Dit betekent dat u `"defaultMethod": "llm-coached"` veilig globaal kunt instellen — talen met coaching data zullen dit gebruiken, en de rest krijgt een standaard LLM-vertaling zonder fouten.

## Wanneer u coaching moet gebruiken

| Scenario | Aanbevolen methode |
|----------|-------------------|
| Tier 1-talen (Frans, Spaans, Duits) | `llm` of `google-translate` — LLM's kennen deze al goed |
| Tier 2-talen (Koreaans, Turks, Thais) | `llm` met een register — LLM's verwerken deze adequaat met stijlbegeleiding |
| Tier 3-talen (Plains Cree, Yoruba, Quechua) | `llm-coached` — LLM's hebben grammaticaregels en woordenboeken nodig |
| Conlangs (Klingon, Sindarin, Kryptonian) | `llm-coached` — LLM's hebben enige trainingsdata, maar hebben correcties nodig |

## Goede coaching data opbouwen

### Grammaticaregels

Schrijf regels als **instructies**, niet als beschrijvingen. De LLM volgt instructies beter op dan dat het taalkundige theorie interpreteert.

```json
// ❌ Descriptive (the LLM learns nothing actionable)
"Plains Cree has animate and inanimate noun classes"

// ✅ Instructive (the LLM knows what to do)
"When translating nouns, check whether the Cree equivalent is animate (NA) or inanimate (NI) — this affects which verb conjugation to use"
```

### Woordenboeken

Richt u op **domeinspecifieke termen** die de LLM verkeerd zou begrijpen of zou verzinnen. Besteed geen aandacht aan veelvoorkomende woorden die de LLM al aankan — richt u op de termen die specifiek zijn voor de UI van uw applicatie.

### Stijlaantekeningen

Wees specifiek over register, formaliteit en conventies:

```json
"style_notes": "Use formal register (vous-form in French). Preserve brand names untranslated. UI labels should be imperative mood ('Save', not 'Saves'). Maximum 40 characters for button text."
```

## Gecoachte vertalingen testen

Gebruik de [MT Eval Harness](https://github.com/gamedaysuits/gds-mt-eval-harness) om uw gecoachte vertalingen te benchmarken tegen een referentiecorpus:

```bash
# Install the harness
pip install mt-eval-harness

# Run coached translations against your test corpus
mt-eval run --corpus data/crk-corpus.json --model google/gemini-2.5-pro

# Score the results
mt-eval test eval/logs/run_*.json
```

Dit geeft u chrF++, BLEU en exact match-scores. Maak meerdere versies van het coachingbestand aan en vergelijk deze — objectieve metrieken overtreffen subjectieve beoordelingen.

---

## Zie ook

- [Vertaalmethoden](/docs/guides/translation-methods) — de llm-coached methode
- [Een Low-Resource taal ondersteunen](/docs/guides/low-resource-languages) — coaching in de praktijk
- [Plugin-specificatie](/docs/reference/plugin-spec) — coaching data verpakken in een plugin
- [Quality Gate](/docs/concepts/quality-gate) — hoe gecoachte vertalingen worden gevalideerd
- [Configuratie](/docs/getting-started/configuration) — coachingconfiguratie per paar