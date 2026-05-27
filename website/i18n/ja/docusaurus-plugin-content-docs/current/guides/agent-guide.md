---
sidebar_position: 9
title: "エージェントガイド：i18n-rosettaの使い方"
description: "AIエージェントがi18n-rosettaをインストール、設定、実行してロケールファイルを翻訳する方法について説明します。"
---
# エージェントガイド: i18n-rosettaの使い方

i18n-rosettaは、アプリのロケールファイルを1つのコマンドで翻訳するCLIツールです。このガイドは、ゼロから素早くロケールファイルの翻訳を完了させたいAIエージェント（またはAIエージェントと連携する開発者）向けに作成されています。

:::tip すでに使い慣れている場合
コマンドだけが必要な場合は、[CLIリファレンス](/docs/reference/cli)にジャンプしてください。翻訳メソッドを構築してベンチマークを行いたい場合は、[Arenaエージェントガイド](https://mtevalarena.org/docs/getting-started/agent-guide)を参照してください。
:::

---

## 環境セットアップ

```bash
# No global install needed — npx runs it directly
npx i18n-rosetta sync
```

**要件:**
- Node.js 18以上
- 翻訳プロバイダーのAPIキー

**APIキーのセットアップ** — 使用するメソッドに応じて、rosettaには少なくとも1つのキーが必要です:

```bash
# Option 1: export (session only)
export OPENROUTER_API_KEY="sk-or-..."        # for llm / llm-coached methods
export GOOGLE_TRANSLATE_API_KEY="AIza..."    # for google-translate method

# Option 2: .env file in your project root (persistent, gitignored)
echo 'OPENROUTER_API_KEY=sk-or-...' > .env
```

Rosettaは自動的に`.env`を読み込みます。OpenRouterのキーは[openrouter.ai/keys](https://openrouter.ai/keys)で取得できます。

---

## 初回同期

Rosettaは、ロケールファイル、そのフォーマット（JSON、TOML、YAML、PO）、およびターゲット言語を自動検出します:

```bash
npx i18n-rosetta sync
```

**実行される処理:**
1. `i18n-rosetta.config.json`を読み込む（または設定を自動検出する）
2. ソースのロケールファイルをスキャンし、ネストされたキーをフラット化する
3. `.i18n-rosetta.lock`（以前に翻訳された値のSHA-256ハッシュ）と比較する
4. キャッシュされた翻訳（翻訳メモリ）がないか`.rosetta/tm.json`を確認する
5. 設定されたメソッドを使用して、**変更されたキー、欠落しているキー、または古いキー**のみを翻訳する
6. すべての翻訳に対して品質ゲート（5つのチェック）を実行する
7. チェックを通過した翻訳をターゲットのロケールファイルに書き込む
8. ロックファイルとTMキャッシュを更新する

1つのキーを変更した後の通常の再実行では、ステップ4で142個のキーがキャッシュから提供され、ステップ5で1つのキーが翻訳されます。これが、2回目以降の同期が高速かつ安価になる理由です。

---

## 設定

プロジェクトのルートに`i18n-rosetta.config.json`を作成します:

```json
{
  "inputLocale": "en",
  "pairs": {
    "en-fr": { "method": "llm-coached" },
    "en-ja": { "method": "google-translate" },
    "en-crk": { "method": "api", "endpoint": "http://localhost:3000/translate" }
  }
}
```

主要なフィールド:

| フィールド | 目的 | デフォルト |
|-------|---------|---------|
| `inputLocale` | ソース言語 | `en` |
| `pairs` | メソッド設定を含むソース→ターゲットのマップ | (必須) |
| `localesDir` | ロケールファイルの保存場所 | (自動検出) |
| `model` | `llm`/`llm-coached`メソッド用のLLMモデル | `google/gemini-2.5-flash` |
| `batchSize` | 1回のAPI呼び出しあたりのキー数 | 30 (LLM)、128 (Google) |
| `concurrency` | コンテンツ翻訳の並列API呼び出し数 | 12 |

完全なリファレンス: [設定](/docs/getting-started/configuration)

---

## 翻訳メソッド

| メソッド | 使用するタイミング | コスト | 必要なAPIキー |
|--------|------------|------|---------------|
| **`llm`** | 汎用。リソースが豊富な言語に最適 | トークン単位 (モデルに依存) | `OPENROUTER_API_KEY` |
| **`llm-coached`** | ターゲット言語の文法ルール/辞書がある場合 | トークン単位 + コーチングコンテキスト | `OPENROUTER_API_KEY` |
| **`google-translate`** | GTがうまく機能するリソースが豊富な言語 | $20/100万文字 | `GOOGLE_TRANSLATE_API_KEY` |
| **`api`** | HTTPエンドポイントの背後でホストされるカスタムパイプライン | サーバーで決定 | なし (エンドポイントが認証を処理) |
| **`plugin`** | ローカルにインストールされたパッケージ化済みのメソッド | 変動 | 変動 |

詳細: [翻訳メソッド](/docs/guides/translation-methods)

---

## コーチングデータ

`llm-coached`のペアの場合、コーチングデータは明示的な言語知識でLLMを誘導します。コーチングファイルを作成します:

```json title="coaching/fr.json"
{
  "grammar_rules": [
    "Use formal register (vous) for all UI text",
    "Adjectives agree in gender and number with the noun"
  ],
  "dictionary": {
    "dashboard": "tableau de bord",
    "settings": "paramètres"
  },
  "style_notes": "Prefer active voice. Avoid anglicisms."
}
```

ペア設定でそれを参照します:

```json
"en-fr": { "method": "llm-coached", "coachingFile": "coaching/fr.json" }
```

品質ゲートは、辞書の用語が実際に元の出力に含まれているかを検証します。違反は`[TERM]`の警告としてログに記録されます。

詳細: [コーチングデータ](/docs/concepts/coaching-data)

---

## 品質ゲート

すべての翻訳は、ディスクに書き込まれる前に5つの自動チェックを通過します:

| チェック | 検出内容 | 例 |
|-------|----------------|---------|
| **空/空白** | モデルが何も返さなかった | `""` |
| **ソースの反復** | モデルが英語の入力をそのまま返した | 日本語の場合の `"Welcome"` |
| **ハルシネーションループ** | 繰り返されるトライグラム | `"Qo' Qo' Qo' Qo'"` |
| **長さの膨張** | 出力がソースの4倍以上長い | 10文字のソース → 50文字の出力 |
| **文字体系の準拠** | ロケールに対して間違った文字体系 | アラビア語ロケールに対するラテン文字 |

失敗は`[GATE]`のプレフィックスとともにログに記録されます。サイレントフォールバックはありません。翻訳が失敗した場合、黙って受け入れられることはなく、報告されます。

詳細: [品質ゲート](/docs/concepts/quality-gate)

---

## 翻訳メモリ

Rosettaは、ソーステキスト + ロケール + メソッドをキーとして、翻訳を`.rosetta/tm.json`にキャッシュします。2回目以降の同期では、変更されていないキーはキャッシュから提供されるため、API呼び出しやコストは発生しません。

```
[TM] 142 key(s) served from cache
Translating 3 key(s) to French (llm)... [OK]
```

1回の実行でキャッシュをバイパスするには: `npx i18n-rosetta sync --no-tm`

詳細: [翻訳メモリ](/docs/concepts/translation-memory)

---

## 生成されるファイル

Rosettaはプロジェクト内にいくつかのファイルを作成します。誤って削除したり、間違ったファイルをコミットしたりしないように、それぞれのファイルの役割を把握しておいてください:

| ファイル | 目的 | Git? |
|------|---------|------|
| `.i18n-rosetta.lock` | 翻訳されたソース値のSHA-256ハッシュ (変更検出) | **はい** — コミットしてください |
| `.i18n-rosetta-content.lock` | 同上 (Markdown/MDXコンテンツファイル用) | **はい** — コミットしてください |
| `.rosetta/tm.json` | 翻訳メモリのキャッシュ | **はい** — コミットしてください (チームのAPIコストを節約します) |
| `.rosetta/coaching/` | コーチングデータのディレクトリ | **はい** — これはあなたの言語知識です |
| `i18n-rosetta.config.json` | プロジェクト設定 | **はい** — コミットしてください |

---

## 一般的なパターン

**1つの言語ペアを翻訳する:**
```bash
npx i18n-rosetta sync --pair en-fr
```

**設定されたすべてのペアを翻訳する:**
```bash
npx i18n-rosetta sync
```
Rosettaはペアを順番に処理します。TMキャッシュにより、変更されたキーのみがAPIにアクセスします。

**コンテンツモード (Docusaurus、HugoなどのMarkdown/MDX):**
```bash
npx i18n-rosetta sync --content
```
ロケールのJSONと一緒に、ドキュメント、ブログ記事、コンテンツファイルを翻訳します。並列処理を使用します（デフォルト: 12の同時API呼び出し）。

**ドライラン (書き込まずにプレビュー):**
```bash
npx i18n-rosetta sync --dry-run
```

**特定のキーを強制的に再翻訳する:**
```bash
npx i18n-rosetta sync --force-keys "hero.title,nav.about"
```

**すべてのコンテンツファイルを強制的に再翻訳する:**
```bash
npx i18n-rosetta sync --force-content
```

**翻訳ステータスを確認する:**
```bash
npx i18n-rosetta status
```
各ペアのカバレッジ、品質ティア、プラグイン情報を表示します。

**未翻訳のフォールバックを監査する:**
```bash
npx i18n-rosetta audit
```
翻訳が必要なすべての`[EN]`フォールバック値をリストします。

---

## トラブルシューティング

| 問題 | 解決策 |
|---------|-----|
| `OPENROUTER_API_KEY not set` | キーをエクスポートするか、プロジェクトのルートにある`.env`に追加します |
| `No locale files found` | 設定で`localesDir`を指定するか、ロケールファイルが標準の命名規則（`en.json`、`fr.json`）と一致していることを確認します |
| `[GATE] Script compliance failed` | ターゲットロケールに期待される文字体系ではなくラテン文字が含まれています — 別のモデルを試すか、コーチングデータを追加してください |
| `[GATE] Source echo` | モデルが英語をそのまま返しました — 通常、コーチングデータまたは別のモデルを使用することで解決します |
| すべての翻訳がキャッシュされている | キャッシュをバイパスするには`--no-tm`を付けて実行するか、特定のキーに対して`--force-keys`を使用します |
| ロックファイルの競合 | `.i18n-rosetta.lock`はSHA-256ハッシュを使用します — どちらかのバージョンを保持してマージの競合を解決し、その後同期を再実行しても安全です |

---

## 次のステップ

- [クイックスタート](/docs/getting-started/quick-start) — 導入の完全なウォークスルー
- [CLIリファレンス](/docs/reference/cli) — すべてのコマンドとフラグ
- [仕組み](/docs/how-it-works) — 同期パイプラインの解説
- [Eval Harnessブリッジ](/docs/guides/bridge) — rosettaがArenaに接続する方法
- **独自の翻訳メソッドを構築したいですか？** [Arenaエージェントガイド](https://mtevalarena.org/docs/getting-started/agent-guide)を参照してください — メソッドを構築し、機能することを証明して、賞品を獲得しましょう。