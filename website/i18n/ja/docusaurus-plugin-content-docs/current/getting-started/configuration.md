---
sidebar_position: 3
title: "設定"
---
# 設定

Rosettaはゼロコンフィグで動作します。プロジェクトからロケールファイル、フォーマット、ターゲット言語を自動検出します。より詳細な制御を行うには、プロジェクトのルートに `i18n-rosetta.config.json` を作成するか、以下を実行します：

```bash
npx i18n-rosetta init
```

## 完全な設定リファレンス

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

:::note typegenはまだ実装されていません
`typegen` 設定ブロックは設定ローダーによって認識され保持されますが、TypeScriptの型生成はまだ実装されていません。これは計画中の機能のためのプレースホルダーです。これらの値を設定しても効果はありません。
:::


### フィールド

| フィールド | 型 | デフォルト | 説明 |
|-------|------|---------|-------------|
| `version` | `number` | `3` | 設定スキーマのバージョン。常に `3` です。 |
| `inputLocale` | `string` | `"en"` | ソース言語コード（BCP 47）。 |
| `localesDir` | `string` | `"./locales"` | ロケールファイルへのパス。Rosettaはこのディレクトリをスキャンします。 |
| `contentDir` | `string` | `null` | Hugoのコンテンツディレクトリ。Markdown本文の翻訳を有効にします。 |
| `translatableFields` | `string[]` | `null` | コンテンツ翻訳用のデフォルトの翻訳可能なフロントマターフィールドを上書きします。`null` の場合は組み込みのデフォルト（`title`、`description`、`summary`）を使用します。 |
| `format` | `string` | `"auto"` | ファイルフォーマット：`json`、`toml`、`yaml`、または `auto`（拡張子から検出）。 |
| `model` | `string` | `"google/gemini-3.5-flash"` | LLMメソッドのデフォルトモデル。フォーマットはメソッドに依存します：OpenRouterは `provider/model` を使用し（例：`google/gemini-3.5-flash`）、直接のプロバイダーはそのままの名前を使用します（例：`gpt-4o`、`gemini-2.5-flash`）。 |
| `defaultMethod` | `string` | `"llm"` | デフォルトの翻訳メソッド：`llm`、`llm-coached`、`google-translate`、`deepl`、`microsoft-translator`、`libretranslate`、`openai`、`anthropic`、`gemini`、`api`。`--method` CLIフラグによって上書きされます。 |
| `batchSize` | `number` | `30` | 翻訳バッチあたりのキー数。大きいほどAPI呼び出しは減りますが、プロンプトは大きくなります。 |
| `concurrency` | `number` | `12` | コンテンツ（Markdown/MDX）翻訳の最大並列API呼び出し数。`--concurrency` CLIフラグによって上書きされます。 |
| `fallbackPrefix` | `string` | `"[EN] "` | 未翻訳のフォールバック値に追加されるプレフィックス。不完全な翻訳を検出するために `audit` で使用されます。 |
| `apiKeyEnvVar` | `string` | `"OPENROUTER_API_KEY"` | APIキーの環境変数名。カスタム環境変数名を使用する場合に上書きします。 |
| `baseUrl` | `string` | `""` | SEO成果物（hreflang、サイトマップ、JSON-LD）生成用のベースURL。 |
| `pairs` | `object` | `{}` | ペアごとのメソッド、モデル、品質の上書き。[ペア設定](#pair-configuration)を参照してください。 |
| `languages` | `object` | `{}` | 言語ごとの上書き。[言語設定](#language-configuration)を参照してください。 |
| `lint.srcDir` | `string` | `null` | lintスキャン用のソースディレクトリ。`null` = フレームワークから自動検出。 |
| `lint.ignore` | `string[]` | `["node_modules", ...]` | lintから除外するGlobパターン。 |
| `lint.minLength` | `number` | `2` | ハードコードとしてフラグを立てる最小文字列長。 |
| `seo.urlPattern` | `string` | `"/:locale/:path"` | hreflangタグ生成用のURLパターンテンプレート。 |
| `seo.pages` | `string[]` | `null` | SEO用の明示的なページリスト。`null` = ロケールキーから自動検出。 |
| `typegen.output` | `string` | `null` | 生成されたTypeScript型の出力パス。`null` = 無効。 |
| `typegen.autoGenerate` | `boolean` | `false` | 各同期後に型を自動再生成します。 |

## ペア設定

各ソース→ターゲットのペアは独立して設定できます：

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

### ペアフィールド

| フィールド | 型 | 説明 |
|-------|------|-------------|
| `method` | `string` | 翻訳メソッド：`llm`、`llm-coached`、`google-translate`、`deepl`、`microsoft-translator`、`libretranslate`、`openai`、`anthropic`、`gemini`、`api` |
| `methodPlugin` | `string` | インストール済みプラグインの名前（`.rosetta/methods/` から） |
| `model` | `string` | このペアのデフォルトモデルを上書きします |
| `endpoint` | `string` | リモートAPIエンドポイントURL。`method` が `api` の場合に必須です。 |
| `qualityTier` | `string` | 表示ティア：`standard`、`high`、`research`、`verified` |

## 言語設定

言語は3つのフォーマットを受け付けます：

### コードの配列（最もシンプル）

```json
{
  "languages": ["fr", "de", "ja"]
}
```

各言語は、組み込みのレジスターテーブルからデフォルトのレジスター（文体）を取得します。デフォルトがない言語には `"Professional register."` が適用されます。

### レジスター文字列を持つオブジェクト

値には、言語カードの**プリセットキー**、またはカスタムのレジスターテキストを指定できます：

```json
{
  "languages": {
    "fr": "casual-tu",
    "ko": "formal-hapsyo",
    "ja": "Custom: Polite Japanese for a gaming app."
  }
}
```

Rosettaは、文字列が言語カードのプリセットキーと一致するかどうかを確認します。一致する場合、カードの完全なレジスタープロンプトが使用されます。一致しない場合は、文字列がそのまま使用されます。利用可能なプリセットについては、[サポートされている言語](/docs/reference/supported-languages#language-cards)を参照してください。

### 完全な設定を持つオブジェクト

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

同じブロック内で省略形と完全なオブジェクトを混在させることができます。


### 言語フィールド

| フィールド | 型 | 説明 |
|-------|------|-------------|
| `register` | `string` | スタイル/トーンの指示。**プリセットキー**（例：`casual-tu`、`formal-hapsyo`）またはカスタムテキストを指定できます。[言語カード](/docs/reference/supported-languages#language-cards)を参照してください。 |
| `name` | `string` | 人間が読める言語名（ステータス表示用） |
| `model` | `string` | デフォルトモデルを上書きします |
| `batchSize` | `number` | デフォルトのバッチサイズを上書きします |
| `maxRetries` | `number` | 失敗したバッチの最大再試行回数（デフォルト：3） |
| `script` | `string` | ISO 15924 スクリプトコード。品質ゲートでのスクリプト検証をトリガーします。 |

:::info 継承チェーン
設定は以下の順序で解決されます（最初に見つかったものが優先されます）：

**ペアレベル** → **言語レベル** → **グローバル設定** → **デフォルト**

例えば、`pairs["en:fr"]` で `model` が設定されている場合、言語レベルとグローバルの両方の `model` の値を上書きします。
:::

## 英語以外のソース

ソース言語が英語でない場合：

```bash
# CLI flag (one-time)
npx i18n-rosetta sync --source fr
```

```json title="i18n-rosetta.config.json (permanent)"
{
  "inputLocale": "fr"
}
```

## ロックファイル

Rosettaは、翻訳されたソース値のSHA-256ハッシュを追跡するために `.i18n-rosetta.lock` を作成します。すべての開発者が同じ翻訳ベースラインを共有できるように、**このファイルをコミットしてください**。

ソース値が変更されると、ハッシュが一致しなくなり、Rosettaは次回の同期時にそのキーを再翻訳します。

## `.rosettaignore`

`lint` のスキャンからファイルを除外するには、プロジェクトのルートに `.rosettaignore` を作成します。`.gitignore` のように、Globパターンを使用します：

```text title=".rosettaignore"
src/components/legacy/**
src/utils/constants.js
**/*.test.js
```

## `.rosetta/` ディレクトリ

Rosettaは内部状態を保持するために、プロジェクトのルートに `.rosetta/` ディレクトリを作成します。これはプロジェクトのソースではなくローカルの最適化であるため、通常は**これを `.gitignore` に追加する**必要があります：

```gitignore
.rosetta/
```

| ファイル | 目的 | コミット |
|------|---------|--------|
| `tm.json` | 翻訳メモリキャッシュ — ソーステキスト + ロケール + メソッドをキーとして、以前の翻訳を保存します | いいえ（ローカルキャッシュ） |
| `xliff/*.xliff` | プロの翻訳者がレビューするためのXLIFFエクスポートファイル | いいえ（一時的） |
| `methods/` | インストールされたメソッドプラグインのマニフェスト | はい（共有設定） |
| `backups/` | ラップ前のバックアップ（`wrap --undo` によって作成） | いいえ（セーフティネット） |

`tm.json` の詳細と、それがどのようにAPIコストを節約するかについては、[翻訳メモリ](/docs/concepts/translation-memory)を参照してください。

---

## プログラマティックAPI

ビルドスクリプトやカスタム統合の場合は、パッケージから直接インポートします：

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

### 利用可能なエクスポート

| エクスポート | 機能 |
|--------|-------------|
| `TranslationMethod` | すべてのメソッドの基底クラス |
| `LLMMethod` | LLMメソッド（OpenRouter）の基底クラス |
| `DirectLLMMethod` | 直接のLLMプロバイダー（OpenAI、Anthropic、Gemini）の基底クラス |
| `OpenAIMethod`, `AnthropicMethod`, `GeminiMethod` | 直接のLLMプロバイダークラス |
| `DeepLMethod`, `MicrosoftTranslatorMethod`, `LibreTranslateMethod` | 従来の機械翻訳（MT）クラス |
| `GoogleTranslateMethod` | Google Cloud Translation |
| `LLMCoachedMethod` | コーチング付きLLM（OpenRouter + コーチングデータ） |
| `APIMethod` | リモートAPIクライアント |
| `runSync`, `runContentSync` | 完全な同期パイプライン |
| `resolveConfig`, `resolvePairs` | 設定の解決 |
| `validateTranslations` | 品質ゲート |
| `loadCoachingData`, `findDictionaryMatches` | コーチングユーティリティ |

### カスタムプロバイダーの拡張

`DirectLLMMethod` を拡張して、約40行で新しいLLMプロバイダーを追加できます：

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

翻訳、コーチング、再試行ループ、モデル検証、品質ティア、セットアップのヘルプを無料で利用できます。HTTPリクエストの形式のみがプロバイダー固有です。生の `fetch()` を使用する非LLMアダプターの場合は、独自の再試行ループを記述する代わりに、`lib/methods/fetch-with-retry.js` の共有 `fetchWithRetry()` ヘルパーを使用してください。

---

## 関連項目

- [CLIリファレンス](/docs/reference/cli) — すべてのコマンドとフラグ
- [翻訳メソッド](/docs/guides/translation-methods) — メソッドの選択と組み合わせ
- [翻訳メモリ](/docs/concepts/translation-memory) — キャッシュとコスト削減
- [プロの翻訳者との連携](/docs/guides/professional-translators) — XLIFFワークフロー
- [プラグイン仕様](/docs/reference/plugin-spec) — メソッドプラグインのマニフェストフォーマット
- [アーキテクチャ](/docs/concepts/architecture) — 各コンポーネントの連携
- [サポートされている言語](/docs/reference/supported-languages) — 組み込みの言語サポート
- [同期の仕組み](/docs/concepts/how-sync-works) — 翻訳パイプライン