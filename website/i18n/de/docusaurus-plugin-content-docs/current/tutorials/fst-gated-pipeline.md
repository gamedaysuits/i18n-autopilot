---
sidebar_position: 6
title: "Kochbuch: FST-gesteuerte Übersetzungspipeline"
description: "Erstellen Sie eine Dekompositionspipeline mit morphologischer Validierung, kapseln Sie diese als API-Service und integrieren Sie sie in rosetta."
---
# Kochbuch: FST-geprüfte Übersetzungs-Pipeline

Erstellen Sie eine mehrstufige Übersetzungs-Pipeline, die den Ausgangstext zerlegt, über ein LLM übersetzt, die Ausgaben mit einem endlichen Transduktor (Finite-State Transducer, FST) validiert und das Ganze als HTTP-Endpunkt bereitstellt, den rosetta über die Methode `api` aufruft.

**Was Sie erstellen werden:** Eine Übersetzungs-API für Plains Cree, die morphologisch ungültige Übersetzungen abfängt, *bevor* sie Ihre Lokalisierungsdateien erreichen.

:::info Voraussetzungen
- Ein ausführbares FST-Binary (z. B. vom [Plains Cree Analyzer von ALTLab](https://github.com/UAlbertaALTLab/lang-crk))
- Node.js 20+ oder Python 3.10+
- Einen OpenRouter-API-Schlüssel für den LLM-Schritt
:::

---

## Architektur

Die Pipeline läuft als eigenständiger HTTP-Dienst. rosetta weiß nicht und kümmert sich nicht darum, was im Inneren passiert — es sendet Schlüssel und erhält Übersetzungen zurück.

```mermaid
graph TD
    subgraph rosetta ["i18n-rosetta (client)"]
        A["rosetta sync"]
    end

    subgraph pipeline ["Your Pipeline (server)"]
        B["POST /translate"]
        C["1. Decompose"]
        D["2. Dictionary Lookup"]
        E["3. LLM Translate"]
        F["4. FST Validate"]
        G{"Valid?"}
        H["5. Retry with feedback"]
        I["Return translations"]
    end

    A -->|"JSON request"| B
    B --> C
    C --> D
    D --> E
    E --> F
    F --> G
    G -->|"✅ Accepted"| I
    G -->|"❌ Rejected"| H
    H --> E
    I -->|"JSON response"| A
```

### Warum diese Architektur

Jede Stufe hat eine spezifische Aufgabe:

| Stufe | Was sie tut | Warum sie wichtig ist |
|-------|-------------|---------------|
| **Zerlegen (Decompose)** | Teilt zusammengesetzte UI-Zeichenfolgen in übersetzbare Segmente auf | Polysynthetische Sprachen kodieren ganze Sätze in einzelnen Wörtern — das LLM benötigt kleinere Einheiten |
| **Wörterbuchabfrage (Dictionary Lookup)** | Prüft ein zweisprachiges Wörterbuch auf bekannte Übersetzungen | Erzwingt die korrekte Terminologie für bekannte Begriffe, anstatt sich auf das Raten des LLMs zu verlassen |
| **LLM-Übersetzung (LLM Translate)** | Sendet das Segment mit Register- und Grammatikkontext an ein LLM | Verarbeitet neuartige Phrasen und erzeugt fließende Ausgaben |
| **FST-Validierung (FST Validate)** | Leitet die Ausgabe durch einen morphologischen Analysator | Fängt ungültige Wortformen ab — wenn der FST ein Wort ablehnt, ist es in der Sprache nicht gültig |
| **Wiederholung (Retry)** | Sendet abgelehnte Wörter mit dem Fehler-Feedback des FST erneut | Gibt dem LLM spezifische Informationen darüber, *warum* das Wort falsch war |

---

## Der Datenfluss

Hier sehen Sie, was mit einem einzelnen Schlüssel (`"welcome": "Welcome to our app"`) passiert, während er die Pipeline durchläuft:

```mermaid
sequenceDiagram
    participant R as rosetta
    participant P as Pipeline
    participant D as Dictionary
    participant L as LLM (OpenRouter)
    participant F as FST Analyzer

    R->>P: { keys: { "welcome": "Welcome to our app" } }
    P->>D: Lookup "welcome", "app"
    D-->>P: "welcome" → "tânisi" (known)
    P->>L: Translate "Welcome to our app"<br/>Dictionary: welcome=tânisi<br/>Register: Formal SRO
    L-->>P: "tânisi, pê-kîwêw ôta"
    P->>F: Analyze "tânisi"
    F-->>P: ✅ tânisi+V+AI+Ind+2Sg
    P->>F: Analyze "pê-kîwêw"
    F-->>P: ✅ PV/pê+kîwêw+V+AI+Ind+3Sg
    P->>F: Analyze "ôta"
    F-->>P: ✅ ôta+Ipc
    P-->>R: { translations: { "welcome": "tânisi, pê-kîwêw ôta" } }
```

### Wenn der FST ablehnt

```mermaid
sequenceDiagram
    participant L as LLM
    participant F as FST Analyzer
    participant P as Pipeline

    L-->>P: "tânisi, pekiwew ôta"
    P->>F: Analyze "pekiwew"
    F-->>P: ❌ REJECTED (no analysis)
    Note over P: Missing long vowel diacritic:<br/>"pekiwew" should be "pê-kîwêw"
    P->>L: Retry: "pekiwew" was rejected by FST.<br/>Likely issue: missing SRO diacritics.<br/>Correct SRO uses ê, î, ô, â for long vowels.
    L-->>P: "pê-kîwêw"
    P->>F: Analyze "pê-kîwêw"
    F-->>P: ✅ PV/pê+kîwêw+V+AI+Ind+3Sg
```

---

## Implementierung

### Schritt 1: Das Server-Grundgerüst

Der Server implementiert den [API-Methodenvertrag](/docs/guides/serving-a-method) von rosetta — einen einzelnen `POST /translate`-Endpunkt.

```javascript title="server.js"
import express from 'express';
import { translateBatch } from './pipeline.js';

const app = express();
app.use(express.json());

/**
 * rosetta API contract:
 *
 * Request:  { source_locale, target_locale, method, keys: { "key": "source" } }
 * Response: { translations: { "key": "translated" }, meta: { ... } }
 */
app.post('/translate', async (req, res) => {
  const { source_locale, target_locale, method, keys } = req.body;

  // Validate request
  if (!keys || typeof keys !== 'object') {
    return res.status(400).json({ error: { message: 'Missing keys object' } });
  }

  try {
    const startTime = Date.now();
    const { translations, stats } = await translateBatch(keys, {
      sourceLang: source_locale,
      targetLang: target_locale,
    });

    res.json({
      translations,
      meta: {
        model: 'custom-pipeline/fst-gated-v1',
        method: 'decompose-lookup-translate-validate',
        elapsed_ms: Date.now() - startTime,
        fst_acceptance_rate: stats.fstAccepted / stats.total,
        retries: stats.retries,
      },
    });
  } catch (err) {
    console.error('[ERR] Pipeline failed:', err.message);
    res.status(500).json({ error: { message: err.message } });
  }
});

// Health check for rosetta connectivity verification
app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.listen(3001, () => {
  console.log('FST-gated pipeline running on http://localhost:3001');
});
```

### Schritt 2: Die Pipeline

Jede Stufe ist eine Funktion. Die Pipeline verkettet sie miteinander.

```javascript title="pipeline.js"
import { lookupDictionary } from './dictionary.js';
import { callLLM } from './llm.js';
import { analyzeWithFST } from './fst.js';

const MAX_RETRIES = 3;

/**
 * Translate a batch of keys through the full pipeline.
 *
 * @param {object} keys - Map of key → source string
 * @param {object} options - { sourceLang, targetLang }
 * @returns {{ translations: object, stats: object }}
 */
export async function translateBatch(keys, options) {
  const translations = {};
  const stats = { total: 0, fstAccepted: 0, retries: 0, dictionaryHits: 0 };

  for (const [key, sourceText] of Object.entries(keys)) {
    stats.total++;
    translations[key] = await translateSingle(sourceText, options, stats);
  }

  return { translations, stats };
}

/**
 * Translate a single string through all pipeline stages.
 */
async function translateSingle(sourceText, options, stats) {

  // ── Stage 1: Decompose ──────────────────────────────────
  // Split compound strings into segments the LLM can handle.
  // For UI strings this is often a no-op, but for longer content
  // it prevents the LLM from losing context in long prompts.
  const segments = decompose(sourceText);

  // ── Stage 2: Dictionary Lookup ──────────────────────────
  // Check each segment against the bilingual dictionary.
  // Known terms are forced — the LLM won't override them.
  const knownTerms = {};
  for (const segment of segments) {
    const entry = lookupDictionary(segment.toLowerCase());
    if (entry) {
      knownTerms[segment] = entry;
      stats.dictionaryHits++;
    }
  }

  // ── Stage 3: LLM Translate ──────────────────────────────
  let translation = await callLLM(sourceText, {
    ...options,
    knownTerms,
    register: 'nêhiyawêwin (Plains Cree). Use SRO orthography. '
            + 'Professional register for educational contexts.',
  });

  // ── Stage 4: FST Validate ──────────────────────────────
  // Split the translation into words and check each one.
  let { accepted, rejected } = await validateWords(translation);

  // ── Stage 5: Retry Loop ─────────────────────────────────
  // If any words were rejected, retry with FST feedback.
  let attempt = 0;
  while (rejected.length > 0 && attempt < MAX_RETRIES) {
    attempt++;
    stats.retries++;

    const feedback = rejected
      .map(w => `"${w}" was rejected by the morphological analyzer`)
      .join('; ');

    translation = await callLLM(sourceText, {
      ...options,
      knownTerms,
      register: 'nêhiyawêwin (Plains Cree). Use SRO orthography.',
      feedback: `Previous attempt had invalid words. ${feedback}. `
              + 'Use correct SRO diacritics (ê, î, ô, â for long vowels). '
              + 'Ensure verb forms match expected conjugation patterns.',
    });

    ({ accepted, rejected } = await validateWords(translation));
  }

  if (rejected.length === 0) stats.fstAccepted++;

  return translation;
}

/**
 * Decompose source text into translatable segments.
 *
 * For simple key-value UI strings, this usually returns the
 * original string as a single segment. For longer content,
 * it splits on sentence boundaries.
 */
function decompose(text) {
  // Simple sentence-boundary split. Replace with your own
  // morphological decomposition for more complex needs.
  return text
    .split(/(?<=[.!?])\s+/)
    .filter(s => s.trim().length > 0);
}

/**
 * Validate each word in a translation against the FST.
 *
 * @returns {{ accepted: string[], rejected: string[] }}
 */
async function validateWords(translation) {
  // Split on whitespace and punctuation, keeping only words
  const words = translation
    .split(/[\s,;:.!?'"()[\]{}]+/)
    .filter(w => w.length > 0);

  const accepted = [];
  const rejected = [];

  for (const word of words) {
    const analyses = await analyzeWithFST(word);
    if (analyses.length > 0) {
      accepted.push(word);
    } else {
      rejected.push(word);
    }
  }

  return { accepted, rejected };
}
```

### Schritt 3: Der FST-Wrapper

Verpacken Sie Ihr FST-Binary als asynchrone Funktion. Dieses Beispiel verwendet den HFST-basierten Plains Cree Analyzer von ALTLab.

```javascript title="fst.js"
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

// Path to your FST analyzer binary
const FST_PATH = process.env.FST_ANALYZER_PATH || './bin/crk-analyzer';

/**
 * Run a word through the FST morphological analyzer.
 *
 * Returns an array of analyses. Empty array = rejected.
 *
 * Example:
 *   analyzeWithFST("tânisi")
 *   → ["tânisi+V+AI+Ind+2Sg", "tânisi+V+AI+Cnj+2Sg"]
 *
 *   analyzeWithFST("pekiwew")
 *   → []  // rejected — missing diacritics
 *
 * @param {string} word - A single word in SRO orthography
 * @returns {string[]} Array of FST analyses (empty = rejected)
 */
export async function analyzeWithFST(word) {
  try {
    // HFST lookup: pipe the word to stdin, read analyses from stdout
    const { stdout } = await execFileAsync(
      FST_PATH,
      ['--quiet'],
      { input: word + '\n', timeout: 5000 }
    );

    // Parse HFST output: each line is "input\tanalysis\tweight"
    // Lines with "+?" indicate unrecognized forms
    return stdout
      .split('\n')
      .filter(line => line.includes('\t') && !line.includes('+?'))
      .map(line => line.split('\t')[1]);

  } catch (err) {
    // If the FST binary isn't available, log and reject
    console.error(`[WARN] FST analysis failed for "${word}": ${err.message}`);
    return [];
  }
}
```

### Schritt 4: Wörterbuch- und LLM-Module

```javascript title="dictionary.js"
/**
 * Simple bilingual dictionary backed by a JSON file.
 *
 * In production, you'd load from the coaching data directory
 * or query itwêwina (https://itwewina.altlab.app/) via API.
 */
const DICTIONARY = {
  'hello': 'tânisi',
  'welcome': 'tânisi',
  'thank you': 'kinanâskomitin',
  'home': 'kīwēwin',
  'search': 'nānātawāpahtam',
  'settings': 'isi-nākatohkēwin',
  'help': 'nīsōhkamākēwin',
  'back': 'kīwē',
};

/**
 * @param {string} term - Lowercase English term
 * @returns {string|null} Cree translation or null
 */
export function lookupDictionary(term) {
  return DICTIONARY[term] || null;
}
```

```javascript title="llm.js"
/**
 * Call an LLM via OpenRouter for translation.
 */
const OPENROUTER_API = 'https://openrouter.ai/api/v1/chat/completions';

export async function callLLM(sourceText, options) {
  const { knownTerms = {}, register, feedback } = options;

  // Build the system prompt with register and known terms
  let systemPrompt = `You are translating English to Plains Cree.\n\n`;
  systemPrompt += `Register: ${register}\n\n`;

  if (Object.keys(knownTerms).length > 0) {
    systemPrompt += `Required terminology (use these exact translations):\n`;
    for (const [en, crk] of Object.entries(knownTerms)) {
      systemPrompt += `  "${en}" → "${crk}"\n`;
    }
    systemPrompt += '\n';
  }

  if (feedback) {
    systemPrompt += `IMPORTANT correction from previous attempt:\n${feedback}\n\n`;
  }

  systemPrompt += `Rules:\n`;
  systemPrompt += `- Use Standard Roman Orthography (SRO)\n`;
  systemPrompt += `- Use macron/circumflex for long vowels: ê, î, ô, â\n`;
  systemPrompt += `- Return ONLY the Cree translation, nothing else\n`;

  const response = await fetch(OPENROUTER_API, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'google/gemini-2.5-pro',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: sourceText },
      ],
      temperature: 0.2,
    }),
  });

  const json = await response.json();
  return json.choices[0].message.content.trim();
}
```

---

## Verbindung mit rosetta herstellen

### Das Sprachpaar konfigurieren

Richten Sie Ihr Sprachpaar auf den laufenden Dienst aus:

```json title="i18n-rosetta.config.json"
{
  "version": 3,
  "inputLocale": "en",
  "pairs": {
    "en:crk": {
      "method": "api",
      "endpoint": "http://localhost:3001/translate"
    }
  },
  "languages": {
    "crk": {
      "name": "Plains Cree",
      "register": "SRO syllabics with grammatical precision."
    }
  }
}
```

### Den API-Schlüssel festlegen

```bash
export ROSETTA_API_KEY="your-service-auth-token"
export OPENROUTER_API_KEY="sk-or-v1-..."  # for the LLM step inside the pipeline
```

### Ausführen

rosetta sendet Ihre englischen Schlüssel per POST an die Pipeline. Die Pipeline zerlegt, schlägt nach, übersetzt, validiert, wiederholt und gibt Cree-Übersetzungen zurück. rosetta schreibt diese in `crk.json`.

---

## Evaluierung Ihrer Pipeline

Dieselbe Pipeline kann mit dem [Eval-Harness](/docs/eval/harness) evaluiert werden. Das Harness verwendet dasselbe JSON-in/JSON-out-Muster:

```bash
# Clone the harness
git clone https://github.com/gamedaysuits/gds-mt-eval-harness.git
cd gds-mt-eval-harness

# Run against the EDTeKLA dataset
python eval/baseline_experiment.py \
  --dataset data/edtekla-dev-v1.json \
  --model google/gemini-2.5-pro \
  --fst-analyzer ./bin/crk-analyzer \
  --condition fst-gated-v1 \
  --submit
```

Das Flag `--fst-analyzer` weist das Harness an, bei jeder Ausgabe eine FST-Validierung durchzuführen — dieselbe Validierung, die auch Ihre Pipeline durchführt. Dadurch können Sie das Ergebnis Ihrer Pipeline mit der Baseline vergleichen.

```mermaid
graph LR
    subgraph develop ["Development"]
        A["Build pipeline"] --> B["Run harness"]
        B --> C["Score on leaderboard"]
    end
    subgraph deploy ["Deployment"]
        C -->|"Same method"| D["Serve as API"]
        D --> E["rosetta sync"]
    end

    style develop fill:#1a1a2e,stroke:#e94560,color:#fff
    style deploy fill:#1a1a2e,stroke:#0f3460,color:#fff
```

**Beweisen Sie es, dann nutzen Sie es.** Die Methode, die Sie im Harness benchmarken, ist dieselbe Methode, die rosetta in der Produktion aufruft.

---

## Verpacken als Plugin

Sobald Ihre Pipeline Ergebnisse auf der Bestenliste erzielt hat, verpacken Sie sie als rosetta-Plugin, damit andere sie nutzen können:

```json title="crk-fst-gated-v1/method.json"
{
  "name": "crk-fst-gated-v1",
  "type": "api",
  "version": "1.0.0",
  "description": "FST-gated Plains Cree translation with morphological validation",
  "author": "Your Name",

  "config": {
    "endpoint": "https://your-server.example.com/translate"
  },

  "locales": ["crk"],

  "benchmarks": {
    "crk": {
      "date": "2026-06-01T00:00:00Z",
      "corpus_size": 124,
      "exact_match_rate": 0.12,
      "corpus_chrf": 48.7,
      "model": "google/gemini-2.5-pro",
      "harness_version": "2.0"
    }
  },

  "provenance": {
    "resources": [
      { "name": "ALTLab CRK Analyzer", "license": "LGPL-3.0", "type": "fst" },
      { "name": "Wolvengrey Dictionary", "license": "CC-BY-NC-SA-4.0", "type": "dictionary" }
    ],
    "commercialReady": false,
    "flags": ["nc-resource"]
  }
}
```

Installieren Sie es:

```bash
i18n-rosetta plugin install ./crk-fst-gated-v1/
```

Nun kann jeder mit Zugriff auf Ihren Server das Plugin verwenden:

```json title="i18n-rosetta.config.json"
{
  "pairs": {
    "en:crk": { "methodPlugin": "crk-fst-gated-v1" }
  }
}
```

---

## Erweiterung dieses Musters

Dieses Kochbuch demonstriert eine Pipeline-Architektur. Sie können sie für jede Sprache oder Methode anpassen:

| Variation | Was sich ändert |
|-----------|-------------|
| **Anderer FST** | Tauschen Sie den Pfad zum Binary aus. Sie können vorkompilierte FSTs (wie `.hfstol`- oder `lttoolbox`-Binaries) für über 100 Sprachen vom [GiellaLT GitHub](https://github.com/giellalt) oder [Apertium GitHub](https://github.com/apertium) herunterladen. |
| **Kein FST verfügbar** | Entfernen Sie die FST-Ausführungsstufe und verwenden Sie [flache UniMorph-Paradigma-Dateien](https://huggingface.co/datasets/unimorph/universal_morphologies) von Hugging Face, um eine statische Datenbankabfrage zur Validierung flektierter Formen durchzuführen. |
| **Mehrere LLMs** | Verketten Sie Modelle: ein schnelles Modell für den ersten Entwurf, ein Reasoning-Modell für Korrekturen. |
| **Mensch in der Schleife (Human-in-the-loop)** | Fügen Sie eine Warteschlangenstufe hinzu, die unsichere Übersetzungen zur fachlichen Überprüfung zurückhält, bevor sie zurückgegeben werden. |
| **Feinabgestimmtes Modell** | Ersetzen Sie den OpenRouter-Aufruf durch ein lokales Modell (Ollama, vLLM usw.). |
| **Andere Sprache** | Ändern Sie das Wörterbuch, den FST und das Register. Die Architektur bleibt identisch. |

Die Pipeline ist ein Muster. Die Stufen sind austauschbar. Bauen Sie das, was für Ihre Sprache funktioniert, beweisen Sie es auf der [Bestenliste](/leaderboard) und stellen Sie es bereit.

---

## Siehe auch

- **[Bereitstellung einer Methode per API](/docs/guides/serving-a-method)** — die Spezifikation des API-Vertrags
- **[Plugin-Spezifikation](/docs/reference/plugin-spec)** — das Manifest-Format method.json
- **[Unterstützung einer ressourcenarmen Sprache](/docs/guides/low-resource-languages)** — der breitere Kontext und die OCAP-Prinzipien
- **[MT-Evaluierung](/docs/eval/)** — gute vs. schlechte Methoden, was disqualifiziert wird
- **[Eval-Harness](/docs/eval/harness)** — wie Sie Ihre Pipeline benchmarken
- **[Methoden-Bestenliste](/leaderboard)** — reichen Sie Ihre Ergebnisse ein
- **[ALTLab](https://altlab.artsrn.ualberta.ca/)** — das Alberta Language Technology Lab (Plains Cree FST)
- **[Übersetzungsmethoden](/docs/guides/translation-methods)** — wie jede integrierte Methode funktioniert