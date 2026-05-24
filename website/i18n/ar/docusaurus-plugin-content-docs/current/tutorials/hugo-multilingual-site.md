---
sidebar_position: 3
title: "موقع Hugo متعدد اللغات"
description: "دليل عملي: إعداد موقع Hugo كامل متعدد اللغات باستخدام i18n-rosetta للتعامل مع ترجمة كل من ملفات السلاسل النصية ومحتوى Markdown."
---
# دليل الاستخدام: موقع Hugo متعدد اللغات

قم بإعداد نظام Hugo متعدد اللغات باستخدام i18n-rosetta للتعامل مع كل من ملفات النصوص بصيغة JSON وترجمة محتوى Markdown. يغطي هذا سير العمل بالكامل بدءاً من إعداد المشروع وحتى النشر في بيئة الإنتاج.

**ما ستقوم ببنائه:** موقع Hugo باللغات الإنجليزية، والفرنسية، واليابانية — ترجمة النصوص عبر ملفات اللغة (locale files)، وترجمة المحتوى عبر معالجة Markdown.

---

## هيكل المشروع

تستخدم Rosetta وضع الترجمة **المعتمد على اسم الملف** (filename-based) الخاص بـ Hugo. يتم وضع الملفات المترجمة في نفس الدليل الخاص بالملف المصدر، مع إضافة لاحقة اللغة إلى اسم الملف (على سبيل المثال `about.fr.md`):

```
my-hugo-site/
├── content/
│   └── en/
│       ├── _index.md
│       ├── _index.fr.md           ← rosetta generates
│       ├── _index.ja.md           ← rosetta generates
│       ├── about.md
│       ├── about.fr.md            ← rosetta generates
│       ├── about.ja.md            ← rosetta generates
│       └── blog/
│           ├── first-post.md
│           ├── first-post.fr.md   ← rosetta generates
│           └── first-post.ja.md   ← rosetta generates
├── i18n/
│   ├── en.json
│   ├── fr.json                    ← rosetta generates
│   └── ja.json                    ← rosetta generates
└── hugo.toml
```

:::note أوضاع i18n في Hugo
يدعم Hugo استراتيجيتين للترجمة: **المعتمدة على اسم الملف** (`about.fr.md` بجوار `about.md`) و**المعتمدة على الدليل** (أشجار `content/fr/about.md` منفصلة). تستخدم Rosetta الترجمة المعتمدة على اسم الملف لأن وظيفة `getTargetContentPath()` الخاصة بها تقوم بإنشاء مسارات الهدف عن طريق إضافة لاحقة اللغة إلى اسم الملف المصدر. تأكد من تكوين `hugo.toml` الخاص بك للترجمة المعتمدة على اسم الملف عند استخدام rosetta.
:::

## الخطوة 1: تكوين Hugo

```toml title="hugo.toml"
defaultContentLanguage = 'en'

[languages]
  [languages.en]
    languageName = 'English'
    weight = 1
  [languages.fr]
    languageName = 'Français'
    weight = 2
  [languages.ja]
    languageName = '日本語'
    weight = 3
```

## الخطوة 2: تكوين Rosetta

تحتاج Rosetta إلى تكوين شيئين: مسار ملف اللغة (للنصوص بصيغة JSON) ودليل المحتوى (لـ Markdown).

```json title="i18n-rosetta.config.json"
{
  "version": 3,
  "inputLocale": "en",
  "localesDir": "./i18n",
  "contentDir": "./content",
  "model": "google/gemini-3.5-flash",
  "pairs": {
    "en:fr": { "method": "llm" },
    "en:ja": { "method": "llm", "model": "openai/gpt-4o" }
  },
  "languages": {
    "fr": { "name": "French", "register": "Formal (vous-form)" },
    "ja": { "name": "Japanese", "register": "Polite/formal" }
  }
}
```

## الخطوة 3: إنشاء المحتوى المصدر

