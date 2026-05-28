---
sidebar_position: 1
slug: /
title: "Einführung"
---
# i18n-rosetta

Ein vollständig anpassbares Internationalisierungs-Framework. Ein einziger Befehl übersetzt Ihre Lokalisierungsdateien. Eine einzige Konfiguration steuert jede Methode, jedes Modell und jedes Sprachpaar. Und wenn die integrierten Methoden nicht ausreichen — entwickeln Sie Ihre eigenen, beweisen Sie deren Funktionsfähigkeit und stellen Sie sie bereit.

```bash
npx i18n-rosetta sync
```

rosetta erkennt Ihre Lokalisierungsdateien, das Format und die Zielsprachen automatisch. Es übersetzt, was fehlt, überspringt, was bereits erledigt ist, validiert jedes Ergebnis und schreibt eine saubere Ausgabe. Das ist erst der Anfang.

---

## Warum nicht einfach selbst ein Skript schreiben?

Sie könnten eine schnelle Schleife schreiben, die für jeden Schlüssel Google Translate aufruft. Die meisten Entwickler tun dies — es erfordert etwa 30 Zeilen. Hier scheitert dieser Ansatz:

- **Keine Änderungserkennung.** Aktualisieren Sie eine englische Zeichenfolge — die Übersetzung bleibt für immer veraltet. rosetta verfolgt jeden Quellwert mit SHA-256-Hashes und übersetzt nur das neu, was sich geändert hat.
- **Keine Stapelverarbeitung.** Ein API-Aufruf pro Schlüssel bedeutet 200 Schlüssel = 200 Netzwerkumläufe. rosetta bündelt Anfragen intelligent (konfigurierbar, standardmäßig 80 Schlüssel/Stapel für LLMs, 128 für Google).
- **Keine Zwischenspeicherung.** Jede Synchronisierung übersetzt alles neu. Das Translation Memory von rosetta speichert Übersetzungen nach Quelltext + Locale + Methode zwischen — wenn Sie die Synchronisierung nach der Änderung eines Schlüssels erneut ausführen, wird nur dieser eine Schlüssel übersetzt, nicht die gesamte Datei.
- **Keine Qualitätskontrolle.** Maschinelle Übersetzung halluziniert, gibt den Quelltext unverändert zurück oder gibt Text im falschen Schriftsystem aus. rosetta validiert jede Übersetzung, bevor sie geschrieben wird — falsche Schriftsysteme, unverhältnismäßige Längenzunahme und Quelltext-Echos werden erkannt und abgelehnt.
- **Keine Formaterkennung.** Fest auf JSON codiert? rosetta verarbeitet JSON, TOML, YAML und Hugo Markdown (Frontmatter + Textkörper) mit automatischer Erkennung.
- **Keine Steuerung der Methoden.** Jedes Sprachpaar erhält dieselbe Methode. Mit rosetta können Sie Google Translate für Französisch, ein LLM für Japanisch und eine benutzerdefinierte, von der Gemeinschaft bereitgestellte Pipeline für Cree verwenden — in derselben Konfigurationsdatei.

rosetta ist die produktionsreife Version dieses Skripts.

---

## Was es besonders macht

### Jede Methode ist ein Plugin

Die Übersetzungsmethode ist **pro Sprachpaar konfigurierbar**. Kombinieren Sie Google Translate, LLMs, gesteuerte Prompts und benutzerdefinierte APIs im selben Projekt:

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

Französisch erhält Google Translate (schnell, günstig). Japanisch erhält ein Premium-LLM (nuanciert). Plains Cree erhält ein gesteuertes Plugin mit Grammatikregeln, Wörterbüchern und morphologischer Validierung. Derselbe `sync`-Befehl. Dieselbe Qualitätskontrolle. Dieselbe CLI.

### Beweisen Sie es

Glauben Sie, dass Ihre Methode Englisch ins Spanische übersetzen kann? Türkisch ins Aserbaidschanische? Englisch ins Cree?

