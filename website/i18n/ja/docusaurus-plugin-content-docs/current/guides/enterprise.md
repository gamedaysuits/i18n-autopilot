---
sidebar_position: 7
title: "エンタープライズ向け"
description: "リーダーボードで実証された手法、カスタムプラグイン、ワンコマンドでのデプロイを活用して、組織が翻訳を標準化する方法をご紹介します。"
---
# エンタープライズ向け i18n-rosetta

チームでは定期的にコンテンツの翻訳を行っていることでしょう。ロケールファイルの山、CIパイプライン、そしておそらく誰かが手動でGoogle Translateを実行し、結果をJSONにコピーして、うまくいくことを祈るようなプロセスが存在しているはずです。あるいは、TMSプラットフォームに料金を支払い、特定のベンダーの翻訳エンジンに縛られているかもしれません。

もっと良い方法があります。

## 提案

1. **言語ごとに最適なメソッドを選択** — ベンダーのデフォルトに依存しません
2. **1つのコマンドでデプロイ** — `npx i18n-rosetta sync` がすべてのロケール、すべてのフォーマットを毎回翻訳します
3. **コードを変更せずにメソッドを切り替え** — 移行作業ではなく、設定の変更だけで済みます
4. **パイプラインを自社で管理** — ベンダーロックイン、月額制のダッシュボード、アカウント作成は不要です

```json title="i18n-rosetta.config.json"
{
  "version": 3,
  "pairs": {
    "en:fr": { "method": "deepl" },
    "en:ja": { "method": "llm", "model": "google/gemini-2.5-pro" },
    "en:de": { "method": "google-translate" },
    "en:ko": { "method": "llm", "register": "polite-haeyo" },
    "en:crk": { "methodPlugin": "crk-coached-v3" }
  }
}
```

フランス語にはDeepLを使用します（チームがヨーロッパ言語の流暢さを評価しているため）。日本語には最先端のLLMを、ドイツ語にはGoogle Translate（高速、安価、十分な品質）を使用します。韓国語にはフォーマルなトーンを持つLLMを適用し、平原クリー語にはリーダーボードで最高スコアを獲得したコミュニティ構築のコーチング済みプラグインを使用します。

**同じコマンド。同じCIパイプライン。言語ペアごとに異なるメソッド。1つの設定ファイル。**

## リーダーボードからデプロイへのワークフロー

