---
sidebar_position: 3
title: "Hugo多言語サイト"
description: "クックブック: i18n-rosettaで文字列ファイルとMarkdownコンテンツの両方の翻訳を処理し、本格的なHugo多言語サイトを構築します。"
---
# クックブック: Hugo多言語サイト

JSON文字列ファイルとMarkdownコンテンツの翻訳の両方を処理するi18n-rosettaを使用して、Hugoの多言語システムをセットアップします。ここでは、プロジェクトのセットアップから本番環境へのデプロイまでの完全なワークフローを解説します。

**構築するもの:** 英語、フランス語、日本語に対応したHugoサイト。ロケールファイルによる文字列翻訳と、Markdown処理によるコンテンツ翻訳を行います。

---

## プロジェクト構成

Rosettaは、Hugoの**ファイル名ベース（filename-based）**の翻訳モードを使用します。翻訳されたファイルはソースファイルと同じディレクトリに配置され、ファイル名に言語のサフィックスが追加されます（例: `about.fr.md`）。

```
my-hugo-site/
├── content/
│   └── en/
│       ├── _index.md
│       ├── _index.fr.md           ← rosetta generates
│       ├── _index.ja.md           ← rosetta generates
│       ├── about.md
│       ├── about.fr.md            ← rosetta generates
│       ├── about.ja.md            ← rosetta generates
│       └── blog/
│           ├── first-post.md
│           ├── first-post.fr.md   ← rosetta generates
│           └── first-post.ja.md   ← rosetta generates
├── i18n/
│   ├── en.json
│   ├── fr.json                    ← rosetta generates
│   └── ja.json                    ← rosetta generates
└── hugo.toml
```

:::note Hugoのi18nモード
Hugoは2つの翻訳戦略をサポートしています。**ファイル名ベース**（`about.md`の隣に`about.fr.md`を配置）と、**ディレクトリベース**（別々の`content/fr/about.md`ツリー）です。Rosettaの`getTargetContentPath()`機能はソースファイル名に言語サフィックスを追加してターゲットパスを生成するため、Rosettaではファイル名ベースの翻訳を使用します。rosettaを使用する際は、`hugo.toml`がファイル名ベースの翻訳用に設定されていることを確認してください。
:::

## ステップ1: Hugoの設定

```toml title="hugo.toml"
defaultContentLanguage = 'en'

[languages]
  [languages.en]
    languageName = 'English'
    weight = 1
  [languages.fr]
    languageName = 'Français'
    weight = 2
  [languages.ja]
    languageName = '日本語'
    weight = 3
```

## ステップ2: Rosettaの設定

Rosettaでは、ロケールファイルのパス（JSON文字列用）とコンテンツディレクトリ（Markdown用）の2つを設定する必要があります。

```json title="i18n-rosetta.config.json"
{
  "version": 3,
  "inputLocale": "en",
  "localesDir": "./i18n",
  "contentDir": "./content",
  "model": "google/gemini-3.5-flash",
  "pairs": {
    "en:fr": { "method": "llm" },
    "en:ja": { "method": "llm", "model": "openai/gpt-4o" }
  },
  "languages": {
    "fr": { "name": "French", "register": "Formal (vous-form)" },
    "ja": { "name": "Japanese", "register": "Polite/formal" }
  }
}
```

## ステップ3: ソースコンテンツの作成

### 文字列翻訳 (i18n/)

```json title="i18n/en.json"
{
  "nav": {
    "home": "Home",
    "about": "About",
    "blog": "Blog",
    "contact": "Contact"
  },
  "footer": {
    "copyright": "© 2026 My Company. All rights reserved.",
    "privacy": "Privacy Policy"
  }
}
```

### Markdownコンテンツ (content/en/)

```markdown title="content/en/about.md"
---
title: "About Us"
description: "Learn more about our team and mission"
date: 2026-01-15
---

We build software that helps businesses communicate across languages.

Our platform supports **real-time translation** for over 30 languages,
with specialized support for low-resource languages.

## Our Mission

Language should never be a barrier to understanding.

## The Team

{{< team-grid >}}
```

## ステップ4: 同期の実行

```bash
npx i18n-rosetta sync
```

Rosettaは両方のタイプを処理します。

1. **文字列ファイル** (`i18n/en.json` → `i18n/fr.json`, `i18n/ja.json`)
2. **コンテンツファイル** (`content/en/about.md` → `content/en/about.fr.md`, `content/en/about.ja.md`)

### コンテンツ翻訳の詳細

Markdownを翻訳する際、rosettaは自動的に以下の処理を行います。

- コードブロック、ショートコード (`{{< ... >}}`)、インラインコード、HTMLの**保護**
- Front Matterフィールド (`title`, `description`, `summary`) の**翻訳**
- その他のすべてのFront Matterフィールド (`date`, `draft`, `weight`, `tags`) の**保持**
- 翻訳後の保護されたブロックの**復元**

Hugoのショートコード `{{< team-grid >}}` は翻訳されずにそのまま維持されます。

## ステップ5: 確認

```bash
# Preview the site
hugo server

# Check translation status
npx i18n-rosetta status
```

`localhost:1313/fr/` および `localhost:1313/ja/` にアクセスして、翻訳されたコンテンツを確認します。

## ステップ6: Hugoの言語スイッチャー

Hugoのレイアウトに言語スイッチャーを追加します。

```html title="layouts/partials/language-switcher.html"
<nav class="language-switcher">
  {{ range $.Site.Home.AllTranslations }}
    <a href="{{ .Permalink }}"
       {{ if eq .Lang $.Site.Language.Lang }}class="active"{{ end }}>
      {{ .Language.LanguageName }}
    </a>
  {{ end }}
</nav>
```

## コンテンツの同期を保つ

英語のコンテンツを更新した場合は、再度同期を実行します。Rosettaは変更されたファイルのみを再翻訳します。

```bash
# Edit content/en/about.md, then:
npx i18n-rosetta sync
```

ロックファイルがファイルごとのコンテンツハッシュを追跡するため、変更のないページは再翻訳されません。

## 関連項目

- **[コンテンツ翻訳ガイド](/docs/guides/content-translation)** — 保護、Front Matter、エッジケースについての詳細な解説
- **[フレームワークの統合](/docs/guides/framework-integration)** — Next.jsおよびReactのセットアップ
- **[CI/CDガイド](/docs/guides/ci-cd)** — `content/en/` へのプッシュ時の同期の自動化
- **[翻訳メソッド](/docs/guides/translation-methods)** — LLM、TM、およびハイブリッド翻訳戦略の比較
- **[サポート対象言語](/docs/reference/supported-languages)** — サポートされているロケールと言語コードの完全なリスト