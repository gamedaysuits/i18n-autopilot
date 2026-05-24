---
sidebar_position: 3
title: "人工言語・文字・正書法"
---
# 人工言語 (Conlangs)、スクリプト、正書法

rosetta は、LLM のレジスターと決定論的なスクリプトコンバーターを通じて、人工言語 (constructed languages) を第一級でサポートしています。このガイドでは、人工言語サポートの仕組み、必要なフォント、独自の人工言語を追加する方法について説明します。

:::tip なぜ人工言語が重要なのか
人工言語は単なる目新しいものではありません。実際のマイナー言語に使用されるものと全く同じインフラストラクチャを利用します。品質ゲート、コーチングシステム、スクリプト変換パイプラインは、Klingon と Plains Cree で全く同じように機能します。人工言語のパイプラインが機能すれば、低リソース言語のパイプラインも機能します。
:::

---

## サポートされている人工言語

| 言語 | コード | スクリプトコンバーター | 必要なフォント |
|----------|------|:----------------:|:-------------:|
| Klingon | `tlh` | ✅ Romanization → pIqaD | PUA フォント (例: pIqaD qolqoS) |
| Sindarin (Tolkien Elvish) | `x-elvish-s` | ✅ Latin → Tengwar | CSUR PUA フォント |
| Kryptonian | `x-kryptonian` | ✅ Latin → Kryptonian | PUA フォント |
| Pirate English | `x-pirate` | ❌ レジスターのみ | なし |
| Shakespearean English | `x-shakespeare` | ❌ レジスターのみ | なし |
| Yoda-speak | `x-yoda` | ❌ レジスターのみ | なし |

