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
i18n-rosetta verify            Verify translations are present and correct (CI gate)
i18n-rosetta status            Show pair configuration, plugins, and quality tiers
i18n-rosetta provenance        Audit translation resource licensing
i18n-rosetta plugin <sub>      Manage method plugins (install, remove, list)
i18n-rosetta fonts <sub>       Download web fonts for PUA script converters
i18n-rosetta tm <sub>          Manage Translation Memory cache (stats, clear)
i18n-rosetta xliff <sub>       Export/import XLIFF 1.2 for professional review
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
--dry, --dry-run        Preview changes without writing files
--concurrency <n>       Max parallel API calls (sets both JSON and content, default: 12)
--json-concurrency <n>  Max parallel locale translations for JSON keys (default: 50)
--content-concurrency <n> Max parallel API calls for content translation (default: 12)
--force-content         Re-translate all content files (clears content lock)
--force-keys <keys>     Comma-separated dot-notation keys to force re-translate
--no-tm                 Skip Translation Memory cache for this sync run
--no-verify             Skip post-sync verification pass
--locale <code>         Target locale (xliff export, tm clear)
--quiet                 Errors and warnings only — suppress banner, progress bar, and info lines
--json                  Machine-readable NDJSON output — one JSON object per event
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

**言語プリセット**: ターゲット言語のプロンプトが表示された際、以下のプリセット名を入力できます。
- `european` → fr, de, es, it, pt, nl
- `asian` → ja, zh, ko
- `global` → fr, es, de, ja, zh, ko, pt, ar
- `nordic` → da, fi, nb, sv

プリセットと個別のコードを組み合わせることも可能です: `european, ja` → fr, de, es, it, pt, nl, ja

---

## sync

すべてのロケールファイルにわたって、不足しているキーや古いキーを翻訳します。デフォルトでは、同期後の検証（post-sync verification）が実行されます。

```bash
i18n-rosetta sync                                   # translate everything
i18n-rosetta sync --dry-run                         # preview only
i18n-rosetta sync --force-keys "hero.title"         # force re-translate
i18n-rosetta sync --force-keys "a.title,a.subtitle" # multiple keys
i18n-rosetta sync --force-content                   # re-translate all Markdown/MDX
i18n-rosetta sync --content-dir ./content           # include Hugo Markdown
i18n-rosetta sync --method google-translate          # force Google Translate
i18n-rosetta sync --concurrency 20                  # 20 parallel API calls (both phases)
i18n-rosetta sync --json-concurrency 30              # 30 parallel locale translations (JSON)
i18n-rosetta sync --content-concurrency 8            # 8 parallel content translations
i18n-rosetta sync --no-verify                        # skip post-sync verification
i18n-rosetta sync --no-tm                            # skip cache, fresh API calls
```

**翻訳メモリ (Translation Memory)**: デフォルトでは、`sync` は `.rosetta/tm.json` を読み込み、変更されていないソース値に対してキャッシュされた翻訳を提供します。キャッシュをバイパスするには `--no-tm` を使用します（翻訳プロバイダーを切り替える場合や品質のデバッグ時に便利です）。詳細は [翻訳メモリ](/docs/concepts/translation-memory) を参照してください。

**変更検知**: rosetta は SHA-256 ハッシュを `.i18n-rosetta.lock` に保存します。ソース値が変更されると、次回の同期時にそれらのキーが自動的に再翻訳されます。すべての開発者でベースラインを共有できるように、ロックファイルをコミットしてください。

**並列処理**: JSON キーの翻訳とコンテンツの翻訳はどちらも並列で実行されます。JSON ロケールは同時に翻訳され（デフォルト: 50の同時ロケール）、各ロケール内のバッチも並列化されます（4の同時バッチ）。コンテンツ翻訳（Markdown、MDX、ブログ記事）はフラットなワークアイテムプールで実行されます（デフォルト: 12の同時API呼び出し）。これらを上書きするには、`--json-concurrency`、`--content-concurrency`、または `--concurrency`（両方を設定）を使用します。

**出力**: 同期処理では、バージョンバナー、フォーマット/フレームワークの検出結果、コスト見積もり、およびロケールごとのプログレスバーが表示されます。

```
i18n-rosetta v3.3.1

[INFO] Detected format: json (auto)
[INFO] Source: en.json (2,847 keys)
[INFO] Pairs: es-MX:llm, fr:deepl

[INFO] es-MX.json — 2,847 missing
     ████████████████████████████████ 2,847/2,847 keys
[INFO] fr.json — 2,847 missing
     ████████████████████████████████ 2,847/2,847 keys
[OK] Synced 5,694 keys total.
```

プログレスバーは各バッチ（約80キー）の後にインプレースで更新されます。エラー/警告のみを表示する場合は `--quiet` を、機械可読な NDJSON 出力が必要な場合は `--json` を使用します。どちらもプログレスバーとバナーを非表示にします。

---

## watch

