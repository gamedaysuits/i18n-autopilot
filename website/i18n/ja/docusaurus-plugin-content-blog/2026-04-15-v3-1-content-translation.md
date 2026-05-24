---
slug: v3-1-content-translation
title: "v3.1.0: Hugo Markdown コンテンツ翻訳"
authors: [curtisforbes]
tags: [release]
date: 2026-04-15
---
v3.1.0では、HugoのMarkdownコンテンツの完全な翻訳機能が追加されました。フロントマターのフィールドと本文の両方に対応し、コードブロック、ショートコード、補間変数を自動的に保護します。

<!-- truncate -->

## コンテンツアウェア翻訳

Markdownを翻訳する際、生のファイルをそのままLLMに送信することはできません。コードブロックが翻訳されてしまったり、ショートコードが破損したり、Hugoのテンプレート変数が崩れたりします。

Rosetta v3.1.0は、**Unicode sentinel shielding**によってこの問題を解決します。

1. 翻訳前に、構造化されたブロック（コードフェンス、ショートコード、インラインコード、HTML）が一意のセンチネルトークンに置き換えられます。
2. LLMは翻訳可能なテキストのみを受け取ります。
3. 翻訳後、センチネルが元のコンテンツに復元されます。

LLMがコードブロックを見ることはありません。そのため、コードブロックを破損させることはありません。

## フロントマターのサポート

YAML（`---`）およびTOML（`+++`）の両方のフロントマター区切り文字がサポートされています。デフォルトでは、`title`、`description`、`summary`、`subtitle`、`caption`、および `linkTitle` が翻訳されます。その他のすべてのフィールド（date、draft、tags、weight）はそのまま保持されます。

## セットアップ

```json title="i18n-rosetta.config.json"
{
  "contentDir": "./content"
}
```

```bash
npx i18n-rosetta sync   # now translates content too
```

詳細は[コンテンツ翻訳ガイド](/docs/guides/content-translation)をご覧ください。