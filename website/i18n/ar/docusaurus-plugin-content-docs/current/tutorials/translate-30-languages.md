---
sidebar_position: 2
title: "ترجمة 30 لغة"
description: "دليل عملي: توسيع نطاق مشروع من 3 لغات إلى 30 لغة باستخدام per-pair method mixing وbatching وCI integration."
---
# دليل عملي: ترجمة 30 لغة

قم بتوسيع نطاق مشروعك من عدد قليل من اللغات المحلية إلى تغطية عالمية. يستعرض هذا الدليل العملي اختيار الطريقة، وتحسين التكلفة، والتكامل مع CI (التكامل المستمر) لنشر حقيقي متعدد اللغات.

**السيناريو:** لديك تطبيق SaaS يحتوي على `en`، `fr`، `es`. تحتاج إلى إضافة 27 لغة أخرى عبر ثلاثة مستويات من متطلبات الجودة.

---

## الخطوة 1: تصنيف لغاتك

لا تحتاج جميع اللغات الثلاثين إلى نفس النهج. قم بتجميعها حسب جودة الطريقة المتاحة:

| المستوى | اللغات | الطريقة | السبب |
|------|-----------|--------|-----|
| **المستوى 1 — مميز** | `ja`, `ko`, `zh`, `de`, `pt` | `llm` (GPT-4o) | أسواق عالية القيمة، قواعد لغوية دقيقة |
| **المستوى 2 — قياسي** | `it`, `nl`, `pl`, `sv`, `da`, `fi`, `no`, `cs`, `ro`, `hu`, `el`, `tr`, `id`, `ms`, `th`, `vi`, `uk`, `bg` | `google-translate` | حجم كبير، مدعومة بشكل جيد من Google |
| **المستوى 3 — موجه** | `crk`, `oj`, `mi`, `haw` | `llm-coached` + إضافات (plugins) | موارد منخفضة، تتطلب فرض المصطلحات |

## الخطوة 2: التكوين لكل زوج لغوي

```json title="i18n-rosetta.config.json"
{
  "version": 3,
  "inputLocale": "en",
  "localesDir": "./locales",
  "defaultMethod": "google-translate",
  "model": "google/gemini-3.5-flash",
  "languages": {
    "ja": { "name": "Japanese", "register": "Polite/formal" },
    "ko": { "name": "Korean", "register": "Formal" },
    "zh": { "name": "Simplified Chinese", "register": "Neutral" },
    "de": { "name": "German", "register": "Formal (Sie)" },
    "pt": { "name": "Brazilian Portuguese", "register": "Informal" },
    "crk": { "name": "Plains Cree (SRO)", "register": "Neutral" }
  },
  "pairs": {
    "en:ja": { "method": "llm", "model": "openai/gpt-4o" },
    "en:ko": { "method": "llm", "model": "openai/gpt-4o" },
    "en:zh": { "method": "llm", "model": "openai/gpt-4o" },
    "en:de": { "method": "llm", "model": "openai/gpt-4o" },
    "en:pt": { "method": "llm", "model": "openai/gpt-4o" },
    "en:crk": { "methodPlugin": "crk-coached-v1" }
  }
}
```

**ملاحظة:** اللغات غير المدرجة في `pairs` ترث `defaultMethod: "google-translate"`. لا تحتاج إلى إدراج جميع اللغات الثلاثين.

