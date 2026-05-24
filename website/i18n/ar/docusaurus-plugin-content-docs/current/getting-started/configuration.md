---
sidebar_position: 3
title: "الإعدادات"
---
# الإعدادات

تعمل Rosetta بدون إعدادات مسبقة — حيث تكتشف تلقائيًا ملفات الترجمة، والتنسيق، واللغات المستهدفة من مشروعك. لمزيد من التحكم، أنشئ `i18n-rosetta.config.json` في المسار الجذري لمشروعك، أو قم بتشغيل:

```bash
npx i18n-rosetta init
```

## مرجع الإعدادات الكامل

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

:::note لم يتم تنفيذ typegen بعد
يتم التعرف على كتلة الإعدادات `typegen` والاحتفاظ بها بواسطة محمل الإعدادات، ولكن لم يتم تنفيذ ميزة إنشاء أنواع TypeScript بعد. هذا مجرد عنصر نائب لميزة مخطط لها. تعيين هذه القيم ليس له أي تأثير.
:::

### الحقول

| الحقل | النوع | الافتراضي | الوصف |
|-------|------|---------|-------------|
| `version` | `number` | `3` | إصدار مخطط الإعدادات. دائمًا `3`. |
| `inputLocale` | `string` | `"en"` | رمز اللغة المصدر (BCP 47). |
| `localesDir` | `string` | `"./locales"` | مسار ملفات الترجمة. تقوم Rosetta بفحص هذا الدليل. |
| `contentDir` | `string` | `null` | دليل محتوى Hugo. يُفعل ترجمة نصوص Markdown. |
| `translatableFields` | `string[]` | `null` | تجاوز حقول frontmatter الافتراضية القابلة للترجمة لترجمة المحتوى. تستخدم `null` الإعدادات الافتراضية المدمجة (`title`، `description`، `summary`). |
| `format` | `string` | `"auto"` | تنسيق الملف: `json`، `toml`، `yaml`، أو `auto` (يُكتشف من الامتداد). |
| `model` | `string` | `"google/gemini-3.5-flash"` | النموذج الافتراضي لطرق LLM. يعتمد التنسيق على الطريقة: تستخدم OpenRouter `provider/model` (مثل `google/gemini-3.5-flash`)؛ بينما يستخدم المزودون المباشرون الأسماء المجردة (مثل `gpt-4o`، `gemini-2.5-flash`). |
| `defaultMethod` | `string` | `"llm"` | طريقة الترجمة الافتراضية: `llm`، `llm-coached`، `google-translate`، `deepl`، `microsoft-translator`، `libretranslate`، `openai`، `anthropic`، `gemini`، `api`. يتم تجاوزها بواسطة علامة CLI `--method`. |
| `batchSize` | `number` | `30` | عدد المفاتيح لكل دفعة ترجمة. رقم أعلى = استدعاءات أقل لواجهة برمجة التطبيقات (API)، ولكن مطالبات (prompts) أكبر. |
| `fallbackPrefix` | `string` | `"[EN] "` | البادئة المضافة إلى القيم الاحتياطية غير المترجمة. تُستخدم بواسطة `audit` لاكتشاف الترجمات غير المكتملة. |
| `apiKeyEnvVar` | `string` | `"OPENROUTER_API_KEY"` | اسم متغير البيئة لمفتاح API. يُستخدم لتجاوز أسماء متغيرات البيئة المخصصة. |
| `baseUrl` | `string` | `""` | عنوان URL الأساسي لإنشاء عناصر تحسين محركات البحث (SEO) (مثل hreflang، sitemaps، JSON-LD). |
| `pairs` | `object` | `{}` | تجاوزات الطريقة، والنموذج، والجودة لكل زوج لغوي. راجع [إعدادات الزوج اللغوي](#pair-configuration). |
| `languages` | `object` | `{}` | تجاوزات لكل لغة. راجع [إعدادات اللغة](#language-configuration). |
| `lint.srcDir` | `string` | `null` | الدليل المصدر لفحص الأخطاء (lint scanning). `null` = اكتشاف تلقائي من إطار العمل. |
| `lint.ignore` | `string[]` | `["node_modules", ...]` | أنماط Glob المراد استبعادها من الفحص (lint). |
| `lint.minLength` | `number` | `2` | الحد الأدنى لطول السلسلة النصية ليتم تمييزها كنص ثابت (hardcoded). |
| `seo.urlPattern` | `string` | `"/:locale/:path"` | قالب نمط URL لإنشاء علامة hreflang. |
| `seo.pages` | `string[]` | `null` | قائمة صفحات صريحة لتحسين محركات البحث (SEO). `null` = اكتشاف تلقائي من مفاتيح الترجمة. |
| `typegen.output` | `string` | `null` | مسار الإخراج لأنواع TypeScript المُنشأة. `null` = معطل. |
| `typegen.autoGenerate` | `boolean` | `false` | إعادة إنشاء الأنواع تلقائيًا بعد كل عملية مزامنة. |

## إعدادات الزوج اللغوي

يمكن إعداد كل زوج (مصدر ← هدف) بشكل مستقل:

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

### حقول الزوج اللغوي

| الحقل | النوع | الوصف |
|-------|------|-------------|
| `method` | `string` | طريقة الترجمة: `llm`، `llm-coached`، `google-translate`، `deepl`، `microsoft-translator`، `libretranslate`، `openai`، `anthropic`، `gemini`، `api` |
| `methodPlugin` | `string` | اسم إضافة (plugin) مثبتة (من `.rosetta/methods/`) |
| `model` | `string` | تجاوز النموذج الافتراضي لهذا الزوج |
| `endpoint` | `string` | عنوان URL لنقطة نهاية API عن بُعد. مطلوب عندما تكون `method` هي `api`. |
| `qualityTier` | `string` | مستوى العرض (Display tier): `standard`، `high`، `research`، `verified` |

## إعدادات اللغة

تقبل اللغات ثلاثة تنسيقات:

### مصفوفة من الرموز (الأبسط)

```json
{
  "languages": ["fr", "de", "ja"]
}
```

تحصل كل لغة على مستوى اللغة (register) الافتراضي الخاص بها من جدول مستويات اللغة المدمج. اللغات التي ليس لها مستوى افتراضي تحصل على `"Professional register."`.

### كائن يحتوي على نصوص مستوى اللغة (register strings)

يمكن أن تكون القيمة **مفتاحًا معدًا مسبقًا** (preset key) من بطاقة اللغة، أو نصًا مخصصًا لمستوى اللغة:

```json
{
  "languages": {
    "fr": "casual-tu",
    "ko": "formal-hapsyo",
    "ja": "Custom: Polite Japanese for a gaming app."
  }
}
```

تتحقق Rosetta مما إذا كانت السلسلة النصية تتطابق مع مفتاح معد مسبقًا في بطاقة اللغة. إذا كان الأمر كذلك، يتم استخدام مطالبة مستوى اللغة (register prompt) الكاملة من البطاقة. وإذا لم تتطابق، يتم استخدام السلسلة النصية كما هي. راجع [اللغات المدعومة](/docs/reference/supported-languages#language-cards) لمعرفة الإعدادات المسبقة المتاحة.

### كائن يحتوي على الإعدادات الكاملة

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

يمكنك المزج بين الاختصارات والكائنات الكاملة في نفس الكتلة.

### حقول اللغة

| الحقل | النوع | الوصف |
|-------|------|-------------|
| `register` | `string` | تعليمات الأسلوب/الأسلوب اللغوي (tone). يمكن أن يكون **مفتاحًا معدًا مسبقًا** (مثل `casual-tu`، `formal-hapsyo`) أو نصًا مخصصًا. راجع [بطاقات اللغة](/docs/reference/supported-languages#language-cards). |
| `name` | `string` | اسم اللغة المقروء بشريًا (لعرض الحالة) |
| `model` | `string` | تجاوز النموذج الافتراضي |
| `batchSize` | `number` | تجاوز حجم الدفعة الافتراضي |
| `maxRetries` | `number` | الحد الأقصى لعدد محاولات إعادة المحاولة للدفعات الفاشلة (الافتراضي: 3) |
| `script` | `string` | رمز النص ISO 15924. يُشغل التحقق من صحة النص في بوابة الجودة (quality gate). |

:::info سلسلة الوراثة
يتم تطبيق الإعدادات بهذا الترتيب (الأولوية للأول):

**مستوى الزوج اللغوي** ← **مستوى اللغة** ← **الإعدادات العامة** ← **الافتراضيات**

على سبيل المثال، إذا قام `pairs["en:fr"]` بتعيين `model`، فإنه يتجاوز قيم `model` على مستوى اللغة والمستوى العام.
:::

## المصدر بغير الإنجليزية

إذا كانت لغتك المصدر ليست الإنجليزية:

```bash
# CLI flag (one-time)
npx i18n-rosetta sync --source fr
```

```json title="i18n-rosetta.config.json (permanent)"
{
  "inputLocale": "fr"
}
```

## ملف القفل (Lock File)

تُنشئ Rosetta ملف `.i18n-rosetta.lock` لتتبع تجزئات SHA-256 للقيم المصدرية المترجمة. **قم بإيداع (Commit) هذا الملف** حتى يتشارك جميع المطورين نفس الأساس المرجعي للترجمة.

عندما تتغير قيمة مصدرية، لا تتطابق التجزئة (hash) بعد ذلك، وتقوم Rosetta بإعادة ترجمة هذا المفتاح في المزامنة التالية.

## `.rosettaignore`

أنشئ ملف `.rosettaignore` في المسار الجذري لمشروعك لاستبعاد الملفات من فحص `lint`. يستخدم أنماط glob، مثل `.gitignore`:

```text title=".rosettaignore"
src/components/legacy/**
src/utils/constants.js
**/*.test.js
```

---

## واجهة برمجة التطبيقات البرمجية (Programmatic API)

بالنسبة لبرامج البناء النصية (build scripts) والتكاملات المخصصة، قم بالاستيراد مباشرة من الحزمة:

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

### التصديرات المتاحة (Available Exports)

| التصدير | الوظيفة |
|--------|-------------|
| `TranslationMethod` | الفئة الأساسية (Base class) لجميع الطرق |
| `LLMMethod` | الفئة الأساسية لطرق LLM (OpenRouter) |
| `DirectLLMMethod` | الفئة الأساسية لمزودي LLM المباشرين (OpenAI، Anthropic، Gemini) |
| `OpenAIMethod`، `AnthropicMethod`، `GeminiMethod` | فئات مزودي LLM المباشرين |
| `DeepLMethod`، `MicrosoftTranslatorMethod`، `LibreTranslateMethod` | فئات الترجمة الآلية (MT) التقليدية |
| `GoogleTranslateMethod` | ترجمة Google Cloud |
| `LLMCoachedMethod` | LLM الموجه (OpenRouter + بيانات التوجيه) |
| `APIMethod` | عميل API عن بُعد |
| `runSync`، `runContentSync` | مسار المزامنة الكامل (Full sync pipeline) |
| `resolveConfig`، `resolvePairs` | تحليل الإعدادات (Config resolution) |
| `validateTranslations` | بوابة الجودة (Quality gate) |
| `loadCoachingData`، `findDictionaryMatches` | أدوات التوجيه (Coaching utilities) |

### توسيع مزود مخصص

قم بتوسيع `DirectLLMMethod` لإضافة مزود LLM جديد في حوالي 40 سطرًا:

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

ستحصل على ميزات الترجمة، والتوجيه (coaching)، وحلقات إعادة المحاولة، والتحقق من صحة النموذج، ومستويات الجودة، والمساعدة في الإعداد مجانًا. شكل طلب HTTP فقط هو الذي يختلف حسب المزود. بالنسبة للمحولات (adapters) غير المعتمدة على LLM والتي تستخدم `fetch()` الخام، استخدم المساعد المشترك `fetchWithRetry()` من `lib/methods/fetch-with-retry.js` بدلاً من كتابة حلقة إعادة المحاولة الخاصة بك.

---

## انظر أيضًا

- [مرجع واجهة سطر الأوامر (CLI)](/docs/reference/cli) — جميع الأوامر والعلامات
- [طرق الترجمة](/docs/guides/translation-methods) — اختيار ودمج الطرق
- [مواصفات الإضافات (Plugin Specification)](/docs/reference/plugin-spec) — تنسيق بيان (manifest) إضافة الطريقة
- [البنية (Architecture)](/docs/concepts/architecture) — كيف تتصل الأجزاء ببعضها
- [اللغات المدعومة](/docs/reference/supported-languages) — دعم اللغات المدمج
- [كيف تعمل المزامنة](/docs/concepts/how-sync-works) — مسار الترجمة (translation pipeline)