ソースロケールファイルが変更されたときに自動同期します。`Ctrl+C` で中断されるまで実行され続けます。

```bash
i18n-rosetta watch
```

---

## audit

以前の実行から残っている、未翻訳の `[EN]` プレフィックス付きフォールバック値をすべてリストアップします。見つかった場合は終了コード 1 で終了します。翻訳が不完全な場合にビルドを失敗させる CI ゲートとして使用してください。

```bash
i18n-rosetta audit
```

---

## verify

ディスクからすべてのロケールファイルを再読み込みし、翻訳が実際に存在し、正しいことを検証します。これは、すべての `sync` の最後に自動的に実行される検証と同じものです（`--no-verify` が渡された場合を除く）。

```bash
i18n-rosetta verify                    # verify all locale files
i18n-rosetta verify --warn-only        # non-blocking
i18n-rosetta verify && echo "All good" # CI gate
```

**チェック内容:**
- キーのパリティ — すべてのソースキーが各ターゲットに存在するか
- 以前の実行による `[EN]` フォールバックマーカー
- 空の翻訳
- スクリプトの準拠 — 非ラテンロケールに非ASCIIの翻訳が含まれているか
- プレースホルダーの保持 — ICU プレースホルダーがソースと一致するか
- エンコーディングの問題 — BOM マーカー、不可視文字
- ソースのエコー — ソースと同一の値（警告）

---

## lint

i18n 翻訳呼び出しを使用すべき、ハードコードされたユーザー向け文字列がないかソースコードをスキャンします。フレームワーク（next-intl、react-i18next、vue-i18n、Hugo）を自動検出します。

```bash
i18n-rosetta lint                    # exits 1 if issues found
i18n-rosetta lint --warn-only        # always exits 0
i18n-rosetta lint --src ./app        # custom source directory
i18n-rosetta lint --min-length 4     # minimum string length to flag
```

**検出内容:**
- JSX テキスト、`placeholder`、`alt`、`aria-label`、`title` 内のハードコードされた文字列
- ユーザー向けコンテンツがあるのに i18n フレームワークのインポートがないファイル
- デッドキー — どのソースファイルからも参照されていないロケールキー
- カバレッジスコア — i18n を経由している文字列の割合

**除外設定**: プロジェクトのルートに `.rosettaignore` を作成します（`.gitignore` のような glob パターンを使用）。

---

## wrap

`lint` によって検出されたハードコードされた文字列を、自動的に `t()` 呼び出しでラップします。ファイルを変更する前に自動バックアップを作成します。

```bash
i18n-rosetta wrap                    # auto-wrap with backup
i18n-rosetta wrap --dry              # preview wrapping changes
i18n-rosetta wrap --undo             # restore from .rosetta-backup/
```

**安全対策:**
1. Git のクリーンチェック（ドライランではスキップ）
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
| `sitemap` | 多言語の `sitemap.xml` |
| `jsonld` | JSON-LD WebSite 言語スキーマ |

---

## integrity

翻訳されたロケールファイルの破損やドリフト（乖離）を検出します。

```bash
i18n-rosetta integrity               # exits 1 if issues found
i18n-rosetta integrity --warn-only   # non-blocking
```

**チェック内容:**
- プレースホルダーの破損（例: `{name}` がソースには存在するがターゲットにはない）
- エンコーディングの問題（文字化け、無効な Unicode）
- 未翻訳のコピー（ターゲット値がソースと同一）
- 孤立したキー（ターゲットには存在するがソースには存在しないキー）
- ICU MessageFormat の複数形カテゴリの完全性（例: アラビア語には6つのカテゴリが必要）

---

## tm

翻訳メモリ（Translation Memory）キャッシュ（`.rosetta/tm.json`）を管理します。TM は以前の翻訳を保存し、その後の同期時に API を呼び出す代わりにそれらを提供します。

```bash
i18n-rosetta tm stats                  # show cache statistics
i18n-rosetta tm clear                  # clear cache (with confirmation)
i18n-rosetta tm clear --yes            # clear without confirmation
i18n-rosetta tm clear --locale fr      # clear only French entries
```

| サブコマンド | 出力 |
|------------|--------|
| `stats` | エントリ数、ファイルサイズ、ロケールごとの内訳 |
| `clear` | キャッシュファイルの削除（全体またはロケールごと） |

| オプション | 効果 |
|--------|--------|
| `--locale <code>` | 1つのロケールのエントリのみをクリアする |
| `--yes` | 確認プロンプトをスキップする |

TM の仕組みやクリアするタイミングについては、[翻訳メモリ](/docs/concepts/translation-memory) を参照してください。

---

## xliff

プロの翻訳者によるレビュー用に XLIFF 1.2 ファイルをエクスポートおよびインポートします。XLIFF は、memoQ、SDL Trados、Phrase などの CAT ツールでサポートされている汎用的な交換フォーマットです。

