---
sidebar_position: 3
title: "การตั้งค่า"
---
# การตั้งค่า

Rosetta สามารถทำงานได้โดยไม่ต้องตั้งค่า (zero-config) — โดยจะตรวจหาไฟล์ภาษา รูปแบบ และภาษาเป้าหมายจากโปรเจกต์ของคุณโดยอัตโนมัติ หากต้องการควบคุมเพิ่มเติม ให้สร้าง `i18n-rosetta.config.json` ใน root ของโปรเจกต์คุณ หรือรันคำสั่ง:

```bash
npx i18n-rosetta init
```

## ข้อมูลอ้างอิงการตั้งค่าแบบเต็ม

```json title="i18n-rosetta.config.json"
{
  "version": 3,
  "inputLocale": "en",
  "localesDir": "./locales",
  "contentDir": null,
  "translatableFields": null,
  "format": "auto",
  "model": "google/gemini-3.5-flash",
  "defaultMethod": "llm",
  "batchSize": 80,
  "jsonConcurrency": 50,
  "contentConcurrency": 12,
  "fallbackPrefix": "[EN] ",
  "apiKeyEnvVar": "OPENROUTER_API_KEY",
  "baseUrl": "",
  "pairs": {},
  "languages": {},
  "lint": {
    "srcDir": null,
    "ignore": ["node_modules", ".next", "dist"],
    "minLength": 2
  },
  "seo": {
    "urlPattern": "/:locale/:path",
    "pages": null
  },
  "typegen": {
    "output": null,
    "autoGenerate": false
  }
}
```

:::note typegen ยังไม่เปิดให้ใช้งาน
บล็อกการตั้งค่า `typegen` จะถูกจดจำและเก็บรักษาไว้โดยตัวโหลดการตั้งค่า แต่การสร้าง type ของ TypeScript ยังไม่เปิดให้ใช้งาน นี่เป็นเพียง placeholder สำหรับฟีเจอร์ที่มีแผนจะทำในอนาคต การตั้งค่าค่าเหล่านี้จะไม่มีผลใดๆ
:::


### ฟิลด์

