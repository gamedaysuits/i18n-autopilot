---
sidebar_position: 1
title: "CLIリファレンス"
---
# CLIリファレンス

## コマンド

```
i18n-rosetta init              Interactive setup wizard (--yes for quick defaults)
i18n-rosetta sync              Translate & sync all locale files
i18n-rosetta watch             Auto-sync when the source file changes
i18n-rosetta audit             List all untranslated [EN] fallback values
i18n-rosetta lint              Scan source code for hardcoded strings
i18n-rosetta wrap              Auto-wrap hardcoded strings in t() calls (with undo)
i18n-rosetta seo <sub>         Generate hreflang, sitemap.xml, or JSON-LD schema
i18n-rosetta integrity         Audit locale files for format/encoding issues
i18n-rosetta status            Show pair configuration, plugins, and quality tiers
i18n-rosetta provenance        Audit translation resource licensing
i18n-rosetta plugin <sub>      Manage method plugins (install, remove, list)
```

各コマンドの詳細なヘルプを表示するには、`i18n-rosetta <command> --help` を実行します。

## グローバルオプション

```
--help, -h              Show help (global or per-command)
--version, -v           Print version and exit
--yes, -y               Skip interactive prompts, use defaults
--config <path>         Custom config file path
--dir <path>            Override locales directory
--content-dir <path>    Hugo/Docusaurus content directory for Markdown translation
--source <code>         Override source locale (default: en)
--model <model>         Override translation model
--method <method>       Translation method: llm, google-translate (default: from config)
--format <fmt>          Locale file format: json, toml, yaml, or auto
--dry                   Preview changes without writing files
```

---

## init

`i18n-rosetta.config.json` を作成する対話型のセットアップウィザードです。ソースロケール、ターゲット言語、ファイル形式、および翻訳モデルの設定をガイドします。

```bash
i18n-rosetta init                          # interactive wizard
i18n-rosetta init --yes                    # skip wizard, use defaults
i18n-rosetta init --yes --langs fr,de,ja   # quick setup with specific languages
i18n-rosetta init --source en --dir ./i18n # overrides with defaults
```

**`--langs` オプション**: ターゲット言語コードのカンマ区切りリストです。言語のプロンプトをスキップし、各言語にデフォルトのレジスター（文体）プリセットを適用します。完全に非対話型のセットアップを行うには、`--yes` と組み合わせます。

**言語プリセット**: ターゲット言語のプロンプトが表示されたら、プリセット名を入力できます。
- `european` → fr, de, es, it, pt, nl
- `asian` → ja, zh, ko
- `global` → fr, es, de, ja, zh, ko, pt, ar
- `nordic` → da, fi, nb, sv

プリセットと個別のコードを組み合わせる: `european, ja` → fr, de, es, it, pt, nl, ja

---

## sync

すべてのロケールファイルにわたって、不足しているキー、古いキー、およびフォールバックキーを翻訳します。

```bash
i18n-rosetta sync                                   # translate everything
i18n-rosetta sync --dry                             # preview only
i18n-rosetta sync --force-keys "hero.title"         # force re-translate
i18n-rosetta sync --force-keys "a.title,a.subtitle" # multiple keys
i18n-rosetta sync --content-dir ./content           # include Hugo Markdown
i18n-rosetta sync --method google-translate          # force Google Translate
i18n-rosetta sync --fallback                         # write [EN] prefixes on failure
```

**変更の検出**: rosetta は SHA-256 ハッシュを `.i18n-rosetta.lock` に保存します。ソースの値が変更されると、次回の同期時にそれらのキーが自動的に再翻訳されます。すべての開発者でベースラインを共有できるように、ロックファイルをコミットしてください。

---

## watch

ソースロケールファイルが変更されたときに自動同期します。`Ctrl+C` で中断されるまで実行されます。

```bash
i18n-rosetta watch
```

---

## audit

翻訳されていない `[EN]` プレフィックス付きのフォールバック値をすべてリストします。見つかった場合はコード 1 で終了します。不完全な翻訳がある場合にビルドを失敗させる CI ゲートとして使用してください。

```bash
i18n-rosetta audit
```

---

## lint

i18n 翻訳呼び出しを使用すべき、ハードコードされたユーザー向け文字列がないかソースコードをスキャンします。フレームワーク (next-intl、react-i18next、vue-i18n、Hugo) を自動検出します。

```bash
i18n-rosetta lint                    # exits 1 if issues found
i18n-rosetta lint --warn-only        # always exits 0
i18n-rosetta lint --src ./app        # custom source directory
i18n-rosetta lint --min-length 4     # minimum string length to flag
```

