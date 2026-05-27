---
sidebar_position: 2
title: "クイックスタート"
---
# クイックスタート

最初のロケールファイルを60秒で翻訳します。

## 1. ロケールファイルの設定

ソースとなるロケールファイルを作成します。RosettaはJSON、TOML、YAMLをサポートしています。

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

## 2. APIキーの設定

プロバイダーを選択し、キーを設定します。

```bash
# Option A: OpenRouter (200+ models, recommended)
export OPENROUTER_API_KEY=sk-or-v1-...

# Option B: Gemini (free tier — zero cost to start)
export GEMINI_API_KEY=AI...
```

無料のGeminiキーは[aistudio.google.com/apikey](https://aistudio.google.com/apikey)で取得できます。OpenRouterキーは[openrouter.ai](https://openrouter.ai)で取得できます。

## 3. 同期の実行

```bash
npx i18n-rosetta sync
```

:::tip Geminiを使用する場合
オプションB（Gemini）を選択した場合は、`--method gemini`を追加します。
```bash
npx i18n-rosetta sync --method gemini
```
:::

Rosettaは以下の処理を行います。
1. `locales/en.json`をソースとして自動検出します
2. ターゲット言語を検索（または入力を促すプロンプトを表示）します
3. すべてのキーを翻訳します
4. `locales/fr.json`、`locales/ja.json`などを書き出します
5. 翻訳済みの内容を追跡するための`.i18n-rosetta.lock`を作成します

## 4. 結果の確認

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

## この後の流れ

ソースの文字列を変更すると、rosettaはSHA-256ハッシュの追跡によって変更を検出し、次回の同期時にそのキーのみを再翻訳します。

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

変更されていないキー（`hero.subtitle`）は、rosettaの**Translation Memory**キャッシュから提供されます。API呼び出しは発生せず、コストもかかりません。キャッシュは同期のたびに自動的に構築され、`.rosetta/tm.json`に保存されます。

## オプション: 設定ファイルの作成

より詳細な制御を行うには、設定ファイルを生成します。

```bash
npx i18n-rosetta init                         # guided wizard
npx i18n-rosetta init --yes --langs fr,de,ja  # quick setup with specific targets
```

ガイド付きウィザードでは、各言語の**register presets**を順を追って設定できます。これは、その言語体系に合わせて調整された、トーンやフォーマル度の事前構築済み指示です。フランス語にはT-Vプリセット（vouvoiement vs tutoiement）、韓国語にはスピーチレベル（해요체 vs 합쇼체 vs 해체）、日本語には敬語のオプション（です/ます vs 丁寧語）があります。

または、プリセットキーを使用して手動で設定ファイルを作成することもできます。

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

各言語で利用可能なプリセットを閲覧するには、`npx i18n-rosetta init`を実行します。

## オプション: ウォッチモード

ソースファイルが変更されたときに自動翻訳します。

```bash
npx i18n-rosetta watch
```

## 次のステップ

- **[設定](/docs/getting-started/configuration)** — 設定の完全なリファレンス
- **[翻訳メソッド](/docs/guides/translation-methods)** — ペアごとに適切なメソッドを選択する
- **[Translation Memory](/docs/concepts/translation-memory)** — キャッシュによって再実行時のコストを節約する方法
- **[プロの翻訳者との連携](/docs/guides/professional-translators)** — 人間によるレビュー用にXLIFFをエクスポートする
- **[フレームワークの統合](/docs/guides/framework-integration)** — Hugo、next-intl、react-i18next
- **[CI/CD](/docs/guides/ci-cd)** — パイプラインで翻訳を自動化する
- **[トラブルシューティング](/docs/guides/troubleshooting)** — よくある問題と解決策