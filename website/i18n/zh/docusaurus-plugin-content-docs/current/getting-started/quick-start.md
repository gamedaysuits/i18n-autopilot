---
sidebar_position: 2
title: "快速入门"
---
# 快速开始

在 60 秒内翻译你的第一个语言文件。

## 1. 设置你的语言文件

创建一个源语言文件。Rosetta 支持 JSON、TOML 和 YAML：

```json title="locales/en.json"
{
  "hero": {
    "title": "Welcome to our platform",
    "subtitle": "Build something amazing"
  },
  "nav": {
    "home": "Home",
    "about": "About",
    "contact": "Contact"
  }
}
```

## 2. 设置你的 API 密钥

选择一个提供商并设置密钥：

```bash
# Option A: OpenRouter (200+ models, recommended)
export OPENROUTER_API_KEY=sk-or-v1-...

# Option B: Gemini (free tier — zero cost to start)
export GEMINI_API_KEY=AI...
```

在 [aistudio.google.com/apikey](https://aistudio.google.com/apikey) 获取免费的 Gemini 密钥。在 [openrouter.ai](https://openrouter.ai) 获取 OpenRouter 密钥。

## 3. 运行同步

```bash
npx i18n-rosetta sync
```

:::tip 使用 Gemini？
如果你选择了选项 B (Gemini)，请添加 `--method gemini`：
```bash
npx i18n-rosetta sync --method gemini
```
:::

Rosetta 将会：
1. 自动检测 `locales/en.json` 作为源文件
2. 查找（或提示输入）目标语言
3. 翻译所有键值
4. 写入 `locales/fr.json`、`locales/ja.json` 等文件
5. 创建 `.i18n-rosetta.lock` 以跟踪已翻译的内容

## 4. 检查结果

```bash
cat locales/fr.json
```

```json
{
  "hero": {
    "title": "Bienvenue sur notre plateforme",
    "subtitle": "Construisez quelque chose d'incroyable"
  },
  "nav": {
    "home": "Accueil",
    "about": "À propos",
    "contact": "Contact"
  }
}
```

## 接下来会发生什么？

当你更改源字符串时，rosetta 会通过 SHA-256 哈希跟踪检测到更改，并在下次同步时仅重新翻译该键值：

```json title="locales/en.json (updated)"
{
  "hero": {
    "title": "Welcome to Acme Platform",  // ← changed
    "subtitle": "Build something amazing"  // ← unchanged, skipped
  }
}
```

```bash
npx i18n-rosetta sync
# Only "hero.title" is re-translated across all locales
```

## 可选：创建配置文件

为了获得更多控制权，请生成一个配置文件：

```bash
npx i18n-rosetta init                         # guided wizard
npx i18n-rosetta init --yes --langs fr,de,ja  # quick setup with specific targets
```

向导会引导你了解每种语言的**语域预设 (register presets)** —— 这是针对其语言系统调整的预设语气/正式程度指令。法语有 T-V 预设（vouvoiement 与 tutoiement），韩语有敬语级别（해요체 与 합쇼체 与 해체），日语有敬语选项（です/ます 与 丁寧語）。

或者使用预设键值手动创建配置：

```json title="i18n-rosetta.config.json"
{
  "version": 3,
  "inputLocale": "en",
  "localesDir": "./locales",
  "languages": {
    "fr": "casual-tu",
    "ko": "polite-haeyo",
    "ja": "polite"
  },
  "model": "google/gemini-2.5-flash"
}
```

运行 `npx i18n-rosetta init` 以浏览每种语言的可用预设。

## 可选：监听模式

当源文件更改时自动翻译：

```bash
npx i18n-rosetta watch
```

## 后续步骤

- **[配置](/docs/getting-started/configuration)** — 完整的配置参考
- **[翻译方法](/docs/guides/translation-methods)** — 选择合适的方法
- **[框架集成](/docs/guides/framework-integration)** — Hugo、next-intl、react-i18next
- **[CI/CD](/docs/guides/ci-cd)** — 在流水线中自动执行翻译