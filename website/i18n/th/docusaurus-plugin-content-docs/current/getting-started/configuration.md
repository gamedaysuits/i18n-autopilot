---
sidebar_position: 3
title: "การตั้งค่า"
---
# การตั้งค่า

Rosetta ทำงานแบบ zero-config — โดยจะตรวจหาไฟล์ locale, รูปแบบ และภาษาเป้าหมายจากโปรเจกต์ของคุณโดยอัตโนมัติ หากต้องการควบคุมเพิ่มเติม ให้สร้าง `i18n-rosetta.config.json` ใน root ของโปรเจกต์คุณ หรือรัน:

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
  "concurrency": 12,
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

:::note typegen ยังไม่เปิดใช้งาน
บล็อกการตั้งค่า `typegen` จะถูกจดจำและเก็บรักษาไว้โดย config loader แต่การสร้าง type ของ TypeScript ยังไม่เปิดใช้งาน นี่เป็นเพียง placeholder สำหรับฟีเจอร์ที่มีแผนจะทำในอนาคต การตั้งค่าค่าเหล่านี้จะไม่มีผลใดๆ
:::

### ฟิลด์

| ฟิลด์ | ประเภท | ค่าเริ่มต้น | คำอธิบาย |
|-------|------|---------|-------------|
| `version` | `number` | `3` | เวอร์ชันของ Config schema จะเป็น `3` เสมอ |
| `inputLocale` | `string` | `"en"` | รหัสภาษาต้นทาง (BCP 47) |
| `localesDir` | `string` | `"./locales"` | Path ไปยังไฟล์ locale Rosetta จะสแกนไดเรกทอรีนี้ |
| `contentDir` | `string` | `null` | ไดเรกทอรี content ของ Hugo เปิดใช้งานการแปลเนื้อหา Markdown |
| `translatableFields` | `string[]` | `null` | เขียนทับฟิลด์ frontmatter เริ่มต้นที่แปลได้สำหรับการแปล content `null` จะใช้ค่าเริ่มต้นที่มีให้ (`title`, `description`, `summary`) |
| `format` | `string` | `"auto"` | รูปแบบไฟล์: `json`, `toml`, `yaml`, หรือ `auto` (ตรวจหาจากนามสกุลไฟล์) |
| `model` | `string` | `"google/gemini-3.5-flash"` | โมเดลเริ่มต้นสำหรับวิธี LLM รูปแบบจะขึ้นอยู่กับวิธี: OpenRouter ใช้ `provider/model` (เช่น `google/gemini-3.5-flash`); ผู้ให้บริการโดยตรงใช้ชื่อเปล่าๆ (เช่น `gpt-4o`, `gemini-2.5-flash`) |
| `defaultMethod` | `string` | `"llm"` | วิธีการแปลเริ่มต้น: `llm`, `llm-coached`, `google-translate`, `deepl`, `microsoft-translator`, `libretranslate`, `openai`, `anthropic`, `gemini`, `api` จะถูกเขียนทับด้วย CLI flag `--method` |
| `batchSize` | `number` | `30` | จำนวน Key ต่อการแปลหนึ่ง batch ค่าที่สูงกว่า = เรียก API น้อยลง แต่ prompt จะมีขนาดใหญ่ขึ้น |
| `concurrency` | `number` | `12` | จำนวนการเรียก API แบบขนานสูงสุดสำหรับการแปล content (Markdown/MDX) จะถูกเขียนทับด้วย CLI flag `--concurrency` |
| `fallbackPrefix` | `string` | `"[EN] "` | Prefix ที่เพิ่มเข้าไปในค่า fallback ที่ยังไม่ได้แปล ถูกใช้โดย `audit` เพื่อตรวจหาการแปลที่ไม่สมบูรณ์ |
| `apiKeyEnvVar` | `string` | `"OPENROUTER_API_KEY"` | ชื่อ Environment variable สำหรับ API key เขียนทับสำหรับชื่อ env var แบบกำหนดเอง |
| `baseUrl` | `string` | `""` | Base URL สำหรับการสร้าง SEO artifact (hreflang, sitemaps, JSON-LD) |
| `pairs` | `object` | `{}` | การเขียนทับวิธี, โมเดล และคุณภาพต่อคู่ภาษา ดู [การตั้งค่าคู่ภาษา](#pair-configuration) |
| `languages` | `object` | `{}` | การเขียนทับต่อภาษา ดู [การตั้งค่าภาษา](#language-configuration) |
| `lint.srcDir` | `string` | `null` | ไดเรกทอรีต้นทางสำหรับการสแกน lint `null` = ตรวจหาจากเฟรมเวิร์กอัตโนมัติ |
| `lint.ignore` | `string[]` | `["node_modules", ...]` | Glob patterns ที่ต้องการยกเว้นจาก lint |
| `lint.minLength` | `number` | `2` | ความยาวสตริงขั้นต่ำที่จะถูกตั้งค่าสถานะเป็น hardcoded |
| `seo.urlPattern` | `string` | `"/:locale/:path"` | เทมเพลต URL pattern สำหรับการสร้างแท็ก hreflang |
| `seo.pages` | `string[]` | `null` | รายการหน้าแบบเจาะจงสำหรับ SEO `null` = ตรวจหาจาก locale keys อัตโนมัติ |
| `typegen.output` | `string` | `null` | Path ผลลัพธ์สำหรับ TypeScript types ที่สร้างขึ้น `null` = ปิดใช้งาน |
| `typegen.autoGenerate` | `boolean` | `false` | สร้าง types ใหม่โดยอัตโนมัติหลังจากการซิงค์แต่ละครั้ง |

## การตั้งค่าคู่ภาษา

แต่ละคู่ภาษา ต้นทาง→เป้าหมาย สามารถตั้งค่าได้อย่างอิสระ:

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

### Object ที่มีสตริง register

ค่าสามารถเป็น **preset key** จากการ์ดภาษา หรือข้อความ register แบบกำหนดเอง:

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

### Object ที่มีการตั้งค่าแบบเต็ม

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

คุณสามารถผสม shorthand และ object แบบเต็มในบล็อกเดียวกันได้

### ฟิลด์ของภาษา

| ฟิลด์ | ประเภท | คำอธิบาย |
|-------|------|-------------|
| `register` | `string` | คำแนะนำเกี่ยวกับสไตล์/น้ำเสียง สามารถเป็น **preset key** (เช่น `casual-tu`, `formal-hapsyo`) หรือข้อความแบบกำหนดเอง ดู [การ์ดภาษา](/docs/reference/supported-languages#language-cards) |
| `name` | `string` | ชื่อภาษาที่มนุษย์อ่านได้ (สำหรับการแสดงสถานะ) |
| `model` | `string` | เขียนทับโมเดลเริ่มต้น |
| `batchSize` | `number` | เขียนทับขนาด batch เริ่มต้น |
| `maxRetries` | `number` | จำนวนครั้งสูงสุดในการลองใหม่สำหรับ batch ที่ล้มเหลว (ค่าเริ่มต้น: 3) |
| `script` | `string` | รหัสสคริปต์ ISO 15924 จะทริกเกอร์การตรวจสอบสคริปต์ใน quality gate |

:::info ลำดับการสืบทอด
การตั้งค่าจะถูกประมวลผลตามลำดับนี้ (อันดับแรกจะถูกเลือก):

**ระดับคู่ภาษา** → **ระดับภาษา** → **การตั้งค่าส่วนกลาง** → **ค่าเริ่มต้น**

ตัวอย่างเช่น หาก `pairs["en:fr"]` ตั้งค่า `model` มันจะเขียนทับทั้งค่า `model` ในระดับภาษาและการตั้งค่าส่วนกลาง
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

Rosetta จะสร้าง `.i18n-rosetta.lock` เพื่อติดตาม SHA-256 hashes ของค่าต้นทางที่แปลแล้ว **โปรด Commit ไฟล์นี้** เพื่อให้นักพัฒนาทุกคนใช้ baseline การแปลเดียวกัน

เมื่อค่าต้นทางเปลี่ยนไป hash จะไม่ตรงกันอีกต่อไป และ rosetta จะแปล key นั้นใหม่ในการซิงค์ครั้งถัดไป

## `.rosettaignore`

สร้าง `.rosettaignore` ใน root ของโปรเจกต์คุณเพื่อยกเว้นไฟล์จากการสแกน `lint` โดยใช้ glob patterns เช่น `.gitignore`:

```text title=".rosettaignore"
src/components/legacy/**
src/utils/constants.js
**/*.test.js
```

## ไดเรกทอรี `.rosetta/`

Rosetta จะสร้างไดเรกทอรี `.rosetta/` ใน root ของโปรเจกต์คุณสำหรับสถานะภายใน โดยทั่วไปคุณควร **เพิ่มสิ่งนี้ลงใน `.gitignore`** — เนื่องจากเป็นการปรับแต่งภายในเครื่อง ไม่ใช่ source ของโปรเจกต์:

```gitignore
.rosetta/
```

| ไฟล์ | วัตถุประสงค์ | Commit หรือไม่? |
|------|---------|--------|
| `tm.json` | แคช Translation Memory — จัดเก็บการแปลก่อนหน้าโดยใช้ source text + locale + method เป็น key | ไม่ (แคชในเครื่อง) |
| `xliff/*.xliff` | ไฟล์ส่งออก XLIFF สำหรับให้นักแปลมืออาชีพตรวจสอบ | ไม่ (ชั่วคราว) |
| `methods/` | Manifests ของปลั๊กอิน method ที่ติดตั้งไว้ | ใช่ (การตั้งค่าที่ใช้ร่วมกัน) |
| `backups/` | แบ็กอัปก่อนการ wrap (สร้างโดย `wrap --undo`) | ไม่ (เพื่อความปลอดภัย) |

ดู [Translation Memory](/docs/concepts/translation-memory) สำหรับรายละเอียดเกี่ยวกับ `tm.json` และวิธีที่ช่วยประหยัดค่าใช้จ่าย API

---

## Programmatic API

สำหรับ build scripts และการรวมระบบแบบกำหนดเอง ให้ import โดยตรงจากแพ็กเกจ:

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
| `TranslationMethod` | Base class สำหรับทุก methods |
| `LLMMethod` | Base class สำหรับ LLM methods (OpenRouter) |
| `DirectLLMMethod` | Base class สำหรับผู้ให้บริการ LLM โดยตรง (OpenAI, Anthropic, Gemini) |
| `OpenAIMethod`, `AnthropicMethod`, `GeminiMethod` | คลาสของผู้ให้บริการ LLM โดยตรง |
| `DeepLMethod`, `MicrosoftTranslatorMethod`, `LibreTranslateMethod` | คลาส MT แบบดั้งเดิม |
| `GoogleTranslateMethod` | Google Cloud Translation |
| `LLMCoachedMethod` | Coached LLM (OpenRouter + ข้อมูล coaching) |
| `APIMethod` | ไคลเอนต์ Remote API |
| `runSync`, `runContentSync` | ไปป์ไลน์การซิงค์แบบเต็ม |
| `resolveConfig`, `resolvePairs` | การประมวลผลการตั้งค่า |
| `validateTranslations` | Quality gate |
| `loadCoachingData`, `findDictionaryMatches` | ยูทิลิตี้สำหรับ Coaching |

### ส่วนขยายผู้ให้บริการแบบกำหนดเอง

สืบทอดคลาส `DirectLLMMethod` เพื่อเพิ่มผู้ให้บริการ LLM รายใหม่ในโค้ดประมาณ 40 บรรทัด:

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

คุณจะได้รับการแปล, coaching, การวนซ้ำเมื่อล้มเหลว (retry loops), การตรวจสอบโมเดล, ระดับคุณภาพ และความช่วยเหลือในการตั้งค่าฟรี มีเพียงรูปแบบของ HTTP request เท่านั้นที่เจาะจงตามผู้ให้บริการ สำหรับอะแดปเตอร์ที่ไม่ใช่ LLM ซึ่งใช้ `fetch()` ดิบๆ ให้ใช้ helper `fetchWithRetry()` ที่ใช้ร่วมกันจาก `lib/methods/fetch-with-retry.js` แทนการเขียน retry loop ของคุณเอง

---

## ดูเพิ่มเติม

- [ข้อมูลอ้างอิง CLI](/docs/reference/cli) — คำสั่งและ flag ทั้งหมด
- [วิธีการแปล](/docs/guides/translation-methods) — การเลือกและผสมผสานวิธีการ
- [Translation Memory](/docs/concepts/translation-memory) — การแคชและการประหยัดค่าใช้จ่าย
- [การทำงานร่วมกับนักแปลมืออาชีพ](/docs/guides/professional-translators) — เวิร์กโฟลว์ XLIFF
- [ข้อกำหนดของปลั๊กอิน](/docs/reference/plugin-spec) — รูปแบบ manifest ของปลั๊กอิน method
- [สถาปัตยกรรม](/docs/concepts/architecture) — วิธีการเชื่อมต่อส่วนต่างๆ
- [ภาษาที่รองรับ](/docs/reference/supported-languages) — การรองรับภาษาที่มีมาให้
- [การทำงานของ Sync](/docs/concepts/how-sync-works) — ไปป์ไลน์การแปล