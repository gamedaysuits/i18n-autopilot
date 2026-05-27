---
sidebar_position: 5
title: "Coaching-Daten"
---
# Coaching-Daten

Coaching-Daten sind der Mechanismus von rosetta, um LLMs Sprachen beizubringen, auf die sie nicht trainiert wurden. Indem Sie Grammatikregeln, Wörterbücher und Stilhinweise zusammen mit jeder Übersetzungsanfrage bereitstellen, verwandeln Sie ein universelles LLM in einen kontextbezogenen Übersetzer für jede beliebige Sprache — einschließlich Sprachen, für die es bisher keinerlei MT-Unterstützung gibt.

## Wie es funktioniert

Wenn Sie die Methode eines Paares auf `llm-coached` festlegen, lädt rosetta eine Coaching-Datei aus `.rosetta/coaching/<locale>.json` und fügt deren Inhalt als Teil der Systemnachricht in jeden LLM-Prompt ein. Das LLM sieht Ihre linguistischen Regeln zusammen mit der Übersetzungsanfrage und erzeugt so eine Ausgabe, die Ihrer Grammatik und Terminologie folgt, anstatt zu raten.

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

Da die Coaching-Daten Teil der Systemnachricht sind, profitieren sie vom **Prompt-Caching** — Anbieter wie Anthropic und Google speichern wiederholte Systempräfixe zwischen, sodass Sie für den Coaching-Kontext nur einmal pro Sitzung und nicht einmal pro Batch bezahlen.

## Format der Coaching-Datei

Erstellen Sie eine JSON-Datei pro Locale in `.rosetta/coaching/`:

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

### Felder

| Feld | Typ | Erforderlich | Beschreibung |
|-------|------|----------|-------------|
| `grammar_rules` | `string[]` | Nein | Array von Grammatikregeln, die in den System-Prompt eingefügt werden. Jede Regel sollte eine prägnante, umsetzbare Anweisung sein, der das LLM folgen kann. |
| `dictionary` | `object` | Nein | Schlüssel-Wert-Zuordnung (Key-Value Map) vom englischen Begriff → Begriff der Zielsprache. Wird für domänenspezifisches Vokabular verwendet, das das LLM nicht kennen würde. |
| `style_notes` | `string` | Nein | Freiform-Stilanweisungen (Register, Tonfall, Formalitätskonventionen). |

Alle Felder sind optional — Sie können nur mit einem Wörterbuch beginnen und Grammatikregeln hinzufügen, während Sie es weiter verfeinern.

## Fallback-Verhalten

Wenn ein Paar für `llm-coached` konfiguriert ist, aber keine Coaching-Datei für dieses Locale existiert, **greift rosetta auf die Standardmethode `llm` zurück** und gibt eine Konsolenwarnung aus:

```
[INFO] No coaching data for "crk" at .rosetta/coaching/crk.json
       Falling back to standard LLM method. Create coaching data for better results.
```

Das bedeutet, dass Sie `"defaultMethod": "llm-coached"` bedenkenlos global festlegen können — Sprachen mit Coaching-Daten werden diese verwenden, und der Rest erhält fehlerfrei die Standard-LLM-Übersetzung.

## Wann Coaching verwendet werden sollte

| Szenario | Empfohlene Methode |
|----------|-------------------|
| Tier-1-Sprachen (Französisch, Spanisch, Deutsch) | `llm` oder `google-translate` — LLMs kennen diese bereits sehr gut |
| Tier-2-Sprachen (Koreanisch, Türkisch, Thai) | `llm` mit einem Register — LLMs bewältigen diese mit Stilvorgaben angemessen |
| Tier-3-Sprachen (Plains Cree, Yoruba, Quechua) | `llm-coached` — LLMs benötigen Grammatikregeln und Wörterbücher |
| Conlangs (Klingonisch, Sindarin, Kryptonisch) | `llm-coached` — LLMs haben einige Trainingsdaten, benötigen aber Korrekturen |

## Erstellung guter Coaching-Daten

### Grammatikregeln

Schreiben Sie Regeln als **Anweisungen**, nicht als Beschreibungen. Das LLM befolgt Anweisungen besser, als es linguistische Theorie interpretiert.

```json
// ❌ Descriptive (the LLM learns nothing actionable)
"Plains Cree has animate and inanimate noun classes"

// ✅ Instructive (the LLM knows what to do)
"When translating nouns, check whether the Cree equivalent is animate (NA) or inanimate (NI) — this affects which verb conjugation to use"
```

### Wörterbücher

Konzentrieren Sie sich auf **domänenspezifische Begriffe**, die das LLM falsch verstehen oder erfinden würde. Halten Sie sich nicht mit gebräuchlichen Wörtern auf, die das LLM bereits beherrscht — konzentrieren Sie sich auf die Begriffe, die spezifisch für die Benutzeroberfläche (UI) Ihrer Anwendung sind.

### Stilhinweise

Seien Sie präzise in Bezug auf Register, Formalität und Konventionen:

```json
"style_notes": "Use formal register (vous-form in French). Preserve brand names untranslated. UI labels should be imperative mood ('Save', not 'Saves'). Maximum 40 characters for button text."
```

## Testen von gecoachten Übersetzungen

Verwenden Sie das [MT Eval Harness](https://github.com/gamedaysuits/gds-mt-eval-harness), um Ihre gecoachten Übersetzungen mit einem Referenzkorpus zu vergleichen:

```bash
# Install the harness
pip install mt-eval-harness

# Run coached translations against your test corpus
mt-eval run --corpus data/crk-corpus.json --model google/gemini-2.5-pro

# Score the results
mt-eval test eval/logs/run_*.json
```

Dadurch erhalten Sie chrF++-, BLEU- und Exact-Match-Werte. Erstellen Sie mehrere Versionen der Coaching-Datei und vergleichen Sie diese — objektive Metriken sind einer subjektiven Überprüfung überlegen.

---

## Siehe auch

- [Übersetzungsmethoden](/docs/guides/translation-methods) — die llm-coached Methode
- [Unterstützung einer ressourcenarmen Sprache](https://mtevalarena.org/docs/community/low-resource-languages) — Coaching in der Praxis
- [Plugin-Spezifikation](/docs/reference/plugin-spec) — Verpacken von Coaching-Daten in einem Plugin
- [Quality Gate](/docs/concepts/quality-gate) — wie gecoachte Übersetzungen validiert werden
- [Konfiguration](/docs/getting-started/configuration) — Coaching-Konfiguration pro Paar