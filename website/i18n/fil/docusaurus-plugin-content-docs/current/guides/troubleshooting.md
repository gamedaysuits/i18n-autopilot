---
sidebar_position: 6
title: "Troubleshooting"
---
# Troubleshooting

Mga common issues at solutions para sa i18n-rosetta.

## API & Authentication

### "OPENROUTER_API_KEY not found"

Kailangan po ng Rosetta ng API key para sa LLM translation. I-set ito bilang environment variable:

```bash
export OPENROUTER_API_KEY="sk-or-v1-..."
```

O kaya sa isang `.env` file (kung naglo-load ang project niyo ng `.env` files):

```
OPENROUTER_API_KEY=sk-or-v1-...
```

:::tip
Kung Google Translate API key lang ang meron kayo, mag-a-auto-detect ang rosetta at gagamitin ang Google Translate bilang default method. No config change needed po.
:::

### "401 Unauthorized" from OpenRouter

Invalid o expired na po ang inyong API key. I-verify ito sa [openrouter.ai/keys](https://openrouter.ai/keys).

### "429 Too Many Requests" / Rate Limiting

Hina-handle ng Rosetta ang rate limits internally gamit ang exponential backoff. Kung palagi kayong nakaka-hit ng rate limits:

1. **I-reduce ang batch size** sa inyong config:
   ```json
   { "batchSize": 15 }
   ```
2. **Gumamit ng model na may higher rate limits** (e.g., may generous limits ang `google/gemini-3.5-flash`)
3. **Gumamit ng cheaper/faster method** para sa high-volume pairs — walang rate limits ang Google Translate:
   ```json
   { "pairs": { "en:it": { "method": "google-translate" } } }
   ```

### Model Not Found / 404 Errors

Vina-validate ng direct LLM providers (`openai`, `anthropic`, `gemini`) ang inyong model string sa first use. Kung makakita kayo ng warning:

**"looks like an OpenRouter path"** — Gumagamit kayo ng OpenRouter-format model (`google/gemini-3.5-flash`) sa isang direct provider. Gumagamit ng bare model names ang direct providers:

```diff
- { "method": "gemini", "model": "google/gemini-3.5-flash" }
+ { "method": "gemini", "model": "gemini-2.5-flash" }
```

O kaya mag-switch sa `llm` method para magamit ang OpenRouter:
```json
{ "method": "llm", "model": "google/gemini-3.5-flash" }
```

**"is an Anthropic/OpenAI/Gemini model"** — Nagsesend kayo ng model sa maling provider:

```diff
- { "method": "gemini", "model": "claude-sonnet-4-6" }
+ { "method": "anthropic", "model": "claude-sonnet-4-6" }
```

**"not found in available models"** — Baka deprecated o misspelled ang model. Fini-fetch ng Rosetta ang live model list ng provider at nag-su-suggest ng alternatives. I-check ang docs ng provider para sa current model names.

:::tip Model deprecation happens
Regular na nagre-retire ng model names ang mga providers. Kung biglang mag-fail ang translations pagkatapos ng isang provider update, i-check ang `[WARN]` output — ipapakita nito sa inyo ang current alternatives.
:::

## Translation Quality

### Nag-e-echo ang translations sa source language

Sinasalo ito ng quality gate. Kung identical ang translation sa English source, nire-reject ito at nire-retry. Kung mag-persist ito:

1. **I-check ang model** — May mga models na poor ang performance para sa specific language pairs
2. **Mag-add ng register instructions** — Sabihin sa model kung anong language ang ipo-produce:
   ```json
   {
     "languages": {
       "ja": { "name": "Japanese", "register": "Polite/formal Japanese" }
     }
   }
   ```
3. **Subukan ang ibang model** — Mag-switch mula `gpt-4o-mini` papuntang `gpt-4o` o `google/gemini-2.5-pro`

### Wrong script output (e.g., Latin text para sa Japanese)

Sinasalo ng script compliance check ng quality gate ang karamihan sa mga cases. Kung mag-persist ito:

- I-verify kung tama ang locale code (`ja`, hindi `jp`)
- Mag-add ng explicit script instructions sa `register` field:
  ```json
  { "register": "Japanese using hiragana, katakana, and kanji" }
  ```

### Hallucination patterns sa output

Sinasalo ng hallucination loop detector ang repeated trigram patterns (e.g., "hello hello hello"). Kung garbled ang output pero pumasa sa detector:

1. **I-reduce ang batch size** — Nagpo-produce ng mas focused na output ang smaller batches
2. **Gumamit ng stronger model** — Mas less mag-hallucinate ang larger models sa non-Latin scripts
3. **Mag-add ng coaching data** — Nagsisilbing anchor ng translation ang dictionary terms

## File & Format Issues

### "No locale files found"

Nag-a-auto-detect ang Rosetta ng locale files. Kung hindi nito mahanap:

1. **I-check ang `localesDir`** — Dapat naka-point ito sa directory na naglalaman ng locale files:
   ```json
   { "localesDir": "./locales" }
   ```
2. **I-check ang file naming** — Dapat naka-name ang files by locale code: `en.json`, `fr.json`, etc.
3. **I-check ang format** — Supported formats: JSON, nested JSON, YAML, TOML

### Lock file conflicts

Kung magkaroon ng bad state ang `.i18n-rosetta.lock`:

```bash
# Reset the lock file (next sync will retranslate everything)
rm .i18n-rosetta.lock
npx i18n-rosetta sync
```

:::warning
Ang pag-delete ng lock file ay nangangahulugang ire-retranslate ng next sync ang lahat ng keys, hindi lang ang mga nabago. May API cost implications po ito para sa large projects.
:::

### Pag-retranslate ng specific keys

Kung mali ang individual translations at gusto niyo itong i-force na ma-retranslate nang hindi dine-delete ang lock file:

```bash
# Re-translate a single key
npx i18n-rosetta sync --force-keys "hero.title"

# Re-translate multiple keys
npx i18n-rosetta sync --force-keys "nav.home,nav.about,footer.copyright"
```

Ino-override ng `--force-keys` flag ang lock file hash check para sa mga specific keys na iyon, kaya nafo-force ang re-translation nang hindi naaapektuhan ang ibang keys.

### Nako-corrupt ng content translation ang code blocks

Hindi po dapat ito mangyari — naka-shield ang code blocks bago ang translation. Kung mangyari man ito:

1. I-verify kung gumagamit ng standard fencing ang code block (triple backticks)
2. I-check kung may unclosed code blocks sa source Markdown
3. Mag-file ng issue — bug po ito sa sentinel shielding system

## CLI Issues

### Hindi nade-detect ng `--watch` ang changes

Gumagamit ang file watching ng Node.js native `fs.watch`. Mga known issues:

- **Network drives** — Hindi reliable na gumagana ang `fs.watch` sa NFS/SMB mounts
- **Docker volumes** — Gumamit ng polling mode o i-run ang rosetta sa loob ng container
- **Large directories** — Minomonitor ng watcher ang `localesDir` recursively; baka mag-exceed sa OS limits ang very deep trees

### Nagra-run ng old version ang `npx`

```bash
# Clear the npx cache
npx --yes i18n-rosetta@latest sync
```

O kaya i-install globally:

```bash
npm install -g i18n-rosetta
i18n-rosetta sync
```

## Performance

### Mabagal ang sync para sa maraming languages

Tinatranslate ng Rosetta ang lahat ng locales in parallel by default. Kung mabagal pa rin ang sync:

1. **Gumamit ng Google Translate para sa high-volume pairs** — 10–50× faster po ito kaysa sa LLM translation
2. **I-increase ang batch size** (default ay 80):
   ```json
   { "batchSize": 120 }
   ```
3. **I-tune ang concurrency** — Naka-default sa 200 ang JSON locale parallelism at 48 sa content. Kung nagsu-support ang inyong API provider ng higher rate limits:
   ```bash
   npx i18n-rosetta sync --json-concurrency 80 --content-concurrency 20
   ```
4. **Gumamit ng fast model** — Significantly faster ang `gpt-4o-mini` kaysa sa `gpt-4o`

### High API costs

- **I-check ang batch sizes** — Larger batches = fewer API calls = lower cost
- **Gumamit ng Translation Memory** — Naka-on by default ang TM. I-run ang `i18n-rosetta tm stats` para ma-verify kung gumagana ito. Kung makakita kayo ng 0 entries pagkatapos ng multiple syncs, baka may mali sa inyong `.rosetta/` directory permissions
- **Gumamit ng prompt caching** — Ini-split ng Rosetta ang system/user messages para sa cache hits sa Anthropic at Google models
- **Gumamit ng Google Translate para sa Tier 2 languages** — Tingnan ang [Translate 30 Languages](/docs/tutorials/translate-30-languages) cookbook

### Stale translations pagkatapos mag-switch ng providers

Kung mag-switch kayo mula sa isang translation method papunta sa iba (e.g., `llm` to `deepl`), baka mag-serve pa rin ang TM cache ng old translations mula sa previous method para sa mga keys na hindi nagbago ang source text. Kasama sa cache key ang method name, kaya karamihan sa mga cases ay handled automatically. Pero kung binago niyo ang `model` sa loob ng same method:

```bash
# Force fresh translations for all keys
i18n-rosetta sync --no-tm

# Or clear the cache entirely and re-sync
i18n-rosetta tm clear --yes
i18n-rosetta sync
```

Tingnan ang [Translation Memory](/docs/concepts/translation-memory) para sa details ng cache key design.

## Stuck pa rin?

- **[GitHub Issues](https://github.com/gamedaysuits/i18n-rosetta/issues)** — Mag-search ng existing issues o mag-file ng bago
- **[Architecture Docs](/docs/concepts/architecture)** — Intindihin ang system design
- **[Quality Gate](/docs/concepts/quality-gate)** — Paano gumagana ang validation under the hood