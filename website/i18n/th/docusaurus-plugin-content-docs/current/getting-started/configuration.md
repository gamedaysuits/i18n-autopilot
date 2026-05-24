---
sidebar_position: 3
title: "การตั้งค่า"
---
# การตั้งค่า

Rosetta สามารถทำงานได้โดยไม่ต้องตั้งค่า (zero-config) — โดยจะตรวจหาไฟล์ภาษา (locale), รูปแบบไฟล์ และภาษาปลายทางจากโปรเจกต์ของคุณโดยอัตโนมัติ หากต้องการควบคุมเพิ่มเติม ให้สร้าง `i18n-rosetta.config.json` ใน root ของโปรเจกต์คุณ หรือรัน:

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
  "batchSize": 30,
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
บล็อกการตั้งค่า `typegen` จะถูกรับรู้และเก็บรักษาไว้โดยตัวโหลดการตั้งค่า แต่การสร้าง Type ของ TypeScript ยังไม่เปิดให้ใช้งาน นี่เป็นเพียง placeholder สำหรับฟีเจอร์ที่มีแผนจะพัฒนาในอนาคต การตั้งค่าค่าเหล่านี้จะยังไม่มีผลใดๆ
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
| `model` | `string` | `"google/gemini-3.5-flash"` | โมเดลเริ่มต้นสำหรับวิธี LLM รูปแบบจะขึ้นอยู่กับวิธีที่ใช้: OpenRouter ใช้ `provider/model` (เช่น `google/gemini-3.5-flash`); ผู้ให้บริการโดยตรงจะใช้ชื่อแบบสั้น (เช่น `gpt-4o`, `gemini-2.5-flash`) |
| `defaultMethod` | `string` | `"llm"` | วิธีการแปลเริ่มต้น: `llm`, `llm-coached`, `google-translate`, `deepl`, `microsoft-translator`, `libretranslate`, `openai`, `anthropic`, `gemini`, `api` สามารถเขียนทับได้ด้วย CLI flag `--method` |
| `batchSize` | `number` | `30` | จำนวน Key ต่อการแปลหนึ่งชุด (batch) ค่าที่สูงขึ้น = เรียกใช้ API น้อยลง แต่ prompt จะมีขนาดใหญ่ขึ้น |
| `fallbackPrefix` | `string` | `"[EN] "` | Prefix ที่เพิ่มเข้าไปในค่า fallback ที่ยังไม่ได้แปล ถูกใช้โดย `audit` เพื่อตรวจหาการแปลที่ไม่สมบูรณ์ |
| `apiKeyEnvVar` | `string` | `"OPENROUTER_API_KEY"` | ชื่อตัวแปรสภาพแวดล้อม (Environment variable) สำหรับ API key ใช้เขียนทับสำหรับชื่อตัวแปรสภาพแวดล้อมแบบกำหนดเอง |
| `baseUrl` | `string` | `""` | Base URL สำหรับการสร้าง SEO artifact (hreflang, sitemaps, JSON-LD) |
| `pairs` | `object` | `{}` | การเขียนทับวิธี, โมเดล และคุณภาพต่อคู่ภาษา ดูที่ [การตั้งค่าคู่ภาษา](#pair-configuration) |
| `languages` | `object` | `{}` | การเขียนทับต่อภาษา ดูที่ [การตั้งค่าภาษา](#language-configuration) |
| `lint.srcDir` | `string` | `null` | ไดเรกทอรีต้นทางสำหรับการสแกน lint `null` = ตรวจหาจากเฟรมเวิร์กโดยอัตโนมัติ |
| `lint.ignore` | `string[]` | `["node_modules", ...]` | Glob patterns ที่ต้องการยกเว้นจาก lint |
| `lint.minLength` | `number` | `2` | ความยาวสตริงขั้นต่ำที่จะถูกตั้งค่าสถานะ (flag) ว่าเป็น hardcoded |
| `seo.urlPattern` | `string` | `"/:locale/:path"` | เทมเพลต URL pattern สำหรับการสร้างแท็ก hreflang |
| `seo.pages` | `string[]` | `null` | รายการหน้าแบบระบุชัดเจนสำหรับ SEO `null` = ตรวจหาจาก locale keys โดยอัตโนมัติ |
| `typegen.output` | `string` | `null` | Path ขาออกสำหรับ TypeScript types ที่สร้างขึ้น `null` = ปิดใช้งาน |
| `typegen.autoGenerate` | `boolean` | `false` | สร้าง types ใหม่โดยอัตโนมัติหลังจากการซิงค์แต่ละครั้ง |

## การตั้งค่าคู่ภาษา

แต่ละคู่ภาษา ต้นทาง→ปลายทาง สามารถตั้งค่าแยกกันได้อย่างอิสระ:

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
| `methodPlugin` | `string` | ชื่อของปลั๊กอินที่ติดตั้งไว้ (จาก `.rosetta/methods/`) |
| `model` | `string` | เขียนทับโมเดลเริ่มต้นสำหรับคู่ภาษานี้ |
| `endpoint` | `string` | URL ของ Remote API endpoint จำเป็นต้องระบุเมื่อ `method` เป็น `api` |
| `qualityTier` | `string` | ระดับการแสดงผล (Display tier): `standard`, `high`, `research`, `verified` |

## การตั้งค่าภาษา

ภาษาสามารถรับรูปแบบได้ 3 รูปแบบ:

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

Rosetta จะตรวจสอบว่าสตริงตรงกับ preset key ในการ์ดภาษาหรือไม่ หากตรงกัน จะใช้ prompt ระดับภาษาแบบเต็มจากการ์ดนั้น หากไม่ตรงกัน จะใช้สตริงนั้นตามที่ระบุไว้ ดู preset ที่มีให้ใช้งานได้ที่ [ภาษาที่รองรับ](/docs/reference/supported-languages#language-cards)

### ออบเจ็กต์พร้อมการตั้งค่าแบบเต็ม

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
| `batchSize` | `number` | เขียนทับขนาด batch เริ่มต้น |
| `maxRetries` | `number` | จำนวนครั้งสูงสุดในการลองใหม่ (retry) สำหรับ batch ที่ล้มเหลว (ค่าเริ่มต้น: 3) |
| `script` | `string` | รหัสสคริปต์ ISO 15924 ใช้ทริกเกอร์การตรวจสอบสคริปต์ใน quality gate |

:::info ลำดับการสืบทอด (Inheritance chain)
การตั้งค่าจะถูกประมวลผลตามลำดับนี้ (อันดับแรกจะถูกเลือกใช้):

**ระดับคู่ภาษา (pair-level)** → **ระดับภาษา (language-level)** → **การตั้งค่าส่วนกลาง (global config)** → **ค่าเริ่มต้น (defaults)**

ตัวอย่างเช่น หาก `pairs["en:fr"]` ตั้งค่า `model` ค่านี้จะเขียนทับค่า `model` ทั้งในระดับภาษาและการตั้งค่าส่วนกลาง
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

Rosetta จะสร้าง `.i18n-rosetta.lock` เพื่อติดตามค่า SHA-256 hashes ของค่าต้นทางที่ถูกแปลแล้ว **โปรด Commit ไฟล์นี้** เพื่อให้นักพัฒนาทุกคนใช้ baseline การแปลเดียวกัน

เมื่อค่าต้นทางมีการเปลี่ยนแปลง ค่า hash จะไม่ตรงกันอีกต่อไป และ rosetta จะแปล key นั้นใหม่ในการซิงค์ครั้งถัดไป

## `.rosettaignore`

สร้าง `.rosettaignore` ใน root ของโปรเจกต์คุณเพื่อยกเว้นไฟล์จากการสแกน `lint` โดยใช้ glob patterns เช่นเดียวกับ `.gitignore`:

```text title=".rosettaignore"
src/components/legacy/**
src/utils/constants.js
**/*.test.js
```

---

## Programmatic API

สำหรับ build scripts และการผสานการทำงานแบบกำหนดเอง (custom integrations) ให้ import โดยตรงจากแพ็กเกจ:

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

### Exports ที่มีให้ใช้งาน

| Export | หน้าที่ |
|--------|-------------|
| `TranslationMethod` | Base class สำหรับทุกวิธี |
| `LLMMethod` | Base class สำหรับวิธี LLM (OpenRouter) |
| `DirectLLMMethod` | Base class สำหรับผู้ให้บริการ LLM โดยตรง (OpenAI, Anthropic, Gemini) |
| `OpenAIMethod`, `AnthropicMethod`, `GeminiMethod` | คลาสของผู้ให้บริการ LLM โดยตรง |
| `DeepLMethod`, `MicrosoftTranslatorMethod`, `LibreTranslateMethod` | คลาสของ Traditional MT |
| `GoogleTranslateMethod` | Google Cloud Translation |
| `LLMCoachedMethod` | Coached LLM (OpenRouter + ข้อมูล coaching) |
| `APIMethod` | ไคลเอนต์ Remote API |
| `runSync`, `runContentSync` | ไปป์ไลน์การซิงค์แบบเต็ม |
| `resolveConfig`, `resolvePairs` | การประมวลผลการตั้งค่า (Config resolution) |
| `validateTranslations` | Quality gate |
| `loadCoachingData`, `findDictionaryMatches` | ยูทิลิตี้สำหรับ Coaching |

### ส่วนขยายผู้ให้บริการแบบกำหนดเอง (Custom Provider Extension)

ขยาย (Extend) `DirectLLMMethod` เพื่อเพิ่มผู้ให้บริการ LLM รายใหม่ด้วยโค้ดเพียงประมาณ 40 บรรทัด:

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

คุณจะได้รับฟังก์ชันการแปล, coaching, retry loops, การตรวจสอบโมเดล, ระดับคุณภาพ (quality tiers) และตัวช่วยการตั้งค่าไปใช้งานได้ฟรี มีเพียงรูปแบบของ HTTP request เท่านั้นที่เจาะจงตามผู้ให้บริการ สำหรับอแดปเตอร์ที่ไม่ใช่ LLM ซึ่งใช้ `fetch()` โดยตรง ให้ใช้ตัวช่วย `fetchWithRetry()` ที่แชร์จาก `lib/methods/fetch-with-retry.js` แทนการเขียน retry loop ของคุณเอง

---

## ดูเพิ่มเติม

- [ข้อมูลอ้างอิง CLI](/docs/reference/cli) — คำสั่งและ flag ทั้งหมด
- [วิธีการแปล](/docs/guides/translation-methods) — การเลือกและผสมผสานวิธีการแปล
- [ข้อกำหนดของปลั๊กอิน](/docs/reference/plugin-spec) — รูปแบบ manifest ของปลั๊กอินวิธีการแปล
- [สถาปัตยกรรม](/docs/concepts/architecture) — วิธีการเชื่อมต่อส่วนประกอบต่างๆ
- [ภาษาที่รองรับ](/docs/reference/supported-languages) — ภาษาที่มีให้ในระบบ
- [การทำงานของการซิงค์](/docs/concepts/how-sync-works) — ไปป์ไลน์การแปล