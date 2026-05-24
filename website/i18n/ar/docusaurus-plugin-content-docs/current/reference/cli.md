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
i18n-rosetta status            Show pair configuration, plugins, and quality tiers
i18n-rosetta provenance        Audit translation resource licensing
i18n-rosetta plugin <sub>      Manage method plugins (install, remove, list)
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
--dry                   Preview changes without writing files
```

---

## init

معالج إعداد تفاعلي يقوم بإنشاء `i18n-rosetta.config.json`. يرشدك عبر لغة المصدر، واللغات المستهدفة، وتنسيق الملف، ونموذج الترجمة.

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

يترجم المفاتيح المفقودة، والقديمة، والاحتياطية عبر جميع ملفات اللغات.

```bash
i18n-rosetta sync                                   # translate everything
i18n-rosetta sync --dry                             # preview only
i18n-rosetta sync --force-keys "hero.title"         # force re-translate
i18n-rosetta sync --force-keys "a.title,a.subtitle" # multiple keys
i18n-rosetta sync --content-dir ./content           # include Hugo Markdown
i18n-rosetta sync --method google-translate          # force Google Translate
i18n-rosetta sync --fallback                         # write [EN] prefixes on failure
```

**اكتشاف التغييرات**: يقوم rosetta بتخزين تجزئات SHA-256 في `.i18n-rosetta.lock`. عندما تتغير قيم المصدر، تقوم عملية المزامنة (sync) التالية بإعادة ترجمة تلك المفاتيح تلقائيًا. قم بإيداع (commit) ملف القفل حتى يتشارك جميع المطورين نفس خط الأساس.

---

## watch

مزامنة تلقائية عند تغير ملف لغة المصدر. يستمر في العمل حتى تتم مقاطعته باستخدام `Ctrl+C`.

```bash
i18n-rosetta watch
```

---

## audit

يسرد جميع القيم الاحتياطية غير المترجمة التي تبدأ بـ `[EN]`. يخرج برمز 1 إذا تم العثور على أي منها — استخدمه كبوابة CI لإفشال عمليات البناء (builds) التي تحتوي على ترجمات غير مكتملة.

```bash
i18n-rosetta audit
```

---

## lint

يفحص الكود المصدري بحثًا عن السلاسل النصية الثابتة (hardcoded) الموجهة للمستخدم والتي يجب أن تستخدم استدعاءات ترجمة i18n. يكتشف إطار العمل الخاص بك تلقائيًا (next-intl، react-i18next، vue-i18n، Hugo).

```bash
i18n-rosetta lint                    # exits 1 if issues found
i18n-rosetta lint --warn-only        # always exits 0
i18n-rosetta lint --src ./app        # custom source directory
i18n-rosetta lint --min-length 4     # minimum string length to flag
```

**ما يكتشفه:**
- السلاسل النصية الثابتة في نصوص JSX، و `placeholder`، و `alt`، و `aria-label`، و `title`
- الملفات التي تحتوي على محتوى موجه للمستخدم ولكن لا تتضمن استيراد (import) لإطار عمل i18n
- المفاتيح الميتة — مفاتيح اللغة التي لا يشير إليها أي ملف مصدري
- درجة التغطية — النسبة المئوية للسلاسل النصية التي تمر عبر i18n

**الاستثناءات**: قم بإنشاء `.rosettaignore` في جذر مشروعك (أنماط glob، مثل `.gitignore`).

---

## wrap

يقوم بتغليف السلاسل النصية الثابتة المكتشفة بواسطة `lint` تلقائيًا في استدعاءات `t()`. ينشئ نسخًا احتياطية تلقائية قبل تعديل الملفات.

```bash
i18n-rosetta wrap                    # auto-wrap with backup
i18n-rosetta wrap --dry              # preview wrapping changes
i18n-rosetta wrap --undo             # restore from .rosetta-backup/
```

**بوابات الأمان:**
1. فحص نظافة Git (يتم تخطيه في التشغيل التجريبي dry-run)
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
| `hreflang` | وسوم `<link rel="alternate" hreflang>` |
| `sitemap` | `sitemap.xml` متعدد اللغات |
| `jsonld` | مخطط لغة موقع الويب JSON-LD |

---

## integrity

يكتشف التلف والانحراف (drift) في ملفات اللغات المترجمة.

```bash
i18n-rosetta integrity               # exits 1 if issues found
i18n-rosetta integrity --warn-only   # non-blocking
```

**ما يتحقق منه:**
- تلف العناصر النائبة (مثل وجود `{name}` في المصدر ولكن مفقود في الهدف)
- مشاكل الترميز (mojibake، Unicode غير صالح)
- النسخ غير المترجمة (قيمة الهدف مطابقة للمصدر)
- المفاتيح اليتيمة (مفاتيح في الهدف غير موجودة في المصدر)

---

## status

عرض تكوين الأزواج، والإضافات (plugins) المثبتة، ومستويات الجودة، ودرجات قياس الأداء.

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

إدارة إضافات طرق الترجمة. الإضافات هي وصفات ترجمة مجهزة مسبقًا يتم تثبيتها في `.rosetta/methods/`.

```bash
i18n-rosetta plugin list                      # show installed plugins
i18n-rosetta plugin install ./my-method/      # install from local directory
i18n-rosetta plugin remove crk-coached-v1     # remove a plugin
```

راجع [مواصفات الإضافة](/docs/reference/plugin-spec) لمعرفة تنسيق بيان الإضافة (manifest).

---

## مسار العمل ثلاثي الطبقات

استخدم `lint`، و `sync`، و `audit` معًا للحصول على نظام i18n محكم:

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
| **التدقيق (Audit)** | `audit` | خطوة البناء (Build step) | إفشال النشر إذا كانت أي لغة غير مكتملة |

---

## انظر أيضًا

- [التكوين](/docs/getting-started/configuration) — مرجع ملف التكوين
- [طرق الترجمة](/docs/guides/translation-methods) — اختيار الطريقة لكل زوج
- [مواصفات الإضافة](/docs/reference/plugin-spec) — تنسيق بيان الإضافة (manifest)
- [دليل CI/CD](/docs/guides/ci-cd) — أتمتة أوامر CLI في مسار عملك
- [كيف تعمل المزامنة](/docs/concepts/how-sync-works) — فهم مسار عمل المزامنة
- [بوابة الجودة](/docs/concepts/quality-gate) — كيف يتم التحقق من صحة الترجمات