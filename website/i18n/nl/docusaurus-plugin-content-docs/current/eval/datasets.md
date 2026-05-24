---
sidebar_position: 3
title: "Evaluatiedatasets"
---
# Evaluatiedatasets

Datasets zijn de vaste doelen waartegen de harness wordt uitgevoerd. Elke dataset is een JSON-bestand dat bron→doel-paren bevat met gold-standard referenties. De harness beoordeelt de modeluitvoer aan de hand van deze referenties — deze worden nooit gewijzigd.

:::danger TRAIN NIET met evaluatiedata

⚠️ **Deze datasets zijn uitsluitend bedoeld voor evaluatie.** Methoden die zijn getraind, gefinetuned, via few-shot-prompting zijn gestuurd of op een andere manier zijn blootgesteld aan evaluatiedata, zullen kunstmatig verhoogde scores opleveren en worden **gediskwalificeerd voor het leaderboard.**

Gebruik afzonderlijke corpora voor training. Evaluatiesets moeten tijdens de ontwikkeling ongezien blijven voor uw model.
:::

---

## Datasetformaat

Elke dataset volgt hetzelfde JSON-schema:

```json
{
  "dataset": {
    "id": "dataset-slug",
    "version": "1.0",
    "language_pair": "EN→CRK",
    "description": "Human-readable description of the dataset",
    "source_language": "en",
    "target_language": "crk",
    "created": "2025-05-01",
    "license": "CC-BY-NC-4.0",
    "provenance": ["gold_standard", "textbook"]
  },
  "entries": [
    {
      "index": 0,
      "source_text": "Hello",
      "target_expected": "tânisi",
      "difficulty": "easy",
      "provenance": "gold_standard",
      "notes": "Common greeting, SRO orthography"
    }
  ]
}
```

### Top-Level `dataset` Blok

| Veld | Type | Beschrijving |
|-------|------|-------------|
| `id` | `string` | Unieke dataset-identifier (gebruikt in run cards en het leaderboard) |
| `version` | `string` | Semantische versie. Het verhogen hiervan maakt eerdere run card-vergelijkingen ongeldig |
| `language_pair` | `string` | Weergavelabel (bijv. `EN→CRK`) |
| `description` | `string` | Menselijk leesbare samenvatting |
| `source_language` | `string` | BCP 47-taalcode van de bron |
| `target_language` | `string` | BCP 47-taalcode van het doel |
| `created` | `string` | ISO 8601-aanmaakdatum |
| `license` | `string` | SPDX-licentie-identifier |
| `provenance` | `string[]` | Lijst van herkomst-tags die in de invoeren worden gebruikt |

### Invoervelden

| Veld | Type | Beschrijving |
|-------|------|-------------|
| `index` | `number` | Zero-based invoerindex. Moet uniek en sequentieel zijn |
| `source_text` | `string` | De te vertalen brontekst |
| `target_expected` | `string` | De gold-standard referentievertaling |
| `difficulty` | `string` | Moeilijkheidsgraad: `easy`, `medium`, `hard` |
| `provenance` | `string` | Oorsprong van deze invoer (bijv. `gold_standard`, `textbook`, `elicited`) |
| `notes` | `string` | Optionele context voor menselijke beoordelaars |

---

## Beschikbare Datasets

### EDTeKLA Development Set v1

