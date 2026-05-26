---
sidebar_position: 1
slug: /
title: "Einführung"
---
# i18n-rosetta

Ein vollständig anpassbares Internationalisierungs-Framework. Ein Befehl übersetzt Ihre Lokalisierungsdateien. Eine Konfiguration steuert jede Methode, jedes Modell und jedes Sprachpaar. Und falls die integrierten Methoden nicht ausreichen — entwickeln Sie Ihre eigene, beweisen Sie, dass sie funktioniert, und stellen Sie sie bereit.

```bash
npx i18n-rosetta sync
```

rosetta erkennt Ihre Lokalisierungsdateien, Formate und Zielsprachen automatisch. Es übersetzt, was fehlt, überspringt, was erledigt ist, validiert jedes Ergebnis und schreibt eine saubere Ausgabe. Das ist erst der Anfang.

---

## Warum nicht einfach selbst ein Skript schreiben?

Sie könnten eine schnelle Schleife schreiben, die für jeden Schlüssel Google Translate aufruft. Die meisten Entwickler tun das — es erfordert etwa 30 Zeilen. Hier scheitert dieser Ansatz:

- **Keine Änderungserkennung.** Aktualisieren Sie eine englische Zeichenfolge — die Übersetzung bleibt für immer veraltet. rosetta verfolgt jeden Quellwert mit SHA-256-Hashes und übersetzt nur das neu, was sich geändert hat.
- **Keine Stapelverarbeitung.** Ein API-Aufruf pro Schlüssel bedeutet 200 Schlüssel = 200 Roundtrips. rosetta bündelt Anfragen intelligent (konfigurierbar, Standard 30 Schlüssel/Stapel für LLM, 128 für Google).
- **Keine Qualitätskontrolle.** Maschinelle Übersetzung halluziniert, gibt die Quelle unverändert zurück oder gibt im falschen Schriftsystem aus. rosetta validiert jede Übersetzung, bevor sie geschrieben wird — falsche Schriftsysteme, Längeninflation und unveränderte Quelltexte werden erkannt und abgelehnt.
- **Keine Formaterkennung.** Fest auf JSON programmiert? rosetta verarbeitet JSON, TOML, YAML und Hugo Markdown (Frontmatter + Textkörper) mit automatischer Erkennung.
- **Keine Steuerung der Methoden.** Jedes Sprachpaar erhält dieselbe Methode. rosetta ermöglicht es Ihnen, Google Translate für Französisch, ein LLM für Japanisch und eine benutzerdefinierte, von der Community gehostete Pipeline für Cree zu verwenden — in derselben Konfigurationsdatei.

rosetta ist die produktionsreife Version dieses Skripts.

---

## Was es besonders macht

### Jede Methode ist ein Plugin

Die Übersetzungsmethode ist **pro Sprachpaar konfigurierbar**. Kombinieren Sie Google Translate, LLMs, angeleitete Prompts und benutzerdefinierte APIs im selben Projekt:

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

Glauben Sie, Ihre Methode kann von Englisch nach Spanisch übersetzen? Von Türkisch nach Aserbaidschanisch? Von Englisch nach Cree?

