---
sidebar_position: 4
title: "Run Card仕様"
---
# Run Card 仕様

Run Card は、1回の評価実行の完全な記録です。これには、実験を理解し、再現し、検証するために必要なすべての情報（構成、スコア、個別の結果、トークン使用量、環境メタデータ）が含まれています。

**スキーマバージョン:** 2.0

---

## トップレベルフィールド

| フィールド | 型 | 説明 |
|-------|------|-------------|
| `run_id` | `string` | 実行開始時に生成された UUID v4 |
| `harness_version` | `string` | このカードを生成した harness のセマンティックバージョン (例: `2.0`) |
| `model_slug` | `string` | 実行に使用された OpenRouter のモデルスラグ (例: `openai/gpt-4o`) |
| `model_id` | `string` | API によって返された解決済みのモデル識別子 (例: `gpt-4o-2024-08-06`) |
| `condition` | `string` | 実験ラベル (例: `baseline`, `coached-v3`, `few-shot`) |
| `timestamp` | `string` | 実行が開始された日時の ISO 8601 UTC タイムスタンプ |
| `elapsed_seconds` | `number` | 実行全体の実時間 (Wall-clock duration) |

```json
{
  "run_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "harness_version": "2.0",
  "model_slug": "openai/gpt-4o",
  "model_id": "gpt-4o-2024-08-06",
  "condition": "baseline",
  "timestamp": "2025-05-20T03:22:41Z",
  "elapsed_seconds": 142.7
}
```

---

## `dataset`

評価データセットを識別し、SHA-256 を使用して特定のコンテンツバージョンに固定します。

| フィールド | 型 | 説明 |
|-------|------|-------------|
| `id` | `string` | データセット識別子 (例: `edtekla-dev-v1`) |
| `version` | `string` | データセットのバージョン文字列 |
| `language_pair` | `string` | 表示ラベル (例: `EN→CRK`) |
| `sha256` | `string` | データセットファイルの内容の SHA-256 ハッシュ。使用された正確なデータを保証します |
| `entry_count` | `number` | データセット内のエントリ数 |

```json
{
  "dataset": {
    "id": "edtekla-dev-v1",
    "version": "1.0",
    "language_pair": "EN→CRK",
    "sha256": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    "entry_count": 124
  }
}
```

---

## `config`

この実行に使用された API とバッチ処理の構成です。

| フィールド | 型 | 説明 |
|-------|------|-------------|
| `api_provider` | `string` | API プロバイダー名 (例: `openrouter`) |
| `temperature` | `number` | サンプリング温度 |
| `max_tokens` | `number` | 完了ごとの最大トークン数 |
| `batch_size` | `number` | 同時バッチごとのエントリ数 |
| `concurrency` | `number` | 最大並行 API リクエスト数 |

```json
{
  "config": {
    "api_provider": "openrouter",
    "temperature": 0.3,
    "max_tokens": 1024,
    "batch_size": 5,
    "concurrency": 3
  }
}
```

---

## `system_prompt_sha256` / `system_prompt_used`

| フィールド | 型 | 説明 |
|-------|------|-------------|
| `system_prompt_sha256` | `string` | システムプロンプトの SHA-256 ハッシュ。フィンガープリントに含まれます |
| `system_prompt_used` | `string` | モデルに送信された完全なシステムプロンプトのテキスト |