**検出対象:**
- JSX テキスト、`placeholder`、`alt`、`aria-label`、`title` 内のハードコードされた文字列
- ユーザー向けコンテンツが含まれているが、i18n フレームワークのインポートがないファイル
- デッドキー — どのソースファイルからも参照されていないロケールキー
- カバレッジスコア — i18n を経由している文字列の割合

**除外設定**: プロジェクトのルートに `.rosettaignore` を作成します (`.gitignore` のような glob パターンを使用)。

---

## wrap

`lint` によって検出されたハードコードされた文字列を `t()` 呼び出しで自動的にラップします。ファイルを変更する前に自動バックアップを作成します。

```bash
i18n-rosetta wrap                    # auto-wrap with backup
i18n-rosetta wrap --dry              # preview wrapping changes
i18n-rosetta wrap --undo             # restore from .rosetta-backup/
```

**セーフティゲート:**
1. Git のクリーンチェック (dry-run ではスキップ)
2. `.rosetta-backup/` への自動バックアップ
3. 各ファイル書き込み前の差分プレビュー
4. バックアップから復元するための `--undo` サポート

---

## seo

多言語サイト用の SEO アーティファクトを生成します。

```bash
i18n-rosetta seo hreflang                                        # print hreflang tags
i18n-rosetta seo sitemap --base-url https://example.com --out sitemap.xml
i18n-rosetta seo jsonld --base-url https://example.com           # JSON-LD schema
```

| サブコマンド | 出力 |
|------------|--------|
| `hreflang` | `<link rel="alternate" hreflang>` タグ |
| `sitemap` | 多言語 `sitemap.xml` |
| `jsonld` | JSON-LD WebSite 言語スキーマ |

---

## integrity

翻訳されたロケールファイルの破損や乖離を検出します。

```bash
i18n-rosetta integrity               # exits 1 if issues found
i18n-rosetta integrity --warn-only   # non-blocking
```

**チェック内容:**
- プレースホルダーの破損 (例: ソースには `{name}` が存在するが、ターゲットにはない)
- エンコーディングの問題 (文字化け、無効な Unicode)
- 未翻訳のコピー (ターゲットの値がソースと同一)
- 孤立したキー (ターゲットには存在するがソースには存在しないキー)

---

## status

ペア構成、インストールされているプラグイン、品質ティア、およびベンチマークスコアを表示します。

```bash
i18n-rosetta status
```

---

## provenance

インストールされているすべてのプラグインについて、翻訳リソースのライセンスを監査します。

```bash
i18n-rosetta provenance
```

---

## plugin

翻訳メソッドプラグインを管理します。プラグインは、`.rosetta/methods/` にインストールされるパッケージ化された翻訳レシピです。

```bash
i18n-rosetta plugin list                      # show installed plugins
i18n-rosetta plugin install ./my-method/      # install from local directory
i18n-rosetta plugin remove crk-coached-v1     # remove a plugin
```

プラグインマニフェストの形式については、[プラグイン仕様](/docs/reference/plugin-spec)を参照してください。

---

## 3層パイプライン

堅牢な i18n を実現するために、`lint`、`sync`、および `audit` を組み合わせて使用します。

```json title="package.json"
{
  "scripts": {
    "i18n:lint": "i18n-rosetta lint",
    "i18n:sync": "i18n-rosetta sync",
    "i18n:audit": "i18n-rosetta audit"
  }
}
```

| レイヤー | コマンド | 実行タイミング | 目的 |
|-------|---------|------|---------|
| **Lint** | `lint` | コミット前 | ハードコードされた文字列を含むコミットをブロックする |
| **Sync** | `sync` | コミット後 / CI | 不足しているキーや変更されたキーを翻訳する |
| **Audit** | `audit` | ビルドステップ | いずれかのロケールが不完全な場合にデプロイを失敗させる |

---

## 関連項目

- [設定](/docs/getting-started/configuration) — 設定ファイルのリファレンス
- [翻訳メソッド](/docs/guides/translation-methods) — ペアごとのメソッド選択
- [プラグイン仕様](/docs/reference/plugin-spec) — プラグインマニフェストの形式
- [CI/CD ガイド](/docs/guides/ci-cd) — パイプラインでの CLI コマンドの自動化
- [同期の仕組み](/docs/concepts/how-sync-works) — 同期パイプラインの理解
- [品質ゲート](/docs/concepts/quality-gate) — 翻訳の検証方法