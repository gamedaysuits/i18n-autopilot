---
sidebar_position: 3
title: "การตั้งค่า"
---
# การกำหนดค่า

Rosetta สามารถทำงานได้โดยไม่ต้องกำหนดค่า (zero-config) — ระบบจะตรวจหาไฟล์ภาษา (locale), รูปแบบไฟล์ และภาษาปลายทางจากโปรเจกต์ของคุณโดยอัตโนมัติ หากต้องการควบคุมเพิ่มเติม ให้สร้าง `i18n-rosetta.config.json` ใน root ของโปรเจกต์คุณ หรือรันคำสั่ง:

```bash
npx i18n-rosetta init
```

## ข้อมูลอ้างอิงการกำหนดค่าแบบเต็ม

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
  "jsonConcurrency": 200,
  "contentConcurrency": 48,
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
บล็อกการกำหนดค่า `typegen` จะถูกจดจำและเก็บรักษาไว้โดยตัวโหลดการกำหนดค่า แต่การสร้าง Type ของ TypeScript ยังไม่เปิดให้ใช้งาน นี่เป็นเพียง placeholder สำหรับฟีเจอร์ที่มีแผนจะทำในอนาคต การตั้งค่าเหล่านี้จะไม่มีผลใดๆ
:::


### ฟิลด์ (Fields)

