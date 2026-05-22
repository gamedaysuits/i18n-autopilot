---
sidebar_position: 5
title: "بيانات التوجيه"
---
# بيانات التوجيه

تُعد بيانات التوجيه آلية rosetta لتعليم نماذج اللغات الكبيرة (LLMs) لغات لم يتم تدريبها عليها. من خلال توفير القواعد النحوية، والقواميس، وملاحظات الأسلوب جنبًا إلى جنب مع كل طلب ترجمة، يمكنك تحويل نموذج لغة كبير (LLM) عام الأغراض إلى مترجم مدرك للسياق لأي لغة — بما في ذلك اللغات التي لا تحظى بأي دعم حالي في الترجمة الآلية (MT).

## كيف تعمل

عندما تقوم بتعيين طريقة الزوج إلى `llm-coached`، يقوم rosetta بتحميل ملف توجيه من `.rosetta/coaching/<locale>.json` ويدرج محتوياته في كل مطالبة (prompt) موجهة إلى LLM كجزء من رسالة النظام. يرى LLM قواعدك اللغوية جنبًا إلى جنب مع طلب الترجمة، مما ينتج عنه مخرجات تتبع قواعدك النحوية ومصطلحاتك بدلاً من التخمين.

```
┌──────────────────────────────────────────────────────┐
│ System Message (cached across batches)               │
│ ┌──────────────────────────────────────────────────┐ │
│ │ Base translation rules                           │ │
│ │ + Register instructions                          │ │
│ │ + Grammar rules (from coaching data)             │ │
│ │ + Dictionary entries (from coaching data)         │ │
│ │ + Style notes (from coaching data)               │ │
│ └──────────────────────────────────────────────────┘ │
├──────────────────────────────────────────────────────┤
│ User Message (per batch)                             │
│ ┌──────────────────────────────────────────────────┐ │
│ │ Keys to translate (JSON)                         │ │
│ └──────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────┘
```

نظرًا لأن بيانات التوجيه تعد جزءًا من رسالة النظام، فإنها تستفيد من **التخزين المؤقت للمطالبات (prompt caching)** — حيث يقوم مزودون مثل Anthropic و Google بتخزين بادئات النظام المتكررة مؤقتًا، لذلك لن تدفع مقابل سياق التوجيه سوى مرة واحدة لكل جلسة، وليس مرة واحدة لكل دفعة.

## تنسيق ملف التوجيه

قم بإنشاء ملف JSON واحد لكل لغة محلية (locale) في `.rosetta/coaching/`:

```json title=".rosetta/coaching/crk.json"
{
  "grammar_rules": [
    "Plains Cree is polysynthetic — a single word can express what English needs a full sentence for",
    "Animate/inanimate noun distinction affects verb conjugation",
    "Use SRO (Standard Roman Orthography) unless script converter handles conversion",
    "Verb stems are modified by prefixes and suffixes to indicate person, number, tense, and evidentiality"
  ],
  "dictionary": {
    "home": "kīwēwin",
    "settings": "isi-nākatohkēwin",
    "search": "nānātawāpahtam",
    "welcome": "tānisi",
    "submit": "ispīhci",
    "cancel": "pōni"
  },
  "style_notes": "Use formal register. Preserve English technical terms in parentheses when no Cree equivalent exists. Avoid loanwords when a descriptive Cree expression exists."
}
```

### الحقول

| الحقل | النوع | مطلوب | الوصف |
|-------|------|----------|-------------|
| `grammar_rules` | `string[]` | لا | مصفوفة من القواعد النحوية المدرجة في مطالبة النظام. يجب أن تكون كل قاعدة عبارة عن تعليمات موجزة وقابلة للتنفيذ يمكن لـ LLM اتباعها. |
| `dictionary` | `object` | لا | خريطة مفتاح-قيمة (Key-value map) للمصطلح الإنجليزي ← مصطلح اللغة الهدف. تُستخدم للمفردات الخاصة بمجال معين والتي قد لا يعرفها LLM. |
| `style_notes` | `string` | لا | تعليمات أسلوبية حرة (مستوى اللغة، النبرة، أعراف الرسمية). |