**Beweisen Sie es.** Die zugehörige [Evaluierungsumgebung](https://mtevalarena.org/docs/specifications/harness) unterzieht jede Übersetzungsmethode einem Benchmark-Test mit reproduzierbarer, eindeutig identifizierbarer Bewertung. Die [Rangliste](/leaderboard) erfasst jede Einreichung.

Die Evaluierungsumgebung und die Produktions-CLI teilen sich dieselbe Plugin-Schnittstelle. Eine Methode, die in der Evaluierung gut abschneidet, kann in der Produktion verwendet werden — sofern die Community, deren Sprache sie dient, ihre Zustimmung gibt. Für indigene und ressourcenarme Sprachen ist diese Zustimmung von Bedeutung. Siehe [Datensouveränität](https://mtevalarena.org/docs/sovereignty/data-sovereignty).

```bash
# Benchmark your method (in the eval harness repo)
cd gds-mt-eval-harness
python eval/baseline_experiment.py --dataset data/edtekla-dev-v1.json --submit

# Use it locally
npx i18n-rosetta sync
```

Dasselbe Plugin. Integrieren und testen.

### Der komplette Werkzeugkasten

rosetta ist nicht nur `sync`. Es ist eine vollständige i18n-Pipeline:

| Befehl | Funktion |
|---------|-------------|
| `sync` | Übersetzt fehlende, veraltete und Fallback-Schlüssel |
| `watch` | Automatische Synchronisierung, wenn sich Ihre Quelldatei ändert |
| `lint` | Durchsucht den Quellcode nach fest codierten Zeichenfolgen |
| `wrap` | Umschließt fest codierte Zeichenfolgen automatisch mit `t()`-Aufrufen |
| `audit` | Listet alle unübersetzten `[EN]`-Fallback-Werte auf |
| `integrity` | Erkennt beschädigte Platzhalter und Kodierungsprobleme |
| `seo` | Generiert hreflang-Tags, Sitemaps und JSON-LD |
| `status` | Zeigt Sprachpaar-Konfigurationen, Plugins und Benchmark-Ergebnisse an |
| `provenance` | Überprüft die Lizenzierung der Übersetzungsressourcen |
| `plugin` | Installiert, entfernt und listet Methoden-Plugins auf |

Drei davon — `lint`, `sync`, `audit` — bilden eine CI-Pipeline, die fest codierte Zeichenfolgen abfängt, sie übersetzt und den Build fehlschlagen lässt, falls eine Lokalisierung unvollständig ist.

---

## Die Arena

Die [Methoden-Rangliste](/leaderboard) ist die Anzeigetafel. Jede Einreichung wird per Fingerabdruck an einen Git-Commit gebunden, für einen bestimmten Datensatz versioniert und von derselben Evaluierungsumgebung bewertet. Jeder kann etwas einreichen.

**Was können Sie beweisen?** Die Evaluierungsumgebung akzeptiert JSON. Plugins akzeptieren JSON. Jede Methode, die JSON erzeugt, kann getestet werden:

| Ansatz | Beispiel |
|----------|---------|
| **Angeleitetes LLM** | Injizieren von Grammatikregeln und Wörterbüchern in den Prompt eines Frontier-Modells |
| **Feinabgestimmtes Modell** | Trainieren eines offenen Modells mit parallelen Texten — nur nicht mit den Evaluierungsdaten |
| **FST-gesteuerte Pipeline** | LLM generiert → Finite-State-Transducer validiert die Morphologie → erneuter Versuch |
| **Verkettete Modelle** | Modell A entwirft → Modell B führt Post-Editing durch → Modell C bewertet |
| **Wörterbuch + LLM** | Erzwingen bekannter Begriffe aus einem Wörterbuch, das LLM übernimmt den Rest |
| **Evolutionär** | Kandidaten generieren, bewerten, die besten mutieren, wiederholen |
| **Partielle Übersetzung** | Eine Stichprobe manuell übersetzen, beweisen, dass Ihr LLM übereinstimmt, den Rest automatisch übersetzen |

Führen Sie Feinabstimmungen von Modellen durch. Setzen Sie evolutionäre Algorithmen ein. Testen Sie Antworten von Schülern in Sprachprüfungen. Erstellen Sie Nachschlagetabellen. Verketten Sie drei Modelle miteinander. Solange Ihre Methode JSON erzeugt, bewertet die Evaluierungsumgebung sie und das Framework führt sie aus.

:::danger Die einzige Regel
**Trainieren Sie nicht mit den Evaluierungsdaten.** Methoden, die dem Benchmark-Datensatz ausgesetzt waren, werden disqualifiziert. Führen Sie Feinabstimmungen mit beliebigen Daten durch. Nur nicht mit dem Testdatensatz.
:::

Dies ist eine offene Einladung. Wenn Sie mit einer ressourcenarmen Sprache arbeiten — als Forscher, Community-Mitglied, Student oder einfach als jemand, dem das Thema am Herzen liegt — entwickeln Sie eine Methode, führen Sie die Evaluierungsumgebung aus und sichern Sie sich die höchste Punktzahl. Das Problem ist ungelöst. Die Infrastruktur ist vorhanden.

**[→ Zur Rangliste](/leaderboard)**

---

## Nächste Schritte

**Erste Schritte:**
- [Installation](/docs/getting-started/installation) — Einrichtung in 2 Minuten
- [Schnellstart](/docs/getting-started/quick-start) — Führen Sie Ihre erste Synchronisierung aus
- [Unterstützte Sprachen](/docs/reference/supported-languages) — Was von Haus aus verfügbar ist

**Anpassen Ihrer Einrichtung:**
- [Übersetzungsmethoden](/docs/guides/translation-methods) — Wählen Sie die richtige Methode pro Sprachpaar
- [Konfiguration](/docs/getting-started/configuration) — Vollständige Konfigurationsreferenz
- [Mehrsprachige Hugo-Website](/docs/tutorials/hugo-multilingual-site) — Übersetzung von Markdown-Inhalten

**Tiefer einsteigen:**
- [Datensouveränität](https://mtevalarena.org/docs/sovereignty/data-sovereignty) — OCAP-, CARE- und Māori-Prinzipien zur Datensouveränität
- [Unterstützung einer ressourcenarmen Sprache](https://mtevalarena.org/docs/community/low-resource-languages) — Die Herausforderung, mit der alles begann
- [Kochbuch: FST-gesteuerte Pipeline](https://mtevalarena.org/docs/tutorials/fst-gated-pipeline) — Aufbau einer Dekompositionspipeline
- [MT-Evaluierung](https://mtevalarena.org/docs/leaderboard/rules) — Wie die Evaluierungsumgebung und die Rangliste funktionieren
- [Methoden-Rangliste](/leaderboard) — Live-Ergebnisse und Einreichungen