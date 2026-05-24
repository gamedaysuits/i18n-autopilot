---
sidebar_position: 4
title: "واجهة الطريقة"
---
# واجهة الطريقة المشتركة

يشترك eval harness و i18n-rosetta في مفهوم مشترك وهو **طريقة الترجمة** (translation method). الطريقة هي أي إجراء يأخذ النص المصدر وينتج نصاً مترجماً — سواء كان ذلك استدعاءً مباشراً لـ LLM، أو pipeline متعدد المراحل، أو API لجهة خارجية، أو مترجماً بشرياً.

## البنية

```
Method Plugin (v2 Spec)
├── manifest.json         ← Shared metadata (name, version, supported pairs)
├── method_card.json      ← Leaderboard description (what, not how)
├── translate.py          ← Python entry point (for eval harness)
└── translate.js          ← Node.js entry point (for i18n-rosetta CLI)
```

## نظامان، واجهة واحدة

| | Eval Harness | i18n-rosetta |
|---|---|---|
| **اللغة** | Python | Node.js |
| **نقطة الدخول** | `translate.py` | `translate.js` |
| **الواجهة** | بروتوكول `TranslationProcess` | تكوين `methodPlugin` |
| **الغرض** | التقييم المجمع مع تسجيل النقاط | الأقلمة المباشرة في بيئة التطوير/التكامل المستمر (dev/CI) |
| **المخرجات** | بطاقة التشغيل مع المقاييس | ملفات اللغة المترجمة |

توفر الطريقة التي تدعم كلا النظامين نقطتي دخول — واحدة لكل بيئة تشغيل لغة. تعتبر **بطاقة الطريقة** (method card) هي الجسر: فهي تصف الطريقة بتنسيق يفهمه كلا النظامين.

## بطاقة الطريقة

تصف بطاقة الطريقة *ماهية* طريقة الترجمة دون الكشف عن تفاصيل الملكية مثل موجه النظام (system prompt) الكامل. وهي تجيب على ما يلي:

- ما هي فئة هذه الطريقة؟ (LLM خام، LLM موجه، pipeline، API، إلخ.)
- ما هي الأدوات التي تستخدمها؟ (محلل FST، قاموس، إلخ.)
- هل التنفيذ مفتوح المصدر؟
- ما هي أزواج اللغات التي تدعمها؟

راجع [مواصفات بطاقة الطريقة](https://github.com/gamedaysuits/gds-mt-eval-harness/blob/main/docs/method-card-spec.md) للحصول على مخطط JSON الكامل.

### مثال

```json
{
  "method_id": "fst-gated-v8",
  "name": "FST-Gated Coached Translation v8",
  "class": "pipeline",
  "description": "LLM translation with morphological validation. Failed words are retried with FST feedback.",
  "author": "Curtis Forbes",
  "tools_used": ["HFST morphological analyzer", "Wolvengrey dictionary"],
  "open_source": false,
  "supported_pairs": ["eng>crk"]
}
```

### فئات الطريقة

| الفئة | الوصف |
|-------|-------------|
| `raw-llm` | استدعاء مباشر لـ LLM مع الحد الأدنى من التعليمات |
| `coached-llm` | LLM مع موجه (prompt) منظم، أمثلة، وقيود |
| `pipeline` | pipeline متعدد المراحل مع مكونات حتمية (deterministic) |
| `custom-plugin` | عملية خارجية تنفذ بروتوكول `TranslationProcess` |
| `api` | API للترجمة تابعة لجهة خارجية (Google Translate، DeepL، إلخ.) |
| `human` | ترجمة بشرية (لإنشاء خطوط الأساس) |

## Eval Harness: بروتوكول TranslationProcess

يستخدم eval harness الـ structural typing في Python (`Protocol`) للمكونات الإضافية (plugins). تعمل أي فئة (class) تحتوي على توقيع الطريقة الصحيح — دون الحاجة إلى الوراثة (inheritance):

```python
class MyMethod:
    async def translate(self, entries: list[dict], config: RunConfig) -> list[dict]:
        results = []
        for entry in entries:
            translation = await self.do_translation(entry["source"])
            results.append({
                "id": entry["id"],
                "predicted": translation,
                "latency_s": 0.5,
                "usage": {"prompt_tokens": 0, "completion_tokens": 0},
                "error": None,
                "tool_calls": [],
                "tool_call_count": 0,
                "metadata": {},
            })
        return results
```

راجع [بروتوكول المكون الإضافي](https://github.com/gamedaysuits/gds-mt-eval-harness/blob/main/docs/plugin-protocol.md) للحصول على الوثائق الكاملة بما في ذلك أمثلة wrapper للطرق المكتوبة بغير لغة Python.

## i18n-rosetta: تكوين methodPlugin

في rosetta، يتم تسجيل الطرق لكل زوج لغوي في `i18n-rosetta.config.json`:

```json
{
  "version": 3,
  "pairs": {
    "en:crk": {
      "methodPlugin": "crk-coached-v1"
    }
  }
}
```

راجع [مواصفات المكون الإضافي](/docs/reference/plugin-spec) لواجهة rosetta.

## التكامل مع لوحة الصدارة

عند إرفاق بطاقة طريقة بعملية تشغيل (عبر `--method-card`)، يتم تضمينها في بطاقة التشغيل وعرضها على لوحة الصدارة:

```bash
# Run with method card attached
python eval/baseline_experiment.py \
  --dataset data/edtekla-dev-v1.json \
  --method-card method_card.json \
  --submit
```

تعرض لوحة الصدارة ما يلي:
- **شارة الفئة** — مؤشر مرئي (مثل "pipeline"، "coached-llm")
- **اسم الطريقة** — من بطاقة الطريقة
- **الأدوات المستخدمة** — مدرجة من بطاقة الطريقة
- **مؤشر مفتوح المصدر**

عند عدم إرفاق بطاقة طريقة، تعرض لوحة الصدارة التكوين الأصلي لـ harness (النموذج، الشرط، درجة الحرارة، الأدوات الممكنة).

:::danger لا تقم بالتدريب على بيانات التقييم
الطرق التي تضمنت عملية تطويرها التعرض لمجموعة بيانات التقييم — كبيانات تدريب، أو أمثلة few-shot، أو إدخالات قاموس، أو مواد prompt tuning — سيتم **استبعادها** من لوحة الصدارة. راجع [تقييم الترجمة الآلية](/docs/eval/) لمعرفة ما يميز الطريقة الجيدة عن السيئة.
:::

---

## انظر أيضاً

- [تقييم الترجمة الآلية](/docs/eval/) — نظرة عامة، وقيمة لوحة الصدارة، وإرشادات الطريقة الجيدة/السيئة
- [Eval Harness](/docs/eval/harness) — كيفية تشغيل التقييمات
- [مجموعات بيانات التقييم](/docs/eval/datasets) — مجموعات البيانات المتاحة (EDTeKLA، FLORES+)
- [مواصفات بطاقة التشغيل](/docs/eval/run-card) — مخطط JSON لبطاقة التشغيل
- [مواصفات المكون الإضافي](/docs/reference/plugin-spec) — واجهة المكون الإضافي من جانب rosetta
- [لوحة صدارة الطرق](/leaderboard) — درجات القياس المباشرة