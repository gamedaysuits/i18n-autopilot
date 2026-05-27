---
sidebar_position: 2
title: "البدء السريع"
---
# البدء السريع

ترجم ملف locale الأول الخاص بك في 60 ثانية.

## 1. إعداد ملفات locale الخاصة بك

قم بإنشاء ملف locale المصدر. يدعم Rosetta تنسيقات JSON و TOML و YAML:

```json title="locales/en.json"
{
  "hero": {
    "title": "Welcome to our platform",
    "subtitle": "Build something amazing"
  },
  "nav": {
    "home": "Home",
    "about": "About",
    "contact": "Contact"
  }
}
```

## 2. تعيين مفتاح API الخاص بك

اختر مزوداً وقم بتعيين المفتاح:

```bash
# Option A: OpenRouter (200+ models, recommended)
export OPENROUTER_API_KEY=sk-or-v1-...

# Option B: Gemini (free tier — zero cost to start)
export GEMINI_API_KEY=AI...
```

احصل على مفتاح Gemini مجاني من [aistudio.google.com/apikey](https://aistudio.google.com/apikey). احصل على مفتاح OpenRouter من [openrouter.ai](https://openrouter.ai).

## 3. تشغيل المزامنة

```bash
npx i18n-rosetta sync
```

:::tip هل تستخدم Gemini؟
إذا اخترت الخيار ب (Gemini)، أضف `--method gemini`:
```bash
npx i18n-rosetta sync --method gemini
```
:::

سيقوم Rosetta بما يلي:
1. الاكتشاف التلقائي لـ `locales/en.json` كملف مصدر
2. العثور على اللغات المستهدفة (أو المطالبة بها)
3. ترجمة جميع المفاتيح
4. كتابة `locales/fr.json` و `locales/ja.json`، إلخ.
5. إنشاء `.i18n-rosetta.lock` لتتبع ما تمت ترجمته

## 4. التحقق من النتائج

```bash
cat locales/fr.json
```

```json
{
  "hero": {
    "title": "Bienvenue sur notre plateforme",
    "subtitle": "Construisez quelque chose d'incroyable"
  },
  "nav": {
    "home": "Accueil",
    "about": "À propos",
    "contact": "Contact"
  }
}
```

## ماذا يحدث بعد ذلك؟

عند تغيير نص المصدر، يكتشف rosetta التغيير عبر تتبع تجزئة SHA-256 ويعيد ترجمة هذا المفتاح فقط في المزامنة التالية:

```json title="locales/en.json (updated)"
{
  "hero": {
    "title": "Welcome to Acme Platform",  // ← changed
    "subtitle": "Build something amazing"  // ← unchanged, skipped
  }
}
```

```bash
npx i18n-rosetta sync
# Only "hero.title" is re-translated across all locales
```

يتم تقديم المفتاح غير المتغير (`hero.subtitle`) من ذاكرة التخزين المؤقت لـ **Translation Memory** الخاصة بـ rosetta — بدون استدعاء لـ API، وبدون تكلفة. يتم بناء ذاكرة التخزين المؤقت تلقائياً خلال كل عملية مزامنة ويتم تخزينها في `.rosetta/tm.json`.

## اختياري: إنشاء ملف تكوين

لمزيد من التحكم، قم بإنشاء ملف تكوين:

```bash
npx i18n-rosetta init                         # guided wizard
npx i18n-rosetta init --yes --langs fr,de,ja  # quick setup with specific targets
```

يرشدك المعالج الموجه عبر **register presets** (إعدادات النبرة المسبقة) لكل لغة — وهي تعليمات مبنية مسبقاً للنبرة/الرسمية ومضبوطة وفقاً لنظامها اللغوي. تحتوي الفرنسية على إعدادات T-V المسبقة (vouvoiement مقابل tutoiement)، وتحتوي الكورية على مستويات التحدث (해요체 مقابل 합쇼체 مقابل 해체)، وتحتوي اليابانية على خيارات keigo (です/ます مقابل 丁寧語).

أو قم بإنشاء ملف تكوين يدوياً باستخدام مفاتيح الإعدادات المسبقة:

```json title="i18n-rosetta.config.json"
{
  "version": 3,
  "inputLocale": "en",
  "localesDir": "./locales",
  "languages": {
    "fr": "casual-tu",
    "ko": "polite-haeyo",
    "ja": "polite"
  },
  "model": "google/gemini-2.5-flash"
}
```

قم بتشغيل `npx i18n-rosetta init` لتصفح الإعدادات المسبقة المتاحة لكل لغة.

## اختياري: وضع المراقبة (Watch Mode)

الترجمة التلقائية عند تغيير ملف المصدر الخاص بك:

```bash
npx i18n-rosetta watch
```

## الخطوات التالية

- **[التكوين](/docs/getting-started/configuration)** — مرجع التكوين الكامل
- **[طرق الترجمة](/docs/guides/translation-methods)** — اختيار الطريقة الصحيحة لكل زوج لغوي
- **[ذاكرة الترجمة (Translation Memory)](/docs/concepts/translation-memory)** — كيف يوفر لك التخزين المؤقت المال عند إعادة التشغيل
- **[العمل مع مترجمين محترفين](/docs/guides/professional-translators)** — تصدير XLIFF للمراجعة البشرية
- **[تكامل أطر العمل (Framework Integration)](/docs/guides/framework-integration)** — Hugo، next-intl، react-i18next
- **[CI/CD](/docs/guides/ci-cd)** — أتمتة الترجمات في مسار العمل (pipeline) الخاص بك
- **[استكشاف الأخطاء وإصلاحها](/docs/guides/troubleshooting)** — المشكلات الشائعة والحلول