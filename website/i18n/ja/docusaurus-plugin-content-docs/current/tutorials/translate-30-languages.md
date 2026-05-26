---
sidebar_position: 2
title: "30言語の翻訳"
description: "Cookbook: 言語ペアごとの手法の組み合わせ、バッチ処理、CI連携を活用して、プロジェクトを3言語から30言語にスケールさせます。"
---
# クックブック: 30言語の翻訳

数個のロケールからグローバルなカバレッジへとプロジェクトをスケールさせます。このクックブックでは、実際の多言語デプロイメントにおけるメソッドの選択、コストの最適化、CIの統合について順を追って説明します。

**シナリオ:** `en`、`fr`、`es` を備えたSaaSアプリがあります。品質要件の3つのティア（階層）にわたって、さらに27言語を追加する必要があります。

---

## ステップ 1: 言語を分類する

30言語すべてに同じアプローチが必要なわけではありません。利用可能なメソッドの品質によってグループ化します:

| ティア | 言語 | メソッド | 理由 |
|------|-----------|--------|-----|
| **Tier 1 — プレミアム** | `ja`, `ko`, `zh`, `de`, `pt` | `llm` (GPT-4o) | 価値の高い市場、複雑なニュアンスの文法 |
| **Tier 2 — スタンダード** | `it`, `nl`, `pl`, `sv`, `da`, `fi`, `no`, `cs`, `ro`, `hu`, `el`, `tr`, `id`, `ms`, `th`, `vi`, `uk`, `bg` | `google-translate` | 大量のデータ、Googleによるサポートが充実 |
| **Tier 3 — コーチング** | `crk`, `oj`, `mi`, `haw` | `llm-coached` + プラグイン | 低リソース、用語の統一が必要 |

## ステップ 2: ペアごとの設定

```json title="i18n-rosetta.config.json"
{
  "version": 3,
  "inputLocale": "en",
  "localesDir": "./locales",
  "defaultMethod": "google-translate",
  "model": "google/gemini-3.5-flash",
  "languages": {
    "ja": { "name": "Japanese", "register": "Polite/formal" },
    "ko": { "name": "Korean", "register": "Formal" },
    "zh": { "name": "Simplified Chinese", "register": "Neutral" },
    "de": { "name": "German", "register": "Formal (Sie)" },
    "pt": { "name": "Brazilian Portuguese", "register": "Informal" },
    "crk": { "name": "Plains Cree (SRO)", "register": "Neutral" }
  },
  "pairs": {
    "en:ja": { "method": "llm", "model": "openai/gpt-4o" },
    "en:ko": { "method": "llm", "model": "openai/gpt-4o" },
    "en:zh": { "method": "llm", "model": "openai/gpt-4o" },
    "en:de": { "method": "llm", "model": "openai/gpt-4o" },
    "en:pt": { "method": "llm", "model": "openai/gpt-4o" },
    "en:crk": { "methodPlugin": "crk-coached-v1" }
  }
}
```

**注意:** `pairs` にリストされていない言語は `defaultMethod: "google-translate"` を継承します。30言語すべてをリストする必要はありません。

:::info
`crk` のサポートは現在開発中です。ステータスと貢献のガイドラインについては、[低リソース言語のサポート](https://mtevalarena.org/docs/community/low-resource-languages)を参照してください。
:::

## ステップ 3: APIキーを設定する

この設定には両方のAPIキーが必要です:

```bash
export OPENROUTER_API_KEY="sk-or-v1-..."
export GOOGLE_TRANSLATE_API_KEY="AIza..."
```

## ステップ 4: まずはドライランを実行する

30言語を翻訳する前に、必ずプレビューを行ってください:

```bash
npx i18n-rosetta sync --dry
```

出力を確認します。以下の情報が表示されます:
- どのペアがどのメソッドを使用するか
- ロケールごとの新規/変更されたキーの数
- ティアごとの推定API呼び出し回数

## ステップ 5: 同期を実行する

```bash
npx i18n-rosetta sync
```

Rosettaは各ペアを独立して処理します。Google Translateを使用するTier 2のペアは高速です。Tier 1のLLMペアは遅くなりますが、より高品質になります。Tier 3のコーチングペアはプラグインのコーチングデータを使用します。

### 差分更新

初回の同期後、次回以降の実行では**変更されたキーまたは新しいキー**のみが翻訳されます:

```bash
# Only keys that changed since last sync
npx i18n-rosetta sync
```

ロックファイル (`.i18n-rosetta.lock`) が翻訳済みの内容を追跡するため、安定したコンテンツを再翻訳することはありません。

## ステップ 6: 品質を監査する

すべての言語ペアのステータスを確認します:

```bash
npx i18n-rosetta status
```

これにより、各ペアのメソッド、モデル、品質ティア、およびコーチングデータやベンチマークスコアが利用可能かどうかを示す表が出力されます。

## ステップ 7: CIの統合

GitHub Actionsのワークフローに追加して、プッシュのたびに翻訳が最新の状態に保たれるようにします:

```yaml title=".github/workflows/i18n-sync.yml"
name: Sync Translations
on:
  push:
    paths:
      - 'locales/en/**'

jobs:
  translate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20

      - run: npm ci

      - name: Sync translations
        run: npx i18n-rosetta sync
        env:
          OPENROUTER_API_KEY: ${{ secrets.OPENROUTER_API_KEY }}
          GOOGLE_TRANSLATE_API_KEY: ${{ secrets.GOOGLE_TRANSLATE_API_KEY }}

      - name: Commit updated translations
        run: |
          git config user.name "github-actions[bot]"
          git config user.email "github-actions[bot]@users.noreply.github.com"
          git add locales/
          git diff --staged --quiet || git commit -m "chore(i18n): sync translations"
          git push
```

## コスト見積もり

30言語にわたって500個のソースキーを持つプロジェクトの場合:

| ティア | 言語 | メソッド | 概算コスト |
|------|-----------|--------|-----------------|
| Tier 1 (5言語) | ja, ko, zh, de, pt | GPT-4o | 約$2.50/完全同期 |
| Tier 2 (18言語) | it, nl, pl, 他 | Google Translate | 約$0.90/完全同期 |
| Tier 3 (4言語) | crk, oj, mi, haw | GPT-4o-mini コーチング | 約$0.40/完全同期 |
| **合計** | **30言語** | **混在** | **約$3.80/完全同期** |

差分同期（5〜20個の変更されたキー）のコストは、完全同期のほんの一部です。

## 関連項目

- [翻訳メソッド](/docs/guides/translation-methods) — 各翻訳メソッドの仕組みと使用するタイミング
- [プラグイン仕様](/docs/reference/plugin-spec) — Tier 3言語のコーチングデータを作成する
- [CI/CDガイド](/docs/guides/ci-cd) — PRプレビュービルドを含む高度なCIパターン
- [品質ゲート](/docs/concepts/quality-gate) — Rosettaが翻訳を書き込む前にすべての翻訳を検証する方法
- [サポートされている言語](/docs/reference/supported-languages) — 言語コードとメソッドの互換性の完全なリスト
- [低リソース言語のサポート](https://mtevalarena.org/docs/community/low-resource-languages) — 幅広いMTカバレッジを持たない言語にコーチングデータを追加する