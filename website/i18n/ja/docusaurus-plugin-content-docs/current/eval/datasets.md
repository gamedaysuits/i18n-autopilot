---
sidebar_position: 3
title: "評価データセット"
---
# 評価データセット

データセットは、harnessが実行される際の固定されたターゲットです。各データセットは、gold-standard（最高基準）の参照訳を伴うsource→targetのペアを含むJSONファイルです。harnessはこれらの参照訳に対してモデルの出力をスコアリングします。参照訳を変更することは決してありません。

:::danger 評価データでのトレーニング禁止

⚠️ **これらのデータセットは評価専用です。** 評価データにトレーニング、ファインチューニング、few-shotプロンプト、またはその他の方法で触れた手法は、人為的に水増しされたスコアを生成するため、**リーダーボードから失格となります。**

トレーニングには別のコーパスを使用してください。開発中、モデルが評価セットを未学習の状態に保つ必要があります。
:::

---

## データセットのフォーマット

すべてのデータセットは同じJSONスキーマに従います。

```json
{
  "dataset": {
    "id": "dataset-slug",
    "version": "1.0",
    "language_pair": "EN→CRK",
    "description": "Human-readable description of the dataset",
    "source_language": "en",
    "target_language": "crk",
    "created": "2025-05-01",
    "license": "CC-BY-NC-4.0",
    "provenance": ["gold_standard", "textbook"]
  },
  "entries": [
    {
      "index": 0,
      "source_text": "Hello",
      "target_expected": "tânisi",
      "difficulty": "easy",
      "provenance": "gold_standard",
      "notes": "Common greeting, SRO orthography"
    }
  ]
}
```

### トップレベルの `dataset` ブロック

| フィールド | 型 | 説明 |
|-------|------|-------------|
| `id` | `string` | 一意のデータセット識別子（run cardおよびリーダーボードで使用されます） |
| `version` | `string` | セマンティックバージョン。これを増やすと、以前のrun cardとの比較が無効になります |
| `language_pair` | `string` | 表示ラベル（例：`EN→CRK`） |
| `description` | `string` | 人間が読める形式の概要 |
| `source_language` | `string` | BCP 47 ソース言語コード |
| `target_language` | `string` | BCP 47 ターゲット言語コード |
| `created` | `string` | ISO 8601 作成日 |
| `license` | `string` | SPDX ライセンス識別子 |
| `provenance` | `string[]` | エントリ全体で使用されるprovenance（出所）タグのリスト |

### エントリのフィールド

| フィールド | 型 | 説明 |
|-------|------|-------------|
| `index` | `number` | 0から始まるエントリインデックス。一意かつ連番である必要があります |
| `source_text` | `string` | 翻訳するソーステキスト |
| `target_expected` | `string` | gold-standardの参照訳 |
| `difficulty` | `string` | 難易度ティア：`easy`、`medium`、`hard` |
| `provenance` | `string` | このエントリの出所（例：`gold_standard`、`textbook`、`elicited`） |
| `notes` | `string` | 人間のレビュアー向けのオプションのコンテキスト |

---

## 利用可能なデータセット

### EDTeKLA Development Set v1

