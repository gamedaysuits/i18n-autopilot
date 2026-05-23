# i18n-rosetta

[![npm version](https://img.shields.io/npm/v/i18n-rosetta.svg)](https://www.npmjs.com/package/i18n-rosetta)
[![CI](https://github.com/gamedaysuits/i18n-rosetta/actions/workflows/ci.yml/badge.svg)](https://github.com/gamedaysuits/i18n-rosetta/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

🌐 **ترجمات README** — *مترجمة بواسطة Rosetta، بالطبع:*
[Français](docs/README.fr.md) · [Deutsch](docs/README.de.md) · [Español](docs/README.es.md) · [Português](docs/README.pt.md) · [Nederlands](docs/README.nl.md) · [日本語](docs/README.ja.md) · [한국어](docs/README.ko.md) · [简体中文](docs/README.zh.md) · [ไทย](docs/README.th.md) · [Tiếng Việt](docs/README.vi.md) · [Filipino](docs/README.fil.md) · [العربية](docs/README.ar.md)

ترجموا ملفاتكم المحلية بأمر واحد:

```bash
npx i18n-rosetta sync
```

يكتشف Rosetta تلقائيًا ملفاتكم المحلية، وتنسيقها، واللغات المستهدفة. يترجم المفاتيح المفقودة، ويتخطى ما تم إنجازه بالفعل، ويكتب النتائج. هذا كل شيء.

## لماذا لا تقومون ببرمجتها بأنفسكم؟

يمكنكم كتابة نص برمجي سريع يتنقل عبر مفاتيحكم الإنجليزية ويستدعي Google Translate. معظم المطورين يفعلون ذلك — يستغرق حوالي 30 سطرًا. إليكم سبب فشله:

- **لا يوجد اكتشاف للتغيير.** عندما تقومون بتحديث سلسلة إنجليزية، تظل الترجمة قديمة إلى الأبد. يتتبع Rosetta كل قيمة مصدر باستخدام تجزئات SHA-256 ويعيد ترجمة ما تغير فقط.
- **لا يوجد تجميع.** استدعاء API واحد لكل مفتاح يعني 200 مفتاح = 200 رحلة ذهاب وعودة. يقوم Rosetta بالتجميع بذكاء (قابل للتكوين، الافتراضي 30 مفتاحًا/دفعة لـ LLM، و 128 لـ Google).
- **لا يوجد بوابة جودة.** الترجمة الآلية تهلوس، أو تعيد المصدر، أو تخرج بنص خاطئ. يتحقق Rosetta من كل ترجمة قبل كتابتها — يتم اكتشاف ورفض النصوص الخاطئة، وتضخم الطول، وإعادة المصدر.
- **لا يوجد وعي بالتنسيق.** هل هو مبرمج بشكل ثابت لـ JSON؟ يتعامل Rosetta مع JSON و TOML و YAML و Hugo Markdown (frontmatter + body) مع الكشف التلقائي.
- **لا يوجد أمان.** يحمي Rosetta من تلوث النموذج الأولي، واجتياز المسار عبر رموز محلية مصممة، وتلف كتل التعليمات البرمجية أثناء ترجمة Markdown.

Rosetta هو الإصدار الإنتاجي من هذا النص البرمجي.

## البدء السريع

```bash
npm install --save-dev i18n-rosetta
```

### احصلوا على مفتاح API

يحتاج Rosetta إلى واجهة خلفية للترجمة. اختاروا واحدة:

| المزود | المفتاح | الأفضل لـ |
|----------|-----|----------|
| **OpenRouter** (موصى به) | `OPENROUTER_API_KEY` | المشاريع كثيفة المحتوى، Markdown، أكثر من 200 نموذج |
| **OpenAI** | `OPENAI_API_KEY` | الوصول المباشر إلى GPT-4o |
| **Anthropic** | `ANTHROPIC_API_KEY` | الوصول المباشر إلى Claude |
| **Gemini** | `GEMINI_API_KEY` | يتوفر مستوى مجاني |
| **DeepL** | `DEEPL_API_KEY` | اللغات الأوروبية، دعم المسارد |
| **Google Translate** | `GOOGLE_TRANSLATE_API_KEY` | أكثر من 130 لغة، حجم كبير |

**أسرع بداية** (مجانية): سجلوا في [aistudio.google.com](https://aistudio.google.com/apikey) للحصول على مفتاح Gemini مجاني:

```bash
export GEMINI_API_KEY=AI...
npx i18n-rosetta sync --method gemini
```

**OpenRouter** (أكثر من 200 نموذج): سجلوا في [openrouter.ai](https://openrouter.ai)، ثم:

```bash
export OPENROUTER_API_KEY=sk-or-v1-...
npx i18n-rosetta sync
```

بديل **Google Translate** (أزواج المفاتيح والقيم فقط — لا يوجد وعي بـ Markdown):

```bash
export GOOGLE_TRANSLATE_API_KEY=...
npx i18n-rosetta sync --method google-translate
```

> **ملاحظة**: إذا تم تعيين `GOOGLE_TRANSLATE_API_KEY` فقط، يقوم rosetta بالتبديل تلقائيًا إلى Google Translate. لا يلزم تغيير التكوين. يستخدم REST API مباشرة — لا يوجد SDK، ولا حساب خدمة، ولا `pip install`. فقط المفتاح.

هذا كل شيء. لمزيد من التحكم، أنشئوا ملف تكوين:

```bash
npx i18n-rosetta init                        # guided wizard — walks you through registers, methods, and content
npx i18n-rosetta init --yes --langs fr,de,ja  # quick setup with specific languages and default registers
```

تأتي كل لغة مع **إعدادات مسبقة للسجل** — تعليمات مسبقة الضبط للنبرة/الرسمية مضبوطة على نظامها اللغوي (vouvoiement للفرنسية، Siezen للألمانية، です/ます لليابانية، 해요체 للكورية). يتيح لكم معالج التهيئة تصفح واختيار الإعدادات المسبقة، أو تمرير `--yes` لقبول الإعدادات الافتراضية.

### مصدر غير إنجليزي

إذا لم تكن لغتكم المصدر هي الإنجليزية:

```bash
i18n-rosetta sync --source fr                      # CLI flag
```

أو اضبطوها بشكل دائم في ملف التكوين الخاص بكم:

```json
{ "inputLocale": "fr" }
```

## ماذا يفعل

أنتم تتعاملون مع إطار عمل i18n (next-intl، i18next، Hugo). يتعامل Rosetta مع ملفات الترجمة.

- **متعدد التنسيقات** — JSON، TOML، YAML، و Hugo Markdown (front matter + body)
- **تزايدي** — يترجم فقط ما تغير (تتبع تجزئة SHA-256)
- **متحكم بالجودة** — يتحقق من كل ترجمة: يكتشف الهلوسة، والمخرجات الخاطئة، وإعادة المصدر، وتضخم الطول
- **واعٍ بالمحتوى** — تحمي طرق LLM كتل التعليمات البرمجية، والرموز القصيرة، والروابط، ومتغيرات الاستيفاء أثناء ترجمة Markdown
- **أدوات خط الأنابيب** — `lint`، `audit`، `integrity`، `seo` لبوابات CI
- **صفر تبعيات** — Node.js مدمج فقط. لا توجد SDKs، ولا وحدات أصلية. يتطلب Node 20+

## ما وراء Google Translate

البدء السريع يجعلكم تبدأون باستخدام LLM أو Google Translate. لكن Google Translate يدعم حوالي 130 لغة. هناك أكثر من 7000 لغة.

**الفكرة الأساسية لـ Rosetta: طريقة الترجمة قابلة للتكوين لكل زوج لغوي.** استخدموا Google Translate للفرنسية، و LLM مع تدريب مورفولوجي للغة Plains Cree، وواجهة برمجة تطبيقات مستضافة من المجتمع للغة Quechua — كل ذلك في نفس المشروع، وكل ذلك بنفس CLI.

```json
{
  "version": 3,
  "pairs": {
    "en:fr": { "method": "google-translate" },
    "en:ja": { "method": "llm" },
    "en:crk": { "methodPlugin": "crk-coached-v1" }
  }
}
```

إذا تمكنتم من معرفة كيفية ترجمة زوج لغوي — من خلال هندسة المطالبات، أو القواميس المجتمعية، أو خطوط أنابيب FST، أو النماذج المضبوطة بدقة — يتيح لكم rosetta تجميع هذه الطريقة كبرنامج إضافي ونشرها جنبًا إلى جنب مع كل شيء آخر.

> وُلد من ترجمة موقع ويب إنتاجي إلى Plains Cree، حيث لا توجد واجهة برمجة تطبيقات جاهزة. البنية لكل زوج ليست نظرية — إنها موجودة لأن مشروعًا واحدًا احتاج إلى Google Translate للفرنسية وخط أنابيب FST مدرب للغة أصلية، يعملان جنبًا إلى جنب في نفس أمر المزامنة.

يتيح لكم [MT Eval Harness](https://github.com/gamedaysuits/gds-mt-eval-harness) المصاحب قياس وتقييم أساليب الترجمة، ثم تصدير الأساليب العاملة كبرامج إضافية لـ rosetta. يمكن لأي شخص يتحدث اللغتين تطوير واختبار ومشاركة طريقة ترجمة — لا تتطلب منصة احتكارية.

### اختاروا طريقتكم

يدعم Rosetta 10 طرق ترجمة. يمكن لكل زوج لغوي استخدام طريقة مختلفة.

**مقدمو LLM** — الأفضل للجودة، والوعي بـ Markdown، والمتوافق مع التدريب:

| الطريقة | المفتاح | ماذا تفعل |
|--------|-----|-------------|
| `llm` (افتراضي) | `OPENROUTER_API_KEY` | LLM عبر OpenRouter — أكثر من 200 نموذج، توجيه تلقائي |
| `llm-coached` | `OPENROUTER_API_KEY` | LLM + قواعد نحوية، قواميس، ملاحظات أسلوبية |
| `openai` | `OPENAI_API_KEY` | واجهة برمجة تطبيقات OpenAI مباشرة (gpt-4o، gpt-4o-mini) |
| `anthropic` | `ANTHROPIC_API_KEY` | واجهة برمجة تطبيقات Anthropic مباشرة (Claude Sonnet، Haiku، Opus) |
| `gemini` | `GEMINI_API_KEY` | واجهة برمجة تطبيقات Google Gemini مباشرة (Flash، Pro) — يتوفر مستوى مجاني |

**الترجمة الآلية التقليدية** — الأفضل للسرعة والتكلفة وأزواج المفاتيح والقيم ذات الحجم الكبير:

| الطريقة | المفتاح | ماذا تفعل |
|--------|-----|-------------|
| `google-translate` | `GOOGLE_TRANSLATE_API_KEY` | Google Cloud Translation API v2 (أكثر من 130 لغة) |
| `deepl` | `DEEPL_API_KEY` | DeepL API مع دعم المسارد (أكثر من 30 لغة) |
| `microsoft-translator` | `MICROSOFT_TRANSLATOR_API_KEY` | Azure Cognitive Services Translator (أكثر من 100 لغة) |
| `libretranslate` | *(مستضاف ذاتيًا)* | LibreTranslate مستضاف ذاتيًا (AGPL، مجاني) |

**البنية التحتية** — لنقاط النهاية المخصصة أو المستضافة من المجتمع:

| الطريقة | المفتاح | ماذا تفعل |
|--------|-----|-------------|
| `api` | *(لكل مزود)* | عميل HTTP خفيف لأي نقطة نهاية REST |

```bash
# Force a specific method for one run
i18n-rosetta sync --method deepl

# Or configure per pair
```

```json
{
  "pairs": {
    "en:fr": { "method": "deepl" },
    "en:ja": { "method": "openai", "model": "gpt-4o" },
    "en:crk": { "methodPlugin": "crk-coached-v1" }
  }
}
```

> **ملاحظة**: تتعامل طرق الترجمة الآلية التقليدية (Google Translate، DeepL، Microsoft Translator، LibreTranslate) مع أزواج المفاتيح والقيم جيدًا ولكن لا يمكنها ترجمة محتوى Markdown بأمان. للمشاريع كثيفة المحتوى، يوصى باستخدام طرق LLM — فهي تحمي بشكل صريح كتل التعليمات البرمجية، والرموز القصيرة، ومتغيرات الاستيفاء.

## المكونات الإضافية (Plugins)

المكونات الإضافية هي وصفات ترجمة مجمعة مسبقًا لأزواج لغوية محددة. إنها بيانات JSON — وليست تعليمات برمجية — تخبر rosetta أي طريقة تستخدم، وبأي إعدادات، وما هي الجودة التي تم قياسها.

```bash
i18n-rosetta plugin install ./french-formal-v1/    # install from directory
i18n-rosetta plugin list                           # see installed plugins
i18n-rosetta plugin remove french-formal-v1        # uninstall
i18n-rosetta status                                # shows quality tiers + benchmarks
```

راجعوا [docs/METHOD_PLUGIN_SPEC.md](https://github.com/gamedaysuits/i18n-rosetta/blob/main/docs/METHOD_PLUGIN_SPEC.md) لتنسيق البيان.

## الأوامر

| الأمر | الغرض |
|---------|---------|
| `init` | معالج إعداد تفاعلي (أو `--yes` للإعدادات الافتراضية السريعة) |
| `sync` | ترجمة ومزامنة جميع ملفات اللغة المحلية |
| `watch` | مزامنة تلقائية عند تغيير الملفات |
| `audit` | تحديد اللغات المحلية غير المكتملة (بوابة CI) |
| `lint` | البحث عن سلاسل نصية مبرمجة بشكل ثابت في الشيفرة المصدرية |
| `wrap` | تغليف تلقائي للسلاسل النصية المبرمجة بشكل ثابت في استدعاءات `t()` (مع التراجع) |
| `seo` | إنشاء hreflang أو sitemap.xml أو مخطط JSON-LD |
| `integrity` | التحقق من تلف العناصر النائبة ومشاكل الترميز |
| `status` | عرض تكوين الأزواج، والطرق، والسجلات، ومستويات الجودة |
| `provenance` | تدقيق ترخيص موارد الترجمة |
| `plugin` | تثبيت أو إزالة أو سرد مكونات الطريقة الإضافية |

شغلوا `i18n-rosetta <command> --help` للحصول على مساعدة مفصلة حول أي أمر.

المرجع الكامل: [docs/CLI_REFERENCE.md](https://github.com/gamedaysuits/i18n-rosetta/blob/main/docs/CLI_REFERENCE.md)

## التكوين

أنشئوا `i18n-rosetta.config.json` أو شغلوا `i18n-rosetta init`:

```json
{
  "version": 3,
  "inputLocale": "en",
  "localesDir": "./locales",
  "model": "google/gemini-3.5-flash",
  "pairs": {
    "en:fr": { "qualityTier": "high" },
    "en:ja": { "method": "google-translate" }
  }
}
```

| الخيار | الافتراضي | الوصف |
|--------|---------|-------------|
| `inputLocale` | `"en"` | رمز اللغة المصدر |
| `localesDir` | `"./locales"` | المسار إلى ملفات اللغة المحلية |
| `contentDir` | `null` | دليل محتوى Hugo (يمكّن ترجمة Markdown) |
| `format` | `"auto"` | تنسيق الملف: `json`، `toml`، `yaml`، أو `auto` |
| `model` | `"google/gemini-3.5-flash"` | نموذج OpenRouter الافتراضي |
| `defaultMethod` | `"llm"` | طريقة الترجمة الافتراضية (يتم تجاوزها بواسطة علامة `--method`) |
| `batchSize` | `30` | المفاتيح لكل دفعة ترجمة |
| `pairs` | `{}` | تجاوزات الطريقة والنموذج والجودة لكل زوج |

**تجاوزات لكل لغة**: تحتوي كل لغة على [بطاقة لغة](docs/planning/LANGUAGE_CARD_SPEC.md) مع سجلات مسبقة الضبط تتناسب مع نظامها الشكلي. استخدموا مفاتيح الإعدادات المسبقة كاختصار، أو اكتبوا نص سجل مخصص:

```json
{
  "languages": {
    "fr": "casual-tu",
    "ko": "formal-hapsyo",
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

**وضع عدم التكوين**: لا يوجد ملف تكوين؟ يكتشف Rosetta تلقائيًا ملفات اللغة المحلية، والتنسيق، واللغات المستهدفة من مشروعكم.

يمكن أن تكون قيم اللغة مفتاح إعداد مسبق (على سبيل المثال، `"casual-tu"`)، أو نص سجل مخصص، أو كائن (تحكم كامل). تأخذ التجاوزات على مستوى الزوج في `pairs` الأولوية على الإعدادات على مستوى اللغة. شغلوا `npx i18n-rosetta init` لتصفح الإعدادات المسبقة المتاحة لكل لغة.

أدلة إعداد الإطار: [docs/INTEGRATION_GUIDES.md](https://github.com/gamedaysuits/i18n-rosetta/blob/main/docs/INTEGRATION_GUIDES.md)

## التعزيز

- **تراجع أسي** — 3 محاولات مع تذبذب على أخطاء 429/5xx
- **مهلة طلب 30 ثانية** — يمنع AbortController التعليق
- **التحقق من الاستجابة** — يقبل فقط المفاتيح التي تم إرسالها للترجمة
- **بوابة الجودة** — تكتشف حلقات الهلوسة، والمخرجات الخاطئة، وتضخم الطول، وإعادة المصدر
- **تتالي إعادة المحاولة** — عند فشل تحليل JSON، يعيد المحاولة دفعة ← نصف دفعة ← مفاتيح فردية (محدودة الميزانية عبر `maxRetries`)
- **تخزين المطالبة مؤقتًا** — تقسيم رسالة النظام/المستخدم يتيح التخزين المؤقت على مستوى المزود، مما يقلل تكلفة الرمز المميز عبر الدفعات
- **حماية تلوث النموذج الأولي** — يمنع `__proto__`، `constructor`، `prototype`
- **احتواء المسار** — يتم التحقق من كتابة الملفات للبقاء ضمن الدلائل المكونة
- **حماية الكتل** — كتل التعليمات البرمجية، والرموز القصيرة، و HTML محمية أثناء ترجمة المحتوى
- **تراجع صريح** — يكتب `--fallback` عناصر نائبة مسبوقة بـ `[EN]` عندما تكون واجهة برمجة التطبيقات غير متاحة (أعيدوا المزامنة بمفتاح للحصول على ترجمات حقيقية)
- **نجاح جزئي** — دفعة واحدة فاشلة لا تمنع البقية

## الاختبار

```bash
npm test                         # all tests
npm run test:unit                # core sync pipeline
npm run test:redteam             # adversarial edge cases
npm run test:format              # TOML/YAML adapters
npm run test:content             # Markdown content parser
npm run test:hugo                # full Hugo E2E
npm run test:lint                # hardcoded string detection
npm run test:pairs               # pair graph resolution
npm run test:methods             # translation method suite
```

**صفر تبعيات.**

## الترخيص

MIT