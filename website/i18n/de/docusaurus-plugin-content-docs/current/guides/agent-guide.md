---
sidebar_position: 9
title: "Agenten-Leitfaden: Verwendung von i18n-rosetta"
description: "Wie KI-Agenten i18n-rosetta installieren, konfigurieren und ausführen können, um Sprachdateien zu übersetzen."
---
# Agenten-Leitfaden: Verwendung von i18n-rosetta

i18n-rosetta ist ein CLI-Tool, das die Lokalisierungsdateien Ihrer Anwendung mit einem einzigen Befehl übersetzt. Dieser Leitfaden richtet sich an KI-Agenten (oder Entwickler, die mit KI-Agenten arbeiten), die schnell von null auf übersetzte Lokalisierungsdateien kommen möchten.

:::tip Bereits vertraut?
Wenn Sie nur die Befehle benötigen, springen Sie zur [CLI-Referenz](/docs/reference/cli). Wenn Sie eine Übersetzungsmethode entwickeln und einem Benchmark unterziehen möchten, lesen Sie den [Arena-Agenten-Leitfaden](https://mtevalarena.org/docs/getting-started/agent-guide).
:::

---

## Umgebungseinrichtung

```bash
# No global install needed — npx runs it directly
npx i18n-rosetta sync
```

**Voraussetzungen:**
- Node.js 18+
- Ein API-Schlüssel für Ihren Übersetzungsanbieter

**Einrichtung des API-Schlüssels** — rosetta benötigt mindestens einen Schlüssel, abhängig davon, welche Methoden Sie verwenden:

```bash
# Option 1: export (session only)
export OPENROUTER_API_KEY="sk-or-..."        # for llm / llm-coached methods
export GOOGLE_TRANSLATE_API_KEY="AIza..."    # for google-translate method

# Option 2: .env file in your project root (persistent, gitignored)
echo 'OPENROUTER_API_KEY=sk-or-...' > .env
```

Rosetta liest `.env` automatisch aus. Sie erhalten einen OpenRouter-Schlüssel unter [openrouter.ai/keys](https://openrouter.ai/keys).

---

## Erste Synchronisation

Rosetta erkennt Ihre Lokalisierungsdateien, deren Format (JSON, TOML, YAML, PO) und Ihre Zielsprachen automatisch:

```bash
npx i18n-rosetta sync
```

**Was passiert:**
1. Lädt `i18n-rosetta.config.json` (oder erkennt Einstellungen automatisch)
2. Scannt Ihre Quell-Lokalisierungsdatei und flacht verschachtelte Schlüssel ab
3. Vergleicht mit `.i18n-rosetta.lock` (SHA-256-Hashes von zuvor übersetzten Werten)
4. Prüft `.rosetta/tm.json` auf zwischengespeicherte Übersetzungen (Translation Memory)
5. Übersetzt nur **geänderte, fehlende oder veraltete Schlüssel** über die konfigurierte Methode
6. Führt das Quality Gate (5 Prüfungen) für jede Übersetzung aus
7. Schreibt erfolgreiche Übersetzungen in die Ziel-Lokalisierungsdatei
8. Aktualisiert die Lock-Datei und den TM-Cache

Bei einem typischen erneuten Durchlauf nach der Änderung eines Schlüssels liefert Schritt 4 142 Schlüssel aus dem Cache und Schritt 5 übersetzt 1 Schlüssel. Aus diesem Grund sind nachfolgende Synchronisationen schnell und kostengünstig.

---

## Konfiguration

Erstellen Sie `i18n-rosetta.config.json` im Stammverzeichnis Ihres Projekts:

```json
{
  "inputLocale": "en",
  "pairs": {
    "en-fr": { "method": "llm-coached" },
    "en-ja": { "method": "google-translate" },
    "en-crk": { "method": "api", "endpoint": "http://localhost:3000/translate" }
  }
}
```

Wichtige Felder:

| Feld | Zweck | Standardwert |
|-------|---------|---------|
| `inputLocale` | Quellsprache | `en` |
| `pairs` | Zuordnung von Quelle→Ziel mit Methodenkonfiguration | (erforderlich) |
| `localesDir` | Speicherort der Lokalisierungsdateien | (automatisch erkannt) |
| `model` | LLM-Modell für die Methoden `llm`/`llm-coached` | `google/gemini-2.5-flash` |
| `batchSize` | Schlüssel pro API-Aufruf | 80 (LLM), 128 (Google) |
| `jsonConcurrency` | Parallele Lokalisierungsübersetzungen für JSON-Schlüssel | 200 |
| `contentConcurrency` | Parallele API-Aufrufe für die Inhaltsübersetzung | 48 |

Vollständige Referenz: [Konfiguration](/docs/getting-started/configuration)

---

## Übersetzungsmethoden

| Methode | Wann zu verwenden | Kosten | API-Schlüssel benötigt |
|--------|------------|------|---------------|
| **`llm`** | Allzweck, gut für ressourcenstarke Sprachen | Pro Token (modellabhängig) | `OPENROUTER_API_KEY` |
| **`llm-coached`** | Wenn Sie Grammatikregeln/Wörterbücher für die Zielsprache haben | Pro Token + Coaching-Kontext | `OPENROUTER_API_KEY` |
| **`google-translate`** | Ressourcenstarke Sprachen, bei denen GT gut funktioniert | 20 $/Million Zeichen | `GOOGLE_TRANSLATE_API_KEY` |
| **`api`** | Benutzerdefinierte Pipeline, die hinter einem HTTP-Endpunkt gehostet wird | Vom Server bestimmt | Keiner (Endpunkt übernimmt die Authentifizierung) |
| **`plugin`** | Vorgefertigte Methode, die lokal installiert ist | Variiert | Variiert |

Details: [Übersetzungsmethoden](/docs/guides/translation-methods)

---

## Coaching-Daten

Für `llm-coached`-Paare steuern Coaching-Daten das LLM mit explizitem linguistischem Wissen. Erstellen Sie eine Coaching-Datei:

```json title="coaching/fr.json"
{
  "grammar_rules": [
    "Use formal register (vous) for all UI text",
    "Adjectives agree in gender and number with the noun"
  ],
  "dictionary": {
    "dashboard": "tableau de bord",
    "settings": "paramètres"
  },
  "style_notes": "Prefer active voice. Avoid anglicisms."
}
```

Referenzieren Sie diese in Ihrer Paarkonfiguration:

```json
"en-fr": { "method": "llm-coached", "coachingFile": "coaching/fr.json" }
```

Das Quality Gate überprüft, ob Wörterbuchbegriffe tatsächlich in der Ausgabe erscheinen — Verstöße werden als `[TERM]`-Warnungen protokolliert.

Details: [Coaching-Daten](/docs/concepts/coaching-data)

---

## Quality Gate

Jede Übersetzung durchläuft fünf automatisierte Prüfungen, bevor sie auf die Festplatte geschrieben wird:

| Prüfung | Was sie abfängt | Beispiel |
|-------|----------------|---------|
| **Leer/Blank** | Modell hat nichts zurückgegeben | `""` |
| **Quell-Echo** | Modell hat die englische Eingabe unverändert zurückgegeben | `"Welcome"` für Japanisch |
| **Halluzinationsschleife** | Wiederholte Trigramme | `"Qo' Qo' Qo' Qo'"` |
| **Längeninflation** | Ausgabe ist 4×+ länger als die Quelle | 10-Zeichen-Quelle → 50-Zeichen-Ausgabe |
| **Schrift-Konformität** | Falsches Schriftsystem für die Lokalisierung | Lateinischer Text für arabische Lokalisierung |

Fehlschläge werden mit dem Präfix `[GATE]` protokolliert. Keine stillen Fallbacks — wenn eine Übersetzung fehlschlägt, wird dies gemeldet und nicht stillschweigend akzeptiert.

Details: [Quality Gate](/docs/concepts/quality-gate)

---

## Translation Memory

Rosetta speichert Übersetzungen in `.rosetta/tm.json` zwischen, indiziert nach Quelltext + Lokalisierung + Methode. Bei nachfolgenden Synchronisationen werden unveränderte Schlüssel aus dem Cache bereitgestellt — kein API-Aufruf, keine Kosten.

```
[TM] 142 key(s) served from cache
Translating 3 key(s) to French (llm)... [OK]
```

Um den Cache für einen Durchlauf zu umgehen: `npx i18n-rosetta sync --no-tm`

Details: [Translation Memory](/docs/concepts/translation-memory)

---

## Generierte Dateien

Rosetta erstellt mehrere Dateien in Ihrem Projekt. Machen Sie sich mit diesen vertraut, damit Sie nicht versehentlich die falschen Dateien löschen oder committen:

| Datei | Zweck | Git? |
|------|---------|------|
| `.i18n-rosetta.lock` | SHA-256-Hashes der übersetzten Quellwerte (Änderungserkennung) | **Ja** — committen Sie dies |
| `.i18n-rosetta-content.lock` | Dasselbe, aber für Markdown/MDX-Inhaltsdateien | **Ja** — committen Sie dies |
| `.rosetta/tm.json` | Translation Memory Cache | **Ja** — committen Sie dies (spart API-Kosten für das Team) |
| `.rosetta/coaching/` | Verzeichnis für Coaching-Daten | **Ja** — dies ist Ihr linguistisches Wissen |
| `i18n-rosetta.config.json` | Projektkonfiguration | **Ja** — committen Sie dies |

---

## Gängige Muster

**Ein Sprachpaar übersetzen:**
```bash
npx i18n-rosetta sync --pair en-fr
```

**Alle konfigurierten Paare übersetzen:**
```bash
npx i18n-rosetta sync
```
Rosetta übersetzt alle Lokalisierungen parallel. Dank TM-Caching erreichen nur geänderte Schlüssel die API.

**Inhaltsmodus (Markdown/MDX für Docusaurus, Hugo usw.):**
```bash
npx i18n-rosetta sync --content
```
Übersetzt Dokumentationen, Blogbeiträge und Inhaltsdateien parallel zu den Lokalisierungs-JSONs. Nutzt parallele Nebenläufigkeit (Standard: 48 gleichzeitige API-Aufrufe). Passen Sie dies mit `--content-concurrency` an.

**Probelauf (Vorschau ohne zu schreiben):**
```bash
npx i18n-rosetta sync --dry-run
```

**Neuübersetzung bestimmter Schlüssel erzwingen:**
```bash
npx i18n-rosetta sync --force-keys "hero.title,nav.about"
```

**Neuübersetzung aller Inhaltsdateien erzwingen:**
```bash
npx i18n-rosetta sync --force-content
```

**Übersetzungsstatus prüfen:**
```bash
npx i18n-rosetta status
```
Zeigt Abdeckung, Qualitätsstufen und Plugin-Informationen für jedes Paar an.

**Prüfung auf unübersetzte Fallbacks:**
```bash
npx i18n-rosetta audit
```
Listet alle `[EN]`-Fallback-Werte auf, die übersetzt werden müssen.

---

## Fehlerbehebung

| Problem | Lösung |
|---------|-----|
| `OPENROUTER_API_KEY not set` | Exportieren Sie den Schlüssel oder fügen Sie ihn zu `.env` im Stammverzeichnis Ihres Projekts hinzu |
| `No locale files found` | Legen Sie `localesDir` in der Konfiguration fest oder stellen Sie sicher, dass Ihre Lokalisierungsdateien der Standardbenennung entsprechen (`en.json`, `fr.json`) |
| `[GATE] Script compliance failed` | Ihre Ziel-Lokalisierung hat lateinischen Text anstelle des erwarteten Schriftsystems erhalten — versuchen Sie ein anderes Modell oder fügen Sie Coaching-Daten hinzu |
| `[GATE] Source echo` | Das Modell hat Englisch unverändert zurückgegeben — Coaching-Daten oder ein anderes Modell beheben dies normalerweise |
| Alle Übersetzungen zwischengespeichert | Führen Sie den Befehl mit `--no-tm` aus, um den Cache zu umgehen, oder mit `--force-keys` für bestimmte Schlüssel |
| Lock-Datei-Konflikte | `.i18n-rosetta.lock` verwendet SHA-256-Hashes — Merge-Konflikte können sicher gelöst werden, indem Sie eine der beiden Versionen beibehalten und die Synchronisation anschließend erneut ausführen |

---

## Nächste Schritte

- [Schnellstart](/docs/getting-started/quick-start) — vollständige Anleitung für den Einstieg
- [CLI-Referenz](/docs/reference/cli) — jeder Befehl und jedes Flag
- [Wie es funktioniert](/docs/how-it-works) — die Synchronisations-Pipeline erklärt
- [Die Eval Harness Bridge](/docs/guides/bridge) — wie rosetta sich mit der Arena verbindet
- **Möchten Sie Ihre eigene Übersetzungsmethode entwickeln?** Lesen Sie den [Arena-Agenten-Leitfaden](https://mtevalarena.org/docs/getting-started/agent-guide) — entwickeln Sie eine Methode, beweisen Sie, dass sie funktioniert, und gewinnen Sie Preise.