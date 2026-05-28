---
sidebar_position: 9
title: "دليل Agent: استخدام i18n-rosetta"
description: "كيف يمكن لـ AI agents تثبيت وإعداد وتشغيل i18n-rosetta لترجمة locale files."
---
# دليل الوكيل: استخدام i18n-rosetta

i18n-rosetta هي أداة سطر أوامر (CLI) تترجم ملفات الترجمة (locale files) الخاصة بتطبيقك بأمر واحد. هذا الدليل مخصص لوكلاء الذكاء الاصطناعي (أو المطورين الذين يعملون مع وكلاء الذكاء الاصطناعي) الذين يرغبون في الانتقال من الصفر إلى ملفات ترجمة جاهزة بسرعة.

:::tip هل أنت على دراية بها بالفعل؟
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

**إعداد مفتاح API** — تحتاج rosetta إلى مفتاح واحد على الأقل بناءً على الطرق التي تستخدمها:

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

تكتشف Rosetta تلقائيًا ملفات الترجمة الخاصة بك، وتنسيقها (JSON، TOML، YAML، PO)، واللغات المستهدفة:

```bash
npx i18n-rosetta sync
```

**ماذا يحدث:**
1. تحميل `i18n-rosetta.config.json` (أو اكتشاف الإعدادات تلقائيًا)
2. فحص ملف الترجمة المصدر، وتسطيح المفاتيح المتداخلة (flattening)
3. المقارنة مع `.i18n-rosetta.lock` (تجزئات SHA-256 للقيم المترجمة سابقًا)
4. التحقق من `.rosetta/tm.json` بحثًا عن الترجمات المخزنة مؤقتًا (ذاكرة الترجمة)
5. ترجمة **المفاتيح المتغيرة أو المفقودة أو القديمة** فقط عبر الطريقة المكونة
6. تشغيل بوابة الجودة (5 فحوصات) على كل ترجمة
7. كتابة الترجمات الناجحة في ملف الترجمة المستهدف
8. تحديث ملف القفل (lock file) وذاكرة التخزين المؤقت لذاكرة الترجمة (TM cache)

في عملية إعادة التشغيل النموذجية بعد تغيير مفتاح واحد، تقدم الخطوة 4 عدد 142 مفتاحًا من ذاكرة التخزين المؤقت وتترجم الخطوة 5 مفتاحًا واحدًا. هذا هو السبب في أن عمليات المزامنة اللاحقة تكون سريعة وغير مكلفة.

---

## الإعدادات

قم بإنشاء `i18n-rosetta.config.json` في الجذر الخاص بمشروعك:

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
| `pairs` | خريطة (Map) من المصدر→الهدف مع إعدادات الطريقة | (مطلوب) |
| `localesDir` | مسار ملفات الترجمة | (يتم اكتشافه تلقائيًا) |
| `model` | نموذج LLM لطرق `llm`/`llm-coached` | `google/gemini-2.5-flash` |
| `batchSize` | عدد المفاتيح لكل استدعاء API | 80 (LLM)، 128 (Google) |
| `jsonConcurrency` | الترجمات المتوازية لمفاتيح JSON | 50 |
| `contentConcurrency` | استدعاءات API المتوازية لترجمة المحتوى | 12 |

المرجع الكامل: [الإعدادات](/docs/getting-started/configuration)

---

## طرق الترجمة

| الطريقة | متى تستخدمها | التكلفة | مفتاح API المطلوب |
|--------|------------|------|---------------|
| **`llm`** | للأغراض العامة، جيدة للغات ذات الموارد الوفيرة | لكل رمز (حسب النموذج) | `OPENROUTER_API_KEY` |
| **`llm-coached`** | عندما يكون لديك قواعد نحوية/قاموس للغة المستهدفة | لكل رمز + سياق التوجيه (coaching context) | `OPENROUTER_API_KEY` |
| **`google-translate`** | اللغات ذات الموارد الوفيرة حيث تعمل ترجمة جوجل (GT) بشكل جيد | 20 دولارًا/مليون حرف | `GOOGLE_TRANSLATE_API_KEY` |
| **`api`** | مسار مخصص (pipeline) مستضاف خلف نقطة نهاية HTTP | يحددها الخادم | لا يوجد (نقطة النهاية تتعامل مع المصادقة) |
| **`plugin`** | طريقة مجهزة مسبقًا ومثبتة محليًا | متفاوتة | متفاوتة |

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

قم بالإشارة إليه في إعدادات الزوج اللغوي الخاص بك:

```json
"en-fr": { "method": "llm-coached", "coachingFile": "coaching/fr.json" }
```

تتحقق بوابة الجودة من ظهور مصطلحات القاموس فعليًا في المخرجات — ويتم تسجيل الانتهاكات كتحذيرات `[TERM]`.

التفاصيل: [بيانات التوجيه](/docs/concepts/coaching-data)

---

## بوابة الجودة

تمر كل ترجمة عبر خمسة فحوصات آلية قبل كتابتها على القرص:

| الفحص | ما يكتشفه | مثال |
|-------|----------------|---------|
| **فارغ/خالٍ (Empty/blank)** | لم يُرجع النموذج أي شيء | `""` |
| **صدى المصدر (Source echo)** | أرجع النموذج المدخل الإنجليزي دون تغيير | `"Welcome"` للغة اليابانية |
| **حلقة الهلوسة (Hallucination loop)** | تكرار الثلاثيات (trigrams) | `"Qo' Qo' Qo' Qo'"` |
| **تضخم الطول (Length inflation)** | المخرجات أطول بـ 4 أضعاف أو أكثر من المصدر | مصدر من 10 أحرف ← مخرجات من 50 حرفًا |
| **التوافق مع نظام الكتابة (Script compliance)** | نظام كتابة خاطئ للغة | نص لاتيني للغة العربية |

