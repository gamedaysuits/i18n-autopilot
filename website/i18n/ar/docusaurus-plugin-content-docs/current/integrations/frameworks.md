# أدلة التكامل

إعداد i18n-rosetta خطوة بخطوة مع أطر العمل الشائعة.

---

## إعداد مفتاح API

قبل التكامل مع أي إطار عمل، تحتاج إلى مفتاح API للترجمة. يدعم Rosetta مزودين اثنين:

### الخيار أ: OpenRouter (موصى به)

يوفر [OpenRouter](https://openrouter.ai) واجهة برمجة تطبيقات (API) موحدة لأكثر من 200 نموذج من نماذج اللغات الكبيرة (LLM). تتوفر باقة مجانية.

```bash
# Sign up at https://openrouter.ai, then:
export OPENROUTER_API_KEY=sk-or-v1-...

# Or add to .env.local:
OPENROUTER_API_KEY=sk-or-v1-your-key-here
```

الأفضل لـ: المشاريع المليئة بالمحتوى، ترجمة Markdown، والمشاريع التي تحتاج إلى حماية واعية بالمحتوى (كتل التعليمات البرمجية، الرموز القصيرة، متغيرات الاستيفاء).

### الخيار ب: Google Translate

```bash
export GOOGLE_TRANSLATE_API_KEY=...
```

الأفضل لـ: أزواج السلاسل النصية (key-value) ذات الحجم الكبير (أكثر من 130 لغة). **غير موصى به** لمحتوى Markdown — لا يمتلك Google Translate أي وعي بكتل التعليمات البرمجية، أو الرموز القصيرة، أو متغيرات الاستيفاء.

لاستخدام Google Translate بشكل صريح:

```bash
i18n-rosetta sync --method google-translate
```

> **تلميح**: إذا تم تعيين `GOOGLE_TRANSLATE_API_KEY` فقط (بدون مفتاح OpenRouter)، فسيقوم rosetta بالتبديل التلقائي إلى Google Translate.

---

## Hugo (TOML / YAML / Markdown)

### هيكل المشروع

يستخدم Hugo `i18n/` لترجمة السلاسل النصية و `content/` لمحتوى الصفحة:

```
my-hugo-site/
├── i18n/
│   ├── en.toml             ← source of truth
│   ├── fr.toml
│   └── ja.toml
├── content/
│   ├── posts/
│   │   ├── hello.md        ← source (English)
│   │   ├── hello.fr.md
│   │   └── hello.ja.md
│   └── about.md
└── .env.local
```

### الإعداد

```bash
npm install --save-dev i18n-rosetta
```

```bash
# .env.local
OPENROUTER_API_KEY=sk-or-v1-your-key-here
```

قم بإنشاء `i18n-rosetta.config.json`:

```json
{
  "version": 3,
  "inputLocale": "en",
  "localesDir": "./i18n",
  "contentDir": "./content",
  "format": "auto",
  "languages": ["fr", "de", "ja", "es", "ko", "zh"]
}
```

```bash
i18n-rosetta sync           # sync i18n string files + content files
i18n-rosetta sync --dry     # preview changes without writing
```

### تفاصيل ترجمة المحتوى

**Front matter**: يدعم محددات كل من YAML (`---`) و TOML (`+++`). يترجم `title`، و `description`، و `summary`، و `subtitle`، و `caption`، و `linkTitle` افتراضيًا. يتم الاحتفاظ بجميع الحقول الأخرى (date، draft، tags، weight، slug، إلخ). يمكنك تخصيص ذلك باستخدام `translatableFields` في ملف التكوين الخاص بك.

**حماية الكتل**: تتم حماية كتل التعليمات البرمجية، والرموز القصيرة في Hugo (`{{< >}}`، `{{% %}}`)، والتعليمات البرمجية المضمنة، و HTML الخام تلقائيًا باستخدام عناصر نائبة حارسة من Unicode. حيث يتم تمريرها دون أي تغيير.

**اصطلاح تسمية الملفات**: يتبع نمط الترجمة حسب اسم الملف الخاص بـ Hugo:
- `my-post.md` → `my-post.fr.md`
- `my-post.en.md` → `my-post.fr.md` (يزيل لاحقة المصدر)

**تخطي الملفات الموجودة**: لا يتم أبدًا الكتابة فوق الملفات المترجمة الموجودة. احذف الملف المستهدف لفرض إعادة الترجمة.

### صيغ الجمع

تدعم ملفات الترجمة بصيغتي TOML و YAML صيغ الجمع الخاصة بـ CLDR:

```toml
[items]
one = "{{ .Count }} item"
other = "{{ .Count }} items"
```

يتم تمثيلها داخليًا كـ `items.one` و `items.other` لإجراء المقارنة، ثم يُعاد تسلسلها إلى التنسيق المقطعي الصحيح عند الكتابة.

---

## next-intl (JSON)

### هيكل المشروع

```
my-app/
├── messages/
│   └── en.json        ← source of truth
├── src/
│   ├── i18n/
│   │   ├── routing.ts
│   │   └── request.ts
│   └── middleware.ts
└── .env.local
```

### الإعداد

```bash
npm install --save-dev i18n-rosetta
```

قم بإنشاء `i18n-rosetta.config.json`:

```json
{
  "version": 3,
  "inputLocale": "en",
  "localesDir": "./messages",
  "languages": ["fr", "de", "ja", "es", "ko", "zh", "pt", "ar"]
}
```

```bash
npx i18n-rosetta sync
```

ينشئ `messages/fr.json`، و `messages/ja.json`، إلخ — مترجمة بالكامل، مع الحفاظ على هيكل المفاتيح المتداخلة الخاص بك. يلتقطها next-intl تلقائيًا.

### سير عمل التطوير

```json
{
  "scripts": {
    "dev": "i18n-rosetta watch & next dev",
    "i18n:sync": "i18n-rosetta sync",
    "i18n:audit": "i18n-rosetta audit"
  }
}
```

---

## react-i18next (JSON)

### هيكل الملفات المسطح (موصى به)

```
locales/
├── en.json
├── fr.json
└── ja.json
```

```json
{
  "version": 3,
  "inputLocale": "en",
  "localesDir": "./locales",
  "languages": ["fr", "de", "ja"]
}
```

### هيكل الدلائل المتداخلة

إذا كنت تستخدم هيكل `{locale}/{namespace}.json`، فقم بإنشاء برنامج نصي للمزامنة للقيام بالتسطيح (flatten) ← الترجمة ← إلغاء التسطيح (unflatten). راجع [مستندات react-i18next](https://react.i18next.com/) للحصول على التفاصيل.