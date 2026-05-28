---
sidebar_position: 1
title: "مرجع CLI"
---
# مرجع واجهة سطر الأوامر (CLI)

## الأوامر

```
i18n-rosetta init              Interactive setup wizard (--yes for quick defaults)
i18n-rosetta sync              Translate & sync all locale files
i18n-rosetta watch             Auto-sync when the source file changes
i18n-rosetta audit             List all untranslated [EN] fallback values
i18n-rosetta lint              Scan source code for hardcoded strings
i18n-rosetta wrap              Auto-wrap hardcoded strings in t() calls (with undo)
i18n-rosetta seo <sub>         Generate hreflang, sitemap.xml, or JSON-LD schema
i18n-rosetta integrity         Audit locale files for format/encoding issues
i18n-rosetta verify            Verify translations are present and correct (CI gate)
i18n-rosetta status            Show pair configuration, plugins, and quality tiers
i18n-rosetta provenance        Audit translation resource licensing
i18n-rosetta plugin <sub>      Manage method plugins (install, remove, list)
i18n-rosetta fonts <sub>       Download web fonts for PUA script converters
i18n-rosetta tm <sub>          Manage Translation Memory cache (stats, clear)
i18n-rosetta xliff <sub>       Export/import XLIFF 1.2 for professional review
```

قم بتشغيل `i18n-rosetta <command> --help` للحصول على مساعدة مفصلة حول أي أمر.

## الخيارات العامة

```
--help, -h              Show help (global or per-command)
--version, -v           Print version and exit
--yes, -y               Skip interactive prompts, use defaults
--config <path>         Custom config file path
--dir <path>            Override locales directory
--content-dir <path>    Hugo/Docusaurus content directory for Markdown translation
--source <code>         Override source locale (default: en)
--model <model>         Override translation model
--method <method>       Translation method: llm, google-translate (default: from config)
--format <fmt>          Locale file format: json, toml, yaml, or auto
--dry, --dry-run        Preview changes without writing files
--concurrency <n>       Max parallel API calls (sets both JSON and content, default: 12)
--json-concurrency <n>  Max parallel locale translations for JSON keys (default: 50)
--content-concurrency <n> Max parallel API calls for content translation (default: 12)
--force-content         Re-translate all content files (clears content lock)
--force-keys <keys>     Comma-separated dot-notation keys to force re-translate
--no-tm                 Skip Translation Memory cache for this sync run
--no-verify             Skip post-sync verification pass
--locale <code>         Target locale (xliff export, tm clear)
--quiet                 Errors and warnings only — suppress banner, progress bar, and info lines
--json                  Machine-readable NDJSON output — one JSON object per event
```

---

## init

معالج إعداد تفاعلي يقوم بإنشاء `i18n-rosetta.config.json`. يرشدك عبر تحديد اللغة المصدر، واللغات المستهدفة، وتنسيق الملف، ونموذج الترجمة.

```bash
i18n-rosetta init                          # interactive wizard
i18n-rosetta init --yes                    # skip wizard, use defaults
i18n-rosetta init --yes --langs fr,de,ja   # quick setup with specific languages
i18n-rosetta init --source en --dir ./i18n # overrides with defaults
```

**خيار `--langs`**: قائمة برموز اللغات المستهدفة مفصولة بفواصل. يتخطى مطالبة اللغة ويطبق الإعدادات المسبقة الافتراضية للأسلوب (register) لكل لغة. ادمجه مع `--yes` لإعداد غير تفاعلي بالكامل.

**الإعدادات المسبقة للغات**: عند مطالبتك باللغات المستهدفة، يمكنك كتابة أسماء الإعدادات المسبقة:
- `european` → fr, de, es, it, pt, nl
- `asian` → ja, zh, ko
- `global` → fr, es, de, ja, zh, ko, pt, ar
- `nordic` → da, fi, nb, sv

يمكنك المزج بين الإعدادات المسبقة والرموز الفردية: `european, ja` → fr, de, es, it, pt, nl, ja

