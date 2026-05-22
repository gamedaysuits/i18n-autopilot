---
sidebar_position: 6
title: "محولات البرامج النصية"
---
# محولات أنظمة الكتابة

محولات أنظمة الكتابة هي إجراءات حتمية لما بعد الترجمة، خالية من نماذج LLM، تقوم بتحويل النص من نظام كتابة إلى آخر. وهي تتيح سير عمل يعتمد على مبدأ "ترجم مرة واحدة، واعرض بأنظمة كتابة متعددة" — حيث تقوم بالترجمة إلى نظام كتابة للعمل (عادةً اللاتيني Latin)، ثم يتم التحويل إلى نظام كتابة العرض تلقائياً.

## لماذا محولات أنظمة الكتابة؟

تستخدم بعض اللغات أنظمة كتابة متعددة لنفس اللغة المنطوقة:

- **Plains Cree**: نظام SRO (Latin) للتحرير → نظام Syllabics (ᓀᐦᐃᔭᐍᐏᐣ) للعرض
- **Serbian**: نظام Latin للاستخدام الدولي → نظام Cyrillic للاستخدام المحلي
- **Klingon**: نظام Romanization للكتابة → نظام pIqaD (  ) للعرض

تؤدي الترجمة المباشرة إلى أنظمة كتابة غير لاتينية إلى حدوث مشكلات: حيث تهلوس نماذج LLM في الحروف، وتصبح ملفات JSON صعبة في التحكم في الإصدارات، ولا تستطيع أدوات مقارنة الاختلافات (diff tools) مقارنة التغييرات. تحل محولات أنظمة الكتابة هذه المشكلة عن طريق الاحتفاظ بالترجمات في نظام كتابة متوافق مع أنظمة التحكم في الإصدارات، وتحويلها بشكل حتمي في وقت المزامنة.

## المحولات المتاحة

يأتي Rosetta مزوداً بخمسة محولات مدمجة لأنظمة الكتابة:

| المنطقة (Locale) | من | إلى | النوع | هل يتطلب خطاً؟ |
|--------|------|----|------|----------------|
| `crk` | SRO (Standard Roman Orthography) | Cree Syllabics | حتمي (Deterministic) | لا — Unicode أصلي |
| `sr` | Latin | Cyrillic | حتمي (Deterministic) | لا — Unicode أصلي |
| `tlh` | Romanization | pIqaD | حتمي (Deterministic) | نعم — PUA U+F8D0–F8FF |
| `x-elvish-s` | Latin | Tengwar (Mode of Beleriand) | حتمي (Deterministic) | نعم — PUA U+E000–E07F |
| `x-kryptonian` | Latin | Kryptonian | تشفير يعتمد على الخط | نعم — PUA U+E100–E119 |

### الحتمي مقابل المعتمد على الخط

- **المحولات الحتمية** (Cree، Serbian، Klingon، Tengwar) تُجري تعييناً حقيقياً من حرف إلى حرف باستخدام قواعد لغوية. يحتوي المخرَج على حروف Unicode فعلية.
- **المحولات المعتمدة على الخط** (Kryptonian) هي عبارة عن شفرات استبدال بنسبة 1:1 حيث يكون المخرَج عبارة عن حروف Unicode PUA لا تُعرض بشكل صحيح إلا عند تحميل خط معين.

## كيف تعمل

تعمل محولات أنظمة الكتابة **بعد** الترجمة كخطوة معالجة لاحقة. يكون مسار العمل كالتالي:

```
Source (English) → LLM Translation → Working Script → Script Converter → Display Script
```

على سبيل المثال، Plains Cree:
```
"Welcome" → LLM → "tānisi" (SRO) → Converter → "ᑖᓂᓯ" (Syllabics)
```

### المطابقة النهمة من اليسار إلى اليمين (Greedy Left-to-Right Matching)

تستخدم جميع المحولات نفس الخوارزمية: في كل موضع حرف، تُجرب أطول مطابقة ممكنة أولاً، ثم المطابقات الأقصر تدريجياً. الحروف التي لا تتطابق مع أي نمط (المسافات، علامات الترقيم، الأرقام) تمر دون تغيير.

يعالج هذا الأمر الحروف المزدوجة (digraphs) والثلاثية (trigraphs) بشكل صحيح:
- Klingon: `tlh` → حرف pIqaD واحد (وليس `t` + `l` + `h`)
- Serbian: `nj` → `њ` (وليس `н` + `ј`)
- Cree: `twê` → مقطع لفظي واحد (وليس `t` + `w` + `ê`)

## استخدام محولات أنظمة الكتابة

