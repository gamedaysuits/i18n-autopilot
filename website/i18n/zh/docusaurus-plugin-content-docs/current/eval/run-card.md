---
sidebar_position: 4
title: "Run Card 规范"
---
# 运行卡片规范

运行卡片是单次评估运行的完整记录。它包含理解、重现和验证实验所需的一切信息：配置、分数、单项结果、Token 使用情况以及环境元数据。

**Schema 版本：** 2.0

---

## 顶级字段

| 字段 | 类型 | 描述 |
|-------|------|-------------|
| `run_id` | `string` | 运行开始时生成的 UUID v4 |
| `harness_version` | `string` | 生成此卡片的测试框架 (harness) 的语义化版本（例如 `2.0`） |
| `model_slug` | `string` | 运行使用的 OpenRouter 模型标识符 (slug)（例如 `openai/gpt-4o`） |
| `model_id` | `string` | API 返回的已解析模型标识符（例如 `gpt-4o-2024-08-06`） |
| `condition` | `string` | 实验标签（例如 `baseline`、`coached-v3`、`few-shot`） |
| `timestamp` | `string` | 运行开始时的 ISO 8601 UTC 时间戳 |
| `elapsed_seconds` | `number` | 整个运行的实际耗时 (Wall-clock duration) |

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

标识评估数据集，并通过 SHA-256 将其固定到特定的内容版本。

| 字段 | 类型 | 描述 |
|-------|------|-------------|
| `id` | `string` | 数据集标识符（例如 `edtekla-dev-v1`） |
| `version` | `string` | 数据集版本字符串 |
| `language_pair` | `string` | 显示标签（例如 `EN→CRK`） |
| `sha256` | `string` | 数据集文件内容的 SHA-256 哈希值。确保使用的是确切的数据 |
| `entry_count` | `number` | 数据集中的条目数量 |

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

本次运行使用的 API 和批处理配置。

| 字段 | 类型 | 描述 |
|-------|------|-------------|
| `api_provider` | `string` | API 提供商名称（例如 `openrouter`） |
| `temperature` | `number` | 采样温度 |
| `max_tokens` | `number` | 每次补全的最大 Token 数 |
| `batch_size` | `number` | 每个并发批次的条目数 |
| `concurrency` | `number` | 最大并行 API 请求数 |

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

| 字段 | 类型 | 描述 |
|-------|------|-------------|
| `system_prompt_sha256` | `string` | 系统提示词的 SHA-256 哈希值。包含在指纹中 |
| `system_prompt_used` | `string` | 发送给模型的完整系统提示词文本 |

