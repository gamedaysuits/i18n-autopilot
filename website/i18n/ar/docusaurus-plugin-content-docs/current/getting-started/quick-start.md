---
sidebar_position: 2
title: "البدء السريع"
---
# البدء السريع

ترجم ملف الترجمة (locale) الأول الخاص بك في 60 ثانية.

## 1. إعداد ملفات الترجمة الخاصة بك

أنشئ ملف ترجمة المصدر. يدعم Rosetta تنسيقات JSON، و TOML، و YAML:

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

احصل على مفتاح Gemini مجاني من [aistudio.google.com/apikey](https://aistudio.google.com/apikey). واحصل على مفتاح OpenRouter من [openrouter.ai](https://openrouter.ai).

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
4. كتابة `locales/fr.json`، و `locales/ja.json`، إلخ.
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

عندما تقوم بتغيير نص المصدر، يكتشف rosetta التغيير عبر تتبع تجزئة SHA-256 ويعيد ترجمة ذلك المفتاح فقط في المزامنة التالية:

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

## اختياري: إنشاء ملف تكوين

لمزيد من التحكم، قم بإنشاء ملف تكوين:

```bash
npx i18n-rosetta init                         # guided wizard
npx i18n-rosetta init --yes --langs fr,de,ja  # quick setup with specific targets
```

يرشدك المعالج الموجه خلال **الإعدادات المسبقة للأسلوب (register presets)** لكل لغة — وهي تعليمات جاهزة للنبرة/الرسمية مضبوطة وفقاً لنظامها اللغوي. تحتوي اللغة الفرنسية على إعدادات T-V المسبقة (vouvoiement مقابل tutoiement)، وتحتوي اللغة الكورية على مستويات التحدث (해요체 مقابل 합쇼체 مقابل 해체)، وتحتوي اللغة اليابانية على خيارات keigo (です/ます مقابل 丁寧語).

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

ترجمة تلقائية عند تغيير ملف المصدر الخاص بك:

```bash
npx i18n-rosetta watch
```

## الخطوات التالية

- **[التكوين](/docs/getting-started/configuration)** — مرجع التكوين الكامل
- **[طرق الترجمة](/docs/guides/translation-methods)** — اختيار الطريقة المناسبة
- **[تكامل أطر العمل](/docs/guides/framework-integration)** — Hugo، و next-intl، و react-i18next
- **[CI/CD](/docs/guides/ci-cd)** — أتمتة الترجمات في مسار العمل الخاص بك