# i18n-rosetta

[![npm version](https://img.shields.io/npm/v/i18n-rosetta.svg)](https://www.npmjs.com/package/i18n-rosetta)
[![CI](https://github.com/gamedaysuits/i18n-rosetta/actions/workflows/ci.yml/badge.svg)](https://github.com/gamedaysuits/i18n-rosetta/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

🌐 **READMEの翻訳** — *もちろんrosettaによって翻訳されました。*
[Français](docs/README.fr.md) · [Deutsch](docs/README.de.md) · [Español](docs/README.es.md) · [Português](docs/README.pt.md) · [Nederlands](docs/README.nl.md) · [日本語](docs/README.ja.md) · [한국어](docs/README.ko.md) · [简体中文](docs/README.zh.md) · [ไทย](docs/README.th.md) · [Tiếng Việt](docs/README.vi.md) · [Filipino](docs/README.fil.md) · [العربية](docs/README.ar.md)

たった1つのコマンドでロケールファイルを翻訳します。

```bash
npx i18n-rosetta sync
```

Rosettaはロケールファイル、その形式、およびターゲット言語を自動検出します。不足しているキーを翻訳し、すでに完了しているものはスキップし、結果を書き込みます。それだけです。

## なぜ自分でスクリプトを書かないのか？

英語のキーをループしてGoogle翻訳を呼び出す簡単なスクリプトを書くこともできます。ほとんどの開発者はそうします — 約30行で済みます。しかし、これには問題があります。

- **変更検出がない。** 英語の文字列を更新しても、翻訳は永久に古いままでです。Rosettaはすべてのソース値をSHA-256ハッシュで追跡し、変更されたものだけを再翻訳します。
- **バッチ処理がない。** キーごとに1回のAPI呼び出しでは、200キー = 200回の往復になります。Rosettaはインテリジェントにバッチ処理します（設定可能、LLMの場合はデフォルト30キー/バッチ、Googleの場合は128キー）。
- **品質ゲートがない。** 機械翻訳は幻覚を起こしたり、ソースをそのまま返したり、間違ったスクリプトで出力したりします。Rosettaは書き込む前にすべての翻訳を検証します — 間違ったスクリプト、長さの膨張、ソースのエコーは検出され、拒否されます。
- **フォーマット認識がない。** JSONにハードコードされていますか？RosettaはJSON、TOML、YAML、Hugo Markdown（フロントマター + ボディ）を自動検出で処理します。
- **安全性がない。** Rosettaはプロトタイプ汚染、細工されたロケールコードを介したパス横断、Markdown翻訳中のコードブロック破損から保護します。

Rosettaはそのスクリプトのプロダクション版です。

## クイックスタート

```bash
npm install --save-dev i18n-rosetta
```

### APIキーの取得

Rosettaには翻訳バックエンドが必要です。1つ選択してください。

| プロバイダー | キー | 最適な用途 |
|----------|-----|----------|
| **OpenRouter** (推奨) | `OPENROUTER_API_KEY` | コンテンツ量の多いプロジェクト、Markdown、200以上のモデル |
| **OpenAI** | `OPENAI_API_KEY` | GPT-4oへの直接アクセス |
| **Anthropic** | `ANTHROPIC_API_KEY` | Claudeへの直接アクセス |
| **Gemini** | `GEMINI_API_KEY` | 無料枠あり |
| **DeepL** | `DEEPL_API_KEY` | ヨーロッパ言語、用語集サポート |
| **Google Translate** | `GOOGLE_TRANSLATE_API_KEY` | 130以上の言語、大量処理 |

**最速の開始** (無料): [aistudio.google.com](https://aistudio.google.com/apikey)で無料のGeminiキーを登録します。

```bash
export GEMINI_API_KEY=AI...
npx i18n-rosetta sync --method gemini
```

**OpenRouter** (200以上のモデル): [openrouter.ai](https://openrouter.ai)で登録し、その後:

```bash
export OPENROUTER_API_KEY=sk-or-v1-...
npx i18n-rosetta sync
```

**Google Translate** の代替 (キーバリューペアのみ — Markdown認識なし):

```bash
export GOOGLE_TRANSLATE_API_KEY=...
npx i18n-rosetta sync --method google-translate
```

> **注**: `GOOGLE_TRANSLATE_API_KEY`のみが設定されている場合、rosettaは自動的にGoogle Translateに切り替わります。設定変更は不要です。REST APIを直接使用します — SDK、サービスアカウント、`pip install`は不要です。キーのみです。

以上です。より詳細な制御が必要な場合は、設定ファイルを作成してください。

```bash
npx i18n-rosetta init                        # guided wizard — walks you through registers, methods, and content
npx i18n-rosetta init --yes --langs fr,de,ja  # quick setup with specific languages and default registers
```

各言語には**レジスタープリセット**が付属しています — その言語システム（フランス語のvouvoiement、ドイツ語のSiezen、日本語のです/ます、韓国語の해요체）に合わせて調整された、事前に構築されたトーン/フォーマリティの指示です。initウィザードでは、プリセットを参照して選択するか、`--yes`を渡してデフォルトを受け入れることができます。

### 英語以外のソース言語

ソース言語が英語でない場合:

```bash
i18n-rosetta sync --source fr                      # CLI flag
```

または、設定ファイルに永続的に設定します。

```json
{ "inputLocale": "fr" }
```

## 機能

i18nフレームワーク（next-intl、i18next、Hugo）はあなたが担当します。Rosettaは翻訳ファイルを担当します。

- **マルチフォーマット** — JSON、TOML、YAML、Hugo Markdown（フロントマター + ボディ）、XLIFF 1.2
- **インクリメンタル** — 変更されたもののみを翻訳します（SHA-256ハッシュ追跡）
- **キャッシュ済み** — 翻訳メモリが以前の結果を保存します。変更されていないキーの同期を再実行してもコストはかかりません。
- **品質ゲート** — すべての翻訳を検証します。幻覚、間違ったスクリプト出力、ソースエコー、長さの膨張を検出します。
- **コンテンツ認識** — LLMメソッドはMarkdown翻訳中にコードブロック、ショートコード、リンク、補間変数を保護します。
- **パイプラインツール** — CIゲート用の`lint`、`audit`、`integrity`、`seo`
- **XLIFF相互運用** — 専門家によるCATツール（memoQ、SDL Trados、Phrase）でのレビュー用に翻訳をエクスポートし、それらをインポートし直します。
- **ゼロ依存関係** — Node.jsの組み込み機能のみ。SDKやネイティブモジュールはありません。Node 20+が必要です。

## Google翻訳を超えて

クイックスタートでは、LLMまたはGoogle翻訳を使用して実行できます。しかし、Google翻訳は約130の言語をサポートしています。7,000以上の言語が存在します。

**Rosettaの核となるアイデア：翻訳方法は言語ペアごとに設定可能です。** フランス語にはGoogle翻訳を、プレーンズクリー語には形態学的コーチング付きのLLMを、ケチュア語にはコミュニティホスト型APIを — すべて同じプロジェクトで、すべて同じCLIで利用できます。

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

プロンプトエンジニアリング、コミュニティ辞書、FSTパイプライン、またはファインチューニングされたモデルを通じて、言語ペアを翻訳する方法を見つけることができれば、rosettaはその方法をプラグインとしてパッケージ化し、他のすべてと一緒にデプロイできます。

> 市販のAPIが存在しないプレーンズクリー語へのプロダクションウェブサイトの翻訳から生まれました。ペアごとのアーキテクチャは理論的なものではありません — フランス語にはGoogle翻訳を、先住民族の言語にはコーチングされたFSTパイプラインを、同じ同期コマンドで並行して実行する必要があったプロジェクトがあったために存在します。

付属の[MT Eval Harness](https://github.com/gamedaysuits/gds-mt-eval-harness)を使用すると、翻訳アプローチをベンチマークおよび比較し、動作するメソッドをrosettaプラグインとしてエクスポートできます。両方の言語を話す人なら誰でも、独自のプラットフォームを必要とせずに翻訳メソッドを開発、テスト、共有できます。

### メソッドの選択

Rosettaは10の翻訳メソッドをサポートしています。各言語ペアは異なるメソッドを使用できます。

**LLMプロバイダー** — 品質、Markdown対応、コーチング互換性に最適です。

| メソッド | キー | 機能 |
|--------|-----|-------------|
| `llm` (デフォルト) | `OPENROUTER_API_KEY` | OpenRouter経由のLLM — 200以上のモデル、自動ルーティング |
| `llm-coached` | `OPENROUTER_API_KEY` | LLM + 文法ルール、辞書、スタイルノート |
| `openai` | `OPENAI_API_KEY` | 直接OpenAI API (gpt-4o, gpt-4o-mini) |
| `anthropic` | `ANTHROPIC_API_KEY` | 直接Anthropic API (Claude Sonnet, Haiku, Opus) |
| `gemini` | `GEMINI_API_KEY` | 直接Google Gemini API (Flash, Pro) — 無料枠あり |

**従来のMT** — 速度、コスト、大量のキーバリューペアに最適です。

| メソッド | キー | 機能 |
|--------|-----|-------------|
| `google-translate` | `GOOGLE_TRANSLATE_API_KEY` | Google Cloud Translation API v2 (130以上の言語) |
| `deepl` | `DEEPL_API_KEY` | 用語集サポート付きDeepL API (30以上の言語) |
| `microsoft-translator` | `MICROSOFT_TRANSLATOR_API_KEY` | Azure Cognitive Services Translator (100以上の言語) |
| `libretranslate` | *(自己ホスト型)* | 自己ホスト型LibreTranslate (AGPL, 無料) |

**インフラストラクチャ** — カスタムまたはコミュニティホスト型エンドポイント用:

| メソッド | キー | 機能 |
|--------|-----|-------------|
| `api` | *(プロバイダーごと)* | 任意のRESTエンドポイント用の軽量HTTPクライアント |

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

> **注**: 従来のMTメソッド（Google Translate、DeepL、Microsoft Translator、LibreTranslate）はキーバリューペアをうまく処理しますが、Markdownコンテンツを安全に翻訳することはできません。コンテンツ量の多いプロジェクトには、LLMメソッドが推奨されます — コードブロック、ショートコード、補間変数を明示的に保護します。

## プラグイン

プラグインは、特定の言語ペア用に事前にパッケージ化された翻訳レシピです。これらはJSONマニフェストであり、コードではありません。rosettaにどのメソッドをどのような設定で使用し、どのような品質がベンチマークされているかを伝えます。

```bash
i18n-rosetta plugin install ./french-formal-v1/    # install from directory
i18n-rosetta plugin list                           # see installed plugins
i18n-rosetta plugin remove french-formal-v1        # uninstall
i18n-rosetta status                                # shows quality tiers + benchmarks
```

マニフェスト形式については、[docs/METHOD_PLUGIN_SPEC.md](https://github.com/gamedaysuits/i18n-rosetta/blob/main/docs/METHOD_PLUGIN_SPEC.md)を参照してください。

## コマンド

| コマンド | 目的 |
|---------|---------|
| `init` | 対話型セットアップウィザード（または`--yes`でクイックデフォルト） |
| `sync` | すべてのロケールファイルを翻訳して同期する |
| `watch` | ファイル変更時に自動同期する |
| `audit` | 未完了のロケールにフラグを立てる（CIゲート） |
| `lint` | ソースコード内のハードコードされた文字列を検索する |
| `wrap` | ハードコードされた文字列を`t()`呼び出しで自動ラップする（元に戻す機能付き） |
| `seo` | hreflang、sitemap.xml、またはJSON-LDスキーマを生成する |
| `integrity` | プレースホルダーの破損、エンコーディング、ICU複数形の完全性をチェックする |
| `status` | ペア設定、メソッド、レジスター、品質ティアを表示する |
| `provenance` | 翻訳リソースのライセンスを監査する |
| `plugin` | メソッドプラグインをインストール、削除、または一覧表示する |
| `fonts` | PUAスクリプトコンバーター用のWebフォントをダウンロードする |
| `tm` | 翻訳メモリキャッシュを管理する（統計、クリア、ロケールごと） |
| `xliff` | 専門翻訳者レビュー用にXLIFF 1.2をエクスポート/インポートする |

任意のコマンドの詳細なヘルプについては、`i18n-rosetta <command> --help`を実行してください。

完全なリファレンス: [docs/CLI_REFERENCE.md](https://github.com/gamedaysuits/i18n-rosetta/blob/main/docs/CLI_REFERENCE.md)

## 設定

`i18n-rosetta.config.json`を作成するか、`i18n-rosetta init`を実行します。

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

| オプション | デフォルト | 説明 |
|--------|---------|-------------|
| `inputLocale` | `"en"` | ソース言語コード |
| `localesDir` | `"./locales"` | ロケールファイルへのパス |
| `contentDir` | `null` | Hugoコンテンツディレクトリ（Markdown翻訳を有効にする） |
| `format` | `"auto"` | ファイル形式: `json`、`toml`、`yaml`、または`auto` |
| `model` | `"google/gemini-3.5-flash"` | デフォルトのOpenRouterモデル |
| `defaultMethod` | `"llm"` | デフォルトの翻訳メソッド（`--method`フラグで上書きされる） |
| `batchSize` | `30` | 翻訳バッチあたりのキー数 |
| `pairs` | `{}` | ペアごとのメソッド、モデル、品質の上書き |

**言語ごとの上書き**: 各言語には[言語カード](docs/planning/LANGUAGE_CARD_SPEC.md)があります — レジスタープリセット、フォーマリティシステム、タイポグラフィルール、メソッドサポートフラグを含む50の厳選されたカードの1つです。カードは、大規模なパフォーマンスのために[2層アーキテクチャ](website/docs/concepts/architecture.md)（ランタイム + リファレンス）を使用します。`node scripts/generate-language-card.mjs <code>`で新しいカードを足場に構築します。プリセットキーを省略形として使用するか、カスタムレジスターテキストを記述します。

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

**ゼロコンフィグモード**: 設定ファイルがない場合、Rosettaはプロジェクトからロケールファイル、フォーマット、ターゲット言語を自動検出します。

言語の値は、プリセットキー（例: `"casual-tu"`）、カスタムレジスターテキスト、またはオブジェクト（完全な制御）にすることができます。`pairs`のペアレベルの上書きは、言語レベルの設定よりも優先されます。各言語で利用可能なプリセットを参照するには、`npx i18n-rosetta init`を実行します。

フレームワーク設定ガイド: [docs/INTEGRATION_GUIDES.md](https://github.com/gamedaysuits/i18n-rosetta/blob/main/docs/INTEGRATION_GUIDES.md)

## 堅牢化

- **指数関数的バックオフ** — 429/5xxエラー時にジッター付きで3回再試行
- **30秒のリクエストタイムアウト** — AbortControllerがハングアップを防ぐ
- **応答検証** — 翻訳のために送信されたキーのみを受け入れる
- **品質ゲート** — 幻覚ループ、間違ったスクリプト出力、長さの膨張、ソースエコーを検出
- **再試行カスケード** — JSON解析失敗時に、バッチ → ハーフバッチ → 個別キーの順で再試行（`maxRetries`で予算上限あり）
- **翻訳メモリ** — `.rosetta/tm.json`はソーステキスト + ロケール + メソッドでキー付けされた翻訳をキャッシュします。変更されていないキーは、後続の同期でキャッシュから提供され、冗長なAPI呼び出しを排除します。
- **プロンプトキャッシュ** — システム/ユーザーメッセージの分割により、プロバイダーレベルのキャッシュが可能になり、バッチ全体のトークンコストを削減します。
- **用語の強制** — コーチングされた翻訳は、LLMが応答した後、辞書用語と照合して検証されます。
- **プロトタイプ汚染ガード** — `__proto__`、`constructor`、`prototype`をブロック
- **パスの封じ込め** — ファイル書き込みは設定されたディレクトリ内に留まるように検証されます。
- **ブロック保護** — コンテンツ翻訳中にコードブロック、ショートコード、HTMLを保護
- **明示的なフォールバック** — APIが利用できない場合、`--fallback`は`[EN]`プレフィックス付きのプレースホルダーを書き込みます（実際の翻訳にはキーを使用して再同期します）。
- **部分的な成功** — 1つのバッチが失敗しても、残りの処理はブロックされません。

## テスト

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

**ゼロ依存関係。**

## ライセンス

MIT