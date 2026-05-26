---
sidebar_position: 3
title: "اللغات المصطنعة، وأنظمة الكتابة، والإملاء"
---
# اللغات المصطنعة، أنظمة الكتابة وقواعد الإملاء

يوفر rosetta دعمًا من الدرجة الأولى للغات المصطنعة (constructed languages) عبر سجلات النماذج اللغوية الكبيرة (LLM registers) ومحولات النصوص الحتمية. يغطي هذا الدليل كيفية عمل دعم اللغات المصطنعة، والخطوط التي تحتاجها، وكيفية إضافة لغتك الخاصة.

:::tip لماذا تعتبر اللغات المصطنعة مهمة
اللغات المصطنعة ليست مجرد حداثة — فهي تستخدم نفس البنية التحتية المستخدمة للغات الحقيقية غير المخدومة بشكل كافٍ. تعمل بوابة الجودة، ونظام التوجيه، ومسار تحويل النصوص بشكل متطابق مع لغات مثل Klingon و Plains Cree. إذا كان مسار لغتك المصطنعة يعمل بنجاح، فإن مسار لغتك ذات الموارد المحدودة سيعمل بنجاح أيضًا.
:::

---

## اللغات المصطنعة المدعومة

| اللغة | الرمز | محول النصوص | الخط المطلوب |
|----------|------|:----------------:|:-------------:|
| Klingon | `tlh` | ✅ الرومنة → pIqaD | خط PUA (مثل pIqaD qolqoS) |
| Sindarin (Tolkien Elvish) | `x-elvish-s` | ✅ اللاتينية → Tengwar | خط CSUR PUA |
| Kryptonian | `x-kryptonian` | ✅ اللاتينية → Kryptonian | خط PUA |
| Pirate English | `x-pirate` | ❌ السجل فقط | لا يوجد |
| Shakespearean English | `x-shakespeare` | ❌ السجل فقط | لا يوجد |
| Yoda-speak | `x-yoda` | ❌ السجل فقط | لا يوجد |

