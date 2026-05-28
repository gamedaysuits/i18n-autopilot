---
sidebar_position: 9
title: "Agent 指南：使用 i18n-rosetta"
description: "AI agent 如何安装、配置和运行 i18n-rosetta 以翻译本地化文件。"
---
# 智能体指南：使用 i18n-rosetta

i18n-rosetta 是一个只需一条命令即可翻译应用本地化文件的 CLI 工具。本指南专为希望快速从零开始完成本地化文件翻译的 AI 智能体（或与 AI 智能体协作的开发者）编写。

:::tip 已经很熟悉了？
如果你只需要命令，请直接查看 [CLI 参考](/docs/reference/cli)。如果你想构建并基准测试某种翻译方法，请参阅 [Arena 智能体指南](https://mtevalarena.org/docs/getting-started/agent-guide)。
:::

---

## 环境设置

```bash
# No global install needed — npx runs it directly
npx i18n-rosetta sync
```

**要求：**
- Node.js 18+
- 翻译提供商的 API 密钥

**API 密钥设置** — 根据你使用的翻译方法，rosetta 至少需要一个密钥：

```bash
# Option 1: export (session only)
export OPENROUTER_API_KEY="sk-or-..."        # for llm / llm-coached methods
export GOOGLE_TRANSLATE_API_KEY="AIza..."    # for google-translate method

# Option 2: .env file in your project root (persistent, gitignored)
echo 'OPENROUTER_API_KEY=sk-or-...' > .env
```

Rosetta 会自动读取 `.env`。你可以在 [openrouter.ai/keys](https://openrouter.ai/keys) 获取 OpenRouter 密钥。

---

## 首次同步

Rosetta 会自动检测你的本地化文件、文件格式（JSON、TOML、YAML、PO）以及目标语言：

```bash
npx i18n-rosetta sync
```

**执行过程：**
1. 加载 `i18n-rosetta.config.json`（或自动检测设置）
2. 扫描源本地化文件，展平嵌套键
3. 与 `.i18n-rosetta.lock`（先前翻译值的 SHA-256 哈希）进行比对
4. 检查 `.rosetta/tm.json` 中的缓存翻译（翻译记忆库）
5. 通过配置的方法仅翻译**已更改、缺失或过期的键**
6. 对每条翻译运行质量关卡（5 项检查）
7. 将通过检查的翻译写入目标本地化文件
8. 更新锁文件和 TM 缓存

在修改一个键后的典型重新运行中，第 4 步会从缓存提供 142 个键，第 5 步仅翻译 1 个键。这就是后续同步既快又省钱的原因。

---

## 配置

在项目根目录创建 `i18n-rosetta.config.json`：

```json
{
  "inputLocale": "en",
  "pairs": {
    "en-fr": { "method": "llm-coached" },
    "en-ja": { "method": "google-translate" },
    "en-crk": { "method": "api", "endpoint": "http://localhost:3000/translate" }
  }
}
```

关键字段：

| 字段 | 用途 | 默认值 |
|-------|---------|---------|
| `inputLocale` | 源语言 | `en` |
| `pairs` | 源语言→目标语言的映射及方法配置 | (必填) |
| `localesDir` | 本地化文件所在位置 | (自动检测) |
| `model` | 用于 `llm`/`llm-coached` 方法的 LLM 模型 | `google/gemini-2.5-flash` |
| `batchSize` | 每次 API 调用的键数量 | 80 (LLM), 128 (Google) |
| `jsonConcurrency` | JSON 键的并行本地化翻译数 | 50 |
| `contentConcurrency` | 内容翻译的并行 API 调用数 | 12 |

完整参考：[配置](/docs/getting-started/configuration)

---

## 翻译方法

| 方法 | 适用场景 | 成本 | 需要 API 密钥 |
|--------|------------|------|---------------|
| **`llm`** | 通用，适合资源丰富的语言 | 按 Token 计费（取决于模型） | `OPENROUTER_API_KEY` |
| **`llm-coached`** | 当你有目标语言的语法规则/词典时 | 按 Token 计费 + 辅导上下文 | `OPENROUTER_API_KEY` |
| **`google-translate`** | 谷歌翻译效果较好的高资源语言 | $20/百万字符 | `GOOGLE_TRANSLATE_API_KEY` |
| **`api`** | 托管在 HTTP 端点后的自定义流水线 | 由服务器决定 | 无（端点处理身份验证） |
| **`plugin`** | 本地安装的预打包方法 | 视情况而定 | 视情况而定 |

详情：[翻译方法](/docs/guides/translation-methods)

---

## 辅导数据

对于 `llm-coached` 语言对，辅导数据通过明确的语言学知识来引导 LLM。创建一个辅导文件：

```json title="coaching/fr.json"
{
  "grammar_rules": [
    "Use formal register (vous) for all UI text",
    "Adjectives agree in gender and number with the noun"
  ],
  "dictionary": {
    "dashboard": "tableau de bord",
    "settings": "paramètres"
  },
  "style_notes": "Prefer active voice. Avoid anglicisms."
}
```

在你的语言对配置中引用它：

```json
"en-fr": { "method": "llm-coached", "coachingFile": "coaching/fr.json" }
```

质量关卡会验证词典术语是否确实出现在输出中——违规情况将记录为 `[TERM]` 警告。

详情：[辅导数据](/docs/concepts/coaching-data)

---

## 质量关卡

每条翻译在写入磁盘前都会经过五项自动检查：

| 检查项 | 捕获内容 | 示例 |
|-------|----------------|---------|
| **空/空白** | 模型未返回任何内容 | `""` |
| **源文回显** | 模型原样返回了英文输入 | 日语返回 `"Welcome"` |
| **幻觉循环** | 重复的三元组 (trigrams) | `"Qo' Qo' Qo' Qo'"` |
| **长度膨胀** | 输出比源文长 4 倍以上 | 10 字符源文 → 50 字符输出 |
| **书写系统合规** | 本地化语言的书写系统错误 | 阿拉伯语本地化返回拉丁文本 |

失败项会以 `[GATE]` 前缀记录。没有静默回退——如果翻译失败，它会被报告，而不是被悄悄接受。

详情：[质量关卡](/docs/concepts/quality-gate)

---

## 翻译记忆库

Rosetta 将翻译缓存到 `.rosetta/tm.json` 中，以 源文本 + 本地化语言 + 方法 作为键。在后续同步中，未更改的键将从缓存中提供——无需 API 调用，没有成本。

```
[TM] 142 key(s) served from cache
Translating 3 key(s) to French (llm)... [OK]
```

要在单次运行中绕过缓存：`npx i18n-rosetta sync --no-tm`

详情：[翻译记忆库](/docs/concepts/translation-memory)

---

## 生成的文件

Rosetta 会在你的项目中创建几个文件。了解它们的作用，以免意外删除或提交错误的文件：

| 文件 | 用途 | Git 提交？ |
|------|---------|------|
| `.i18n-rosetta.lock` | 已翻译源值的 SHA-256 哈希（用于更改检测） | **是** — 请提交此文件 |
| `.i18n-rosetta-content.lock` | 同上，但用于 Markdown/MDX 内容文件 | **是** — 请提交此文件 |
| `.rosetta/tm.json` | 翻译记忆库缓存 | **是** — 请提交此文件（为团队节省 API 成本） |
| `.rosetta/coaching/` | 辅导数据目录 | **是** — 这是你的语言学知识 |
| `i18n-rosetta.config.json` | 项目配置 | **是** — 请提交此文件 |

---

## 常见模式

**翻译单个语言对：**
```bash
npx i18n-rosetta sync --pair en-fr
```

**翻译所有配置的语言对：**
```bash
npx i18n-rosetta sync
```
Rosetta 会并行翻译所有本地化语言。借助 TM 缓存，只有更改的键才会调用 API。

**内容模式（适用于 Docusaurus、Hugo 等的 Markdown/MDX）：**
```bash
npx i18n-rosetta sync --content
```
与本地化 JSON 一起翻译文档、博客文章和内容文件。使用并行并发（默认：12 个同时的 API 调用）。可通过 `--content-concurrency` 进行调整。

**试运行（预览但不写入）：**
```bash
npx i18n-rosetta sync --dry-run
```

**强制重新翻译特定键：**
```bash
npx i18n-rosetta sync --force-keys "hero.title,nav.about"
```

**强制重新翻译所有内容文件：**
```bash
npx i18n-rosetta sync --force-content
```

**检查翻译状态：**
```bash
npx i18n-rosetta status
```
显示每个语言对的覆盖率、质量层级和插件信息。

**审计未翻译的回退项：**
```bash
npx i18n-rosetta audit
```
列出所有需要翻译的 `[EN]` 回退值。

---

## 故障排除

| 问题 | 解决方法 |
|---------|-----|
| `OPENROUTER_API_KEY not set` | 导出密钥或将其添加到项目根目录的 `.env` 中 |
| `No locale files found` | 在配置中设置 `localesDir`，或确保你的本地化文件符合标准命名（`en.json`，`fr.json`） |
| `[GATE] Script compliance failed` | 目标本地化语言得到了拉丁文本而不是预期的书写系统 — 尝试使用其他模型或添加辅导数据 |
| `[GATE] Source echo` | 模型原样返回了英文 — 添加辅导数据或更换模型通常可以解决此问题 |
| 所有翻译均被缓存 | 使用 `--no-tm` 运行以绕过缓存，或使用 `--force-keys` 针对特定键运行 |
| 锁文件冲突 | `.i18n-rosetta.lock` 使用 SHA-256 哈希 — 解决合并冲突时保留任一版本都是安全的，然后重新运行同步即可 |

---

## 下一步

- [快速入门](/docs/getting-started/quick-start) — 完整的入门演练
- [CLI 参考](/docs/reference/cli) — 所有命令和标志
- [工作原理](/docs/how-it-works) — 同步流水线解析
- [评估工具桥接](/docs/guides/bridge) — rosetta 如何连接到 Arena
- **想构建你自己的翻译方法？** 请参阅 [Arena 智能体指南](https://mtevalarena.org/docs/getting-started/agent-guide) — 构建方法，证明其有效性，赢取奖品。