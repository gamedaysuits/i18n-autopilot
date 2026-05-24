---
sidebar_position: 6
title: "Cookbook: FST-Gated Translation Pipeline"
description: "Bumuo ng decomposition pipeline na may morphological validation, i-wrap ito bilang API service, at i-plug ito sa rosetta."
---
# Cookbook: FST-Gated Translation Pipeline

Bumuo ng multi-stage translation pipeline na nagde-decompose ng source text, nagta-translate via LLM, nagva-validate ng outputs gamit ang finite-state transducer (FST), at nagse-serve ng buong setup bilang isang HTTP endpoint na tinatawag ng rosetta via the `api` method.

**Ang bubuuin niyo po:** Isang translation API para sa Plains Cree na sumasalo ng morphologically invalid translations *bago* pa man ito makarating sa inyong locale files.

:::info Mga Prerequisite
- Isang running FST binary (halimbawa, mula sa [Plains Cree analyzer ng ALTLab](https://github.com/UAlbertaALTLab/lang-crk))
- Node.js 20+ o Python 3.10+
- Isang OpenRouter API key para sa LLM step
:::

---

## Architecture

Tumatakbo ang pipeline bilang isang standalone HTTP service. Hindi alam o hindi na kailangang intindihin ng rosetta kung ano ang nangyayari sa loob — nagse-send lang ito ng keys, at nakakakuha ng translations pabalik.

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

### Bakit Ganito ang Architecture

May tiyak na trabaho ang bawat stage:

| Stage | Ano ang Ginagawa Nito | Bakit Ito Mahalaga |
|-------|-------------|---------------|
| **Decompose** | Hinihimay ang compound UI strings sa mga translatable segment | Ang mga polysynthetic language ay nag-e-encode ng buong sentences sa iisang salita — kailangan ng LLM ng mas maliliit na unit |
| **Dictionary Lookup** | Nagche-check sa isang bilingual dictionary para sa mga kilalang translation | Pinipilit ang tamang terminology para sa mga kilalang terms imbes na umasa sa hula ng LLM |
| **LLM Translate** | Ise-send ang segment sa isang LLM na may kasamang register at grammar context | Nagha-handle ng novel phrases at nagge-generate ng fluent na output |
| **FST Validate** | Pinapadaan ang output sa isang morphological analyzer | Sumasalo ng invalid word forms — kung i-reject ng FST ang isang salita, hindi ito valid sa nasabing wika |
| **Retry** | Ise-send ulit ang mga na-reject na salita kasama ang error feedback ng FST | Binibigyan ang LLM ng specific na impormasyon kung *bakit* mali ang salita |

---

## Ang Data Flow

Heto po ang nangyayari sa isang single key (`"welcome": "Welcome to our app"`) habang dumadaan ito sa pipeline:

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

### Kapag Nag-reject ang FST

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

### Step 1: Ang Server Skeleton

Ini-implement ng server ang [API method contract](/docs/guides/serving-a-method) ng rosetta — isang single na `POST /translate` endpoint.

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

### Step 2: Ang Pipeline

Ang bawat stage ay isang function. Naka-chain sila nang magkakasama sa pipeline.

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

### Step 3: Ang FST Wrapper

I-wrap ang inyong FST binary bilang isang async function. Gumagamit ang example na ito ng HFST-based Plains Cree analyzer ng ALTLab.

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

### Step 4: Dictionary at LLM Modules

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

## Pag-connect sa rosetta

### I-configure ang pair

I-point ang inyong language pair sa running service:

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

### I-set ang API key

```bash
export ROSETTA_API_KEY="your-service-auth-token"
export OPENROUTER_API_KEY="sk-or-v1-..."  # for the LLM step inside the pipeline
```

### I-run ito

```bash
# Start the pipeline
node server.js

# In another terminal, run rosetta
npx i18n-rosetta sync
```

Mag-po-POST ang rosetta ng inyong English keys sa pipeline. Ang pipeline ay magde-decompose, maglu-look up, magta-translate, magva-validate, magre-retry, at magbabalik ng Cree translations. Isusulat naman ito ng rosetta sa `crk.json`.

---

## Pag-evaluate sa Inyong Pipeline

Pwede ring i-evaluate ang parehong pipeline gamit ang [eval harness](/docs/eval/harness). Gumagamit ang harness ng parehong JSON-in/JSON-out pattern:

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

Sinasabi ng `--fst-analyzer` flag sa harness na mag-run ng FST validation sa bawat output — ang parehong validation na ginagawa ng inyong pipeline. Hinahayaan kayo nitong i-compare ang score ng inyong pipeline laban sa baseline.

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

**Patunayan ito, bago gamitin.** Ang method na ibe-benchmark niyo sa harness ay ang parehong method na tinatawag ng rosetta sa production.

---

## Pag-package bilang isang Plugin

Kapag may leaderboard scores na ang inyong pipeline, i-package ito bilang isang rosetta plugin para magamit din ng iba:

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

I-install ito:

```bash
i18n-rosetta plugin install ./crk-fst-gated-v1/
```

Ngayon, kahit sino na may access sa inyong server ay pwede nang gumamit ng plugin:

```json title="i18n-rosetta.config.json"
{
  "pairs": {
    "en:crk": { "methodPlugin": "crk-fst-gated-v1" }
  }
}
```

---

## Pag-extend sa Pattern na Ito

Nagde-demonstrate ang cookbook na ito ng isang pipeline architecture. Pwede niyo itong i-adapt para sa kahit anong wika o method:

| Variation | Ano ang Nagbabago |
|-----------|-------------|
| **Ibang FST** | I-swap ang binary path. Pwede kayong mag-download ng precompiled FSTs (tulad ng `.hfstol` o `lttoolbox` binaries) para sa mahigit 100 wika mula sa [GiellaLT GitHub](https://github.com/giellalt) o [Apertium GitHub](https://github.com/apertium). |
| **Walang available na FST** | Tanggalin ang FST execution stage at gumamit ng [UniMorph flat paradigm files](https://huggingface.co/datasets/unimorph/universal_morphologies) mula sa Hugging Face para mag-perform ng static database lookup validation ng inflected forms. |
| **Multiple LLMs** | I-chain ang mga model: isang mabilis na model para sa initial draft, isang reasoning model para sa mga correction. |
| **Human-in-the-loop** | Magdagdag ng queue stage na nagho-hold ng uncertain translations para sa expert review bago ito i-return. |
| **Fine-tuned model** | Palitan ang OpenRouter call ng isang local model (Ollama, vLLM, atbp.). |
| **Ibang wika** | Palitan ang dictionary, FST, at register. Mananatiling identical ang architecture. |

Ang pipeline ay isang pattern. Interchangeable ang mga stage. Bumuo ng kung ano ang gagana para sa inyong wika, patunayan ito sa [leaderboard](/leaderboard), at i-deploy ito.

---

## Tingnan Din

- **[Serving a Method via API](/docs/guides/serving-a-method)** — ang API contract specification
- **[Plugin Specification](/docs/reference/plugin-spec)** — ang method.json manifest format
- **[Support a Low-Resource Language](/docs/guides/low-resource-languages)** — ang mas malawak na context at mga OCAP principle
- **[MT Evaluation](/docs/eval/)** — good vs. bad methods, kung ano ang nade-disqualify
- **[Eval Harness](/docs/eval/harness)** — kung paano i-benchmark ang inyong pipeline
- **[Method Leaderboard](/leaderboard)** — i-submit ang inyong scores
- **[ALTLab](https://altlab.artsrn.ualberta.ca/)** — ang Alberta Language Technology Lab (Plains Cree FST)
- **[Translation Methods](/docs/guides/translation-methods)** — kung paano gumagana ang bawat built-in method