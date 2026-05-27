---
sidebar_position: 1
slug: /
title: "Einführung"
---
# i18n-rosetta

Ein vollständig anpassbares Internationalisierungs-Framework. Ein Befehl übersetzt Ihre Lokalisierungsdateien. Eine Konfiguration steuert jede Methode, jedes Modell und jedes Sprachpaar. Und wenn die integrierten Methoden nicht ausreichen — entwickeln Sie Ihre eigenen, beweisen Sie deren Funktion und stellen Sie sie bereit.

```bash
npx i18n-rosetta sync
```

rosetta erkennt automatisch Ihre Lokalisierungsdateien, das Format und die Zielsprachen. Es übersetzt, was fehlt, überspringt, was bereits erledigt ist, validiert jedes Ergebnis und schreibt eine saubere Ausgabe. Das ist erst der Anfang.

---

## Warum nicht einfach selbst ein Skript schreiben?

Sie könnten eine schnelle Schleife schreiben, die für jeden Schlüssel Google Translate aufruft. Die meisten Entwickler tun das — es erfordert etwa 30 Zeilen. Hier scheitert dieser Ansatz:

- **Keine Änderungserkennung.** Aktualisieren Sie eine englische Zeichenfolge — die Übersetzung bleibt für immer veraltet. rosetta verfolgt jeden Quellwert mit SHA-256-Hashes und übersetzt nur das neu, was sich geändert hat.
- **Keine Stapelverarbeitung.** Ein API-Aufruf pro Schlüssel bedeutet 200 Schlüssel = 200 Netzwerkanfragen. rosetta bündelt intelligent (konfigurierbar, Standard 30 Schlüssel/Stapel für LLM, 128 für Google).
- **Kein Zwischenspeicher.** Jede Synchronisierung übersetzt alles neu. Das Translation Memory von rosetta speichert Übersetzungen nach Quelltext + Gebietsschema + Methode zwischen — ein erneuter Synchronisierungslauf nach der Änderung eines Schlüssels übersetzt nur diesen einen Schlüssel, nicht die gesamte Datei.
- **Keine Qualitätskontrolle.** Maschinelle Übersetzung halluziniert, gibt den Quelltext unverändert zurück oder gibt im falschen Schriftsystem aus. rosetta validiert jede Übersetzung, bevor sie geschrieben wird — falsche Schriftsysteme, Längeninflation und Quelltext-Echos werden erkannt und abgelehnt.
- **Keine Formaterkennung.** Fest im Code auf JSON verankert? rosetta verarbeitet JSON, TOML, YAML und Hugo Markdown (Frontmatter + Textkörper) mit automatischer Erkennung.
- **Keine Steuerung der Methoden.** Jedes Sprachpaar erhält dieselbe Methode. rosetta ermöglicht es Ihnen, Google Translate für Französisch, ein LLM für Japanisch und eine benutzerdefinierte, von der Community gehostete Pipeline für Cree zu verwenden — in derselben Konfigurationsdatei.

rosetta ist die produktionsreife Version dieses Skripts.

---

## Was es besonders macht

### Jede Methode ist ein Plugin

Die Übersetzungsmethode ist **pro Sprachpaar konfigurierbar**. Mischen Sie Google Translate, LLMs, angeleitete Prompts und benutzerdefinierte APIs im selben Projekt:

```json title="i18n-rosetta.config.json"
{
  "version": 3,
  "pairs": {
    "en:fr": { "method": "google-translate" },
    "en:ja": { "method": "llm", "model": "google/gemini-2.5-pro" },
    "en:crk": { "methodPlugin": "crk-coached-v1" }
  }
}
```

Französisch erhält Google Translate (schnell, günstig). Japanisch erhält ein Premium-LLM (nuanciert). Plains Cree erhält ein angeleitetes Plugin mit Grammatikregeln, Wörterbüchern und morphologischer Validierung. Derselbe `sync`-Befehl. Dieselbe Qualitätskontrolle. Dieselbe CLI.