يتم تسجيل حالات الفشل ببادئة `[GATE]`. لا توجد بدائل صامتة — إذا فشلت الترجمة، يتم الإبلاغ عنها، ولا يتم قبولها بصمت.

التفاصيل: [بوابة الجودة](/docs/concepts/quality-gate)

---

## ذاكرة الترجمة

تقوم Rosetta بتخزين الترجمات مؤقتًا في `.rosetta/tm.json`، مفهرسة بواسطة النص المصدر + اللغة + الطريقة. في عمليات المزامنة اللاحقة، يتم تقديم المفاتيح غير المتغيرة من ذاكرة التخزين المؤقت — بدون استدعاء API، وبدون تكلفة.

```
[TM] 142 key(s) served from cache
Translating 3 key(s) to French (llm)... [OK]
```

لتجاوز ذاكرة التخزين المؤقت لتشغيل واحد: `npx i18n-rosetta sync --no-tm`

التفاصيل: [ذاكرة الترجمة](/docs/concepts/translation-memory)

---

## الملفات المُنشأة

تُنشئ Rosetta عدة ملفات في مشروعك. تعرف على ماهيتها حتى لا تقوم بحذفها أو إيداعها (commit) عن طريق الخطأ:

| الملف | الغرض | Git؟ |
|------|---------|------|
| `.i18n-rosetta.lock` | تجزئات SHA-256 لقيم المصدر المترجمة (لاكتشاف التغييرات) | **نعم** — قم بإيداع هذا الملف |
| `.i18n-rosetta-content.lock` | نفس الشيء، ولكن لملفات محتوى Markdown/MDX | **نعم** — قم بإيداع هذا الملف |
| `.rosetta/tm.json` | ذاكرة التخزين المؤقت لذاكرة الترجمة | **نعم** — قم بإيداع هذا الملف (يوفر تكاليف API للفريق) |
| `.rosetta/coaching/` | دليل بيانات التوجيه | **نعم** — هذه هي معرفتك اللغوية |
| `i18n-rosetta.config.json` | إعدادات المشروع | **نعم** — قم بإيداع هذا الملف |

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
تترجم Rosetta جميع اللغات بالتوازي. مع التخزين المؤقت لذاكرة الترجمة (TM)، فإن المفاتيح المتغيرة فقط هي التي تستدعي واجهة برمجة التطبيقات (API).

**وضع المحتوى (Markdown/MDX لـ Docusaurus و Hugo وما إلى ذلك):**
```bash
npx i18n-rosetta sync --content
```
يترجم المستندات، ومنشورات المدونة، وملفات المحتوى جنبًا إلى جنب مع ملفات JSON للترجمة. يستخدم التزامن المتوازي (الافتراضي: 12 استدعاء API متزامن). يمكنك ضبطه باستخدام `--content-concurrency`.

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
يعرض التغطية، ومستويات الجودة، ومعلومات الإضافات (plugins) لكل زوج.

**تدقيق القيم الاحتياطية غير المترجمة (untranslated fallbacks):**
```bash
npx i18n-rosetta audit
```
يسرد جميع القيم الاحتياطية `[EN]` التي تحتاج إلى ترجمة.

---

## استكشاف الأخطاء وإصلاحها

| المشكلة | الحل |
|---------|-----|
| `OPENROUTER_API_KEY not set` | قم بتصدير المفتاح أو إضافته إلى `.env` في جذر مشروعك |
| `No locale files found` | قم بتعيين `localesDir` في الإعدادات، أو تأكد من أن ملفات الترجمة الخاصة بك تتطابق مع التسمية القياسية (`en.json`، `fr.json`) |
| `[GATE] Script compliance failed` | حصلت لغتك المستهدفة على نص لاتيني بدلاً من نظام الكتابة المتوقع — جرب نموذجًا مختلفًا أو أضف بيانات توجيه |
| `[GATE] Source echo` | أرجع النموذج اللغة الإنجليزية دون تغيير — عادةً ما تؤدي بيانات التوجيه أو استخدام نموذج مختلف إلى إصلاح ذلك |
| جميع الترجمات مخزنة مؤقتًا | قم بالتشغيل مع `--no-tm` لتجاوز ذاكرة التخزين المؤقت، أو `--force-keys` لمفاتيح محددة |
| تعارضات ملف القفل (Lock file conflicts) | يستخدم `.i18n-rosetta.lock` تجزئات SHA-256 — من الآمن حل تعارضات الدمج (merge conflicts) عن طريق الاحتفاظ بأي من الإصدارين، ثم إعادة تشغيل المزامنة |

---

## الخطوات التالية

- [البداية السريعة](/docs/getting-started/quick-start) — دليل شامل للبدء
- [مرجع واجهة سطر الأوامر (CLI)](/docs/reference/cli) — كل أمر وعلامة (flag)
- [كيف تعمل الأداة](/docs/how-it-works) — شرح مسار المزامنة
- [جسر Eval Harness](/docs/guides/bridge) — كيف تتصل rosetta بـ Arena
- **هل ترغب في بناء طريقة الترجمة الخاصة بك؟** راجع [دليل وكيل Arena](https://mtevalarena.org/docs/getting-started/agent-guide) — قم ببناء طريقة، وأثبت فعاليتها، واربح جوائز.