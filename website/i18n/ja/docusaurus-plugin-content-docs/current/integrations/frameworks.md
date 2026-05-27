# インテグレーションガイド

主要なフレームワークで i18n-rosetta をセットアップするためのステップバイステップのガイドです。

---

## API キーのセットアップ

フレームワークと統合する前に、翻訳 API キーが必要です。Rosetta は2つのプロバイダーをサポートしています。

### オプション A: OpenRouter (推奨)

[OpenRouter](https://openrouter.ai) は、200以上の LLM モデルに対応する統合 API を提供しています。無料枠も利用可能です。

```bash
# Sign up at https://openrouter.ai, then:
export OPENROUTER_API_KEY=sk-or-v1-...

# Or add to .env.local:
OPENROUTER_API_KEY=sk-or-v1-your-key-here
```

最適な用途: コンテンツの多いプロジェクト、Markdown の翻訳、コンテンツを認識した保護（コードブロック、ショートコード、補間変数など）が必要なプロジェクト。

### オプション B: Google Translate

```bash
export GOOGLE_TRANSLATE_API_KEY=...
```

最適な用途: 大量のキーと値の文字列ペア（130言語以上に対応）。Markdown コンテンツには**推奨されません** — Google Translate はコードブロック、ショートコード、補間変数を認識しません。

Google Translate を明示的に使用する場合:

```bash
i18n-rosetta sync --method google-translate
```

> **ヒント**: `GOOGLE_TRANSLATE_API_KEY` のみが設定されている場合（OpenRouter キーがない場合）、rosetta は自動的に Google Translate に切り替わります。

---

## Hugo (TOML / YAML / Markdown)

### プロジェクト構造

Hugo は文字列の翻訳に `i18n/` を使用し、ページコンテンツに `content/` を使用します。

```
my-hugo-site/
├── i18n/
│   ├── en.toml             ← source of truth
│   ├── fr.toml
│   └── ja.toml
├── content/
│   ├── posts/
│   │   ├── hello.md        ← source (English)
│   │   ├── hello.fr.md
│   │   └── hello.ja.md
│   └── about.md
└── .env.local
```

### セットアップ

```bash
npm install --save-dev i18n-rosetta
```

```bash
# .env.local
OPENROUTER_API_KEY=sk-or-v1-your-key-here
```

`i18n-rosetta.config.json` を作成します:

```json
{
  "version": 3,
  "inputLocale": "en",
  "localesDir": "./i18n",
  "contentDir": "./content",
  "format": "auto",
  "languages": ["fr", "de", "ja", "es", "ko", "zh"]
}
```

```bash
i18n-rosetta sync           # sync i18n string files + content files
i18n-rosetta sync --dry     # preview changes without writing
```

### コンテンツ翻訳の詳細

**フロントマター (Front matter)**: YAML (`---`) と TOML (`+++`) の両方の区切り文字をサポートしています。デフォルトでは `title`、`description`、`summary`、`subtitle`、`caption`、および `linkTitle` を翻訳します。その他のすべてのフィールド（date、draft、tags、weight、slug など）は保持されます。設定の `translatableFields` でカスタマイズできます。

**ブロックの保護**: コードブロック、Hugo のショートコード (`{{< >}}`, `{{% %}}`)、インラインコード、および生の HTML は、Unicode のセンチネルプレースホルダーを使用して自動的に保護されます。これらは変更されずにそのまま通過します。

**ファイル名の規則**: Hugo のファイル名による翻訳パターンに従います。
- `my-post.md` → `my-post.fr.md`
- `my-post.en.md` → `my-post.fr.md` (ソースのサフィックスを削除)

**既存ファイルのスキップ**: 既存の翻訳済みファイルが上書きされることはありません。強制的に再翻訳するには、ターゲットファイルを削除してください。

### 複数形

TOML および YAML のロケールは、CLDR の複数形をサポートしています。

```toml
[items]
one = "{{ .Count }} item"
other = "{{ .Count }} items"
```

差分比較のために内部的には `items.one` および `items.other` として表現され、書き込み時に正しいセクション形式に再シリアライズされます。

---

## next-intl (JSON)

### プロジェクト構造

```
my-app/
├── messages/
│   └── en.json        ← source of truth
├── src/
│   ├── i18n/
│   │   ├── routing.ts
│   │   └── request.ts
│   └── middleware.ts
└── .env.local
```

### セットアップ

```bash
npm install --save-dev i18n-rosetta
```

`i18n-rosetta.config.json` を作成します:

```json
{
  "version": 3,
  "inputLocale": "en",
  "localesDir": "./messages",
  "languages": ["fr", "de", "ja", "es", "ko", "zh", "pt", "ar"]
}
```

```bash
npx i18n-rosetta sync
```

`messages/fr.json` や `messages/ja.json` などを作成します — ネストされたキー構造を保持したまま完全に翻訳されます。next-intl はこれらを自動的に読み込みます。

### 開発ワークフロー

```json
{
  "scripts": {
    "dev": "i18n-rosetta watch & next dev",
    "i18n:sync": "i18n-rosetta sync",
    "i18n:audit": "i18n-rosetta audit"
  }
}
```

---

## react-i18next (JSON)

### フラットなファイル構造 (推奨)

```
locales/
├── en.json
├── fr.json
└── ja.json
```

```json
{
  "version": 3,
  "inputLocale": "en",
  "localesDir": "./locales",
  "languages": ["fr", "de", "ja"]
}
```

### ネストされたディレクトリ構造

`{locale}/{namespace}.json` 構造を使用する場合は、フラット化 → 翻訳 → フラット化解除を行う同期スクリプトを作成してください。詳細については [react-i18next のドキュメント](https://react.i18next.com/)を参照してください。