تستخدم رموز اللغات المصطنعة البادئة `x-` وفقًا لاتفاقية الاستخدام الخاص BCP-47، باستثناء Klingon (`tlh`) التي تمتلك رمز [ISO 639-3](https://iso639-3.sil.org/code/tlh) مخصصًا من قبل SIL International.

---

## متطلبات Unicode و PUA والخطوط

### منطقة الاستخدام الخاص (PUA)

تستخدم لغات Klingon (pIqaD) و Sindarin (Tengwar) و Kryptonian رموز **منطقة الاستخدام الخاص (PUA)** في Unicode. منطقة PUA هي النطاق U+E000–U+F8FF — وهذه النقاط الرمزية **ليس لها تعيين قياسي**. يحتفظ [ConScript Unicode Registry (CSUR)](https://www.evertype.com/standards/csur/) بتعيينات متفق عليها مجتمعيًا للنصوص الخيالية، ولكنها ليست جزءًا من معيار Unicode.

ما يعنيه هذا عمليًا:

- يُعرض نص PUA على شكل **مربعات فارغة** (□□□) إذا لم يتم تحميل الخط الصحيح
- قد تقوم الخطوط المختلفة بتعيين أشكال (glyphs) مختلفة لنفس النقاط الرمزية في PUA
- لا يقوم rosetta بتضمين خطوط PUA — يجب عليك تحميلها بنفسك
- لن تقوم خطوط النظام أبدًا بعرض هذه الرموز

### نطاقات PUA حسب النص

| النص | نطاق PUA | مرجع CSUR |
|--------|-----------|---------------|
| Klingon (pIqaD) | U+F8D0–U+F8FF | [CSUR Klingon](https://www.evertype.com/standards/csur/klingon.html) |
| Tengwar (Elvish) | U+E000–U+E07F | [CSUR Tengwar](https://www.evertype.com/standards/csur/tengwar.html) |
| Kryptonian | يختلف حسب الخط | لا يوجد معيار CSUR |

### تحميل خطوط الويب PUA

لعرض نص لغة مصطنعة يعتمد على PUA في تطبيق الويب الخاص بك، قم بتحميل الخط المناسب عبر CSS:

```css
/* Load a Klingon PUA font */
@font-face {
  font-family: 'pIqaD';
  src: url('/fonts/piqad.woff2') format('woff2');
  unicode-range: U+F8D0-U+F8FF;
}

/* Apply to Klingon text elements */
[lang="tlh"] {
  font-family: 'pIqaD', sans-serif;
}
```

:::warning دعم Unicode غير مضمون
لقد [رفض اتحاد Unicode صراحةً](https://www.unicode.org/faq/private_use.html) ترميز النصوص الخيالية في المعيار. يتم الحفاظ على تعيينات PUA من قبل المجتمع وقد تتعارض بين تطبيقات الخطوط. حدد دائمًا الخط الدقيق الذي يستخدمه مشروعك، واختبر العرض عبر المتصفحات.
:::

---

## محولات النصوص

### كيف تعمل

يُعد تحويل النصوص في rosetta **إجراءً لاحقًا للترجمة (post-translation hook)**:

1. يقوم النموذج اللغوي الكبير (LLM) بترجمة النص إلى **نص عملي** (عادةً اللاتينية أو SRO)
2. تقوم [بوابة الجودة](/docs/concepts/quality-gate) بالتحقق من صحة المخرجات
3. يقوم المحول الحتمي بتحويل النص المعتمد إلى **نص العرض**
4. تتم كتابة النص المحول على القرص

يعمل هذا النهج المكون من خطوتين لأن النماذج اللغوية الكبيرة (LLMs) تنتج مخرجات أفضل عند العمل بنصوص تعتمد على اللاتينية. يضمن المحول الحتمي إخراج النص الصحيح دون الاعتماد على معرفة النموذج بالنصوص (والتي غالبًا ما تكون غير موثوقة).

### المحولات الخمسة بالكامل

يأتي rosetta مزودًا بخمسة محولات نصوص مدمجة:

#### Plains Cree: SRO → المقاطع اللفظية (`crk`)

من قواعد الإملاء الرومانية القياسية (SRO) إلى المقاطع اللفظية للسكان الأصليين في كندا.

```
Input:  "tawâw"
Output: "ᑕᐚᐤ"
```

تستخدم حروف العلة الطويلة علامات التشكيل (macron/circumflex): ê, î, ô, â. يتعامل المحول مع جميع علامات التشكيل الخاصة بـ SRO ويعينها إلى الأحرف المقطعية الصحيحة. راجع [دعم لغة ذات موارد محدودة](https://mtevalarena.org/docs/community/low-resource-languages) للحصول على مسار Cree الكامل.

#### Serbian: اللاتينية → السيريلية (`sr`)

تحويل حتمي من اللاتينية إلى السيريلية للغة الصربية.

```
Input:  "zdravo"
Output: "здраво"
```

يتعامل هذا مع تعيين الأبجدية الصربية بالكامل بما في ذلك الحروف المزدوجة (digraphs) (lj → љ, nj → њ, dž → џ).

#### Klingon: الرومنة → pIqaD (`tlh`)

نظام الرومنة الخاص بـ Marc Okrand إلى رموز pIqaD في PUA.

```
Input:  "Qapla'"    (romanized Klingon)
Output: [pIqaD PUA] (requires pIqaD font to render)
```

#### Sindarin: اللاتينية → Tengwar (`x-elvish-s`)

تعيين Tengwar في وضع Sindarin الخاص بـ Tolkien.

```
Input:  "elen síla"  (Latin Sindarin)
Output: [Tengwar PUA] (requires Tengwar font to render)
```

#### Kryptonian: اللاتينية → Kryptonian (`x-kryptonian`)

تعيين نص Kryptonian الخاص بمعجم المعجبين.

```
Input:  "Kal-El"
Output: [Kryptonian PUA] (requires Kryptonian font to render)
```

### تشغيل المحول

قم بتعيين حقل `scripts` في تكوين لغتك. بالنسبة للمحولات المدمجة، يتم اكتشاف ذلك تلقائيًا من رمز اللغة:

```json
{
  "languages": {
    "sr": { "scripts": "sr" },
    "crk": {}
  }
}
```

يتم اكتشاف Plains Cree (`crk`) تلقائيًا — لا تحتاج إلى تعيين `scripts` بشكل صريح.

---

## اللغات متعددة النصوص

تستخدم بعض اللغات الحقيقية نصوصًا نشطة متعددة:

| اللغة | النصوص | نهج rosetta |
|----------|---------|-----------------|
| Serbian | اللاتينية + السيريلية | محول النصوص (`sr`) — الترجمة باللاتينية، والتحويل إلى السيريلية |
| Chinese | المبسطة + التقليدية | رموز لغات (locale codes) منفصلة (`zh` مقابل `zh-TW`) بسجلات مميزة |

بالنسبة للغات التي يخدم فيها كلا النصين نفس الجمهور (Serbian)، استخدم محول نصوص. أما بالنسبة للغات التي تخدم فيها النصوص جماهير مختلفة (الصينية المبسطة للصين القارية، والتقليدية لتايوان/هونغ كونغ)، فاستخدم رموز لغات (locale codes) منفصلة.

---

## ملاحظات حول قواعد الإملاء

السجلات ليست مجرد نبرة صوت — بل تحمل **تعليمات إملائية** توجه النموذج اللغوي الكبير (LLM) نحو اصطلاحات الكتابة الصحيحة.

### صيغ المخاطبة الرسمية

تتضمن السجلات المدمجة في rosetta صيغة المخاطبة الرسمية المناسبة ثقافيًا لكل لغة:

| اللغة | الصيغة الرسمية | تعليمات السجل |
|----------|------------|---------------------|
| German | Sie | `Use Sie-form for formal address` |
| French | vous | `Use vous-form` |
| Russian | вы | `Professional register with вы-form` |
| Turkish | siz | `Professional register with siz-form` |
| Korean | 합쇼체 | `Formal Korean (합쇼체)` |
| Japanese | です/ます | `Polite professional register (です/ます form)` |
| Polish | Pan/Pani | `Professional register with Pan/Pani form` |

### الكتابة الشاملة للجنسين

تحتوي كل بطاقة لغة على حقل `gender.inclusiveGuidance` يتضمن نصائح خاصة باللغة. يتم إدراج هذا في موجه ترجمة LLM بشكل منفصل عن الإعداد المسبق للسجل، بحيث يتم تطبيقه باستمرار بغض النظر عن الإعداد المسبق للرسمية الذي يختاره المستخدم:

- **French**: الكتابة الشاملة (Écriture inclusive) مع تدوين النقطة الوسطى (مثل "Connecté·e")
- **German**: تدوين النقطتين (Doppelpunkt) (مثل "Benutzer:innen")
- **Spanish**: يُفضل إعادة الهيكلة المحايدة جنسانيًا؛ ويُستخدم تدوين الشرطة المائلة (مثل "usuario/a") كبديل احتياطي

بالنسبة للغات التي لا تحتوي على إرشادات محددة في بطاقتها (مثل Korean، واللغات المصطنعة)، يعود النظام إلى قاعدة عامة: *"تفضيل الصيغ المحايدة جنسانيًا أو الخيار الأكثر شمولاً المتاح."*

### متطلبات نصوص من اليمين إلى اليسار (RTL)

تشير سجلات اللغات العربية والعبرية والفارسية والأردية جميعها إلى متطلبات الكتابة من اليمين إلى اليسار: `Ensure text reads naturally in RTL layout contexts.`

### تجاوز أي سجل

كل سجل عبارة عن قيمة تكوين — يمكنك تجاوزها لتتطابق مع نبرة مشروعك:

```json
{
  "languages": {
    "fr": {
      "register": "Casual French. Use tu-form. Conversational blog tone. Gender-neutral when possible."
    },
    "de": {
      "register": "Informal German. Use du-form. Tech startup voice."
    }
  }
}
```

راجع [التكوين](/docs/getting-started/configuration) للحصول على مرجع التكوين الكامل.

---

## إضافة لغة مصطنعة جديدة

### خطوة بخطوة

1. **اختر رمز الاستخدام الخاص BCP-47**: استخدم البادئة `x-` (مثل `x-dothraki`، `x-valyrian`).

2. **أضف إلى تكوينك**:

```json
{
  "languages": {
    "x-dothraki": {
      "register": "Dothraki language. Use David J. Peterson's vocabulary from the Living Language Dothraki textbook. Harsh, direct tone. No articles, no verb 'to be'."
    }
  }
}
```

3. **(اختياري) أضف محول نصوص**: إذا كانت لغتك المصطنعة تستخدم نص عرض غير لاتيني، فأضف محولاً في `lib/scripts.js` وقم بتسجيله في `SCRIPT_CONVERTERS`.

4. **الاختبار**: قم بتشغيل `i18n-rosetta sync --dry` لمعاينة الترجمات دون كتابة الملفات.

5. **تحقق من بوابة الجودة**: قد تحتاج [بوابة الجودة](/docs/concepts/quality-gate) إلى ضبط لتناسب لغتك المصطنعة — خاصة فحص `requireNonLatin` إذا كانت لغتك المصطنعة تستخدم رموز PUA.

:::note تعتمد جودة اللغة المصطنعة على معرفة LLM
لا يمكن للنموذج اللغوي الكبير (LLM) الترجمة إلا إلى لغة مصطنعة رآها في بيانات التدريب. تعمل اللغات المصطنعة الموثقة جيدًا (Klingon، Sindarin، Dothraki) بشكل جيد. قد تنتج اللغات المصطنعة الغامضة أو المخترعة حديثًا نتائج غير متسقة. استخدم [بيانات التوجيه](/docs/concepts/coaching-data) لتحسين الجودة.
:::

---

## انظر أيضًا

- [اللغات المدعومة](/docs/reference/supported-languages) — جدول اللغات الكامل مع توفر الطرق
- [محولات النصوص](/docs/concepts/script-converters) — التفاصيل الفنية لمسار التحويل
- [طرق الترجمة](/docs/guides/translation-methods) — كيف تعمل كل طريقة ترجمة
- [التكوين](/docs/getting-started/configuration) — مرجع التكوين بما في ذلك إعداد اللغة والسجل
- [دعم لغة ذات موارد محدودة](https://mtevalarena.org/docs/community/low-resource-languages) — نفس البنية التحتية المطبقة على اللغات الحقيقية غير المخدومة بشكل كافٍ