英語からPlains Cree（SRO）への翻訳のために構築された、最初の評価データセットです。アルバータ大学の[EdTeKLA research group](https://spaces.facsci.ualberta.ca/edtekla/)によって作成されました。

| プロパティ | 値 |
|----------|-------|
| **ID** | `edtekla-dev-v1` |
| **バージョン** | `1.0` |
| **言語ペア** | EN → CRK (Plains Cree, SRO正書法) |
| **エントリ数** | 124 |
| **難易度分布** | Easy, Medium, Hard |
| **出所** | `gold_standard`（話者による検証済み）、`textbook`（出版された教育資料） |
| **ライセンス** | [CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/) |

**テストの対象:**

- 基本的な挨拶と一般的なフレーズ
- 名詞の有生性とobviation（遠称）
- 人称と時制にわたる動詞の活用
- 処格の構造
- 所有のパラダイム
- 複雑な文構造

:::tip なぜ124エントリなのか？
このデータセットは意図的に小規模に抑えられ、厳選されています。各エントリは流暢な話者によって検証されたか、出版されたCree語の教科書から引用されています。検証済みのgold-standardを備えた小規模で高品質なデータセットは、大規模でノイズの多いデータセットよりも有用です。特に、「だいたい合っている」翻訳が形態論的に無効であることが多い低資源言語においてはなおさらです。
:::

---

## 新しいデータセットの作成

新しい言語ペアやドメインのデータセットを作成するには：

### 1. JSONの構造化

[データセットのフォーマット](#dataset-format)スキーマに従ってください。すべてのエントリには、`source_text`、`target_expected`、`difficulty`、および`provenance`が必要です。

### 2. 一意のIDの割り当て

わかりやすいスラッグを使用してください：`{project}-{split}-v{version}`（例：`edtekla-dev-v1`、`quechua-test-v1`）。

### 3. gold-standardの検証

すべての`target_expected`の値は、流暢な話者によって検証されるか、査読済みの出版されたリソースから引用される必要があります。機械生成された参照訳は、評価の目的を損ないます。

### 4. 難易度ティアの設定

各エントリに難易度レベルを割り当てます。

| ティア | 基準 |
|------|----------|
| `easy` | 短いフレーズ、一般的な語彙、単純な形態論 |
| `medium` | 完全な文、中程度の形態論的複雑さ |
| `hard` | 複雑な文法、まれな構文、文化に特有のコンテンツ |

### 5. provenance（出所）のタグ付け

各エントリには、その出所を示す必要があります。一般的なタグは以下の通りです。

- `gold_standard` — 流暢な話者による検証済み
- `textbook` — 出版された教育資料からの引用
- `elicited` — 構造化されたエリシテーション（聞き取り）セッションを通じて作成
- `corpus` — パラレルコーパスから抽出

### 6. ファイルの検証

任意のモデルを使用してデータセットに対してharnessを実行し、JSONが整形式であること、およびすべての必須フィールドが存在することを確認します。

```bash
python eval/baseline_experiment.py --dataset path/to/your-dataset.json
```

harnessは、フィールドの欠落、インデックスの重複、またはスキーマ違反がある場合にエラーを出力します。

### 7. 追加のための提出

`data/`ディレクトリにデータセットファイルを配置し、[eval harnessリポジトリ](https://github.com/gamedaysuits/gds-mt-eval-harness)に対してプルリクエストを作成します。検証方法と出所に関するドキュメントを含めてください。

---

## FLORES+ Devtest

[Open Language Data Initiative (OLDI)](https://huggingface.co/datasets/openlanguagedata/flores_plus)によって維持されている、広範囲をカバーする多言語ベンチマークです。rosettaのマルチモデルフロンティアベンチマークに使用されます。

| プロパティ | 値 |
|----------|-------|
| **ID** | `flores-plus-devtest` |
| **言語ペア** | EN → 39言語（rosettaに登録されているすべての自然言語） |
| **エントリ数** | 各言語1,012文 |
| **ライセンス** | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/) |
| **ソース** | 元はMeta FLORES-200、現在はOLDIが維持 |
| **場所** | rosettaのメインリポジトリ内の `test/benchmark/fixtures/` にある事前抽出されたフィクスチャ |

:::danger 評価専用
FLORES+は評価のみを目的としています。キュレーターは、これを**トレーニングデータとして使用しない**ことを明示的に求めています。その内容がトレーニングコーパスから除外されていることを確認してください。
:::

---

## 関連項目

- [MT Evaluation](/docs/eval/) — 評価フレームワークとリーダーボードの概要
- [Eval Harness](/docs/eval/harness) — これらのデータセットに対して評価を実行する方法
- [Run Card Specification](/docs/eval/run-card) — 結果を記録するためのJSONスキーマ
- [Method Leaderboard](/leaderboard) — ライブベンチマークスコア
- [EdTeKLA Project](https://spaces.facsci.ualberta.ca/edtekla/) — Cree語データセットの背後にあるアルバータ大学の研究グループ