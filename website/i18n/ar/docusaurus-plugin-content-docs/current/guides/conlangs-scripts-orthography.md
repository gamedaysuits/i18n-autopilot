---
sidebar_position: 3
title: "اللغات المصطنعة وأنظمة الكتابة والإملاء"
---
# اللغات المصطنعة، النصوص، والإملاء

توفر rosetta دعمًا من الدرجة الأولى للغات المصطنعة (constructed languages) عبر سجلات النماذج اللغوية الكبيرة (LLM registers) ومحولات النصوص الحتمية (deterministic script converters). يغطي هذا الدليل كيفية عمل دعم اللغات المصطنعة، والخطوط التي تحتاجها، وكيفية إضافة لغتك الخاصة.

:::tip لماذا تعتبر اللغات المصطنعة مهمة
اللغات المصطنعة ليست مجرد حداثة — فهي تختبر نفس البنية التحتية المستخدمة للغات الحقيقية غير المدعومة بشكل كافٍ. تعمل بوابة الجودة، ونظام التدريب، ومسار تحويل النصوص بشكل متطابق مع لغتي Klingon و Plains Cree. إذا كان مسار اللغات المصطنعة الخاص بك يعمل، فإن مسار اللغات منخفضة الموارد سيعمل أيضًا.
:::

---

## اللغات المصطنعة المدعومة

| اللغة | الرمز | محول النص | الخط المطلوب |
|----------|------|:----------------:|:-------------:|
| Klingon | `tlh` | ✅ رومنة → pIqaD | خط PUA (مثل pIqaD qolqoS) |
| Sindarin (لغة الإلف لـ Tolkien) | `x-elvish-s` | ✅ لاتيني → Tengwar | خط CSUR PUA |
| Kryptonian | `x-kryptonian` | ✅ لاتيني → Kryptonian | خط PUA |
| إنجليزية القراصنة (Pirate English) | `x-pirate` | ❌ سجل (register) فقط | لا يوجد |
| الإنجليزية الشكسبيرية | `x-shakespeare` | ❌ سجل فقط | لا يوجد |
| لغة يودا (Yoda-speak) | `x-yoda` | ❌ سجل فقط | لا يوجد |