De eerste evaluatiedataset, gebouwd voor vertaling van Engels→Plains Cree (SRO). Gemaakt door de [EdTeKLA research group](https://spaces.facsci.ualberta.ca/edtekla/) aan de University of Alberta.

| Eigenschap | Waarde |
|----------|-------|
| **ID** | `edtekla-dev-v1` |
| **Versie** | `1.0` |
| **Taalpaar** | EN → CRK (Plains Cree, SRO-spelling) |
| **Aantal invoeren** | 124 |
| **Moeilijkheidsverdeling** | Makkelijk, Gemiddeld, Moeilijk |
| **Herkomst** | `gold_standard` (geverifieerd door sprekers), `textbook` (gepubliceerd educatief materiaal) |
| **Licentie** | [CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/) |

**Wat het test:**

- Basisbegroetingen en veelvoorkomende zinnen
- Levendheid van zelfstandige naamwoorden en obviatie
- Werkwoordvervoeging over personen en tijden
- Locatieve constructies
- Bezittelijke paradigma's
- Complexe zinsstructuren

:::tip Waarom 124 invoeren?
De dataset is opzettelijk klein en gecureerd. Elke invoer is geverifieerd door vloeiende sprekers of afkomstig uit gepubliceerde Cree-taalboeken. Een kleine, hoogwaardige dataset met geverifieerde gold standards is nuttiger dan een grote, ruizige dataset — vooral voor een low-resource taal waar "goed genoeg" vertalingen vaak morfologisch ongeldig zijn.
:::

---

## Een Nieuwe Dataset Aanmaken

Om een dataset aan te maken voor een nieuw taalpaar of domein:

### 1. Structureer de JSON

Volg het [Datasetformaat](#dataset-format) schema. Elke invoer moet `source_text`, `target_expected`, `difficulty` en `provenance` bevatten.

### 2. Wijs een unieke ID toe

Gebruik een beschrijvende slug: `{project}-{split}-v{version}` (bijv. `edtekla-dev-v1`, `quechua-test-v1`).

### 3. Verifieer gold standards

Elke `target_expected`-waarde moet worden geverifieerd door een vloeiende spreker of afkomstig zijn uit een gepubliceerde, peer-reviewed bron. Door machines gegenereerde referenties doen het doel van evaluatie teniet.

### 4. Stel moeilijkheidsgraden in

Wijs aan elke invoer een moeilijkheidsgraad toe:

| Niveau | Criteria |
|------|----------|
| `easy` | Korte zinnen, veelvoorkomende woordenschat, eenvoudige morfologie |
| `medium` | Volledige zinnen, gemiddelde morfologische complexiteit |
| `hard` | Complexe grammatica, zeldzame constructies, cultureel specifieke inhoud |

### 5. Tag de herkomst

Elke invoer moet aangeven waar deze vandaan komt. Veelvoorkomende tags:

- `gold_standard` — Geverifieerd door vloeiende sprekers
- `textbook` — Uit gepubliceerd educatief materiaal
- `elicited` — Geproduceerd via gestructureerde elicitatiesessies
- `corpus` — Geëxtraheerd uit een parallel corpus

### 6. Valideer het bestand

Voer de harness uit tegen uw dataset met een willekeurig model om te verifiëren dat de JSON goed is gevormd en alle vereiste velden aanwezig zijn:

```bash
python eval/baseline_experiment.py --dataset path/to/your-dataset.json
```

De harness zal een foutmelding geven bij ontbrekende velden, dubbele indexen of schema-overtredingen.

### 7. Dien in voor opname

Open een pull request in de [eval harness repository](https://github.com/gamedaysuits/gds-mt-eval-harness) met uw datasetbestand in de map `data/`. Voeg documentatie toe van uw verificatiemethodologie en herkomstbronnen.

---

## FLORES+ Devtest

Een meertalige benchmark met brede dekking, onderhouden door het [Open Language Data Initiative (OLDI)](https://huggingface.co/datasets/openlanguagedata/flores_plus). Gebruikt voor rosetta's multi-model frontier benchmark.

| Eigenschap | Waarde |
|----------|-------|
| **ID** | `flores-plus-devtest` |
| **Taalparen** | EN → 39 talen (alle in rosetta geregistreerde natuurlijke talen) |
| **Aantal invoeren** | 1.012 zinnen per taal |
| **Licentie** | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/) |
| **Bron** | Oorspronkelijk Meta FLORES-200, nu onderhouden door OLDI |
| **Locatie** | Vooraf geëxtraheerde fixtures op `test/benchmark/fixtures/` in de hoofd-rosetta-repo |

:::danger Uitsluitend voor evaluatie
FLORES+ is uitsluitend bedoeld voor evaluatie. De curatoren verzoeken uitdrukkelijk om het **niet als trainingsdata te gebruiken**. Zorg ervoor dat de inhoud ervan is uitgesloten van alle trainingscorpora.
:::

---

## Zie Ook

- [MT-evaluatie](/docs/eval/) — overzicht van het evaluatieframework en het leaderboard
- [Eval Harness](/docs/eval/harness) — hoe u evaluaties uitvoert tegen deze datasets
- [Run Card-specificatie](/docs/eval/run-card) — het JSON-schema voor het vastleggen van resultaten
- [Method Leaderboard](/leaderboard) — live benchmarkscores
- [EdTeKLA Project](https://spaces.facsci.ualberta.ca/edtekla/) — de onderzoeksgroep van de University of Alberta achter de Cree-dataset