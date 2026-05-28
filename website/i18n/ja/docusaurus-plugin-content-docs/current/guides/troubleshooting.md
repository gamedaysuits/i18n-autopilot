---
sidebar_position: 6
title: "トラブルシューティング"
---
# トラブルシューティング

i18n-rosettaの一般的な問題と解決策です。

## APIと認証

### "OPENROUTER_API_KEY not found"

RosettaでLLM翻訳を行うにはAPIキーが必要です。環境変数として設定してください：

```bash
export OPENROUTER_API_KEY="sk-or-v1-..."
```

または、`.env`ファイルに設定します（プロジェクトで`.env`ファイルを読み込む場合）：

```
OPENROUTER_API_KEY=sk-or-v1-...
```

:::tip
Google Translate APIキーのみをお持ちの場合、rosettaは自動的にそれを検出し、デフォルトのメソッドとしてGoogle Translateを使用します。設定の変更は必要ありません。
:::

### OpenRouterからの"401 Unauthorized"

APIキーが無効であるか、期限切れです。[openrouter.ai/keys](https://openrouter.ai/keys)で確認してください。

### "429 Too Many Requests" / レート制限

Rosettaは、指数的バックオフを使用して内部的にレート制限を処理します。頻繁にレート制限に引っかかる場合は、以下の対策をお試しください：

1. 設定で**バッチサイズを小さくする**：
   ```json
   { "batchSize": 15 }
   ```
2. **レート制限の上限が高いモデルを使用する**（例：`google/gemini-3.5-flash`は制限が緩やかです）
3. 大量の翻訳ペアには、**より安価で高速なメソッドを使用する** — Google Translateにはレート制限がありません：
   ```json
   { "pairs": { "en:it": { "method": "google-translate" } } }
   ```

### モデルが見つからない / 404エラー

直接LLMプロバイダー（`openai`、`anthropic`、`gemini`）は、初回使用時にモデルの文字列を検証します。以下の警告が表示された場合：

**"looks like an OpenRouter path"** — 直接プロバイダーでOpenRouter形式のモデル（`google/gemini-3.5-flash`）を使用しています。直接プロバイダーでは、モデル名のみを使用します：

```diff
- { "method": "gemini", "model": "google/gemini-3.5-flash" }
+ { "method": "gemini", "model": "gemini-2.5-flash" }
```

または、`llm`メソッドに切り替えてOpenRouterを使用します：
```json
{ "method": "llm", "model": "google/gemini-3.5-flash" }
```

**"is an Anthropic/OpenAI/Gemini model"** — 誤ったプロバイダーにモデルを送信しています：

```diff
- { "method": "gemini", "model": "claude-sonnet-4-6" }
+ { "method": "anthropic", "model": "claude-sonnet-4-6" }
```

**"not found in available models"** — モデルが非推奨になっているか、スペルが間違っている可能性があります。Rosettaはプロバイダーの最新のモデルリストを取得し、代替案を提案します。現在のモデル名については、プロバイダーのドキュメントを確認してください。

:::tip モデルの非推奨化について
プロバイダーは定期的にモデル名を廃止します。プロバイダーのアップデート後に翻訳が突然失敗するようになった場合は、`[WARN]`の出力を確認してください。現在の代替モデルが表示されます。
:::

## 翻訳の品質

### 翻訳がソース言語のままになる

これは品質ゲートで検出されます。翻訳が英語のソースと完全に一致する場合、拒否されて再試行されます。この問題が続く場合は、以下の対策をお試しください：

1. **モデルを確認する** — 一部のモデルは特定の言語ペアでパフォーマンスが低下します
2. **トーンや文体の指示を追加する** — どの言語で出力するかをモデルに指示します：
   ```json
   {
     "languages": {
       "ja": { "name": "Japanese", "register": "Polite/formal Japanese" }
     }
   }
   ```
3. **別のモデルを試す** — `gpt-4o-mini`から`gpt-4o`または`google/gemini-2.5-pro`に切り替えます

### 誤った文字体系の出力（例：日本語に対してラテン文字が出力される）

品質ゲートの文字体系コンプライアンスチェックにより、ほとんどのケースは検出されます。この問題が続く場合は、以下の対策をお試しください：

- ロケールコードが正しいか確認する（`jp`ではなく`ja`）
- `register`フィールドに明示的な文字体系の指示を追加する：
  ```json
  { "register": "Japanese using hiragana, katakana, and kanji" }
  ```

### 出力におけるハルシネーションのパターン

繰り返されるトライグラムのパターン（例："hello hello hello"）は、ハルシネーションループ検出器によって検出されます。出力が文字化けしているにもかかわらず検出器を通過してしまう場合は、以下の対策をお試しください：

1. **バッチサイズを小さくする** — バッチサイズを小さくすると、より焦点の絞られた出力が得られます
2. **より強力なモデルを使用する** — 大規模なモデルほど、非ラテン文字でのハルシネーションが少なくなります
3. **コーチングデータを追加する** — 辞書の用語が翻訳の基準となります

## ファイルとフォーマットの問題

### "No locale files found"

Rosettaはロケールファイルを自動検出します。見つからない場合は、以下の対策をお試しください：

1. **`localesDir`を確認する** — ロケールファイルが含まれるディレクトリを指定する必要があります：
   ```json
   { "localesDir": "./locales" }
   ```
2. **ファイル名を確認する** — ファイル名はロケールコードにする必要があります：`en.json`、`fr.json`など
3. **フォーマットを確認する** — サポートされているフォーマット：JSON、ネストされたJSON、YAML、TOML

### ロックファイルの競合

`.i18n-rosetta.lock`が不正な状態になった場合：

```bash
# Reset the lock file (next sync will retranslate everything)
rm .i18n-rosetta.lock
npx i18n-rosetta sync
```

:::warning
ロックファイルを削除すると、次回の同期時に変更されたキーだけでなく、すべてのキーが再翻訳されます。大規模なプロジェクトではAPIコストに影響を与えるため注意してください。
:::

### 特定のキーの再翻訳

個別の翻訳が間違っており、ロックファイルを削除せずに強制的に再翻訳したい場合：

```bash
# Re-translate a single key
npx i18n-rosetta sync --force-keys "hero.title"

# Re-translate multiple keys
npx i18n-rosetta sync --force-keys "nav.home,nav.about,footer.copyright"
```

`--force-keys`フラグは、指定した特定のキーに対するロックファイルのハッシュチェックを上書きし、他のキーに影響を与えることなく強制的に再翻訳を行います。

### コンテンツの翻訳によってコードブロックが破損する

通常、この問題は発生しません（コードブロックは翻訳前に保護されます）。もし発生した場合は、以下の対策をお試しください：

1. コードブロックが標準のフェンシング（3つのバッククォート）を使用しているか確認する
2. ソースのMarkdownに閉じられていないコードブロックがないか確認する
3. イシューを報告する — これはセンチネル保護システムのバグです

## CLIの問題

### `--watch`が変更を検出しない

ファイルの監視にはNode.jsネイティブの`fs.watch`を使用しています。既知の問題は以下の通りです：

- **ネットワークドライブ** — NFS/SMBマウントでは`fs.watch`が確実に動作しません
- **Dockerボリューム** — ポーリングモードを使用するか、コンテナ内でrosettaを実行してください
- **大規模なディレクトリ** — ウォッチャーは`localesDir`を再帰的に監視します。ツリーが非常に深い場合、OSの制限を超える可能性があります

### `npx`が古いバージョンで実行される

```bash
# Clear the npx cache
npx --yes i18n-rosetta@latest sync
```

または、グローバルにインストールします：

```bash
npm install -g i18n-rosetta
i18n-rosetta sync
```

## パフォーマンス

### 多くの言語で同期が遅い

Rosettaはデフォルトですべてのロケールを並行して翻訳します。それでも同期が遅い場合は、以下の対策をお試しください：

1. **大量の翻訳ペアにはGoogle Translateを使用する** — LLM翻訳よりも10〜50倍高速です
2. **バッチサイズを大きくする**（デフォルトは80）：
   ```json
   { "batchSize": 120 }
   ```
3. **並行処理を調整する** — JSONロケールの並行処理はデフォルトで200、コンテンツは48です。APIプロバイダーがより高いレート制限をサポートしている場合：
   ```bash
   npx i18n-rosetta sync --json-concurrency 80 --content-concurrency 20
   ```
4. **高速なモデルを使用する** — `gpt-4o-mini`は`gpt-4o`よりも大幅に高速です

### APIコストが高い

- **バッチサイズを確認する** — バッチサイズが大きいほどAPI呼び出し回数が減り、コストが下がります
- **翻訳メモリを使用する** — TMはデフォルトでオンになっています。`i18n-rosetta tm stats`を実行して機能しているか確認してください。複数回同期してもエントリが0の場合は、`.rosetta/`ディレクトリの権限に問題がある可能性があります
- **プロンプトキャッシングを使用する** — Rosettaは、AnthropicおよびGoogleのモデルでキャッシュヒット率を上げるために、システムメッセージとユーザーメッセージを分割します
- **Tier 2の言語にはGoogle Translateを使用する** — [30言語の翻訳](/docs/tutorials/translate-30-languages)のクックブックを参照してください

### プロバイダー切り替え後の古い翻訳

ある翻訳メソッドから別のメソッド（例：`llm`から`deepl`）に切り替えた場合、ソーステキストが変更されていないキーに対しては、TMキャッシュが以前のメソッドの古い翻訳を引き続き提供する可能性があります。キャッシュキーにはメソッド名が含まれているため、ほとんどのケースは自動的に処理されます。ただし、同じメソッド内で`model`を変更した場合：

```bash
# Force fresh translations for all keys
i18n-rosetta sync --no-tm

# Or clear the cache entirely and re-sync
i18n-rosetta tm clear --yes
i18n-rosetta sync
```

キャッシュキーの設計の詳細については、[翻訳メモリ](/docs/concepts/translation-memory)を参照してください。

## まだ解決しませんか？

- **[GitHub Issues](https://github.com/gamedaysuits/i18n-rosetta/issues)** — 既存のイシューを検索するか、新しいイシューを報告する
- **[アーキテクチャドキュメント](/docs/concepts/architecture)** — システム設計を理解する
- **[品質ゲート](/docs/concepts/quality-gate)** — 内部での検証の仕組み