### Beweisen Sie es

Glauben Sie, dass Ihre Methode Englisch ins Spanische übersetzen kann? Türkisch ins Aserbaidschanische? Englisch ins Cree?

**Beweisen Sie es.** Die zugehörige [Evaluierungsumgebung](https://mtevalarena.org/docs/specifications/harness) unterzieht jede Übersetzungsmethode einem Benchmark-Test mit reproduzierbarer, durch Fingerabdrücke gesicherter Bewertung. Die [Rangliste](/leaderboard) erfasst jede Einreichung.

Die Evaluierungsumgebung und die Produktions-CLI teilen sich dieselbe Plugin-Schnittstelle. Eine Methode, die in der Evaluierungsumgebung gut abschneidet, kann in der Produktion verwendet werden — sofern die Gemeinschaft, deren Sprache sie dient, ihre Zustimmung gibt. Für indigene und ressourcenarme Sprachen ist diese Zustimmung von Bedeutung. Siehe [Datensouveränität](https://mtevalarena.org/docs/sovereignty/data-sovereignty).

```bash
# Benchmark your method (in the eval harness repo)
cd gds-mt-eval-harness
python eval/baseline_experiment.py --dataset data/edtekla-dev-v1.json --submit

# Use it locally
npx i18n-rosetta sync
```

Dasselbe Plugin. Einbinden und testen.

### Der komplette Werkzeugkasten

rosetta ist nicht nur `sync`. Es ist eine vollständige i18n-Pipeline:

| Befehl | Funktion |
|---------|-------------|
| `sync` | Übersetzt fehlende, veraltete und Fallback-Schlüssel |
| `watch` | Automatische Synchronisierung, wenn sich Ihre Quelldatei ändert |
| `lint` | Durchsucht den Quellcode nach fest programmierten Zeichenfolgen |
| `wrap` | Umschließt fest programmierte Zeichenfolgen automatisch mit `t()`-Aufrufen |
| `audit` | Listet alle unübersetzten `[EN]`-Fallback-Werte auf |
| `integrity` | Erkennt beschädigte Platzhalter, Kodierungsprobleme und die Vollständigkeit von ICU-Pluralformen |
| `seo` | Generiert hreflang-Tags, Sitemaps und JSON-LD-Schemata |
| `status` | Zeigt die Konfiguration der Sprachpaare, Plugins und Benchmark-Ergebnisse an |
| `provenance` | Überprüft die Lizenzierung der Übersetzungsressourcen |
| `plugin` | Installiert, entfernt und listet Methoden-Plugins auf |
| `fonts` | Lädt Web-Schriftarten für PUA-Schriftsystem-Konverter herunter |
| `tm` | Verwaltet den Translation-Memory-Zwischenspeicher (Statistiken, Leeren, pro Gebietsschema) |
| `xliff` | Exportiert/Importiert XLIFF 1.2 für die Überprüfung durch professionelle Übersetzer |

Drei davon — `lint`, `sync`, `audit` — bilden eine CI-Pipeline, die fest programmierte Zeichenfolgen erfasst, diese übersetzt und den Build-Prozess abbricht, falls ein Gebietsschema unvollständig ist.

---

## Die Arena

Die [Methoden-Rangliste](/leaderboard) ist die Anzeigetafel. Jede Einreichung wird mit einem Fingerabdruck an einen Git-Commit gebunden, für einen spezifischen Datensatz versioniert und von derselben Evaluierungsumgebung bewertet. Jeder kann etwas einreichen.

**Was können Sie beweisen?** Die Evaluierungsumgebung akzeptiert JSON. Plugins akzeptieren JSON. Jede Methode, die JSON erzeugt, kann getestet werden:

| Ansatz | Beispiel |
|----------|---------|
| **Angeleitetes LLM** | Injiziert Grammatikregeln und Wörterbücher in den Prompt eines Frontier-Modells |
| **Feinabgestimmtes Modell** | Trainiert ein offenes Modell mit Paralleltexten — nur eben nicht mit den Evaluierungsdaten |
| **FST-gesteuerte Pipeline** | LLM generiert → Endlicher Automat (FST) validiert die Morphologie → erneuter Versuch |
| **Verkettete Modelle** | Modell A entwirft → Modell B übernimmt das Post-Editing → Modell C bewertet |
| **Wörterbuch + LLM** | Erzwingt bekannte Begriffe aus einem Wörterbuch, überlässt dem LLM den Rest |
| **Evolutionär** | Generiert Kandidaten, bewertet sie, mutiert die besten, wiederholt den Vorgang |
| **Partielle Übersetzung** | Übersetzt eine Stichprobe von Hand, beweist die Übereinstimmung Ihres LLMs, übersetzt den Rest automatisch |

Stimmen Sie Modelle fein ab. Setzen Sie evolutionäre Algorithmen ein. Testen Sie Antworten von Studierenden in Sprachprüfungen. Erstellen Sie Nachschlagetabellen. Verketten Sie drei Modelle miteinander. Solange Ihre Methode JSON erzeugt, wird sie von der Evaluierungsumgebung bewertet und vom Framework ausgeführt.

:::danger Die einzige Regel
**Trainieren Sie nicht mit den Evaluierungsdaten.** Methoden, die dem Benchmark-Datensatz ausgesetzt waren, werden disqualifiziert. Führen Sie Feinabstimmungen durch, womit Sie möchten. Nur eben nicht mit dem Testdatensatz.
:::

Dies ist eine offene Einladung. Wenn Sie mit einer ressourcenarmen Sprache arbeiten — als Forscher, als Mitglied einer Gemeinschaft, als Student oder einfach als jemand, dem das Thema am Herzen liegt — entwickeln Sie eine Methode, führen Sie die Evaluierungsumgebung aus und sichern Sie sich die höchste Punktzahl. Das Problem ist ungelöst. Die Infrastruktur ist vorhanden.

**[→ Zur Rangliste](/leaderboard)**

---

## Nächste Schritte

**Erste Schritte:**
- [Installation](/docs/getting-started/installation) — Einrichtung in 2 Minuten
- [Schnellstart](/docs/getting-started/quick-start) — Führen Sie Ihre erste Synchronisierung aus
- [Unterstützte Sprachen](/docs/reference/supported-languages) — Was standardmäßig verfügbar ist

**Anpassung Ihrer Einrichtung:**
- [Übersetzungsmethoden](/docs/guides/translation-methods) — Wählen Sie die richtige Methode pro Sprachpaar
- [Translation Memory](/docs/concepts/translation-memory) — Wie Zwischenspeicherung Ihnen Geld spart
- [Konfiguration](/docs/getting-started/configuration) — Vollständige Konfigurationsreferenz
- [Mehrsprachige Hugo-Website](/docs/tutorials/hugo-multilingual-site) — Übersetzung von Markdown-Inhalten

**Tiefer einsteigen:**
- [Zusammenarbeit mit professionellen Übersetzern](/docs/guides/professional-translators) — XLIFF-Export/Import-Arbeitsablauf
- [Datensouveränität](https://mtevalarena.org/docs/sovereignty/data-sovereignty) — OCAP-, CARE- und Māori-Datensouveränitätsprinzipien
- [Unterstützung einer ressourcenarmen Sprache](https://mtevalarena.org/docs/community/low-resource-languages) — Die Herausforderung, mit der alles begann
- [Kochbuch: FST-gesteuerte Pipeline](https://mtevalarena.org/docs/tutorials/fst-gated-pipeline) — Aufbau einer Dekompositionspipeline
- [MT-Evaluierung](https://mtevalarena.org/docs/leaderboard/rules) — Wie die Evaluierungsumgebung und die Rangliste funktionieren
- [Methoden-Rangliste](/leaderboard) — Live-Ergebnisse und Einreichungen