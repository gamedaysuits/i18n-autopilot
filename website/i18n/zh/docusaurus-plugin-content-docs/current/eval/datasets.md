---
sidebar_position: 3
title: "评估数据集"
---
# 评估数据集

数据集是测试工具 (harness) 运行时的固定目标。每个数据集都是一个 JSON 文件，包含源语言到目标语言的配对以及黄金标准 (gold-standard) 参考译文。测试工具会根据这些参考译文对模型输出进行评分——它绝不会修改这些译文。

:::danger 请勿在评估数据上进行训练

⚠️ **这些数据集仅供评估使用。** 任何经过训练、微调、少样本提示 (few-shot-prompted) 或以其他方式接触过评估数据的方法，都会产生虚高分数，并被**取消排行榜资格。**

请使用独立的语料库进行训练。在开发过程中，你的模型绝不能接触到评估集。
:::

---

## 数据集格式

每个数据集都遵循相同的 JSON 模式 (schema)：

```json
{
  "dataset": {
    "id": "dataset-slug",
    "version": "1.0",
    "language_pair": "EN→CRK",
    "description": "Human-readable description of the dataset",
    "source_language": "en",
    "target_language": "crk",
    "created": "2025-05-01",
    "license": "CC-BY-NC-4.0",
    "provenance": ["gold_standard", "textbook"]
  },
  "entries": [
    {
      "index": 0,
      "source_text": "Hello",
      "target_expected": "tânisi",
      "difficulty": "easy",
      "provenance": "gold_standard",
      "notes": "Common greeting, SRO orthography"
    }
  ]
}
```

### 顶层 `dataset` 块

| 字段 | 类型 | 描述 |
|-------|------|-------------|
| `id` | `string` | 唯一数据集标识符（用于运行卡片和排行榜） |
| `version` | `string` | 语义化版本。增加此版本号会使之前的运行卡片比较失效 |
| `language_pair` | `string` | 显示标签（例如 `EN→CRK`） |
| `description` | `string` | 易于阅读的摘要 |
| `source_language` | `string` | BCP 47 源语言代码 |
| `target_language` | `string` | BCP 47 目标语言代码 |
| `created` | `string` | ISO 8601 创建日期 |
| `license` | `string` | SPDX 许可证标识符 |
| `provenance` | `string[]` | 条目中使用的来源标签列表 |

### 条目字段

| 字段 | 类型 | 描述 |
|-------|------|-------------|
| `index` | `number` | 从零开始的条目索引。必须唯一且连续 |
| `source_text` | `string` | 要翻译的源文本 |
| `target_expected` | `string` | 黄金标准参考译文 |
| `difficulty` | `string` | 难度等级：`easy`、`medium`、`hard` |
| `provenance` | `string` | 此条目的来源（例如 `gold_standard`、`textbook`、`elicited`） |
| `notes` | `string` | 供人工审核者参考的可选上下文 |

---

## 可用数据集

### EDTeKLA Development Set v1

第一个评估数据集，专为英语到平原克里语 (Plains Cree, SRO) 翻译而构建。由阿尔伯塔大学的 [EdTeKLA 研究组](https://spaces.facsci.ualberta.ca/edtekla/) 创建。

| 属性 | 值 |
|----------|-------|
| **ID** | `edtekla-dev-v1` |
| **版本** | `1.0` |
| **语言对** | EN → CRK（平原克里语，SRO 正字法） |
| **条目数量** | 124 |
| **难度分布** | 简单、中等、困难 |
| **来源** | `gold_standard`（母语者验证），`textbook`（已出版的教育材料） |
| **许可证** | [CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/) |

**测试内容：**

- 基本问候语和常用短语
- 名词的生命度 (animacy) 和旁指 (obviation)
- 跨人称和时态的动词变位
- 处所结构
- 所有格范式
- 复杂句子结构

:::tip 为什么只有 124 个条目？
该数据集经过精心挑选，刻意保持较小的规模。每个条目都由流利的母语者验证，或取自已出版的克里语教科书。一个包含经过验证的黄金标准的小型高质量数据集，比一个庞大但充满噪音的数据集更有用——特别是对于资源匮乏的语言来说，“差不多”的翻译在形态学上往往是无效的。
:::

---

## 创建新数据集

要为新的语言对或领域创建数据集：

### 1. 构建 JSON 结构

遵循 [数据集格式](#dataset-format) 模式。每个条目必须包含 `source_text`、`target_expected`、`difficulty` 和 `provenance`。

### 2. 分配唯一 ID

使用具有描述性的短标识 (slug)：`{project}-{split}-v{version}`（例如 `edtekla-dev-v1`、`quechua-test-v1`）。

### 3. 验证黄金标准

每个 `target_expected` 值都必须由流利的母语者验证，或取自已出版且经过同行评审的资源。机器生成的参考译文违背了评估的初衷。

### 4. 设置难度等级

为每个条目分配一个难度级别：

| 等级 | 标准 |
|------|----------|
| `easy` | 短语，常用词汇，简单的形态学 |
| `medium` | 完整句子，中等形态学复杂度 |
| `hard` | 复杂语法，罕见结构，特定文化内容 |

### 5. 标记来源

每个条目都应标明其出处。常见标签：

- `gold_standard` — 由流利的母语者验证
- `textbook` — 取自已出版的教育材料
- `elicited` — 通过结构化诱导 (elicitation) 会话生成
- `corpus` — 从平行语料库中提取

### 6. 验证文件

使用任何模型在你的数据集上运行测试工具，以验证 JSON 格式是否正确且包含所有必需字段：

```bash
python eval/baseline_experiment.py --dataset path/to/your-dataset.json
```

如果缺少字段、索引重复或违反模式，测试工具将会报错。

### 7. 提交收录

向 [eval harness 仓库](https://github.com/gamedaysuits/gds-mt-eval-harness) 提交 Pull Request，将你的数据集文件放在 `data/` 目录中。请附上关于验证方法和来源出处的文档。

---

## FLORES+ Devtest

由 [开放语言数据倡议 (OLDI)](https://huggingface.co/datasets/openlanguagedata/flores_plus) 维护的广泛覆盖的多语言基准测试。用于 rosetta 的多模型前沿基准测试。

| 属性 | 值 |
|----------|-------|
| **ID** | `flores-plus-devtest` |
| **语言对** | EN → 39 种语言（所有 rosetta 注册的自然语言） |
| **条目数量** | 每种语言 1,012 个句子 |
| **许可证** | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/) |
| **来源** | 最初为 Meta FLORES-200，现由 OLDI 维护 |
| **位置** | 位于 rosetta 主仓库 `test/benchmark/fixtures/` 的预提取 fixture |

:::danger 仅供评估
FLORES+ 仅用于评估。维护者明确要求**不要将其用作训练数据**。请确保其内容被排除在任何训练语料库之外。
:::

---

## 另请参阅

- [机器翻译评估](/docs/eval/) — 评估框架和排行榜概述
- [评估测试工具 (Eval Harness)](/docs/eval/harness) — 如何针对这些数据集运行评估
- [运行卡片规范](/docs/eval/run-card) — 用于记录结果的 JSON 模式
- [方法排行榜](/leaderboard) — 实时基准测试分数
- [EdTeKLA 项目](https://spaces.facsci.ualberta.ca/edtekla/) — 克里语数据集背后的阿尔伯塔大学研究组