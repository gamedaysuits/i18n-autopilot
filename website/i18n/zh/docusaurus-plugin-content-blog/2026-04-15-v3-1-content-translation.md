---
slug: v3-1-content-translation
title: "v3.1.0: Hugo Markdown 内容翻译"
authors: [curtisforbes]
tags: [release]
date: 2026-04-15
---
v3.1.0 新增了完整的 Hugo Markdown 内容翻译功能——包括 front matter 字段和正文内容，并自动保护代码块、shortcodes 和插值变量。

<!-- truncate -->

## 内容感知翻译

翻译 Markdown 时，你不能直接将原始文件发送给 LLM。否则代码块会被错误翻译，shortcodes 会被破坏，Hugo 模板变量也会变得混乱。

Rosetta v3.1.0 通过 **Unicode sentinel shielding** 解决了这一问题：

1. 在翻译之前，结构化区块（代码块、shortcodes、内联代码、HTML）会被替换为唯一的 sentinel tokens
2. LLM 仅接收可翻译的文本
3. 翻译完成后，sentinels 会被还原为原始内容

LLM 根本不会接触到你的代码块，因此也就无法破坏它们。

## Front Matter 支持

支持 YAML (`---`) 和 TOML (`+++`) front matter 分隔符。默认情况下，`title`、`description`、`summary`、`subtitle`、`caption` 和 `linkTitle` 会被翻译。所有其他字段（date、draft、tags、weight）都将保留。

## 配置

```json title="i18n-rosetta.config.json"
{
  "contentDir": "./content"
}
```

```bash
npx i18n-rosetta sync   # now translates content too
```

详情请参阅 [内容翻译指南](/docs/guides/content-translation)。