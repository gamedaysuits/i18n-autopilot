---
sidebar_position: 6
title: "คู่มือ: FST-Gated Translation Pipeline"
description: "สร้าง Decomposition Pipeline พร้อม Morphological Validation จัดทำเป็น API service และเชื่อมต่อเข้ากับ rosetta"
---
# Cookbook: ไปป์ไลน์การแปลที่ควบคุมด้วย FST

สร้างไปป์ไลน์การแปลแบบหลายขั้นตอนที่แยกองค์ประกอบของข้อความต้นฉบับ, แปลผ่าน LLM, ตรวจสอบความถูกต้องของผลลัพธ์ด้วย finite-state transducer (FST) และให้บริการทั้งหมดนี้ในรูปแบบ HTTP endpoint ที่ rosetta เรียกใช้งานผ่านเมธอด `api`

**สิ่งที่คุณจะได้สร้าง:** API การแปลสำหรับภาษา Plains Cree ที่คอยดักจับคำแปลที่ไม่ถูกต้องตามหลักสัณฐานวิทยา (morphology) *ก่อน*ที่จะถูกส่งไปยังไฟล์ locale ของคุณ

:::info สิ่งที่ต้องมีเบื้องต้น
- FST binary ที่พร้อมใช้งาน (เช่น จาก [ALTLab's Plains Cree analyzer](https://github.com/UAlbertaALTLab/lang-crk))
- Node.js 20+ หรือ Python 3.10+
- API key ของ OpenRouter สำหรับขั้นตอน LLM
:::

---

## สถาปัตยกรรม

ไปป์ไลน์นี้ทำงานเป็น HTTP service แบบสแตนด์อโลน rosetta ไม่จำเป็นต้องรู้หรือสนใจว่าเกิดอะไรขึ้นภายใน — มันเพียงแค่ส่งคีย์และรับคำแปลกลับมา

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

### ทำไมต้องเป็นสถาปัตยกรรมนี้

แต่ละขั้นตอนมีหน้าที่เฉพาะเจาะจง:

| ขั้นตอน | หน้าที่ | ความสำคัญ |
|-------|-------------|---------------|
| **Decompose** | แยกสตริง UI แบบประสมออกเป็นส่วนๆ ที่สามารถแปลได้ | ภาษาแบบ Polysynthetic จะเข้ารหัสทั้งประโยคไว้ในคำเดียว — LLM จำเป็นต้องใช้หน่วยที่เล็กลง |
| **Dictionary Lookup** | ตรวจสอบพจนานุกรมสองภาษาสำหรับคำแปลที่รู้จัก | บังคับใช้คำศัพท์ที่ถูกต้องสำหรับคำที่รู้จักแทนที่จะพึ่งพาการคาดเดาของ LLM |
| **LLM Translate** | ส่งส่วนที่แยกแล้วไปยัง LLM พร้อมกับบริบทของระดับภาษา (register) และไวยากรณ์ | จัดการกับวลีใหม่ๆ และสร้างผลลัพธ์ที่สละสลวย |
| **FST Validate** | นำผลลัพธ์ไปผ่านเครื่องมือวิเคราะห์ทางสัณฐานวิทยา | ดักจับรูปแบบคำที่ไม่ถูกต้อง — หาก FST ปฏิเสธคำใด แสดงว่าคำนั้นไม่ถูกต้องตามหลักภาษา |
| **Retry** | ส่งคำที่ถูกปฏิเสธกลับไปใหม่พร้อมกับข้อเสนอแนะข้อผิดพลาดจาก FST | ให้ข้อมูลเฉพาะเจาะจงแก่ LLM ว่า*ทำไม*คำนั้นถึงผิด |

---

## การไหลของข้อมูล (Data Flow)

นี่คือสิ่งที่เกิดขึ้นกับคีย์เดียว (`"welcome": "Welcome to our app"`) เมื่อมันไหลผ่านไปป์ไลน์:

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

### เมื่อ FST ปฏิเสธ

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

## การนำไปใช้งาน (Implementation)

### ขั้นตอนที่ 1: โครงสร้างเซิร์ฟเวอร์ (Server Skeleton)

เซิร์ฟเวอร์นี้ใช้งาน [API method contract](/docs/guides/serving-a-method) ของ rosetta — ซึ่งเป็น `POST /translate` endpoint เดี่ยว

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

### ขั้นตอนที่ 2: ไปป์ไลน์

แต่ละขั้นตอนคือหนึ่งฟังก์ชัน ไปป์ไลน์จะเชื่อมต่อฟังก์ชันเหล่านี้เข้าด้วยกัน

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

### ขั้นตอนที่ 3: FST Wrapper

ห่อหุ้ม FST binary ของคุณให้เป็นฟังก์ชัน async ตัวอย่างนี้ใช้เครื่องมือวิเคราะห์ภาษา Plains Cree ที่ใช้ HFST ของ ALTLab

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

### ขั้นตอนที่ 4: โมดูล Dictionary และ LLM

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

## การเชื่อมต่อกับ rosetta

### กำหนดค่าคู่ภาษา

ชี้คู่ภาษาของคุณไปยังเซอร์วิสที่กำลังทำงานอยู่:

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

### ตั้งค่า API key

```bash
export ROSETTA_API_KEY="your-service-auth-token"
export OPENROUTER_API_KEY="sk-or-v1-..."  # for the LLM step inside the pipeline
```

### สั่งรัน

```bash
# Start the pipeline
node server.js

# In another terminal, run rosetta
npx i18n-rosetta sync
```

rosetta จะทำการ POST คีย์ภาษาอังกฤษของคุณไปยังไปป์ไลน์ จากนั้นไปป์ไลน์จะแยกองค์ประกอบ, ค้นหา, แปล, ตรวจสอบ, ลองใหม่ และส่งคืนคำแปลภาษา Cree กลับมา rosetta จะเขียนคำแปลเหล่านั้นลงใน `crk.json`

---

## การประเมินไปป์ไลน์ของคุณ

ไปป์ไลน์เดียวกันนี้สามารถนำมาประเมินผลได้ด้วย [eval harness](/docs/eval/harness) โดย harness จะใช้รูปแบบ JSON-in/JSON-out แบบเดียวกัน:

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

แฟล็ก `--fst-analyzer` จะบอกให้ harness รันการตรวจสอบ FST ในทุกๆ ผลลัพธ์ — ซึ่งเป็นการตรวจสอบแบบเดียวกับที่ไปป์ไลน์ของคุณทำ สิ่งนี้ช่วยให้คุณสามารถเปรียบเทียบคะแนนไปป์ไลน์ของคุณกับเกณฑ์มาตรฐาน (baseline) ได้

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

**พิสูจน์ให้เห็น แล้วจึงนำไปใช้** เมธอดที่คุณใช้ทดสอบประสิทธิภาพ (benchmark) ใน harness คือเมธอดเดียวกับที่ rosetta เรียกใช้งานในโปรดักชัน

---

## การแพ็กเกจเป็นปลั๊กอิน

เมื่อไปป์ไลน์ของคุณมีคะแนนบนลีดเดอร์บอร์ดแล้ว ให้แพ็กเกจมันเป็นปลั๊กอินของ rosetta เพื่อให้คนอื่นสามารถนำไปใช้งานได้:

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

ติดตั้งปลั๊กอิน:

```bash
i18n-rosetta plugin install ./crk-fst-gated-v1/
```

ตอนนี้ใครก็ตามที่มีสิทธิ์เข้าถึงเซิร์ฟเวอร์ของคุณจะสามารถใช้งานปลั๊กอินนี้ได้:

```json title="i18n-rosetta.config.json"
{
  "pairs": {
    "en:crk": { "methodPlugin": "crk-fst-gated-v1" }
  }
}
```

---

## การต่อยอดรูปแบบนี้

Cookbook นี้แสดงให้เห็นถึงสถาปัตยกรรมไปป์ไลน์รูปแบบหนึ่ง คุณสามารถนำไปปรับใช้กับภาษาหรือเมธอดใดก็ได้:

| รูปแบบที่แตกต่าง | สิ่งที่เปลี่ยนแปลง |
|-----------|-------------|
| **Different FST** | สลับพาธของ binary คุณสามารถดาวน์โหลด FST ที่คอมไพล์ไว้แล้ว (เช่น binary ของ `.hfstol` หรือ `lttoolbox`) สำหรับกว่า 100 ภาษาได้จาก [GiellaLT GitHub](https://github.com/giellalt) หรือ [Apertium GitHub](https://github.com/apertium) |
| **No FST available** | ลบขั้นตอนการทำงานของ FST ออก และใช้ [UniMorph flat paradigm files](https://huggingface.co/datasets/unimorph/universal_morphologies) จาก Hugging Face เพื่อดำเนินการตรวจสอบรูปแบบคำที่ผันแล้วด้วยการค้นหาจากฐานข้อมูลแบบคงที่ |
| **Multiple LLMs** | เชื่อมต่อโมเดลเข้าด้วยกัน: ใช้โมเดลที่ทำงานเร็วสำหรับร่างแรก และใช้โมเดลการให้เหตุผล (reasoning model) สำหรับการแก้ไข |
| **Human-in-the-loop** | เพิ่มขั้นตอนคิวเพื่อพักคำแปลที่ไม่แน่ใจไว้ให้ผู้เชี่ยวชาญตรวจสอบก่อนส่งคืนผลลัพธ์ |
| **Fine-tuned model** | แทนที่การเรียกใช้ OpenRouter ด้วยโมเดลแบบโลคัล (Ollama, vLLM ฯลฯ) |
| **Different language** | เปลี่ยนพจนานุกรม, FST และระดับภาษา (register) โดยที่สถาปัตยกรรมยังคงเหมือนเดิมทุกประการ |

ไปป์ไลน์นี้เป็นเพียงรูปแบบหนึ่ง ขั้นตอนต่างๆ สามารถสลับสับเปลี่ยนได้ สร้างสิ่งที่ใช้งานได้ดีสำหรับภาษาของคุณ พิสูจน์มันบน [leaderboard](/leaderboard) และนำไปใช้งานจริง (deploy)

---

## ดูเพิ่มเติม

- **[Serving a Method via API](/docs/guides/serving-a-method)** — ข้อกำหนดของ API contract
- **[Plugin Specification](/docs/reference/plugin-spec)** — รูปแบบ manifest ของ method.json
- **[Support a Low-Resource Language](/docs/guides/low-resource-languages)** — บริบทในภาพกว้างและหลักการ OCAP
- **[MT Evaluation](/docs/eval/)** — เมธอดที่ดีเทียบกับเมธอดที่ไม่ดี, สิ่งที่จะทำให้ถูกตัดสิทธิ์
- **[Eval Harness](/docs/eval/harness)** — วิธีทดสอบประสิทธิภาพ (benchmark) ไปป์ไลน์ของคุณ
- **[Method Leaderboard](/leaderboard)** — ส่งคะแนนของคุณ
- **[ALTLab](https://altlab.artsrn.ualberta.ca/)** — Alberta Language Technology Lab (Plains Cree FST)
- **[Translation Methods](/docs/guides/translation-methods)** — วิธีการทำงานของแต่ละเมธอดที่มีมาให้ในตัว