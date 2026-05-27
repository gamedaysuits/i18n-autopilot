---
sidebar_position: 3
title: "配置"
---
# 配置

Rosetta 支持零配置运行——它会自动从你的项目中检测语言环境文件、格式和目标语言。如需更多控制权，请在项目根目录创建 `i18n-rosetta.config.json`，或运行：

```bash
npx i18n-rosetta init
```

## 完整配置参考

```json title="i18n-rosetta.config.json"
{
  "version": 3,
  "inputLocale": "en",
  "localesDir": "./locales",
  "contentDir": null,
  "translatableFields": null,
  "format": "auto",
  "model": "google/gemini-3.5-flash",
  "defaultMethod": "llm",
  "batchSize": 30,
  "concurrency": 12,
  "fallbackPrefix": "[EN] ",
  "apiKeyEnvVar": "OPENROUTER_API_KEY",
  "baseUrl": "",
  "pairs": {},
  "languages": {},
  "lint": {
    "srcDir": null,
    "ignore": ["node_modules", ".next", "dist"],
    "minLength": 2
  },
  "seo": {
    "urlPattern": "/:locale/:path",
    "pages": null
  },
  "typegen": {
    "output": null,
    "autoGenerate": false
  }
}
```

:::note 尚未实现 typegen
配置加载器会识别并保留 `typegen` 配置块，但尚未实现 TypeScript 类型生成。这是为计划中的功能预留的占位符。设置这些值不会产生任何效果。
:::


### 字段

