---
sidebar_position: 3
title: "CI/CD"
---
# CI/CD 集成

在你的构建流水线中自动执行翻译。

## GitHub Actions：推送时同步

将翻译同步添加到你现有的构建流水线中：

```yaml title=".github/workflows/deploy.yml"
jobs:
  build:
    steps:
      - uses: actions/checkout@v4
      - run: npm ci
      - name: Sync translations
        env:
          OPENROUTER_API_KEY: ${{ secrets.OPENROUTER_API_KEY }}
        run: npx i18n-rosetta sync
      - run: npm run build
```

## GitHub Actions：定时同步

按计划运行翻译并自动提交：

```yaml title=".github/workflows/i18n-sync.yml"
name: Sync translations
on:
  schedule:
    - cron: '0 6 * * *'
  workflow_dispatch:

jobs:
  sync:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm ci
      - name: Sync translations
        env:
          OPENROUTER_API_KEY: ${{ secrets.OPENROUTER_API_KEY }}
        run: npx i18n-rosetta sync
      - name: Commit updated translations
        run: |
          git config user.name "i18n-rosetta"
          git config user.email "bot@example.com"
          git add i18n/ content/ locales/ messages/
          git diff --staged --quiet || git commit -m "chore: sync translations"
          git push
```

## Google Translate 方法

如果使用内置的 Google Translate 方法而不是 OpenRouter：

```yaml
- name: Sync translations
  env:
    GOOGLE_TRANSLATE_API_KEY: ${{ secrets.GOOGLE_TRANSLATE_API_KEY }}
  run: npx i18n-rosetta sync
```

## 直接 LLM 提供商

如果直接使用 `openai`、`anthropic` 或 `gemini` 方法：

```yaml
# OpenAI
- name: Sync translations
  env:
    OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
  run: npx i18n-rosetta sync --method openai

# Anthropic
- name: Sync translations
  env:
    ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
  run: npx i18n-rosetta sync --method anthropic

# Gemini (free tier available)
- name: Sync translations
  env:
    GEMINI_API_KEY: ${{ secrets.GEMINI_API_KEY }}
  run: npx i18n-rosetta sync --method gemini
```

## DeepL

```yaml
- name: Sync translations
  env:
    DEEPL_API_KEY: ${{ secrets.DEEPL_API_KEY }}
  run: npx i18n-rosetta sync --method deepl
```

## 远程翻译 API

如果使用远程翻译端点（例如托管的翻译服务）：

```yaml
- name: Sync translations
  env:
    ROSETTA_API_KEY: ${{ secrets.ROSETTA_API_KEY }}
  run: npx i18n-rosetta sync
```

## 三层 CI 流水线

为了获得最大的 i18n 覆盖率，请使用这三个工具为你的流水线把关：

```yaml
jobs:
  i18n:
    steps:
      - uses: actions/checkout@v4
      - run: npm ci

      # 1. Catch hardcoded strings before they ship
      - run: npx i18n-rosetta lint

      # 2. Translate missing keys
      - run: npx i18n-rosetta sync
        env:
          OPENROUTER_API_KEY: ${{ secrets.OPENROUTER_API_KEY }}

      # 3. Fail if any locale is incomplete
      - run: npx i18n-rosetta audit
```

| 层级 | 命令 | 时间 | 目的 |
|-------|---------|------|---------|
| **Lint** | `lint` | 提交前 | 阻止包含硬编码字符串的提交 |
| **Sync** | `sync` | 提交后 / CI | 翻译缺失和更改的键 |
| **Audit** | `audit` | 构建步骤 | 如果任何语言环境不完整，则使部署失败 |

:::tip CI 中的翻译记忆库
如果你的 CI 运行器具有持久化工作区（或缓存了 `.rosetta/`），翻译记忆库将自动生效——后续的同步只会翻译源文本实际发生更改的键。对于临时运行器，请考虑在运行之间缓存 `.rosetta/tm.json`：

```yaml
- uses: actions/cache@v4
  with:
    path: .rosetta/tm.json
    key: rosetta-tm-${{ hashFiles('locales/en.json') }}
    restore-keys: rosetta-tm-
```
:::

---

## 另请参阅

- [CLI 参考](/docs/reference/cli) — 完整的命令参考
- [同步工作原理](/docs/concepts/how-sync-works) — 了解增量同步
- [翻译记忆库](/docs/concepts/translation-memory) — 缓存与节省成本
- [翻译方法](/docs/guides/translation-methods) — 每对语言的方法选择
- [质量门禁](/docs/concepts/quality-gate) — 翻译失败时会发生什么
- [配置](/docs/getting-started/configuration) — 配置参考