### ترجمة النصوص (i18n/)

```json title="i18n/en.json"
{
  "nav": {
    "home": "Home",
    "about": "About",
    "blog": "Blog",
    "contact": "Contact"
  },
  "footer": {
    "copyright": "© 2026 My Company. All rights reserved.",
    "privacy": "Privacy Policy"
  }
}
```

### محتوى Markdown (content/en/)

```markdown title="content/en/about.md"
---
title: "About Us"
description: "Learn more about our team and mission"
date: 2026-01-15
---

We build software that helps businesses communicate across languages.

Our platform supports **real-time translation** for over 30 languages,
with specialized support for low-resource languages.

## Our Mission

Language should never be a barrier to understanding.

## The Team

{{< team-grid >}}
```

## الخطوة 4: تشغيل المزامنة

```bash
npx i18n-rosetta sync
```

تقوم Rosetta بمعالجة كلا النوعين:

1. **ملفات النصوص** (`i18n/en.json` → `i18n/fr.json`، `i18n/ja.json`)
2. **ملفات المحتوى** (`content/en/about.md` → `content/en/about.fr.md`، `content/en/about.ja.md`)

### تفاصيل ترجمة المحتوى

عند ترجمة Markdown، تقوم rosetta تلقائياً بما يلي:

- **حماية** كتل الأكواد، والرموز القصيرة (shortcodes) (`{{< ... >}}`)، والأكواد المضمنة، و HTML
- **ترجمة** حقول الترويسة (front matter) (`title`، `description`، `summary`)
- **الاحتفاظ** بجميع حقول الترويسة الأخرى (`date`، `draft`، `weight`، `tags`)
- **استعادة** الكتل المحمية بعد الترجمة

يتم تمرير الرمز القصير (shortcode) الخاص بـ Hugo `{{< team-grid >}}` دون ترجمة.

## الخطوة 5: التحقق

```bash
# Preview the site
hugo server

# Check translation status
npx i18n-rosetta status
```

انتقل إلى `localhost:1313/fr/` و `localhost:1313/ja/` لمراجعة المحتوى المترجم.

## الخطوة 6: مبدل لغات Hugo

أضف مبدل لغات إلى تخطيط (layout) Hugo الخاص بك:

```html title="layouts/partials/language-switcher.html"
<nav class="language-switcher">
  {{ range $.Site.Home.AllTranslations }}
    <a href="{{ .Permalink }}"
       {{ if eq .Lang $.Site.Language.Lang }}class="active"{{ end }}>
      {{ .Language.LanguageName }}
    </a>
  {{ end }}
</nav>
```

## الحفاظ على مزامنة المحتوى

عند تحديث المحتوى الإنجليزي، قم بتشغيل المزامنة مرة أخرى. تقوم Rosetta فقط بإعادة ترجمة الملفات التي تم تغييرها:

```bash
# Edit content/en/about.md, then:
npx i18n-rosetta sync
```

يتتبع ملف القفل (lock file) تجزئات المحتوى (content hashes) لكل ملف، لذلك لا تتم إعادة ترجمة الصفحات المستقرة.

## انظر أيضاً

- **[دليل ترجمة المحتوى](/docs/guides/content-translation)** — تعمق في الحماية، والترويسة (front matter)، والحالات الاستثنائية
- **[تكامل إطارات العمل](/docs/guides/framework-integration)** — إعدادات Next.js و React
- **[دليل CI/CD](/docs/guides/ci-cd)** — أتمتة عمليات المزامنة عند الدفع (push) إلى `content/en/`
- **[طرق الترجمة](/docs/guides/translation-methods)** — مقارنة بين استراتيجيات الترجمة باستخدام النماذج اللغوية الكبيرة (LLM)، وذاكرة الترجمة (TM)، والاستراتيجيات الهجينة
- **[اللغات المدعومة](/docs/reference/supported-languages)** — قائمة كاملة باللغات ورموز اللغات المدعومة