```bash
i18n-rosetta xliff export --locale fr                   # export French XLIFF
i18n-rosetta xliff export --locale ja --out ./review/   # custom output path
i18n-rosetta xliff import .rosetta/xliff/fr.xliff       # import reviewed file
i18n-rosetta xliff import ./reviewed.xliff --dry        # preview import
```

| サブコマンド | 出力 |
|------------|--------|
| `export` | ソースおよびターゲットのロケールファイルから `.xliff` を生成する |
| `import` | レビュー済みの `.xliff` 翻訳をロケールファイルにマージする |

| オプション | 効果 |
|--------|--------|
| `--locale <code>` | エクスポートするターゲットロケール（必須） |
| `--out <path>` | カスタムの出力パスまたはディレクトリ |
| `--dry` | 書き込まずにインポートをプレビューする |

完全なワークフローについては、[プロの翻訳者との連携](/docs/guides/professional-translators) を参照してください。

---

## status

ペアの構成、インストールされているプラグイン、品質ティア、およびベンチマークスコアを表示します。

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

翻訳メソッドのプラグインを管理します。プラグインは `.rosetta/methods/` にインストールされる、パッケージ化された翻訳レシピです。

```bash
i18n-rosetta plugin list                      # show installed plugins
i18n-rosetta plugin install ./my-method/      # install from local directory
i18n-rosetta plugin remove crk-coached-v1     # remove a plugin
```

プラグインマニフェストのフォーマットについては、[プラグイン仕様](/docs/reference/plugin-spec) を参照してください。

---

## fonts

人工言語スクリプトコンバーター用の PUA Web フォントをダウンロードおよび管理します。私用領域（Private Use Area）の文字を使用する言語（Klingon、Sindarin、Kryptonian）は、そのスクリプトをレンダリングするためにカスタム Web フォントを必要とします。このコマンドは、検証済みのオープンソースリポジトリからそれらをダウンロードします。

```bash
i18n-rosetta fonts list                           # show needed fonts
i18n-rosetta fonts install                        # download all needed fonts
i18n-rosetta fonts install --css                  # also generate CSS snippet
i18n-rosetta fonts install --dir ./public/fonts   # custom output directory
```

| サブコマンド | 出力 |
|------------|--------|
| `list` | 必要な PUA フォントとそのインストール状況を表示する |
| `install` | 設定された言語のフォントをダウンロードする |

| オプション | 効果 |
|--------|--------|
| `--dir <path>` | フォントの出力ディレクトリを上書きする（プロジェクトタイプから自動検出） |
| `--css` | フォントと一緒に `conlang-fonts.css` スニペットを生成する |
| `--config <path>` | 設定ファイルへのパス（どの言語にフォントが必要かを検出するために使用） |

**自動検出:** 出力ディレクトリはプロジェクトの構造から推論されます。
- **Docusaurus** → `static/fonts/` または `website/static/fonts/`
- **Hugo** → `static/fonts/`
- **デフォルト** → `public/fonts/`

**ネイティブ Unicode コンバーター**（`crk` → Cree Syllabics、`sr` → Serbian Cyrillic）は、フォントのインストールを必要としません。

PUA フォントの詳細については、[人工言語、スクリプト、正書法](/docs/guides/conlangs-scripts-orthography) を参照してください。

## 3層パイプライン

確実な i18n を実現するために、`lint`、`sync`、および `audit` を組み合わせて使用します。

```json title="package.json"
{
  "scripts": {
    "i18n:lint": "i18n-rosetta lint",
    "i18n:sync": "i18n-rosetta sync",
    "i18n:audit": "i18n-rosetta audit"
  }
}
```

| レイヤー | コマンド | タイミング | 目的 |
|-------|---------|------|---------|
| **Lint** | `lint` | コミット前 | ハードコードされた文字列を含むコミットをブロックする |
| **Sync** | `sync` | コミット後 / CI | 不足しているキーや変更されたキーを翻訳する |
| **Verify** | `verify` | 同期後 / CI | 翻訳が存在し、正しいことを確認する |
| **Audit** | `audit` | ビルドステップ | いずれかのロケールに `[EN]` マーカーがある場合、デプロイを失敗させる |

---

## 関連項目

- [設定](/docs/getting-started/configuration) — 設定ファイルのリファレンス
- [翻訳メソッド](/docs/guides/translation-methods) — ペアごとのメソッド選択
- [翻訳メモリ](/docs/concepts/translation-memory) — キャッシュとコスト削減
- [プロの翻訳者との連携](/docs/guides/professional-translators) — XLIFF ワークフロー
- [プラグイン仕様](/docs/reference/plugin-spec) — プラグインマニフェストのフォーマット
- [CI/CD ガイド](/docs/guides/ci-cd) — パイプラインでの CLI コマンドの自動化
- [同期の仕組み](/docs/concepts/how-sync-works) — 同期パイプラインの理解
- [品質ゲート](/docs/concepts/quality-gate) — 翻訳の検証方法