---
sidebar_position: 3
title: "人工言語・文字・正書法"
---
# 人工言語、文字、正書法

rosettaは、LLMのレジスターと決定論的なスクリプトコンバーターを通じて、人工言語（Conlang）を第一級（ファーストクラス）でサポートしています。このガイドでは、人工言語サポートの仕組み、必要なフォント、独自の人工言語を追加する方法について説明します。

:::tip なぜ人工言語が重要なのか
人工言語は単なる目新しいものではありません。実際のリソースが不足している言語に使用されるものと全く同じインフラストラクチャを利用します。品質ゲート、コーチングシステム、スクリプト変換パイプラインは、KlingonとPlains Creeでまったく同じように機能します。人工言語のパイプラインが機能すれば、低リソース言語のパイプラインも機能します。
:::

---

## サポートされている人工言語

| 言語 | コード | スクリプトコンバーター | 必要なフォント |
|----------|------|:----------------:|:-------------:|
| Klingon | `tlh` | ✅ ローマ字 → pIqaD | PUAフォント（例: pIqaD qolqoS） |
| Sindarin (Tolkien Elvish) | `x-elvish-s` | ✅ ラテン文字 → Tengwar | CSUR PUAフォント |
| Kryptonian | `x-kryptonian` | ✅ ラテン文字 → Kryptonian | PUAフォント |
| Pirate English | `x-pirate` | ❌ レジスターのみ | なし |
| Shakespearean English | `x-shakespeare` | ❌ レジスターのみ | なし |
| Yoda-speak | `x-yoda` | ❌ レジスターのみ | なし |