| ฟิลด์ | ประเภท | ค่าเริ่มต้น | คำอธิบาย |
|-------|------|---------|-------------|
| `version` | `number` | `3` | เวอร์ชันของ Config schema จะเป็น `3` เสมอ |
| `inputLocale` | `string` | `"en"` | รหัสภาษาต้นทาง (BCP 47) |
| `localesDir` | `string` | `"./locales"` | Path ไปยังไฟล์ภาษา Rosetta จะสแกนไดเรกทอรีนี้ |
| `contentDir` | `string` | `null` | ไดเรกทอรีเนื้อหาของ Hugo เปิดใช้งานการแปลเนื้อหา Markdown |
| `translatableFields` | `string[]` | `null` | เขียนทับฟิลด์ frontmatter เริ่มต้นที่สามารถแปลได้สำหรับการแปลเนื้อหา `null` จะใช้ค่าเริ่มต้นที่มีให้ (`title`, `description`, `summary`) |
| `format` | `string` | `"auto"` | รูปแบบไฟล์: `json`, `toml`, `yaml`, หรือ `auto` (ตรวจหาจากนามสกุลไฟล์) |
| `model` | `string` | `"google/gemini-3.5-flash"` | โมเดลเริ่มต้นสำหรับวิธี LLM รูปแบบจะขึ้นอยู่กับวิธีที่ใช้: OpenRouter ใช้ `provider/model` (เช่น `google/gemini-3.5-flash`); ผู้ให้บริการโดยตรงจะใช้ชื่อเปล่าๆ (เช่น `gpt-4o`, `gemini-2.5-flash`) |
| `defaultMethod` | `string` | `"llm"` | วิธีการแปลเริ่มต้น: `llm`, `llm-coached`, `google-translate`, `deepl`, `microsoft-translator`, `libretranslate`, `openai`, `anthropic`, `gemini`, `api` จะถูกเขียนทับด้วยแฟล็ก CLI `--method` |
| `batchSize` | `number` | `80` | จำนวน Key ต่อการแปลหนึ่งชุด (batch) ค่าที่สูงขึ้น = เรียกใช้ API น้อยลง แต่ prompt จะมีขนาดใหญ่ขึ้น |
| `jsonConcurrency` | `number` | `50` | จำนวนการแปลภาษาแบบขนานสูงสุดสำหรับการซิงค์ Key ของ JSON จะถูกเขียนทับด้วยแฟล็ก CLI `--json-concurrency` |
| `contentConcurrency` | `number` | `12` | จำนวนการเรียก API แบบขนานสูงสุดสำหรับการแปลเนื้อหา (Markdown/MDX) จะถูกเขียนทับด้วยแฟล็ก CLI `--content-concurrency` |
| `fallbackPrefix` | `string` | `"[EN] "` | คำนำหน้า Marker ที่ใช้โดย `audit` และ `verify` เพื่อตรวจหาค่าเดิมที่ยังไม่ได้แปลจากการรันครั้งก่อนหน้า Rosetta จะไม่เขียนคำนำหน้านี้ — มันจะอ่านเพื่อการตรวจหาเท่านั้น |
| `apiKeyEnvVar` | `string` | `"OPENROUTER_API_KEY"` | ชื่อตัวแปรสภาพแวดล้อม (Environment variable) สำหรับ API key เขียนทับสำหรับชื่อ env var แบบกำหนดเอง |
| `baseUrl` | `string` | `""` | Base URL สำหรับการสร้าง SEO artifact (hreflang, sitemaps, JSON-LD) |
| `pairs` | `object` | `{}` | การเขียนทับวิธี โมเดล และคุณภาพต่อคู่ภาษา ดูที่ [การตั้งค่าคู่ภาษา](#pair-configuration) |
| `languages` | `object` | `{}` | การเขียนทับต่อภาษา ดูที่ [การตั้งค่าภาษา](#language-configuration) |
| `lint.srcDir` | `string` | `null` | ไดเรกทอรีต้นทางสำหรับการสแกน lint `null` = ตรวจหาอัตโนมัติจากเฟรมเวิร์ก |
| `lint.ignore` | `string[]` | `["node_modules", ...]` | รูปแบบ Glob ที่จะยกเว้นจาก lint |
| `lint.minLength` | `number` | `2` | ความยาวสตริงขั้นต่ำที่จะถูกตั้งค่าสถานะว่าเป็น hardcoded |
| `seo.urlPattern` | `string` | `"/:locale/:path"` | เทมเพลตรูปแบบ URL สำหรับการสร้างแท็ก hreflang |
| `seo.pages` | `string[]` | `null` | รายการหน้าแบบระบุชัดเจนสำหรับ SEO `null` = ตรวจหาอัตโนมัติจาก locale keys |
| `typegen.output` | `string` | `null` | Path ผลลัพธ์สำหรับ TypeScript types ที่สร้างขึ้น `null` = ปิดใช้งาน |
| `typegen.autoGenerate` | `boolean` | `false` | สร้าง types ใหม่โดยอัตโนมัติหลังจากการซิงค์แต่ละครั้ง |

## การตั้งค่าคู่ภาษา

แต่ละคู่ภาษา ต้นทาง→เป้าหมาย สามารถตั้งค่าแยกกันได้อย่างอิสระ:

```json
{
  "pairs": {
    "en:fr": {
      "method": "google-translate",
      "qualityTier": "high"
    },
    "en:ja": {
      "method": "llm",
      "model": "google/gemini-2.5-pro"
    },
    "en:crk": {
      "methodPlugin": "crk-coached-v1"
    }
  }
}
```

### ฟิลด์ของคู่ภาษา

| ฟิลด์ | ประเภท | คำอธิบาย |
|-------|------|-------------|
| `method` | `string` | วิธีการแปล: `llm`, `llm-coached`, `google-translate`, `deepl`, `microsoft-translator`, `libretranslate`, `openai`, `anthropic`, `gemini`, `api` |
| `methodPlugin` | `string` | ชื่อของปลั๊กอินที่ติดตั้ง (จาก `.rosetta/methods/`) |
| `model` | `string` | เขียนทับโมเดลเริ่มต้นสำหรับคู่ภาษานี้ |
| `endpoint` | `string` | URL ของ Remote API endpoint จำเป็นต้องระบุเมื่อ `method` เป็น `api` |
| `qualityTier` | `string` | ระดับการแสดงผล: `standard`, `high`, `research`, `verified` |

## การตั้งค่าภาษา

ภาษารองรับ 3 รูปแบบ:

### Array ของรหัสภาษา (ง่ายที่สุด)

```json
{
  "languages": ["fr", "de", "ja"]
}
```

แต่ละภาษาจะได้รับ register เริ่มต้นจากตาราง register ที่มีมาให้ ภาษาที่ไม่มีค่าเริ่มต้นจะได้รับ `"Professional register."`

### Object พร้อมสตริงของ register

ค่าสามารถเป็น **preset key** จากการ์ดของภาษา หรือข้อความ register แบบกำหนดเอง:

```json
{
  "languages": {
    "fr": "casual-tu",
    "ko": "formal-hapsyo",
    "ja": "Custom: Polite Japanese for a gaming app."
  }
}
```

Rosetta จะตรวจสอบว่าสตริงตรงกับ preset key ในการ์ดภาษาหรือไม่ หากตรงกัน จะใช้ prompt ของ register แบบเต็มจากการ์ดนั้น หากไม่ตรงกัน จะใช้สตริงนั้นตามที่ระบุไว้ ดู [ภาษาที่รองรับ](/docs/reference/supported-languages#language-cards) สำหรับ preset ที่มีให้ใช้งาน

### Object พร้อมการตั้งค่าแบบเต็ม

```json
{
  "languages": {
    "crk": {
      "name": "Plains Cree",
      "register": "SRO syllabics with grammatical precision.",
      "model": "google/gemini-2.5-pro",
      "batchSize": 5,
      "maxRetries": 5,
      "script": "cans"
    }
  }
}
```

คุณสามารถผสมรูปแบบย่อและ object แบบเต็มในบล็อกเดียวกันได้


### ฟิลด์ของภาษา

| ฟิลด์ | ประเภท | คำอธิบาย |
|-------|------|-------------|
| `register` | `string` | คำแนะนำสไตล์/โทนเสียง สามารถเป็น **preset key** (เช่น `casual-tu`, `formal-hapsyo`) หรือข้อความกำหนดเอง ดู [การ์ดภาษา](/docs/reference/supported-languages#language-cards) |
| `name` | `string` | ชื่อภาษาที่มนุษย์อ่านได้ (สำหรับการแสดงสถานะ) |
| `model` | `string` | เขียนทับโมเดลเริ่มต้น |
| `batchSize` | `number` | เขียนทับขนาด batch เริ่มต้น |
| `maxRetries` | `number` | จำนวนครั้งสูงสุดในการลองใหม่สำหรับ batch ที่ล้มเหลว (ค่าเริ่มต้น: 3) |
| `script` | `string` | รหัสสคริปต์ ISO 15924 กระตุ้นการตรวจสอบสคริปต์ใน quality gate |

:::info ลำดับการสืบทอด (Inheritance chain)
การตั้งค่าจะถูกประมวลผลตามลำดับนี้ (อันแรกชนะ):

**ระดับคู่ภาษา (pair-level)** → **ระดับภาษา (language-level)** → **การตั้งค่าส่วนกลาง (global config)** → **ค่าเริ่มต้น (defaults)**

ตัวอย่างเช่น หาก `pairs["en:fr"]` ตั้งค่า `model` มันจะเขียนทับค่า `model` ทั้งในระดับภาษาและส่วนกลาง
:::

## ภาษาต้นทางที่ไม่ใช่ภาษาอังกฤษ

หากภาษาต้นทางของคุณไม่ใช่ภาษาอังกฤษ:

```bash
# CLI flag (one-time)
npx i18n-rosetta sync --source fr
```

```json title="i18n-rosetta.config.json (permanent)"
{
  "inputLocale": "fr"
}
```

## Lock File

Rosetta จะสร้าง `.i18n-rosetta.lock` เพื่อติดตาม SHA-256 hashes ของค่าต้นทางที่ถูกแปลแล้ว **ให้ Commit ไฟล์นี้** เพื่อให้นักพัฒนาทุกคนแชร์ baseline การแปลเดียวกัน

เมื่อค่าต้นทางเปลี่ยนไป hash จะไม่ตรงกันอีกต่อไป และ rosetta จะแปล key นั้นใหม่ในการซิงค์ครั้งถัดไป

## `.rosettaignore`

สร้าง `.rosettaignore` ใน root ของโปรเจกต์คุณเพื่อยกเว้นไฟล์จากการสแกน `lint` โดยใช้รูปแบบ glob เช่น `.gitignore`:

```text title=".rosettaignore"
src/components/legacy/**
src/utils/constants.js
**/*.test.js
```

## ไดเรกทอรี `.rosetta/`

Rosetta จะสร้างไดเรกทอรี `.rosetta/` ใน root ของโปรเจกต์คุณสำหรับสถานะภายใน โดยทั่วไปคุณควร **เพิ่มสิ่งนี้ลงใน `.gitignore`** — เนื่องจากเป็นการปรับแต่งภายในเครื่อง (local optimization) ไม่ใช่ซอร์สโค้ดของโปรเจกต์:

```gitignore
.rosetta/
```

| ไฟล์ | วัตถุประสงค์ | Commit หรือไม่? |
|------|---------|--------|
| `tm.json` | แคช Translation Memory — เก็บการแปลก่อนหน้าโดยใช้ข้อความต้นทาง + ภาษา + วิธีการ เป็น key | ไม่ (แคชในเครื่อง) |
| `xliff/*.xliff` | ไฟล์ส่งออก XLIFF สำหรับให้นักแปลมืออาชีพตรวจสอบ | ไม่ (ชั่วคราว) |
| `methods/` | Manifest ของปลั๊กอินวิธีการที่ติดตั้งไว้ | ใช่ (การตั้งค่าที่แชร์ร่วมกัน) |
| `backups/` | ไฟล์สำรองก่อนการห่อ (สร้างโดย `wrap --undo`) | ไม่ (เพื่อความปลอดภัย) |

ดู [Translation Memory](/docs/concepts/translation-memory) สำหรับรายละเอียดเกี่ยวกับ `tm.json` และวิธีที่มันช่วยประหยัดค่าใช้จ่าย API

---

## Programmatic API

สำหรับสคริปต์การบิลด์และการผสานการทำงานแบบกำหนดเอง ให้ import โดยตรงจากแพ็กเกจ:

```javascript
import { GeminiMethod, runSync, resolveConfig } from 'i18n-rosetta';

// Use a method class directly
const gemini = new GeminiMethod();
const result = await gemini.translate(
  ['greeting', 'farewell'],
  { greeting: 'Hello', farewell: 'Goodbye' },
  { target: 'fr', name: 'French', register: 'formal', model: 'gemini-2.5-flash' },
  { cwd: process.cwd() }
);
// result = { greeting: 'Bonjour', farewell: 'Au revoir' }
```

### Export ที่มีให้ใช้งาน

| Export | หน้าที่การทำงาน |
|--------|-------------|
| `TranslationMethod` | Base class สำหรับทุกวิธีการ |
| `LLMMethod` | Base class สำหรับวิธีการ LLM (OpenRouter) |
| `DirectLLMMethod` | Base class สำหรับผู้ให้บริการ LLM โดยตรง (OpenAI, Anthropic, Gemini) |
| `OpenAIMethod`, `AnthropicMethod`, `GeminiMethod` | Class ของผู้ให้บริการ LLM โดยตรง |
| `DeepLMethod`, `MicrosoftTranslatorMethod`, `LibreTranslateMethod` | Class ของ MT แบบดั้งเดิม |
| `GoogleTranslateMethod` | Google Cloud Translation |
| `LLMCoachedMethod` | Coached LLM (OpenRouter + ข้อมูล coaching) |
| `APIMethod` | ไคลเอนต์ Remote API |
| `runSync`, `runContentSync` | ไปป์ไลน์การซิงค์แบบเต็ม |
| `resolveConfig`, `resolvePairs` | การประมวลผลการตั้งค่า |
| `validateTranslations` | Quality gate |
| `loadCoachingData`, `findDictionaryMatches` | ยูทิลิตี้สำหรับ Coaching |

### การขยายผู้ให้บริการแบบกำหนดเอง (Custom Provider Extension)

ขยาย `DirectLLMMethod` เพื่อเพิ่มผู้ให้บริการ LLM รายใหม่ในความยาวประมาณ 40 บรรทัด:

```javascript
import { DirectLLMMethod } from 'i18n-rosetta';

class MistralMethod extends DirectLLMMethod {
  constructor(options) {
    super(options);
    this.name = 'mistral';
  }
  _getApiKeyEnvVar()     { return 'MISTRAL_API_KEY'; }
  _getApiKeyOptionsKey() { return 'mistralApiKey'; }
  _getDefaultModel()     { return 'mistral-large-latest'; }
  _getProviderLabel()    { return 'Mistral'; }

  _buildApiRequest({ prompt, systemMessage, apiKey, model, temperature }) {
    return {
      url: 'https://api.mistral.ai/v1/chat/completions',
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: {
        model,
        messages: [
          ...(systemMessage ? [{ role: 'system', content: systemMessage }] : []),
          { role: 'user', content: prompt },
        ],
        temperature,
      },
    };
  }

  _extractResponseText(json) {
    return json.choices?.[0]?.message?.content;
  }

  // Optional but recommended: provider-specific setup help when translation fails
  getSetupHelp() {
    if (!process.env.MISTRAL_API_KEY) {
      return [
        '',
        '  ┌─ Missing API Key ─────────────────────────────────────────────┐',
        '  │ Mistral requires an API key from https://console.mistral.ai   │',
        '  │ Run: export MISTRAL_API_KEY=...                               │',
        '  └────────────────────────────────────────────────────────────────┘',
      ];
    }
    return ['        API key is set but translation failed. Check your Mistral dashboard.'];
  }
}
```

คุณจะได้รับการแปล, coaching, retry loops, การตรวจสอบโมเดล, ระดับคุณภาพ และความช่วยเหลือในการตั้งค่าให้ใช้งานได้ฟรี มีเพียงรูปแบบของ HTTP request เท่านั้นที่เจาะจงตามผู้ให้บริการ สำหรับอแดปเตอร์ที่ไม่ใช่ LLM ซึ่งใช้ `fetch()` แบบดิบ ให้ใช้ตัวช่วย `fetchWithRetry()` ที่แชร์ร่วมกันจาก `lib/methods/fetch-with-retry.js` แทนการเขียน retry loop ของคุณเอง

---

## ดูเพิ่มเติม

- [ข้อมูลอ้างอิง CLI](/docs/reference/cli) — คำสั่งและแฟล็กทั้งหมด
- [วิธีการแปล](/docs/guides/translation-methods) — การเลือกและการผสมผสานวิธีการ
- [Translation Memory](/docs/concepts/translation-memory) — การแคชและการประหยัดค่าใช้จ่าย
- [การทำงานร่วมกับนักแปลมืออาชีพ](/docs/guides/professional-translators) — เวิร์กโฟลว์ XLIFF
- [ข้อกำหนดของปลั๊กอิน](/docs/reference/plugin-spec) — รูปแบบ manifest ของปลั๊กอินวิธีการ
- [สถาปัตยกรรม](/docs/concepts/architecture) — วิธีที่ส่วนต่างๆ เชื่อมต่อกัน
- [ภาษาที่รองรับ](/docs/reference/supported-languages) — การรองรับภาษาที่มีมาให้
- [การซิงค์ทำงานอย่างไร](/docs/concepts/how-sync-works) — ไปป์ไลน์การแปล