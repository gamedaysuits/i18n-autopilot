---
sidebar_position: 2
title: "翻译 30 种语言"
description: "实践指南：通过按语言对混合方法、批量处理和 CI 集成，将项目从 3 种语言扩展到 30 种语言。"
---
# 指南：翻译 30 种语言

将项目从少数几个区域扩展到全球覆盖。本指南将引导你完成真实多语言部署中的方法选择、成本优化和 CI 集成。

**场景：** 你有一个包含 `en`、`fr`、`es` 的 SaaS 应用。你需要根据三个级别的质量要求，再添加 27 种语言。

---

## 第 1 步：对语言进行分类

并非所有 30 种语言都需要相同的方法。请根据可用方法的质量对它们进行分组：

| 级别 | 语言 | 方法 | 原因 |
|------|-----------|--------|-----|
| **第 1 级 — 高级** | `ja`, `ko`, `zh`, `de`, `pt` | `llm` (GPT-4o) | 高价值市场，语法要求精细 |
| **第 2 级 — 标准** | `it`, `nl`, `pl`, `sv`, `da`, `fi`, `no`, `cs`, `ro`, `hu`, `el`, `tr`, `id`, `ms`, `th`, `vi`, `uk`, `bg` | `google-translate` | 数量大，Google 支持良好 |
| **第 3 级 — 辅导** | `crk`, `oj`, `mi`, `haw` | `llm-coached` + 插件 | 低资源，需要强制统一术语 |

## 第 2 步：配置每个语言对

```json title="i18n-rosetta.config.json"
{
  "version": 3,
  "inputLocale": "en",
  "localesDir": "./locales",
  "defaultMethod": "google-translate",
  "model": "google/gemini-3.5-flash",
  "languages": {
    "ja": { "name": "Japanese", "register": "Polite/formal" },
    "ko": { "name": "Korean", "register": "Formal" },
    "zh": { "name": "Simplified Chinese", "register": "Neutral" },
    "de": { "name": "German", "register": "Formal (Sie)" },
    "pt": { "name": "Brazilian Portuguese", "register": "Informal" },
    "crk": { "name": "Plains Cree (SRO)", "register": "Neutral" }
  },
  "pairs": {
    "en:ja": { "method": "llm", "model": "openai/gpt-4o" },
    "en:ko": { "method": "llm", "model": "openai/gpt-4o" },
    "en:zh": { "method": "llm", "model": "openai/gpt-4o" },
    "en:de": { "method": "llm", "model": "openai/gpt-4o" },
    "en:pt": { "method": "llm", "model": "openai/gpt-4o" },
    "en:crk": { "methodPlugin": "crk-coached-v1" }
  }
}
```

**注意：** 未在 `pairs` 中列出的语言将继承 `defaultMethod: "google-translate"`。你不需要列出全部 30 种语言。

:::info
`crk` 支持正在开发中 — 有关状态和贡献指南，请参阅 [支持低资源语言](https://mtevalarena.org/docs/community/low-resource-languages)。
:::

## 第 3 步：设置 API 密钥

此配置需要两个 API 密钥：

```bash
export OPENROUTER_API_KEY="sk-or-v1-..."
export GOOGLE_TRANSLATE_API_KEY="AIza..."
```

## 第 4 步：先进行试运行

在翻译 30 种语言之前，请务必先预览：

```bash
npx i18n-rosetta sync --dry
```

检查输出结果。它将显示：
- 哪些语言对使用哪种方法
- 每个区域设置有多少个新增/更改的键
- 每个级别的预估 API 调用次数

## 第 5 步：运行同步

```bash
npx i18n-rosetta sync
```

Rosetta 会独立处理每个语言对。使用 Google Translate 的第 2 级语言对速度会很快。第 1 级 LLM 语言对速度较慢，但质量更高。第 3 级辅导语言对将使用插件的辅导数据。

### 增量更新

初始同步后，后续运行只会翻译**已更改或新增**的键：

```bash
# Only keys that changed since last sync
npx i18n-rosetta sync
```

锁定文件 (`.i18n-rosetta.lock`) 会跟踪已翻译的内容，因此你永远不会重复翻译稳定的内容。

## 第 6 步：审核质量

检查所有语言对的状态：

```bash
npx i18n-rosetta status
```

这将输出一个表格，显示每个语言对的方法、模型、质量级别，以及是否有可用的辅导数据或基准分数。

## 第 7 步：CI 集成

将其添加到你的 GitHub Actions 工作流中，以便在每次推送时保持翻译更新：

```yaml title=".github/workflows/i18n-sync.yml"
name: Sync Translations
on:
  push:
    paths:
      - 'locales/en/**'

jobs:
  translate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20

      - run: npm ci

      - name: Sync translations
        run: npx i18n-rosetta sync
        env:
          OPENROUTER_API_KEY: ${{ secrets.OPENROUTER_API_KEY }}
          GOOGLE_TRANSLATE_API_KEY: ${{ secrets.GOOGLE_TRANSLATE_API_KEY }}

      - name: Commit updated translations
        run: |
          git config user.name "github-actions[bot]"
          git config user.email "github-actions[bot]@users.noreply.github.com"
          git add locales/
          git diff --staged --quiet || git commit -m "chore(i18n): sync translations"
          git push
```

## 成本估算

对于一个包含 30 种语言、500 个源键的项目：

| 级别 | 语言 | 方法 | 预估成本 |
|------|-----------|--------|-----------------|
| 第 1 级（5 种语言） | ja, ko, zh, de, pt | GPT-4o | 约 $2.50/全量同步 |
| 第 2 级（18 种语言） | it, nl, pl 等 | Google Translate | 约 $0.90/全量同步 |
| 第 3 级（4 种语言） | crk, oj, mi, haw | GPT-4o-mini 辅导 | 约 $0.40/全量同步 |
| **总计** | **30 种语言** | **混合** | **约 $3.80/全量同步** |

增量同步（5–20 个更改的键）的成本仅为全量同步的一小部分。

## 另请参阅

- [翻译方法](/docs/guides/translation-methods) — 每种翻译方法的工作原理及使用时机
- [插件规范](/docs/reference/plugin-spec) — 为你的任何第 3 级语言创建辅导数据
- [CI/CD 指南](/docs/guides/ci-cd) — 高级 CI 模式，包括 PR 预览构建
- [质量关卡](/docs/concepts/quality-gate) — Rosetta 如何在写入前验证每条翻译
- [支持的语言](/docs/reference/supported-languages) — 语言代码和方法兼容性的完整列表
- [支持低资源语言](https://mtevalarena.org/docs/community/low-resource-languages) — 为缺乏广泛 MT 覆盖的语言添加辅导数据