---

## sync

يترجم المفاتيح المفقودة والقديمة عبر جميع ملفات اللغات. يقوم بتشغيل التحقق بعد المزامنة افتراضيًا.

```bash
i18n-rosetta sync                                   # translate everything
i18n-rosetta sync --dry-run                         # preview only
i18n-rosetta sync --force-keys "hero.title"         # force re-translate
i18n-rosetta sync --force-keys "a.title,a.subtitle" # multiple keys
i18n-rosetta sync --force-content                   # re-translate all Markdown/MDX
i18n-rosetta sync --content-dir ./content           # include Hugo Markdown
i18n-rosetta sync --method google-translate          # force Google Translate
i18n-rosetta sync --concurrency 20                  # 20 parallel API calls (both phases)
i18n-rosetta sync --json-concurrency 30              # 30 parallel locale translations (JSON)
i18n-rosetta sync --content-concurrency 8            # 8 parallel content translations
i18n-rosetta sync --no-verify                        # skip post-sync verification
i18n-rosetta sync --no-tm                            # skip cache, fresh API calls
```

**ذاكرة الترجمة (Translation Memory)**: افتراضيًا، يقوم `sync` بتحميل `.rosetta/tm.json` ويقدم الترجمات المخبأة للقيم المصدرية غير المتغيرة. استخدم `--no-tm` لتجاوز ذاكرة التخزين المؤقت (مفيد عند تبديل مزودي الترجمة أو تصحيح أخطاء الجودة). راجع [ذاكرة الترجمة](/docs/concepts/translation-memory).

**اكتشاف التغييرات**: يقوم rosetta بتخزين تجزئات SHA-256 في `.i18n-rosetta.lock`. عندما تتغير القيم المصدرية، تقوم المزامنة التالية تلقائيًا بإعادة ترجمة تلك المفاتيح. قم بإيداع (commit) ملف القفل (lock file) حتى يتشارك جميع المطورين نفس الأساس.

**التوازي (Parallelism)**: تعمل كل من ترجمة مفاتيح JSON وترجمة المحتوى بالتوازي. تُترجم لغات JSON في وقت واحد (الافتراضي: 50 لغة متزامنة)، مع توازي الدفعات داخل كل لغة أيضًا (4 دفعات متزامنة). تعمل ترجمة المحتوى (Markdown، MDX، منشورات المدونة) في تجمع عناصر عمل مسطح (الافتراضي: 12 استدعاء API متزامن). يمكنك تجاوز هذه القيم باستخدام `--json-concurrency` أو `--content-concurrency` أو `--concurrency` (يضبط كليهما).

**المخرجات**: تعرض المزامنة لافتة الإصدار، واكتشاف التنسيق/إطار العمل، وتقدير التكلفة، وأشرطة التقدم لكل لغة:

```
i18n-rosetta v3.3.1

[INFO] Detected format: json (auto)
[INFO] Source: en.json (2,847 keys)
[INFO] Pairs: es-MX:llm, fr:deepl

[INFO] es-MX.json — 2,847 missing
     ████████████████████████████████ 2,847/2,847 keys
[INFO] fr.json — 2,847 missing
     ████████████████████████████████ 2,847/2,847 keys
[OK] Synced 5,694 keys total.
```

يتم تحديث أشرطة التقدم في مكانها بعد كل دفعة (حوالي 80 مفتاحًا). استخدم `--quiet` للأخطاء/التحذيرات فقط، أو `--json` لمخرجات NDJSON القابلة للقراءة آليًا. كلاهما يخفي شريط التقدم واللافتة.

---

## watch

مزامنة تلقائية عند تغير ملف اللغة المصدر. يستمر في العمل حتى تتم مقاطعته باستخدام `Ctrl+C`.

```bash
i18n-rosetta watch
```

---

## audit

يسرد جميع القيم الاحتياطية غير المترجمة المسبوقة بـ `[EN]` من عمليات التشغيل السابقة. يخرج برمز 1 إذا تم العثور على أي منها — استخدمه كبوابة CI لإفشال عمليات البناء ذات الترجمات غير المكتملة.

