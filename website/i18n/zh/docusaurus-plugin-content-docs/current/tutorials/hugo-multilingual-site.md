---
sidebar_position: 3
title: "Hugo 多语言网站"
description: "操作指南：搭建完整的 Hugo 多语言网站，并使用 i18n-rosetta 处理字符串文件与 Markdown 内容翻译。"
---
# 指南：Hugo 多语言网站

使用 i18n-rosetta 设置 Hugo 的多语言系统，处理 JSON 字符串文件和 Markdown 内容翻译。这涵盖了从项目设置到生产环境部署的完整工作流。

**你将构建的内容：** 一个包含英语、法语和日语的 Hugo 网站——通过语言环境文件进行字符串翻译，通过 Markdown 处理进行内容翻译。

---

## 项目结构

Rosetta 使用 Hugo 的**基于文件名**的翻译模式。翻译后的文件放置在与源文件相同的目录中，并在文件名中添加语言后缀（例如 `about.fr.md`）：

```
my-hugo-site/
├── content/
│   └── en/
│       ├── _index.md
│       ├── _index.fr.md           ← rosetta generates
│       ├── _index.ja.md           ← rosetta generates
│       ├── about.md
│       ├── about.fr.md            ← rosetta generates
│       ├── about.ja.md            ← rosetta generates
│       └── blog/
│           ├── first-post.md
│           ├── first-post.fr.md   ← rosetta generates
│           └── first-post.ja.md   ← rosetta generates
├── i18n/
│   ├── en.json
│   ├── fr.json                    ← rosetta generates
│   └── ja.json                    ← rosetta generates
└── hugo.toml
```

:::note Hugo i18n 模式
Hugo 支持两种翻译策略：**基于文件名**（`about.fr.md` 与 `about.md` 同级）和**基于目录**（独立的 `content/fr/about.md` 树）。Rosetta 使用基于文件名的翻译，因为它的 `getTargetContentPath()` 功能通过在源文件名后附加语言后缀来生成目标路径。使用 rosetta 时，请确保你的 `hugo.toml` 配置为基于文件名的翻译。
:::

## 第 1 步：配置 Hugo

```toml title="hugo.toml"
defaultContentLanguage = 'en'

[languages]
  [languages.en]
    languageName = 'English'
    weight = 1
  [languages.fr]
    languageName = 'Français'
    weight = 2
  [languages.ja]
    languageName = '日本語'
    weight = 3
```

## 第 2 步：配置 Rosetta

Rosetta 需要配置两项内容：语言环境文件路径（用于 JSON 字符串）和内容目录（用于 Markdown）。

```json title="i18n-rosetta.config.json"
{
  "version": 3,
  "inputLocale": "en",
  "localesDir": "./i18n",
  "contentDir": "./content",
  "model": "google/gemini-3.5-flash",
  "pairs": {
    "en:fr": { "method": "llm" },
    "en:ja": { "method": "llm", "model": "openai/gpt-4o" }
  },
  "languages": {
    "fr": { "name": "French", "register": "Formal (vous-form)" },
    "ja": { "name": "Japanese", "register": "Polite/formal" }
  }
}
```

## 第 3 步：创建源内容

### 字符串翻译 (i18n/)

```json title="i18n/en.json"
{
  "nav": {
    "home": "Home",
    "about": "About",
    "blog": "Blog",
    "contact": "Contact"
  },
  "footer": {
    "copyright": "© 2026 My Company. All rights reserved.",
    "privacy": "Privacy Policy"
  }
}
```

### Markdown 内容 (content/en/)

```markdown title="content/en/about.md"
---
title: "About Us"
description: "Learn more about our team and mission"
date: 2026-01-15
---

We build software that helps businesses communicate across languages.

Our platform supports **real-time translation** for over 30 languages,
with specialized support for low-resource languages.

## Our Mission

Language should never be a barrier to understanding.

## The Team

{{< team-grid >}}
```

## 第 4 步：运行同步

```bash
npx i18n-rosetta sync
```

Rosetta 会处理这两种类型：

1. **字符串文件** (`i18n/en.json` → `i18n/fr.json`, `i18n/ja.json`)
2. **内容文件** (`content/en/about.md` → `content/en/about.fr.md`, `content/en/about.ja.md`)

### 内容翻译详情

在翻译 Markdown 时，rosetta 会自动：

- **屏蔽**代码块、简码 (`{{< ... >}}`)、行内代码和 HTML
- **翻译** front matter 字段 (`title`, `description`, `summary`)
- **保留**所有其他 front matter 字段 (`date`, `draft`, `weight`, `tags`)
- **还原**翻译后被屏蔽的区块

Hugo 简码 `{{< team-grid >}}` 会保持原样，不被翻译。

## 第 5 步：验证

```bash
# Preview the site
hugo server

# Check translation status
npx i18n-rosetta status
```

导航到 `localhost:1313/fr/` 和 `localhost:1313/ja/` 以检查翻译后的内容。

## 第 6 步：Hugo 语言切换器

在你的 Hugo 布局中添加一个语言切换器：

```html title="layouts/partials/language-switcher.html"
<nav class="language-switcher">
  {{ range $.Site.Home.AllTranslations }}
    <a href="{{ .Permalink }}"
       {{ if eq .Lang $.Site.Language.Lang }}class="active"{{ end }}>
      {{ .Language.LanguageName }}
    </a>
  {{ end }}
</nav>
```

## 保持内容同步

当你更新英语内容时，再次运行同步。Rosetta 只会重新翻译已更改的文件：

```bash
# Edit content/en/about.md, then:
npx i18n-rosetta sync
```

锁定文件会跟踪每个文件的内容哈希值，因此未更改的页面不会被重新翻译。

## 另请参阅

- **[内容翻译指南](/docs/guides/content-translation)** — 深入了解屏蔽、front matter 和边缘情况
- **[框架集成](/docs/guides/framework-integration)** — Next.js 和 React 设置
- **[CI/CD 指南](/docs/guides/ci-cd)** — 在推送到 `content/en/` 时自动同步
- **[翻译方法](/docs/guides/translation-methods)** — 比较 LLM、TM 和混合翻译策略
- **[支持的语言](/docs/reference/supported-languages)** — 支持的语言环境和语言代码的完整列表