提示词哈希值是[指纹](#fingerprint)的一部分——即使所有其他设置都匹配，使用不同提示词的两次运行也会产生不同的指纹。

---

## `fingerprint`

可重复性标识符。具有相同指纹的两次运行使用了相同的实验设置。

| 字段 | 类型 | 描述 |
|-------|------|-------------|
| `hash` | `string` | 排序后组件的 SHA-256 哈希值 |
| `components` | `object` | 被哈希处理的输入值 |

### 指纹组件

| 组件 | 描述 |
|-----------|-------------|
| `dataset_sha256` | 数据集文件的哈希值 |
| `model_slug` | 使用的模型 |
| `condition` | 实验条件标签 |
| `system_prompt_sha256` | 系统提示词的哈希值 |
| `temperature` | 采样温度 |
| `harness_version` | 测试框架版本 |

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

:::info 指纹 ≠ 运行卡片哈希值
指纹用于标识*实验配置*。`run_card_hash` 用于验证*结果文件的完整性*。详情请参阅[指纹与运行卡片哈希值对比](/docs/eval/harness#fingerprint-vs-run-card-hash)。
:::

---

## `scores`

整个运行的汇总指标。

### 顶级分数

| 字段 | 类型 | 描述 |
|-------|------|-------------|
| `total` | `number` | 评估的总条目数 |
| `exact_matches` | `number` | 输出与黄金标准完全匹配的条目数 |
| `exact_match_rate` | `number` | `exact_matches / total` (0.0–1.0) |
| `fst_accepted` | `number` | FST 分析器接受其输出的条目数 |
| `fst_acceptance_rate` | `number` | `fst_accepted / total` (0.0–1.0)。如果未使用 FST 分析器，则为 `null` |
| `chrf_plus_plus` | `number` | 语料库级别的 chrF++ 分数 (0–100) |
| `errors` | `number` | 失败的条目数（API 错误、超时等） |
| `avg_latency_seconds` | `number` | 所有条目的平均响应时间 |
| `median_latency_seconds` | `number` | 响应时间中位数 |
| `p95_latency_seconds` | `number` | 95% 分位响应时间 |

### `by_difficulty`

按难度层级细分的分数。每个键（`easy`、`medium`、`hard`）包含与顶级分数相同的指标字段。

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

按条目来源细分的分数。每个键（例如 `gold_standard`、`textbook`）包含相同的指标字段。

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

整个运行的 Token 使用情况和成本跟踪。

| 字段 | 类型 | 描述 |
|-------|------|-------------|
| `prompt_tokens` | `number` | 所有 API 调用的总输入 Token 数 |
| `completion_tokens` | `number` | 总输出 Token 数 |
| `reasoning_tokens` | `number` | 用于思维链 (chain-of-thought) 推理的 Token 数（取决于模型，大多数模型为 0） |
| `cached_tokens` | `number` | 从提供商提示词缓存中提供的 Token 数 |
| `total_cost_usd` | `number` | 总成本（美元，由 API 报告） |
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

用于可重复性的运行时环境元数据。

| 字段 | 类型 | 描述 |
|-------|------|-------------|
| `harness_version` | `string` | 测试框架版本（与顶级 `harness_version` 保持一致） |
| `harness_git_commit` | `string` | 运行时的测试框架 Git 提交 SHA |
| `python_version` | `string` | Python 解释器版本 |
| `sacrebleu_version` | `string` | sacrebleu 库版本（用于 chrF++ 评分） |
| `os` | `string` | 操作系统标识符 |

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

单项结果数组。每个数据集条目对应一个对象，按索引顺序排列。

| 字段 | 类型 | 描述 |
|-------|------|-------------|
| `entry_index` | `number` | 该条目在数据集中的索引（与 `entries[].index` 匹配） |
| `source_text` | `string` | 被翻译的源文本 |
| `target_expected` | `string` | 数据集中的黄金标准参考文本 |
| `target_output` | `string` | 模型的实际输出 |
| `exact_match` | `boolean` | 是否 `target_output === target_expected` |
| `entry_chrf` | `number` | 该条目的句子级别 chrF++ 分数 (0–100) |
| `fst_accepted` | `boolean \| null` | FST 分析器是否接受该输出。如果未配置分析器，则为 `null` |
| `fst_analysis` | `string[]` | 输出的 FST 分析字符串（如果未分析或被拒绝，则为空数组） |
| `difficulty` | `string` | 数据集中的难度层级（`easy`、`medium`、`hard`） |
| `provenance` | `string` | 数据集中的来源标签 |
| `latency_seconds` | `number` | 此单项条目的响应时间 |
| `usage` | `object` | 单项条目的 Token 使用情况：`{ prompt_tokens, completion_tokens, reasoning_tokens }` |
| `error` | `string \| null` | 如果该条目失败，则显示错误消息。成功时为 `null` |

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

| 字段 | 类型 | 描述 |
|-------|------|-------------|
| `run_card_hash` | `string` | 整个运行卡片 JSON 的 SHA-256 哈希值，在哈希处理期间，`run_card_hash` 字段本身被设置为 `""` |

这是防篡改印章。排行榜在提交时会重新计算此哈希值，并拒绝不匹配的卡片。

**计算哈希值：**

1. 将运行卡片序列化为 JSON，并将 `run_card_hash` 设置为 `""`
2. 计算序列化字符串的 SHA-256 值
3. 将 `run_card_hash` 设置为生成的十六进制摘要

```python
import hashlib, json

card["run_card_hash"] = ""
card_json = json.dumps(card, sort_keys=True, ensure_ascii=False)
card["run_card_hash"] = hashlib.sha256(card_json.encode()).hexdigest()
```

---

## 另请参阅

- [机器翻译评估 (MT Evaluation)](/docs/eval/) — 概述、排行榜价值以及好/坏方法指南
- [评估测试框架 (Eval Harness)](/docs/eval/harness) — 如何运行评估并生成运行卡片
- [评估数据集](/docs/eval/datasets) — 数据集格式、EDTeKLA、FLORES+
- [构建方法](/docs/eval/methods) — 方法接口和方法卡片规范
- [方法排行榜](/leaderboard) — 实时基准测试分数