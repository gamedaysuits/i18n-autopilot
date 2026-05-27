---
sidebar_position: 1
slug: /
title: "简介"
---
# i18n-rosetta

一个完全可定制的国际化框架。一条命令即可翻译你的本地化文件。一份配置即可控制所有方法、模型和语言对。如果内置方法不够用——你可以自己构建、验证并部署。

```bash
npx i18n-rosetta sync
```

rosetta 会自动检测你的本地化文件、格式和目标语言。它会翻译缺失的内容，跳过已完成的部分，验证每个结果，并写入干净的输出。这只是个起点。

---

## 为什么不自己写脚本？

你可以写个简单的循环，对每个键调用 Google Translate。大多数开发者都是这么做的——大概只需要 30 行代码。但这种做法会在以下方面出问题：

- **没有变更检测。** 更新一个英文字符串——翻译结果永远是旧的。rosetta 使用 SHA-256 哈希跟踪每个源值，只重新翻译发生变化的内容。
- **没有批处理。** 每个键调用一次 API 意味着 200 个键 = 200 次网络请求。rosetta 会智能地进行批处理（可配置，LLM 默认 30 个键/批，Google 默认 128 个键/批）。
- **没有缓存。** 每次同步都会重新翻译所有内容。rosetta 的 Translation Memory（翻译记忆库）会根据源文本 + 区域设置 + 方法缓存翻译结果——在一个键发生更改后重新运行同步，只会翻译那一个键，而不是整个文件。
- **没有质量把控。** 机器翻译会出现幻觉、原样返回源文本或输出错误的字符集。rosetta 在写入之前会验证每条翻译——字符集错误、长度膨胀和原样返回都会被拦截并拒绝。
- **无法识别格式。** 硬编码为 JSON？rosetta 支持自动检测并处理 JSON、TOML、YAML 和 Hugo Markdown（frontmatter + 正文）。
- **没有方法控制。** 每个语言对都使用相同的方法。rosetta 允许你在同一个配置文件中，对法语使用 Google Translate，对日语使用 LLM，对克里语（Cree）使用社区托管的自定义流水线。

rosetta 就是那个脚本的生产级版本。

---

## 它有何不同

### 每个方法都是一个插件

翻译方法可以**按语言对进行配置**。你可以在同一个项目中混合使用 Google Translate、LLM、引导提示词（coached prompts）和自定义 API：

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

法语使用 Google Translate（快速、便宜）。日语使用高级 LLM（注重细节）。平原克里语（Plains Cree）使用带有语法规则、词典和形态验证的引导式插件。使用相同的 `sync` 命令。相同的质量把控。相同的 CLI。

### 验证它

认为你的方法可以把英语翻译成西班牙语？土耳其语翻译成阿塞拜疆语？英语翻译成克里语？

**验证它。** 配套的 [eval harness](https://mtevalarena.org/docs/specifications/harness)（评估测试台）可以通过可重复的、带指纹的评分来对任何翻译方法进行基准测试。[排行榜](/leaderboard)会跟踪每次提交。

评估测试台和生产环境 CLI 共享相同的插件接口。在测试台中得分高的方法可以用于生产环境——前提是该语言所属的社区同意。对于原住民语言和低资源语言，这种同意至关重要。请参阅 [Data Sovereignty](https://mtevalarena.org/docs/sovereignty/data-sovereignty)（数据主权）。

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
| `watch` | 源文件更改时自动同步 |
| `lint` | 扫描源代码中的硬编码字符串 |
| `wrap` | 自动将硬编码字符串包装在 `t()` 调用中 |
| `audit` | 列出所有未翻译的 `[EN]` 回退值 |
| `integrity` | 检测占位符损坏、编码问题和 ICU 复数完整性 |
| `seo` | 生成 hreflang 标签、站点地图和 JSON-LD schema |
| `status` | 显示语言对配置、插件和基准测试分数 |
| `provenance` | 审计翻译资源许可 |
| `plugin` | 安装、移除和列出方法插件 |
| `fonts` | 为 PUA 字符集转换器下载 Web 字体 |
| `tm` | 管理 Translation Memory 缓存（统计、清除、按区域设置） |
| `xliff` | 导出/导入 XLIFF 1.2 供专业译员审校 |

其中三个——`lint`、`sync`、`audit`——构成了一个 CI 流水线，它可以捕获硬编码字符串，对其进行翻译，并在任何区域设置不完整时使构建失败。

---

## 竞技场

[Method Leaderboard](/leaderboard)（方法排行榜）就是记分板。每次提交都会绑定到一个 Git 提交指纹，版本化到特定的数据集，并由同一个测试台进行评分。任何人都可以提交。

**你能验证什么？** 测试台接收 JSON。插件接收 JSON。任何生成 JSON 的方法都可以进行测试：

| 方法 | 示例 |
|----------|---------|
| **Coached LLM** | 将语法规则和词典注入到前沿模型的提示词中 |
| **Fine-tuned model** | 在平行文本上训练开源模型——只要不是在评估数据上 |
| **FST-gated pipeline** | LLM 生成 → 有限状态转换器验证形态 → 重试 |
| **Chained models** | 模型 A 起草 → 模型 B 译后编辑 → 模型 C 评分 |
| **Dictionary + LLM** | 强制使用词典中的已知术语，让 LLM 处理其余部分 |
| **Evolutionary** | 生成候选，对其评分，对最佳结果进行变异，重复此过程 |
| **Partial translation** | 手动翻译一个样本，证明你的 LLM 能够匹配，然后自动翻译其余部分 |

微调模型。部署演化算法。在语言考试中测试学生的答案。构建查找表。将三个模型串联起来。只要你的方法生成 JSON，测试台就会对其进行评分，框架就会运行它。

:::danger 唯一规则
**不要在评估数据上进行训练。** 接触过基准数据集的方法将被取消资格。你可以在任何数据上进行微调，但绝不能在测试集上。
:::

这是一份公开邀请。如果你从事低资源语言相关的工作——无论你是研究人员、社区成员、学生，还是仅仅是关心此事的人——构建一个方法，运行测试台，并拿下最高分。问题尚未解决，但基础设施已经就绪。

**[→ 查看排行榜](/leaderboard)**

---

## 后续步骤

**快速入门：**
- [安装](/docs/getting-started/installation) — 2 分钟内完成设置
- [快速开始](/docs/getting-started/quick-start) — 运行你的首次同步
- [支持的语言](/docs/reference/supported-languages) — 开箱即用的语言列表

**自定义设置：**
- [翻译方法](/docs/guides/translation-methods) — 为每个语言对选择合适的方法
- [Translation Memory](/docs/concepts/translation-memory) — 缓存如何帮你省钱
- [配置](/docs/getting-started/configuration) — 完整的配置参考
- [Hugo 多语言站点](/docs/tutorials/hugo-multilingual-site) — Markdown 内容翻译

**深入了解：**
- [与专业译员合作](/docs/guides/professional-translators) — XLIFF 导出/导入工作流
- [数据主权](https://mtevalarena.org/docs/sovereignty/data-sovereignty) — OCAP、CARE 和毛利人数据主权原则
- [支持低资源语言](https://mtevalarena.org/docs/community/low-resource-languages) — 开启这一切的挑战
- [实战指南：FST-Gated Pipeline](https://mtevalarena.org/docs/tutorials/fst-gated-pipeline) — 构建分解流水线
- [机器翻译评估](https://mtevalarena.org/docs/leaderboard/rules) — 测试台和排行榜的工作原理
- [方法排行榜](/leaderboard) — 实时分数和提交记录