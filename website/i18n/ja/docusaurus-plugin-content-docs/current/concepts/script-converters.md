---
sidebar_position: 6
title: "スクリプトコンバーター"
---
# スクリプトコンバーター

スクリプトコンバーターは、ある書記体系から別の書記体系へテキストを変換する、決定論的でLLMを使用しない翻訳後のフックです。これにより、「一度翻訳すれば、複数のスクリプトでレンダリングできる」ワークフローが実現します。つまり、作業用のスクリプト（通常はラテン文字）に翻訳し、その後自動的に表示用のスクリプトに変換します。

## なぜスクリプトコンバーターが必要なのか？

一部の言語では、同じ話し言葉に対して複数のスクリプト（文字体系）を使用します。

- **Plains Cree**（平原クリー語）: 編集用のSRO（ラテン文字） → 表示用のSyllabics（音節文字: ᓀᐦᐃᔭᐍᐏᐣ）
- **Serbian**（セルビア語）: 国際的な用途のラテン文字 → 国内向けのキリル文字
- **Klingon**（クリンゴン語）: 入力用のローマ字表記 → 表示用のpIqaD (  )

ラテン文字以外のスクリプトに直接翻訳すると、問題が発生します。LLMが文字をハルシネーション（幻覚）したり、JSONファイルのバージョン管理が困難になったり、diffツールで変更を比較できなくなったりするためです。スクリプトコンバーターは、翻訳をバージョン管理しやすいスクリプトで保持し、同期時に決定論的に変換することで、この問題を解決します。

## 利用可能なコンバーター

Rosettaには、5つの組み込みスクリプトコンバーターが同梱されています。

| ロケール | 変換元 | 変換先 | タイプ | フォントの必要性 |
|--------|------|----|------|----------------|
| `crk` | SRO (Standard Roman Orthography) | Cree Syllabics | 決定論的 | 不要 — ネイティブUnicode |
| `sr` | ラテン文字 | キリル文字 | 決定論的 | 不要 — ネイティブUnicode |
| `tlh` | ローマ字表記 | pIqaD | 決定論的 | 必要 — PUA U+F8D0–F8FF |
| `x-elvish-s` | ラテン文字 | Tengwar (Mode of Beleriand) | 決定論的 | 必要 — PUA U+E000–E07F |
| `x-kryptonian` | ラテン文字 | Kryptonian | フォントベースの暗号 | 必要 — PUA U+E100–E119 |

### 決定論的 vs. フォントベース

- **決定論的コンバーター**（Cree、Serbian、Klingon、Tengwar）は、言語学的ルールを使用して実際の文字対文字のマッピングを実行します。出力には実際のUnicode文字が含まれます。
- **フォントベースのコンバーター**（Kryptonian）は1対1の換字式暗号であり、出力は特定のフォントを読み込んだ場合にのみ正しくレンダリングされるUnicode PUA文字になります。

## 仕組み

スクリプトコンバーターは、翻訳の**後**に後処理ステップとして実行されます。パイプラインは以下の通りです。

```
Source (English) → LLM Translation → Working Script → Script Converter → Display Script
```

例えば、Plains Cree（平原クリー語）の場合は以下のようになります。
```
"Welcome" → LLM → "tānisi" (SRO) → Converter → "ᑖᓂᓯ" (Syllabics)
```

### 貪欲な左から右へのマッチング

すべてのコンバーターは同じアルゴリズムを使用します。各文字位置で、最初に可能な限り最長のマッチを試し、その後徐々に短いマッチを試します。どのパターンにもマッチしない文字（スペース、句読点、数字）は、そのまま変更されずに通過します。

これにより、二重音字（ダイグラフ）や三重音字（トリグラフ）が正しく処理されます。
- Klingon: `tlh` → 単一のpIqaD文字（`t` + `l` + `h` ではない）
- Serbian: `nj` → `њ`（`н` + `ј` ではない）
- Cree: `twê` → 単一の音節文字（`t` + `w` + `ê` ではない）

## スクリプトコンバーターの使用

ロケールコードが登録されたコンバーターと一致すると、スクリプトコンバーターが自動的に有効になります。設定は不要で、ターゲットロケールを設定するだけです。

