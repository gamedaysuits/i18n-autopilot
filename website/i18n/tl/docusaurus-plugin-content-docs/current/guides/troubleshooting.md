---
sidebar_position: 6
title: "Troubleshooting"
---
# Troubleshooting

Mga common issues at solutions para sa i18n-rosetta.

## API & Authentication

### "OPENROUTER_API_KEY not found"

Kailangan po ng Rosetta ng API key para sa LLM translation. I-set ito bilang isang environment variable:

```bash
export OPENROUTER_API_KEY="sk-or-v1-..."
```

O kaya sa isang `.env` file (kung naglo-load ang project niyo ng `.env` files):

```
OPENROUTER_API_KEY=sk-or-v1-...
```

:::tip
Kung Google Translate API key lang po ang meron kayo, mag-a-auto-detect ang rosetta at gagamitin ang Google Translate bilang default method. Wala na pong kailangang baguhin sa config.
:::

### "401 Unauthorized" mula sa OpenRouter

Invalid o expired na po ang inyong API key. I-verify ito sa [openrouter.ai/keys](https://openrouter.ai/keys).

### "429 Too Many Requests" / Rate Limiting

Hina-handle po ng Rosetta ang rate limits internally gamit ang exponential backoff. Kung palagi kayong nakaka-hit ng rate limits:

1. **I-reduce ang batch size** sa inyong config:
   ```json
   { "batchSize": 15 }
   ```
2. **Gumamit ng model na may mas mataas na rate limits** (halimbawa, may generous limits ang `google/gemini-3.5-flash`)
3. **Gumamit ng mas mura/mas mabilis na method** para sa high-volume pairs — walang rate limits ang Google Translate:
   ```json
   { "pairs": { "en:it": { "method": "google-translate" } } }
   ```

### Model Not Found / 404 Errors

Bina-validate po ng direct LLM providers (`openai`, `anthropic`, `gemini`) ang inyong model string sa first use. Kung makakita kayo ng warning:

**"looks like an OpenRouter path"** — Gumagamit po kayo ng OpenRouter-format model (`google/gemini-3.5-flash`) sa isang direct provider. Gumagamit ng bare model names ang mga direct providers:

```diff
- { "method": "gemini", "model": "google/gemini-3.5-flash" }
+ { "method": "gemini", "model": "gemini-2.5-flash" }
```

O kaya mag-switch sa `llm` method para magamit ang OpenRouter:
```json
{ "method": "llm", "model": "google/gemini-3.5-flash" }
```

**"is an Anthropic/OpenAI/Gemini model"** — Nagse-send po kayo ng model sa maling provider:

```diff
- { "method": "gemini", "model": "claude-sonnet-4-6" }
+ { "method": "anthropic", "model": "claude-sonnet-4-6" }
```

**"not found in available models"** — Baka deprecated o misspelled po ang model. Fini-fetch ng Rosetta ang live model list ng provider at nagsu-suggest ng alternatives. I-check ang docs ng provider para sa current model names.

:::tip Nangyayari po ang model deprecation
Regular na nagre-retire ng model names ang mga providers. Kung biglang mag-fail ang translations pagkatapos ng isang provider update, i-check ang `[WARN]` output — ipapakita nito sa inyo ang mga current alternatives.
:::

## Translation Quality

### Nag-e-echo sa source language ang translations

Sinasalo po ito ng quality gate. Kung identical ang translation sa English source, nire-reject ito at nire-retry. Kung mag-persist pa rin:

1. **I-check ang model** — May mga models na poor ang performance para sa specific language pairs
2. **Magdagdag ng register instructions** — Sabihin sa model kung anong language ang ipo-produce:
   ```json
   {
     "languages": {
       "ja": { "name": "Japanese", "register": "Polite/formal Japanese" }
     }
   }
   ```
3. **Subukan ang ibang model** — Mag-switch mula `gpt-4o-mini` papuntang `gpt-4o` o `google/gemini-2.5-pro`

### Wrong script output (hal., Latin text para sa Japanese)

Sinasalo po ng script compliance check ng quality gate ang karamihan sa mga cases. Kung mag-persist pa rin:

- I-verify kung tama ang locale code (`ja`, hindi `jp`)
- Magdagdag ng explicit script instructions sa `register` field:
  ```json
  { "register": "Japanese using hiragana, katakana, and kanji" }
  ```

### Hallucination patterns sa output

Ang mga repeated trigram patterns (hal., "hello hello hello") ay sinasalo ng hallucination loop detector. Kung garbled ang output pero pumasa sa detector:

1. **I-reduce ang batch size** — Nagpo-produce ng mas focused na output ang smaller batches
2. **Gumamit ng mas malakas na model** — Mas less mag-hallucinate ang larger models sa mga non-Latin scripts
3. **Magdagdag ng coaching data** — Nagsisilbing anchor sa translation ang dictionary terms

## File & Format Issues

### "No locale files found"

Nag-a-auto-detect po ang Rosetta ng locale files. Kung hindi nito mahanap:

1. **I-check ang `localesDir`** — Dapat naka-point ito sa directory na naglalaman ng locale files:
   ```json
   { "localesDir": "./locales" }
   ```
2. **I-check ang file naming** — Dapat nakapangalan ang files ayon sa locale code: `en.json`, `fr.json`, atbp.
3. **I-check ang format** — Supported formats: JSON, nested JSON, YAML, TOML

### Lock file conflicts

Kung magkaroon ng bad state ang `.i18n-rosetta.lock`:

```bash
# Reset the lock file (next sync will retranslate everything)
rm .i18n-rosetta.lock
npx i18n-rosetta sync
```

:::warning
Kapag dinelete niyo po ang lock file, ibig sabihin ire-retranslate ng susunod na sync ang lahat ng keys, hindi lang ang mga nabago. May API cost implications po ito para sa malalaking projects.
:::

### Pag-retranslate ng specific keys

Kung mali po ang individual translations at gusto ninyong i-force na ma-retranslate ang mga ito nang hindi dine-delete ang lock file:

```bash
# Re-translate a single key
npx i18n-rosetta sync --force-keys "hero.title"

# Re-translate multiple keys
npx i18n-rosetta sync --force-keys "nav.home,nav.about,footer.copyright"
```

Ino-override ng `--force-keys` flag ang lock file hash check para sa mga specific keys na iyon, kaya nafo-force ang re-translation nang hindi naaapektuhan ang ibang keys.

### Nako-corrupt ng content translation ang code blocks

Hindi po dapat ito nangyayari — naka-shield ang code blocks bago ang translation. Kung mangyari man ito:

1. I-verify kung gumagamit ng standard fencing (triple backticks) ang code block
2. I-check kung may unclosed code blocks sa source Markdown
3. Mag-file ng issue — isa po itong bug sa sentinel shielding system

## CLI Issues

### Hindi nade-detect ng `--watch` ang changes

Gumagamit po ang file watching ng Node.js native `fs.watch`. Mga known issues:

- **Network drives** — Hindi reliable na gumagana ang `fs.watch` sa NFS/SMB mounts
- **Docker volumes** — Gumamit ng polling mode o i-run ang rosetta sa loob ng container
- **Large directories** — Minomonitor ng watcher ang `localesDir` nang recursively; maaaring mag-exceed sa OS limits ang masyadong deep na trees

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

Sini-sequentially translate po ng Rosetta ang pairs by default. Para mapabilis ang multi-language syncs:

1. **Gumamit ng Google Translate para sa high-volume pairs** — 10–50× itong mas mabilis kaysa sa LLM translation
2. **I-increase ang batch size** (hanggang 50, default ay 30):
   ```json
   { "batchSize": 50 }
   ```
3. **Gumamit ng mabilis na model** — Mas mabilis nang di-hamak ang `gpt-4o-mini` kaysa sa `gpt-4o`

### Mataas na API costs

- **I-check ang batch sizes** — Larger batches = mas kaunting API calls = mas mababang cost
- **Gumamit ng prompt caching** — Ini-split ng Rosetta ang system/user messages para sa cache hits sa Anthropic at Google models
- **Gumamit ng Google Translate para sa Tier 2 languages** — Tingnan ang [Translate 30 Languages](/docs/tutorials/translate-30-languages) cookbook

## Na-stuck pa rin?

- **[GitHub Issues](https://github.com/gamedaysuits/i18n-rosetta/issues)** — Mag-search ng existing issues o mag-file ng bago
- **[Architecture Docs](/docs/concepts/architecture)** — Intindihin ang system design
- **[Quality Gate](/docs/concepts/quality-gate)** — Paano gumagana ang validation under the hood