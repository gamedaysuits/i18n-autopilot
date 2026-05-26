---
sidebar_position: 6
title: "محولات النصوص"
---
# محولات النصوص

محولات النصوص هي خطافات (hooks) حتمية (deterministic) تُنفذ بعد الترجمة ولا تعتمد على النماذج اللغوية الكبيرة (LLM-free)، وتقوم بتحويل النص من نظام كتابة إلى آخر. وهي تتيح سير عمل يعتمد على مبدأ "ترجم مرة واحدة، واعرض بعدة أنظمة كتابة" — حيث تقوم بالترجمة إلى نظام كتابة عملي (عادةً اللاتيني)، ثم يتم التحويل إلى نظام كتابة العرض تلقائيًا.

## لماذا نستخدم محولات النصوص؟

تستخدم بعض اللغات أنظمة كتابة متعددة لنفس اللغة المنطوقة:

- **Plains Cree**: نظام SRO (اللاتيني) للتحرير → المقاطع اللفظية (Syllabics) (ᓀᐦᐃᔭᐍᐏᐣ) للعرض
- **Serbian**: اللاتيني للاستخدام الدولي → السيريلي (Cyrillic) للاستخدام المحلي
- **Klingon**: الكتابة بالحروف اللاتينية (Romanization) للكتابة → pIqaD (  ) للعرض

تؤدي الترجمة المباشرة إلى أنظمة كتابة غير لاتينية إلى حدوث مشكلات: حيث تهلوس النماذج اللغوية الكبيرة (LLMs) في كتابة الأحرف، وتصبح ملفات JSON صعبة في التحكم في الإصدارات (version-control)، ولا تستطيع أدوات المقارنة (diff tools) مقارنة التغييرات. تحل محولات النصوص هذه المشكلة عن طريق الاحتفاظ بالترجمات في نظام كتابة متوافق مع أنظمة التحكم في الإصدارات، وتحويلها بشكل حتمي في وقت المزامنة.

## المحولات المتاحة

يأتي Rosetta مزودًا بخمسة محولات نصوص مدمجة:

| الإعدادات المحلية (Locale) | من | إلى | النوع | هل يتطلب خطًا؟ |
|--------|------|----|------|----------------|
| `crk` | SRO (Standard Roman Orthography) | Cree Syllabics | حتمي (Deterministic) | لا — Unicode أصلي |
| `sr` | اللاتيني | السيريلي (Cyrillic) | حتمي | لا — Unicode أصلي |
| `tlh` | الكتابة بالحروف اللاتينية | pIqaD | حتمي | نعم — PUA U+F8D0–F8FF |
| `x-elvish-s` | اللاتيني | Tengwar (Mode of Beleriand) | حتمي | نعم — PUA U+E000–E07F |
| `x-kryptonian` | اللاتيني | Kryptonian | تشفير قائم على الخط | نعم — PUA U+E100–E119 |

### المحولات الحتمية مقابل المحولات القائمة على الخطوط

- **المحولات الحتمية (Deterministic converters)** (Cree، Serbian، Klingon، Tengwar) تقوم بتعيين حقيقي من حرف إلى حرف باستخدام القواعد اللغوية. يحتوي المخرج على أحرف Unicode فعلية.
- **المحولات القائمة على الخطوط (Font-based converters)** (Kryptonian) هي شفرات استبدال بنسبة 1:1 حيث يكون المخرج عبارة عن أحرف Unicode PUA لا تُعرض بشكل صحيح إلا عند تحميل خط معين.

## كيف تعمل

تعمل محولات النصوص **بعد** الترجمة كخطوة معالجة لاحقة (post-processing). يكون مسار العمل (pipeline) كالتالي:

```
Source (English) → LLM Translation → Working Script → Script Converter → Display Script
```

على سبيل المثال، لغة Plains Cree:
```
"Welcome" → LLM → "tānisi" (SRO) → Converter → "ᑖᓂᓯ" (Syllabics)
```

### المطابقة النهمة من اليسار إلى اليمين (Greedy Left-to-Right Matching)

تستخدم جميع المحولات نفس الخوارزمية: في كل موضع حرف، يتم تجربة أطول تطابق ممكن أولاً، ثم التطابقات الأقصر تدريجيًا. تمر الأحرف التي لا تتطابق مع أي نمط (المسافات، علامات الترقيم، الأرقام) دون تغيير.

يعالج هذا الأحرف المزدوجة (digraphs) والثلاثية (trigraphs) بشكل صحيح:
- Klingon: `tlh` → حرف pIqaD واحد (وليس `t` + `l` + `h`)
- Serbian: `nj` → `њ` (وليس `н` + `ј`)
- Cree: `twê` → مقطع لفظي واحد (وليس `t` + `w` + `ê`)

## استخدام محولات النصوص

يتم تنشيط محولات النصوص تلقائيًا عندما يتطابق رمز الإعدادات المحلية (locale code) مع محول مسجل. لا حاجة لأي تكوين — ما عليك سوى تعيين الإعدادات المحلية المستهدفة:

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

عندما يقوم rosetta بمزامنة الزوج `en:crk`، يتم إنتاج الترجمات أولاً بنظام SRO، ثم يتم تحويلها تلقائيًا إلى المقاطع اللفظية (Syllabics) قبل كتابتها في `crk.json`.

### التحقق من حالة المحول

```bash
npx i18n-rosetta status
```

يُظهر مخرج الحالة الأزواج التي تحتوي على محولات نصوص نشطة ونوع التحويل الذي تقوم به.

## متطلبات خطوط الويب

تُخرج ثلاثة محولات أحرفًا من منطقة الاستخدام الخاص (PUA) في Unicode والتي تتطلب خطوط ويب مخصصة:

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
نظرًا لأن Kryptonian عبارة عن شفرة خالصة من A إلى Z، يمكنك تخطي محول النصوص بالكامل وتطبيق الخط على النص اللاتيني عبر CSS. غالبًا ما يكون هذا أبسط لعمليات النشر على الويب — ما عليك سوى توفير خط Kryptonian وتعيين `font-family` على العناصر ذات الصلة.
:::

## إضافة محول مخصص

لإضافة محول للغة جديدة، قم بتحرير `lib/scripts.js`:

1. **إنشاء خريطة التحويل** — مصفوفة مرتبة من أزواج `[from, to]`، بحيث تكون التسلسلات الأطول أولاً
2. **إنشاء دالة المحول** — ماسح ضوئي نهم (greedy scanner) من اليسار إلى اليمين (استخدم `sroToSyllabics` كقالب)
3. **تسجيله** في كائن `SCRIPT_CONVERTERS` باستخدام رمز الإعدادات المحلية كمفتاح
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

---

## انظر أيضًا

- [اللغات المصطنعة (Conlangs)، وأنظمة الكتابة، والإملاء](/docs/guides/conlangs-scripts-orthography) — خطوط PUA، وUnicode، وإضافة محولات جديدة
- [بوابة الجودة (Quality Gate)](/docs/concepts/quality-gate) — التحقق الذي يتم تشغيله قبل تحويل النص
- [اللغات المدعومة](/docs/reference/supported-languages) — اللغات التي تحتوي على محولات نصوص
- [دعم لغة قليلة الموارد](https://mtevalarena.org/docs/community/low-resource-languages) — تحويل SRO → المقاطع اللفظية (Syllabics) في السياق
- [كتاب الوصفات: مسار عمل FST-Gated](https://mtevalarena.org/docs/tutorials/fst-gated-pipeline) — تحويل النصوص في مسار عمل متعدد المراحل