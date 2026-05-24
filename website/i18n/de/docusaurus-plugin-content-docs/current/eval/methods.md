---
sidebar_position: 4
title: "Methodenschnittstelle"
---
# Gemeinsame Methoden-Schnittstelle

Das Eval Harness und i18n-rosetta teilen ein gemeinsames Konzept der **Übersetzungsmethode**. Eine Methode ist jedes Verfahren, das Ausgangstext entgegennimmt und übersetzten Text erzeugt — sei es ein direkter LLM-Aufruf, eine mehrstufige Pipeline, eine Drittanbieter-API oder ein menschlicher Übersetzer.

## Architektur

```
Method Plugin (v2 Spec)
├── manifest.json         ← Shared metadata (name, version, supported pairs)
├── method_card.json      ← Leaderboard description (what, not how)
├── translate.py          ← Python entry point (for eval harness)
└── translate.js          ← Node.js entry point (for i18n-rosetta CLI)
```

## Zwei Systeme, eine Schnittstelle

| | Eval Harness | i18n-rosetta |
|---|---|---|
| **Sprache** | Python | Node.js |
| **Einstiegspunkt** | `translate.py` | `translate.js` |
| **Schnittstelle** | `TranslationProcess`-Protokoll | `methodPlugin`-Konfiguration |
| **Zweck** | Stapelauswertung mit Bewertung | Live-Lokalisierung in Dev/CI |
| **Ausgabe** | Run Card mit Metriken | Übersetzte Lokalisierungsdateien |

Eine Methode, die beide Systeme unterstützt, bietet zwei Einstiegspunkte — einen für jede Sprachlaufzeitumgebung. Die **Method Card** ist die Brücke: Sie beschreibt die Methode in einem Format, das beide Systeme verstehen.

## Method Card

Eine Method Card beschreibt, *was* eine Übersetzungsmethode ist, ohne proprietäre Details wie den vollständigen System-Prompt preiszugeben. Sie beantwortet folgende Fragen:

- Zu welcher Methodenklasse gehört sie? (rohes LLM, gecoachtes LLM, Pipeline, API usw.)
- Welche Werkzeuge verwendet sie? (FST-Analysator, Wörterbuch usw.)
- Ist die Implementierung Open Source?
- Welche Sprachpaare unterstützt sie?

Weitere Informationen zum vollständigen JSON-Schema finden Sie in der [Method Card-Spezifikation](https://github.com/gamedaysuits/gds-mt-eval-harness/blob/main/docs/method-card-spec.md).

### Beispiel

```json
{
  "method_id": "fst-gated-v8",
  "name": "FST-Gated Coached Translation v8",
  "class": "pipeline",
  "description": "LLM translation with morphological validation. Failed words are retried with FST feedback.",
  "author": "Curtis Forbes",
  "tools_used": ["HFST morphological analyzer", "Wolvengrey dictionary"],
  "open_source": false,
  "supported_pairs": ["eng>crk"]
}
```

### Methodenklassen

| Klasse | Beschreibung |
|-------|-------------|
| `raw-llm` | Direkter LLM-Aufruf mit minimalen Anweisungen |
| `coached-llm` | LLM mit strukturiertem Prompt, Beispielen, Einschränkungen |
| `pipeline` | Mehrstufige Pipeline mit deterministischen Komponenten |
| `custom-plugin` | Externer Prozess, der das `TranslationProcess`-Protokoll implementiert |
| `api` | Drittanbieter-Übersetzungs-API (Google Translate, DeepL usw.) |
| `human` | Menschliche Übersetzung (zur Ermittlung von Basiswerten) |

## Eval Harness: TranslationProcess-Protokoll

Das Eval Harness verwendet Pythons strukturelle Typisierung (`Protocol`) für Plugins. Jede Klasse mit der richtigen Methodensignatur funktioniert — es ist keine Vererbung erforderlich:

```python
class MyMethod:
    async def translate(self, entries: list[dict], config: RunConfig) -> list[dict]:
        results = []
        for entry in entries:
            translation = await self.do_translation(entry["source"])
            results.append({
                "id": entry["id"],
                "predicted": translation,
                "latency_s": 0.5,
                "usage": {"prompt_tokens": 0, "completion_tokens": 0},
                "error": None,
                "tool_calls": [],
                "tool_call_count": 0,
                "metadata": {},
            })
        return results
```

Weitere Informationen finden Sie im [Plugin-Protokoll](https://github.com/gamedaysuits/gds-mt-eval-harness/blob/main/docs/plugin-protocol.md) für die vollständige Dokumentation, einschließlich Wrapper-Beispielen für Nicht-Python-Methoden.

## i18n-rosetta: methodPlugin-Konfiguration

In rosetta werden Methoden pro Sprachpaar in `i18n-rosetta.config.json` registriert:

```json
{
  "version": 3,
  "pairs": {
    "en:crk": {
      "methodPlugin": "crk-coached-v1"
    }
  }
}
```

Weitere Informationen zur rosetta-seitigen Schnittstelle finden Sie in der [Plugin-Spezifikation](/docs/reference/plugin-spec).

## Bestenlisten-Integration

Wenn eine Method Card an einen Durchlauf angehängt wird (über `--method-card`), wird sie in die Run Card eingebettet und auf der Bestenliste angezeigt:

```bash
# Run with method card attached
python eval/baseline_experiment.py \
  --dataset data/edtekla-dev-v1.json \
  --method-card method_card.json \
  --submit
```

Die Bestenliste zeigt Folgendes:
- **Klassen-Abzeichen** — visueller Indikator (z. B. „pipeline“, „coached-llm“)
- **Methodenname** — aus der Method Card
- **Verwendete Werkzeuge** — aufgelistet aus der Method Card
- **Open-Source-Indikator**

Wenn keine Method Card angehängt ist, zeigt die Bestenliste die Harness-native Konfiguration an (Modell, Bedingung, Temperatur, aktivierte Werkzeuge).

:::danger NICHT mit Evaluierungsdaten TRAINIEREN
Methoden, deren Entwicklungsprozess den Kontakt mit dem Evaluierungsdatensatz beinhaltete — sei es als Trainingsdaten, Few-Shot-Beispiele, Wörterbucheinträge oder Material zur Prompt-Abstimmung —, werden von der Bestenliste **disqualifiziert**. Unter [MT-Evaluierung](/docs/eval/) erfahren Sie, was eine gute von einer schlechten Methode unterscheidet.
:::

---

## Siehe auch

- [MT-Evaluierung](/docs/eval/) — Übersicht, Wert der Bestenliste und Leitfaden für gute/schlechte Methoden
- [Eval Harness](/docs/eval/harness) — wie Sie Evaluierungen durchführen
- [Evaluierungsdatensätze](/docs/eval/datasets) — verfügbare Datensätze (EDTeKLA, FLORES+)
- [Run Card-Spezifikation](/docs/eval/run-card) — das JSON-Schema der Run Card
- [Plugin-Spezifikation](/docs/reference/plugin-spec) — rosetta-seitige Plugin-Schnittstelle
- [Methoden-Bestenliste](/leaderboard) — Live-Benchmark-Ergebnisse