تُنشَّط محولات أنظمة الكتابة تلقائياً عندما يتطابق رمز المنطقة (locale) مع محول مسجل. لا حاجة لأي إعدادات — فقط قم بتعيين المنطقة المستهدفة:

```json title="i18n-rosetta.config.json"
{
  "pairs": {
    "en:crk": {
      "method": "llm-coached",
      "model": "google/gemini-2.5-pro"
    }
  }
}
```

عندما يقوم Rosetta بمزامنة الزوج `en:crk`، يتم إنتاج الترجمات أولاً بصيغة SRO، ثم يتم تحويلها تلقائياً إلى Syllabics قبل كتابتها في `crk.json`.

### التحقق من حالة المحول

```bash
npx i18n-rosetta status
```

تُظهر مخرجات الحالة الأزواج التي تحتوي على محولات أنظمة كتابة نشطة ونوع التحويل الذي تقوم به.

## متطلبات خطوط الويب

تُخرج ثلاثة محولات حروفاً ضمن منطقة الاستخدام الخاص (PUA) في Unicode والتي تتطلب خطوط ويب مخصصة:

### Klingon (pIqaD)

قم بتثبيت خط pIqaD متوافق مع CSUR (مثل "pIqaD qolqoS" أو "Klingon pIqaD HaSta"):

```css
@font-face {
  font-family: 'pIqaD';
  src: url('/fonts/pIqaD.woff2') format('woff2');
  unicode-range: U+F8D0-F8FF;
}

:lang(tlh) {
  font-family: 'pIqaD', sans-serif;
}
```

### Tengwar (Sindarin)

قم بتثبيت خط Tengwar متوافق مع CSUR (مثل "Tengwar Formal CSUR" أو "Tengwar Annatar"):

```css
@font-face {
  font-family: 'Tengwar';
  src: url('/fonts/tengwar-formal-csur.woff2') format('woff2');
  unicode-range: U+E000-E07F;
}

:lang(x-elvish-s) {
  font-family: 'Tengwar', serif;
}
```

### Kryptonian

قم بتثبيت خط Kryptonian معين إلى نقاط تشفير PUA من U+E100 إلى U+E119:

```css
@font-face {
  font-family: 'Kryptonian';
  src: url('/fonts/kryptonian.woff2') format('woff2');
  unicode-range: U+E100-E119;
}

:lang(x-kryptonian) {
  font-family: 'Kryptonian', sans-serif;
}
```

:::tip نهج بديل لـ Kryptonian
نظراً لأن Kryptonian عبارة عن تشفير خالص من A إلى Z، يمكنك تخطي محول نظام الكتابة بالكامل وتطبيق الخط على النص اللاتيني عبر CSS. غالباً ما يكون هذا أبسط لعمليات النشر على الويب — ما عليك سوى توفير خط Kryptonian وتعيين `font-family` على العناصر ذات الصلة.
:::

## إضافة محول مخصص

لإضافة محول للغة جديدة، قم بتحرير `lib/scripts.js`:

1. **إنشاء خريطة التحويل** — مصفوفة مرتبة من أزواج `[from, to]`، بحيث تكون التسلسلات الأطول أولاً
2. **إنشاء دالة المحول** — ماسح نهم من اليسار إلى اليمين (استخدم `sroToSyllabics` كقالب)
3. **تسجيله** في كائن `SCRIPT_CONVERTERS` باستخدام رمز المنطقة (locale) كمفتاح
4. **إضافة حقل `script`** إلى إدخال سجل اللغة في `registers.js`

```javascript
// Example: adding a converter for Cherokee (chr)
const LATIN_TO_CHEROKEE_MAP = [
  ['ga', 'Ꭶ'], ['ka', 'Ꭷ'], ['ge', 'Ꭸ'], // ...
];

function latinToCherokee(text) {
  // Same greedy left-to-right pattern as other converters
}

SCRIPT_CONVERTERS['chr'] = {
  from: 'Latin',
  to: 'Cherokee Syllabary',
  type: 'deterministic',
  converter: latinToCherokee,
};
```

## انظر أيضاً

- [اللغات منخفضة الموارد (Low-Resource Languages)](/docs/guides/low-resource-languages) — جولة تفصيلية لمسار العمل بالكامل بما في ذلك تحويل نظام الكتابة
- [بيانات التدريب (Coaching Data)](/docs/concepts/coaching-data) — كيفية تعليم نموذج LLM عن لغتك قبل التحويل
- [بوابة الجودة (Quality Gate)](/docs/concepts/quality-gate) — فحص `script compliance` الذي يتحقق من صحة نظام كتابة المخرجات