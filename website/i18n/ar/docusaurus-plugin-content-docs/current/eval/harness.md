---
sidebar_position: 2
title: "Eval Harness v2.0"
---
# Eval Harness v2.0

تُشغّل الأداة تجارب الترجمة وتُنتج بطاقات التشغيل (run cards). وهي تتولى بناء المطالبات، واستدعاءات واجهة برمجة التطبيقات (API)، وحساب الدرجات، وتسلسل النتائج — ما عليك سوى توفير مجموعة البيانات والنموذج.

## التثبيت

**المتطلبات:** Python 3.10+

```bash
pip install sacrebleu aiohttp
```

استنسخ مستودع الأداة:

```bash
git clone https://github.com/gamedaysuits/gds-mt-eval-harness.git
cd gds-mt-eval-harness
```

## الاستخدام

```bash
python eval/baseline_experiment.py --dataset path/to/dataset.json
```

يؤدي هذا إلى تشغيل كل مُدخل في مجموعة البيانات عبر النموذج المُعد، ويحسب درجات المخرجات، ويكتب ملف JSON لبطاقة التشغيل في الدليل `results/`.

## علامات CLI

| العلامة | مطلوب | الافتراضي | الوصف |
|------|----------|---------|-------------|
| `--dataset` | ✅ | — | مسار ملف JSON لمجموعة بيانات التقييم |
| `--model` | — | `openai/gpt-4o` | مُعرّف نموذج OpenRouter (مثل، `google/gemini-2.5-pro`) |
| `--condition` | — | `baseline` | تسمية التجربة. تُستخدم للتمييز بين استراتيجيات المطالبة (مثل، `coached`، `few-shot`، `dictionary-augmented`) |
| `--temperature` | — | `0.3` | درجة حرارة أخذ العينات (Sampling temperature). الأقل = أكثر حتمية |
| `--batch-size` | — | `5` | عدد المُدخلات لكل دفعة API متزامنة |
| `--fst-analyzer` | — | `null` | مسار الملف التنفيذي لمحلل FST. عند توفيره، يتم اختبار كل مُخرج للقبول الصرفي |
| `--submit` | — | `false` | إرسال بطاقة التشغيل إلى واجهة برمجة تطبيقات لوحة الصدارة (leaderboard API) بعد اكتمال التشغيل |

### أمثلة

```bash
# Run with defaults (GPT-4o, baseline condition)
python eval/baseline_experiment.py --dataset data/edtekla-dev-v1.json

# Coached experiment with Gemini, lower temperature
python eval/baseline_experiment.py \
  --dataset data/edtekla-dev-v1.json \
  --model google/gemini-2.5-pro \
  --condition coached-v3 \
  --temperature 0.1

# Run with FST validation and auto-submit
python eval/baseline_experiment.py \
  --dataset data/edtekla-dev-v1.json \
  --fst-analyzer ./bin/crk-analyzer \
  --submit
```

---

## مخطط بطاقة التشغيل

تُنتج كل تجربة **بطاقة تشغيل** — وهي مستند JSON مستقل بذاته. الهيكل ذو المستوى الأعلى هو:

```json
{
  "run_id": "uuid-v4",
  "harness_version": "2.0",
  "model_slug": "openai/gpt-4o",
  "model_id": "gpt-4o-2024-08-06",
  "condition": "baseline",
  "timestamp": "2025-05-20T03:22:41Z",
  "elapsed_seconds": 142.7,
  "dataset": { ... },
  "config": { ... },
  "system_prompt_sha256": "abc123...",
  "system_prompt_used": "You are a translator...",
  "fingerprint": { ... },
  "scores": { ... },
  "totals": { ... },
  "environment": { ... },
  "results": [ ... ],
  "run_card_hash": "sha256-of-entire-card"
}
```

راجع [مواصفات بطاقة التشغيل](/docs/eval/run-card) للحصول على المخطط الكامل مع توثيق كل حقل.

### الكتل الرئيسية

**`dataset`** — تُحدد مجموعة البيانات المستخدمة، بما في ذلك تجزئة محتواها (content hash) بحيث ترتبط النتائج بإصدار معين:

```json
{
  "id": "edtekla-dev-v1",
  "version": "1.0",
  "language_pair": "EN→CRK",
  "sha256": "...",
  "entry_count": 124
}
```

**`scores`** — المقاييس المجمعة للتشغيل:

```json
{
  "total": 124,
  "exact_matches": 12,
  "exact_match_rate": 0.0968,
  "fst_accepted": 87,
  "fst_acceptance_rate": 0.7016,
  "chrf_plus_plus": 42.31,
  "errors": 0,
  "avg_latency_seconds": 1.15,
  "median_latency_seconds": 1.02,
  "p95_latency_seconds": 2.34,
  "by_difficulty": { ... },
  "by_provenance": { ... }
}
```

