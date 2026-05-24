# i18n-rosetta

[![npm version](https://img.shields.io/npm/v/i18n-rosetta.svg)](https://www.npmjs.com/package/i18n-rosetta)
[![CI](https://github.com/gamedaysuits/i18n-rosetta/actions/workflows/ci.yml/badge.svg)](https://github.com/gamedaysuits/i18n-rosetta/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

🌐 **ترجمات ملف README** — *مترجمة بواسطة rosetta، بالطبع:*
[Français](docs/README.fr.md) · [Deutsch](docs/README.de.md) · [Español](docs/README.es.md) · [Português](docs/README.pt.md) · [Nederlands](docs/README.nl.md) · [日本語](docs/README.ja.md) · [한국어](docs/README.ko.md) · [简体中文](docs/README.zh.md) · [ไทย](docs/README.th.md) · [Tiếng Việt](docs/README.vi.md) · [Filipino](docs/README.fil.md) · [العربية](docs/README.ar.md)

ترجم ملفات اللغات الخاصة بك بأمر واحد:

```bash
npx i18n-rosetta sync
```

يكتشف Rosetta تلقائيًا ملفات اللغات الخاصة بك، وتنسيقها، واللغات المستهدفة. يقوم بترجمة المفاتيح المفقودة، ويتخطى ما تم إنجازه بالفعل، ويكتب النتائج. هذا كل شيء.

## لماذا لا تقوم ببرمجتها بنفسك؟

يمكنك كتابة نص برمجي سريع يقوم بالتكرار عبر مفاتيحك الإنجليزية ويستدعي Google Translate. معظم المطورين يفعلون ذلك — يستغرق حوالي 30 سطرًا. إليك سبب فشله:

- **لا يوجد اكتشاف للتغيير.** عندما تقوم بتحديث سلسلة نصية إنجليزية، تظل الترجمة قديمة إلى الأبد. يتتبع Rosetta كل قيمة مصدر باستخدام تجزئات SHA-256 ويعيد ترجمة ما تغير فقط.
- **لا يوجد تجميع.** استدعاء API واحد لكل مفتاح يعني 200 مفتاح = 200 رحلة ذهاب وعودة. يقوم Rosetta بالتجميع بذكاء (قابل للتكوين، الافتراضي 30 مفتاحًا/دفعة لـ LLM، و 128 لـ Google).
- **لا توجد بوابة جودة.** الترجمة الآلية تهلوس، أو تعيد المصدر، أو تنتج مخرجات بخط خاطئ. يتحقق Rosetta من كل ترجمة قبل كتابتها — يتم اكتشاف ورفض الخطوط الخاطئة، وتضخم الطول، وإعادة المصدر.
- **لا يوجد وعي بالتنسيق.** هل هو مبرمج بشكل ثابت لـ JSON؟ يتعامل Rosetta مع JSON و TOML و YAML و Hugo Markdown (frontmatter + body) مع الكشف التلقائي.
- **لا توجد أمان.** يحمي Rosetta من تلوث النموذج الأولي، واجتياز المسار عبر رموز لغة مصممة، وتلف كتل التعليمات البرمجية أثناء ترجمة Markdown.

Rosetta هي النسخة الإنتاجية من هذا النص البرمجي.

## البدء السريع

```bash
npm install --save-dev i18n-rosetta
```

### الحصول على مفتاح API

يحتاج Rosetta إلى واجهة خلفية للترجمة. اختر واحدة:

| المزود | المفتاح | الأفضل لـ |
|----------|-----|----------|
| **OpenRouter** (موصى به) | `OPENROUTER_API_KEY` | المشاريع الغنية بالمحتوى، Markdown، أكثر من 200 نموذج |
| **OpenAI** | `OPENAI_API_KEY` | الوصول المباشر إلى GPT-4o |
| **Anthropic** | `ANTHROPIC_API_KEY` | الوصول المباشر إلى Claude |
| **Gemini** | `GEMINI_API_KEY` | طبقة مجانية متاحة |
| **DeepL** | `DEEPL_API_KEY` | اللغات الأوروبية، دعم المسارد |
| **Google Translate** | `GOOGLE_TRANSLATE_API_KEY` | أكثر من 130 لغة، حجم كبير |

**أسرع بداية** (مجانية): اشترك في [aistudio.google.com](https://aistudio.google.com/apikey) للحصول على مفتاح Gemini مجاني:

```bash
export GEMINI_API_KEY=AI...
npx i18n-rosetta sync --method gemini
```

**OpenRouter** (أكثر من 200 نموذج): اشترك في [openrouter.ai](https://openrouter.ai)، ثم:

```bash
export OPENROUTER_API_KEY=sk-or-v1-...
npx i18n-rosetta sync
```

بديل **Google Translate** (أزواج المفتاح-القيمة فقط — لا يوجد وعي بـ Markdown):

```bash
export GOOGLE_TRANSLATE_API_KEY=...
npx i18n-rosetta sync --method google-translate
```

> **ملاحظة**: إذا تم تعيين `GOOGLE_TRANSLATE_API_KEY` فقط، يقوم rosetta بالتبديل تلقائيًا إلى Google Translate. لا يلزم تغيير التكوين. يستخدم REST API مباشرةً — لا يوجد SDK، ولا حساب خدمة، ولا `pip install`. فقط المفتاح.

هذا كل شيء. لمزيد من التحكم، أنشئ ملف تكوين:

```bash
npx i18n-rosetta init                        # guided wizard — walks you through registers, methods, and content
npx i18n-rosetta init --yes --langs fr,de,ja  # quick setup with specific languages and default registers
```

تأتي كل لغة مع **إعدادات مسبقة للسجل** — تعليمات مسبقة البناء للنبرة/الرسمية مضبوطة على نظامها اللغوي (vouvoiement للفرنسية، Siezen للألمانية، です/ます لليابانية، 해요체 للكورية). يتيح لك معالج التهيئة تصفح واختيار الإعدادات المسبقة، أو تمرير `--yes` لقبول الإعدادات الافتراضية.

### مصدر غير إنجليزي

إذا لم تكن لغتك المصدر هي الإنجليزية:

```bash
i18n-rosetta sync --source fr                      # CLI flag
```

أو قم بتعيينها بشكل دائم في ملف التكوين الخاص بك:

```json
{ "inputLocale": "fr" }
```

## ماذا يفعل

أنت تتعامل مع إطار عمل i18n (next-intl، i18next، Hugo). يتعامل Rosetta مع ملفات الترجمة.

- **متعدد التنسيقات** — JSON، TOML، YAML، Hugo Markdown (front matter + body)، و XLIFF 1.2
- **تزايدي** — يترجم ما تغير فقط (تتبع تجزئة SHA-256)
- **مخزن مؤقتًا** — تخزن ذاكرة الترجمة النتائج السابقة؛ إعادة تشغيل المزامنة لا تكلف شيئًا للمفاتيح غير المتغيرة
- **متحكم بالجودة** — يتحقق من كل ترجمة: يكتشف الهلوسة، والمخرجات بخط خاطئ، وإعادة المصدر، وتضخم الطول
- **واعٍ بالمحتوى** — تحمي طرق LLM كتل التعليمات البرمجية، والرموز المختصرة، والروابط، ومتغيرات الاستيفاء أثناء ترجمة Markdown
- **أدوات خط الأنابيب** — `lint`، `audit`، `integrity`، `seo` لبوابات CI
- **تفاعل XLIFF** — تصدير الترجمات للمراجعة الاحترافية في أدوات CAT (memoQ، SDL Trados، Phrase)، استيرادها مرة أخرى
- **صفر تبعيات** — Node.js مدمج فقط. لا توجد SDKs، ولا وحدات أصلية. يتطلب Node 20+

## ما وراء ترجمة جوجل

البدء السريع يجعلك تعمل مع LLM أو Google Translate. لكن Google Translate يدعم حوالي 130 لغة. هناك أكثر من 7000 لغة.

**الفكرة الأساسية لـ Rosetta: طريقة الترجمة قابلة للتكوين لكل زوج لغوي.** استخدم Google Translate للفرنسية، و LLM مع تدريب مورفولوجي للغة الكري السهول، وواجهة برمجة تطبيقات مستضافة من المجتمع للغة الكيتشوا — كل ذلك في نفس المشروع، وكل ذلك بنفس CLI.

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

إذا تمكنت من معرفة كيفية ترجمة زوج لغوي — من خلال هندسة المطالبات، أو القواميس المجتمعية، أو خطوط أنابيب FST، أو النماذج المضبوطة بدقة — يتيح لك rosetta تجميع هذه الطريقة كإضافة ونشرها جنبًا إلى جنب مع كل شيء آخر.

> وُلد هذا المشروع من ترجمة موقع ويب إنتاجي إلى لغة الكري السهول، حيث لا توجد واجهة برمجة تطبيقات جاهزة. البنية لكل زوج ليست نظرية — إنها موجودة لأن مشروعًا واحدًا احتاج إلى Google Translate للفرنسية وخط أنابيب FST مدرب للغة أصلية، يعملان جنبًا إلى جنب في نفس أمر المزامنة.

يتيح لك [MT Eval Harness](https://github.com/gamedaysuits/gds-mt-eval-harness) المصاحب قياس وتقييم أساليب الترجمة، ثم تصدير الأساليب العاملة كإضافات rosetta. يمكن لأي شخص يتحدث اللغتين تطوير واختبار ومشاركة طريقة ترجمة — لا تتطلب منصة احتكارية.

### اختر طريقتك

يدعم Rosetta 10 طرق ترجمة. يمكن لكل زوج لغوي استخدام طريقة مختلفة.

**مقدمو LLM** — الأفضل للجودة، والوعي بـ Markdown، والمتوافق مع التدريب:

| الطريقة | المفتاح | ما تفعله |
|--------|-----|-------------|
| `llm` (افتراضي) | `OPENROUTER_API_KEY` | LLM عبر OpenRouter — أكثر من 200 نموذج، توجيه تلقائي |
| `llm-coached` | `OPENROUTER_API_KEY` | LLM + قواعد نحوية، قواميس، ملاحظات أسلوبية |
| `openai` | `OPENAI_API_KEY` | واجهة برمجة تطبيقات OpenAI مباشرة (gpt-4o، gpt-4o-mini) |
| `anthropic` | `ANTHROPIC_API_KEY` | واجهة برمجة تطبيقات Anthropic مباشرة (Claude Sonnet، Haiku، Opus) |
| `gemini` | `GEMINI_API_KEY` | واجهة برمجة تطبيقات Google Gemini مباشرة (Flash، Pro) — طبقة مجانية متاحة |

**الترجمة الآلية التقليدية** — الأفضل للسرعة والتكلفة وأزواج المفتاح-القيمة ذات الحجم الكبير:

| الطريقة | المفتاح | ما تفعله |
|--------|-----|-------------|
| `google-translate` | `GOOGLE_TRANSLATE_API_KEY` | Google Cloud Translation API v2 (أكثر من 130 لغة) |
| `deepl` | `DEEPL_API_KEY` | DeepL API مع دعم المسارد (أكثر من 30 لغة) |
| `microsoft-translator` | `MICROSOFT_TRANSLATOR_API_KEY` | Azure Cognitive Services Translator (أكثر من 100 لغة) |
| `libretranslate` | *(مستضاف ذاتيًا)* | LibreTranslate مستضاف ذاتيًا (AGPL، مجاني) |

**البنية التحتية** — لنقاط النهاية المخصصة أو المستضافة من المجتمع:

| الطريقة | المفتاح | ما تفعله |
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

> **ملاحظة**: تتعامل طرق الترجمة الآلية التقليدية (Google Translate، DeepL، Microsoft Translator، LibreTranslate) مع أزواج المفتاح-القيمة بشكل جيد ولكن لا يمكنها ترجمة محتوى Markdown بأمان. بالنسبة للمشاريع الغنية بالمحتوى، يوصى باستخدام طرق LLM — فهي تحمي بشكل صريح كتل التعليمات البرمجية، والرموز المختصرة، ومتغيرات الاستيفاء.

## الإضافات

الإضافات هي وصفات ترجمة مجمعة مسبقًا لأزواج لغوية محددة. إنها ملفات JSON — وليست تعليمات برمجية — تخبر rosetta أي طريقة تستخدم، وبأي إعدادات، وما هي الجودة التي تم قياسها.

```bash
i18n-rosetta plugin install ./french-formal-v1/    # install from directory
i18n-rosetta plugin list                           # see installed plugins
i18n-rosetta plugin remove french-formal-v1        # uninstall
i18n-rosetta status                                # shows quality tiers + benchmarks
```

انظر [docs/METHOD_PLUGIN_SPEC.md](https://github.com/gamedaysuits/i18n-rosetta/blob/main/docs/METHOD_PLUGIN_SPEC.md) لتنسيق البيان.

## الأوامر

| الأمر | الغرض |
|---------|---------|
| `init` | معالج إعداد تفاعلي (أو `--yes` للإعدادات الافتراضية السريعة) |
| `sync` | ترجمة ومزامنة جميع ملفات اللغات |
| `watch` | مزامنة تلقائية عند تغيير الملفات |
| `audit` | تحديد اللغات غير المكتملة (بوابة CI) |
| `lint` | البحث عن سلاسل نصية مبرمجة بشكل ثابت في الكود المصدري |
| `wrap` | تغليف تلقائي للسلاسل النصية المبرمجة بشكل ثابت في استدعاءات `t()` (مع التراجع) |
| `seo` | إنشاء hreflang، sitemap.xml، أو مخطط JSON-LD |
| `integrity` | التحقق من تلف العناصر النائبة، والترميز، واكتمال صيغة الجمع في ICU |
| `status` | عرض تكوين الزوج، والأساليب، والسجلات، ومستويات الجودة |
| `provenance` | تدقيق ترخيص موارد الترجمة |
| `plugin` | تثبيت، إزالة، أو سرد إضافات الأساليب |
| `fonts` | تنزيل خطوط الويب لمحوّلات نصوص PUA |
| `tm` | إدارة ذاكرة التخزين المؤقت للترجمة (إحصائيات، مسح، لكل لغة) |
| `xliff` | تصدير/استيراد XLIFF 1.2 لمراجعة المترجمين المحترفين |

شغل `i18n-rosetta <command> --help` للحصول على مساعدة مفصلة حول أي أمر.

المرجع الكامل: [docs/CLI_REFERENCE.md](https://github.com/gamedaysuits/i18n-rosetta/blob/main/docs/CLI_REFERENCE.md)

## التكوين

أنشئ `i18n-rosetta.config.json` أو شغل `i18n-rosetta init`:

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
| `localesDir` | `"./locales"` | المسار إلى ملفات اللغات |
| `contentDir` | `null` | دليل محتوى Hugo (يمكّن ترجمة Markdown) |
| `format` | `"auto"` | تنسيق الملف: `json`، `toml`، `yaml`، أو `auto` |
| `model` | `"google/gemini-3.5-flash"` | نموذج OpenRouter الافتراضي |
| `defaultMethod` | `"llm"` | طريقة الترجمة الافتراضية (يتم تجاوزها بواسطة علامة `--method`) |
| `batchSize` | `30` | المفاتيح لكل دفعة ترجمة |
| `pairs` | `{}` | تجاوزات الطريقة والنموذج والجودة لكل زوج |

**تجاوزات لكل لغة**: تحتوي كل لغة على [بطاقة لغة](docs/planning/LANGUAGE_CARD_SPEC.md) — واحدة من 50 بطاقة منسقة تحتوي على إعدادات مسبقة للسجل، وأنظمة رسمية، وقواعد طباعة، وعلامات دعم الأساليب. تستخدم البطاقات [بنية من مستويين](website/docs/concepts/architecture.md) (وقت التشغيل + المرجع) للأداء على نطاق واسع. قم بإنشاء بطاقة جديدة باستخدام `node scripts/generate-language-card.mjs <code>`. استخدم مفاتيح الإعدادات المسبقة كاختصار، أو اكتب نص سجل مخصص:

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

**وضع بدون تكوين**: لا يوجد ملف تكوين؟ يكتشف Rosetta تلقائيًا ملفات اللغات، والتنسيق، واللغات المستهدفة من مشروعك.

يمكن أن تكون قيم اللغة مفتاح إعداد مسبق (مثل `"casual-tu"`)، أو نص سجل مخصص، أو كائن (تحكم كامل). تأخذ تجاوزات مستوى الزوج في `pairs` الأولوية على إعدادات مستوى اللغة. شغل `npx i18n-rosetta init` لتصفح الإعدادات المسبقة المتاحة لكل لغة.

أدلة إعداد الإطار: [docs/INTEGRATION_GUIDES.md](https://github.com/gamedaysuits/i18n-rosetta/blob/main/docs/INTEGRATION_GUIDES.md)

## التعزيز

- **تراجع أسي** — 3 محاولات مع اهتزاز عند أخطاء 429/5xx
- **مهلة طلب 30 ثانية** — يمنع AbortController التعليق
- **التحقق من صحة الاستجابة** — يقبل فقط المفاتيح التي تم إرسالها للترجمة
- **بوابة الجودة** — تكتشف حلقات الهلوسة، والمخرجات بخط خاطئ، وتضخم الطول، وإعادة المصدر
- **تتالي إعادة المحاولة** — عند فشل تحليل JSON، يعيد محاولة الدفعة → نصف الدفعة → المفاتيح الفردية (محددة الميزانية عبر `maxRetries`)
- **ذاكرة الترجمة** — `.rosetta/tm.json` تخزن الترجمات مؤقتًا مفتاحها بالنص المصدر + اللغة + الطريقة؛ يتم تقديم المفاتيح غير المتغيرة من ذاكرة التخزين المؤقت في المزامنات اللاحقة، مما يلغي استدعاءات API الزائدة
- **التخزين المؤقت للمطالبات** — تقسيم رسالة النظام/المستخدم يتيح التخزين المؤقت على مستوى المزود، مما يقلل تكلفة الرمز المميز عبر الدفعات
- **فرض المصطلحات** — يتم التحقق من الترجمات المدربة مقابل مصطلحات القاموس بعد استجابة LLM
- **حماية تلوث النموذج الأولي** — يمنع `__proto__`، `constructor`، `prototype`
- **احتواء المسار** — يتم التحقق من كتابة الملفات للبقاء ضمن الدلائل المكونة
- **حماية الكتل** — كتل التعليمات البرمجية، والرموز المختصرة، و HTML محمية أثناء ترجمة المحتوى
- **تراجع صريح** — `--fallback` يكتب عناصر نائبة مسبوقة بـ `[EN]` عندما تكون واجهة برمجة التطبيقات غير متاحة (أعد المزامنة بمفتاح للحصول على ترجمات حقيقية)
- **نجاح جزئي** — دفعة فاشلة واحدة لا تمنع البقية

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