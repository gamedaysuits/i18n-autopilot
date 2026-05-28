---
sidebar_position: 2
title: "مواصفات المكون الإضافي"
---
# مواصفات المكون الإضافي للطريقة

> **الإصدار**: 1.1  
> **الجمهور المستهدف**: مطورو المكونات الإضافية  
> **المخطط الأساسي**: [`schemas/rosetta-plugin.schema.json`](https://github.com/gamedaysuits/i18n-rosetta/blob/main/schemas/rosetta-plugin.schema.json)

## نظرة عامة

يستخدم i18n-rosetta **نظام طرق قابل للتوصيل** (pluggable method system). يمكن لكل زوج لغوي استخدام طريقة ترجمة مختلفة (LLM، أو موجهة (coached)، أو محول نصوص (script-converter)، إلخ). يتم تسجيل الطرق في `lib/translate.js` وتحديدها لكل زوج لغوي عبر `lib/pairs.js`.

تتمثل وظيفة بيئة التقييم (eval harness) في **تطوير، واختبار، وتصدير** طرق الترجمة. بينما تتمثل وظيفة i18n-rosetta في **استهلاكها وتنفيذها**. لا تعمل بيئة التقييم (harness) أبدًا داخل rosetta.

### تدفق البيانات

```mermaid
flowchart LR
    A["Evaluation Harness\n(Python / standalone)"] -->|"method.json\n+ coaching data"| B["i18n-rosetta\n(Node.js / npm)"]
```

---

## تنسيق المكون الإضافي للطريقة

المكون الإضافي للطريقة عبارة عن ملف JSON واحد (`method.json`) مع ملفات بيانات توجيه (coaching data) اختيارية.

### `method.json` — مطلوب

```json
{
  "name": "french-formal-v1",
  "type": "llm-coached",
  "version": "1.0.0",
  "description": "Formally-tuned French with terminology enforcement and grammar coaching",
  "author": "Plugin Author",

  "config": {
    "model": "google/gemini-3.5-flash",
    "register": "formal",
    "batchSize": 80,
    "temperature": 0.2
  },

  "locales": ["fr"],

  "benchmarks": {
    "fr": {
      "date": "2026-05-11T00:00:00Z",
      "corpus_size": 500,
      "exact_match_rate": 0.42,
      "corpus_chrf": 72.3,
      "corpus_bleu": 45.1,
      "model": "google/gemini-3.5-flash",
      "harness_version": "1.0.0"
    }
  },

  "provenance": {
    "resources": [],
    "commercialReady": false,
    "flags": ["license-unclear"]
  },

  "coaching": {
    "dir": "coaching"
  }
}
```

### مرجع الحقول

| الحقل | النوع | مطلوب | الوصف |
|-------|------|----------|-------------|
| `name` | string | ✅ | معرف فريد للطريقة (بصيغة kebab-case) |
| `type` | string | ✅ | نوع طريقة Rosetta: `llm`, `llm-coached`, `api`, `google-translate`, `deepl`, `microsoft-translator`, `libretranslate`, `openai`, `anthropic`, `gemini` |
| `version` | string | ✅ | إصدار Semver (مثل `1.0.0`) |
| `locales` | string[] | ✅ | رموز اللغات (locale codes) التي تستهدفها هذه الطريقة (1 كحد أدنى) |
| `description` | string | — | وصف مقروء للبشر |
| `author` | string | — | من قام بتطوير/اختبار هذه الطريقة |
| `config.model` | string | — | معرف نموذج OpenRouter |
| `config.register` | string | — | مستوى اللغة/النبرة (register/tone) للغة الهدف |
| `config.batchSize` | number | — | عدد المفاتيح لكل دفعة API (1–200، الافتراضي: 80) |
| `config.temperature` | number | — | درجة حرارة LLM (0.0–2.0، الافتراضي: 0.3) |
| `benchmarks` | object | — | نتائج التقييم (benchmark) لكل لغة |
| `provenance` | object | — | التراخيص وتبعيات الموارد |
| `coaching.dir` | string | — | المسار النسبي لدليل بيانات التوجيه (coaching data) |

### كائن التقييم (Benchmark Object) (لكل لغة)

| الحقل | النوع | مطلوب | الوصف |
|-------|------|----------|-------------|
| `date` | string | ✅ | طابع زمني بتنسيق ISO 8601 لتشغيل التقييم |
| `corpus_size` | number | ✅ | عدد الإدخالات التي تم تقييمها |
| `exact_match_rate` | number | ✅ | 0.0–1.0، نسبة التطابقات التامة (exact matches) |
| `corpus_chrf` | number | — | نتيجة chrF++ (0–100) |
| `corpus_bleu` | number | — | نتيجة BLEU (0–100) |
| `model` | string | ✅ | النموذج المستخدم أثناء التقييم |
| `harness_version` | string | ✅ | إصدار بيئة التقييم (evaluation harness) المستخدمة |

:::info ما هي المقاييس التي يتم عرضها؟
يعرض الأمر `rosetta status` **chrF++** و**معدل التطابق التام** من كتلة التقييم (benchmark). يتم قبول `corpus_bleu` في البيان (manifest) ولكنه لا يُعرض حاليًا أو يُستخدم بواسطة أي أمر في rosetta. تتتبع [لوحة صدارة الطرق](/leaderboard) (Method Leaderboard) مقاييس chrF++، والتطابق التام، ومعدل قبول FST.
:::

---

### كائن المصدر (Provenance Object)

تنقل كتلة المصدر (provenance) حالة الترخيص للموارد المجمعة في المكون الإضافي.

| الحقل | النوع | الافتراضي | الوصف |
|-------|------|---------|-------------|
| `resources` | object[] | `[]` | قائمة بالموارد المجمعة مع `name`، و`license`، و`type` |
| `commercialReady` | boolean | `false` | ما إذا كان المكون الإضافي مصرحًا به للتوزيع التجاري |
| `flags` | string[] | `["license-unclear"]` | علامات الحالة (status flags) المقروءة آليًا |

**الحالة الافتراضية** — يتم شحن المكونات الإضافية المُصدرة مع `commercialReady: false` و`flags: ["license-unclear"]`.

**الحالة المصرح بها (Cleared state)** — عند التحقق من الترخيص: قم بتعيين `commercialReady: true` وامسح العلامات.

---

## تنسيق بيانات التوجيه (Coaching Data)

إذا كان `type` هو `llm-coached`، فيجب أن يتضمن المكون الإضافي ملفات بيانات التوجيه في الدليل الفرعي `coaching/`.

### `coaching/<locale>.json`

```json
{
  "grammar_rules": [
    "French adjectives agree in gender and number with the noun they modify",
    "Use 'vous' for formal contexts, 'tu' for informal"
  ],
  "dictionary": {
    "dashboard": "tableau de bord",
    "deployment": "déploiement",
    "settings": "paramètres"
  },
  "style_notes": "Prefer active voice. Avoid anglicisms where a native French term exists."
}
```

| الحقل | النوع | مطلوب | الوصف |
|-------|------|----------|-------------|
| `grammar_rules` | string[] | — | القواعد التي يتم حقنها في كل مطالبة (prompt) لنموذج LLM لهذه اللغة |
| `dictionary` | object | — | خريطة المصطلحات → الترجمة. يتم حقن المصطلحات المتطابقة كمصطلحات مطلوبة. |
| `style_notes` | string | — | تعليمات أسلوب حرة (Freeform) تُلحق بالمطالبة |

---

## بنية الدليل

```
french-formal-v1/
  method.json                 # Method manifest with benchmarks
  coaching/
    fr.json                   # Coaching data for French
```

للطرق متعددة اللغات:

```
european-formal-v2/
  method.json                 # locales: ["fr", "de", "es", "it"]
  coaching/
    fr.json
    de.json
    es.json
    it.json
```

---

## كيف يستهلك Rosetta المكونات الإضافية

### التثبيت

```bash
i18n-rosetta plugin install ./french-formal-v1/
```

يتم الحفظ في `.rosetta/methods/french-formal-v1/`.

### التكوين

```json title="i18n-rosetta.config.json"
{
  "pairs": {
    "en:fr": {
      "methodPlugin": "french-formal-v1"
    }
  }
}
```

:::info دلالات الدمج (Merge semantics)
يحدد المكون الإضافي *ما هي* الطريقة التي يجب استخدامها (`type`). بينما يضبط تكوين الزوج اللغوي *كيفية* تشغيلها (`model`، `register`، `batchSize`). إذا قام الزوج اللغوي بتعيين `model`، فإنه يتجاوز الإعداد الافتراضي للمكون الإضافي.
:::

### وقت التشغيل (Runtime)

1. يقرأ Rosetta `method.json` من `.rosetta/methods/french-formal-v1/`
2. يحدد حقل `type` في المكون الإضافي طريقة الترجمة (مثل `llm-coached`)
3. يتم تحميل بيانات التوجيه من دليل `coaching/` الخاص بالمكون الإضافي
4. يستخدم كتلة `config` لسد الفجوات في النموذج/مستوى اللغة/درجة الحرارة
5. يتم عرض كتلة `benchmarks` في مخرجات `rosetta status`
6. يتم فحص كتلة `provenance` بواسطة `rosetta provenance` للبحث عن علامات الترخيص

---

## التحقق من صحة المخطط (Schema Validation)

يتم التحقق من صحة بيانات المكون الإضافي (manifests) وقت التثبيت مقابل [`schemas/rosetta-plugin.schema.json`](https://github.com/gamedaysuits/i18n-rosetta/blob/main/schemas/rosetta-plugin.schema.json).

قم بالإشارة إلى المخطط في `method.json` للحصول على الإكمال التلقائي في بيئة التطوير المتكاملة (IDE):

```json
{
  "$schema": "./node_modules/i18n-rosetta/schemas/rosetta-plugin.schema.json",
  "name": "my-method-v1"
}
```

---

## ما لا يجب تضمينه

- ❌ لا يوجد كود Python أو تبعيات لبيئة التقييم (harness dependencies)
- ❌ لا توجد بيانات مجموعة نصوص خام (raw corpus) أو سجلات تشغيل
- ❌ لا توجد مفاتيح API أو بيانات اعتماد
- ❌ لا يوجد تكوين لبيئة التقييم (harness configuration)
- ❌ لا توجد قوالب مطالبات داخلية (هذه توجد في تطبيقات طرق rosetta)

المكون الإضافي عبارة عن **بيانات فقط**: التكوين، ومحتوى التوجيه، ونتائج التقييم.

---

## انظر أيضًا

- [طرق الترجمة](/docs/guides/translation-methods) — كيف تعمل كل طريقة مدمجة
- [التكوين](/docs/getting-started/configuration) — تكوين كل زوج لغوي وكل لغة
- [تقديم طريقة عبر API](/docs/guides/serving-a-method) — استضافة الطرق كخدمات HTTP
- [دليل الوصفات: مسار عمل مقيد بـ FST](https://mtevalarena.org/docs/tutorials/fst-gated-pipeline) — بناء وتعبئة مسار العمل (pipeline)
- [تقييم الترجمة الآلية (MT Evaluation)](https://mtevalarena.org/docs/leaderboard/rules) — تقييم الطرق لتقديمها إلى لوحة الصدارة
- [دعم لغة منخفضة الموارد](https://mtevalarena.org/docs/community/low-resource-languages) — حالة الاستخدام للمكونات الإضافية المجتمعية