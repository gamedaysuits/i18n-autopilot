---
sidebar_position: 2
title: "Eval Harness v2.0"
---
# Eval Harness v2.0

このハーネスは翻訳実験を実行し、ランカード（run card）を生成します。プロンプトの構築、API呼び出し、スコアリング、結果のシリアライズを処理します。ユーザーはデータセットとモデルを提供するだけです。

## インストール

**要件:** Python 3.10+

```bash
pip install sacrebleu aiohttp
```

ハーネスのリポジトリをクローンします:

```bash
git clone https://github.com/gamedaysuits/gds-mt-eval-harness.git
cd gds-mt-eval-harness
```

## 使用方法

```bash
python eval/baseline_experiment.py --dataset path/to/dataset.json
```

これにより、データセット内のすべてのエントリが設定されたモデルを通じて実行され、出力がスコアリングされ、ランカードのJSONファイルが`results/`ディレクトリに書き込まれます。

## CLIフラグ

| フラグ | 必須 | デフォルト | 説明 |
|------|----------|---------|-------------|
| `--dataset` | ✅ | — | 評価データセットのJSONファイルへのパス |
| `--model` | — | `openai/gpt-4o` | OpenRouterのモデルスラッグ（例: `google/gemini-2.5-pro`） |
| `--condition` | — | `baseline` | 実験ラベル。プロンプト戦略を区別するために使用します（例: `coached`、`few-shot`、`dictionary-augmented`） |
| `--temperature` | — | `0.3` | サンプリング温度。低いほど決定論的になります |
| `--batch-size` | — | `5` | 同時APIバッチあたりのエントリ数 |
| `--fst-analyzer` | — | `null` | FSTアナライザのバイナリへのパス。指定した場合、各出力の形態素的な許容性がテストされます |
| `--submit` | — | `false` | 実行完了後、ランカードをリーダーボードAPIに送信します |

### 例

```bash
# Run with defaults (GPT-4o, baseline condition)
python eval/baseline_experiment.py --dataset data/edtekla-dev-v1.json

# Coached experiment with Gemini, lower temperature
python eval/baseline_experiment.py \
  --dataset data/edtekla-dev-v1.json \
  --model google/gemini-2.5-pro \
  --condition coached-v3 \
  --temperature 0.1

# Run with FST validation and auto-submit
python eval/baseline_experiment.py \
  --dataset data/edtekla-dev-v1.json \
  --fst-analyzer ./bin/crk-analyzer \
  --submit
```

---

## ランカードのスキーマ

すべての実験で**ランカード**（自己完結型のJSONドキュメント）が生成されます。最上位の構造は以下の通りです:

```json
{
  "run_id": "uuid-v4",
  "harness_version": "2.0",
  "model_slug": "openai/gpt-4o",
  "model_id": "gpt-4o-2024-08-06",
  "condition": "baseline",
  "timestamp": "2025-05-20T03:22:41Z",
  "elapsed_seconds": 142.7,
  "dataset": { ... },
  "config": { ... },
  "system_prompt_sha256": "abc123...",
  "system_prompt_used": "You are a translator...",
  "fingerprint": { ... },
  "scores": { ... },
  "totals": { ... },
  "environment": { ... },
  "results": [ ... ],
  "run_card_hash": "sha256-of-entire-card"
}
```

すべてのフィールドが文書化された完全なスキーマについては、[ランカード仕様](/docs/eval/run-card)を参照してください。

### 主要なブロック

**`dataset`** — どのデータセットが使用されたかを識別します。結果が特定のバージョンに紐付けられるよう、コンテンツのハッシュが含まれます:

```json
{
  "id": "edtekla-dev-v1",
  "version": "1.0",
  "language_pair": "EN→CRK",
  "sha256": "...",
  "entry_count": 124
}
```

**`scores`** — 実行の集計メトリクス:

```json
{
  "total": 124,
  "exact_matches": 12,
  "exact_match_rate": 0.0968,
  "fst_accepted": 87,
  "fst_acceptance_rate": 0.7016,
  "chrf_plus_plus": 42.31,
  "errors": 0,
  "avg_latency_seconds": 1.15,
  "median_latency_seconds": 1.02,
  "p95_latency_seconds": 2.34,
  "by_difficulty": { ... },
  "by_provenance": { ... }
}
```

**`totals`** — トークン使用量とコストの追跡:

```json
{
  "prompt_tokens": 48200,
  "completion_tokens": 3100,
  "reasoning_tokens": 0,
  "cached_tokens": 12000,
  "total_cost_usd": 0.42,
  "cost_per_entry_usd": 0.0034,
  "reasoning_ratio": 0.0
}
```

---

## フィンガープリントとランカードハッシュの比較

ハーネスは2つの異なるハッシュを生成します。これらは異なる目的を果たします:

### フィンガープリント

**フィンガープリント**は、*「この実行は再現可能か？」*という問いに答えます。

出力ではなく、実験設定を定義する入力の組み合わせをハッシュ化します:

- データセットのSHA-256
- モデルスラッグ
- 条件ラベル
- システムプロンプトのSHA-256
- 温度
- ハーネスのバージョン

同一のフィンガープリントを持つ2つの実行は、同じ設定を使用したことを意味します。それらの結果は（APIの非決定性を除けば）比較可能であるはずです。

### ランカードハッシュ

**ランカードハッシュ**は、*「この特定の結果ファイルは改ざんされていないか？」*という問いに答えます。

これは、ランカードJSON全体（`run_card_hash`フィールド自体を除く）のSHA-256です。スコア、タイムスタンプ、単一の出力など、いずれかのフィールドが変更されると、ハッシュは破損します。

:::info どちらをいつ使用するか
比較可能な実行（同じ実験、異なる実行）をグループ化するには**フィンガープリント**を使用します。特定の結果ファイルの整合性を検証するには**ランカードハッシュ**を使用します。
:::

---

## リーダーボードへの送信

### 自動送信

完了時にランカードをアップロードするには、`--submit`を渡します:

```bash
python eval/baseline_experiment.py \
  --dataset data/edtekla-dev-v1.json \
  --submit
```

### 手動送信

ランカードはJSONファイルとして`results/`に保存されます。任意のランカードファイルは、[/leaderboard](/leaderboard)のリーダーボードUIから、またはAPIを通じて送信できます:

```bash
curl -X POST https://i18n-rosetta.com/api/leaderboard/submit \
  -H "Content-Type: application/json" \
  -d @results/your-run-card.json
```

:::warning リーダーボードの検証
リーダーボードは、送信されたランカードをデータセットレジストリと照合して検証します。不明なデータセットを参照している送信、または破損した`run_card_hash`を持つ送信は拒否されます。
:::

:::danger 評価データでのトレーニング禁止
開発中に、トレーニングデータ、Few-shotの例、辞書エントリ、またはプロンプトエンジニアリングの資料として、メソッドが評価データセットを参照していた場合、その送信は**失格**となります。良いメソッドと悪いメソッドの違いについては、[MT評価](/docs/eval/)を参照してください。
:::

---

## 関連項目

- [MT評価](/docs/eval/) — 概要、リーダーボードの価値提案、および良い/悪いメソッドのガイダンス
- [評価データセット](/docs/eval/datasets) — データセットのフォーマット、EDTeKLA、FLORES+
- [ランカード仕様](/docs/eval/run-card) — 完全なJSONスキーマ
- [メソッドの構築](/docs/eval/methods) — 評価可能なメソッドを作成するためのメソッドインターフェース
- [メソッドリーダーボード](/leaderboard) — ライブベンチマークスコア