```bash
i18n-rosetta audit
```

---

## verify

يعيد قراءة جميع ملفات اللغات من القرص ويتحقق من أن الترجمات موجودة بالفعل وصحيحة. هذا هو نفس التحقق الذي يعمل تلقائيًا في نهاية كل `sync` (ما لم يتم تمرير `--no-verify`).

```bash
i18n-rosetta verify                    # verify all locale files
i18n-rosetta verify --warn-only        # non-blocking
i18n-rosetta verify && echo "All good" # CI gate
```

**ما يتحقق منه:**
- تطابق المفاتيح — جميع المفاتيح المصدرية موجودة في كل لغة مستهدفة
- علامات التراجع `[EN]` من عمليات التشغيل السابقة
- الترجمات الفارغة
- التوافق مع نظام الكتابة — يجب أن تحتوي اللغات غير اللاتينية على ترجمات غير ASCII
- الحفاظ على العناصر النائبة — تتطابق العناصر النائبة لـ ICU مع المصدر
- مشكلات الترميز — علامات BOM، الأحرف غير المرئية
- صدى المصدر — قيم مطابقة للمصدر (تحذير)

---

## lint

يفحص الكود المصدري بحثًا عن السلاسل النصية الثابتة (hardcoded) المواجهة للمستخدم والتي يجب أن تستخدم استدعاءات ترجمة i18n. يكتشف إطار العمل الخاص بك تلقائيًا (next-intl، react-i18next، vue-i18n، Hugo).

```bash
i18n-rosetta lint                    # exits 1 if issues found
i18n-rosetta lint --warn-only        # always exits 0
i18n-rosetta lint --src ./app        # custom source directory
i18n-rosetta lint --min-length 4     # minimum string length to flag
```

**ما يكتشفه:**
- السلاسل النصية الثابتة في نصوص JSX، و `placeholder`، و `alt`، و `aria-label`، و `title`
- الملفات التي تحتوي على محتوى مواجه للمستخدم ولكن لا تحتوي على استيراد لإطار عمل i18n
- المفاتيح الميتة — مفاتيح اللغة التي لا يشير إليها أي ملف مصدري
- درجة التغطية — نسبة السلاسل النصية التي تمر عبر i18n

**الاستثناءات**: قم بإنشاء `.rosettaignore` في جذر مشروعك (أنماط glob، مثل `.gitignore`).

---

## wrap

يغلف تلقائيًا السلاسل النصية الثابتة المكتشفة بواسطة `lint` في استدعاءات `t()`. ينشئ نسخًا احتياطية تلقائية قبل تعديل الملفات.

```bash
i18n-rosetta wrap                    # auto-wrap with backup
i18n-rosetta wrap --dry              # preview wrapping changes
i18n-rosetta wrap --undo             # restore from .rosetta-backup/
```

**بوابات الأمان:**
1. التحقق من نظافة Git (يتم تخطيه في التشغيل التجريبي dry-run)
2. نسخ احتياطي تلقائي إلى `.rosetta-backup/`
3. معاينة الفروق (Diff) قبل كتابة كل ملف
4. دعم `--undo` للاستعادة من النسخة الاحتياطية

---

## seo

إنشاء عناصر تحسين محركات البحث (SEO) للمواقع متعددة اللغات.

```bash
i18n-rosetta seo hreflang                                        # print hreflang tags
i18n-rosetta seo sitemap --base-url https://example.com --out sitemap.xml
i18n-rosetta seo jsonld --base-url https://example.com           # JSON-LD schema
```

| الأمر الفرعي | المخرجات |
|------------|--------|
| `hreflang` | علامات `<link rel="alternate" hreflang>` |
| `sitemap` | `sitemap.xml` متعدد اللغات |
| `jsonld` | مخطط لغة موقع الويب JSON-LD |

---

## integrity

يكتشف التلف والانحراف في ملفات اللغات المترجمة.

