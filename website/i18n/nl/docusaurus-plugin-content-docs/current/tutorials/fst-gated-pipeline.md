---
sidebar_position: 6
title: "Cookbook: FST-Gated Translation Pipeline"
description: "Bouw een decomposition pipeline met morfologische validatie, verpak deze als een API-service en integreer deze in rosetta."
---
# Kookboek: FST-Gated vertaalpijplijn

Bouw een meertraps vertaalpijplijn die de brontekst ontleedt, vertaalt via een LLM, de uitvoer valideert met een finite-state transducer (FST) en het geheel aanbiedt als een HTTP-eindpunt dat rosetta aanroept via de `api`-methode.

**Wat u gaat bouwen:** Een vertaal-API voor Plains Cree die morfologisch ongeldige vertalingen onderschept *voordat* ze uw locale-bestanden bereiken.

:::info Vereisten
- Een actieve FST-binary (bijv. van [ALTLab's Plains Cree analyzer](https://github.com/UAlbertaALTLab/lang-crk))
- Node.js 20+ of Python 3.10+
- Een OpenRouter API-sleutel voor de LLM-stap
:::

---

## Architectuur

De pijplijn draait als een zelfstandige HTTP-service. rosetta weet niet en geeft er niet om wat er intern gebeurt — het verstuurt sleutels en krijgt vertalingen terug.

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

### Waarom deze architectuur

Elke fase heeft een specifieke taak:

| Fase | Wat het doet | Waarom het belangrijk is |
|-------|-------------|---------------|
| **Ontleden** | Samengestelde UI-strings opbreken in vertaalbare segmenten | Polysynthetische talen coderen hele zinnen in enkele woorden — de LLM heeft kleinere eenheden nodig |
| **Woordenboek opzoeken** | Een tweetalig woordenboek raadplegen voor bekende vertalingen | Dwingt correcte terminologie af voor bekende termen in plaats van te vertrouwen op het giswerk van de LLM |
| **LLM-vertaling** | Het segment naar een LLM sturen met register- en grammaticacontext | Verwerkt nieuwe zinsneden en genereert vloeiende uitvoer |
| **FST-validatie** | De uitvoer door een morfologische analyzer halen | Onderschept ongeldige woordvormen — als de FST een woord afwijst, is het niet geldig in de taal |
| **Opnieuw proberen** | Afgewezen woorden opnieuw versturen met de foutfeedback van de FST | Geeft de LLM specifieke informatie over *waarom* het woord onjuist was |

---

## De gegevensstroom

Dit is wat er gebeurt met een enkele sleutel (`"welcome": "Welcome to our app"`) terwijl deze door de pijplijn stroomt:

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

### Wanneer de FST afwijst

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

## Implementatie

### Stap 1: Het serverskelet

De server implementeert rosetta's [API-methodecontract](/docs/guides/serving-a-method) — een enkel `POST /translate`-eindpunt.

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

### Stap 2: De pijplijn

Elke fase is een functie. De pijplijn koppelt ze aan elkaar.

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

### Stap 3: De FST-wrapper

Verpak uw FST-binary als een asynchrone functie. Dit voorbeeld gebruikt ALTLab's op HFST gebaseerde Plains Cree analyzer.

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

### Stap 4: Woordenboek- en LLM-modules

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

## Verbinden met rosetta

### Het paar configureren

Verwijs uw talenpaar naar de draaiende service:

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

### De API-sleutel instellen

```bash
export ROSETTA_API_KEY="your-service-auth-token"
export OPENROUTER_API_KEY="sk-or-v1-..."  # for the LLM step inside the pipeline
```

### Uitvoeren

rosetta stuurt uw Engelse sleutels via een POST-verzoek naar de pijplijn. De pijplijn ontleedt, zoekt op, vertaalt, valideert, probeert opnieuw en retourneert Cree-vertalingen. rosetta schrijft deze naar `crk.json`.

---

## Uw pijplijn evalueren

Dezelfde pijplijn kan worden geëvalueerd met de [eval harness](/docs/eval/harness). De harness gebruikt hetzelfde JSON-in/JSON-out-patroon:

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

De `--fst-analyzer`-vlag vertelt de harness om FST-validatie uit te voeren op elke uitvoer — dezelfde validatie die uw pijplijn doet. Hiermee kunt u de score van uw pijplijn vergelijken met de basislijn.

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

**Bewijs het, en gebruik het dan.** De methode die u in de harness benchmarkt, is dezelfde methode die rosetta in productie aanroept.

---

## Verpakken als een plug-in

Zodra uw pijplijn leaderboard-scores heeft, verpakt u deze als een rosetta-plug-in zodat anderen deze kunnen gebruiken:

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

Installeer het:

```bash
i18n-rosetta plugin install ./crk-fst-gated-v1/
```

Nu kan iedereen met toegang tot uw server de plug-in gebruiken:

```json title="i18n-rosetta.config.json"
{
  "pairs": {
    "en:crk": { "methodPlugin": "crk-fst-gated-v1" }
  }
}
```

---

## Dit patroon uitbreiden

Dit kookboek demonstreert één pijplijnarchitectuur. U kunt deze aanpassen voor elke taal of methode:

| Variatie | Wat er verandert |
|-----------|-------------|
| **Andere FST** | Verwissel het binary-pad. U kunt voorgecompileerde FST's (zoals `.hfstol` of `lttoolbox` binaries) voor meer dan 100 talen downloaden van de [GiellaLT GitHub](https://github.com/giellalt) of [Apertium GitHub](https://github.com/apertium). |
| **Geen FST beschikbaar** | Verwijder de FST-uitvoeringsfase en gebruik [UniMorph flat paradigm files](https://huggingface.co/datasets/unimorph/universal_morphologies) van Hugging Face om statische database-lookup-validatie van verbogen vormen uit te voeren. |
| **Meerdere LLM's** | Koppel modellen aan elkaar: een snel model voor de eerste opzet, een redeneermodel voor correcties. |
| **Human-in-the-loop** | Voeg een wachtrij-fase toe die onzekere vertalingen vasthoudt voor beoordeling door een expert voordat ze worden geretourneerd. |
| **Gefinetuned model** | Vervang de OpenRouter-aanroep door een lokaal model (Ollama, vLLM, enz.). |
| **Andere taal** | Wijzig het woordenboek, de FST en het register. De architectuur blijft identiek. |

De pijplijn is een patroon. De fasen zijn uitwisselbaar. Bouw wat werkt voor uw taal, bewijs het op het [leaderboard](/leaderboard) en implementeer het.

---

## Zie ook

- **[Een methode aanbieden via API](/docs/guides/serving-a-method)** — de specificatie van het API-contract
- **[Plug-inspecificatie](/docs/reference/plugin-spec)** — het method.json-manifestformaat
- **[Een bronschaarse taal ondersteunen](/docs/guides/low-resource-languages)** — de bredere context en OCAP-principes
- **[MT-evaluatie](/docs/eval/)** — goede versus slechte methoden, wat wordt gediskwalificeerd
- **[Eval Harness](/docs/eval/harness)** — hoe u uw pijplijn kunt benchmarken
- **[Methode-leaderboard](/leaderboard)** — dien uw scores in
- **[ALTLab](https://altlab.artsrn.ualberta.ca/)** — het Alberta Language Technology Lab (Plains Cree FST)
- **[Vertaalmethoden](/docs/guides/translation-methods)** — hoe elke ingebouwde methode werkt