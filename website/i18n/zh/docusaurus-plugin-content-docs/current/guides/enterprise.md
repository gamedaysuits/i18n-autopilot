---
sidebar_position: 7
title: "面向企业"
description: "企业如何通过经过排行榜验证的方法、自定义插件和一键部署来实现翻译标准化。"
---
# i18n-rosetta 企业版

你的团队经常需要翻译内容。你有一堆本地化文件、一个 CI 流水线，以及一个可能需要有人手动运行 Google Translate、将结果复制到 JSON 中并祈祷一切顺利的流程。或者，你正在为某个 TMS 平台付费，却被锁定在单一供应商的翻译引擎中。

现在有更好的方法。

## 核心优势

1. **为每种语言选择最佳方法** —— 而不是使用供应商的默认设置
2. **一键部署** —— `npx i18n-rosetta sync` 每次都能翻译所有语言环境和所有格式
3. **无需更改代码即可切换方法** —— 只需修改配置，无需迁移
4. **掌控你的流水线** —— 没有供应商锁定，没有按月付费的仪表盘，无需注册账号

```json title="i18n-rosetta.config.json"
{
  "version": 3,
  "pairs": {
    "en:fr": { "method": "deepl" },
    "en:ja": { "method": "llm", "model": "google/gemini-2.5-pro" },
    "en:de": { "method": "google-translate" },
    "en:ko": { "method": "llm", "register": "polite-haeyo" },
    "en:crk": { "methodPlugin": "crk-coached-v3" }
  }
}
```

法语使用 DeepL（你的团队更喜欢它地道的欧洲表达）。日语使用前沿的 LLM。德语使用 Google Translate（快速、便宜且够用）。韩语使用带有正式语气的 LLM。平原克里语（Plains Cree）使用在排行榜上得分最高的社区构建的辅导插件。

**相同的命令。相同的 CI 流水线。每个语言对使用不同的方法。只需一个配置文件。**

## 排行榜 → 部署工作流

