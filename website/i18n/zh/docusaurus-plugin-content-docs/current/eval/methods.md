---
sidebar_position: 4
title: "方法接口"
---
# 共享方法接口

eval harness 和 i18n-rosetta 共享一个通用概念：**翻译方法 (translation method)**。方法是指任何接收源文本并生成翻译文本的过程——无论是直接调用 LLM、多阶段 pipeline、第三方 API，还是人工翻译。

## 架构

```
Method Plugin (v2 Spec)
├── manifest.json         ← Shared metadata (name, version, supported pairs)
├── method_card.json      ← Leaderboard description (what, not how)
├── translate.py          ← Python entry point (for eval harness)
└── translate.js          ← Node.js entry point (for i18n-rosetta CLI)
```

## 两个系统，一个接口

| | Eval Harness | i18n-rosetta |
|---|---|---|
| **语言** | Python | Node.js |
| **入口点** | `translate.py` | `translate.js` |
| **接口** | `TranslationProcess` 协议 | `methodPlugin` 配置 |
| **用途** | 带评分的批量评估 | dev/CI 中的实时本地化 |
| **输出** | 包含指标的 run card | 翻译后的本地化文件 |

支持这两个系统的方法会提供两个入口点——每个语言运行时各一个。**method card** 是连接两者的桥梁：它以两个系统都能理解的格式描述该方法。

## Method Card

Method card 描述了翻译方法是*什么*，而不会泄露完整的系统提示词等专有细节。它回答了以下问题：

- 这是什么类别的方法？（原生 LLM、经过指导的 LLM、pipeline、API 等）
- 它使用了什么工具？（FST 分析器、字典等）
- 实现是否开源？
- 它支持哪些语言对？

有关完整的 JSON schema，请参阅 [Method Card 规范](https://github.com/gamedaysuits/gds-mt-eval-harness/blob/main/docs/method-card-spec.md)。

### 示例

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

### 方法类别

| 类别 | 描述 |
|-------|-------------|
| `raw-llm` | 带有最少指令的直接 LLM 调用 |
| `coached-llm` | 带有结构化提示词、示例和约束的 LLM |
| `pipeline` | 带有确定性组件的多阶段 pipeline |
| `custom-plugin` | 实现 `TranslationProcess` 协议的外部进程 |
| `api` | 第三方翻译 API（Google Translate、DeepL 等） |
| `human` | 人工翻译（用于建立基准） |

## Eval Harness: TranslationProcess 协议

eval harness 使用 Python 的结构化类型 (`Protocol`) 来处理插件。任何具有正确方法签名的类都可以使用——不需要继承：

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

有关包含非 Python 方法包装器示例的完整文档，请参阅 [插件协议](https://github.com/gamedaysuits/gds-mt-eval-harness/blob/main/docs/plugin-protocol.md)。

## i18n-rosetta: methodPlugin 配置

在 rosetta 中，方法按语言对在 `i18n-rosetta.config.json` 中注册：

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

有关 rosetta 端的接口，请参阅 [插件规范](/docs/reference/plugin-spec)。

## 排行榜集成

当 method card 附加到某次运行（通过 `--method-card`）时，它会嵌入到 run card 中并显示在排行榜上：

```bash
# Run with method card attached
python eval/baseline_experiment.py \
  --dataset data/edtekla-dev-v1.json \
  --method-card method_card.json \
  --submit
```

排行榜显示：
- **类别徽章** — 视觉指示器（例如 "pipeline"、"coached-llm"）
- **方法名称** — 来自 method card
- **使用的工具** — 列自 method card
- **开源指示器**

如果没有附加 method card，排行榜将显示 harness 原生配置（模型、条件、temperature、启用的工具）。

:::danger 请勿在评估数据上进行训练
如果在开发过程中接触过评估数据集（作为训练数据、少样本示例、字典条目或提示词微调材料），该方法将被取消排行榜的**参赛资格**。有关区分好方法和坏方法的标准，请参阅 [MT 评估](/docs/eval/)。
:::

---

## 另请参阅

- [MT 评估](/docs/eval/) — 概述、排行榜价值以及好/坏方法指南
- [Eval Harness](/docs/eval/harness) — 如何运行评估
- [评估数据集](/docs/eval/datasets) — 可用数据集（EDTeKLA、FLORES+）
- [Run Card 规范](/docs/eval/run-card) — run card 的 JSON schema
- [插件规范](/docs/reference/plugin-spec) — rosetta 端的插件接口
- [方法排行榜](/leaderboard) — 实时基准测试分数