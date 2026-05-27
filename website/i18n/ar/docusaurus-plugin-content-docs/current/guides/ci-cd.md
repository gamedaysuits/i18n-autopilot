---
sidebar_position: 3
title: "CI/CD"
---
# تكامل CI/CD

أتمتة الترجمات في مسار البناء الخاص بك.

## GitHub Actions: المزامنة عند الدفع

أضف مزامنة الترجمة إلى مسار البناء الحالي الخاص بك:

```yaml title=".github/workflows/deploy.yml"
jobs:
  build:
    steps:
      - uses: actions/checkout@v4
      - run: npm ci
      - name: Sync translations
        env:
          OPENROUTER_API_KEY: ${{ secrets.OPENROUTER_API_KEY }}
        run: npx i18n-rosetta sync
      - run: npm run build
```

## GitHub Actions: المزامنة المجدولة

قم بتشغيل الترجمات وفقاً لجدول زمني وإجراء التزام تلقائي:

```yaml title=".github/workflows/i18n-sync.yml"
name: Sync translations
on:
  schedule:
    - cron: '0 6 * * *'
  workflow_dispatch:

jobs:
  sync:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm ci
      - name: Sync translations
        env:
          OPENROUTER_API_KEY: ${{ secrets.OPENROUTER_API_KEY }}
        run: npx i18n-rosetta sync
      - name: Commit updated translations
        run: |
          git config user.name "i18n-rosetta"
          git config user.email "bot@example.com"
          git add i18n/ content/ locales/ messages/
          git diff --staged --quiet || git commit -m "chore: sync translations"
          git push
```

## طريقة Google Translate

إذا كنت تستخدم طريقة Google Translate المدمجة بدلاً من OpenRouter:

```yaml
- name: Sync translations
  env:
    GOOGLE_TRANSLATE_API_KEY: ${{ secrets.GOOGLE_TRANSLATE_API_KEY }}
  run: npx i18n-rosetta sync
```

## مزودو LLM المباشرون

إذا كنت تستخدم طرق `openai` أو `anthropic` أو `gemini` مباشرة:

```yaml
# OpenAI
- name: Sync translations
  env:
    OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
  run: npx i18n-rosetta sync --method openai

# Anthropic
- name: Sync translations
  env:
    ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
  run: npx i18n-rosetta sync --method anthropic

# Gemini (free tier available)
- name: Sync translations
  env:
    GEMINI_API_KEY: ${{ secrets.GEMINI_API_KEY }}
  run: npx i18n-rosetta sync --method gemini
```

## DeepL

```yaml
- name: Sync translations
  env:
    DEEPL_API_KEY: ${{ secrets.DEEPL_API_KEY }}
  run: npx i18n-rosetta sync --method deepl
```

## واجهة برمجة تطبيقات (API) الترجمة عن بُعد

إذا كنت تستخدم نقطة نهاية للترجمة عن بُعد (على سبيل المثال، خدمة ترجمة مستضافة):

```yaml
- name: Sync translations
  env:
    ROSETTA_API_KEY: ${{ secrets.ROSETTA_API_KEY }}
  run: npx i18n-rosetta sync
```

## مسار CI ثلاثي الطبقات

للحصول على أقصى تغطية لـ i18n، قم بتأمين مسارك باستخدام الأدوات الثلاث جميعها:

```yaml
jobs:
  i18n:
    steps:
      - uses: actions/checkout@v4
      - run: npm ci

      # 1. Catch hardcoded strings before they ship
      - run: npx i18n-rosetta lint

      # 2. Translate missing keys
      - run: npx i18n-rosetta sync
        env:
          OPENROUTER_API_KEY: ${{ secrets.OPENROUTER_API_KEY }}

      # 3. Fail if any locale is incomplete
      - run: npx i18n-rosetta audit
```

| الطبقة | الأمر | متى | الغرض |
|-------|---------|------|---------|
| **Lint** | `lint` | قبل الالتزام (Pre-commit) | حظر الالتزامات التي تحتوي على نصوص ثابتة |
| **Sync** | `sync` | بعد الالتزام / CI | ترجمة المفاتيح المفقودة والمعدلة |
| **Audit** | `audit` | خطوة البناء (Build step) | إفشال النشر إذا كانت أي لغة غير مكتملة |

:::tip ذاكرة الترجمة في CI
إذا كان مشغل CI الخاص بك يحتوي على مساحة عمل مستمرة (أو يقوم بتخزين `.rosetta/` مؤقتاً)، فسيتم تفعيل ذاكرة الترجمة (Translation Memory) تلقائياً — حيث ستقوم عمليات المزامنة اللاحقة بترجمة المفاتيح التي تغير نصها المصدر فعلياً فقط. بالنسبة للمشغلات المؤقتة، فكر في التخزين المؤقت لـ `.rosetta/tm.json` بين عمليات التشغيل:

```yaml
- uses: actions/cache@v4
  with:
    path: .rosetta/tm.json
    key: rosetta-tm-${{ hashFiles('locales/en.json') }}
    restore-keys: rosetta-tm-
```
:::

---

## انظر أيضاً

- [مرجع CLI](/docs/reference/cli) — مرجع الأوامر الكامل
- [كيف تعمل المزامنة](/docs/concepts/how-sync-works) — فهم المزامنة التدريجية
- [ذاكرة الترجمة](/docs/concepts/translation-memory) — التخزين المؤقت وتوفير التكاليف
- [طرق الترجمة](/docs/guides/translation-methods) — اختيار الطريقة لكل زوج لغوي
- [بوابة الجودة (Quality Gate)](/docs/concepts/quality-gate) — ماذا يحدث عند فشل الترجمات
- [الإعدادات](/docs/getting-started/configuration) — مرجع الإعدادات