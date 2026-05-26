---
sidebar_position: 1
slug: /
title: "简介"
---
# i18n-rosetta

一个完全可定制的国际化框架。一条命令即可翻译你的本地化文件。一份配置即可控制所有方法、模型和语言对。如果内置方法不够用——构建你自己的方法，验证它，然后部署。

```bash
npx i18n-rosetta sync
```

rosetta 会自动检测你的本地化文件、格式和目标语言。它会翻译缺失的内容，跳过已完成的部分，验证每个结果，并写入干净的输出。这只是起点。

---

## 为什么不自己写脚本？

你可以写一个简单的循环，对每个键调用 Google Translate。大多数开发者都是这么做的——大概需要 30 行代码。但这种做法会在以下情况失效：

- **没有变更检测。** 更新一个英文字符串——翻译结果永远是旧的。rosetta 使用 SHA-256 哈希跟踪每个源值，只重新翻译发生变更的内容。
- **没有批处理。** 每个键调用一次 API 意味着 200 个键 = 200 次网络请求。rosetta 会智能地进行批处理（可配置，LLM 默认 30 个键/批，Google 默认 128 个）。
- **没有质量把控。** 机器翻译会出现幻觉、直接返回原文，或者输出错误的文字系统。rosetta 在写入之前会验证每条翻译——错误文字、长度膨胀和原文照搬都会被捕获并拒绝。
- **没有格式感知。** 硬编码为 JSON？rosetta 支持自动检测并处理 JSON、TOML、YAML 和 Hugo Markdown（frontmatter + 正文）。
- **没有方法控制。** 每个语言对都使用相同的方法。rosetta 允许你在同一个配置文件中，为法语使用 Google Translate，为日语使用 LLM，为 Cree 语使用社区托管的自定义流水线。

rosetta 就是那个脚本的生产级版本。

---

## 它有何不同

### 每个方法都是一个插件

翻译方法**支持按语言对配置**。在同一个项目中混合使用 Google Translate、LLM、引导提示词和自定义 API：

```json title="i18n-rosetta.config.json"
{
  "version": 3,
  "pairs": {
    "en:fr": { "method": "google-translate" },
    "en:ja": { "method": "llm", "model": "google/gemini-2.5-pro" },
    "en:crk": { "methodPlugin": "crk-coached-v1" }
  }
}
```

法语使用 Google Translate（快速、便宜）。日语使用高级 LLM（注重细节）。Plains Cree 语使用带有语法规则、词典和形态验证的引导式插件。使用相同的 `sync` 命令。相同的质量把控。相同的 CLI。

### 证明它

认为你的方法能把英语翻译成西班牙语？土耳其语翻译成阿塞拜疆语？英语翻译成 Cree 语？

**证明它。** 配套的 [评估工具](https://mtevalarena.org/docs/specifications/harness) 可对任何翻译方法进行基准测试，并提供可复现、带指纹的评分。[排行榜](/leaderboard) 会跟踪每次提交。

评估工具和生产 CLI 共享相同的插件接口。在评估工具中得分高的方法可以用于生产环境——前提是该语言所属的社区同意。对于原住民和低资源语言，这种同意至关重要。请参阅 [数据主权](https://mtevalarena.org/docs/sovereignty/data-sovereignty)。

```bash
# Benchmark your method (in the eval harness repo)
cd gds-mt-eval-harness
python eval/baseline_experiment.py --dataset data/edtekla-dev-v1.json --submit

# Use it locally
npx i18n-rosetta sync
```

相同的插件。即插即测。

### 完整的工具包

rosetta 不仅仅是 `sync`。它是一个完整的 i18n 流水线：

| 命令 | 功能 |
|---------|-------------|
| `sync` | 翻译缺失、过时和回退的键 |
| `watch` | 当源文件更改时自动同步 |
| `lint` | 扫描源代码中的硬编码字符串 |
| `wrap` | 自动将硬编码字符串包装在 `t()` 调用中 |
| `audit` | 列出所有未翻译的 `[EN]` 回退值 |
| `integrity` | 检测占位符损坏和编码问题 |
| `seo` | 生成 hreflang 标签、站点地图和 JSON-LD |
| `status` | 显示语言对配置、插件和基准测试分数 |
| `provenance` | 审计翻译资源的许可协议 |
| `plugin` | 安装、移除和列出方法插件 |

其中的三个——`lint`、`sync`、`audit`——构成了一个 CI 流水线，它可以捕获硬编码字符串，对其进行翻译，并在任何本地化文件不完整时使构建失败。

---

## 竞技场

[方法排行榜](/leaderboard) 就是记分牌。每次提交都会绑定到一个 Git 提交指纹，对应特定数据集的版本，并由相同的评估工具进行评分。任何人都可以提交。

**你能证明什么？** 评估工具接收 JSON。插件接收 JSON。任何能生成 JSON 的方法都可以进行测试：

| 方法 | 示例 |
|----------|---------|
| **引导式 LLM** | 将语法规则和词典注入前沿模型的提示词中 |
| **微调模型** | 在平行语料上训练开源模型——只要不是在评估数据上即可 |
| **FST 门控流水线** | LLM 生成 → 有限状态转换器验证形态 → 重试 |
| **模型链** | 模型 A 起草 → 模型 B 译后编辑 → 模型 C 评分 |
| **词典 + LLM** | 强制使用词典中的已知术语，让 LLM 处理其余部分 |
| **演化算法** | 生成候选结果，进行评分，对最佳结果进行变异，重复此过程 |
| **部分翻译** | 手动翻译样本，证明你的 LLM 能够匹配，然后自动翻译其余部分 |

微调模型。部署演化算法。在语言考试中测试学生的答案。构建查找表。将三个模型串联起来。只要你的方法能生成 JSON，评估工具就能对其评分，框架就能运行它。

:::danger 唯一规则
**不要在评估数据上进行训练。** 接触过基准数据集的方法将被取消资格。你可以在任何数据上进行微调。但绝对不能是测试集。
:::

这是一份公开邀请。如果你从事低资源语言相关工作——无论是作为研究人员、社区成员、学生，还是仅仅是一个关心此事的人——构建一个方法，运行评估工具，拿下最高分。问题尚未解决。基础设施已经就绪。

**[→ 查看排行榜](/leaderboard)**

---

## 下一步

**快速入门：**
- [安装](/docs/getting-started/installation) — 2 分钟完成设置
- [快速开始](/docs/getting-started/quick-start) — 运行你的首次同步
- [支持的语言](/docs/reference/supported-languages) — 开箱即用的语言列表

**自定义设置：**
- [翻译方法](/docs/guides/translation-methods) — 为每个语言对选择合适的方法
- [配置](/docs/getting-started/configuration) — 完整的配置参考
- [Hugo 多语言站点](/docs/tutorials/hugo-multilingual-site) — Markdown 内容翻译

**深入了解：**
- [数据主权](https://mtevalarena.org/docs/sovereignty/data-sovereignty) — OCAP、CARE 和毛利数据主权原则
- [支持低资源语言](https://mtevalarena.org/docs/community/low-resource-languages) — 开启这一切的挑战
- [实战指南：FST 门控流水线](https://mtevalarena.org/docs/tutorials/fst-gated-pipeline) — 构建分解流水线
- [机器翻译评估](https://mtevalarena.org/docs/leaderboard/rules) — 评估工具和排行榜的工作原理
- [方法排行榜](/leaderboard) — 实时分数和提交记录