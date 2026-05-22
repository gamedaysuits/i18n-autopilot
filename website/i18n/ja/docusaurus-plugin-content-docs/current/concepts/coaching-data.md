---
sidebar_position: 5
title: "コーチングデータ"
---
# コーチングデータ

コーチングデータは、LLMが学習していない言語について教えるためのrosettaのメカニズムです。各翻訳リクエストとともに文法規則、辞書、スタイルノートを提供することで、汎用的なLLMを、既存のMT（機械翻訳）サポートが全くない言語を含め、あらゆる言語に対応するコンテキストを認識した翻訳ツールへと変換します。

## 仕組み

ペアのメソッドを `llm-coached` に設定すると、rosettaは `.rosetta/coaching/<locale>.json` からコーチングファイルを読み込み、その内容をシステムメッセージの一部としてすべてのLLMプロンプトに注入します。LLMは翻訳リクエストとともにあなたの言語規則を参照するため、推測に頼るのではなく、指定された文法や用語に従った出力を生成します。

```
┌──────────────────────────────────────────────────────┐
│ System Message (cached across batches)               │
│ ┌──────────────────────────────────────────────────┐ │
│ │ Base translation rules                           │ │
│ │ + Register instructions                          │ │
│ │ + Grammar rules (from coaching data)             │ │
│ │ + Dictionary entries (from coaching data)         │ │
│ │ + Style notes (from coaching data)               │ │
│ └──────────────────────────────────────────────────┘ │
├──────────────────────────────────────────────────────┤
│ User Message (per batch)                             │
│ ┌──────────────────────────────────────────────────┐ │
│ │ Keys to translate (JSON)                         │ │
│ └──────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────┘
```

コーチングデータはシステムメッセージの一部であるため、**プロンプトキャッシング**の恩恵を受けます。AnthropicやGoogleなどのプロバイダーは繰り返されるシステムプレフィックスをキャッシュするため、コーチングのコンテキストに対するコストはバッチごとではなく、セッションごとに1回支払うだけで済みます。

## コーチングファイルのフォーマット

`.rosetta/coaching/` 内にロケールごとに1つのJSONファイルを作成します。

```json title=".rosetta/coaching/crk.json"
{
  "grammar_rules": [
    "Plains Cree is polysynthetic — a single word can express what English needs a full sentence for",
    "Animate/inanimate noun distinction affects verb conjugation",
    "Use SRO (Standard Roman Orthography) unless script converter handles conversion",
    "Verb stems are modified by prefixes and suffixes to indicate person, number, tense, and evidentiality"
  ],
  "dictionary": {
    "home": "kīwēwin",
    "settings": "isi-nākatohkēwin",
    "search": "nānātawāpahtam",
    "welcome": "tānisi",
    "submit": "ispīhci",
    "cancel": "pōni"
  },
  "style_notes": "Use formal register. Preserve English technical terms in parentheses when no Cree equivalent exists. Avoid loanwords when a descriptive Cree expression exists."
}
```

### フィールド

| フィールド | 型 | 必須 | 説明 |
|-------|------|----------|-------------|
| `grammar_rules` | `string[]` | いいえ | システムプロンプトに注入される文法規則の配列。各規則は、LLMが従うことができる簡潔で実行可能な指示である必要があります。 |
| `dictionary` | `object` | いいえ | 英語の用語 → ターゲット言語の用語のキーバリューマップ。LLMが知らないドメイン固有の語彙に使用されます。 |
| `style_notes` | `string` | いいえ | 自由形式のスタイル指示（レジスター、トーン、フォーマルさの規則）。 |

すべてのフィールドはオプションです。最初は辞書のみで開始し、調整を進めながら文法規則を追加することができます。

## フォールバックの動作

ペアが `llm-coached` に設定されているものの、そのロケール用のコーチングファイルが存在しない場合、rosettaはコンソール警告を出力し、**標準の `llm` メソッドにフォールバック**します。

```
[INFO] No coaching data for "crk" at .rosetta/coaching/crk.json
       Falling back to standard LLM method. Create coaching data for better results.
```

つまり、グローバルに `"defaultMethod": "llm-coached"` を安全に設定できます。コーチングデータがある言語はそれを使用し、残りの言語はエラーなしで標準のLLM翻訳を受け取ります。

## コーチングを使用するタイミング

| シナリオ | 推奨メソッド |
|----------|-------------------|
| Tier 1の言語（フランス語、スペイン語、ドイツ語） | `llm` または `google-translate` — LLMはすでにこれらを熟知しています |
| Tier 2の言語（韓国語、トルコ語、タイ語） | レジスターを指定した `llm` — LLMはスタイルガイダンスがあればこれらを適切に処理します |
| Tier 3の言語（平原クリー語、ヨルバ語、ケチュア語） | `llm-coached` — LLMには文法規則と辞書が必要です |
| 人工言語（クリンゴン語、シンダリン語、クリプトン語） | `llm-coached` — LLMにはある程度の学習データがありますが、修正が必要です |

## 優れたコーチングデータの構築

### 文法規則

規則は説明ではなく**指示**として記述してください。LLMは言語理論を解釈するよりも、指示に従う方が得意です。

```json
// ❌ Descriptive (the LLM learns nothing actionable)
"Plains Cree has animate and inanimate noun classes"

// ✅ Instructive (the LLM knows what to do)
"When translating nouns, check whether the Cree equivalent is animate (NA) or inanimate (NI) — this affects which verb conjugation to use"
```

### 辞書

LLMが間違えたり捏造したりする可能性のある**ドメイン固有の用語**に焦点を当ててください。LLMがすでに処理できる一般的な単語を気にする必要はありません。アプリケーションのUIに特有の用語に集中してください。

### スタイルノート

レジスター、フォーマルさ、および規則について具体的に記述してください。

```json
"style_notes": "Use formal register (vous-form in French). Preserve brand names untranslated. UI labels should be imperative mood ('Save', not 'Saves'). Maximum 40 characters for button text."
```

## コーチングされた翻訳のテスト

[MT Eval Harness](https://github.com/gamedaysuits/gds-mt-eval-harness) を使用して、コーチングされた翻訳をリファレンスコーパスに対してベンチマークテストします。

```bash
# Install the harness
pip install mt-eval-harness

# Run coached translations against your test corpus
mt-eval run --corpus data/crk-corpus.json --model google/gemini-2.5-pro

# Score the results
mt-eval test eval/logs/run_*.json
```

これにより、chrF++、BLEU、および完全一致（exact match）のスコアが得られます。複数のコーチングファイルのバージョンを作成して比較してください。客観的な指標は主観的なレビューに勝ります。

## 関連項目

- [低リソース言語](/docs/guides/low-resource-languages) — ゼロから翻訳パイプラインを構築するための完全なウォークスルー
- [翻訳メソッド](/docs/guides/translation-methods) — 利用可能なすべてのメソッドの比較
- [プラグインの構築](/docs/tutorials/build-a-plugin) — コーチングされたメソッドを再利用可能なプラグインとしてパッケージ化する