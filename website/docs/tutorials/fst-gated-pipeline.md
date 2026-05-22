---
sidebar_position: 6
title: "Cookbook: FST-Gated Translation Pipeline"
description: "Build a decomposition pipeline with morphological validation, wrap it as an API service, and plug it into rosetta."
---

# Cookbook: FST-Gated Translation Pipeline

Build a multi-stage translation pipeline that decomposes source text, translates via LLM, validates outputs with a finite-state transducer (FST), and serves the whole thing as an HTTP endpoint that rosetta calls via the `api` method.

**What you'll build:** A translation API for Plains Cree that catches morphologically invalid translations *before* they reach your locale files.

:::info Prerequisites
- A running FST binary (e.g., from [ALTLab's Plains Cree analyzer](https://github.com/UAlbertaALTLab/lang-crk))
- Node.js 20+ or Python 3.10+
- An OpenRouter API key for the LLM step
:::

---

## Architecture

The pipeline runs as a standalone HTTP service. rosetta doesn't know or care what happens inside — it sends keys, gets translations back.

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

### Why This Architecture

Each stage has a specific job:

| Stage | What It Does | Why It Matters |
|-------|-------------|---------------|
| **Decompose** | Break compound UI strings into translatable segments | Polysynthetic languages encode whole sentences in single words — the LLM needs smaller units |
| **Dictionary Lookup** | Check a bilingual dictionary for known translations | Forces correct terminology for known terms instead of relying on LLM guesswork |
| **LLM Translate** | Send the segment to an LLM with register and grammar context | Handles novel phrases and generates fluent output |
| **FST Validate** | Run the output through a morphological analyzer | Catches invalid word forms — if the FST rejects a word, it's not valid in the language |
| **Retry** | Re-send rejected words with the FST's error feedback | Gives the LLM specific information about *why* the word was wrong |

---

## The Data Flow

Here's what happens to a single key (`"welcome": "Welcome to our app"`) as it flows through the pipeline:

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

### When the FST Rejects

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

## Implementation

### Step 1: The Server Skeleton

The server implements rosetta's [API method contract](/docs/guides/serving-a-method) — a single `POST /translate` endpoint.

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

### Step 2: The Pipeline

Each stage is a function. The pipeline chains them together.

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

### Step 3: The FST Wrapper

Wrap your FST binary as an async function. This example uses ALTLab's HFST-based Plains Cree analyzer.

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

### Step 4: Dictionary and LLM Modules

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

## Connecting to rosetta

### Configure the pair

Point your language pair at the running service:

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

### Set the API key

```bash
export ROSETTA_API_KEY="your-service-auth-token"
export OPENROUTER_API_KEY="sk-or-v1-..."  # for the LLM step inside the pipeline
```

### Run it

```bash
# Start the pipeline
node server.js

# In another terminal, run rosetta
npx i18n-rosetta sync
```

rosetta POSTs your English keys to the pipeline. The pipeline decomposes, looks up, translates, validates, retries, and returns Cree translations. rosetta writes them to `crk.json`.

---

## Evaluating Your Pipeline

The same pipeline can be evaluated with the [eval harness](/docs/eval/harness). The harness uses the same JSON-in/JSON-out pattern:

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

The `--fst-analyzer` flag tells the harness to run FST validation on every output — the same validation your pipeline does. This lets you compare your pipeline's score against the baseline.

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

**Prove it, then use it.** The method you benchmark in the harness is the same method rosetta calls in production.

---

## Packaging as a Plugin

Once your pipeline has leaderboard scores, package it as a rosetta plugin so others can use it:

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

Install it:

```bash
i18n-rosetta plugin install ./crk-fst-gated-v1/
```

Now anyone with access to your server can use the plugin:

```json title="i18n-rosetta.config.json"
{
  "pairs": {
    "en:crk": { "methodPlugin": "crk-fst-gated-v1" }
  }
}
```

---

## Extending This Pattern

This cookbook demonstrates one pipeline architecture. You can adapt it for any language or method:

| Variation | What Changes |
|-----------|-------------|
| **Different FST** | Swap the binary path. Any HFST or Foma analyzer works. |
| **No FST available** | Remove the validation stage. Use coached LLM only. |
| **Multiple LLMs** | Chain models: a fast model for initial draft, a reasoning model for corrections. |
| **Human-in-the-loop** | Add a queue stage that holds uncertain translations for expert review before returning. |
| **Fine-tuned model** | Replace the OpenRouter call with a local model (Ollama, vLLM, etc.). |
| **Different language** | Change the dictionary, FST, and register. The architecture stays identical. |

The pipeline is a pattern. The stages are interchangeable. Build what works for your language, prove it on the [leaderboard](/leaderboard), and deploy it.

---

## See Also

- **[Serving a Method via API](/docs/guides/serving-a-method)** — the API contract specification
- **[Plugin Specification](/docs/reference/plugin-spec)** — the method.json manifest format
- **[Support a Low-Resource Language](/docs/guides/low-resource-languages)** — the broader context and OCAP principles
- **[MT Evaluation](/docs/eval/)** — good vs. bad methods, what gets disqualified
- **[Eval Harness](/docs/eval/harness)** — how to benchmark your pipeline
- **[Method Leaderboard](/leaderboard)** — submit your scores
- **[ALTLab](https://altlab.artsrn.ualberta.ca/)** — the Alberta Language Technology Lab (Plains Cree FST)
- **[Translation Methods](/docs/guides/translation-methods)** — how each built-in method works
