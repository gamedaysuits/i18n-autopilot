---
sidebar_position: 5
title: "ترجمة المحتوى"
---
# ترجمة المحتوى (Hugo Markdown)

تترجم Rosetta ملفات Hugo Markdown — سواء حقول front matter أو محتوى النص — مع حماية كاملة لـ code blocks، و shortcodes، والعناصر المهيكلة.

## الإعداد

قم بتعيين `contentDir` في ملف التكوين (config) الخاص بك لتمكين ترجمة محتوى Markdown:

```json title="i18n-rosetta.config.json"
{
  "version": 3,
  "inputLocale": "en",
  "localesDir": "./i18n",
  "contentDir": "./content"
}
```

```bash
npx i18n-rosetta sync    # translates both string files and content files
```

## ما الذي تتم ترجمته

### Front Matter

يتم دعم محددات كل من YAML (`---`) و TOML (`+++`). افتراضياً، تتم ترجمة هذه الحقول:

- `title`
- `description`
- `summary`
- `subtitle`
- `caption`
- `linkTitle`

يتم الاحتفاظ بجميع الحقول الأخرى (`date`، `draft`، `tags`، `weight`، `slug`، إلخ) كما هي. يمكنك التخصيص باستخدام `translatableFields` في ملف التكوين الخاص بك.

### محتوى النص

تتم ترجمة نص Markdown بالكامل مع حماية الكتل — حيث يتم حجب العناصر المهيكلة باستخدام عناصر نائبة من نوع Unicode قبل الترجمة واستعادتها بعدها.

## حماية الكتل

تمر هذه العناصر عبر الترجمة دون المساس بها:

| العنصر | المثال | الحماية |
|---------|---------|-----------|
| Code blocks | ``````` ```js ... ``` ``````` | حجب الكتلة بالكامل |
| Inline code | `` `variable` `` | محجوب |
| Hugo shortcodes | `{{< figure >}}`, `{{% note %}}` | حجب الكتلة بالكامل |
| Raw HTML | `<div>`, `<table>` | محجوب |
| الروابط (URLs) | `[text](https://...)` | الاحتفاظ بالرابط (URL)، وترجمة النص |
| Interpolation | `{{ .Count }}` | محجوب |

## اصطلاح تسمية الملفات

يتبع نمط الترجمة حسب اسم الملف الخاص بـ Hugo:

```
my-post.md      → my-post.fr.md
my-post.en.md   → my-post.fr.md  (strips source suffix)
```

## سلوك التخطي

**لا يتم أبداً الكتابة فوق** الملفات المترجمة الموجودة مسبقاً. إذا كان `my-post.fr.md` موجوداً بالفعل، فسيتم تخطيه. احذف الملف المستهدف لفرض إعادة الترجمة.

## الطرق الخاصة بـ Markdown فقط

:::warning Google Translate و Markdown
ليس لدى Google Translate **أي إدراك** لـ code blocks، أو shortcodes، أو متغيرات interpolation. سيؤدي ذلك إلى إتلاف محتوى Markdown المهيكل. استخدم طرق LLM (`llm` أو `llm-coached`) لترجمة المحتوى — فهي تحجب العناصر المهيكلة بشكل صريح.
:::

عندما تنتقل ترجمة المحتوى احتياطياً من Google Translate إلى إحدى طرق LLM، تسجل rosetta تحذيراً يوضح السبب.