:::info
دعم `crk` قيد التطوير — راجع [دعم لغة ذات موارد منخفضة](https://mtevalarena.org/docs/community/low-resource-languages) لمعرفة الحالة وإرشادات المساهمة.
:::

## الخطوة 3: إعداد مفاتيح واجهة برمجة التطبيقات (API Keys)

ستحتاج إلى كلا مفتاحي واجهة برمجة التطبيقات (API) لهذا التكوين:

```bash
export OPENROUTER_API_KEY="sk-or-v1-..."
export GOOGLE_TRANSLATE_API_KEY="AIza..."
```

## الخطوة 4: إجراء تشغيل تجريبي أولاً

قم دائمًا بالمعاينة قبل ترجمة 30 لغة:

```bash
npx i18n-rosetta sync --dry
```

راجع المخرجات. ستعرض ما يلي:
- أي الأزواج اللغوية تستخدم أي طريقة
- عدد المفاتيح الجديدة/المعدلة لكل لغة محلية
- استدعاءات واجهة برمجة التطبيقات (API) المقدرة لكل مستوى

## الخطوة 5: تشغيل المزامنة

```bash
npx i18n-rosetta sync
```

يعالج Rosetta كل زوج لغوي بشكل مستقل. ستكون أزواج المستوى 2 التي تستخدم Google Translate سريعة. ستكون أزواج المستوى 1 التي تستخدم النماذج اللغوية الكبيرة (LLM) أبطأ ولكن بجودة أعلى. تستخدم أزواج المستوى 3 الموجهة بيانات التوجيه الخاصة بالإضافة (plugin).

### التحديثات التزايدية

بعد المزامنة الأولية، تقوم عمليات التشغيل اللاحقة بترجمة المفاتيح **المعدلة أو الجديدة** فقط:

```bash
# Only keys that changed since last sync
npx i18n-rosetta sync
```

يتتبع ملف القفل (`.i18n-rosetta.lock`) ما تمت ترجمته، لذلك لن تقوم أبدًا بإعادة ترجمة المحتوى المستقر.

## الخطوة 6: تدقيق الجودة

تحقق من حالة جميع الأزواج اللغوية:

```bash
npx i18n-rosetta status
```

يُخرج هذا جدولًا يوضح طريقة كل زوج، والنموذج، ومستوى الجودة، وما إذا كانت بيانات التوجيه أو درجات التقييم المرجعية متاحة.

## الخطوة 7: التكامل مع CI

أضف ذلك إلى سير عمل GitHub Actions الخاص بك لتبقى الترجمات مُحدَّثة مع كل عملية دفع (push):

```yaml title=".github/workflows/i18n-sync.yml"
name: Sync Translations
on:
  push:
    paths:
      - 'locales/en/**'

jobs:
  translate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20

      - run: npm ci

      - name: Sync translations
        run: npx i18n-rosetta sync
        env:
          OPENROUTER_API_KEY: ${{ secrets.OPENROUTER_API_KEY }}
          GOOGLE_TRANSLATE_API_KEY: ${{ secrets.GOOGLE_TRANSLATE_API_KEY }}

      - name: Commit updated translations
        run: |
          git config user.name "github-actions[bot]"
          git config user.email "github-actions[bot]@users.noreply.github.com"
          git add locales/
          git diff --staged --quiet || git commit -m "chore(i18n): sync translations"
          git push
```

## تقدير التكلفة

لمشروع يحتوي على 500 مفتاح مصدري عبر 30 لغة:

| المستوى | اللغات | الطريقة | التكلفة التقريبية |
|------|-----------|--------|-----------------|
| المستوى 1 (5 لغات) | ja, ko, zh, de, pt | GPT-4o | ~$2.50/مزامنة كاملة |
| المستوى 2 (18 لغة) | it, nl, pl, etc. | Google Translate | ~$0.90/مزامنة كاملة |
| المستوى 3 (4 لغات) | crk, oj, mi, haw | GPT-4o-mini موجه | ~$0.40/مزامنة كاملة |
| **الإجمالي** | **30 لغة** | **مختلطة** | **~$3.80/مزامنة كاملة** |

تكلف عمليات المزامنة التزايدية (5–20 مفتاحًا معدلًا) جزءًا بسيطًا من تكلفة المزامنة الكاملة.

## انظر أيضاً

- [طرق الترجمة](/docs/guides/translation-methods) — كيف تعمل كل طريقة ترجمة ومتى يجب استخدامها
- [مواصفات الإضافة (Plugin)](/docs/reference/plugin-spec) — إنشاء بيانات توجيه لأي من لغات المستوى 3 الخاصة بك
- [دليل CI/CD](/docs/guides/ci-cd) — أنماط CI المتقدمة بما في ذلك إنشاءات معاينة طلبات السحب (PR preview builds)
- [بوابة الجودة](/docs/concepts/quality-gate) — كيف يتحقق Rosetta من صحة كل ترجمة قبل كتابتها
- [اللغات المدعومة](/docs/reference/supported-languages) — القائمة الكاملة لرموز اللغات وتوافق الطرق
- [دعم لغة ذات موارد منخفضة](https://mtevalarena.org/docs/community/low-resource-languages) — إضافة بيانات توجيه للغات التي لا تحظى بتغطية واسعة في الترجمة الآلية (MT)