人工言語のコードは、BCP-47 の私用領域の規則に従い `x-` プレフィックスを使用します。ただし、SIL International によって [ISO 639-3](https://iso639-3.sil.org/code/tlh) コードが割り当てられている Klingon (`tlh`) は例外です。

---

## Unicode、PUA、およびフォントの要件

### 私用領域 (Private Use Area)

Klingon (pIqaD)、Sindarin (Tengwar)、および Kryptonian は、Unicode の **私用領域 (Private Use Area: PUA)** の文字を使用します。PUA は U+E000〜U+F8FF の範囲であり、これらのコードポイントには**標準の割り当てがありません**。[ConScript Unicode Registry (CSUR)](https://www.evertype.com/standards/csur/) は、架空のスクリプトに対するコミュニティ合意のマッピングを維持していますが、これらは Unicode 標準の一部ではありません。

これが実際に意味することは以下の通りです。

- 正しいフォントが読み込まれていない場合、PUA のテキストは**空の四角** (□□□) としてレンダリングされます。
- フォントが異なると、同じ PUA コードポイントに異なるグリフがマッピングされる場合があります。
- rosetta には PUA フォントがバンドルされていません。ご自身で読み込む必要があります。
- システムフォントがこれらの文字をレンダリングすることはありません。

### スクリプト別の PUA 範囲

| スクリプト | PUA 範囲 | CSUR リファレンス |
|--------|-----------|---------------|
| Klingon (pIqaD) | U+F8D0–U+F8FF | [CSUR Klingon](https://www.evertype.com/standards/csur/klingon.html) |
| Tengwar (Elvish) | U+E000–U+E07F | [CSUR Tengwar](https://www.evertype.com/standards/csur/tengwar.html) |
| Kryptonian | フォントにより異なる | CSUR 標準なし |

### PUA Web フォントの読み込み

Web アプリケーションで PUA ベースの人工言語テキストを表示するには、CSS を介して適切なフォントを読み込みます。

```css
/* Load a Klingon PUA font */
@font-face {
  font-family: 'pIqaD';
  src: url('/fonts/piqad.woff2') format('woff2');
  unicode-range: U+F8D0-U+F8FF;
}

/* Apply to Klingon text elements */
[lang="tlh"] {
  font-family: 'pIqaD', sans-serif;
}
```

:::warning Unicode サポートは保証されていません
Unicode コンソーシアムは、架空のスクリプトを標準にエンコードすることを[明確に拒否](https://www.unicode.org/faq/private_use.html)しています。PUA の割り当てはコミュニティによって維持されており、フォントの実装間で競合する可能性があります。プロジェクトで使用する正確なフォントを常に指定し、ブラウザ間でレンダリングをテストしてください。
:::

---

## スクリプトコンバーター

### 仕組み

rosetta のスクリプト変換は、**翻訳後のフック (post-translation hook)** です。

1. LLM はテキストを**作業用スクリプト** (通常は Latin または SRO) に翻訳します。
2. [品質ゲート](/docs/concepts/quality-gate)が出力を検証します。
3. 決定論的なコンバーターが、検証済みのテキストを**表示用スクリプト**に変換します。
4. 変換されたテキストがディスクに書き込まれます。

この 2 ステップのアプローチが機能するのは、LLM がラテン文字ベースのスクリプトで作業する際により良い出力を生成するためです。決定論的なコンバーターは、モデルの (しばしば信頼性に欠ける) スクリプトの知識に依存することなく、正しいスクリプト出力を保証します。

### 5つのコンバーターすべて

rosetta には、5 つの組み込みスクリプトコンバーターが同梱されています。

#### Plains Cree: SRO → Syllabics (`crk`)

標準ローマ字正書法 (Standard Roman Orthography) からカナダ先住民音節文字 (Canadian Aboriginal Syllabics) への変換。

```
Input:  "tawâw"
Output: "ᑕᐚᐤ"
```

長母音にはマクロン/サーカムフレックス (ê, î, ô, â) を使用します。コンバーターはすべての SRO ダイアクリティカルマークを処理し、正しい音節文字にマッピングします。Cree の完全なパイプラインについては、[低リソース言語のサポート](/docs/guides/low-resource-languages)を参照してください。

#### Serbian: Latin → Cyrillic (`sr`)

セルビア語向けの決定論的なラテン文字からキリル文字への変換。

```
Input:  "zdravo"
Output: "здраво"
```

これは、二重音字 (lj → љ, nj → њ, dž → џ) を含む、セルビア語アルファベットの完全なマッピングを処理します。

#### Klingon: Romanization → pIqaD (`tlh`)

Marc Okrand のローマ字表記システムから pIqaD PUA 文字への変換。

```
Input:  "Qapla'"    (romanized Klingon)
Output: [pIqaD PUA] (requires pIqaD font to render)
```

#### Sindarin: Latin → Tengwar (`x-elvish-s`)

Tolkien の Sindarin モードの Tengwar マッピング。

```
Input:  "elen síla"  (Latin Sindarin)
Output: [Tengwar PUA] (requires Tengwar font to render)
```

#### Kryptonian: Latin → Kryptonian (`x-kryptonian`)

ファン辞書による Kryptonian スクリプトのマッピング。

```
Input:  "Kal-El"
Output: [Kryptonian PUA] (requires Kryptonian font to render)
```

### コンバーターのトリガー

言語設定で `scripts` フィールドを設定します。組み込みコンバーターの場合、これは言語コードから自動検出されます。

```json
{
  "languages": {
    "sr": { "scripts": "sr" },
    "crk": {}
  }
}
```

Plains Cree (`crk`) は自動検出されるため、明示的に `scripts` を設定する必要はありません。

---

## 複数スクリプト言語

一部の実際の言語では、複数のアクティブなスクリプトが使用されています。

| 言語 | スクリプト | rosetta のアプローチ |
|----------|---------|-----------------|
| セルビア語 | Latin + Cyrillic | スクリプトコンバーター (`sr`) — ラテン文字で翻訳し、キリル文字に変換 |
| 中国語 | Simplified + Traditional | 異なるレジスターを持つ個別のロケールコード (`zh` と `zh-TW`) |

両方のスクリプトが同じ対象読者に提供される言語 (セルビア語) の場合は、スクリプトコンバーターを使用します。スクリプトが異なる対象読者に提供される言語 (中国本土向けの簡体字中国語、台湾/香港向けの繁体字中国語) の場合は、個別のロケールコードを使用します。

---

## 正書法に関する注意事項

レジスターは単なるトーンではありません。LLM を正しい記述規則へと導く**正書法の指示 (orthographic instructions)** を伝達します。

### 丁寧な敬称表現

rosetta の組み込みレジスターには、各言語の文化的に適切な敬称表現が含まれています。

| 言語 | 丁寧な形式 | レジスターの指示 |
|----------|------------|---------------------|
| ドイツ語 | Sie | `Use Sie-form for formal address` |
| フランス語 | vous | `Use vous-form` |
| ロシア語 | вы | `Professional register with вы-form` |
| トルコ語 | siz | `Professional register with siz-form` |
| 韓国語 | 합쇼체 | `Formal Korean (합쇼체)` |
| 日本語 | です/ます | `Polite professional register (です/ます form)` |
| ポーランド語 | Pan/Pani | `Professional register with Pan/Pani form` |

### ジェンダーインクルーシブな記述

各言語カードには、言語固有のアドバイスが含まれる `gender.inclusiveGuidance` フィールドがあります。これはレジスターのプリセットとは別に LLM の翻訳プロンプトに注入されるため、ユーザーがどのフォーマル度のプリセットを選択しても一貫して適用されます。

- **フランス語**: 中点表記を用いたインクルーシブな記述 (Écriture inclusive) (例: "Connecté·e")
- **ドイツ語**: コロン表記 (Doppelpunkt) (例: "Benutzer:innen")
- **スペイン語**: ジェンダーニュートラルな再構築を推奨。フォールバックとしてスラッシュ表記 (例: "usuario/a") を使用

カードに特定のガイダンスがない言語 (韓国語や人工言語など) の場合、システムは一般的なルールにフォールバックします。*"ジェンダーニュートラルな形式、または利用可能な最もインクルーシブなオプションを優先してください。"*

### RTL スクリプトの要件

アラビア語、ヘブライ語、ペルシア語、ウルドゥー語のレジスターはすべて、右から左 (RTL) への要件を記述しています: `Ensure text reads naturally in RTL layout contexts.`

### レジスターのオーバーライド

すべてのレジスターは設定値です。プロジェクトのトーンに合わせてオーバーライドできます。

```json
{
  "languages": {
    "fr": {
      "register": "Casual French. Use tu-form. Conversational blog tone. Gender-neutral when possible."
    },
    "de": {
      "register": "Informal German. Use du-form. Tech startup voice."
    }
  }
}
```

設定の完全なリファレンスについては、[設定](/docs/getting-started/configuration)を参照してください。

---

## 新しい人工言語の追加

### ステップバイステップ

1. **BCP-47 私用コードの選択**: `x-` プレフィックスを使用します (例: `x-dothraki`, `x-valyrian`)。

2. **設定への追加**:

```json
{
  "languages": {
    "x-dothraki": {
      "register": "Dothraki language. Use David J. Peterson's vocabulary from the Living Language Dothraki textbook. Harsh, direct tone. No articles, no verb 'to be'."
    }
  }
}
```

3. **(オプション) スクリプトコンバーターの追加**: 人工言語がラテン文字以外の表示用スクリプトを使用する場合は、`lib/scripts.js` にコンバーターを追加し、`SCRIPT_CONVERTERS` に登録します。

4. **テスト**: `i18n-rosetta sync --dry` を実行して、ファイルを書き込まずに翻訳をプレビューします。

5. **品質ゲートの確認**: 人工言語に合わせて[品質ゲート](/docs/concepts/quality-gate)の調整が必要になる場合があります。特に、人工言語が PUA 文字を使用している場合は `requireNonLatin` のチェックが必要です。

:::note 人工言語の品質は LLM の知識に依存します
LLM は、トレーニングデータで見たことのある人工言語にのみ翻訳できます。十分に文書化されている人工言語 (Klingon、Sindarin、Dothraki) はうまく機能します。マイナーな人工言語や新しく発明された人工言語では、一貫性のない結果が生じる可能性があります。品質を向上させるには、[コーチングデータ](/docs/concepts/coaching-data)を使用してください。
:::

---

## 関連項目

- [サポートされている言語](/docs/reference/supported-languages) — メソッドの可用性を含む完全な言語テーブル
- [スクリプトコンバーター](/docs/concepts/script-converters) — 変換パイプラインの技術的な詳細
- [翻訳メソッド](/docs/guides/translation-methods) — 各翻訳メソッドの仕組み
- [設定](/docs/getting-started/configuration) — 言語およびレジスターのセットアップを含む設定リファレンス
- [低リソース言語のサポート](/docs/guides/low-resource-languages) — 実際のマイナー言語に適用される同一のインフラストラクチャ