```bash
i18n-rosetta integrity               # exits 1 if issues found
i18n-rosetta integrity --warn-only   # non-blocking
```

**ما يتحقق منه:**
- تلف العناصر النائبة (مثلًا، `{name}` موجود في المصدر ولكنه مفقود في الهدف)
- مشكلات الترميز (mojibake، Unicode غير صالح)
- النسخ غير المترجمة (القيمة المستهدفة مطابقة للمصدر)
- المفاتيح اليتيمة (مفاتيح في الهدف غير موجودة في المصدر)
- اكتمال فئات الجمع في ICU MessageFormat (مثلًا، تحتاج اللغة العربية إلى 6 فئات)

---

## tm

إدارة ذاكرة التخزين المؤقت لذاكرة الترجمة (`.rosetta/tm.json`). تخزن ذاكرة الترجمة (TM) الترجمات السابقة وتقدمها في عمليات المزامنة اللاحقة بدلاً من استدعاء واجهة برمجة التطبيقات (API).

```bash
i18n-rosetta tm stats                  # show cache statistics
i18n-rosetta tm clear                  # clear cache (with confirmation)
i18n-rosetta tm clear --yes            # clear without confirmation
i18n-rosetta tm clear --locale fr      # clear only French entries
```

| الأمر الفرعي | المخرجات |
|------------|--------|
| `stats` | عدد الإدخالات، حجم الملف، التفصيل لكل لغة |
| `clear` | حذف ملف ذاكرة التخزين المؤقت (بالكامل أو لكل لغة) |

| الخيار | التأثير |
|--------|--------|
| `--locale <code>` | مسح الإدخالات الخاصة بلغة واحدة فقط |
| `--yes` | تخطي مطالبة التأكيد |

راجع [ذاكرة الترجمة](/docs/concepts/translation-memory) لمعرفة كيفية عمل ذاكرة الترجمة ومتى يجب مسحها.

---

## xliff

تصدير واستيراد ملفات XLIFF 1.2 لمراجعتها من قبل مترجمين محترفين. XLIFF هو تنسيق التبادل العالمي المدعوم من قبل أدوات الترجمة بمساعدة الحاسوب (CAT) مثل memoQ و SDL Trados و Phrase.

```bash
i18n-rosetta xliff export --locale fr                   # export French XLIFF
i18n-rosetta xliff export --locale ja --out ./review/   # custom output path
i18n-rosetta xliff import .rosetta/xliff/fr.xliff       # import reviewed file
i18n-rosetta xliff import ./reviewed.xliff --dry        # preview import
```

| الأمر الفرعي | المخرجات |
|------------|--------|
| `export` | إنشاء `.xliff` من ملفات اللغة المصدر + الهدف |
| `import` | دمج ترجمات `.xliff` المراجعة في ملفات اللغات |

| الخيار | التأثير |
|--------|--------|
| `--locale <code>` | اللغة المستهدفة للتصدير (مطلوب) |
| `--out <path>` | مسار أو دليل مخرجات مخصص |
| `--dry` | معاينة الاستيراد دون الكتابة |

راجع [العمل مع المترجمين المحترفين](/docs/guides/professional-translators) لسير العمل الكامل.

---

## status

عرض تكوين الأزواج، والإضافات المثبتة، ومستويات الجودة، ودرجات قياس الأداء.

```bash
i18n-rosetta status
```

---

## provenance

تدقيق تراخيص موارد الترجمة لجميع الإضافات المثبتة.

```bash
i18n-rosetta provenance
```

---

## plugin

إدارة إضافات طرق الترجمة. الإضافات عبارة عن وصفات ترجمة معبأة مسبقًا ومثبتة في `.rosetta/methods/`.

```bash
i18n-rosetta plugin list                      # show installed plugins
i18n-rosetta plugin install ./my-method/      # install from local directory
i18n-rosetta plugin remove crk-coached-v1     # remove a plugin
```

راجع [مواصفات الإضافة](/docs/reference/plugin-spec) لمعرفة تنسيق بيان الإضافة (manifest).