جميع الحقول اختيارية — يمكنك البدء بقاموس فقط وإضافة القواعد النحوية أثناء التحسين.

## السلوك الاحتياطي

إذا تم تكوين زوج لـ `llm-coached` ولكن لا يوجد ملف توجيه لتلك اللغة المحلية، فإن rosetta **يعود إلى الطريقة القياسية `llm`** مع ظهور تحذير في وحدة التحكم (console):

```
[INFO] No coaching data for "crk" at .rosetta/coaching/crk.json
       Falling back to standard LLM method. Create coaching data for better results.
```

هذا يعني أنه يمكنك تعيين `"defaultMethod": "llm-coached"` بأمان على مستوى النظام (globally) — حيث ستستخدمه اللغات التي تحتوي على بيانات توجيه، وستحصل باقي اللغات على ترجمة LLM القياسية دون أخطاء.

## متى تستخدم التوجيه

| السيناريو | الطريقة الموصى بها |
|----------|-------------------|
| لغات المستوى الأول (الفرنسية، الإسبانية، الألمانية) | `llm` أو `google-translate` — تعرف نماذج LLMs هذه اللغات جيدًا بالفعل |
| لغات المستوى الثاني (الكورية، التركية، التايلاندية) | `llm` مع تحديد مستوى اللغة (register) — تتعامل نماذج LLMs مع هذه اللغات بشكل مناسب مع وجود توجيه أسلوبي |
| لغات المستوى الثالث (الكري السهول، اليوروبا، الكيتشوا) | `llm-coached` — تحتاج نماذج LLMs إلى قواعد نحوية وقواميس |
| اللغات المصطنعة (الكلينغون، السندارين، الكريبتونيان) | `llm-coached` — تمتلك نماذج LLMs بعض بيانات التدريب ولكنها تحتاج إلى تصحيحات |

## بناء بيانات توجيه جيدة

### القواعد النحوية

اكتب القواعد في شكل **تعليمات**، وليس أوصافًا. يتبع LLM التعليمات بشكل أفضل من تفسيره للنظريات اللغوية.

```json
// ❌ Descriptive (the LLM learns nothing actionable)
"Plains Cree has animate and inanimate noun classes"

// ✅ Instructive (the LLM knows what to do)
"When translating nouns, check whether the Cree equivalent is animate (NA) or inanimate (NI) — this affects which verb conjugation to use"
```

### القواميس

ركز على **المصطلحات الخاصة بالمجال** التي قد يخطئ فيها LLM أو يبتكرها. لا تهتم بالكلمات الشائعة التي يتعامل معها LLM بالفعل — بل ركز على المصطلحات الخاصة بواجهة مستخدم تطبيقك.

### ملاحظات الأسلوب

كن محددًا بشأن مستوى اللغة، والرسمية، والأعراف:

```json
"style_notes": "Use formal register (vous-form in French). Preserve brand names untranslated. UI labels should be imperative mood ('Save', not 'Saves'). Maximum 40 characters for button text."
```

## اختبار الترجمات الموجهة

استخدم [MT Eval Harness](https://github.com/gamedaysuits/gds-mt-eval-harness) لقياس أداء ترجماتك الموجهة ومقارنتها بمجموعة نصوص مرجعية (reference corpus):

```bash
# Install the harness
pip install mt-eval-harness

# Run coached translations against your test corpus
mt-eval run --corpus data/crk-corpus.json --model google/gemini-2.5-pro

# Score the results
mt-eval test eval/logs/run_*.json
```

يمنحك هذا درجات chrF++، و BLEU، والتطابق التام (exact match). قم بإنشاء إصدارات متعددة من ملف التوجيه وقارن بينها — فالمقاييس الموضوعية تتفوق على المراجعة الذاتية.

## انظر أيضًا

- [اللغات منخفضة الموارد](/docs/guides/low-resource-languages) — دليل شامل لبناء مسار ترجمة من الصفر
- [طرق الترجمة](/docs/guides/translation-methods) — مقارنة بين جميع الطرق المتاحة
- [بناء مكون إضافي](/docs/tutorials/build-a-plugin) — حزم طريقة موجهة كمكون إضافي قابل لإعادة الاستخدام