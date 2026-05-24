---
slug: v3-1-content-translation
title: "v3.1.0: ترجمة محتوى Hugo Markdown"
authors: [curtisforbes]
tags: [release]
date: 2026-04-15
---
يضيف الإصدار v3.1.0 ترجمة كاملة لمحتوى Markdown في Hugo — حقول front matter ومحتوى النص الأساسي، مع حماية تلقائية لـ code blocks، و shortcodes، و interpolation variables.

<!-- truncate -->

## ترجمة مدركة للمحتوى

عند ترجمة Markdown، لا يمكنك ببساطة إرسال الملف الخام إلى LLM. حيث تتم ترجمة code blocks. وتتعرض shortcodes للتلف. وتتشوه متغيرات قوالب Hugo.

يحل Rosetta v3.1.0 هذه المشكلة باستخدام **Unicode sentinel shielding**:

1. قبل الترجمة، يتم استبدال الكتل المهيكلة (code fences، و shortcodes، و inline code، و HTML) برموز حارسة (sentinel tokens) فريدة
2. يتلقى LLM النص القابل للترجمة فقط
3. بعد الترجمة، تتم استعادة الرموز الحارسة (sentinels) بمحتواها الأصلي

لا يرى LLM أبداً code blocks الخاصة بك. وبالتالي لا يمكنه إتلافها.

## دعم Front Matter

يتم دعم محددات front matter لكل من YAML (`---`) و TOML (`+++`). افتراضياً، تتم ترجمة `title`، و `description`، و `summary`، و `subtitle`، و `caption`، و `linkTitle`. يتم الاحتفاظ بجميع الحقول الأخرى (date، و draft، و tags، و weight) كما هي.

## الإعداد

```json title="i18n-rosetta.config.json"
{
  "contentDir": "./content"
}
```

```bash
npx i18n-rosetta sync   # now translates content too
```

راجع [دليل ترجمة المحتوى](/docs/guides/content-translation) للحصول على التفاصيل.