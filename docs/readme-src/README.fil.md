# i18n-rosetta

[![npm version](https://img.shields.io/npm/v/i18n-rosetta.svg)](https://www.npmjs.com/package/i18n-rosetta)
[![CI](https://github.com/gamedaysuits/i18n-rosetta/actions/workflows/ci.yml/badge.svg)](https://github.com/gamedaysuits/i18n-rosetta/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

🌐 **README translations** — *translated by rosetta, of course:*
[Français](docs/README.fr.md) · [Deutsch](docs/README.de.md) · [Español](docs/README.es.md) · [Português](docs/README.pt.md) · [Nederlands](docs/README.nl.md) · [日本語](docs/README.ja.md) · [한국어](docs/README.ko.md) · [简体中文](docs/README.zh.md) · [ไทย](docs/README.th.md) · [Tiếng Việt](docs/README.vi.md) · [Filipino](docs/README.fil.md) · [العربية](docs/README.ar.md)

I-translate ang iyong locale files gamit ang isang command:

```bash
npx i18n-rosetta sync
```

Auto-detect ng Rosetta ang iyong locale files, ang kanilang format, at ang target na languages. I-translate nito ang mga missing keys, nilalaktawan ang mga tapos na, at isinusulat ang mga resulta. 'Yun lang.

## Bakit Hindi Na Lang I-script Ito Nang Ikaw Mismo?

Pwede kang magsulat ng mabilis na script na nag-loop sa iyong English keys at tumatawag sa Google Translate. Karamihan sa mga developers ay ginagawa 'yan — umaabot lang ng mga 30 linya. Narito kung bakit ito nagkakaroon ng problema:

- **Walang change detection.** Kapag in-update mo ang isang English string, ang translation ay mananatiling luma forever. Sinusubaybayan ng Rosetta ang bawat source value gamit ang SHA-256 hashes at isinasalin lang kung ano ang nagbago.
- **Walang batching.** Isang API call per key means 200 keys = 200 round trips. Nagba-batch ang Rosetta nang matalino (configurable, default 30 keys/batch para sa LLM, 128 para sa Google).
- **Walang quality gate.** Ang machine translation ay nagha-hallucinate, inuulit ang source, o naglalabas sa maling script. Bine-validate ng Rosetta ang bawat translation bago isulat ito — ang maling script, length inflation, at source echoes ay nahuhuli at nire-reject.
- **Walang format awareness.** Hardcoded sa JSON? Hinahawakan ng Rosetta ang JSON, TOML, YAML, at Hugo Markdown (frontmatter + body) na may auto-detection.
- **Walang safety.** Pinoprotektahan ng Rosetta laban sa prototype pollution, path traversal sa pamamagitan ng crafted locale codes, at code block corruption habang nagta-translate ng Markdown.

Ang Rosetta ay ang production version ng script na 'yan.

## Quick Start

```bash
npm install --save-dev i18n-rosetta
```

### Kumuha ng API Key

Kailangan ng Rosetta ng translation backend. Pumili ng isa:

| Provider | Key | Best for |
|----------|-----|----------|
| **OpenRouter** (recommended) | `OPENROUTER_API_KEY` | Content-heavy projects, Markdown, 200+ models |
| **OpenAI** | `OPENAI_API_KEY` | Direct GPT-4o access |
| **Anthropic** | `ANTHROPIC_API_KEY` | Direct Claude access |
| **Gemini** | `GEMINI_API_KEY` | Free tier available |
| **DeepL** | `DEEPL_API_KEY` | European languages, glossary support |
| **Google Translate** | `GOOGLE_TRANSLATE_API_KEY` | 130+ languages, high volume |

**Pinakamabilis na simula** (libre): Mag-sign up sa [aistudio.google.com](https://aistudio.google.com/apikey) para sa isang libreng Gemini key:

```bash
export GEMINI_API_KEY=AI...
npx i18n-rosetta sync --method gemini
```

**OpenRouter** (200+ models): Mag-sign up sa [openrouter.ai](https://openrouter.ai), tapos:

```bash
export OPENROUTER_API_KEY=sk-or-v1-...
npx i18n-rosetta sync
```

**Google Translate** alternative (key-value pairs lang — walang Markdown awareness):

```bash
export GOOGLE_TRANSLATE_API_KEY=...
npx i18n-rosetta sync --method google-translate
```

> **Note**: Kung `GOOGLE_TRANSLATE_API_KEY` lang ang naka-set, auto-switches ang rosetta sa Google Translate. Walang config change na kailangan. Gumagamit ng REST API nang direkta — walang SDK, walang service account, walang `pip install`. Ang key lang.

'Yun lang. Para sa mas maraming control, gumawa ng config file:

```bash
npx i18n-rosetta init                        # guided wizard — walks you through registers, methods, and content
npx i18n-rosetta init --yes --langs fr,de,ja  # quick setup with specific languages and default registers
```

Ang bawat language ay may **register presets** — pre-built tone/formality instructions na naka-tune sa linguistic system nito (vouvoiement para sa French, Siezen para sa German, です/ます para sa Japanese, 해요체 para sa Korean). Hinahayaan ka ng init wizard na mag-browse at pumili ng presets, o ipasa ang `--yes` para tanggapin ang defaults.

### Non-English Source

Kung ang iyong source language ay hindi English:

```bash
i18n-rosetta sync --source fr                      # CLI flag
```

O i-set ito nang permanente sa iyong config:

```json
{ "inputLocale": "fr" }
```

## Ano ang Ginagawa Nito

Ikaw ang humahawak sa i18n framework (next-intl, i18next, Hugo). Hinahawakan ng Rosetta ang translation files.

- **Multi-format** — JSON, TOML, YAML, at Hugo Markdown (front matter + body)
- **Incremental** — Nagta-translate lang kung ano ang nagbago (SHA-256 hash tracking)
- **Quality-gated** — Bine-validate ang bawat translation: nahuhuli ang hallucinations, wrong-script output, source echoes, at length inflation
- **Content-aware** — Pinoprotektahan ng LLM methods ang code blocks, shortcodes, links, at interpolation variables habang nagta-translate ng Markdown
- **Pipeline tools** — `lint`, `audit`, `integrity`, `seo` para sa CI gates
- **Zero dependencies** — Node.js built-ins lang. Walang SDKs, walang native modules. Kailangan ng Node 20+

## Higit Pa sa Google Translate

Ang quick start ay magpapagana sa iyo gamit ang isang LLM o Google Translate. Ngunit sinusuportahan ng Google Translate ang ~130 languages. Mayroong mahigit 7,000.

**Ang pangunahing ideya ng Rosetta: ang translation method ay configurable per language pair.** Gamitin ang Google Translate para sa French, isang LLM na may morphological coaching para sa Plains Cree, at isang community-hosted API para sa Quechua — lahat sa iisang project, lahat gamit ang parehong CLI.

```json
{
  "version": 3,
  "pairs": {
    "en:fr": { "method": "google-translate" },
    "en:ja": { "method": "llm" },
    "en:crk": { "methodPlugin": "crk-coached-v1" }
  }
}
```

Kung malalaman mo kung paano mag-translate ng language pair — sa pamamagitan ng prompt engineering, community dictionaries, FST pipelines, o fine-tuned models — hinahayaan ka ng rosetta na i-package ang method na iyon bilang isang plugin at i-deploy ito kasama ng lahat ng iba pa.

> Nagsimula sa pag-translate ng isang production website sa Plains Cree, kung saan walang off-the-shelf API. Ang per-pair architecture ay hindi theoretical — ito ay umiiral dahil kailangan ng isang project ang Google Translate para sa French at isang coached FST pipeline para sa isang Indigenous language, na tumatakbo nang magkatabi sa parehong sync command.

Ang kasamang [MT Eval Harness](https://github.com/gamedaysuits/gds-mt-eval-harness) ay nagpapahintulot sa iyo na mag-benchmark at magkumpara ng translation approaches, pagkatapos ay i-export ang gumaganang methods bilang rosetta plugins. Sinuman na nagsasalita ng parehong languages ay maaaring mag-develop, mag-test, at magbahagi ng translation method — walang proprietary platform na kailangan.

### Piliin ang Iyong Method

Sinusuportahan ng Rosetta ang 10 translation methods. Ang bawat language pair ay maaaring gumamit ng ibang method.

**LLM providers** — best for quality, Markdown-aware, coaching-compatible:

| Method | Key | What It Does |
|--------|-----|-------------|
| `llm` (default) | `OPENROUTER_API_KEY` | LLM via OpenRouter — 200+ models, auto-routing |
| `llm-coached` | `OPENROUTER_API_KEY` | LLM + grammar rules, dictionaries, style notes |
| `openai` | `OPENAI_API_KEY` | Direct OpenAI API (gpt-4o, gpt-4o-mini) |
| `anthropic` | `ANTHROPIC_API_KEY` | Direct Anthropic API (Claude Sonnet, Haiku, Opus) |
| `gemini` | `GEMINI_API_KEY` | Direct Google Gemini API (Flash, Pro) — free tier available |

**Traditional MT** — best for speed, cost, at high-volume key-value pairs:

| Method | Key | What It Does |
|--------|-----|-------------|
| `google-translate` | `GOOGLE_TRANSLATE_API_KEY` | Google Cloud Translation API v2 (130+ languages) |
| `deepl` | `DEEPL_API_KEY` | DeepL API with glossary support (30+ languages) |
| `microsoft-translator` | `MICROSOFT_TRANSLATOR_API_KEY` | Azure Cognitive Services Translator (100+ languages) |
| `libretranslate` | *(self-hosted)* | Self-hosted LibreTranslate (AGPL, free) |

**Infrastructure** — para sa custom o community-hosted endpoints:

| Method | Key | What It Does |
|--------|-----|-------------|
| `api` | *(per provider)* | Thin HTTP client for any REST endpoint |

```bash
# Force a specific method for one run
i18n-rosetta sync --method deepl

# Or configure per pair
```

```json
{
  "pairs": {
    "en:fr": { "method": "deepl" },
    "en:ja": { "method": "openai", "model": "gpt-4o" },
    "en:crk": { "methodPlugin": "crk-coached-v1" }
  }
}
```

> **Note**: Ang Traditional MT methods (Google Translate, DeepL, Microsoft Translator, LibreTranslate) ay mahusay na humahawak ng key-value pairs ngunit hindi kayang ligtas na i-translate ang Markdown content. Para sa content-heavy projects, inirerekomenda ang LLM methods — tahasan nilang pinoprotektahan ang code blocks, shortcodes, at interpolation variables.

## Plugins

Ang mga plugin ay pre-packaged translation recipes para sa partikular na language pairs. Ang mga ito ay JSON manifests — hindi code — na nagsasabi sa rosetta kung aling method ang gagamitin, anong settings, at anong quality ang na-benchmark.

```bash
i18n-rosetta plugin install ./french-formal-v1/    # install from directory
i18n-rosetta plugin list                           # see installed plugins
i18n-rosetta plugin remove french-formal-v1        # uninstall
i18n-rosetta status                                # shows quality tiers + benchmarks
```

Tingnan ang [docs/METHOD_PLUGIN_SPEC.md](https://github.com/gamedaysuits/i18n-rosetta/blob/main/docs/METHOD_PLUGIN_SPEC.md) para sa manifest format.

## Commands

| Command | Purpose |
|---------|---------|
| `init` | Interactive setup wizard (o `--yes` para sa mabilis na defaults) |
| `sync` | I-translate at i-sync ang lahat ng locale files |
| `watch` | Auto-sync sa mga pagbabago ng file |
| `audit` | I-flag ang incomplete locales (CI gate) |
| `lint` | Hanapin ang hardcoded strings sa source code |
| `wrap` | Auto-wrap ang hardcoded strings sa `t()` calls (na may undo) |
| `seo` | Gumawa ng hreflang, sitemap.xml, o JSON-LD schema |
| `integrity` | Tingnan ang placeholder corruption at encoding issues |
| `status` | Ipakita ang pair configuration, methods, registers, at quality tiers |
| `provenance` | I-audit ang translation resource licensing |
| `plugin` | I-install, i-remove, o i-list ang method plugins |

I-run ang `i18n-rosetta <command> --help` para sa detalyadong tulong sa anumang command.

Buong reference: [docs/CLI_REFERENCE.md](https://github.com/gamedaysuits/i18n-rosetta/blob/main/docs/CLI_REFERENCE.md)

## Configuration

Gumawa ng `i18n-rosetta.config.json` o i-run ang `i18n-rosetta init`:

```json
{
  "version": 3,
  "inputLocale": "en",
  "localesDir": "./locales",
  "model": "google/gemini-3.5-flash",
  "pairs": {
    "en:fr": { "qualityTier": "high" },
    "en:ja": { "method": "google-translate" }
  }
}
```

| Option | Default | Description |
|--------|---------|-------------|
| `inputLocale` | `"en"` | Source language code |
| `localesDir` | `"./locales"` | Path sa locale files |
| `contentDir` | `null` | Hugo content directory (nag-e-enable ng Markdown translation) |
| `format` | `"auto"` | File format: `json`, `toml`, `yaml`, o `auto` |
| `model` | `"google/gemini-3.5-flash"` | Default OpenRouter model |
| `defaultMethod` | `"llm"` | Default translation method (na-o-override ng `--method` flag) |
| `batchSize` | `30` | Keys per translation batch |
| `pairs` | `{}` | Per-pair method, model, at quality overrides |

**Per-language overrides**: Ang bawat language ay may [Language Card](docs/planning/LANGUAGE_CARD_SPEC.md) na may preset registers na naka-tune sa formality system nito. Gamitin ang preset keys bilang shorthand, o magsulat ng custom register text:

```json
{
  "languages": {
    "fr": "casual-tu",
    "ko": "formal-hapsyo",
    "crk": {
      "name": "Plains Cree",
      "register": "SRO syllabics with grammatical precision.",
      "model": "google/gemini-2.5-pro",
      "batchSize": 5,
      "maxRetries": 5,
      "script": "cans"
    }
  }
}
```

**Zero-config mode**: Walang config file? Auto-detect ng Rosetta ang locale files, format, at target languages mula sa iyong project.

Ang mga language values ay maaaring isang preset key (hal., `"casual-tu"`), custom register text, o isang object (full control). Ang pair-level overrides sa `pairs` ay may priority sa language-level settings. I-run ang `npx i18n-rosetta init` para mag-browse ng available presets para sa bawat language.

Framework setup guides: [docs/INTEGRATION_GUIDES.md](https://github.com/gamedaysuits/i18n-rosetta/blob/main/docs/INTEGRATION_GUIDES.md)

## Hardening

- **Exponential backoff** — 3 retries na may jitter sa 429/5xx errors
- **30s request timeout** — Pinipigilan ng AbortController ang pag-hang
- **Response validation** — tinatanggap lang ang mga keys na ipinadala para sa translation
- **Quality gate** — nahuhuli ang hallucination loops, wrong-script output, length inflation, at source echoes
- **Retry cascade** — sa JSON parse failure, nire-retry ang batch → half-batch → individual keys (budget-capped via `maxRetries`)
- **Prompt caching** — system/user message split ay nagbibigay-daan sa provider-level caching, binabawasan ang token cost sa mga batches
- **Prototype pollution guard** — hinaharangan ang `__proto__`, `constructor`, `prototype`
- **Path containment** — ang file writes ay bine-validate upang manatili sa loob ng configured directories
- **Block protection** — ang code blocks, shortcodes, HTML ay pinoprotektahan habang nagta-translate ng content
- **Explicit fallback** — `--fallback` ay nagsusulat ng `[EN]`-prefixed placeholders kapag hindi available ang API (re-sync na may key para sa totoong translations)
- **Partial success** — ang isang failed batch ay hindi humaharang sa iba

## Testing

```bash
npm test                         # all tests
npm run test:unit                # core sync pipeline
npm run test:redteam             # adversarial edge cases
npm run test:format              # TOML/YAML adapters
npm run test:content             # Markdown content parser
npm run test:hugo                # full Hugo E2E
npm run test:lint                # hardcoded string detection
npm run test:pairs               # pair graph resolution
npm run test:methods             # translation method suite
```

**Zero dependencies.**

## License

MIT