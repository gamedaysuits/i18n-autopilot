---
sidebar_position: 3
title: "CI/CD"
---
# CI/CD統合

ビルドパイプラインで翻訳を自動化します。

## GitHub Actions: プッシュ時の同期

既存のビルドパイプラインに翻訳の同期を追加します：

```yaml title=".github/workflows/deploy.yml"
jobs:
  build:
    steps:
      - uses: actions/checkout@v4
      - run: npm ci
      - name: Sync translations
        env:
          OPENROUTER_API_KEY: ${{ secrets.OPENROUTER_API_KEY }}
        run: npx i18n-rosetta sync
      - run: npm run build
```

## GitHub Actions: 定期的な同期

スケジュールに従って翻訳を実行し、自動でコミットします：

```yaml title=".github/workflows/i18n-sync.yml"
name: Sync translations
on:
  schedule:
    - cron: '0 6 * * *'
  workflow_dispatch:

jobs:
  sync:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm ci
      - name: Sync translations
        env:
          OPENROUTER_API_KEY: ${{ secrets.OPENROUTER_API_KEY }}
        run: npx i18n-rosetta sync
      - name: Commit updated translations
        run: |
          git config user.name "i18n-rosetta"
          git config user.email "bot@example.com"
          git add i18n/ content/ locales/ messages/
          git diff --staged --quiet || git commit -m "chore: sync translations"
          git push
```

## Google Translateメソッド

OpenRouterの代わりに、組み込みのGoogle Translateメソッドを使用する場合：

```yaml
- name: Sync translations
  env:
    GOOGLE_TRANSLATE_API_KEY: ${{ secrets.GOOGLE_TRANSLATE_API_KEY }}
  run: npx i18n-rosetta sync
```

## LLMプロバイダーの直接利用

`openai`、`anthropic`、または`gemini`メソッドを直接使用する場合：

```yaml
# OpenAI
- name: Sync translations
  env:
    OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
  run: npx i18n-rosetta sync --method openai

# Anthropic
- name: Sync translations
  env:
    ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
  run: npx i18n-rosetta sync --method anthropic

# Gemini (free tier available)
- name: Sync translations
  env:
    GEMINI_API_KEY: ${{ secrets.GEMINI_API_KEY }}
  run: npx i18n-rosetta sync --method gemini
```

## DeepL

```yaml
- name: Sync translations
  env:
    DEEPL_API_KEY: ${{ secrets.DEEPL_API_KEY }}
  run: npx i18n-rosetta sync --method deepl
```

## リモート翻訳API

リモートの翻訳エンドポイント（ホスト型翻訳サービスなど）を使用する場合：

```yaml
- name: Sync translations
  env:
    ROSETTA_API_KEY: ${{ secrets.ROSETTA_API_KEY }}
  run: npx i18n-rosetta sync
```

## 3層のCIパイプライン

i18nのカバレッジを最大化するために、3つのツールすべてでパイプラインにゲートを設けます：

```yaml
jobs:
  i18n:
    steps:
      - uses: actions/checkout@v4
      - run: npm ci

      # 1. Catch hardcoded strings before they ship
      - run: npx i18n-rosetta lint

      # 2. Translate missing keys
      - run: npx i18n-rosetta sync
        env:
          OPENROUTER_API_KEY: ${{ secrets.OPENROUTER_API_KEY }}

      # 3. Fail if any locale is incomplete
      - run: npx i18n-rosetta audit
```

| レイヤー | コマンド | タイミング | 目的 |
|-------|---------|------|---------|
| **Lint** | `lint` | Pre-commit | ハードコードされた文字列を含むコミットをブロックする |
| **Sync** | `sync` | Post-commit / CI | 不足しているキーや変更されたキーを翻訳する |
| **Audit** | `audit` | ビルドステップ | いずれかのロケールが不完全な場合にデプロイを失敗させる |

---

## 関連項目

- [CLIリファレンス](/docs/reference/cli) — 完全なコマンドリファレンス
- [Syncの仕組み](/docs/concepts/how-sync-works) — インクリメンタル同期の理解
- [翻訳メソッド](/docs/guides/translation-methods) — ペアごとのメソッド選択
- [品質ゲート](/docs/concepts/quality-gate) — 翻訳失敗時の挙動
- [設定](/docs/getting-started/configuration) — 設定リファレンス