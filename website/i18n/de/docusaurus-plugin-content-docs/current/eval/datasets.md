---
sidebar_position: 3
title: "Evaluierungsdatensätze"
---
# Evaluierungsdatensätze

Datensätze sind die festen Ziele, gegen die das Harness ausgeführt wird. Jeder Datensatz ist eine JSON-Datei, die Quelle→Ziel-Paare mit Goldstandard-Referenzen enthält. Das Harness bewertet die Modellausgaben anhand dieser Referenzen – es verändert sie niemals.

:::danger NICHT mit Evaluierungsdaten TRAINIEREN

⚠️ **Diese Datensätze dienen ausschließlich der Evaluierung.** Methoden, die mit Evaluierungsdaten trainiert, feingetunt, per Few-Shot-Prompting angesteuert oder anderweitig diesen ausgesetzt wurden, erzeugen künstlich überhöhte Punktzahlen und werden **von der Bestenliste disqualifiziert.**

Verwenden Sie für das Training separate Korpora. Evaluierungsdatensätze müssen für Ihr Modell während der Entwicklung ungesehen bleiben.
:::

---

## Datensatzformat

Jeder Datensatz folgt demselben JSON-Schema:

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

### Top-Level-Block `dataset`

| Feld | Typ | Beschreibung |
|-------|------|-------------|
| `id` | `string` | Eindeutige Datensatzkennung (wird in Run Cards und der Bestenliste verwendet) |
| `version` | `string` | Semantische Version. Eine Erhöhung macht vorherige Run-Card-Vergleiche ungültig |
| `language_pair` | `string` | Anzeigebezeichnung (z. B. `EN→CRK`) |
| `description` | `string` | Menschenlesbare Zusammenfassung |
| `source_language` | `string` | BCP-47-Quellsprachcode |
| `target_language` | `string` | BCP-47-Zielsprachcode |
| `created` | `string` | ISO-8601-Erstellungsdatum |
| `license` | `string` | SPDX-Lizenzkennung |
| `provenance` | `string[]` | Liste der Herkunfts-Tags (Provenance), die in den Einträgen verwendet werden |

### Eintragsfelder

| Feld | Typ | Beschreibung |
|-------|------|-------------|
| `index` | `number` | Nullbasierter Eintragsindex. Muss eindeutig und fortlaufend sein |
| `source_text` | `string` | Der zu übersetzende Quelltext |
| `target_expected` | `string` | Die Goldstandard-Referenzübersetzung |
| `difficulty` | `string` | Schwierigkeitsgrad: `easy`, `medium`, `hard` |
| `provenance` | `string` | Herkunft dieses Eintrags (z. B. `gold_standard`, `textbook`, `elicited`) |
| `notes` | `string` | Optionaler Kontext für menschliche Prüfer |

---

## Verfügbare Datensätze

### EDTeKLA Development Set v1

