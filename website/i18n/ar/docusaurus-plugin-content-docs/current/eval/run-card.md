---
sidebar_position: 4
title: "مواصفات بطاقة التشغيل"
---
# مواصفات بطاقة التشغيل

تُعد بطاقة التشغيل السجل الكامل لعملية تقييم واحدة. فهي تحتوي على كل ما يلزم لفهم التجربة وإعادة إنتاجها والتحقق منها: الإعدادات، والدرجات، والنتائج الفردية، واستخدام الرموز (token usage)، والبيانات الوصفية لبيئة التشغيل.

**إصدار المخطط (Schema):** 2.0

---

## حقول المستوى الأعلى

| الحقل | النوع | الوصف |
|-------|------|-------------|
| `run_id` | `string` | معرّف فريد عالمياً (UUID v4) يتم إنشاؤه عند بدء التشغيل |
| `harness_version` | `string` | الإصدار الدلالي (Semantic version) للأداة (harness) التي أنتجت هذه البطاقة (مثل `2.0`) |
| `model_slug` | `string` | معرّف نموذج OpenRouter المستخدم في التشغيل (مثل `openai/gpt-4o`) |
| `model_id` | `string` | معرّف النموذج الفعلي المُرجع من واجهة برمجة التطبيقات (API) (مثل `gpt-4o-2024-08-06`) |
| `condition` | `string` | تسمية التجربة (مثل `baseline`، `coached-v3`، `few-shot`) |
| `timestamp` | `string` | طابع زمني بتنسيق ISO 8601 بالتوقيت العالمي المنسق (UTC) لوقت بدء التشغيل |
| `elapsed_seconds` | `number` | المدة الزمنية الفعلية (Wall-clock duration) للتشغيل بأكمله |

```json
{
  "run_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "harness_version": "2.0",
  "model_slug": "openai/gpt-4o",
  "model_id": "gpt-4o-2024-08-06",
  "condition": "baseline",
  "timestamp": "2025-05-20T03:22:41Z",
  "elapsed_seconds": 142.7
}
```

---

## `dataset`

يُحدد مجموعة بيانات التقييم ويربطها بإصدار محتوى محدد عبر خوارزمية SHA-256.

| الحقل | النوع | الوصف |
|-------|------|-------------|
| `id` | `string` | معرّف مجموعة البيانات (مثل `edtekla-dev-v1`) |
| `version` | `string` | سلسلة نصية لإصدار مجموعة البيانات |
| `language_pair` | `string` | تسمية العرض (مثل `EN→CRK`) |
| `sha256` | `string` | تجزئة SHA-256 لمحتويات ملف مجموعة البيانات. تضمن دقة البيانات المستخدمة |
| `entry_count` | `number` | عدد المدخلات في مجموعة البيانات |

```json
{
  "dataset": {
    "id": "edtekla-dev-v1",
    "version": "1.0",
    "language_pair": "EN→CRK",
    "sha256": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    "entry_count": 124
  }
}
```

---

## `config`

إعدادات واجهة برمجة التطبيقات (API) والمعالجة المجمعة (batching) المستخدمة في هذا التشغيل.

| الحقل | النوع | الوصف |
|-------|------|-------------|
| `api_provider` | `string` | اسم مزود واجهة برمجة التطبيقات (مثل `openrouter`) |
| `temperature` | `number` | درجة حرارة أخذ العينات (Sampling temperature) |
| `max_tokens` | `number` | الحد الأقصى للرموز (tokens) لكل إكمال |
| `batch_size` | `number` | عدد المدخلات لكل دفعة متزامنة |
| `concurrency` | `number` | الحد الأقصى لطلبات واجهة برمجة التطبيقات المتوازية |

```json
{
  "config": {
    "api_provider": "openrouter",
    "temperature": 0.3,
    "max_tokens": 1024,
    "batch_size": 5,
    "concurrency": 3
  }
}
```

---

## `system_prompt_sha256` / `system_prompt_used`

| الحقل | النوع | الوصف |
|-------|------|-------------|
| `system_prompt_sha256` | `string` | تجزئة SHA-256 لموجه النظام (system prompt). مُضمنة في البصمة (fingerprint) |
| `system_prompt_used` | `string` | النص الكامل لموجه النظام المُرسل إلى النموذج |

