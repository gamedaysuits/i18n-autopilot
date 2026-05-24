---
sidebar_position: 5
title: "辅导数据"
---
# 辅导数据

辅导数据是 rosetta 用于向 LLM 教授其未经训练的语言的机制。通过在每个翻译请求中提供语法规则、字典和样式说明，你可以将通用的 LLM 转换为适用于任何语言（包括目前完全没有 MT 支持的语言）的具备上下文感知能力的翻译器。

## 工作原理

当你将语言对的方法设置为 `llm-coached` 时，rosetta 会从 `.rosetta/coaching/<locale>.json` 加载辅导文件，并将其内容作为系统消息的一部分注入到每个 LLM 提示词中。LLM 会在看到翻译请求的同时看到你的语言规则，从而生成遵循你的语法和术语的输出，而不是盲目猜测。

```
┌──────────────────────────────────────────────────────┐
│ System Message (cached across batches)               │
│ ┌──────────────────────────────────────────────────┐ │
│ │ Base translation rules                           │ │
│ │ + Register instructions                          │ │
│ │ + Grammar rules (from coaching data)             │ │
│ │ + Dictionary entries (from coaching data)         │ │
│ │ + Style notes (from coaching data)               │ │
│ └──────────────────────────────────────────────────┘ │
├──────────────────────────────────────────────────────┤
│ User Message (per batch)                             │
│ ┌──────────────────────────────────────────────────┐ │
│ │ Keys to translate (JSON)                         │ │
│ └──────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────┘
```

由于辅导数据是系统消息的一部分，它受益于**提示词缓存**——像 Anthropic 和 Google 这样的提供商会缓存重复的系统前缀，因此你只需在每个会话中为辅导上下文支付一次费用，而不是每个批次都要付费。

## 辅导文件格式

在 `.rosetta/coaching/` 中为每个区域设置创建一个 JSON 文件：

```json title=".rosetta/coaching/crk.json"
{
  "grammar_rules": [
    "Plains Cree is polysynthetic — a single word can express what English needs a full sentence for",
    "Animate/inanimate noun distinction affects verb conjugation",
    "Use SRO (Standard Roman Orthography) unless script converter handles conversion",
    "Verb stems are modified by prefixes and suffixes to indicate person, number, tense, and evidentiality"
  ],
  "dictionary": {
    "home": "kīwēwin",
    "settings": "isi-nākatohkēwin",
    "search": "nānātawāpahtam",
    "welcome": "tānisi",
    "submit": "ispīhci",
    "cancel": "pōni"
  },
  "style_notes": "Use formal register. Preserve English technical terms in parentheses when no Cree equivalent exists. Avoid loanwords when a descriptive Cree expression exists."
}
```

### 字段

| 字段 | 类型 | 必填 | 描述 |
|-------|------|----------|-------------|
| `grammar_rules` | `string[]` | 否 | 注入到系统提示词中的语法规则数组。每条规则都应该是 LLM 能够遵循的简明、可执行的指令。 |
| `dictionary` | `object` | 否 | 英文术语 → 目标语言术语的键值对映射。用于 LLM 可能不知道的特定领域词汇。 |
| `style_notes` | `string` | 否 | 自由格式的样式说明（语域、语气、正式程度约定）。 |

所有字段都是可选的——你可以先从字典开始，然后在完善过程中添加语法规则。

## 回退行为

如果某个语言对配置为 `llm-coached`，但该区域设置不存在辅导文件，rosetta 会**回退到标准的 `llm` 方法**，并输出控制台警告：

```
[INFO] No coaching data for "crk" at .rosetta/coaching/crk.json
       Falling back to standard LLM method. Create coaching data for better results.
```

这意味着你可以安全地在全局设置 `"defaultMethod": "llm-coached"`——拥有辅导数据的语言将使用它，其余语言将获得标准的 LLM 翻译而不会报错。

## 何时使用辅导数据

| 场景 | 推荐方法 |
|----------|-------------------|
| 第一梯队语言（法语、西班牙语、德语） | `llm` 或 `google-translate` —— LLM 已经非常了解这些语言 |
| 第二梯队语言（韩语、土耳其语、泰语） | 带有语域设置的 `llm` —— LLM 在样式指导下能充分处理这些语言 |
| 第三梯队语言（平原克里语、约鲁巴语、克丘亚语） | `llm-coached` —— LLM 需要语法规则和字典 |
| 人造语言（克林贡语、辛达林语、氪星语） | `llm-coached` —— LLM 有一些训练数据，但需要纠正 |

## 构建优秀的辅导数据

### 语法规则

将规则写成**指令**，而不是描述。LLM 遵循指令的效果比解释语言学理论更好。

```json
// ❌ Descriptive (the LLM learns nothing actionable)
"Plains Cree has animate and inanimate noun classes"

// ✅ Instructive (the LLM knows what to do)
"When translating nouns, check whether the Cree equivalent is animate (NA) or inanimate (NI) — this affects which verb conjugation to use"
```

### 字典

专注于 LLM 可能会弄错或捏造的**特定领域术语**。不要在 LLM 已经能处理的常用词上浪费时间——专注于你的应用程序 UI 特有的术语。

### 样式说明

明确说明语域、正式程度和约定：

```json
"style_notes": "Use formal register (vous-form in French). Preserve brand names untranslated. UI labels should be imperative mood ('Save', not 'Saves'). Maximum 40 characters for button text."
```

## 测试辅导翻译

使用 [MT Eval Harness](https://github.com/gamedaysuits/gds-mt-eval-harness) 将你的辅导翻译与参考语料库进行基准测试：

```bash
# Install the harness
pip install mt-eval-harness

# Run coached translations against your test corpus
mt-eval run --corpus data/crk-corpus.json --model google/gemini-2.5-pro

# Score the results
mt-eval test eval/logs/run_*.json
```

这将为你提供 chrF++、BLEU 和完全匹配分数。创建多个辅导文件版本并进行比较——客观指标胜过主观审查。

---

## 另请参阅

- [翻译方法](/docs/guides/translation-methods) —— llm-coached 方法
- [支持低资源语言](/docs/guides/low-resource-languages) —— 辅导实践
- [插件规范](/docs/reference/plugin-spec) —— 在插件中打包辅导数据
- [质量门禁](/docs/concepts/quality-gate) —— 如何验证辅导翻译
- [配置](/docs/getting-started/configuration) —— 每个语言对的辅导配置