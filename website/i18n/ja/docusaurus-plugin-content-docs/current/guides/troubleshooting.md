---
sidebar_position: 6
title: "トラブルシューティング"
---
# トラブルシューティング

i18n-rosetta の一般的な問題と解決策です。

## API と認証

### "OPENROUTER_API_KEY not found"

Rosetta で LLM 翻訳を行うには API キーが必要です。環境変数として設定してください。

```bash
export OPENROUTER_API_KEY="sk-or-v1-..."
```

または、`.env` ファイルに設定します（プロジェクトで `.env` ファイルを読み込む場合）。

```
OPENROUTER_API_KEY=sk-or-v1-...
```

:::tip
Google Translate API キーのみをお持ちの場合、rosetta は自動的に検出して Google Translate をデフォルトのメソッドとして使用します。設定の変更は必要ありません。
:::

### OpenRouter からの "401 Unauthorized"

API キーが無効であるか、期限切れです。[openrouter.ai/keys](https://openrouter.ai/keys) で確認してください。

### "429 Too Many Requests" / レート制限

Rosetta は、エクスポネンシャルバックオフ（指数関数的後退）を使用して内部的にレート制限を処理します。頻繁にレート制限に引っかかる場合は、以下の対策をお試しください。

1. 設定で**バッチサイズを減らす**:
   ```json
   { "batchSize": 15 }
   ```
2. **より高いレート制限を持つモデルを使用する**（例: `google/gemini-3.5-flash` は制限が緩やかです）
3. 大量の翻訳ペアには**より安価で高速なメソッドを使用する** — Google Translate にはレート制限がありません。
   ```json
   { "pairs": { "en:it": { "method": "google-translate" } } }
   ```

### Model Not Found / 404 エラー

直接の LLM プロバイダー（`openai`、`anthropic`、`gemini`）は、初回使用時にモデル文字列を検証します。警告が表示された場合は以下を確認してください。

**"looks like an OpenRouter path"** — 直接のプロバイダーで OpenRouter 形式のモデル（`google/gemini-3.5-flash`）を使用しています。直接のプロバイダーでは、単一のモデル名を使用します。

```diff
- { "method": "gemini", "model": "google/gemini-3.5-flash" }
+ { "method": "gemini", "model": "gemini-2.5-flash" }
```

または、OpenRouter を使用するために `llm` メソッドに切り替えます。
```json
{ "method": "llm", "model": "google/gemini-3.5-flash" }
```

**"is an Anthropic/OpenAI/Gemini model"** — 誤ったプロバイダーにモデルを送信しています。

```diff
- { "method": "gemini", "model": "claude-sonnet-4-6" }
+ { "method": "anthropic", "model": "claude-sonnet-4-6" }
```

**"not found in available models"** — モデルが非推奨になっているか、スペルが間違っている可能性があります。Rosetta はプロバイダーの最新のモデルリストを取得し、代替案を提案します。現在のモデル名については、プロバイダーのドキュメントを確認してください。

:::tip モデルの非推奨化について
プロバイダーは定期的にモデル名を廃止します。プロバイダーのアップデート後に突然翻訳が失敗するようになった場合は、`[WARN]` の出力を確認してください。現在の代替モデルが表示されます。
:::

## 翻訳の品質

### 翻訳がソース言語のままになる

これは品質ゲート（Quality Gate）によって捕捉されます。翻訳が英語のソースと完全に一致する場合、拒否されて再試行されます。この問題が続く場合は、以下の対策をお試しください。

1. **モデルを確認する** — 一部のモデルは、特定の言語ペアでパフォーマンスが低下します。
2. **トーンや文体の指示を追加する** — どの言語で出力するかをモデルに指示します。
   ```json
   {
     "languages": {
       "ja": { "name": "Japanese", "register": "Polite/formal Japanese" }
     }
   }
   ```
3. **別のモデルを試す** — `gpt-4o-mini` から `gpt-4o` または `google/gemini-2.5-pro` に切り替えます。

### 誤った文字スクリプトの出力（例: 日本語に対してラテン文字が出力される）

品質ゲートのスクリプト準拠チェックにより、ほとんどのケースは捕捉されます。この問題が続く場合は、以下の対策をお試しください。

- ロケールコードが正しいことを確認する（`jp` ではなく `ja`）。
- `register` フィールドに明示的なスクリプトの指示を追加する。
  ```json
  { "register": "Japanese using hiragana, katakana, and kanji" }
  ```

### 出力におけるハルシネーション（幻覚）パターン

繰り返されるトライグラムのパターン（例: "hello hello hello"）は、ハルシネーションループ検出器によって捕捉されます。出力が文字化けしているにもかかわらず検出器を通過してしまう場合は、以下の対策をお試しください。

1. **バッチサイズを減らす** — バッチを小さくすると、より焦点の絞られた出力が得られます。
2. **より強力なモデルを使用する** — 大規模なモデルほど、非ラテン文字スクリプトでのハルシネーションが少なくなります。
3. **コーチングデータを追加する** — 辞書の用語が翻訳の基準となります。

## ファイルとフォーマットの問題

### "No locale files found"

Rosetta はロケールファイルを自動検出します。見つからない場合は、以下の対策をお試しください。

1. **`localesDir` を確認する** — ロケールファイルが含まれるディレクトリを指している必要があります。
   ```json
   { "localesDir": "./locales" }
   ```
2. **ファイル名を確認する** — ファイル名はロケールコードで命名されている必要があります（例: `en.json`、`fr.json` など）。
3. **フォーマットを確認する** — サポートされているフォーマットは、JSON、ネストされた JSON、YAML、TOML です。

### ロックファイルの競合

`.i18n-rosetta.lock` が不正な状態になった場合:

```bash
# Reset the lock file (next sync will retranslate everything)
rm .i18n-rosetta.lock
npx i18n-rosetta sync
```

:::warning
ロックファイルを削除すると、次回の同期時に変更されたキーだけでなく、すべてのキーが再翻訳されます。大規模なプロジェクトでは API コストに影響するためご注意ください。
:::

### 特定のキーの再翻訳

個別の翻訳が間違っており、ロックファイルを削除せずに強制的に再翻訳したい場合:

```bash
# Re-translate a single key
npx i18n-rosetta sync --force-keys "hero.title"

# Re-translate multiple keys
npx i18n-rosetta sync --force-keys "nav.home,nav.about,footer.copyright"
```

`--force-keys` フラグは、指定された特定のキーに対するロックファイルのハッシュチェックを上書きし、他のキーに影響を与えることなく強制的に再翻訳を行います。

### コンテンツの翻訳でコードブロックが破損する

通常、この問題は発生しません（コードブロックは翻訳前に保護されます）。もし発生した場合は、以下の対策をお試しください。

1. コードブロックが標準的なフェンス（トリプルバッククォート）を使用しているか確認する。
2. ソースの Markdown に閉じられていないコードブロックがないか確認する。
3. Issue を報告する — これはセンチネル保護システムのバグです。

## CLI の問題

### `--watch` が変更を検出しない

ファイルの監視には Node.js ネイティブの `fs.watch` を使用しています。既知の問題は以下の通りです。

- **ネットワークドライブ** — NFS/SMB マウントでは `fs.watch` が確実に動作しません。
- **Docker ボリューム** — ポーリングモードを使用するか、コンテナ内で rosetta を実行してください。
- **大規模なディレクトリ** — ウォッチャーは `localesDir` を再帰的に監視するため、ツリーが非常に深い場合は OS の制限を超える可能性があります。

### `npx` が古いバージョンで実行される

```bash
# Clear the npx cache
npx --yes i18n-rosetta@latest sync
```

または、グローバルにインストールします。

```bash
npm install -g i18n-rosetta
i18n-rosetta sync
```

## パフォーマンス

### 多くの言語で同期が遅い

Rosetta はデフォルトですべてのロケールを並行して翻訳します。それでも同期が遅い場合は、以下の対策をお試しください。

1. **大量の翻訳ペアには Google Translate を使用する** — LLM 翻訳よりも 10〜50 倍高速です。
2. **バッチサイズを増やす**（デフォルトは 80）:
   ```json
   { "batchSize": 120 }
   ```
3. **並行処理を調整する** — JSON ロケールの並行処理はデフォルトで 50、コンテンツは 12 です。API プロバイダーがより高いレート制限をサポートしている場合は調整してください。
   ```bash
   npx i18n-rosetta sync --json-concurrency 80 --content-concurrency 20
   ```
4. **高速なモデルを使用する** — `gpt-4o-mini` は `gpt-4o` よりも大幅に高速です。

### API コストが高い

- **バッチサイズを確認する** — バッチサイズが大きいほど API 呼び出し回数が減り、コストが下がります。
- **翻訳メモリ（TM）を使用する** — TM はデフォルトでオンになっています。`i18n-rosetta tm stats` を実行して機能しているか確認してください。複数回同期してもエントリが 0 の場合は、`.rosetta/` ディレクトリの権限に問題がある可能性があります。
- **プロンプトキャッシュを使用する** — Rosetta は、Anthropic および Google モデルでのキャッシュヒットのために、システムメッセージとユーザーメッセージを分割します。
- **Tier 2 言語には Google Translate を使用する** — [Translate 30 Languages](/docs/tutorials/translate-30-languages) のクックブックを参照してください。

### プロバイダー切り替え後の古い翻訳の残留

ある翻訳メソッドから別のメソッド（例: `llm` から `deepl`）に切り替えた場合、ソーステキストが変更されていないキーに対しては、TM キャッシュが以前のメソッドの古い翻訳を引き続き提供する可能性があります。キャッシュキーにはメソッド名が含まれているため、ほとんどのケースは自動的に処理されます。ただし、同じメソッド内で `model` を変更した場合は以下の対応が必要です。

```bash
# Force fresh translations for all keys
i18n-rosetta sync --no-tm

# Or clear the cache entirely and re-sync
i18n-rosetta tm clear --yes
i18n-rosetta sync
```

キャッシュキーの設計の詳細については、[Translation Memory](/docs/concepts/translation-memory) を参照してください。

## まだ解決しませんか？

- **[GitHub Issues](https://github.com/gamedaysuits/i18n-rosetta/issues)** — 既存の Issue を検索するか、新しく報告する
- **[Architecture Docs](/docs/concepts/architecture)** — システム設計を理解する
- **[Quality Gate](/docs/concepts/quality-gate)** — 内部での検証の仕組み