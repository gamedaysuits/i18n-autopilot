---
sidebar_position: 5
title: "内容翻译"
---
# 内容翻译 (Hugo Markdown)

Rosetta 翻译 Hugo Markdown 文件（包括 front matter 字段和正文内容），并全面保护代码块、shortcode 和结构化元素。

## 设置

在你的配置中设置 `contentDir` 以启用 Markdown 内容翻译：

```json title="i18n-rosetta.config.json"
{
  "version": 3,
  "inputLocale": "en",
  "localesDir": "./i18n",
  "contentDir": "./content"
}
```

```bash
npx i18n-rosetta sync    # translates both string files and content files
```

## 哪些内容会被翻译

### Front Matter

支持 YAML (`---`) 和 TOML (`+++`) 分隔符。默认情况下，以下字段会被翻译：

- `title`
- `description`
- `summary`
- `subtitle`
- `caption`
- `linkTitle`

所有其他字段（`date`、`draft`、`tags`、`weight`、`slug` 等）均保持原样。可以在你的配置中使用 `translatableFields` 进行自定义。

### 正文内容

完整的 Markdown 正文在翻译时会受到块保护——结构化元素在翻译前会使用 Unicode 标记占位符进行屏蔽，并在翻译后恢复。

## 块保护

以下元素在翻译过程中保持不变：

| 元素 | 示例 | 保护方式 |
|---------|---------|-----------|
| 代码块 | ``````` ```js ... ``` ``````` | 屏蔽整个块 |
| 行内代码 | `` `variable` `` | 屏蔽 |
| Hugo shortcode | `{{< figure >}}`, `{{% note %}}` | 屏蔽整个块 |
| 原生 HTML | `<div>`, `<table>` | 屏蔽 |
| 链接 (URL) | `[text](https://...)` | 保留 URL，翻译文本 |
| 插值 | `{{ .Count }}` | 屏蔽 |

## 文件名约定

遵循 Hugo 的按文件名翻译模式：

```
my-post.md      → my-post.fr.md
my-post.en.md   → my-post.fr.md  (strips source suffix)
```

## 跳过行为

现有的已翻译文件**绝不会被覆盖**。如果 `my-post.fr.md` 已经存在，则会跳过该文件。删除目标文件可强制重新翻译。

## 仅限 Markdown 的方法

:::warning Google Translate 与 Markdown
Google Translate **无法识别**代码块、shortcode 或插值变量。它会破坏结构化的 Markdown 内容。请使用 LLM 方法（`llm` 或 `llm-coached`）进行内容翻译——它们会显式屏蔽结构化元素。
:::

当内容翻译从 Google Translate 回退到 LLM 方法时，rosetta 会记录一条警告以解释原因。