**Beweisen Sie es.** Die zugehörige [Testumgebung](https://mtevalarena.org/docs/specifications/harness) unterzieht jede Übersetzungsmethode einem Benchmark-Test mit reproduzierbarer, eindeutig identifizierbarer Bewertung. Die [Rangliste](/leaderboard) erfasst jede Einreichung.

Die Testumgebung und die Produktions-CLI teilen sich dieselbe Plugin-Schnittstelle. Eine Methode, die in der Testumgebung gut abschneidet, kann in der Produktion verwendet werden — sofern die Gemeinschaft, deren Sprache sie dient, ihre Zustimmung gibt. Für indigene und ressourcenarme Sprachen ist diese Zustimmung von entscheidender Bedeutung. Siehe [Datensouveränität](https://mtevalarena.org/docs/sovereignty/data-sovereignty).

```bash
# Benchmark your method (in the eval harness repo)
cd gds-mt-eval-harness
python eval/baseline_experiment.py --dataset data/edtekla-dev-v1.json --submit

# Use it locally
npx i18n-rosetta sync
```

Dasselbe Plugin. Einbinden und testen.

### Der vollständige Werkzeugkasten

rosetta ist nicht nur `sync`. Es ist eine vollständige i18n-Pipeline:

| Befehl | Funktion |
|---------|-------------|
| `sync` | Übersetzt fehlende und veraltete Schlüssel (mit Überprüfung nach der Synchronisierung) |
| `watch` | Automatische Synchronisierung bei Änderungen der Quelldatei |
| `lint` | Durchsucht den Quellcode nach fest codierten Zeichenfolgen |
| `wrap` | Umschließt fest codierte Zeichenfolgen automatisch mit `t()`-Aufrufen |
| `audit` | Listet alle `[EN]`-Fallback-Markierungen aus früheren Durchläufen auf |
| `verify` | Überprüft, ob Übersetzungen vorhanden und korrekt sind (CI-Schranke) |
| `integrity` | Erkennt beschädigte Platzhalter, Codierungsprobleme und die Vollständigkeit von ICU-Pluralen |
| `seo` | Generiert hreflang-Tags, Sitemaps und JSON-LD-Schemata |
| `status` | Zeigt die Konfiguration der Sprachpaare, Plugins und Benchmark-Ergebnisse an |
| `provenance` | Überprüft die Lizenzierung der Übersetzungsressourcen |
| `plugin` | Installiert, entfernt und listet Methoden-Plugins auf |
| `fonts` | Lädt Web-Schriftarten für PUA-Schriftsystem-Konverter herunter |
| `tm` | Verwaltet den Translation-Memory-Zwischenspeicher (Statistiken, Leeren, pro Locale) |
| `xliff` | Exportiert/Importiert XLIFF 1.2 für die Überprüfung durch professionelle Übersetzer |

Vier davon — `lint`, `sync`, `verify`, `audit` — bilden eine CI-Pipeline, die fest codierte Zeichenfolgen abfängt, sie übersetzt, die Richtigkeit überprüft und den Build-Prozess abbricht, falls ein Locale unvollständig ist.

---

## Die Arena

Die [Methoden-Rangliste](/leaderboard) ist die Anzeigetafel. Jede Einreichung wird mit einem Fingerabdruck an einen Git-Commit gebunden, für einen bestimmten Datensatz versioniert und von derselben Testumgebung bewertet. Jeder kann etwas einreichen.

**Was können Sie beweisen?** Die Testumgebung akzeptiert JSON. Plugins akzeptieren JSON. Jede Methode, die JSON erzeugt, kann getestet werden:

| Ansatz | Beispiel |
|----------|---------|
| **Gesteuertes LLM** | Fügt Grammatikregeln und Wörterbücher in den Prompt eines Frontier-Modells ein |
| **Feinabgestimmtes Modell** | Trainiert ein offenes Modell mit parallelen Texten — nur eben nicht mit den Evaluierungsdaten |
| **FST-gesteuerte Pipeline** | LLM generiert → endlicher Automat (FST) validiert die Morphologie → erneuter Versuch |
| **Verkettete Modelle** | Modell A entwirft → Modell B überarbeitet → Modell C bewertet |
| **Wörterbuch + LLM** | Erzwingt bekannte Begriffe aus einem Wörterbuch, das LLM übernimmt den Rest |
| **Evolutionär** | Generiert Kandidaten, bewertet sie, mutiert die besten, wiederholt den Vorgang |
| **Partielle Übersetzung** | Übersetzt eine Stichprobe von Hand, beweist die Übereinstimmung des LLMs, übersetzt den Rest automatisch |

Stimmen Sie Modelle fein ab. Setzen Sie evolutionäre Algorithmen ein. Testen Sie Antworten von Schülern in Sprachprüfungen. Erstellen Sie Nachschlagetabellen. Verketten Sie drei Modelle miteinander. Solange Ihre Methode JSON erzeugt, wird sie von der Testumgebung bewertet und vom Framework ausgeführt.

:::danger Die einzige Regel
**Trainieren Sie nicht mit den Evaluierungsdaten.** Methoden, die dem Benchmark-Datensatz ausgesetzt waren, werden disqualifiziert. Führen Sie Feinabstimmungen mit beliebigen Daten durch. Nur eben nicht mit dem Testdatensatz.
:::

Dies ist eine offene Einladung. Wenn Sie mit einer ressourcenarmen Sprache arbeiten — als Forscher, als Mitglied der Gemeinschaft, als Student oder einfach als jemand, dem das Thema am Herzen liegt —, entwickeln Sie eine Methode, führen Sie die Testumgebung aus und sichern Sie sich die höchste Punktzahl. Das Problem ist ungelöst. Die Infrastruktur ist vorhanden.

**[→ Rangliste ansehen](/leaderboard)**

---

## Nächste Schritte

**Erste Schritte:**
- [Installation](/docs/getting-started/installation) — Einrichtung in 2 Minuten
- [Schnellstart](/docs/getting-started/quick-start) — Führen Sie Ihre erste Synchronisierung aus
- [Unterstützte Sprachen](/docs/reference/supported-languages) — Was von Haus aus verfügbar ist

**Anpassung Ihrer Einrichtung:**
- [Übersetzungsmethoden](/docs/guides/translation-methods) — Wählen Sie die richtige Methode pro Sprachpaar
- [Translation Memory](/docs/concepts/translation-memory) — Wie Zwischenspeicherung Ihnen Geld spart
- [Konfiguration](/docs/getting-started/configuration) — Vollständige Konfigurationsreferenz
- [Mehrsprachige Hugo-Website](/docs/tutorials/hugo-multilingual-site) — Übersetzung von Markdown-Inhalten

**Weiterführende Informationen:**
- [Zusammenarbeit mit professionellen Übersetzern](/docs/guides/professional-translators) — XLIFF-Export/Import-Arbeitsablauf
- [Datensouveränität](https://mtevalarena.org/docs/sovereignty/data-sovereignty) — OCAP-, CARE- und Māori-Prinzipien zur Datensouveränität
- [Unterstützung einer ressourcenarmen Sprache](https://mtevalarena.org/docs/community/low-resource-languages) — Die Herausforderung, mit der alles begann
- [Kochbuch: FST-gesteuerte Pipeline](https://mtevalarena.org/docs/tutorials/fst-gated-pipeline) — Aufbau einer Dekompositions-Pipeline
- [MT-Evaluierung](https://mtevalarena.org/docs/leaderboard/rules) — Wie die Testumgebung und die Rangliste funktionieren
- [Methoden-Rangliste](/leaderboard) — Live-Ergebnisse und Einreichungen