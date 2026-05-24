---
sidebar_position: 4
title: "メソッドインターフェース"
---
# 共有メソッドインターフェース

Eval Harnessとi18n-rosettaは、**翻訳メソッド (translation method)** という共通の概念を共有しています。メソッドとは、ソーステキストを受け取り、翻訳されたテキストを生成するあらゆる手順のことです。これには、直接的なLLMの呼び出し、マルチステージのパイプライン、サードパーティのAPI、または人間の翻訳者が含まれます。

## アーキテクチャ

```
Method Plugin (v2 Spec)
├── manifest.json         ← Shared metadata (name, version, supported pairs)
├── method_card.json      ← Leaderboard description (what, not how)
├── translate.py          ← Python entry point (for eval harness)
└── translate.js          ← Node.js entry point (for i18n-rosetta CLI)
```

## 2つのシステム、1つのインターフェース

| | Eval Harness | i18n-rosetta |
|---|---|---|
| **言語** | Python | Node.js |
| **エントリポイント** | `translate.py` | `translate.js` |
| **インターフェース** | `TranslationProcess` プロトコル | `methodPlugin` 設定 |
| **目的** | スコアリングを伴うバッチ評価 | 開発/CIでのライブローカリゼーション |
| **出力** | メトリクスを含むランカード (Run card) | 翻訳されたロケールファイル |

両方のシステムをサポートするメソッドは、各言語ランタイム用に1つずつ、合計2つのエントリポイントを提供します。**メソッドカード (method card)** はその架け橋となるもので、両方のシステムが理解できる形式でメソッドを説明します。

## メソッドカード

メソッドカードは、完全なシステムプロンプトのような独自の詳細を明らかにすることなく、翻訳メソッドが「何であるか」を説明します。以下の問いに答えるものです。

- これはどのクラスのメソッドか？ (生のLLM、コーチングされたLLM、パイプライン、APIなど)
- どのようなツールを使用しているか？ (FSTアナライザー、辞書など)
- 実装はオープンソースか？
- どの言語ペアをサポートしているか？

完全なJSONスキーマについては、[メソッドカード仕様](https://github.com/gamedaysuits/gds-mt-eval-harness/blob/main/docs/method-card-spec.md)を参照してください。

### 例

```json
{
  "method_id": "fst-gated-v8",
  "name": "FST-Gated Coached Translation v8",
  "class": "pipeline",
  "description": "LLM translation with morphological validation. Failed words are retried with FST feedback.",
  "author": "Curtis Forbes",
  "tools_used": ["HFST morphological analyzer", "Wolvengrey dictionary"],
  "open_source": false,
  "supported_pairs": ["eng>crk"]
}
```

### メソッドクラス

| クラス | 説明 |
|-------|-------------|
| `raw-llm` | 最小限の指示による直接的なLLM呼び出し |
| `coached-llm` | 構造化されたプロンプト、例、制約を伴うLLM |
| `pipeline` | 決定論的なコンポーネントを持つマルチステージパイプライン |
| `custom-plugin` | `TranslationProcess` プロトコルを実装する外部プロセス |
| `api` | サードパーティの翻訳API (Google Translate、DeepLなど) |
| `human` | 人間による翻訳 (ベースライン確立用) |

## Eval Harness: TranslationProcess プロトコル

Eval Harnessは、プラグインにPythonの構造的型付け (`Protocol`) を使用します。適切なメソッドシグネチャを持つクラスであれば何でも機能し、継承は必要ありません。

```python
class MyMethod:
    async def translate(self, entries: list[dict], config: RunConfig) -> list[dict]:
        results = []
        for entry in entries:
            translation = await self.do_translation(entry["source"])
            results.append({
                "id": entry["id"],
                "predicted": translation,
                "latency_s": 0.5,
                "usage": {"prompt_tokens": 0, "completion_tokens": 0},
                "error": None,
                "tool_calls": [],
                "tool_call_count": 0,
                "metadata": {},
            })
        return results
```

Python以外のメソッドのラッパー例を含む完全なドキュメントについては、[プラグインプロトコル](https://github.com/gamedaysuits/gds-mt-eval-harness/blob/main/docs/plugin-protocol.md)を参照してください。

## i18n-rosetta: methodPlugin 設定

rosettaでは、メソッドは `i18n-rosetta.config.json` で言語ペアごとに登録されます。

```json
{
  "version": 3,
  "pairs": {
    "en:crk": {
      "methodPlugin": "crk-coached-v1"
    }
  }
}
```

rosetta側のインターフェースについては、[プラグイン仕様](/docs/reference/plugin-spec)を参照してください。

## リーダーボードの統合

メソッドカードが (`--method-card` を介して) 実行にアタッチされると、ランカードに埋め込まれ、リーダーボードに表示されます。

```bash
# Run with method card attached
python eval/baseline_experiment.py \
  --dataset data/edtekla-dev-v1.json \
  --method-card method_card.json \
  --submit
```

リーダーボードには以下が表示されます。
- **クラスバッジ** — 視覚的なインジケーター (例: "pipeline"、"coached-llm")
- **メソッド名** — メソッドカードから取得
- **使用ツール** — メソッドカードからリストアップ
- **オープンソースインジケーター**

メソッドカードがアタッチされていない場合、リーダーボードにはHarnessネイティブの設定 (モデル、条件、温度、有効化されたツール) が表示されます。

:::danger 評価データでトレーニングしないこと
開発プロセスにおいて、トレーニングデータ、Few-shotの例、辞書エントリ、またはプロンプトチューニングの資料として評価データセットに触れたメソッドは、リーダーボードから**失格**となります。良いメソッドと悪いメソッドの違いについては、[MT評価](/docs/eval/)を参照してください。
:::

---

## 関連項目

- [MT評価](/docs/eval/) — 概要、リーダーボードの価値、および良い/悪いメソッドのガイダンス
- [Eval Harness](/docs/eval/harness) — 評価の実行方法
- [評価データセット](/docs/eval/datasets) — 利用可能なデータセット (EDTeKLA、FLORES+)
- [ランカード仕様](/docs/eval/run-card) — ランカードのJSONスキーマ
- [プラグイン仕様](/docs/reference/plugin-spec) — rosetta側のプラグインインターフェース
- [メソッドリーダーボード](/leaderboard) — ライブベンチマークスコア