تستخدم رموز اللغات المصطنعة البادئة `x-` وفقًا لاتفاقية الاستخدام الخاص BCP-47، باستثناء لغة Klingon (`tlh`) التي تحتوي على رمز [ISO 639-3](https://iso639-3.sil.org/code/tlh) مخصص من قبل SIL International.

---

## متطلبات Unicode و PUA والخطوط

### منطقة الاستخدام الخاص (PUA)

تستخدم لغات Klingon (pIqaD) و Sindarin (Tengwar) و Kryptonian رموز **منطقة الاستخدام الخاص (PUA)** في Unicode. منطقة PUA هي النطاق U+E000–U+F8FF — هذه النقاط الرمزية (codepoints) **ليس لها تعيين قياسي**. يحتفظ [سجل ConScript Unicode Registry (CSUR)](https://www.evertype.com/standards/csur/) بتعيينات متفق عليها مجتمعيًا للنصوص الخيالية، ولكنها ليست جزءًا من معيار Unicode.

ما يعنيه هذا عمليًا:

- يُعرض نص PUA على شكل **مربعات فارغة** (□□□) إذا لم يتم تحميل الخط الصحيح
- قد تقوم الخطوط المختلفة بتعيين أشكال (glyphs) مختلفة لنفس النقاط الرمزية في PUA
- لا تقوم rosetta بتضمين خطوط PUA — يجب عليك تحميلها بنفسك
- لن تقوم خطوط النظام أبدًا بعرض هذه الرموز

### نطاقات PUA حسب النص

| النص | نطاق PUA | مرجع CSUR |
|--------|-----------|---------------|
| Klingon (pIqaD) | U+F8D0–U+F8FF | [CSUR Klingon](https://www.evertype.com/standards/csur/klingon.html) |
| Tengwar (لغة الإلف) | U+E000–U+E07F | [CSUR Tengwar](https://www.evertype.com/standards/csur/tengwar.html) |
| Kryptonian | يختلف حسب الخط | لا يوجد معيار CSUR |

### تحميل خطوط الويب PUA

تتضمن rosetta أمرًا مدمجًا لتنزيل وإدارة خطوط الويب PUA:

```bash
# See which fonts are needed for your configured languages
i18n-rosetta fonts list

# Download all needed fonts (auto-detects project type for output directory)
i18n-rosetta fonts install

# Also generate a CSS snippet with @font-face declarations
i18n-rosetta fonts install --css
```

يقوم الأمر `fonts install` بالتنزيل من مستودعات مفتوحة المصدر تم التحقق منها:

| الخط | النص | الترخيص | المصدر |
|------|--------|---------|--------|
| pIqaD qolqoS | Klingon | ترخيص SIL Open Font 1.1 | [GitHub](https://github.com/dadap/pIqaD-fonts) |
| FreeMonoTengwar | Tengwar | GNU GPL v3 (مع استثناء الخط) | [SourceForge](https://sourceforge.net/projects/freetengwar/) |
| *(مقدم من المستخدم)* | Kryptonian | يختلف | لا يتوفر خط PUA مفتوح المصدر |

يتم اكتشاف دليل المخرجات تلقائيًا من بنية مشروعك (Docusaurus → `static/fonts/`، Hugo → `static/fonts/`، الافتراضي → `public/fonts/`). يمكنك تجاوزه باستخدام `--dir`.

إذا كنت تفضل إدارة الخطوط يدويًا، أضف قواعد `@font-face` في ملف CSS الخاص بك:

```css
@font-face {
  font-family: 'pIqaD';
  src: url('/fonts/pIqaDqolqoS.ttf') format('truetype');
  font-display: swap;
  unicode-range: U+F8D0-F8FF;
}

/* Apply to Klingon text elements */
[lang="tlh"], [data-script="piqad"] {
  font-family: 'pIqaD', sans-serif;
}
```

:::warning دعم Unicode غير مضمون
لقد [رفض](https://www.unicode.org/faq/private_use.html) اتحاد Unicode (Unicode Consortium) صراحةً تشفير النصوص الخيالية في المعيار. يتم الحفاظ على تعيينات PUA من قبل المجتمع وقد تتعارض بين تطبيقات الخطوط المختلفة. حدد دائمًا الخط الدقيق الذي يستخدمه مشروعك، واختبر العرض عبر المتصفحات.
:::

---

## محولات النصوص

### كيف تعمل

تحويل النصوص في rosetta هو **إجراء لاحق للترجمة (post-translation hook)**:

1. يقوم النموذج اللغوي الكبير (LLM) بترجمة النص إلى **نص عملي** (عادةً لاتيني أو SRO)
2. تقوم [بوابة الجودة](/docs/concepts/quality-gate) بالتحقق من صحة المخرجات
3. يقوم المحول الحتمي بتحويل النص الذي تم التحقق منه إلى **نص العرض**
4. تتم كتابة النص المحول إلى القرص

يعمل هذا النهج المكون من خطوتين لأن النماذج اللغوية الكبيرة (LLMs) تنتج مخرجات أفضل عند العمل بالنصوص المستندة إلى اللاتينية. يضمن المحول الحتمي الحصول على مخرجات نصية صحيحة دون الاعتماد على معرفة النموذج بالنصوص (والتي غالبًا ما تكون غير موثوقة).

### المحولات الخمسة بالكامل

تأتي rosetta مزودة بخمسة محولات نصوص مدمجة:

#### Plains Cree: SRO → مقاطع لفظية (`crk`)

من الإملاء الروماني القياسي (SRO) إلى المقاطع اللفظية للسكان الأصليين في كندا.

```
Input:  "tawâw"
Output: "ᑕᐚᐤ"
```

تستخدم حروف العلة الطويلة علامات التشكيل (macron/circumflex): ê، î، ô، â. يتعامل المحول مع جميع علامات التشكيل الخاصة بـ SRO ويعينها إلى الرموز المقطعية الصحيحة. راجع [دعم لغة منخفضة الموارد](https://mtevalarena.org/docs/community/low-resource-languages) للحصول على مسار لغة Cree بالكامل.

#### الصربية: لاتيني → سيريلي (`sr`)

تحويل حتمي من اللاتينية إلى السيريلية للغة الصربية.

```
Input:  "zdravo"
Output: "здраво"
```

يتعامل هذا مع تعيين الأبجدية الصربية بالكامل بما في ذلك الحروف المزدوجة (digraphs) (lj → љ، nj → њ، dž → џ).

#### Klingon: رومنة → pIqaD (`tlh`)

نظام الرومنة الخاص بـ Marc Okrand إلى رموز pIqaD PUA.

```
Input:  "Qapla'"    (romanized Klingon)
Output: [pIqaD PUA] (requires pIqaD font to render)
```

#### Sindarin: لاتيني → Tengwar (`x-elvish-s`)

تعيين Tengwar في وضع Sindarin الخاص بـ Tolkien.

```
Input:  "elen síla"  (Latin Sindarin)
Output: [Tengwar PUA] (requires Tengwar font to render)
```

#### Kryptonian: لاتيني → Kryptonian (`x-kryptonian`)

تعيين نص Kryptonian بناءً على معجم المعجبين.

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

يتم اكتشاف لغة Plains Cree (`crk`) تلقائيًا — لا تحتاج إلى تعيين `scripts` بشكل صريح.

---

## اللغات متعددة النصوص

تستخدم بعض اللغات الحقيقية نصوصًا نشطة متعددة:

| اللغة | النصوص | نهج rosetta |
|----------|---------|-----------------|
| الصربية | لاتيني + سيريلي | محول النص (`sr`) — الترجمة باللاتينية، والتحويل إلى السيريلية |
| الصينية | مبسطة + تقليدية | رموز محلية منفصلة (`zh` مقابل `zh-TW`) مع سجلات مميزة |

بالنسبة للغات التي يخدم فيها كلا النصين نفس الجمهور (الصربية)، استخدم محول نصوص. أما بالنسبة للغات التي تخدم فيها النصوص جماهير مختلفة (الصينية المبسطة للصين القارية، والتقليدية لتايوان/هونغ كونغ)، فاستخدم رموزًا محلية منفصلة.

---

## ملاحظات الإملاء

السجلات (Registers) ليست مجرد نبرة — بل تحمل **تعليمات إملائية** توجه النموذج اللغوي الكبير (LLM) نحو اصطلاحات الكتابة الصحيحة.

### صيغ المخاطبة الرسمية

تتضمن سجلات rosetta المدمجة صيغة المخاطبة الرسمية المناسبة ثقافيًا لكل لغة:

| اللغة | الصيغة الرسمية | تعليمة السجل |
|----------|------------|---------------------|
| الألمانية | Sie | `Use Sie-form for formal address` |
| الفرنسية | vous | `Use vous-form` |
| الروسية | вы | `Professional register with вы-form` |
| التركية | siz | `Professional register with siz-form` |
| الكورية | 합쇼체 | `Formal Korean (합쇼체)` |
| اليابانية | です/ます | `Polite professional register (です/ます form)` |
| البولندية | Pan/Pani | `Professional register with Pan/Pani form` |

### الكتابة الشاملة للجنسين

تحتوي كل بطاقة لغة على حقل `gender.inclusiveGuidance` يتضمن نصائح خاصة باللغة. يتم حقن هذا في موجه ترجمة LLM بشكل منفصل عن الإعداد المسبق للسجل، بحيث يتم تطبيقه باستمرار بغض النظر عن الإعداد المسبق للرسمية الذي يختاره المستخدم:

- **الفرنسية**: الكتابة الشاملة (Écriture inclusive) مع تدوين النقطة الوسطى (مثل "Connecté·e")
- **الألمانية**: تدوين النقطتين (Doppelpunkt) (مثل "Benutzer:innen")
- **الإسبانية**: يُفضل إعادة الهيكلة المحايدة جنسانيًا؛ مع استخدام تدوين الشرطة المائلة (مثل "usuario/a") كبديل

بالنسبة للغات التي لا تحتوي على إرشادات محددة في بطاقتها (مثل الكورية، واللغات المصطنعة)، يعود النظام إلى قاعدة عامة: *"تفضيل الصيغ المحايدة جنسانيًا أو الخيار الأكثر شمولية المتاح."*

### متطلبات نصوص من اليمين إلى اليسار (RTL)

تشير جميع سجلات اللغات العربية والعبرية والفارسية والأردية إلى متطلبات الكتابة من اليمين إلى اليسار: `Ensure text reads naturally in RTL layout contexts.`

### تجاوز أي سجل

كل سجل عبارة عن قيمة تكوين — يمكنك تجاوزها لتتناسب مع أسلوب مشروعك:

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

راجع [التكوين](/docs/getting-started/configuration) للحصول على المرجع الكامل للتكوين.

---

## إضافة لغة مصطنعة جديدة

### خطوة بخطوة

1. **اختر رمز استخدام خاص BCP-47**: استخدم البادئة `x-` (مثل `x-dothraki`، `x-valyrian`).

2. **أضف إلى التكوين الخاص بك**:

```json
{
  "languages": {
    "x-dothraki": {
      "register": "Dothraki language. Use David J. Peterson's vocabulary from the Living Language Dothraki textbook. Harsh, direct tone. No articles, no verb 'to be'."
    }
  }
}
```

3. **(اختياري) إضافة محول نصوص**: إذا كانت لغتك المصطنعة تستخدم نص عرض غير لاتيني، فأضف محولًا في `lib/scripts.js` وقم بتسجيله في `SCRIPT_CONVERTERS`.

4. **الاختبار**: قم بتشغيل `i18n-rosetta sync --dry` لمعاينة الترجمات دون كتابة الملفات.

5. **التحقق من بوابة الجودة**: قد تحتاج [بوابة الجودة](/docs/concepts/quality-gate) إلى ضبط للغتك المصطنعة — خاصةً فحص `requireNonLatin` إذا كانت لغتك المصطنعة تستخدم رموز PUA.

:::note تعتمد جودة اللغات المصطنعة على معرفة LLM
لا يمكن للنموذج اللغوي الكبير (LLM) الترجمة إلا إلى لغة مصطنعة رآها في بيانات التدريب. تعمل اللغات المصطنعة الموثقة جيدًا (Klingon، Sindarin، Dothraki) بشكل جيد. قد تنتج اللغات المصطنعة الغامضة أو المخترعة حديثًا نتائج غير متسقة. استخدم [بيانات التدريب (coaching data)](/docs/concepts/coaching-data) لتحسين الجودة.
:::

---

## انظر أيضًا

- [اللغات المدعومة](/docs/reference/supported-languages) — جدول اللغات الكامل مع توفر الطرق
- [محولات النصوص](/docs/concepts/script-converters) — التفاصيل الفنية لمسار التحويل
- [طرق الترجمة](/docs/guides/translation-methods) — كيف تعمل كل طريقة ترجمة
- [التكوين](/docs/getting-started/configuration) — مرجع التكوين بما في ذلك إعداد اللغة والسجل
- [دعم لغة منخفضة الموارد](https://mtevalarena.org/docs/community/low-resource-languages) — نفس البنية التحتية المطبقة على اللغات الحقيقية غير المدعومة بشكل كافٍ