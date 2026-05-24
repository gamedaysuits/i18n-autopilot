# i18n-rosetta

[![npm version](https://img.shields.io/npm/v/i18n-rosetta.svg)](https://www.npmjs.com/package/i18n-rosetta)
[![CI](https://github.com/gamedaysuits/i18n-rosetta/actions/workflows/ci.yml/badge.svg)](https://github.com/gamedaysuits/i18n-rosetta/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

🌐 **Mga pagsasalin ng README** — *sinalin ng rosetta, siyempre:*
[Français](docs/README.fr.md) · [Deutsch](docs/README.de.md) · [Español](docs/README.es.md) · [Português](docs/README.pt.md) · [Nederlands](docs/README.nl.md) · [日本語](docs/README.ja.md) · [한국어](docs/README.ko.md) · [简体中文](docs/README.zh.md) · [ไทย](docs/README.th.md) · [Tiếng Việt](docs/README.vi.md) · [Filipino](docs/README.fil.md) · [العربية](docs/README.ar.md)

Isalin ang iyong locale files gamit ang isang command:

```bash
npx i18n-rosetta sync
```

Awtomatikong nade-detect ng Rosetta ang iyong locale files, ang kanilang format, at ang target na mga wika. Isinasalin nito ang mga nawawalang keys, nilalaktawan ang mga tapos na, at isinusulat ang mga resulta. Iyon lang.

## Bakit Hindi Na Lang Ikaw Mismo ang Gumawa ng Script?

Puwede kang magsulat ng mabilis na script na nag-i-loop sa iyong English keys at tumatawag sa Google Translate. Karamihan sa mga developer ay ginagawa ito — umaabot lang ito ng mga 30 linya. Narito kung bakit ito nagkakaroon ng problema:

- **Walang change detection.** Kapag in-update mo ang isang English string, mananatiling luma ang translation magpakailanman. Sinusubaybayan ng Rosetta ang bawat source value gamit ang SHA-256 hashes at isinasalin lang muli ang mga nagbago.
- **Walang batching.** Isang API call per key ay nangangahulugang 200 keys = 200 round trips. Nagba-batch ang Rosetta nang matalino (configurable, default 30 keys/batch para sa LLM, 128 para sa Google).
- **Walang quality gate.** Ang machine translation ay nagha-hallucinate, inuulit ang source, o naglalabas sa maling script. Bine-validate ng Rosetta ang bawat translation bago isulat ito — ang maling script, length inflation, at source echoes ay nahuhuli at nire-reject.
- **Walang format awareness.** Hardcoded sa JSON? Hinahawakan ng Rosetta ang JSON, TOML, YAML, at Hugo Markdown (frontmatter + body) na may auto-detection.
- **Walang safety.** Pinoprotektahan ng Rosetta laban sa prototype pollution, path traversal sa pamamagitan ng crafted locale codes, at code block corruption habang nagsasalin ng Markdown.

Ang Rosetta ay ang production version ng script na iyon.

## Mabilisang Pagsisimula

```bash
npm install --save-dev i18n-rosetta
```

### Kumuha ng API Key

Kailangan ng Rosetta ng translation backend. Pumili ng isa:

| Provider | Key | Pinakamahusay para sa |
|----------|-----|----------|
| **OpenRouter** (recommended) | `OPENROUTER_API_KEY` | Mga proyektong maraming content, Markdown, 200+ models |
| **OpenAI** | `OPENAI_API_KEY` | Direktang GPT-4o access |
| **Anthropic** | `ANTHROPIC_API_KEY` | Direktang Claude access |
| **Gemini** | `GEMINI_API_KEY` | May available na free tier |
| **DeepL** | `DEEPL_API_KEY` | Mga wikang European, suporta sa glossary |
| **Google Translate** | `GOOGLE_TRANSLATE_API_KEY` | 130+ na wika, mataas na volume |

**Pinakamabilis na pagsisimula** (libre): Mag-sign up sa [aistudio.google.com](https://aistudio.google.com/apikey) para sa isang libreng Gemini key:

```bash
export GEMINI_API_KEY=AI...
npx i18n-rosetta sync --method gemini
```

**OpenRouter** (200+ models): Mag-sign up sa [openrouter.ai](https://openrouter.ai), pagkatapos:

```bash
export OPENROUTER_API_KEY=sk-or-v1-...
npx i18n-rosetta sync
```

**Google Translate** alternatibo (key-value pairs lang — walang Markdown awareness):

```bash
export GOOGLE_TRANSLATE_API_KEY=...
npx i18n-rosetta sync --method google-translate
```

> **Tandaan**: Kung `GOOGLE_TRANSLATE_API_KEY` lang ang nakatakda, awtomatikong lumilipat ang rosetta sa Google Translate. Walang kinakailangang pagbabago sa config. Direktang ginagamit ang REST API — walang SDK, walang service account, walang `pip install`. Ang key lang.

Iyon lang. Para sa mas maraming kontrol, gumawa ng config file:

```bash
npx i18n-rosetta init                        # guided wizard — walks you through registers, methods, and content
npx i18n-rosetta init --yes --langs fr,de,ja  # quick setup with specific languages and default registers
```

Ang bawat wika ay may kasamang **register presets** — pre-built tone/formality instructions na naka-tune sa linguistic system nito (vouvoiement para sa French, Siezen para sa German, です/ます para sa Japanese, 해요체 para sa Korean). Hinahayaan ka ng init wizard na mag-browse at pumili ng presets, o ipasa ang `--yes` para tanggapin ang mga default.

### Non-English Source

Kung hindi English ang iyong source language:

```bash
i18n-rosetta sync --source fr                      # CLI flag
```

O itakda ito nang permanente sa iyong config:

```json
{ "inputLocale": "fr" }
```

## Ano ang Ginagawa Nito

Ikaw ang humahawak sa i18n framework (next-intl, i18next, Hugo). Hinahawakan ng Rosetta ang translation files.

- **Multi-format** — JSON, TOML, YAML, Hugo Markdown (front matter + body), at XLIFF 1.2
- **Incremental** — Isinasalin lang ang nagbago (SHA-256 hash tracking)
- **Cached** — Iniimbak ng Translation Memory ang mga nakaraang resulta; ang muling pagpapatakbo ng sync ay walang gastos para sa mga hindi nagbabagong keys
- **Quality-gated** — Bine-validate ang bawat translation: nahuhuli ang hallucinations, wrong-script output, source echoes, at length inflation
- **Content-aware** — Pinoprotektahan ng LLM methods ang code blocks, shortcodes, links, at interpolation variables habang nagsasalin ng Markdown
- **Pipeline tools** — `lint`, `audit`, `integrity`, `seo` para sa CI gates
- **XLIFF interop** — I-export ang mga translation para sa propesyonal na review sa CAT tools (memoQ, SDL Trados, Phrase), i-import ang mga ito pabalik
- **Zero dependencies** — Node.js built-ins lang. Walang SDKs, walang native modules. Nangangailangan ng Node 20+

## Higit pa sa Google Translate

Ang quick start ay nagpapatakbo sa iyo gamit ang isang LLM o Google Translate. Ngunit sinusuportahan ng Google Translate ang ~130 wika. Mayroong mahigit 7,000.

**Ang pangunahing ideya ng Rosetta: ang translation method ay configurable per language pair.** Gamitin ang Google Translate para sa French, isang LLM na may morphological coaching para sa Plains Cree, at isang community-hosted API para sa Quechua — lahat sa parehong proyekto, lahat gamit ang parehong CLI.

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

Kung malalaman mo kung paano isalin ang isang language pair — sa pamamagitan ng prompt engineering, community dictionaries, FST pipelines, o fine-tuned models — hinahayaan ka ng rosetta na i-package ang method na iyon bilang isang plugin at i-deploy ito kasama ng lahat ng iba pa.

> Ipinanganak mula sa pagsasalin ng isang production website sa Plains Cree, kung saan walang off-the-shelf API na umiiral. Ang per-pair architecture ay hindi theoretical — umiiral ito dahil kailangan ng isang proyekto ng Google Translate para sa French at isang coached FST pipeline para sa isang Indigenous language, na tumatakbo nang magkatabi sa parehong sync command.

Ang kasamang [MT Eval Harness](https://github.com/gamedaysuits/gds-mt-eval-harness) ay nagbibigay-daan sa iyo na i-benchmark at ikumpara ang mga translation approach, pagkatapos ay i-export ang mga gumaganang method bilang rosetta plugins. Sinuman na nagsasalita ng parehong wika ay maaaring mag-develop, mag-test, at magbahagi ng isang translation method — walang kinakailangang proprietary platform.

### Piliin ang Iyong Paraan

Sinusuportahan ng Rosetta ang 10 translation methods. Ang bawat language pair ay maaaring gumamit ng ibang method.

**LLM providers** — pinakamahusay para sa kalidad, Markdown-aware, coaching-compatible:

| Method | Key | Ano ang Ginagawa Nito |
|--------|-----|-------------|
| `llm` (default) | `OPENROUTER_API_KEY` | LLM sa pamamagitan ng OpenRouter — 200+ models, auto-routing |
| `llm-coached` | `OPENROUTER_API_KEY` | LLM + grammar rules, dictionaries, style notes |
| `openai` | `OPENAI_API_KEY` | Direktang OpenAI API (gpt-4o, gpt-4o-mini) |
| `anthropic` | `ANTHROPIC_API_KEY` | Direktang Anthropic API (Claude Sonnet, Haiku, Opus) |
| `gemini` | `GEMINI_API_KEY` | Direktang Google Gemini API (Flash, Pro) — may available na free tier |

**Traditional MT** — pinakamahusay para sa bilis, gastos, at high-volume key-value pairs:

| Method | Key | Ano ang Ginagawa Nito |
|--------|-----|-------------|
| `google-translate` | `GOOGLE_TRANSLATE_API_KEY` | Google Cloud Translation API v2 (130+ wika) |
| `deepl` | `DEEPL_API_KEY` | DeepL API na may suporta sa glossary (30+ wika) |
| `microsoft-translator` | `MICROSOFT_TRANSLATOR_API_KEY` | Azure Cognitive Services Translator (100+ wika) |
| `libretranslate` | *(self-hosted)* | Self-hosted LibreTranslate (AGPL, libre) |

**Infrastructure** — para sa custom o community-hosted endpoints:

| Method | Key | Ano ang Ginagawa Nito |
|--------|-----|-------------|
| `api` | *(per provider)* | Manipis na HTTP client para sa anumang REST endpoint |

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

> **Tandaan**: Ang traditional MT methods (Google Translate, DeepL, Microsoft Translator, LibreTranslate) ay mahusay na humahawak ng key-value pairs ngunit hindi ligtas na makakapagsalin ng Markdown content. Para sa mga proyektong maraming content, inirerekomenda ang LLM methods — tahasan nilang pinoprotektahan ang code blocks, shortcodes, at interpolation variables.

## Mga Plugin

Ang mga plugin ay pre-packaged translation recipes para sa partikular na language pairs. Ang mga ito ay JSON manifests — hindi code — na nagsasabi sa rosetta kung aling method ang gagamitin, anong settings, at anong kalidad ang na-benchmark.

```bash
i18n-rosetta plugin install ./french-formal-v1/    # install from directory
i18n-rosetta plugin list                           # see installed plugins
i18n-rosetta plugin remove french-formal-v1        # uninstall
i18n-rosetta status                                # shows quality tiers + benchmarks
```

Tingnan ang [docs/METHOD_PLUGIN_SPEC.md](https://github.com/gamedaysuits/i18n-rosetta/blob/main/docs/METHOD_PLUGIN_SPEC.md) para sa format ng manifest.

## Mga Command

| Command | Layunin |
|---------|---------|
| `init` | Interactive setup wizard (o `--yes` para sa mabilis na defaults) |
| `sync` | Isalin at i-sync ang lahat ng locale files |
| `watch` | Auto-sync sa mga pagbabago sa file |
| `audit` | I-flag ang mga hindi kumpletong locales (CI gate) |
| `lint` | Hanapin ang mga hardcoded strings sa source code |
| `wrap` | Auto-wrap ang mga hardcoded strings sa `t()` calls (na may undo) |
| `seo` | Bumuo ng hreflang, sitemap.xml, o JSON-LD schema |
| `integrity` | Suriin ang placeholder corruption, encoding, at ICU plural completeness |
| `status` | Ipakita ang pair configuration, methods, registers, at quality tiers |
| `provenance` | I-audit ang paglilisensya ng translation resource |
| `plugin` | I-install, alisin, o ilista ang method plugins |
| `fonts` | I-download ang mga web fonts para sa PUA script converters |
| `tm` | Pamahalaan ang Translation Memory cache (stats, clear, per-locale) |
| `xliff` | I-export/i-import ang XLIFF 1.2 para sa propesyonal na pagsusuri ng tagasalin |

Patakbuhin ang `i18n-rosetta <command> --help` para sa detalyadong tulong sa anumang command.

Buong reference: [docs/CLI_REFERENCE.md](https://github.com/gamedaysuits/i18n-rosetta/blob/main/docs/CLI_REFERENCE.md)

## Konpigurasyon

Gumawa ng `i18n-rosetta.config.json` o patakbuhin ang `i18n-rosetta init`:

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

| Option | Default | Deskripsyon |
|--------|---------|-------------|
| `inputLocale` | `"en"` | Source language code |
| `localesDir` | `"./locales"` | Path sa locale files |
| `contentDir` | `null` | Hugo content directory (nagbibigay-daan sa Markdown translation) |
| `format` | `"auto"` | File format: `json`, `toml`, `yaml`, o `auto` |
| `model` | `"google/gemini-3.5-flash"` | Default OpenRouter model |
| `defaultMethod` | `"llm"` | Default translation method (na-o-override ng `--method` flag) |
| `batchSize` | `30` | Keys per translation batch |
| `pairs` | `{}` | Per-pair method, model, at quality overrides |

**Per-language overrides**: Ang bawat wika ay may [Language Card](docs/planning/LANGUAGE_CARD_SPEC.md) — isa sa 50 curated cards na naglalaman ng register presets, formality systems, typography rules, at method support flags. Gumagamit ang mga card ng [two-tier architecture](website/docs/concepts/architecture.md) (runtime + reference) para sa performance sa scale. I-scaffold ang isang bagong card gamit ang `node scripts/generate-language-card.mjs <code>`. Gamitin ang preset keys bilang shorthand, o magsulat ng custom register text:

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

**Zero-config mode**: Walang config file? Awtomatikong nade-detect ng Rosetta ang locale files, format, at target na mga wika mula sa iyong proyekto.

Ang mga value ng wika ay maaaring isang preset key (hal., `"casual-tu"`), custom register text, o isang object (buong kontrol). Ang mga pair-level overrides sa `pairs` ay may priyoridad kaysa sa mga setting ng language-level. Patakbuhin ang `npx i18n-rosetta init` para mag-browse ng mga available na preset para sa bawat wika.

Mga gabay sa pag-setup ng framework: [docs/INTEGRATION_GUIDES.md](https://github.com/gamedaysuits/i18n-rosetta/blob/main/docs/INTEGRATION_GUIDES.md)

## Pagpapatibay

- **Exponential backoff** — 3 retries na may jitter sa 429/5xx errors
- **30s request timeout** — Pinipigilan ng AbortController ang pagka-hang
- **Response validation** — tumatanggap lang ng mga key na ipinadala para sa translation
- **Quality gate** — nahuhuli ang hallucination loops, wrong-script output, length inflation, at source echoes
- **Retry cascade** — sa JSON parse failure, nire-retry ang batch → half-batch → individual keys (budget-capped sa pamamagitan ng `maxRetries`)
- **Translation Memory** — `.rosetta/tm.json` nagke-cache ng mga translation na naka-key sa source text + locale + method; ang mga hindi nagbabagong key ay inihahatid mula sa cache sa mga susunod na sync, na inaalis ang mga redundant na API call
- **Prompt caching** — ang system/user message split ay nagbibigay-daan sa provider-level caching, na binabawasan ang token cost sa mga batch
- **Terminology enforcement** — ang mga coached translation ay bine-verify laban sa mga termino ng diksyunaryo pagkatapos sumagot ng LLM
- **Prototype pollution guard** — hinaharangan ang `__proto__`, `constructor`, `prototype`
- **Path containment** — ang mga file writes ay bine-validate upang manatili sa loob ng mga naka-configure na direktoryo
- **Block protection** — ang code blocks, shortcodes, HTML ay pinoprotektahan habang nagsasalin ng content
- **Explicit fallback** — `--fallback` nagsusulat ng `[EN]`-prefixed placeholders kapag hindi available ang API (muling i-sync gamit ang isang key para sa totoong mga translation)
- **Partial success** — ang isang nabigong batch ay hindi humaharang sa iba

## Pagsubok

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

## Lisensya

MIT