プロンプトのハッシュは [フィンガープリント](#fingerprint) の一部です。他のすべての設定が一致していても、異なるプロンプトを使用した2つの実行は異なるフィンガープリントを持ちます。

---

## `fingerprint`

再現性のための識別子です。同一のフィンガープリントを持つ2つの実行は、同じ実験セットアップを使用しています。

| フィールド | 型 | 説明 |
|-------|------|-------------|
| `hash` | `string` | ソートされたコンポーネントの SHA-256 ハッシュ |
| `components` | `object` | ハッシュ化された入力値 |

### フィンガープリントのコンポーネント

| コンポーネント | 説明 |
|-----------|-------------|
| `dataset_sha256` | データセットファイルのハッシュ |
| `model_slug` | 使用されたモデル |
| `condition` | 実験条件ラベル |
| `system_prompt_sha256` | システムプロンプトのハッシュ |
| `temperature` | サンプリング温度 |
| `harness_version` | Harness のバージョン |

```json
{
  "fingerprint": {
    "hash": "7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069",
    "components": {
      "dataset_sha256": "e3b0c44298fc1c14...",
      "model_slug": "openai/gpt-4o",
      "condition": "baseline",
      "system_prompt_sha256": "abc123...",
      "temperature": 0.3,
      "harness_version": "2.0"
    }
  }
}
```

:::info フィンガープリント ≠ Run Card ハッシュ
フィンガープリントは*実験構成*を識別します。`run_card_hash` は*結果ファイルの整合性*を検証します。詳細については、[フィンガープリントと Run Card ハッシュの比較](/docs/eval/harness#fingerprint-vs-run-card-hash) を参照してください。
:::

---

## `scores`

実行全体の集計メトリクスです。

### トップレベルスコア

| フィールド | 型 | 説明 |
|-------|------|-------------|
| `total` | `number` | 評価された合計エントリ数 |
| `exact_matches` | `number` | 出力がゴールドスタンダードと完全に一致したエントリ数 |
| `exact_match_rate` | `number` | `exact_matches / total` (0.0–1.0) |
| `fst_accepted` | `number` | FST アナライザーが出力を受け入れたエントリ数 |
| `fst_acceptance_rate` | `number` | `fst_accepted / total` (0.0–1.0)。FST アナライザーが使用されなかった場合は `null` |
| `chrf_plus_plus` | `number` | コーパスレベルの chrF++ スコア (0–100) |
| `errors` | `number` | 失敗したエントリ数 (API エラー、タイムアウトなど) |
| `avg_latency_seconds` | `number` | すべてのエントリの平均応答時間 |
| `median_latency_seconds` | `number` | 応答時間の中央値 |
| `p95_latency_seconds` | `number` | 95パーセンタイルの応答時間 |

### `by_difficulty`

難易度層ごとに分類されたスコアです。各キー (`easy`, `medium`, `hard`) には、トップレベルスコアと同じメトリクスフィールドが含まれています。

```json
{
  "by_difficulty": {
    "easy": {
      "total": 42,
      "exact_matches": 8,
      "exact_match_rate": 0.1905,
      "chrf_plus_plus": 51.2,
      "fst_accepted": 35,
      "fst_acceptance_rate": 0.8333
    },
    "medium": { ... },
    "hard": { ... }
  }
}
```

### `by_provenance`

エントリの出所ごとに分類されたスコアです。各キー (例: `gold_standard`, `textbook`) には、同じメトリクスフィールドが含まれています。

```json
{
  "by_provenance": {
    "gold_standard": {
      "total": 80,
      "exact_matches": 10,
      "exact_match_rate": 0.125,
      "chrf_plus_plus": 44.8
    },
    "textbook": { ... }
  }
}
```

---

## `totals`

実行全体のトークン使用量とコストの追跡です。

| フィールド | 型 | 説明 |
|-------|------|-------------|
| `prompt_tokens` | `number` | すべての API 呼び出しにおける合計入力トークン数 |
| `completion_tokens` | `number` | 合計出力トークン数 |
| `reasoning_tokens` | `number` | 思考の連鎖 (chain-of-thought) 推論に使用されたトークン数 (モデルに依存し、ほとんどのモデルでは 0) |
| `cached_tokens` | `number` | プロバイダーのプロンプトキャッシュから提供されたトークン数 |
| `total_cost_usd` | `number` | USD での合計コスト (API によって報告された値) |
| `cost_per_entry_usd` | `number` | `total_cost_usd / entry_count` |
| `reasoning_ratio` | `number` | `reasoning_tokens / completion_tokens` (0.0–1.0) |

```json
{
  "totals": {
    "prompt_tokens": 48200,
    "completion_tokens": 3100,
    "reasoning_tokens": 0,
    "cached_tokens": 12000,
    "total_cost_usd": 0.42,
    "cost_per_entry_usd": 0.0034,
    "reasoning_ratio": 0.0
  }
}
```

---

## `environment`

再現性のためのランタイム環境メタデータです。

| フィールド | 型 | 説明 |
|-------|------|-------------|
| `harness_version` | `string` | Harness のバージョン (トップレベルの `harness_version` を反映) |
| `harness_git_commit` | `string` | 実行時の harness の Git コミット SHA |
| `python_version` | `string` | Python インタープリターのバージョン |
| `sacrebleu_version` | `string` | sacrebleu ライブラリのバージョン (chrF++ スコアリングに使用) |
| `os` | `string` | オペレーティングシステム識別子 |

```json
{
  "environment": {
    "harness_version": "2.0",
    "harness_git_commit": "a1b2c3d",
    "python_version": "3.11.9",
    "sacrebleu_version": "2.4.0",
    "os": "macOS-14.5-arm64"
  }
}
```

---

## `results[]`

エントリごとの結果配列です。データセットエントリごとに1つのオブジェクトがインデックス順に含まれます。

| フィールド | 型 | 説明 |
|-------|------|-------------|
| `entry_index` | `number` | データセット内のこのエントリのインデックス (`entries[].index` と一致) |
| `source_text` | `string` | 翻訳されたソーステキスト |
| `target_expected` | `string` | データセットのゴールドスタンダード参照 |
| `target_output` | `string` | モデルの実際の出力 |
| `exact_match` | `boolean` | `target_output === target_expected` かどうか |
| `entry_chrf` | `number` | このエントリの文レベルの chrF++ スコア (0–100) |
| `fst_accepted` | `boolean \| null` | FST アナライザーが出力を受け入れたかどうか。アナライザーが構成されていない場合は `null` |
| `fst_analysis` | `string[]` | 出力の FST 分析文字列 (分析されなかった場合や拒否された場合は空の配列) |
| `difficulty` | `string` | データセットの難易度層 (`easy`, `medium`, `hard`) |
| `provenance` | `string` | データセットの出所タグ |
| `latency_seconds` | `number` | この個別のエントリの応答時間 |
| `usage` | `object` | エントリごとのトークン使用量: `{ prompt_tokens, completion_tokens, reasoning_tokens }` |
| `error` | `string \| null` | このエントリが失敗した場合のエラーメッセージ。成功した場合は `null` |

```json
{
  "results": [
    {
      "entry_index": 0,
      "source_text": "Hello",
      "target_expected": "tânisi",
      "target_output": "tânisi",
      "exact_match": true,
      "entry_chrf": 100.0,
      "fst_accepted": true,
      "fst_analysis": ["tânisi+V+AI+Ind+2Sg"],
      "difficulty": "easy",
      "provenance": "gold_standard",
      "latency_seconds": 0.82,
      "usage": {
        "prompt_tokens": 385,
        "completion_tokens": 12,
        "reasoning_tokens": 0
      },
      "error": null
    }
  ]
}
```

---

## `run_card_hash`

| フィールド | 型 | 説明 |
|-------|------|-------------|
| `run_card_hash` | `string` | Run Card JSON 全体の SHA-256 ハッシュ。ハッシュ化の際、`run_card_hash` フィールド自体は `""` に設定されます |

これは改ざん検出用のシールです。リーダーボードは送信時にこのハッシュを再計算し、一致しないカードを拒否します。

**ハッシュの計算:**

1. `run_card_hash` を `""` に設定して、Run Card を JSON にシリアライズします
2. シリアライズされた文字列の SHA-256 を計算します
3. `run_card_hash` を得られた16進数ダイジェストに設定します

```python
import hashlib, json

card["run_card_hash"] = ""
card_json = json.dumps(card, sort_keys=True, ensure_ascii=False)
card["run_card_hash"] = hashlib.sha256(card_json.encode()).hexdigest()
```

---

## 関連項目

- [MT 評価](/docs/eval/) — 概要、リーダーボードの価値、および良い/悪いメソッドのガイダンス
- [Eval Harness](/docs/eval/harness) — 評価の実行方法と Run Card の生成方法
- [評価データセット](/docs/eval/datasets) — データセットの形式、EDTeKLA、FLORES+
- [メソッドの構築](/docs/eval/methods) — メソッドのインターフェースとメソッドカードの仕様
- [メソッドリーダーボード](/leaderboard) — ライブベンチマークスコア