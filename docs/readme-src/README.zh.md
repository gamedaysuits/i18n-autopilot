# i18n-rosetta

[![npm version](https://img.shields.io/npm/v/i18n-rosetta.svg)](https://www.npmjs.com/package/i18n-rosetta)
[![CI](https://github.com/gamedaysuits/i18n-rosetta/actions/workflows/ci.yml/badge.svg)](https://github.com/gamedaysuits/i18n-rosetta/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

🌐 **README 翻译** — *当然是由 Rosetta 翻译的：*
[Français](docs/README.fr.md) · [Deutsch](docs/README.de.md) · [Español](docs/README.es.md) · [Português](docs/README.pt.md) · [Nederlands](docs/README.nl.md) · [日本語](docs/README.ja.md) · [한국어](docs/README.ko.md) · [简体中文](docs/README.zh.md) · [ไทย](docs/README.th.md) · [Tiếng Việt](docs/README.vi.md) · [Filipino](docs/README.fil.md) · [العربية](docs/README.ar.md)

使用一个命令翻译您的语言环境文件：

```bash
npx i18n-rosetta sync
```

Rosetta 会自动检测您的语言环境文件、其格式和目标语言。它会翻译缺失的键，跳过已完成的部分，并写入结果。就是这样。

## 为什么不自己编写脚本？

您可以编写一个快速脚本，遍历您的英文键并调用 Google Translate。大多数开发人员都是这样做的——大约需要 30 行代码。以下是它会失败的原因：

- **无变更检测。** 当您更新一个英文字符串时，翻译会永远过时。Rosetta 使用 SHA-256 哈希跟踪每个源值，并且只重新翻译已更改的内容。
- **无批处理。** 每个键一个 API 调用意味着 200 个键 = 200 次往返。Rosetta 会智能地进行批处理（可配置，LLM 默认为 30 个键/批次，Google 默认为 128 个）。
- **无质量门。** 机器翻译会产生幻觉、回显源文本或输出错误的脚本。Rosetta 在写入之前验证每个翻译——错误的脚本、长度膨胀和源回显都会被捕获并拒绝。
- **无格式感知。** 硬编码为 JSON？Rosetta 支持 JSON、TOML、YAML 和 Hugo Markdown（前置元数据 + 正文）并自动检测。
- **无安全性。** Rosetta 可防止原型污染、通过精心设计的语言环境代码进行路径遍历以及 Markdown 翻译期间的代码块损坏。

Rosetta 是该脚本的生产版本。

## 快速入门

```bash
npm install --save-dev i18n-rosetta
```

### 获取 API 密钥

Rosetta 需要一个翻译后端。选择一个：

| 提供商 | 密钥 | 最适合 |
|----------|-----|----------|
| **OpenRouter** (推荐) | `OPENROUTER_API_KEY` | 内容丰富的项目、Markdown、200+ 模型 |
| **OpenAI** | `OPENAI_API_KEY` | 直接访问 GPT-4o |
| **Anthropic** | `ANTHROPIC_API_KEY` | 直接访问 Claude |
| **Gemini** | `GEMINI_API_KEY` | 提供免费套餐 |
| **DeepL** | `DEEPL_API_KEY` | 欧洲语言，支持词汇表 |
| **Google Translate** | `GOOGLE_TRANSLATE_API_KEY` | 130+ 语言，高吞吐量 |

**最快启动**（免费）：在 [aistudio.google.com](https://aistudio.google.com/apikey) 注册以获取免费的 Gemini 密钥：

```bash
export GEMINI_API_KEY=AI...
npx i18n-rosetta sync --method gemini
```

**OpenRouter** (200+ 模型)：在 [openrouter.ai](https://openrouter.ai) 注册，然后：

```bash
export OPENROUTER_API_KEY=sk-or-v1-...
npx i18n-rosetta sync
```

**Google Translate** 替代方案（仅限键值对——无 Markdown 感知）：

```bash
export GOOGLE_TRANSLATE_API_KEY=...
npx i18n-rosetta sync --method google-translate
```

> **注意**：如果只设置了 `GOOGLE_TRANSLATE_API_KEY`，rosetta 会自动切换到 Google Translate。无需更改配置。直接使用 REST API——无需 SDK、无需服务账户、无需 `pip install`。只需密钥。

就是这样。如需更多控制，请创建配置文件：

```bash
npx i18n-rosetta init                        # guided wizard — walks you through registers, methods, and content
npx i18n-rosetta init --yes --langs fr,de,ja  # quick setup with specific languages and default registers
```

每种语言都带有**语域预设**——针对其语言系统（法语的 vouvoiement、德语的 Siezen、日语的 です/ます、韩语的 해요체）调整的预构建语气/正式度指令。初始化向导允许您浏览和选择预设，或传递 `--yes` 以接受默认值。

### 非英语源

如果您的源语言不是英语：

```bash
i18n-rosetta sync --source fr                      # CLI flag
```

或在您的配置中永久设置：

```json
{ "inputLocale": "fr" }
```

## 功能介绍

您负责 i18n 框架（next-intl、i18next、Hugo）。Rosetta 负责翻译文件。

- **多格式** — JSON、TOML、YAML 和 Hugo Markdown（前置元数据 + 正文）
- **增量式** — 只翻译已更改的内容（SHA-256 哈希跟踪）
- **质量门控** — 验证每个翻译：捕获幻觉、错误脚本输出、源回显和长度膨胀
- **内容感知** — LLM 方法在 Markdown 翻译期间保护代码块、短代码、链接和插值变量
- **管道工具** — `lint`、`audit`、`integrity`、`seo` 用于 CI 门控
- **零依赖** — 仅限 Node.js 内置模块。无 SDK，无原生模块。需要 Node 20+

## 超越 Google Translate

快速入门让您可以使用 LLM 或 Google Translate 运行。但 Google Translate 支持约 130 种语言。世界上有超过 7,000 种语言。

**Rosetta 的核心思想：翻译方法可以针对每种语言对进行配置。** 对法语使用 Google Translate，对平原克里语使用带有形态学指导的 LLM，对盖丘亚语使用社区托管的 API——所有这些都在同一个项目中，都使用相同的 CLI。

```json
{
  "version": 3,
  "pairs": {
    "en:fr": { "method": "google-translate" },
    "en:ja": { "method": "llm" },
    "en:crk": { "methodPlugin": "crk-coached-v1" }
  }
}
```

如果您能找出如何翻译一对语言的方法——通过提示工程、社区词典、FST 管道或微调模型——rosetta 允许您将该方法打包为插件，并与所有其他内容一起部署。

> 源于将一个生产网站翻译成平原克里语，而那里没有现成的 API。这种按对架构并非理论上的——它的存在是因为一个项目需要 Google Translate 来翻译法语，以及一个经过指导的 FST 管道来翻译一种土著语言，它们在同一个同步命令中并行运行。

配套的 [MT Eval Harness](https://github.com/gamedaysuits/gds-mt-eval-harness) 允许您对翻译方法进行基准测试和比较，然后将有效方法导出为 rosetta 插件。任何会说两种语言的人都可以开发、测试和共享翻译方法——无需专有平台。

### 选择您的方法

Rosetta 支持 10 种翻译方法。每种语言对都可以使用不同的方法。

**LLM 提供商** — 最适合质量、Markdown 感知、指导兼容：

| 方法 | 密钥 | 功能 |
|--------|-----|-------------|
| `llm` (默认) | `OPENROUTER_API_KEY` | 通过 OpenRouter 的 LLM — 200+ 模型，自动路由 |
| `llm-coached` | `OPENROUTER_API_KEY` | LLM + 语法规则、词典、样式注释 |
| `openai` | `OPENAI_API_KEY` | 直接 OpenAI API (gpt-4o, gpt-4o-mini) |
| `anthropic` | `ANTHROPIC_API_KEY` | 直接 Anthropic API (Claude Sonnet, Haiku, Opus) |
| `gemini` | `GEMINI_API_KEY` | 直接 Google Gemini API (Flash, Pro) — 提供免费套餐 |

**传统机器翻译** — 最适合速度、成本和高吞吐量键值对：

| 方法 | 密钥 | 功能 |
|--------|-----|-------------|
| `google-translate` | `GOOGLE_TRANSLATE_API_KEY` | Google Cloud Translation API v2 (130+ 语言) |
| `deepl` | `DEEPL_API_KEY` | DeepL API，支持词汇表 (30+ 语言) |
| `microsoft-translator` | `MICROSOFT_TRANSLATOR_API_KEY` | Azure Cognitive Services Translator (100+ 语言) |
| `libretranslate` | *(自托管)* | 自托管 LibreTranslate (AGPL, 免费) |

**基础设施** — 用于自定义或社区托管的端点：

| 方法 | 密钥 | 功能 |
|--------|-----|-------------|
| `api` | *(每个提供商)* | 任何 REST 端点的轻量级 HTTP 客户端 |

```bash
# Force a specific method for one run
i18n-rosetta sync --method deepl

# Or configure per pair
```

```json
{
  "pairs": {
    "en:fr": { "method": "deepl" },
    "en:ja": { "method": "openai", "model": "gpt-4o" },
    "en:crk": { "methodPlugin": "crk-coached-v1" }
  }
}
```

> **注意**：传统的机器翻译方法（Google Translate、DeepL、Microsoft Translator、LibreTranslate）能很好地处理键值对，但不能安全地翻译 Markdown 内容。对于内容丰富的项目，建议使用 LLM 方法——它们明确保护代码块、短代码和插值变量。

## 插件

插件是针对特定语言对的预打包翻译方案。它们是 JSON 清单——而不是代码——告诉 rosetta 使用哪种方法、使用什么设置以及已进行基准测试的质量。

```bash
i18n-rosetta plugin install ./french-formal-v1/    # install from directory
i18n-rosetta plugin list                           # see installed plugins
i18n-rosetta plugin remove french-formal-v1        # uninstall
i18n-rosetta status                                # shows quality tiers + benchmarks
```

有关清单格式，请参阅 [docs/METHOD_PLUGIN_SPEC.md](https://github.com/gamedaysuits/i18n-rosetta/blob/main/docs/METHOD_PLUGIN_SPEC.md)。

## 命令

| 命令 | 用途 |
|---------|---------|
| `init` | 交互式设置向导（或 `--yes` 用于快速默认设置） |
| `sync` | 翻译并同步所有语言环境文件 |
| `watch` | 文件更改时自动同步 |
| `audit` | 标记不完整的语言环境（CI 门控） |
| `lint` | 在源代码中查找硬编码字符串 |
| `wrap` | 自动将硬编码字符串包装在 `t()` 调用中（带撤销功能） |
| `seo` | 生成 hreflang、sitemap.xml 或 JSON-LD 模式 |
| `integrity` | 检查占位符损坏和编码问题 |
| `status` | 显示配对配置、方法、语域和质量等级 |
| `provenance` | 审计翻译资源许可 |
| `plugin` | 安装、删除或列出方法插件 |

运行 `i18n-rosetta <command> --help` 获取任何命令的详细帮助。

完整参考：[docs/CLI_REFERENCE.md](https://github.com/gamedaysuits/i18n-rosetta/blob/main/docs/CLI_REFERENCE.md)

## 配置

创建 `i18n-rosetta.config.json` 或运行 `i18n-rosetta init`：

```json
{
  "version": 3,
  "inputLocale": "en",
  "localesDir": "./locales",
  "model": "google/gemini-3.5-flash",
  "pairs": {
    "en:fr": { "qualityTier": "high" },
    "en:ja": { "method": "google-translate" }
  }
}
```

| 选项 | 默认值 | 描述 |
|--------|---------|-------------|
| `inputLocale` | `"en"` | 源语言代码 |
| `localesDir` | `"./locales"` | 语言环境文件路径 |
| `contentDir` | `null` | Hugo 内容目录（启用 Markdown 翻译） |
| `format` | `"auto"` | 文件格式：`json`、`toml`、`yaml` 或 `auto` |
| `model` | `"google/gemini-3.5-flash"` | 默认 OpenRouter 模型 |
| `defaultMethod` | `"llm"` | 默认翻译方法（被 `--method` 标志覆盖） |
| `batchSize` | `30` | 每个翻译批次的键数 |
| `pairs` | `{}` | 每对方法、模型和质量覆盖 |

**按语言覆盖**：每种语言都有一个 [语言卡](docs/planning/LANGUAGE_CARD_SPEC.md)，其中包含针对其正式度系统调整的预设语域。使用预设键作为简写，或编写自定义语域文本：

```json
{
  "languages": {
    "fr": "casual-tu",
    "ko": "formal-hapsyo",
    "crk": {
      "name": "Plains Cree",
      "register": "SRO syllabics with grammatical precision.",
      "model": "google/gemini-2.5-pro",
      "batchSize": 5,
      "maxRetries": 5,
      "script": "cans"
    }
  }
}
```

**零配置模式**：没有配置文件？Rosetta 会自动从您的项目中检测语言环境文件、格式和目标语言。

语言值可以是预设键（例如 `"casual-tu"`）、自定义语域文本或对象（完全控制）。`pairs` 中的对级别覆盖优先于语言级别设置。运行 `npx i18n-rosetta init` 浏览每种语言的可用预设。

框架设置指南：[docs/INTEGRATION_GUIDES.md](https://github.com/gamedaysuits/i18n-rosetta/blob/main/docs/INTEGRATION_GUIDES.md)

## 强化

- **指数退避** — 429/5xx 错误时进行 3 次重试并带抖动
- **30 秒请求超时** — AbortController 防止挂起
- **响应验证** — 只接受已发送进行翻译的键
- **质量门控** — 捕获幻觉循环、错误脚本输出、长度膨胀和源回显
- **重试级联** — JSON 解析失败时，重试批处理 → 半批处理 → 单个键（通过 `maxRetries` 限制预算）
- **提示缓存** — 系统/用户消息分离支持提供商级别的缓存，降低跨批次的令牌成本
- **原型污染防护** — 阻止 `__proto__`、`constructor`、`prototype`
- **路径限制** — 文件写入验证以确保在配置的目录内
- **块保护** — 内容翻译期间保护代码块、短代码、HTML
- **显式回退** — 当 API 不可用时，`--fallback` 写入 `[EN]` 前缀的占位符（使用密钥重新同步以进行实际翻译）
- **部分成功** — 一个批次失败不会阻止其余批次

## 测试

```bash
npm test                         # all tests
npm run test:unit                # core sync pipeline
npm run test:redteam             # adversarial edge cases
npm run test:format              # TOML/YAML adapters
npm run test:content             # Markdown content parser
npm run test:hugo                # full Hugo E2E
npm run test:lint                # hardcoded string detection
npm run test:pairs               # pair graph resolution
npm run test:methods             # translation method suite
```

**零依赖。**

## 许可证

MIT