| 字段 | 类型 | 默认值 | 描述 |
|-------|------|---------|-------------|
| `version` | `number` | `3` | 配置架构版本。始终为 `3`。 |
| `inputLocale` | `string` | `"en"` | 源语言代码 (BCP 47)。 |
| `localesDir` | `string` | `"./locales"` | 语言环境文件路径。Rosetta 会扫描此目录。 |
| `contentDir` | `string` | `null` | Hugo 内容目录。启用 Markdown 正文翻译。 |
| `translatableFields` | `string[]` | `null` | 覆盖内容翻译的默认可翻译 frontmatter 字段。`null` 使用内置默认值（`title`、`description`、`summary`）。 |
| `format` | `string` | `"auto"` | 文件格式：`json`、`toml`、`yaml` 或 `auto`（从扩展名检测）。 |
| `model` | `string` | `"google/gemini-3.5-flash"` | LLM 方法的默认模型。格式取决于方法：OpenRouter 使用 `provider/model`（例如 `google/gemini-3.5-flash`）；直接提供商使用纯名称（例如 `gpt-4o`、`gemini-2.5-flash`）。 |
| `defaultMethod` | `string` | `"llm"` | 默认翻译方法：`llm`、`llm-coached`、`google-translate`、`deepl`、`microsoft-translator`、`libretranslate`、`openai`、`anthropic`、`gemini`、`api`。可被 `--method` CLI 标志覆盖。 |
| `batchSize` | `number` | `30` | 每个翻译批次的键数。值越大 = API 调用越少，但提示词（prompts）越大。 |
| `concurrency` | `number` | `12` | 内容（Markdown/MDX）翻译的最大并行 API 调用数。可被 `--concurrency` CLI 标志覆盖。 |
| `fallbackPrefix` | `string` | `"[EN] "` | 添加到未翻译回退值的前缀。供 `audit` 用于检测不完整的翻译。 |
| `apiKeyEnvVar` | `string` | `"OPENROUTER_API_KEY"` | API 密钥的环境变量名称。可覆盖以使用自定义环境变量名称。 |
| `baseUrl` | `string` | `""` | SEO 产物生成（hreflang、站点地图、JSON-LD）的基础 URL。 |
| `pairs` | `object` | `{}` | 针对每个语言对的方法、模型和质量覆盖设置。参见[语言对配置](#pair-configuration)。 |
| `languages` | `object` | `{}` | 针对每种语言的覆盖设置。参见[语言配置](#language-configuration)。 |
| `lint.srcDir` | `string` | `null` | 用于 lint 扫描的源目录。`null` = 从框架自动检测。 |
| `lint.ignore` | `string[]` | `["node_modules", ...]` | 要从 lint 中排除的 Glob 模式。 |
| `lint.minLength` | `number` | `2` | 标记为硬编码的最小字符串长度。 |
| `seo.urlPattern` | `string` | `"/:locale/:path"` | 用于 hreflang 标签生成的 URL 模式模板。 |
| `seo.pages` | `string[]` | `null` | 用于 SEO 的显式页面列表。`null` = 从语言环境键自动检测。 |
| `typegen.output` | `string` | `null` | 生成的 TypeScript 类型的输出路径。`null` = 禁用。 |
| `typegen.autoGenerate` | `boolean` | `false` | 每次同步后自动重新生成类型。 |

## 语言对配置

每个 源→目标 语言对都可以独立配置：

```json
{
  "pairs": {
    "en:fr": {
      "method": "google-translate",
      "qualityTier": "high"
    },
    "en:ja": {
      "method": "llm",
      "model": "google/gemini-2.5-pro"
    },
    "en:crk": {
      "methodPlugin": "crk-coached-v1"
    }
  }
}
```

### 语言对字段

| 字段 | 类型 | 描述 |
|-------|------|-------------|
| `method` | `string` | 翻译方法：`llm`、`llm-coached`、`google-translate`、`deepl`、`microsoft-translator`、`libretranslate`、`openai`、`anthropic`、`gemini`、`api` |
| `methodPlugin` | `string` | 已安装插件的名称（来自 `.rosetta/methods/`） |
| `model` | `string` | 覆盖此语言对的默认模型 |
| `endpoint` | `string` | 远程 API 端点 URL。当 `method` 为 `api` 时必填。 |
| `qualityTier` | `string` | 显示层级：`standard`、`high`、`research`、`verified` |

## 语言配置

语言配置支持三种格式：

### 代码数组（最简单）

```json
{
  "languages": ["fr", "de", "ja"]
}
```

每种语言都会从内置的语域（register）表中获取其默认语域。没有默认值的语言将使用 `"Professional register."`。

### 包含语域字符串的对象

该值可以是语言卡片中的**预设键**，或者是自定义的语域文本：

```json
{
  "languages": {
    "fr": "casual-tu",
    "ko": "formal-hapsyo",
    "ja": "Custom: Polite Japanese for a gaming app."
  }
}
```

Rosetta 会检查该字符串是否与语言卡片中的预设键匹配。如果匹配，则使用卡片中完整的语域提示词。如果不匹配，则按原样使用该字符串。有关可用的预设，请参阅[支持的语言](/docs/reference/supported-languages#language-cards)。

### 包含完整配置的对象

```json
{
  "languages": {
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

你可以在同一个配置块中混合使用简写和完整对象。


### 语言字段

| 字段 | 类型 | 描述 |
|-------|------|-------------|
| `register` | `string` | 风格/语气说明。可以是**预设键**（例如 `casual-tu`、`formal-hapsyo`）或自定义文本。参见[语言卡片](/docs/reference/supported-languages#language-cards)。 |
| `name` | `string` | 人类可读的语言名称（用于状态显示） |
| `model` | `string` | 覆盖默认模型 |
| `batchSize` | `number` | 覆盖默认批次大小 |
| `maxRetries` | `number` | 失败批次的最大重试次数（默认值：3） |
| `script` | `string` | ISO 15924 脚本代码。在质量门禁中触发脚本验证。 |

:::info 继承链
设置按以下顺序解析（最先匹配的生效）：

**语言对级别** → **语言级别** → **全局配置** → **默认值**

例如，如果 `pairs["en:fr"]` 设置了 `model`，它将覆盖语言级别和全局的 `model` 值。
:::

## 非英语源语言

如果你的源语言不是英语：

```bash
# CLI flag (one-time)
npx i18n-rosetta sync --source fr
```

```json title="i18n-rosetta.config.json (permanent)"
{
  "inputLocale": "fr"
}
```

## 锁定文件

Rosetta 会创建 `.i18n-rosetta.lock` 来跟踪已翻译源值的 SHA-256 哈希值。**请提交此文件**，以便所有开发者共享相同的翻译基线。

当源值发生更改时，哈希值将不再匹配，Rosetta 会在下次同步时重新翻译该键。

## `.rosettaignore`

在项目根目录创建 `.rosettaignore` 以将文件排除在 `lint` 扫描之外。使用 glob 模式，类似于 `.gitignore`：

```text title=".rosettaignore"
src/components/legacy/**
src/utils/constants.js
**/*.test.js
```

## `.rosetta/` 目录

Rosetta 会在项目根目录创建一个 `.rosetta/` 目录用于存放内部状态。通常你应该**将其添加到 `.gitignore`** 中——这是本地优化，而不是项目源码：

```gitignore
.rosetta/
```

| 文件 | 用途 | 是否提交？ |
|------|---------|--------|
| `tm.json` | 翻译记忆库缓存——存储以前的翻译，以源文本 + 语言环境 + 方法为键 | 否（本地缓存） |
| `xliff/*.xliff` | 供专业译员审校的 XLIFF 导出文件 | 否（临时文件） |
| `methods/` | 已安装的方法插件清单 | 是（共享配置） |
| `backups/` | wrap 前的备份（由 `wrap --undo` 创建） | 否（安全网） |

有关 `tm.json` 及其如何节省 API 成本的详细信息，请参阅[翻译记忆库](/docs/concepts/translation-memory)。

---

## 编程式 API

对于构建脚本和自定义集成，可以直接从包中导入：

```javascript
import { GeminiMethod, runSync, resolveConfig } from 'i18n-rosetta';

// Use a method class directly
const gemini = new GeminiMethod();
const result = await gemini.translate(
  ['greeting', 'farewell'],
  { greeting: 'Hello', farewell: 'Goodbye' },
  { target: 'fr', name: 'French', register: 'formal', model: 'gemini-2.5-flash' },
  { cwd: process.cwd() }
);
// result = { greeting: 'Bonjour', farewell: 'Au revoir' }
```

### 可用导出

| 导出 | 作用 |
|--------|-------------|
| `TranslationMethod` | 所有方法的基类 |
| `LLMMethod` | LLM 方法的基类 (OpenRouter) |
| `DirectLLMMethod` | 直接 LLM 提供商的基类 (OpenAI、Anthropic、Gemini) |
| `OpenAIMethod`、`AnthropicMethod`、`GeminiMethod` | 直接 LLM 提供商类 |
| `DeepLMethod`、`MicrosoftTranslatorMethod`、`LibreTranslateMethod` | 传统机器翻译 (MT) 类 |
| `GoogleTranslateMethod` | Google Cloud Translation |
| `LLMCoachedMethod` | 辅导型 LLM (OpenRouter + 辅导数据) |
| `APIMethod` | 远程 API 客户端 |
| `runSync`、`runContentSync` | 完整同步流水线 |
| `resolveConfig`、`resolvePairs` | 配置解析 |
| `validateTranslations` | 质量门禁 |
| `loadCoachingData`、`findDictionaryMatches` | 辅导实用工具 |

### 自定义提供商扩展

扩展 `DirectLLMMethod`，只需约 40 行代码即可添加新的 LLM 提供商：

```javascript
import { DirectLLMMethod } from 'i18n-rosetta';

class MistralMethod extends DirectLLMMethod {
  constructor(options) {
    super(options);
    this.name = 'mistral';
  }
  _getApiKeyEnvVar()     { return 'MISTRAL_API_KEY'; }
  _getApiKeyOptionsKey() { return 'mistralApiKey'; }
  _getDefaultModel()     { return 'mistral-large-latest'; }
  _getProviderLabel()    { return 'Mistral'; }

  _buildApiRequest({ prompt, systemMessage, apiKey, model, temperature }) {
    return {
      url: 'https://api.mistral.ai/v1/chat/completions',
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: {
        model,
        messages: [
          ...(systemMessage ? [{ role: 'system', content: systemMessage }] : []),
          { role: 'user', content: prompt },
        ],
        temperature,
      },
    };
  }

  _extractResponseText(json) {
    return json.choices?.[0]?.message?.content;
  }

  // Optional but recommended: provider-specific setup help when translation fails
  getSetupHelp() {
    if (!process.env.MISTRAL_API_KEY) {
      return [
        '',
        '  ┌─ Missing API Key ─────────────────────────────────────────────┐',
        '  │ Mistral requires an API key from https://console.mistral.ai   │',
        '  │ Run: export MISTRAL_API_KEY=...                               │',
        '  └────────────────────────────────────────────────────────────────┘',
      ];
    }
    return ['        API key is set but translation failed. Check your Mistral dashboard.'];
  }
}
```

你可以免费获得翻译、辅导、重试循环、模型验证、质量层级和设置帮助等功能。只有 HTTP 请求的结构是特定于提供商的。对于使用原生 `fetch()` 的非 LLM 适配器，请使用 `lib/methods/fetch-with-retry.js` 中共享的 `fetchWithRetry()` 辅助函数，而无需编写自己的重试循环。

---

## 另请参阅

- [CLI 参考](/docs/reference/cli) —— 所有命令和标志
- [翻译方法](/docs/guides/translation-methods) —— 选择和混合使用方法
- [翻译记忆库](/docs/concepts/translation-memory) —— 缓存和节省成本
- [与专业译员合作](/docs/guides/professional-translators) —— XLIFF 工作流
- [插件规范](/docs/reference/plugin-spec) —— 方法插件清单格式
- [架构](/docs/concepts/architecture) —— 各个组件如何连接
- [支持的语言](/docs/reference/supported-languages) —— 内置语言支持
- [同步工作原理](/docs/concepts/how-sync-works) —— 翻译流水线