| ฟิลด์ | ประเภท | ค่าเริ่มต้น | คำอธิบาย |
|-------|------|---------|-------------|
| `version` | `number` | `3` | เวอร์ชันของ Schema การกำหนดค่า จะเป็น `3` เสมอ |
| `inputLocale` | `string` | `"en"` | รหัสภาษาต้นทาง (BCP 47) |
| `localesDir` | `string` | `"./locales"` | Path ไปยังไฟล์ภาษา Rosetta จะสแกนไดเรกทอรีนี้ |
| `contentDir` | `string` | `null` | ไดเรกทอรีเนื้อหาของ Hugo เปิดใช้งานการแปลเนื้อหา Markdown |
| `translatableFields` | `string[]` | `null` | เขียนทับฟิลด์ frontmatter เริ่มต้นที่สามารถแปลได้สำหรับการแปลเนื้อหา `null` จะใช้ค่าเริ่มต้นที่มีให้ (`title`, `description`, `summary`) |
| `format` | `string` | `"auto"` | รูปแบบไฟล์: `json`, `toml`, `yaml`, หรือ `auto` (ตรวจหาจากนามสกุลไฟล์) |
| `model` | `string` | `"google/gemini-3.5-flash"` | โมเดลเริ่มต้นสำหรับวิธี LLM รูปแบบจะขึ้นอยู่กับวิธีที่ใช้: OpenRouter จะใช้ `provider/model` (เช่น `google/gemini-3.5-flash`); ผู้ให้บริการโดยตรงจะใช้ชื่อแบบสั้น (เช่น `gpt-4o`, `gemini-2.5-flash`) |
| `defaultMethod` | `string` | `"llm"` | วิธีการแปลเริ่มต้น: `llm`, `llm-coached`, `google-translate`, `deepl`, `microsoft-translator`, `libretranslate`, `openai`, `anthropic`, `gemini`, `api` จะถูกเขียนทับด้วยแฟล็ก CLI `--method` |
| `batchSize` | `number` | `80` | จำนวน Key ต่อการแปลหนึ่งชุด (batch) ค่าที่สูงกว่า = เรียกใช้ API น้อยลง แต่ prompt จะมีขนาดใหญ่ขึ้น |
| `jsonConcurrency` | `number` | `200` | จำนวนการแปลภาษาคู่ขนานสูงสุดสำหรับการซิงค์ JSON key จะถูกเขียนทับด้วยแฟล็ก CLI `--json-concurrency` |
| `contentConcurrency` | `number` | `48` | จำนวนการเรียก API คู่ขนานสูงสุดสำหรับการแปลเนื้อหา (Markdown/MDX) จะถูกเขียนทับด้วยแฟล็ก CLI `--content-concurrency` |
| `fallbackPrefix` | `string` | `"[EN] "` | คำนำหน้า Marker ที่ใช้โดย `audit` และ `verify` เพื่อตรวจหาค่าดั้งเดิมที่ยังไม่ได้แปลจากการรันครั้งก่อนหน้า Rosetta จะไม่เขียนคำนำหน้านี้ — ระบบจะอ่านเพื่อการตรวจหาเท่านั้น |
| `apiKeyEnvVar` | `string` | `"OPENROUTER_API_KEY"` | ชื่อตัวแปรสภาพแวดล้อม (Environment variable) สำหรับ API key เขียนทับเพื่อกำหนดชื่อตัวแปรสภาพแวดล้อมแบบกำหนดเอง |
| `baseUrl` | `string` | `""` | Base URL สำหรับการสร้าง SEO artifact (hreflang, sitemaps, JSON-LD) |
| `pairs` | `object` | `{}` | การเขียนทับวิธี, โมเดล และคุณภาพต่อคู่ภาษา ดูที่ [การกำหนดค่าคู่ภาษา](#pair-configuration) |
| `languages` | `object` | `{}` | การเขียนทับต่อภาษา ดูที่ [การกำหนดค่าภาษา](#language-configuration) |
| `lint.srcDir` | `string` | `null` | ไดเรกทอรีต้นทางสำหรับการสแกน lint `null` = ตรวจหาอัตโนมัติจากเฟรมเวิร์ก |
| `lint.ignore` | `string[]` | `["node_modules", ...]` | รูปแบบ Glob ที่ต้องการยกเว้นจาก lint |
| `lint.minLength` | `number` | `2` | ความยาวสตริงขั้นต่ำที่จะถูกตั้งค่าสถานะว่าเป็น hardcoded |
| `seo.urlPattern` | `string` | `"/:locale/:path"` | เทมเพลตรูปแบบ URL สำหรับการสร้างแท็ก hreflang |
| `seo.pages` | `string[]` | `null` | รายการหน้าแบบเจาะจงสำหรับ SEO `null` = ตรวจหาอัตโนมัติจาก locale keys |
| `typegen.output` | `string` | `null` | Path ผลลัพธ์สำหรับ Type ของ TypeScript ที่สร้างขึ้น `null` = ปิดใช้งาน |
| `typegen.autoGenerate` | `boolean` | `false` | สร้าง Type ใหม่โดยอัตโนมัติหลังจากการซิงค์แต่ละครั้ง |

## การกำหนดค่าคู่ภาษา

แต่ละคู่ภาษา ต้นทาง→ปลายทาง สามารถกำหนดค่าแยกกันได้อย่างอิสระ:

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

## การกำหนดค่าภาษา

ภาษาสามารถรองรับได้ 3 รูปแบบ:

### อาร์เรย์ของรหัสภาษา (ง่ายที่สุด)

```json
{
  "languages": ["fr", "de", "ja"]
}
```

แต่ละภาษาจะได้รับระดับภาษา (register) เริ่มต้นจากตารางระดับภาษาที่มีให้ในระบบ ภาษาที่ไม่มีค่าเริ่มต้นจะได้รับ `"Professional register."`

### ออบเจ็กต์พร้อมสตริงระดับภาษา

ค่าสามารถเป็น **preset key** จากการ์ดภาษา หรือข้อความระดับภาษาแบบกำหนดเอง:

```json
{
  "languages": {
    "fr": "casual-tu",
    "ko": "formal-hapsyo",
    "ja": "Custom: Polite Japanese for a gaming app."
  }
}
```

Rosetta จะตรวจสอบว่าสตริงตรงกับ preset key ในการ์ดภาษาหรือไม่ หากตรงกัน ระบบจะใช้ prompt ระดับภาษาแบบเต็มจากการ์ดนั้น หากไม่ตรงกัน ระบบจะใช้สตริงนั้นตามที่ระบุ ดู [ภาษาที่รองรับ](/docs/reference/supported-languages#language-cards) สำหรับพรีเซ็ตที่มีให้ใช้งาน

### ออบเจ็กต์พร้อมการกำหนดค่าแบบเต็ม

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

คุณสามารถผสมรูปแบบย่อและออบเจ็กต์แบบเต็มในบล็อกเดียวกันได้


### ฟิลด์ของภาษา

| ฟิลด์ | ประเภท | คำอธิบาย |
|-------|------|-------------|
| `register` | `string` | คำแนะนำเกี่ยวกับสไตล์/น้ำเสียง สามารถเป็น **preset key** (เช่น `casual-tu`, `formal-hapsyo`) หรือข้อความแบบกำหนดเอง ดู [การ์ดภาษา](/docs/reference/supported-languages#language-cards) |
| `name` | `string` | ชื่อภาษาที่มนุษย์อ่านได้ (สำหรับการแสดงสถานะ) |
| `model` | `string` | เขียนทับโมเดลเริ่มต้น |
| `batchSize` | `number` | เขียนทับขนาดชุดข้อมูล (batch size) เริ่มต้น |
| `maxRetries` | `number` | จำนวนครั้งสูงสุดในการลองใหม่สำหรับชุดข้อมูลที่ล้มเหลว (ค่าเริ่มต้น: 3) |
| `script` | `string` | รหัสสคริปต์ ISO 15924 ใช้ทริกเกอร์การตรวจสอบสคริปต์ใน quality gate |

:::info ลำดับการสืบทอด (Inheritance chain)
การตั้งค่าจะถูกประมวลผลตามลำดับนี้ (ค่าแรกจะถูกใช้งาน):

**ระดับคู่ภาษา (pair-level)** → **ระดับภาษา (language-level)** → **การกำหนดค่าส่วนกลาง (global config)** → **ค่าเริ่มต้น (defaults)**

ตัวอย่างเช่น หาก `pairs["en:fr"]` ตั้งค่า `model` ค่านี้จะเขียนทับค่า `model` ทั้งในระดับภาษาและการกำหนดค่าส่วนกลาง
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

## ไฟล์ Lock

Rosetta จะสร้าง `.i18n-rosetta.lock` เพื่อติดตามค่าแฮช SHA-256 ของค่าต้นทางที่ถูกแปลแล้ว **โปรด Commit ไฟล์นี้** เพื่อให้นักพัฒนาทุกคนใช้ฐานข้อมูลการแปลเดียวกัน

เมื่อค่าต้นทางมีการเปลี่ยนแปลง ค่าแฮชจะไม่ตรงกันอีกต่อไป และ rosetta จะแปล key นั้นใหม่ในการซิงค์ครั้งถัดไป

## `.rosettaignore`

สร้าง `.rosettaignore` ใน root ของโปรเจกต์คุณ เพื่อยกเว้นไฟล์จากการสแกน `lint` โดยใช้รูปแบบ glob เช่น `.gitignore`:

```text title=".rosettaignore"
src/components/legacy/**
src/utils/constants.js
**/*.test.js
```

## ไดเรกทอรี `.rosetta/`

Rosetta จะสร้างไดเรกทอรี `.rosetta/` ใน root ของโปรเจกต์คุณสำหรับสถานะภายใน โดยทั่วไปคุณควร **เพิ่มไดเรกทอรีนี้ลงใน `.gitignore`** — เนื่องจากเป็นการปรับแต่งในเครื่อง (local optimization) ไม่ใช่ซอร์สโค้ดของโปรเจกต์:

```gitignore
.rosetta/
```

| ไฟล์ | วัตถุประสงค์ | Commit หรือไม่? |
|------|---------|--------|
| `tm.json` | แคช Translation Memory — จัดเก็บการแปลก่อนหน้าโดยใช้ข้อความต้นทาง + ภาษา + วิธีการ เป็น key | ไม่ (แคชในเครื่อง) |
| `xliff/*.xliff` | ไฟล์ส่งออก XLIFF สำหรับให้นักแปลมืออาชีพตรวจสอบ | ไม่ (ไฟล์ชั่วคราว) |
| `methods/` | Manifest ของปลั๊กอินวิธีการที่ติดตั้งไว้ | ใช่ (การกำหนดค่าที่ใช้ร่วมกัน) |
| `backups/` | ข้อมูลสำรองก่อนการ wrap (สร้างโดย `wrap --undo`) | ไม่ (เพื่อความปลอดภัย) |

ดู [Translation Memory](/docs/concepts/translation-memory) สำหรับรายละเอียดเกี่ยวกับ `tm.json` และวิธีที่ช่วยประหยัดค่าใช้จ่าย API

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
| `LLMMethod` | Base class สำหรับวิธี LLM (OpenRouter) |
| `DirectLLMMethod` | Base class สำหรับผู้ให้บริการ LLM โดยตรง (OpenAI, Anthropic, Gemini) |
| `OpenAIMethod`, `AnthropicMethod`, `GeminiMethod` | Class ของผู้ให้บริการ LLM โดยตรง |
| `DeepLMethod`, `MicrosoftTranslatorMethod`, `LibreTranslateMethod` | Class ของ MT แบบดั้งเดิม |
| `GoogleTranslateMethod` | Google Cloud Translation |
| `LLMCoachedMethod` | Coached LLM (OpenRouter + ข้อมูลการโค้ช) |
| `APIMethod` | Remote API client |
| `runSync`, `runContentSync` | ไปป์ไลน์การซิงค์แบบเต็ม |
| `resolveConfig`, `resolvePairs` | การประมวลผลการกำหนดค่า (Config resolution) |
| `validateTranslations` | Quality gate |
| `loadCoachingData`, `findDictionaryMatches` | ยูทิลิตี้สำหรับการโค้ช |

### ส่วนขยายผู้ให้บริการแบบกำหนดเอง

สืบทอด (Extend) `DirectLLMMethod` เพื่อเพิ่มผู้ให้บริการ LLM รายใหม่ในความยาวประมาณ 40 บรรทัด:

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

คุณจะได้รับการแปล, การโค้ช, การวนซ้ำเมื่อล้มเหลว (retry loops), การตรวจสอบโมเดล, ระดับคุณภาพ และความช่วยเหลือในการตั้งค่าโดยไม่ต้องทำอะไรเพิ่มเติม มีเพียงรูปแบบของ HTTP request เท่านั้นที่ขึ้นอยู่กับผู้ให้บริการแต่ละราย สำหรับอะแดปเตอร์ที่ไม่ใช่ LLM ซึ่งใช้ `fetch()` ดิบ ให้ใช้ตัวช่วย `fetchWithRetry()` ที่ใช้ร่วมกันจาก `lib/methods/fetch-with-retry.js` แทนการเขียน retry loop ของคุณเอง

---

## ดูเพิ่มเติม

- [ข้อมูลอ้างอิง CLI](/docs/reference/cli) — คำสั่งและแฟล็กทั้งหมด
- [วิธีการแปล](/docs/guides/translation-methods) — การเลือกและผสมผสานวิธีการ
- [Translation Memory](/docs/concepts/translation-memory) — การแคชและการประหยัดค่าใช้จ่าย
- [การทำงานร่วมกับนักแปลมืออาชีพ](/docs/guides/professional-translators) — เวิร์กโฟลว์ XLIFF
- [ข้อกำหนดของปลั๊กอิน](/docs/reference/plugin-spec) — รูปแบบ manifest ของปลั๊กอินวิธีการ
- [สถาปัตยกรรม](/docs/concepts/architecture) — วิธีการเชื่อมต่อส่วนประกอบต่างๆ
- [ภาษาที่รองรับ](/docs/reference/supported-languages) — การรองรับภาษาที่มีให้ในระบบ
- [การซิงค์ทำงานอย่างไร](/docs/concepts/how-sync-works) — ไปป์ไลน์การแปล