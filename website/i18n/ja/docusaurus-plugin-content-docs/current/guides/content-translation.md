---
sidebar_position: 5
title: "コンテンツ翻訳"
---
# コンテンツ翻訳 (Hugo Markdown)

Rosettaは、コードブロック、ショートコード、構造化要素を完全に保護しながら、Hugo Markdownファイル（フロントマターのフィールドと本文コンテンツの両方）を翻訳します。

## セットアップ

Markdownコンテンツの翻訳を有効にするには、設定で `contentDir` を設定します。

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

## 翻訳される内容

### フロントマター

YAML (`---`) と TOML (`+++`) の両方のデリミタがサポートされています。デフォルトでは、以下のフィールドが翻訳されます。

- `title`
- `description`
- `summary`
- `subtitle`
- `caption`
- `linkTitle`

その他のすべてのフィールド (`date`、`draft`、`tags`、`weight`、`slug` など) はそのまま保持されます。設定の `translatableFields` でカスタマイズできます。

### 本文コンテンツ

Markdownの本文全体はブロック保護を伴って翻訳されます。構造化要素は翻訳前にUnicodeのセンチネルプレースホルダーを使用して保護され、翻訳後に復元されます。

## ブロック保護

以下の要素は翻訳されずにそのまま通過します。

| 要素 | 例 | 保護 |
|---------|---------|-----------|
| コードブロック | ``````` ```js ... ``` ``````` | ブロック全体を保護 |
| インラインコード | `` `variable` `` | 保護 |
| Hugoショートコード | `{{< figure >}}`, `{{% note %}}` | ブロック全体を保護 |
| 生のHTML | `<div>`, `<table>` | 保護 |
| リンク (URL) | `[text](https://...)` | URLは保持、テキストは翻訳 |
| 補間 | `{{ .Count }}` | 保護 |

## ファイル名の規則

Hugoのファイル名による翻訳パターンに従います。

```
my-post.md      → my-post.fr.md
my-post.en.md   → my-post.fr.md  (strips source suffix)
```

## スキップの動作

既存の翻訳済みファイルが**上書きされることはありません**。`my-post.fr.md` がすでに存在する場合はスキップされます。強制的に再翻訳するには、対象のファイルを削除してください。

## Markdown専用のメソッド

:::warning Google TranslateとMarkdown
Google Translateは、コードブロック、ショートコード、補間変数を**認識しません**。そのため、構造化されたMarkdownコンテンツが破損してしまいます。コンテンツの翻訳にはLLMメソッド (`llm` または `llm-coached`) を使用してください。これらは構造化要素を明示的に保護します。
:::

コンテンツの翻訳がGoogle TranslateからLLMメソッドにフォールバックした場合、rosettaはその理由を説明する警告をログに記録します。