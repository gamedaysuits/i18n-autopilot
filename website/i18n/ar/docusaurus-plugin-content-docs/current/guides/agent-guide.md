---
sidebar_position: 9
title: "دليل الـ Agent: استخدام i18n-rosetta"
description: "كيف يمكن لـ AI agents تثبيت i18n-rosetta وتهيئته وتشغيله لترجمة ملفات الـ locale."
---
# دليل الوكيل: استخدام i18n-rosetta

i18n-rosetta هي أداة واجهة سطر أوامر (CLI) تترجم ملفات اللغة (locale files) لتطبيقك بأمر واحد. هذا الدليل مخصص لوكلاء الذكاء الاصطناعي (أو المطورين الذين يعملون مع وكلاء الذكاء الاصطناعي) الذين يرغبون في الانتقال من الصفر إلى ملفات لغة مترجمة بسرعة.

:::tip هل أنت على دراية مسبقة؟
إذا كنت تحتاج فقط إلى الأوامر، فانتقل إلى [مرجع واجهة سطر الأوامر (CLI)](/docs/reference/cli). أما إذا كنت ترغب في بناء طريقة ترجمة وقياس أدائها، فراجع [دليل وكيل Arena](https://mtevalarena.org/docs/getting-started/agent-guide).
:::

---

## إعداد بيئة العمل

```bash
# No global install needed — npx runs it directly
npx i18n-rosetta sync
```

**المتطلبات:**
- Node.js 18+
- مفتاح واجهة برمجة التطبيقات (API key) لمزود خدمة الترجمة الخاص بك

**إعداد مفتاح واجهة برمجة التطبيقات (API key)** — تحتاج rosetta إلى مفتاح واحد على الأقل بناءً على الطرق التي تستخدمها:

```bash
# Option 1: export (session only)
export OPENROUTER_API_KEY="sk-or-..."        # for llm / llm-coached methods
export GOOGLE_TRANSLATE_API_KEY="AIza..."    # for google-translate method

# Option 2: .env file in your project root (persistent, gitignored)
echo 'OPENROUTER_API_KEY=sk-or-...' > .env
```

تقرأ Rosetta `.env` تلقائيًا. احصل على مفتاح OpenRouter من [openrouter.ai/keys](https://openrouter.ai/keys).

---

## المزامنة الأولى

تكتشف Rosetta تلقائيًا ملفات اللغة الخاصة بك، وتنسيقها (JSON، TOML، YAML، PO)، واللغات المستهدفة:

```bash
npx i18n-rosetta sync
```

**ماذا يحدث:**
1. تحميل `i18n-rosetta.config.json` (أو اكتشاف الإعدادات تلقائيًا)
2. فحص ملف اللغة المصدر، وتسطيح المفاتيح المتداخلة (flattening nested keys)
3. المقارنة مع `.i18n-rosetta.lock` (تجزئات SHA-256 للقيم المترجمة مسبقًا)
4. التحقق من `.rosetta/tm.json` بحثًا عن الترجمات المخبأة (ذاكرة الترجمة)
5. ترجمة **المفاتيح المتغيرة أو المفقودة أو القديمة** فقط عبر الطريقة المكونة
6. تشغيل بوابة الجودة (5 فحوصات) على كل ترجمة
7. كتابة الترجمات الناجحة في ملف اللغة المستهدف
8. تحديث ملف القفل (lock file) وذاكرة التخزين المؤقت لذاكرة الترجمة (TM cache)

في عملية إعادة التشغيل النموذجية بعد تغيير مفتاح واحد، تقدم الخطوة 4 عدد 142 مفتاحًا من ذاكرة التخزين المؤقت وتترجم الخطوة 5 مفتاحًا واحدًا. ولهذا السبب تكون عمليات المزامنة اللاحقة سريعة ومنخفضة التكلفة.

---

## الإعدادات (Configuration)

قم بإنشاء `i18n-rosetta.config.json` في المسار الجذري لمشروعك:

```json
{
  "inputLocale": "en",
  "pairs": {
    "en-fr": { "method": "llm-coached" },
    "en-ja": { "method": "google-translate" },
    "en-crk": { "method": "api", "endpoint": "http://localhost:3000/translate" }
  }
}
```

الحقول الرئيسية:

| الحقل | الغرض | الافتراضي |
|-------|---------|---------|
| `inputLocale` | اللغة المصدر | `en` |
| `pairs` | خريطة (Map) للغات المصدر→الهدف مع إعدادات الطريقة | (مطلوب) |
| `localesDir` | مكان وجود ملفات اللغة | (مكتشف تلقائيًا) |
| `model` | نموذج LLM لطرق `llm`/`llm-coached` | `google/gemini-2.5-flash` |
| `batchSize` | عدد المفاتيح لكل استدعاء API | 80 (LLM)، 128 (Google) |
| `jsonConcurrency` | ترجمات اللغة المتوازية لمفاتيح JSON | 200 |
| `contentConcurrency` | استدعاءات API المتوازية لترجمة المحتوى | 48 |

المرجع الكامل: [الإعدادات](/docs/getting-started/configuration)

---

## طرق الترجمة

| الطريقة | متى تستخدمها | التكلفة | مفتاح API المطلوب |
|--------|------------|------|---------------|
| **`llm`** | للأغراض العامة، جيدة للغات ذات الموارد الوفيرة | لكل رمز (حسب النموذج) | `OPENROUTER_API_KEY` |
| **`llm-coached`** | عندما يكون لديك قواعد نحوية/قاموس للغة المستهدفة | لكل رمز + سياق التوجيه (coaching context) | `OPENROUTER_API_KEY` |
| **`google-translate`** | اللغات ذات الموارد الوفيرة حيث تعمل GT بشكل جيد | 20 دولارًا/مليون حرف | `GOOGLE_TRANSLATE_API_KEY` |
| **`api`** | مسار مخصص مستضاف خلف نقطة نهاية HTTP | يحدده الخادم | لا يوجد (تتولى نقطة النهاية المصادقة) |
| **`plugin`** | طريقة مجهزة مسبقًا ومثبتة محليًا | متفاوتة | متفاوت |

التفاصيل: [طرق الترجمة](/docs/guides/translation-methods)

---

## بيانات التوجيه (Coaching Data)

بالنسبة لأزواج `llm-coached`، تقوم بيانات التوجيه بتوجيه نموذج LLM بمعرفة لغوية صريحة. قم بإنشاء ملف توجيه:

```json title="coaching/fr.json"
{
  "grammar_rules": [
    "Use formal register (vous) for all UI text",
    "Adjectives agree in gender and number with the noun"
  ],
  "dictionary": {
    "dashboard": "tableau de bord",
    "settings": "paramètres"
  },
  "style_notes": "Prefer active voice. Avoid anglicisms."
}
```

أشر إليه في إعدادات الزوج (pair config) الخاص بك:

```json
"en-fr": { "method": "llm-coached", "coachingFile": "coaching/fr.json" }
```

تتحقق بوابة الجودة (quality gate) من ظهور مصطلحات القاموس فعليًا في المخرجات — تُسجل الانتهاكات كتحذيرات `[TERM]`.

التفاصيل: [بيانات التوجيه](/docs/concepts/coaching-data)

---

## بوابة الجودة (Quality Gate)

تمر كل ترجمة عبر خمسة فحوصات آلية قبل كتابتها على القرص:

| الفحص | ما يكتشفه | مثال |
|-------|----------------|---------|
| **فارغ/خالٍ (Empty/blank)** | لم يُرجع النموذج أي شيء | `""` |
| **صدى المصدر (Source echo)** | أرجع النموذج المدخلات الإنجليزية دون تغيير | `"Welcome"` للغة اليابانية |
| **حلقة الهلوسة (Hallucination loop)** | تكرار الثلاثيات (trigrams) | `"Qo' Qo' Qo' Qo'"` |
| **تضخم الطول (Length inflation)** | المخرجات أطول بـ 4 أضعاف أو أكثر من المصدر | مصدر من 10 أحرف ← مخرجات من 50 حرفًا |
| **الامتثال للنص (Script compliance)** | نص خاطئ للغة المحددة | نص لاتيني للغة العربية |

تُسجل حالات الفشل ببادئة `[GATE]`. لا توجد بدائل صامتة — إذا فشلت الترجمة، يتم الإبلاغ عنها، ولا تُقبل بصمت.

التفاصيل: [بوابة الجودة](/docs/concepts/quality-gate)

---

## ذاكرة الترجمة (Translation Memory)

تُخزن Rosetta الترجمات مؤقتًا في `.rosetta/tm.json`، مفهرسة بواسطة النص المصدر + اللغة + الطريقة. في عمليات المزامنة اللاحقة، يتم تقديم المفاتيح غير المتغيرة من ذاكرة التخزين المؤقت — بدون استدعاء API، وبدون تكلفة.

```
[TM] 142 key(s) served from cache
Translating 3 key(s) to French (llm)... [OK]
```

لتجاوز ذاكرة التخزين المؤقت لتشغيل واحد: `npx i18n-rosetta sync --no-tm`

التفاصيل: [ذاكرة الترجمة](/docs/concepts/translation-memory)

---

## الملفات المُنشأة

تُنشئ Rosetta عدة ملفات في مشروعك. تعرف عليها حتى لا تحذفها أو تودعها (commit) بالخطأ:

| الملف | الغرض | Git؟ |
|------|---------|------|
| `.i18n-rosetta.lock` | تجزئات SHA-256 لقيم المصدر المترجمة (لاكتشاف التغييرات) | **نعم** — قم بإيداع هذا (commit) |
| `.i18n-rosetta-content.lock` | نفس الشيء، ولكن لملفات محتوى Markdown/MDX | **نعم** — قم بإيداع هذا |
| `.rosetta/tm.json` | ذاكرة التخزين المؤقت لذاكرة الترجمة | **نعم** — قم بإيداع هذا (يوفر تكاليف API للفريق) |
| `.rosetta/coaching/` | دليل بيانات التوجيه | **نعم** — هذه هي معرفتك اللغوية |
| `i18n-rosetta.config.json` | إعدادات المشروع | **نعم** — قم بإيداع هذا |

---

## الأنماط الشائعة

**ترجمة زوج لغوي واحد:**
```bash
npx i18n-rosetta sync --pair en-fr
```

**ترجمة جميع الأزواج المكونة:**
```bash
npx i18n-rosetta sync
```
تترجم Rosetta جميع اللغات بالتوازي. بفضل التخزين المؤقت لذاكرة الترجمة (TM caching)، فإن المفاتيح المتغيرة فقط هي التي تستدعي واجهة برمجة التطبيقات (API).

**وضع المحتوى (Markdown/MDX لـ Docusaurus و Hugo وما إلى ذلك):**
```bash
npx i18n-rosetta sync --content
```
يترجم المستندات، ومنشورات المدونة، وملفات المحتوى جنبًا إلى جنب مع ملفات JSON للغة. يستخدم التزامن المتوازي (الافتراضي: 48 استدعاء API متزامن). يمكنك ضبطه باستخدام `--content-concurrency`.

**التشغيل التجريبي (معاينة بدون كتابة):**
```bash
npx i18n-rosetta sync --dry-run
```

**فرض إعادة ترجمة مفاتيح محددة:**
```bash
npx i18n-rosetta sync --force-keys "hero.title,nav.about"
```

**فرض إعادة ترجمة جميع ملفات المحتوى:**
```bash
npx i18n-rosetta sync --force-content
```

**التحقق من حالة الترجمة:**
```bash
npx i18n-rosetta status
```
يعرض التغطية، ومستويات الجودة، ومعلومات الإضافات (plugin info) لكل زوج.

**التدقيق بحثًا عن البدائل غير المترجمة (untranslated fallbacks):**
```bash
npx i18n-rosetta audit
```
يسرد جميع قيم `[EN]` البديلة التي تحتاج إلى ترجمة.

---

## استكشاف الأخطاء وإصلاحها

| المشكلة | الحل |
|---------|-----|
| `OPENROUTER_API_KEY not set` | قم بتصدير المفتاح أو إضافته إلى `.env` في المسار الجذري لمشروعك |
| `No locale files found` | قم بتعيين `localesDir` في الإعدادات، أو تأكد من أن ملفات اللغة الخاصة بك تتطابق مع التسمية القياسية (`en.json`، `fr.json`) |
| `[GATE] Script compliance failed` | حصلت لغتك المستهدفة على نص لاتيني بدلاً من النص المتوقع — جرب نموذجًا مختلفًا أو أضف بيانات توجيه |
| `[GATE] Source echo` | أرجع النموذج اللغة الإنجليزية دون تغيير — عادةً ما تؤدي بيانات التوجيه أو استخدام نموذج مختلف إلى إصلاح ذلك |
| جميع الترجمات مخزنة مؤقتًا | قم بالتشغيل مع `--no-tm` لتجاوز ذاكرة التخزين المؤقت، أو `--force-keys` لمفاتيح محددة |
| تعارضات ملف القفل (Lock file conflicts) | يستخدم `.i18n-rosetta.lock` تجزئات SHA-256 — من الآمن حل تعارضات الدمج (merge conflicts) بالاحتفاظ بأي من الإصدارين، ثم إعادة تشغيل المزامنة |

---

## الخطوات التالية

- [البدء السريع](/docs/getting-started/quick-start) — دليل شامل للبدء
- [مرجع واجهة سطر الأوامر (CLI)](/docs/reference/cli) — كل أمر وعلامة (flag)
- [كيف تعمل الأداة](/docs/how-it-works) — شرح مسار المزامنة
- [جسر Eval Harness](/docs/guides/bridge) — كيف تتصل rosetta بـ Arena
- **هل تريد بناء طريقة الترجمة الخاصة بك؟** راجع [دليل وكيل Arena](https://mtevalarena.org/docs/getting-started/agent-guide) — ابْنِ طريقة، وأثبت فعاليتها، واربح الجوائز.