---

## fonts

تنزيل وإدارة خطوط الويب PUA لمحولات نصوص اللغات المصطنعة (constructed language). اللغات التي تستخدم أحرف منطقة الاستخدام الخاص (Private Use Area) مثل (Klingon و Sindarin و Kryptonian) تحتاج إلى خطوط ويب مخصصة لعرض نصوصها. يقوم هذا الأمر بتنزيلها من مستودعات مفتوحة المصدر تم التحقق منها.

```bash
i18n-rosetta fonts list                           # show needed fonts
i18n-rosetta fonts install                        # download all needed fonts
i18n-rosetta fonts install --css                  # also generate CSS snippet
i18n-rosetta fonts install --dir ./public/fonts   # custom output directory
```

| الأمر الفرعي | المخرجات |
|------------|--------|
| `list` | يعرض خطوط PUA المطلوبة وحالة تثبيتها |
| `install` | ينزل الخطوط للغات المكونة |

| الخيار | التأثير |
|--------|--------|
| `--dir <path>` | تجاوز دليل مخرجات الخطوط (يتم اكتشافه تلقائيًا من نوع المشروع) |
| `--css` | إنشاء مقتطف `conlang-fonts.css` بجانب الخطوط |
| `--config <path>` | مسار ملف التكوين (يُستخدم لاكتشاف اللغات التي تحتاج إلى خطوط) |

**الاكتشاف التلقائي:** يُستنتج دليل المخرجات من بنية مشروعك:
- **Docusaurus** → `static/fonts/` أو `website/static/fonts/`
- **Hugo** → `static/fonts/`
- **الافتراضي** → `public/fonts/`

**محولات Unicode الأصلية** (`crk` → Cree Syllabics، `sr` → Serbian Cyrillic) لا تتطلب تثبيت خطوط.

راجع [اللغات المصطنعة، والنصوص، والإملاء](/docs/guides/conlangs-scripts-orthography) للحصول على التفاصيل الكاملة لخطوط PUA.

## مسار العمل ثلاثي الطبقات

استخدم `lint` و `sync` و `audit` معًا للحصول على نظام i18n محكم:

```json title="package.json"
{
  "scripts": {
    "i18n:lint": "i18n-rosetta lint",
    "i18n:sync": "i18n-rosetta sync",
    "i18n:audit": "i18n-rosetta audit"
  }
}
```

| الطبقة | الأمر | متى | الغرض |
|-------|---------|------|---------|
| **الفحص (Lint)** | `lint` | قبل الإيداع (Pre-commit) | حظر الإيداعات التي تحتوي على سلاسل نصية ثابتة |
| **المزامنة (Sync)** | `sync` | بعد الإيداع / CI | ترجمة المفاتيح المفقودة والمتغيرة |
| **التحقق (Verify)** | `verify` | بعد المزامنة / CI | تأكيد وجود الترجمات وصحتها |
| **التدقيق (Audit)** | `audit` | خطوة البناء | إفشال النشر إذا كانت أي لغة تحتوي على علامات `[EN]` |

---

## انظر أيضًا

- [التكوين](/docs/getting-started/configuration) — مرجع ملف التكوين
- [طرق الترجمة](/docs/guides/translation-methods) — اختيار الطريقة لكل زوج
- [ذاكرة الترجمة](/docs/concepts/translation-memory) — التخزين المؤقت وتوفير التكاليف
- [العمل مع المترجمين المحترفين](/docs/guides/professional-translators) — سير عمل XLIFF
- [مواصفات الإضافة](/docs/reference/plugin-spec) — تنسيق بيان الإضافة
- [دليل CI/CD](/docs/guides/ci-cd) — أتمتة أوامر CLI في مسار عملك
- [كيف تعمل المزامنة](/docs/concepts/how-sync-works) — فهم مسار عمل المزامنة
- [بوابة الجودة](/docs/concepts/quality-gate) — كيفية التحقق من صحة الترجمات