**`totals`** — استخدام الرموز (Tokens) وتتبع التكلفة:

```json
{
  "prompt_tokens": 48200,
  "completion_tokens": 3100,
  "reasoning_tokens": 0,
  "cached_tokens": 12000,
  "total_cost_usd": 0.42,
  "cost_per_entry_usd": 0.0034,
  "reasoning_ratio": 0.0
}
```

---

## البصمة مقابل تجزئة بطاقة التشغيل

تُنتج الأداة تجزئتين مختلفتين. وتخدمان أغراضًا مختلفة:

### البصمة

تُجيب **البصمة** على سؤال: *"هل يمكن إعادة إنتاج هذا التشغيل؟"*

فهي تقوم بتجزئة مجموعة المدخلات التي تُحدد تكوين التجربة — وليس المخرجات:

- SHA-256 لمجموعة البيانات
- مُعرّف النموذج (Model slug)
- تسمية الحالة (Condition label)
- SHA-256 لمطالبة النظام
- درجة الحرارة (Temperature)
- إصدار الأداة (Harness version)

استخدم أي تشغيلين لهما بصمات متطابقة نفس الإعدادات. ويجب أن تكون نتائجهما قابلة للمقارنة (باستثناء عدم الحتمية في واجهة برمجة التطبيقات).

### تجزئة بطاقة التشغيل

تُجيب **تجزئة بطاقة التشغيل** على سؤال: *"هل تم العبث بملف النتائج المحدد هذا؟"*

وهي عبارة عن SHA-256 لملف JSON الخاص ببطاقة التشغيل بأكملها (باستثناء الحقل `run_card_hash` نفسه). إذا تغير أي حقل — سواء كان درجة، أو طابعًا زمنيًا، أو مُخرجًا واحدًا — فستُكسر التجزئة.

:::info متى تستخدم أيهما
استخدم **البصمة** لتجميع عمليات التشغيل القابلة للمقارنة (نفس التجربة، عمليات تنفيذ مختلفة). واستخدم **تجزئة بطاقة التشغيل** للتحقق من سلامة ملف نتائج معين.
:::

---

## الإرسال إلى لوحة الصدارة

### الإرسال التلقائي

مرر `--submit` لتحميل بطاقة التشغيل عند الاكتمال:

```bash
python eval/baseline_experiment.py \
  --dataset data/edtekla-dev-v1.json \
  --submit
```

### الإرسال اليدوي

تُحفظ بطاقات التشغيل كملفات JSON في `results/`. يمكنك إرسال أي ملف بطاقة تشغيل عبر واجهة مستخدم لوحة الصدارة على [/leaderboard](/leaderboard)، أو من خلال واجهة برمجة التطبيقات (API):

```bash
curl -X POST https://i18n-rosetta.com/api/leaderboard/submit \
  -H "Content-Type: application/json" \
  -d @results/your-run-card.json
```

:::warning التحقق من صحة لوحة الصدارة
تتحقق لوحة الصدارة من صحة بطاقات التشغيل المُرسلة مقابل سجل مجموعة البيانات. وتُرفض عمليات الإرسال التي تشير إلى مجموعات بيانات غير معروفة، أو التي تحتوي على `run_card_hash` مكسور.
:::

:::danger لا تتدرب على بيانات التقييم
إذا كانت طريقتك قد اطلعت على مجموعة بيانات التقييم أثناء التطوير — كبيانات تدريب، أو أمثلة قليلة اللقطات (few-shot examples)، أو إدخالات قاموس، أو مواد هندسة المطالبات — فسيتم **استبعاد** إرسالك. راجع [تقييم الترجمة الآلية (MT Evaluation)](/docs/eval/) لمعرفة ما يميز الطريقة الجيدة عن السيئة.
:::

---

## انظر أيضاً

- [تقييم الترجمة الآلية (MT Evaluation)](/docs/eval/) — نظرة عامة، وعرض القيمة للوحة الصدارة، وإرشادات الطريقة الجيدة/السيئة
- [مجموعات بيانات التقييم](/docs/eval/datasets) — تنسيق مجموعة البيانات، EDTeKLA، FLORES+
- [مواصفات بطاقة التشغيل](/docs/eval/run-card) — مخطط JSON الكامل
- [بناء طريقة](/docs/eval/methods) — واجهة الطريقة لإنشاء طرق قابلة للتقييم
- [لوحة صدارة الطرق](/leaderboard) — درجات المعيار المباشرة