تُعد تجزئة الموجه جزءاً من [البصمة](#fingerprint) — حيث سيكون لعمليتي تشغيل بموجهات مختلفة بصمات مختلفة حتى وإن تطابقت جميع الإعدادات الأخرى.

---

## `fingerprint`

معرّف قابلية إعادة الإنتاج. أي عمليتي تشغيل ببصمات متطابقة تعني أنهما استخدمتا نفس الإعداد التجريبي.

| الحقل | النوع | الوصف |
|-------|------|-------------|
| `hash` | `string` | تجزئة SHA-256 للمكونات المرتبة |
| `components` | `object` | قيم الإدخال التي تم تجزئتها |

### مكونات البصمة

| المكون | الوصف |
|-----------|-------------|
| `dataset_sha256` | تجزئة ملف مجموعة البيانات |
| `model_slug` | النموذج المستخدم |
| `condition` | تسمية حالة التجربة |
| `system_prompt_sha256` | تجزئة موجه النظام |
| `temperature` | درجة حرارة أخذ العينات |
| `harness_version` | إصدار الأداة (Harness version) |

```json
{
  "fingerprint": {
    "hash": "7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069",
    "components": {
      "dataset_sha256": "e3b0c44298fc1c14...",
      "model_slug": "openai/gpt-4o",
      "condition": "baseline",
      "system_prompt_sha256": "abc123...",
      "temperature": 0.3,
      "harness_version": "2.0"
    }
  }
}
```

:::info البصمة ≠ تجزئة بطاقة التشغيل
تُحدد البصمة *إعدادات التجربة*. بينما يتحقق `run_card_hash` من *سلامة ملف النتائج*. راجع [البصمة مقابل تجزئة بطاقة التشغيل](/docs/eval/harness#fingerprint-vs-run-card-hash) للحصول على التفاصيل.
:::

---

## `scores`

المقاييس المجمعة للتشغيل بأكمله.

### درجات المستوى الأعلى

| الحقل | النوع | الوصف |
|-------|------|-------------|
| `total` | `number` | إجمالي المدخلات التي تم تقييمها |
| `exact_matches` | `number` | المدخلات التي تطابق فيها المخرجات المعيار الذهبي (gold standard) تماماً |
| `exact_match_rate` | `number` | `exact_matches / total` (0.0–1.0) |
| `fst_accepted` | `number` | المدخلات التي قَبِل فيها محلل FST المخرجات |
| `fst_acceptance_rate` | `number` | `fst_accepted / total` (0.0–1.0). `null` إذا لم يتم استخدام محلل FST |
| `chrf_plus_plus` | `number` | درجة chrF++ على مستوى المجموعة (Corpus-level) (0–100) |
| `errors` | `number` | المدخلات التي فشلت (خطأ في واجهة برمجة التطبيقات، انتهاء المهلة، إلخ) |
| `avg_latency_seconds` | `number` | متوسط وقت الاستجابة عبر جميع المدخلات |
| `median_latency_seconds` | `number` | وسيط وقت الاستجابة |
| `p95_latency_seconds` | `number` | وقت الاستجابة عند الشريحة المئوية 95 |

### `by_difficulty`

الدرجات مقسمة حسب مستوى الصعوبة. يحتوي كل مفتاح (`easy`، `medium`، `hard`) على نفس حقول المقاييس الموجودة في درجات المستوى الأعلى.

```json
{
  "by_difficulty": {
    "easy": {
      "total": 42,
      "exact_matches": 8,
      "exact_match_rate": 0.1905,
      "chrf_plus_plus": 51.2,
      "fst_accepted": 35,
      "fst_acceptance_rate": 0.8333
    },
    "medium": { ... },
    "hard": { ... }
  }
}
```

### `by_provenance`

الدرجات مقسمة حسب مصدر الإدخال. يحتوي كل مفتاح (مثل `gold_standard`، `textbook`) على نفس حقول المقاييس.

```json
{
  "by_provenance": {
    "gold_standard": {
      "total": 80,
      "exact_matches": 10,
      "exact_match_rate": 0.125,
      "chrf_plus_plus": 44.8
    },
    "textbook": { ... }
  }
}
```

---

## `totals`

تتبع استخدام الرموز (Token usage) والتكلفة للتشغيل بأكمله.

| الحقل | النوع | الوصف |
|-------|------|-------------|
| `prompt_tokens` | `number` | إجمالي رموز الإدخال عبر جميع استدعاءات واجهة برمجة التطبيقات |
| `completion_tokens` | `number` | إجمالي رموز الإخراج |
| `reasoning_tokens` | `number` | الرموز المستخدمة في التفكير المتسلسل (chain-of-thought reasoning) (يعتمد على النموذج، ويكون 0 لمعظم النماذج) |
| `cached_tokens` | `number` | الرموز المقدمة من ذاكرة التخزين المؤقت للموجه (prompt cache) الخاصة بالمزود |
| `total_cost_usd` | `number` | التكلفة الإجمالية بالدولار الأمريكي (كما وردت من واجهة برمجة التطبيقات) |
| `cost_per_entry_usd` | `number` | `total_cost_usd / entry_count` |
| `reasoning_ratio` | `number` | `reasoning_tokens / completion_tokens` (0.0–1.0) |

```json
{
  "totals": {
    "prompt_tokens": 48200,
    "completion_tokens": 3100,
    "reasoning_tokens": 0,
    "cached_tokens": 12000,
    "total_cost_usd": 0.42,
    "cost_per_entry_usd": 0.0034,
    "reasoning_ratio": 0.0
  }
}
```

---

## `environment`

البيانات الوصفية لبيئة التشغيل لضمان قابلية إعادة الإنتاج.

| الحقل | النوع | الوصف |
|-------|------|-------------|
| `harness_version` | `string` | إصدار الأداة (يعكس `harness_version` في المستوى الأعلى) |
| `harness_git_commit` | `string` | تجزئة Git commit SHA للأداة وقت التشغيل |
| `python_version` | `string` | إصدار مفسر Python |
| `sacrebleu_version` | `string` | إصدار مكتبة sacrebleu (المستخدمة لحساب درجات chrF++) |
| `os` | `string` | معرّف نظام التشغيل |

```json
{
  "environment": {
    "harness_version": "2.0",
    "harness_git_commit": "a1b2c3d",
    "python_version": "3.11.9",
    "sacrebleu_version": "2.4.0",
    "os": "macOS-14.5-arm64"
  }
}
```

---

## `results[]`

مصفوفة النتائج لكل إدخال. كائن واحد لكل إدخال في مجموعة البيانات، بترتيب الفهرس.

| الحقل | النوع | الوصف |
|-------|------|-------------|
| `entry_index` | `number` | فهرس هذا الإدخال في مجموعة البيانات (يطابق `entries[].index`) |
| `source_text` | `string` | النص المصدر الذي تمت ترجمته |
| `target_expected` | `string` | المرجع ذو المعيار الذهبي (gold-standard) من مجموعة البيانات |
| `target_output` | `string` | المخرجات الفعلية للنموذج |
| `exact_match` | `boolean` | ما إذا كان `target_output === target_expected` |
| `entry_chrf` | `number` | درجة chrF++ على مستوى الجملة لهذا الإدخال (0–100) |
| `fst_accepted` | `boolean \| null` | ما إذا كان محلل FST قد قَبِل المخرجات. `null` إذا لم يتم تكوين أي محلل |
| `fst_analysis` | `string[]` | سلاسل تحليل FST للمخرجات (مصفوفة فارغة إذا لم يتم تحليلها أو تم رفضها) |
| `difficulty` | `string` | مستوى الصعوبة من مجموعة البيانات (`easy`، `medium`، `hard`) |
| `provenance` | `string` | علامة المصدر (Provenance tag) من مجموعة البيانات |
| `latency_seconds` | `number` | وقت الاستجابة لهذا الإدخال الفردي |
| `usage` | `object` | استخدام الرموز لكل إدخال: `{ prompt_tokens, completion_tokens, reasoning_tokens }` |
| `error` | `string \| null` | رسالة الخطأ في حال فشل هذا الإدخال. `null` عند النجاح |

```json
{
  "results": [
    {
      "entry_index": 0,
      "source_text": "Hello",
      "target_expected": "tânisi",
      "target_output": "tânisi",
      "exact_match": true,
      "entry_chrf": 100.0,
      "fst_accepted": true,
      "fst_analysis": ["tânisi+V+AI+Ind+2Sg"],
      "difficulty": "easy",
      "provenance": "gold_standard",
      "latency_seconds": 0.82,
      "usage": {
        "prompt_tokens": 385,
        "completion_tokens": 12,
        "reasoning_tokens": 0
      },
      "error": null
    }
  ]
}
```

---

## `run_card_hash`

| الحقل | النوع | الوصف |
|-------|------|-------------|
| `run_card_hash` | `string` | تجزئة SHA-256 لملف JSON الخاص ببطاقة التشغيل بأكملها، مع تعيين الحقل `run_card_hash` نفسه إلى `""` أثناء التجزئة |

يُعد هذا ختم اكتشاف التلاعب. تعيد لوحة الصدارة (leaderboard) حساب هذه التجزئة عند الإرسال وترفض البطاقات التي لا تتطابق معها.

**حساب التجزئة:**

1. تحويل بطاقة التشغيل إلى تنسيق JSON (Serialize) مع تعيين `run_card_hash` إلى `""`
2. حساب تجزئة SHA-256 للسلسلة المحولة
3. تعيين `run_card_hash` إلى الملخص السداسي العشري (hex digest) الناتج

```python
import hashlib, json

card["run_card_hash"] = ""
card_json = json.dumps(card, sort_keys=True, ensure_ascii=False)
card["run_card_hash"] = hashlib.sha256(card_json.encode()).hexdigest()
```

---

## انظر أيضاً

- [تقييم الترجمة الآلية (MT Evaluation)](/docs/eval/) — نظرة عامة، وقيمة لوحة الصدارة، وإرشادات حول الطرق الجيدة/السيئة
- [أداة التقييم (Eval Harness)](/docs/eval/harness) — كيفية تشغيل التقييمات وإنشاء بطاقات التشغيل
- [مجموعات بيانات التقييم](/docs/eval/datasets) — تنسيق مجموعة البيانات، EDTeKLA، FLORES+
- [بناء طريقة](/docs/eval/methods) — واجهة الطريقة ومواصفات بطاقة الطريقة
- [لوحة صدارة الطرق (Method Leaderboard)](/leaderboard) — درجات القياس المباشرة