:::tip 即将推出：`rosetta leaderboard` CLI
下面描述的工作流是 [MT Eval Arena](https://mtevalarena.org) 排行榜与 i18n-rosetta CLI 之间计划进行的集成。双方的基础设施均已就绪 —— 连接两者的桥梁正在开发中。
:::

[MT Eval Arena](https://mtevalarena.org) 是对翻译方法进行基准测试的地方，提供可复现且带有指纹的评分。每种方法都会在多个指标（chrF++、完全匹配、FST 接受度、语义评分）上获得一个综合得分。排行榜会记录每一次提交。

计划的工作流如下：

```bash
# Browse the leaderboard from your terminal
npx i18n-rosetta leaderboard --pair en:crk

# Output:
# ┌──────┬───────────────────────┬────────────┬──────────┬───────────┐
# │ Rank │ Method                │ Model      │ chrF++   │ Composite │
# ├──────┼───────────────────────┼────────────┼──────────┼───────────┤
# │  1   │ crk-coached-v3        │ gemini-2.5 │ 43.2     │ 0.67      │
# │  2   │ fst-gated-pipeline    │ gpt-4o     │ 41.8     │ 0.63      │
# │  3   │ prompt-baseline       │ claude-4   │ 38.1     │ 0.55      │
# └──────┴───────────────────────┴────────────┴──────────┴───────────┘

# Install the top-scoring method as a plugin
npx i18n-rosetta plugin install crk-coached-v3

# Use it
npx i18n-rosetta sync
```

**你不需要构建方法。你不需要训练模型。你只需挑选胜出者并进行部署。** 如果下个月排行榜上出现了更好的方法，你只需一条命令即可完成切换。

## 目前可用的功能

排行榜到 CLI 的桥梁正在开发中。以下是目前已经可用的功能：

### 内置方法（无需插件）

| 方法 | 最佳适用场景 | 成本 |
|--------|----------|------|
| `llm` (默认) | 注重质量，支持任何语言 | 通过 OpenRouter 按 token 计费 |
| `gemini` | 质量 + 免费额度 | 免费（有限制），超出后按 token 计费 |
| `google-translate` | 速度 + 大词汇量 | $20/百万字符 |
| `deepl` | 欧洲语言 | $25/百万字符 |
| `llm-coached` | 带有辅导数据的语言 | 通过 OpenRouter 按 token 计费 |
| `api` | 自定义/社区托管方法 | 自托管 |

### 插件方法（需单独安装）

自定义插件可以封装任何翻译逻辑 —— 微调模型、基于 FST 的流水线、社区 API，或任何其他能生成 JSON 的工具。请参阅[构建插件](/docs/tutorials/build-a-plugin)。

## 企业级工作流

### 1. 评估当前的翻译质量

```bash
# See what you're getting today
npx i18n-rosetta status

# Output shows: method per pair, cache hit rate, quality gate stats
```

### 2. 对候选方法运行评估工具

[评估工具](https://mtevalarena.org/docs/specifications/harness)允许你针对同一数据集对多种方法进行基准测试。运行一次全面测试，比较得分，然后挑选胜出者：

```bash
# In the eval harness repo
python -m mt_eval_harness.run \
  --methods coached-v3 baseline prompt-tuned \
  --dataset data/your-corpus.json
```

### 3. 为每个语言对配置胜出者

更新你的配置，为每个语言对使用最佳方法。不同的语言有不同的最佳方法 —— 这正是核心所在。

### 4. 集成到 CI/CD

```bash
# In your CI pipeline
npx i18n-rosetta lint        # Catch hardcoded strings
npx i18n-rosetta sync        # Translate what changed
npx i18n-rosetta audit       # Fail if any locale is incomplete
npx i18n-rosetta integrity   # Validate placeholder consistency
```

三个命令。零手动翻译。流水线会捕获硬编码的字符串，使用你选择的方法进行翻译，如果发现任何缺失或损坏，则会中断构建。

### 5. 专业审查（可选）

对于高风险内容，可以导出为 XLIFF 以供人工审查：

```bash
npx i18n-rosetta xliff export --locale ja --output translations.xliff
# → Send to your translation agency
# → Import corrections back:
npx i18n-rosetta xliff import translations.xliff
```

机器翻译大部分内容。人工审查关键路径。只在重要的地方为人工时间付费。

## 成本模型

rosetta **没有许可费，没有按月订阅，也没有按席位定价**。它是一个开源的 CLI 工具。你只需为翻译 API 调用付费：

| 数量 | Google Translate | LLM (Gemini Flash) | LLM (GPT-4o) |
|--------|-----------------|---------------------|---------------|
| 1,000 个键 × 5 种语言环境 | ~$0.50 | ~$0.30 (免费额度) | ~$2.00 |
| 10,000 个键 × 15 种语言环境 | ~$15 | ~$8 | ~$60 |
| 50,000 个键 × 30 种语言环境 | ~$75 | ~$40 | ~$300 |

翻译记忆库（Translation Memory）意味着在后续同步中，你只需为**更改的键**付费。如果你在 10,000 个字符串中更新了 10 个，你只需为 10 次翻译付费，而不是 10,000 次。

## 对比 TMS 平台

| | rosetta | Crowdin / Phrase / Locize |
|---|---|---|
| **定价** | 免费（开源）+ API 成本 | $50–$500/月 + 按席位收费 |
| **供应商锁定** | 无 —— 在配置中即可切换提供商 | 高 —— 数据在他们的云端 |
| **方法选择** | 任何提供商、任何模型、按语言对配置 | 仅限他们提供的选项 |
| **CI/CD** | 一流支持 (`lint → sync → audit`) | 插件/Webhook |
| **自定义方法** | 插件系统、社区插件 | 不支持 |
| **质量门禁** | 内置（错误脚本、回显、长度） | 视情况而定 |
| **自托管** | 支持 (LibreTranslate、自定义 API) | 不支持 |

详情请参阅[完整对比](/docs/guides/comparison)。

## 延伸阅读

- **[快速入门](/docs/getting-started/quick-start)** —— 在 60 秒内运行你的首次同步
- **[翻译方法](/docs/guides/translation-methods)** —— 包含决策树的完整方法菜单
- **[CI/CD 集成](/docs/guides/ci-cd)** —— 在流水线中实现自动化
- **[与专业译者协作](/docs/guides/professional-translators)** —— XLIFF 导出/导入
- **[MT Eval Arena](https://mtevalarena.org)** —— 基准测试与排行榜
- **[配置参考](/docs/getting-started/configuration)** —— 所有配置选项