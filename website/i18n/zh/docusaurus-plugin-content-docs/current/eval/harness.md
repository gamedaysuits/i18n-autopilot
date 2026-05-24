---
sidebar_position: 2
title: "Eval Harness v2.0"
---
# Eval Harness v2.0

该 harness 运行翻译实验并生成 run cards。它负责处理 prompt 构建、API 调用、评分和结果序列化——你只需提供数据集和模型。

## 安装

**要求：** Python 3.10+

```bash
pip install sacrebleu aiohttp
```

克隆 harness 仓库：

```bash
git clone https://github.com/gamedaysuits/gds-mt-eval-harness.git
cd gds-mt-eval-harness
```

## 用法

```bash
python eval/baseline_experiment.py --dataset path/to/dataset.json
```

这将把数据集中的每个条目通过配置的模型运行，对输出进行评分，并将 run card JSON 文件写入 `results/` 目录。

## CLI 标志

| 标志 | 必填 | 默认值 | 描述 |
|------|----------|---------|-------------|
| `--dataset` | ✅ | — | 评估数据集 JSON 文件的路径 |
| `--model` | — | `openai/gpt-4o` | OpenRouter 模型标识符 (例如，`google/gemini-2.5-pro`) |
| `--condition` | — | `baseline` | 实验标签。用于区分 prompt 策略 (例如，`coached`, `few-shot`, `dictionary-augmented`) |
| `--temperature` | — | `0.3` | 采样温度。越低 = 越具确定性 |
| `--batch-size` | — | `5` | 每个并发 API 批处理的条目数 |
| `--fst-analyzer` | — | `null` | FST 分析器二进制文件的路径。提供后，将测试每个输出的形态学接受度 |
| `--submit` | — | `false` | 运行完成后将 run card 提交到排行榜 API |

### 示例

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

## Run Card Schema

每次实验都会生成一个 **run card**——一个独立的 JSON 文档。顶层结构如下：

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

有关记录了每个字段的完整 schema，请参阅 [Run Card 规范](/docs/eval/run-card)。

### 关键区块

**`dataset`** — 标识所使用的数据集，包括其内容哈希，以便将结果与特定版本绑定：

```json
{
  "id": "edtekla-dev-v1",
  "version": "1.0",
  "language_pair": "EN→CRK",
  "sha256": "...",
  "entry_count": 124
}
```

**`scores`** — 运行的聚合指标：

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

**`totals`** — Token 使用量和成本跟踪：

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

## Fingerprint 与 Run Card Hash

该 harness 会生成两个不同的哈希值。它们有不同的用途：

### Fingerprint

**fingerprint** 回答了这个问题：*“这次运行可以复现吗？”*

它对定义实验配置的输入组合进行哈希处理——而不是输出：

- 数据集 SHA-256
- 模型标识符
- 条件标签
- System prompt SHA-256
- 温度
- Harness 版本

具有相同 fingerprint 的两次运行使用了相同的设置。它们的结果应该是可比的（排除 API 的非确定性因素）。

### Run Card Hash

**run card hash** 回答了这个问题：*“这个特定的结果文件被篡改过吗？”*

它是整个 run card JSON 的 SHA-256（不包括 `run_card_hash` 字段本身）。如果任何字段发生变化——一个分数、一个时间戳、一个单一的输出——哈希就会失效。

:::info 何时使用哪个
使用 **fingerprint** 来对可比的运行进行分组（相同的实验，不同的执行）。使用 **run card hash** 来验证特定结果文件的完整性。
:::

---

## 提交到排行榜

### 自动提交

传递 `--submit` 以在完成时上传 run card：

```bash
python eval/baseline_experiment.py \
  --dataset data/edtekla-dev-v1.json \
  --submit
```

### 手动提交

Run cards 作为 JSON 文件保存在 `results/` 中。你可以通过排行榜 UI [/leaderboard](/leaderboard) 或通过 API 提交任何 run card 文件：

```bash
curl -X POST https://i18n-rosetta.com/api/leaderboard/submit \
  -H "Content-Type: application/json" \
  -d @results/your-run-card.json
```

:::warning 排行榜验证
排行榜会根据数据集注册表验证提交的 run cards。引用未知数据集或 `run_card_hash` 失效的提交将被拒绝。
:::

:::danger 请勿在评估数据上进行训练
如果你的方法在开发过程中接触过评估数据集——作为训练数据、few-shot 示例、字典条目或 prompt 工程材料——你的提交将被**取消资格**。有关什么是好方法与坏方法的说明，请参阅 [MT 评估](/docs/eval/)。
:::

---

## 另请参阅

- [MT 评估](/docs/eval/) — 概述、排行榜价值主张以及好/坏方法指南
- [评估数据集](/docs/eval/datasets) — 数据集格式、EDTeKLA、FLORES+
- [Run Card 规范](/docs/eval/run-card) — 完整的 JSON schema
- [构建方法](/docs/eval/methods) — 用于创建可评估方法的方法接口
- [方法排行榜](/leaderboard) — 实时基准分数