:::tip 近日公開: `rosetta leaderboard` CLI
以下で説明するワークフローは、[MT Eval Arena](https://mtevalarena.org) のリーダーボードと i18n-rosetta CLI の間で計画されている統合機能です。インフラストラクチャは両側に存在しており、現在その連携部分を開発中です。
:::

[MT Eval Arena](https://mtevalarena.org) は、再現性のあるフィンガープリント付きのスコアリングで翻訳メソッドのベンチマークを行う場所です。すべてのメソッドは、複数の指標（chrF++、完全一致、FSTの許容度、セマンティクススコアリング）に基づく総合スコアを獲得します。リーダーボードでは、すべての提出結果が追跡されます。

計画されているワークフロー：

```bash
# Browse the leaderboard from your terminal
npx i18n-rosetta leaderboard --pair en:crk

# Output:
# ┌──────┬───────────────────────┬────────────┬──────────┬───────────┐
# │ Rank │ Method                │ Model      │ chrF++   │ Composite │
# ├──────┼───────────────────────┼────────────┼──────────┼───────────┤
# │  1   │ crk-coached-v3        │ gemini-2.5 │ 43.2     │ 0.67      │
# │  2   │ fst-gated-pipeline    │ gpt-4o     │ 41.8     │ 0.63      │
# │  3   │ prompt-baseline       │ claude-4   │ 38.1     │ 0.55      │
# └──────┴───────────────────────┴────────────┴──────────┴───────────┘

# Install the top-scoring method as a plugin
npx i18n-rosetta plugin install crk-coached-v3

# Use it
npx i18n-rosetta sync
```

**メソッドを構築したり、モデルをトレーニングしたりする必要はありません。勝者を選んでデプロイするだけです。** 来月、リーダーボードにより優れたメソッドが登場した場合は、1つのコマンドで切り替えることができます。

## 現在利用可能な機能

リーダーボードとCLIの連携部分は開発中です。現在機能しているものは以下の通りです：

### 組み込みメソッド（プラグイン不要）

| メソッド | 最適な用途 | コスト |
|--------|----------|------|
| `llm` (デフォルト) | 品質重視、すべての言語 | OpenRouter経由のトークン課金 |
| `gemini` | 品質 + 無料枠 | 無料（制限あり）、以降はトークン課金 |
| `google-translate` | スピード + 大量処理 | 20ドル/100万文字 |
| `deepl` | ヨーロッパ言語 | 25ドル/100万文字 |
| `llm-coached` | コーチングデータのある言語 | OpenRouter経由のトークン課金 |
| `api` | カスタム/コミュニティホスト型メソッド | セルフホスト |

### プラグインメソッド（別途インストール）

カスタムプラグインは、ファインチューニングされたモデル、FSTで制御されたパイプライン、コミュニティAPIなど、JSONを出力するあらゆる翻訳ロジックをラップできます。詳細は [プラグインの構築](/docs/tutorials/build-a-plugin) を参照してください。

## エンタープライズワークフロー

### 1. 現在の品質を評価する

```bash
# See what you're getting today
npx i18n-rosetta status

# Output shows: method per pair, cache hit rate, quality gate stats
```

### 2. 候補に対して評価ハーネスを実行する

[評価ハーネス](https://mtevalarena.org/docs/specifications/harness) を使用すると、同じデータセットに対して複数のメソッドをベンチマークできます。スイープを実行し、スコアを比較して、最適なものを選びます：

```bash
# In the eval harness repo
python -m mt_eval_harness.run \
  --methods coached-v3 baseline prompt-tuned \
  --dataset data/your-corpus.json
```

### 3. 言語ペアごとの勝者を設定する

言語ペアごとに最適なメソッドを使用するように設定を更新します。言語によって最適なメソッドは異なります。これが重要なポイントです。

### 4. CI/CDに統合する

```bash
# In your CI pipeline
npx i18n-rosetta lint        # Catch hardcoded strings
npx i18n-rosetta sync        # Translate what changed
npx i18n-rosetta audit       # Fail if any locale is incomplete
npx i18n-rosetta integrity   # Validate placeholder consistency
```

3つのコマンド。手動翻訳はゼロ。パイプラインがハードコードされた文字列を検出し、選択したメソッドで翻訳し、不足や破損がある場合はビルドを失敗させます。

### 5. プロフェッショナルによるレビュー（オプション）

重要なコンテンツについては、XLIFFにエクスポートして人間によるレビューを行います：

```bash
npx i18n-rosetta xliff export --locale ja --output translations.xliff
# → Send to your translation agency
# → Import corrections back:
npx i18n-rosetta xliff import translations.xliff
```

大部分は機械翻訳を行い、重要な部分は人間がレビューします。重要な箇所にのみ人間のリソースにコストをかけます。

## コストモデル

rosettaには、**ライセンス費用、月額サブスクリプション、シート単位の料金はありません**。オープンソースのCLIツールです。翻訳APIの呼び出しに対してのみ料金が発生します：

| ボリューム | Google Translate | LLM (Gemini Flash) | LLM (GPT-4o) |
|--------|-----------------|---------------------|---------------|
| 1,000キー × 5ロケール | 約$0.50 | 約$0.30 (無料枠) | 約$2.00 |
| 10,000キー × 15ロケール | 約$15 | 約$8 | 約$60 |
| 50,000キー × 30ロケール | 約$75 | 約$40 | 約$300 |

翻訳メモリ機能により、次回の同期以降は**変更されたキー**に対してのみ料金が発生します。10,000個の文字列のうち10個を更新した場合、支払うのは10,000個分ではなく10個分の翻訳料金のみです。

## TMSプラットフォームとの比較

| | rosetta | Crowdin / Phrase / Locize |
|---|---|---|
| **料金** | 無料（オープンソース）+ APIコスト | 月額$50～$500 + シート単位 |
| **ベンダーロックイン** | なし — 設定でプロバイダーを切り替え可能 | 高い — データはベンダーのクラウド上 |
| **メソッドの選択** | 任意のプロバイダー、モデルを言語ペアごとに選択可能 | ベンダーの提供するものに依存 |
| **CI/CD** | ファーストクラス (`lint → sync → audit`) | プラグイン/Webhook |
| **カスタムメソッド** | プラグインシステム、コミュニティプラグイン | サポートなし |
| **品質ゲート** | 組み込み（文字種エラー、エコー、長さ） | ベンダーにより異なる |
| **セルフホスト** | 可能 (LibreTranslate、カスタムAPI) | 不可 |

詳細は [完全な比較](/docs/guides/comparison) を参照してください。

## さらに詳しく

- **[クイックスタート](/docs/getting-started/quick-start)** — 60秒で最初の同期を実行する
- **[翻訳メソッド](/docs/guides/translation-methods)** — 決定木を含むメソッドの完全なメニュー
- **[CI/CDの統合](/docs/guides/ci-cd)** — パイプラインでの自動化
- **[プロの翻訳者との連携](/docs/guides/professional-translators)** — XLIFFのエクスポート/インポート
- **[MT Eval Arena](https://mtevalarena.org)** — ベンチマークとリーダーボード
- **[設定リファレンス](/docs/getting-started/configuration)** — すべての設定オプション