Der erste Evaluierungsdatensatz, erstellt für die Übersetzung von Englisch→Plains Cree (SRO). Erstellt von der [EdTeKLA-Forschungsgruppe](https://spaces.facsci.ualberta.ca/edtekla/) an der University of Alberta.

| Eigenschaft | Wert |
|----------|-------|
| **ID** | `edtekla-dev-v1` |
| **Version** | `1.0` |
| **Sprachpaar** | EN → CRK (Plains Cree, SRO-Orthographie) |
| **Anzahl der Einträge** | 124 |
| **Schwierigkeitsverteilung** | Leicht, Mittel, Schwer |
| **Herkunft (Provenance)** | `gold_standard` (von Muttersprachlern verifiziert), `textbook` (veröffentlichte Lehrmaterialien) |
| **Lizenz** | [CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/) |

**Was getestet wird:**

- Grundlegende Begrüßungen und gängige Phrasen
- Belebtheit von Substantiven und Obviation
- Verbkonjugation über Personen und Zeiten hinweg
- Lokativkonstruktionen
- Possessivparadigmen
- Komplexe Satzstrukturen

:::tip Warum 124 Einträge?
Der Datensatz ist absichtlich klein und kuratiert. Jeder Eintrag wurde von fließend Sprechenden verifiziert oder stammt aus veröffentlichten Cree-Sprachlehrbüchern. Ein kleiner, qualitativ hochwertiger Datensatz mit verifizierten Goldstandards ist nützlicher als ein großer, verrauschter – insbesondere für eine ressourcenarme Sprache, bei der „nahezu richtige“ Übersetzungen oft morphologisch ungültig sind.
:::

---

## Erstellen eines neuen Datensatzes

Um einen Datensatz für ein neues Sprachpaar oder eine neue Domäne zu erstellen:

### 1. Strukturieren Sie das JSON

Befolgen Sie das Schema [Datensatzformat](#dataset-format). Jeder Eintrag muss `source_text`, `target_expected`, `difficulty` und `provenance` aufweisen.

### 2. Weisen Sie eine eindeutige ID zu

Verwenden Sie einen aussagekräftigen Slug: `{project}-{split}-v{version}` (z. B. `edtekla-dev-v1`, `quechua-test-v1`).

### 3. Verifizieren Sie die Goldstandards

Jeder `target_expected`-Wert muss von einer fließend sprechenden Person verifiziert werden oder aus einer veröffentlichten, Peer-Review-geprüften Ressource stammen. Maschinell generierte Referenzen verfehlen den Zweck der Evaluierung.

### 4. Legen Sie Schwierigkeitsgrade fest

Weisen Sie jedem Eintrag einen Schwierigkeitsgrad zu:

| Stufe | Kriterien |
|------|----------|
| `easy` | Kurze Phrasen, gängiges Vokabular, einfache Morphologie |
| `medium` | Vollständige Sätze, mittlere morphologische Komplexität |
| `hard` | Komplexe Grammatik, seltene Konstruktionen, kulturspezifische Inhalte |

### 5. Kennzeichnen Sie die Herkunft (Provenance)

Jeder Eintrag sollte angeben, woher er stammt. Gängige Tags:

- `gold_standard` — Von fließend Sprechenden verifiziert
- `textbook` — Aus veröffentlichten Lehrmaterialien
- `elicited` — Durch strukturierte Elizitationssitzungen erstellt
- `corpus` — Aus einem parallelen Korpus extrahiert

### 6. Validieren Sie die Datei

Führen Sie das Harness mit einem beliebigen Modell gegen Ihren Datensatz aus, um zu überprüfen, ob das JSON wohlgeformt ist und alle erforderlichen Felder vorhanden sind:

```bash
python eval/baseline_experiment.py --dataset path/to/your-dataset.json
```

Das Harness gibt bei fehlenden Feldern, doppelten Indizes oder Schemaverletzungen einen Fehler aus.

### 7. Reichen Sie den Datensatz zur Aufnahme ein

Öffnen Sie einen Pull Request für das [Eval-Harness-Repository](https://github.com/gamedaysuits/gds-mt-eval-harness) mit Ihrer Datensatzdatei im Verzeichnis `data/`. Fügen Sie eine Dokumentation Ihrer Verifizierungsmethodik und Herkunftsquellen bei.

---

## FLORES+ Devtest

Ein breit angelegter mehrsprachiger Benchmark, der von der [Open Language Data Initiative (OLDI)](https://huggingface.co/datasets/openlanguagedata/flores_plus) gepflegt wird. Wird für den Multi-Modell-Frontier-Benchmark von rosetta verwendet.

| Eigenschaft | Wert |
|----------|-------|
| **ID** | `flores-plus-devtest` |
| **Sprachpaare** | EN → 39 Sprachen (alle in rosetta registrierten natürlichen Sprachen) |
| **Anzahl der Einträge** | 1.012 Sätze pro Sprache |
| **Lizenz** | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/) |
| **Quelle** | Ursprünglich Meta FLORES-200, jetzt von OLDI gepflegt |
| **Speicherort** | Vorab extrahierte Fixtures unter `test/benchmark/fixtures/` im Haupt-Repository von rosetta |

:::danger Nur zur Evaluierung
FLORES+ ist ausschließlich zur Evaluierung vorgesehen. Die Kuratoren bitten ausdrücklich darum, es **nicht als Trainingsdaten zu verwenden**. Stellen Sie sicher, dass die Inhalte von jeglichen Trainingskorpora ausgeschlossen sind.
:::

---

## Siehe auch

- [MT-Evaluierung](/docs/eval/) — Übersicht über das Evaluierungs-Framework und die Bestenliste
- [Eval-Harness](/docs/eval/harness) — Wie man Evaluierungen gegen diese Datensätze ausführt
- [Run-Card-Spezifikation](/docs/eval/run-card) — Das JSON-Schema zur Aufzeichnung von Ergebnissen
- [Methoden-Bestenliste](/leaderboard) — Live-Benchmark-Ergebnisse
- [EdTeKLA-Projekt](https://spaces.facsci.ualberta.ca/edtekla/) — Die Forschungsgruppe der University of Alberta hinter dem Cree-Datensatz