人工言語のコードは、BCP-47の私用領域（private-use）の規則に従い `x-` プレフィックスを使用します。ただし、SIL Internationalによって[ISO 639-3](https://iso639-3.sil.org/code/tlh)コードが割り当てられているKlingon（`tlh`）は例外です。

---

## Unicode、PUA、およびフォントの要件

### 私用領域（Private Use Area）

Klingon（pIqaD）、Sindarin（Tengwar）、およびKryptonianは、Unicodeの**私用領域（PUA: Private Use Area）**の文字を使用します。PUAはU+E000〜U+F8FFの範囲であり、これらのコードポイントには**標準の割り当てがありません**。[ConScript Unicode Registry (CSUR)](https://www.evertype.com/standards/csur/)は、架空の文字に対するコミュニティ合意のマッピングを維持していますが、これらはUnicode標準の一部ではありません。

これが実際に意味することは以下の通りです：

- 適切なフォントが読み込まれていない場合、PUAのテキストは**空の四角**（□□□）としてレンダリングされます
- フォントが異なると、同じPUAコードポイントに異なるグリフがマッピングされる場合があります
- rosettaにはPUAフォントが同梱されていません。ご自身で読み込む必要があります
- システムフォントがこれらの文字をレンダリングすることはありません

### スクリプト別のPUA範囲

| スクリプト | PUA範囲 | CSURリファレンス |
|--------|-----------|---------------|
| Klingon (pIqaD) | U+F8D0–U+F8FF | [CSUR Klingon](https://www.evertype.com/standards/csur/klingon.html) |
| Tengwar (Elvish) | U+E000–U+E07F | [CSUR Tengwar](https://www.evertype.com/standards/csur/tengwar.html) |
| Kryptonian | フォントにより異なる | CSUR標準なし |

### PUA Webフォントの読み込み

rosettaには、PUA Webフォントをダウンロードして管理するための組み込みコマンドが含まれています：

```bash
# See which fonts are needed for your configured languages
i18n-rosetta fonts list

# Download all needed fonts (auto-detects project type for output directory)
i18n-rosetta fonts install

# Also generate a CSS snippet with @font-face declarations
i18n-rosetta fonts install --css
```

`fonts install` コマンドは、検証済みのオープンソースリポジトリからダウンロードします：

| フォント | スクリプト | ライセンス | ソース |
|------|--------|---------|--------|
| pIqaD qolqoS | Klingon | SIL Open Font License 1.1 | [GitHub](https://github.com/dadap/pIqaD-fonts) |
| FreeMonoTengwar | Tengwar | GNU GPL v3 (フォント例外付き) | [SourceForge](https://sourceforge.net/projects/freetengwar/) |
| *(ユーザー提供)* | Kryptonian | 異なる | 利用可能なオープンソースのPUAフォントなし |

出力ディレクトリは、プロジェクトの構造から自動検出されます（Docusaurus → `static/fonts/`、Hugo → `static/fonts/`、デフォルト → `public/fonts/`）。`--dir` で上書きできます。

フォントを手動で管理したい場合は、CSSに `@font-face` ルールを追加します：

```css
@font-face {
  font-family: 'pIqaD';
  src: url('/fonts/pIqaDqolqoS.ttf') format('truetype');
  font-display: swap;
  unicode-range: U+F8D0-F8FF;
}

/* Apply to Klingon text elements */
[lang="tlh"], [data-script="piqad"] {
  font-family: 'pIqaD', sans-serif;
}
```

:::warning Unicodeサポートは保証されていません
Unicodeコンソーシアムは、標準規格に架空の文字をエンコードすることを[明確に拒否](https://www.unicode.org/faq/private_use.html)しています。PUAの割り当てはコミュニティによって維持されており、フォントの実装間で競合する可能性があります。常にプロジェクトで使用する正確なフォントを指定し、ブラウザ間でレンダリングをテストしてください。
:::

---

## スクリプトコンバーター

### 仕組み

rosettaのスクリプト変換は、**翻訳後のフック（post-translation hook）**です：

1. LLMがテキストを**作業用スクリプト**（通常はラテン文字またはSRO）に翻訳します
2. [品質ゲート](/docs/concepts/quality-gate)が出力を検証します
3. 決定論的コンバーターが、検証されたテキストを**表示用スクリプト**に変換します
4. 変換されたテキストがディスクに書き込まれます

この2段階のアプローチが機能するのは、LLMがラテン文字ベースのスクリプトで作業する際により良い出力を生成するためです。決定論的コンバーターは、モデルの（しばしば信頼性に欠ける）スクリプトの知識に依存することなく、正確なスクリプト出力を保証します。

### 5つのコンバーターすべて

rosettaには、5つの組み込みスクリプトコンバーターが同梱されています：

#### Plains Cree: SRO → 音節文字 (`crk`)

標準ローマ字正書法（SRO）からカナダ先住民音節文字への変換。

```
Input:  "tawâw"
Output: "ᑕᐚᐤ"
```

長母音にはマクロン/サーカムフレックス（ê、î、ô、â）を使用します。コンバーターはすべてのSROのダイアクリティカルマークを処理し、正しい音節文字にマッピングします。Creeの完全なパイプラインについては、[低リソース言語のサポート](https://mtevalarena.org/docs/community/low-resource-languages)を参照してください。

#### Serbian: ラテン文字 → キリル文字 (`sr`)

Serbian向けの決定論的なラテン文字からキリル文字への変換。

```
Input:  "zdravo"
Output: "здраво"
```

これは、二重音字（lj → љ、nj → њ、dž → џ）を含む、Serbianの完全なアルファベットマッピングを処理します。

#### Klingon: ローマ字 → pIqaD (`tlh`)

マーク・オークランド（Marc Okrand）のローマ字システムからpIqaDのPUA文字への変換。

```
Input:  "Qapla'"    (romanized Klingon)
Output: [pIqaD PUA] (requires pIqaD font to render)
```

#### Sindarin: ラテン文字 → Tengwar (`x-elvish-s`)

トールキン（Tolkien）のSindarinモードのTengwarマッピング。

```
Input:  "elen síla"  (Latin Sindarin)
Output: [Tengwar PUA] (requires Tengwar font to render)
```

#### Kryptonian: ラテン文字 → Kryptonian (`x-kryptonian`)

ファン辞書によるKryptonianスクリプトのマッピング。

```
Input:  "Kal-El"
Output: [Kryptonian PUA] (requires Kryptonian font to render)
```

### コンバーターのトリガー

言語設定で `scripts` フィールドを設定します。組み込みコンバーターの場合、これは言語コードから自動検出されます：

```json
{
  "languages": {
    "sr": { "scripts": "sr" },
    "crk": {}
  }
}
```

Plains Cree（`crk`）は自動検出されるため、明示的に `scripts` を設定する必要はありません。

---

## 複数スクリプト言語

一部の実際の言語では、複数のアクティブなスクリプトが使用されます：

| 言語 | スクリプト | rosettaのアプローチ |
|----------|---------|-----------------|
| Serbian | ラテン文字 + キリル文字 | スクリプトコンバーター（`sr`） — ラテン文字で翻訳し、キリル文字に変換 |
| Chinese | 簡体字 + 繁体字 | 異なるレジスターを持つ個別のロケールコード（`zh` と `zh-TW`） |

両方のスクリプトが同じ対象読者に提供される言語（Serbian）の場合は、スクリプトコンバーターを使用します。スクリプトが異なる対象読者に提供される言語（中国本土向けのChinese Simplified、台湾/香港向けのTraditional）の場合は、個別のロケールコードを使用します。

---

## 正書法に関する注意事項

レジスターは単なるトーンではありません。LLMを正しい記述規則へと導く**正書法の指示**を伝達します。

### 丁寧な敬称表現

rosettaの組み込みレジスターには、各言語において文化的に適切な丁寧な敬称が含まれています：

| 言語 | 丁寧な形式 | レジスターの指示 |
|----------|------------|---------------------|
| German | Sie | `Use Sie-form for formal address` |
| French | vous | `Use vous-form` |
| Russian | вы | `Professional register with вы-form` |
| Turkish | siz | `Professional register with siz-form` |
| Korean | 합쇼체 | `Formal Korean (합쇼체)` |
| Japanese | です/ます | `Polite professional register (です/ます form)` |
| Polish | Pan/Pani | `Professional register with Pan/Pani form` |

### ジェンダーインクルーシブな記述

各言語カードには、言語固有のアドバイスが含まれる `gender.inclusiveGuidance` フィールドがあります。これはレジスターのプリセットとは別にLLMの翻訳プロンプトに注入されるため、ユーザーがどの丁寧さのプリセットを選択しても一貫して適用されます：

- **French**: 中点（インターパンクト）表記を使用した包括的な記述（Écriture inclusive）（例: "Connecté·e"）
- **German**: コロン（Doppelpunkt）表記（例: "Benutzer:innen"）
- **Spanish**: ジェンダーニュートラルな再構築を推奨。フォールバックとしてスラッシュ表記（例: "usuario/a"）を使用

カードに特定のガイダンスがない言語（Koreanや人工言語など）の場合、システムは一般的なルールにフォールバックします：*「ジェンダーニュートラルな形式、または利用可能な最も包括的なオプションを優先する」*

### RTL（右から左）スクリプトの要件

Arabic、Hebrew、Persian、およびUrduのレジスターはすべて、右から左への記述要件を記述しています：`Ensure text reads naturally in RTL layout contexts.`

### レジスターの上書き

すべてのレジスターは設定値です。プロジェクトのトーンに合わせて上書きしてください：

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

完全な設定リファレンスについては、[設定](/docs/getting-started/configuration)を参照してください。

---

## 新しい人工言語の追加

### ステップバイステップ

1. **BCP-47の私用領域コードを選択する**: `x-` プレフィックスを使用します（例: `x-dothraki`、`x-valyrian`）。

2. **設定に追加する**:

```json
{
  "languages": {
    "x-dothraki": {
      "register": "Dothraki language. Use David J. Peterson's vocabulary from the Living Language Dothraki textbook. Harsh, direct tone. No articles, no verb 'to be'."
    }
  }
}
```

3. **(オプション) スクリプトコンバーターを追加する**: 人工言語がラテン文字以外の表示用スクリプトを使用する場合は、`lib/scripts.js` にコンバーターを追加し、`SCRIPT_CONVERTERS` に登録します。

4. **テストする**: `i18n-rosetta sync --dry` を実行して、ファイルを書き込まずに翻訳をプレビューします。

5. **品質ゲートを確認する**: 人工言語に合わせて[品質ゲート](/docs/concepts/quality-gate)の調整が必要になる場合があります。人工言語がPUA文字を使用する場合は、特に `requireNonLatin` のチェックが必要です。

:::note 人工言語の品質はLLMの知識に依存します
LLMは、トレーニングデータで見たことのある人工言語にのみ翻訳できます。十分に文書化された人工言語（Klingon、Sindarin、Dothraki）はうまく機能します。マイナーな人工言語や新しく発明された人工言語では、一貫性のない結果が生じる可能性があります。品質を向上させるには、[コーチングデータ](/docs/concepts/coaching-data)を使用してください。
:::

---

## 関連項目

- [サポートされている言語](/docs/reference/supported-languages) — メソッドの可用性を含む完全な言語テーブル
- [スクリプトコンバーター](/docs/concepts/script-converters) — 変換パイプラインの技術的な詳細
- [翻訳メソッド](/docs/guides/translation-methods) — 各翻訳メソッドの仕組み
- [設定](/docs/getting-started/configuration) — 言語およびレジスターのセットアップを含む設定リファレンス
- [低リソース言語のサポート](https://mtevalarena.org/docs/community/low-resource-languages) — 実際のリソースが不足している言語に適用される同じインフラストラクチャ