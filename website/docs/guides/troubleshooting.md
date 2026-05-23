---
sidebar_position: 6
title: Troubleshooting
---

# Troubleshooting

Common issues and solutions for i18n-rosetta.

## API & Authentication

### "OPENROUTER_API_KEY not found"

Rosetta requires an API key for LLM translation. Set it as an environment variable:

```bash
export OPENROUTER_API_KEY="sk-or-v1-..."
```

Or in a `.env` file (if your project loads `.env` files):

```
OPENROUTER_API_KEY=sk-or-v1-...
```

:::tip
If you only have a Google Translate API key, rosetta auto-detects and uses Google Translate as the default method. No config change needed.
:::

### "401 Unauthorized" from OpenRouter

Your API key is invalid or expired. Verify it at [openrouter.ai/keys](https://openrouter.ai/keys).

### "429 Too Many Requests" / Rate Limiting

Rosetta handles rate limits internally with exponential backoff. If you consistently hit rate limits:

1. **Reduce batch size** in your config:
   ```json
   { "batchSize": 15 }
   ```
2. **Use a model with higher rate limits** (e.g., `google/gemini-3.5-flash` has generous limits)
3. **Use a cheaper/faster method** for high-volume pairs — Google Translate has no rate limits:
   ```json
   { "pairs": { "en:it": { "method": "google-translate" } } }
   ```

### Model Not Found / 404 Errors

Direct LLM providers (`openai`, `anthropic`, `gemini`) validate your model string on first use. If you see a warning:

**"looks like an OpenRouter path"** — You're using an OpenRouter-format model (`google/gemini-3.5-flash`) with a direct provider. Direct providers use bare model names:

```diff
- { "method": "gemini", "model": "google/gemini-3.5-flash" }
+ { "method": "gemini", "model": "gemini-2.5-flash" }
```

Or switch to the `llm` method to use OpenRouter:
```json
{ "method": "llm", "model": "google/gemini-3.5-flash" }
```

**"is an Anthropic/OpenAI/Gemini model"** — You're sending a model to the wrong provider:

```diff
- { "method": "gemini", "model": "claude-sonnet-4-6" }
+ { "method": "anthropic", "model": "claude-sonnet-4-6" }
```

**"not found in available models"** — The model may be deprecated or misspelled. Rosetta fetches the provider's live model list and suggests alternatives. Check the provider's docs for current model names.

:::tip Model deprecation happens
Providers retire model names regularly. If translations suddenly fail after a provider update, check the `[WARN]` output — it will show you current alternatives.
:::

## Translation Quality

### Translations echo the source language

The quality gate catches this. If a translation is identical to the English source, it's rejected and retried. If it persists:

1. **Check the model** — Some models perform poorly for specific language pairs
2. **Add register instructions** — Tell the model what language to produce:
   ```json
   {
     "languages": {
       "ja": { "name": "Japanese", "register": "Polite/formal Japanese" }
     }
   }
   ```
3. **Try a different model** — Switch from `gpt-4o-mini` to `gpt-4o` or `google/gemini-2.5-pro`

### Wrong script output (e.g., Latin text for Japanese)

The quality gate's script compliance check catches most cases. If it persists:

- Verify the locale code is correct (`ja`, not `jp`)
- Add explicit script instructions in the `register` field:
  ```json
  { "register": "Japanese using hiragana, katakana, and kanji" }
  ```

### Hallucination patterns in output

Repeated trigram patterns (e.g., "hello hello hello") are caught by the hallucination loop detector. If output is garbled but passes the detector:

1. **Reduce batch size** — Smaller batches produce more focused output
2. **Use a stronger model** — Larger models hallucinate less on non-Latin scripts
3. **Add coaching data** — Dictionary terms anchor the translation

## File & Format Issues

### "No locale files found"

Rosetta auto-detects locale files. If it can't find them:

1. **Check `localesDir`** — Must point to the directory containing locale files:
   ```json
   { "localesDir": "./locales" }
   ```
2. **Check file naming** — Files must be named by locale code: `en.json`, `fr.json`, etc.
3. **Check format** — Supported formats: JSON, nested JSON, YAML, TOML

### Lock file conflicts

If `.i18n-rosetta.lock` gets into a bad state:

```bash
# Reset the lock file (next sync will retranslate everything)
rm .i18n-rosetta.lock
npx i18n-rosetta sync
```

:::warning
Deleting the lock file means the next sync will retranslate all keys, not just changed ones. This has API cost implications for large projects.
:::

### Retranslating specific keys

If individual translations are wrong and you want to force them to be re-translated without deleting the lock file:

```bash
# Re-translate a single key
npx i18n-rosetta sync --force-keys "hero.title"

# Re-translate multiple keys
npx i18n-rosetta sync --force-keys "nav.home,nav.about,footer.copyright"
```

The `--force-keys` flag overrides the lock file hash check for those specific keys, forcing re-translation without affecting any other keys.

### Content translation corrupts code blocks

This shouldn't happen — code blocks are shielded before translation. If it does:

1. Verify the code block uses standard fencing (triple backticks)
2. Check for unclosed code blocks in the source Markdown
3. File an issue — this is a bug in the sentinel shielding system

## CLI Issues

### `--watch` doesn't detect changes

File watching uses Node.js native `fs.watch`. Known issues:

- **Network drives** — `fs.watch` doesn't work reliably on NFS/SMB mounts
- **Docker volumes** — Use polling mode or run rosetta inside the container
- **Large directories** — The watcher monitors `localesDir` recursively; very deep trees may exceed OS limits

### `npx` runs an old version

```bash
# Clear the npx cache
npx --yes i18n-rosetta@latest sync
```

Or install globally:

```bash
npm install -g i18n-rosetta
i18n-rosetta sync
```

## Performance

### Sync is slow for many languages

Rosetta translates pairs sequentially by default. To speed up multi-language syncs:

1. **Use Google Translate for high-volume pairs** — It's 10–50× faster than LLM translation
2. **Increase batch size** (up to 50, default is 30):
   ```json
   { "batchSize": 50 }
   ```
3. **Use a fast model** — `gpt-4o-mini` is significantly faster than `gpt-4o`

### High API costs

- **Check batch sizes** — Larger batches = fewer API calls = lower cost
- **Use prompt caching** — Rosetta splits system/user messages for cache hits on Anthropic and Google models
- **Use Google Translate for Tier 2 languages** — See the [Translate 30 Languages](/docs/tutorials/translate-30-languages) cookbook

## Still Stuck?

- **[GitHub Issues](https://github.com/gamedaysuits/i18n-rosetta/issues)** — Search existing issues or file a new one
- **[Architecture Docs](/docs/concepts/architecture)** — Understand the system design
- **[Quality Gate](/docs/concepts/quality-gate)** — How validation works under the hood