```json title="i18n-rosetta.config.json"
{
  "pairs": {
    "en:crk": {
      "method": "llm-coached",
      "model": "google/gemini-2.5-pro"
    }
  }
}
```

Rosettaが `en:crk` ペアを同期する際、翻訳は最初にSROで生成され、その後 `crk.json` に書き込まれる前に自動的にSyllabicsに変換されます。

### コンバーターのステータス確認

```bash
npx i18n-rosetta status
```

ステータス出力には、どのペアでスクリプトコンバーターが有効になっているか、およびどのような変換が実行されるかが表示されます。

## Webフォントの要件

3つのコンバーターは、カスタムWebフォントを必要とするUnicode私用領域（PUA）の文字を出力します。

### Klingon (pIqaD)

CSUR互換のpIqaDフォント（例: "pIqaD qolqoS" や "Klingon pIqaD HaSta"）をインストールします。

```css
@font-face {
  font-family: 'pIqaD';
  src: url('/fonts/pIqaD.woff2') format('woff2');
  unicode-range: U+F8D0-F8FF;
}

:lang(tlh) {
  font-family: 'pIqaD', sans-serif;
}
```

### Tengwar (Sindarin)

CSUR互換のTengwarフォント（例: "Tengwar Formal CSUR" や "Tengwar Annatar"）をインストールします。

```css
@font-face {
  font-family: 'Tengwar';
  src: url('/fonts/tengwar-formal-csur.woff2') format('woff2');
  unicode-range: U+E000-E07F;
}

:lang(x-elvish-s) {
  font-family: 'Tengwar', serif;
}
```

### Kryptonian

PUAコードポイント U+E100–E119 にマッピングされたKryptonianフォントをインストールします。

```css
@font-face {
  font-family: 'Kryptonian';
  src: url('/fonts/kryptonian.woff2') format('woff2');
  unicode-range: U+E100-E119;
}

:lang(x-kryptonian) {
  font-family: 'Kryptonian', sans-serif;
}
```

:::tip Kryptonianの代替アプローチ
Kryptonianは純粋なA-Zの暗号であるため、スクリプトコンバーターを完全にスキップし、CSSを介してラテン文字のテキストにフォントを適用することができます。これはWeb展開においてより簡単な場合が多く、Kryptonianフォントを提供し、関連する要素に `font-family` を設定するだけです。
:::

## カスタムコンバーターの追加

新しい言語のコンバーターを追加するには、`lib/scripts.js` を編集します。

1. **変換マップの作成** — `[from, to]` ペアの順序付き配列（最長のシーケンスを先頭にする）
2. **コンバーター関数の作成** — 貪欲な左から右へのスキャナー（テンプレートとして `sroToSyllabics` を使用）
3. `SCRIPT_CONVERTERS` オブジェクトにロケールコードをキーとして**登録する**
4. `registers.js` にある言語の登録エントリに **`script` フィールドを追加する**

```javascript
// Example: adding a converter for Cherokee (chr)
const LATIN_TO_CHEROKEE_MAP = [
  ['ga', 'Ꭶ'], ['ka', 'Ꭷ'], ['ge', 'Ꭸ'], // ...
];

function latinToCherokee(text) {
  // Same greedy left-to-right pattern as other converters
}

SCRIPT_CONVERTERS['chr'] = {
  from: 'Latin',
  to: 'Cherokee Syllabary',
  type: 'deterministic',
  converter: latinToCherokee,
};
```

---

## 関連項目

- [人工言語、スクリプト、正書法](/docs/guides/conlangs-scripts-orthography) — PUAフォント、Unicode、新しいコンバーターの追加
- [品質ゲート](/docs/concepts/quality-gate) — スクリプト変換の前に実行される検証
- [サポートされている言語](/docs/reference/supported-languages) — スクリプトコンバーターを持つ言語
- [低資源言語のサポート](https://mtevalarena.org/docs/community/low-resource-languages) — コンテキストにおけるSRO→Syllabics変換
- [クックブック: FSTゲートパイプライン](https://mtevalarena.org/docs/tutorials/fst-gated-pipeline) — マルチステージパイプラインにおけるスクリプト変換