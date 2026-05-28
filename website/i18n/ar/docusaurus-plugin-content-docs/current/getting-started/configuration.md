---
sidebar_position: 3
title: "الإعدادات"
---
# التكوين

تعمل Rosetta بدون تكوين مسبق (zero-config) — حيث تكتشف تلقائيًا ملفات اللغة، والتنسيق، واللغات المستهدفة من مشروعك. لمزيد من التحكم، قم بإنشاء `i18n-rosetta.config.json` في الجذر الخاص بمشروعك، أو قم بتشغيل:

```bash
npx i18n-rosetta init
```

## مرجع التكوين الكامل

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

:::note لم يتم تنفيذ typegen بعد
يتم التعرف على كتلة التكوين `typegen` والاحتفاظ بها بواسطة محمل التكوين، ولكن لم يتم تنفيذ إنشاء أنواع TypeScript بعد. هذا عنصر نائب لميزة مخطط لها. تعيين هذه القيم ليس له أي تأثير.
:::


### الحقول

| الحقل | النوع | الافتراضي | الوصف |
|-------|------|---------|-------------|
| `version` | `number` | `3` | إصدار مخطط التكوين. دائمًا `3`. |
| `inputLocale` | `string` | `"en"` | رمز اللغة المصدر (BCP 47). |
| `localesDir` | `string` | `"./locales"` | مسار ملفات اللغة. تقوم Rosetta بفحص هذا الدليل. |
| `contentDir` | `string` | `null` | دليل محتوى Hugo. يُفعل ترجمة نصوص Markdown. |
| `translatableFields` | `string[]` | `null` | تجاوز حقول frontmatter الافتراضية القابلة للترجمة لترجمة المحتوى. تستخدم `null` الإعدادات الافتراضية المدمجة (`title`، `description`، `summary`). |
| `format` | `string` | `"auto"` | تنسيق الملف: `json`، `toml`، `yaml`، أو `auto` (يتم اكتشافه من الامتداد). |
| `model` | `string` | `"google/gemini-3.5-flash"` | النموذج الافتراضي لطرق LLM. يعتمد التنسيق على الطريقة: تستخدم OpenRouter `provider/model` (مثل `google/gemini-3.5-flash`)؛ بينما يستخدم المزودون المباشرون الأسماء المجردة (مثل `gpt-4o`، `gemini-2.5-flash`). |
| `defaultMethod` | `string` | `"llm"` | طريقة الترجمة الافتراضية: `llm`، `llm-coached`، `google-translate`، `deepl`، `microsoft-translator`، `libretranslate`، `openai`، `anthropic`، `gemini`، `api`. يتم تجاوزها بواسطة علامة CLI `--method`. |
| `batchSize` | `number` | `80` | عدد المفاتيح لكل دفعة ترجمة. رقم أعلى = استدعاءات أقل لواجهة برمجة التطبيقات (API)، ولكن مطالبات (prompts) أكبر. |
| `jsonConcurrency` | `number` | `200` | الحد الأقصى للترجمات المحلية المتوازية لمزامنة مفاتيح JSON. يتم تجاوزها بواسطة علامة CLI `--json-concurrency`. |
| `contentConcurrency` | `number` | `48` | الحد الأقصى لاستدعاءات API المتوازية لترجمة المحتوى (Markdown/MDX). يتم تجاوزها بواسطة علامة CLI `--content-concurrency`. |
| `fallbackPrefix` | `string` | `"[EN] "` | بادئة العلامة المستخدمة بواسطة `audit` و `verify` لاكتشاف القيم القديمة غير المترجمة من عمليات التشغيل السابقة. لا تقوم Rosetta بكتابة هذه البادئة — بل تقرأها فقط للاكتشاف. |
| `apiKeyEnvVar` | `string` | `"OPENROUTER_API_KEY"` | اسم متغير البيئة لمفتاح API. قم بتجاوزه لأسماء متغيرات البيئة المخصصة. |
| `baseUrl` | `string` | `""` | عنوان URL الأساسي لإنشاء عناصر تحسين محركات البحث (SEO) (مثل hreflang، وsitemaps، وJSON-LD). |
| `pairs` | `object` | `{}` | تجاوزات الطريقة، والنموذج، والجودة لكل زوج. راجع [تكوين الزوج](#pair-configuration). |
| `languages` | `object` | `{}` | تجاوزات لكل لغة. راجع [تكوين اللغة](#language-configuration). |
| `lint.srcDir` | `string` | `null` | الدليل المصدر لفحص الأخطاء (lint scanning). `null` = اكتشاف تلقائي من إطار العمل. |
| `lint.ignore` | `string[]` | `["node_modules", ...]` | أنماط glob لاستبعادها من فحص الأخطاء (lint). |
| `lint.minLength` | `number` | `2` | الحد الأدنى لطول السلسلة النصية لتمييزها كقيمة ثابتة (hardcoded). |
| `seo.urlPattern` | `string` | `"/:locale/:path"` | قالب نمط URL لإنشاء علامات hreflang. |
| `seo.pages` | `string[]` | `null` | قائمة صفحات صريحة لتحسين محركات البحث (SEO). `null` = اكتشاف تلقائي من مفاتيح اللغة. |
| `typegen.output` | `string` | `null` | مسار الإخراج لأنواع TypeScript المُنشأة. `null` = معطل. |
| `typegen.autoGenerate` | `boolean` | `false` | إعادة إنشاء الأنواع تلقائيًا بعد كل عملية مزامنة. |

## تكوين الزوج

يمكن تكوين كل زوج (مصدر ← هدف) بشكل مستقل:

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

### حقول الزوج

| الحقل | النوع | الوصف |
|-------|------|-------------|
| `method` | `string` | طريقة الترجمة: `llm`، `llm-coached`، `google-translate`، `deepl`، `microsoft-translator`، `libretranslate`، `openai`، `anthropic`، `gemini`، `api` |
| `methodPlugin` | `string` | اسم المكون الإضافي المثبت (من `.rosetta/methods/`) |
| `model` | `string` | تجاوز النموذج الافتراضي لهذا الزوج |
| `endpoint` | `string` | عنوان URL لنقطة نهاية API عن بُعد. مطلوب عندما تكون `method` هي `api`. |
| `qualityTier` | `string` | مستوى العرض: `standard`، `high`، `research`، `verified` |

## تكوين اللغة

تقبل اللغات ثلاثة تنسيقات:

### مصفوفة من الرموز (الأبسط)

```json
{
  "languages": ["fr", "de", "ja"]
}
```

تحصل كل لغة على أسلوبها (register) الافتراضي من جدول الأساليب المدمج. اللغات التي ليس لها أسلوب افتراضي تحصل على `"Professional register."`.

### كائن مع نصوص الأسلوب (register strings)

يمكن أن تكون القيمة **مفتاحًا محددًا مسبقًا** من بطاقة اللغة، أو نص أسلوب مخصص:

```json
{
  "languages": {
    "fr": "casual-tu",
    "ko": "formal-hapsyo",
    "ja": "Custom: Polite Japanese for a gaming app."
  }
}
```

تتحقق Rosetta مما إذا كانت السلسلة النصية تتطابق مع مفتاح محدد مسبقًا في بطاقة اللغة. إذا كانت كذلك، يتم استخدام مطالبة الأسلوب الكاملة من البطاقة. وإذا لم تكن كذلك، يتم استخدام السلسلة النصية كما هي. راجع [اللغات المدعومة](/docs/reference/supported-languages#language-cards) لمعرفة الإعدادات المسبقة المتاحة.

### كائن مع تكوين كامل

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
| `register` | `string` | تعليمات الأسلوب/النبرة. يمكن أن تكون **مفتاحًا محددًا مسبقًا** (مثل `casual-tu`، `formal-hapsyo`) أو نصًا مخصصًا. راجع [بطاقات اللغة](/docs/reference/supported-languages#language-cards). |
| `name` | `string` | اسم لغة مقروء للبشر (لعرض الحالة) |
| `model` | `string` | تجاوز النموذج الافتراضي |
| `batchSize` | `number` | تجاوز حجم الدفعة الافتراضي |
| `maxRetries` | `number` | الحد الأقصى لميزانية إعادة المحاولة للدفعات الفاشلة (الافتراضي: 3) |
| `script` | `string` | رمز البرنامج النصي ISO 15924. يُشغل التحقق من صحة البرنامج النصي في بوابة الجودة. |

:::info سلسلة الوراثة
يتم حل الإعدادات بهذا الترتيب (الأولوية للأول):

**مستوى الزوج** ← **مستوى اللغة** ← **التكوين العام** ← **الافتراضيات**

على سبيل المثال، إذا قام `pairs["en:fr"]` بتعيين `model`، فإنه يتجاوز قيم `model` على مستوى اللغة والمستوى العام.
:::

## مصدر بغير اللغة الإنجليزية

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

تقوم Rosetta بإنشاء `.i18n-rosetta.lock` لتتبع تجزئات SHA-256 للقيم المصدرية المترجمة. **قم بإيداع (Commit) هذا الملف** حتى يتشارك جميع المطورين نفس خط الأساس للترجمة.

عندما تتغير قيمة مصدرية، لا تعود التجزئة متطابقة، وتقوم rosetta بإعادة ترجمة هذا المفتاح في المزامنة التالية.

## `.rosettaignore`

قم بإنشاء `.rosettaignore` في جذر مشروعك لاستبعاد الملفات من فحص `lint`. يستخدم أنماط glob، مثل `.gitignore`:

```text title=".rosettaignore"
src/components/legacy/**
src/utils/constants.js
**/*.test.js
```

## دليل `.rosetta/`

تقوم Rosetta بإنشاء دليل `.rosetta/` في جذر مشروعك للحالة الداخلية. يجب عليك عمومًا **إضافة هذا إلى `.gitignore`** — فهو تحسين محلي، وليس مصدرًا للمشروع:

```gitignore
.rosetta/
```

| الملف | الغرض | إيداع (Commit)؟ |
|------|---------|--------|
| `tm.json` | ذاكرة التخزين المؤقت لذاكرة الترجمة (Translation Memory) — تخزن الترجمات السابقة مفهرسة بالنص المصدر + اللغة + الطريقة | لا (ذاكرة تخزين مؤقت محلية) |
| `xliff/*.xliff` | ملفات تصدير XLIFF لمراجعة المترجمين المحترفين | لا (مؤقت) |
| `methods/` | بيانات (manifests) المكونات الإضافية للطرق المثبتة | نعم (تكوين مشترك) |
| `backups/` | نسخ احتياطية قبل التغليف (تم إنشاؤها بواسطة `wrap --undo`) | لا (شبكة أمان) |

راجع [ذاكرة الترجمة](/docs/concepts/translation-memory) للحصول على تفاصيل حول `tm.json` وكيف توفر تكاليف API.

---

## واجهة برمجة التطبيقات البرمجية (Programmatic API)

بالنسبة للبرامج النصية للبناء (build scripts) والتكاملات المخصصة، قم بالاستيراد مباشرة من الحزمة:

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

### الصادرات المتاحة (Available Exports)

| التصدير | وظيفته |
|--------|-------------|
| `TranslationMethod` | الفئة الأساسية (Base class) لجميع الطرق |
| `LLMMethod` | الفئة الأساسية لطرق LLM (OpenRouter) |
| `DirectLLMMethod` | الفئة الأساسية لمزودي LLM المباشرين (OpenAI، Anthropic، Gemini) |
| `OpenAIMethod`، `AnthropicMethod`، `GeminiMethod` | فئات مزودي LLM المباشرين |
| `DeepLMethod`، `MicrosoftTranslatorMethod`، `LibreTranslateMethod` | فئات الترجمة الآلية (MT) التقليدية |
| `GoogleTranslateMethod` | Google Cloud Translation |
| `LLMCoachedMethod` | LLM موجه (OpenRouter + بيانات التوجيه) |
| `APIMethod` | عميل API عن بُعد |
| `runSync`، `runContentSync` | مسار المزامنة الكامل |
| `resolveConfig`، `resolvePairs` | تحليل التكوين |
| `validateTranslations` | بوابة الجودة |
| `loadCoachingData`، `findDictionaryMatches` | أدوات التوجيه المساعدة |

### امتداد مزود مخصص

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

ستحصل على الترجمة، والتوجيه، وحلقات إعادة المحاولة، والتحقق من صحة النموذج، ومستويات الجودة، والمساعدة في الإعداد مجانًا. شكل طلب HTTP فقط هو الذي يختلف حسب المزود. بالنسبة للمحولات غير المعتمدة على LLM والتي تستخدم `fetch()` الخام، استخدم المساعد المشترك `fetchWithRetry()` من `lib/methods/fetch-with-retry.js` بدلاً من كتابة حلقة إعادة المحاولة الخاصة بك.

---

## انظر أيضًا

- [مرجع واجهة سطر الأوامر (CLI)](/docs/reference/cli) — جميع الأوامر والعلامات
- [طرق الترجمة](/docs/guides/translation-methods) — اختيار وخلط الطرق
- [ذاكرة الترجمة](/docs/concepts/translation-memory) — التخزين المؤقت وتوفير التكاليف
- [العمل مع المترجمين المحترفين](/docs/guides/professional-translators) — سير عمل XLIFF
- [مواصفات المكون الإضافي](/docs/reference/plugin-spec) — تنسيق بيان المكون الإضافي للطريقة
- [البنية](/docs/concepts/architecture) — كيف تتصل الأجزاء ببعضها
- [اللغات المدعومة](/docs/reference/supported-languages) — دعم اللغات المدمج
- [كيف تعمل المزامنة](/docs/concepts/how-sync-works) — مسار الترجمة