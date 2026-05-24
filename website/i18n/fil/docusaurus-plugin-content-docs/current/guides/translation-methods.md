---
sidebar_position: 1
title: "Mga Paraan ng Translation"
---
# Mga Translation Method

Sumusuporta po ang Rosetta ng sampung translation methods. Pwedeng gumamit ng magkaibang method ang bawat language pair — hindi po kayo naka-lock sa iisang approach para sa buong project ninyo.

## Pagkukumpara ng mga Method

### Mga LLM Provider

Quality-focused, Markdown-aware, at coaching-compatible. Pinakamaganda para sa mga content-heavy na projects.

| Method | Key | Ano ang Ginagawa Nito |
|--------|-----|-------------|
| `llm` (default) | `OPENROUTER_API_KEY` | LLM via OpenRouter — 200+ models, auto-routing |
| `llm-coached` | `OPENROUTER_API_KEY` | LLM + grammar rules, dictionaries, style notes |
| `openai` | `OPENAI_API_KEY` | Direct OpenAI API (gpt-4o, gpt-4o-mini) |
| `anthropic` | `ANTHROPIC_API_KEY` | Direct Anthropic API (Claude Sonnet, Haiku, Opus) |
| `gemini` | `GEMINI_API_KEY` | Direct Google Gemini API (Flash, Pro) — free tier |

### Traditional MT

Speed at cost-focused. Pinakamaganda para sa mga high-volume na key-value pairs.

| Method | Key | Ano ang Ginagawa Nito |
|--------|-----|-------------|
| `google-translate` | `GOOGLE_TRANSLATE_API_KEY` | Google Cloud Translation API v2 (130+ languages) |
| `deepl` | `DEEPL_API_KEY` | DeepL API na may glossary support (30+ languages) |
| `microsoft-translator` | `MICROSOFT_TRANSLATOR_API_KEY` | Azure Cognitive Services Translator (100+ languages) |
| `libretranslate` | *(self-hosted)* | Self-hosted na LibreTranslate (AGPL, libre) |

### Infrastructure

| Method | Key | Ano ang Ginagawa Nito |
|--------|-----|-------------|
| `api` | *(per provider)* | Thin HTTP client para sa anumang REST translation endpoint |

## Decision Tree

```mermaid
flowchart TD
    A["What are you translating?"] --> B{"Markdown content?"}
    B -->|Yes| C["Use llm, openai, anthropic, or gemini"]
    B -->|No| D{"Need cost control?"}
    D -->|Budget matters| E{"Self-hosted option?"}
    D -->|Quality matters| F{"Need coaching data?"}
    E -->|Yes| G["Use libretranslate"]
    E -->|No| H["Use deepl or google-translate"]
    F -->|Yes| I["Use llm-coached"]
    F -->|No| C
```

---

## `llm` — LLM Translation (Default)

Nagta-translate via anumang LLM sa [OpenRouter](https://openrouter.ai). Ito po ang default method at ang pinaka-versatile.

**Paano ito gumagana:**
1. Nagba-batch ng mga keys (default 30/batch) kasama ang register at context instructions
2. Ipinapadala sa OpenRouter bilang isang structured prompt
3. Pina-parse ang JSON response
4. Bini-validate ang bawat translation gamit ang [quality gate](/docs/concepts/quality-gate)
5. Isinusulat ang mga pumasa na translations, nagre-retry o nire-reject ang mga nag-fail

**Kailan ito gagamitin:** Sa karamihan ng mga projects. Lalo na sa mga content-heavy sites na may Markdown, kung saan kailangang i-shield ang mga code blocks at shortcodes.

**Configuration:**

```json
{
  "defaultMethod": "llm",
  "model": "google/gemini-3.5-flash"
}
```

## `llm-coached` — Coached LLM Translation

Kapareho ng `llm`, pero may grammar rules, term dictionaries, at style notes na naka-inject sa bawat prompt.

**Paano ito gumagana:**
1. Nilo-load ang coaching data mula sa `.rosetta/coaching/<locale>.json` o sa `coaching/` directory ng isang plugin
2. Ini-inject ang grammar rules, dictionary terms, at style notes sa system prompt
3. Ang mga dictionary terms na nagma-match sa source keys ay isinasama bilang required terminology
4. Magpapatuloy ang translation tulad ng sa `llm`, kung saan nagdadagdag ng precision ang coaching data

**Kailan ito gagamitin:** Para sa mga low-resource languages, domain-specific terminology (legal, medical), formal registers, o anumang kaso kung saan hindi sapat ang precision ng generic LLM output.

**Coaching data format:**

```json title=".rosetta/coaching/fr.json"
{
  "grammar_rules": [
    "French adjectives agree in gender and number with the noun they modify",
    "Use 'vous' for formal contexts, 'tu' for informal"
  ],
  "dictionary": {
    "dashboard": "tableau de bord",
    "deployment": "déploiement",
    "settings": "paramètres"
  },
  "style_notes": "Prefer active voice. Avoid anglicisms where a native French term exists."
}
```

Tingnan din: [Low-Resource Languages Guide](/docs/guides/low-resource-languages)

---

## `openai` — Direct OpenAI API

Direktang nagta-translate via OpenAI Chat Completions API. Walang OpenRouter middleman — inyong key, inyong account, inyong usage dashboard.

**Models:** `gpt-4o` (default), `gpt-4o-mini`

**Features:**
- ✅ Markdown-aware (content translation)
- ✅ Coaching support (grammar rules, dictionary overrides, style notes)
- ✅ JSON mode para sa structured key-value output
- ✅ Exponential backoff na may retry

**Configuration:**

```json
{
  "pairs": {
    "en:fr": { "method": "openai", "model": "gpt-4o-mini" }
  }
}
```

```bash
export OPENAI_API_KEY=sk-proj-...
```

Kunin ang inyong key sa [platform.openai.com/api-keys](https://platform.openai.com/api-keys).

## `anthropic` — Direct Anthropic API

Direktang nagta-translate via Anthropic Messages API. Ginagamit ang `system` parameter para sa coaching data, na nag-e-enable ng prompt caching ng Anthropic.

**Models:** `claude-sonnet-4-6` (default), `claude-haiku-4-5`, `claude-opus-4-7`

**Features:**
- ✅ Markdown-aware (content translation)
- ✅ Coaching support (grammar rules, dictionary overrides, style notes)
- ✅ System prompt caching (ina-amortize ang coaching cost across batches)
- ✅ Exponential backoff na may retry

**Configuration:**

```json
{
  "pairs": {
    "en:ja": { "method": "anthropic", "model": "claude-haiku-4-5" }
  }
}
```

```bash
export ANTHROPIC_API_KEY=sk-ant-...
```

Kunin ang inyong key sa [console.anthropic.com](https://console.anthropic.com/settings/keys).

## `gemini` — Direct Google Gemini API

Direktang nagta-translate via Google Gemini `generateContent` API. **May available na free tier** — pinakamagandang zero-cost na starting point.

**Models:** `gemini-2.5-flash` (default), `gemini-2.5-pro`

**Features:**
- ✅ Markdown-aware (content translation)
- ✅ Coaching support (grammar rules, dictionary overrides, style notes)
- ✅ JSON response mode via `responseMimeType`
- ✅ Free tier (malaking daily quota)
- ✅ Exponential backoff na may retry

**Configuration:**

```json
{
  "pairs": {
    "en:ko": { "method": "gemini", "model": "gemini-2.5-pro" }
  }
}
```

```bash
export GEMINI_API_KEY=AI...
```

Kunin ang inyong key sa [aistudio.google.com/apikey](https://aistudio.google.com/apikey).

### Model Validation

Bini-validate ng mga direct LLM providers (`openai`, `anthropic`, `gemini`) ang inyong model string sa unang paggamit. Sinasalo nito ang tatlong kategorya ng mga pagkakamali:

**Maling method format** — Paggamit ng OpenRouter-style na model path sa isang direct provider:

```
[WARN] OpenAI: model "google/gemini-3.5-flash" looks like an OpenRouter path.
       Direct providers use bare model names (e.g., "gpt-4o").
       To use OpenRouter models, set method to 'llm' instead.
```

**Maling provider** — Paggamit ng model mula sa ibang provider:

```
[WARN] Gemini: model "claude-sonnet-4-6" is an Anthropic model.
       This provider (gemini) cannot serve Anthropic models.
       Use --method anthropic or set "method": "anthropic" in config.
```

**Deprecated o misspelled na model** — Sa unang API call, kukunin ng rosetta ang live model list ng provider at iche-check ang inyong model laban dito:

```
[WARN] Gemini: model "gemini-1.5-flash" not found in available models.
       Similar models: gemini-2.0-flash, gemini-2.5-flash, gemini-2.5-pro
       The API call will proceed — the provider will give the final verdict.
```

:::note Mga warnings po ito, hindi errors
Ang model validation ay naglo-log ng mga warnings pero hindi nito bina-block ang API call. Ang provider API pa rin ang magbibigay ng final verdict — maaaring mag-match ang isang future model name sa ibang pattern, at ayaw po nating mag-gate base sa heuristics.
:::

---

## `google-translate` — Google Cloud Translation API

Direct integration sa Google Cloud Translation API v2. Gumagamit ito ng REST API — walang SDK, walang service account. API key lang po.

**Kailan ito gagamitin:** Para sa mga high-volume na key-value string pairs kung saan mas mahalaga ang speed at cost kaysa sa nuance. Sumusuporta sa 130+ languages out of the box.

**Mga Limitasyon:**
- ⚠️ **Walang Markdown awareness.** Masisira nito ang mga code blocks, shortcodes, at interpolation variables.
- Walang register/tone control
- Walang coaching o terminology enforcement

```bash
npx i18n-rosetta sync --method google-translate
```

:::tip Auto-detection
Kung `GOOGLE_TRANSLATE_API_KEY` lang ang naka-set (walang OpenRouter key), mag-o-auto-switch ang rosetta sa Google Translate. Hindi na kailangan ng config change.
:::

## `deepl` — DeepL API

Direct integration sa DeepL translation API. Sumusuporta sa mga glossaries para sa consistent na terminology.

**Kailan ito gagamitin:** Sa mga European languages kung saan magaling ang DeepL (German, French, Spanish, Dutch, Polish, atbp.). Ang glossary support ay nag-e-enforce ng consistent na terminology nang walang coaching data.

**Features:**
- ✅ Automatic na free/pro endpoint detection (`:fx` suffix sa mga free keys)
- ✅ Glossary creation at management
- ✅ Formality level control
- ⚠️ **Walang Markdown awareness** — key-value pairs lang

**Configuration:**

```json
{
  "pairs": {
    "en:de": { "method": "deepl" }
  }
}
```

```bash
export DEEPL_API_KEY=your-key-here
```

Kunin ang inyong key sa [deepl.com/pro-api](https://www.deepl.com/pro-api).

## `microsoft-translator` — Azure Cognitive Services

Direct integration sa Microsoft Translator Text API v3.

**Kailan ito gagamitin:** Sa mga enterprise environments na may existing na Azure infrastructure. Sumusuporta sa 100+ languages kasama ang marami na hindi sakop ng Google Translate.

**Features:**
- ✅ Hanggang 100 segments per request (high throughput)
- ✅ Optional na region parameter para sa latency optimization
- ⚠️ **Walang Markdown awareness** — key-value pairs lang
- ⚠️ **Walang content translation** — key-value pairs lang

**Configuration:**

```json
{
  "pairs": {
    "en:ar": { "method": "microsoft-translator" }
  }
}
```

```bash
export MICROSOFT_TRANSLATOR_API_KEY=your-key
export MICROSOFT_TRANSLATOR_REGION=global  # optional
```

Kunin ang inyong key mula sa [Azure Portal](https://portal.azure.com) → Cognitive Services → Translator.

## `libretranslate` — Self-Hosted Translation

Self-hosted open-source translation gamit ang LibreTranslate. Tumatakbo locally o sa sarili ninyong infrastructure — zero API costs, full data sovereignty.

**Kailan ito gagamitin:** Sa mga projects na nangangailangan ng offline translation, data privacy compliance (GDPR), o zero-cost operation. Lalo na itong kapaki-pakinabang para sa mga CI pipelines na hindi dapat dumedepende sa mga external APIs.

**Features:**
- ✅ Self-hosted — walang external API calls
- ✅ Libre at open source (AGPL-3.0)
- ✅ May available na Docker deployment
- ⚠️ **Walang Markdown awareness** — key-value pairs lang
- ⚠️ **Walang content translation** — key-value pairs lang
- ⚠️ Nag-iiba ang quality depende sa language pair

**Setup:**

```bash
# Run LibreTranslate locally with Docker
docker run -d -p 5000:5000 libretranslate/libretranslate

# Configure (optional — defaults to localhost:5000)
export LIBRETRANSLATE_API_URL=http://localhost:5000/translate
```

```json
{
  "pairs": {
    "en:es": { "method": "libretranslate" }
  }
}
```

---

## `api` — Remote Translation API

Isang thin HTTP client para sa mga community-hosted o IP-protected na translation endpoints. Nagpapadala ang Rosetta ng mga keys at tumatanggap ng mga translations pabalik — wala po itong kahit anong translation logic.

**Kailan ito gagamitin:** Kapag ang mga translation methods ay naka-host server-side (hal., proprietary coaching data, fine-tuned models, FST pipelines na hindi pwedeng i-distribute).

```json
{
  "pairs": {
    "en:crk": {
      "method": "api",
      "endpoint": "https://api.example.com/v1/translate",
      "apiKey": "your-key"
    }
  }
}
```

:::note OCAP-Compatible Community Translation
Ang `api` method ay ang tulay patungo sa **OCAP-compatible community-hosted translation**. Ang mga indigenous at minority-language communities ay pwedeng mag-host ng kanilang sariling translation endpoints — pinapanatili ang coaching data, fine-tuned models, at linguistic IP sa ilalim ng community control — habang kumokonekta ang Rosetta sa kanila bilang isang thin client.

Tingnan ang [Support a Low-Resource Language](/docs/guides/low-resource-languages) para sa buong community-hosting walkthrough, at ang [Serving a Method via API](/docs/guides/serving-a-method) para sa mga endpoint requirements.
:::

---

## Per-Pair Configuration

Ang tunay na power nito ay ang pag-mix ng mga methods per language pair:

```json title="i18n-rosetta.config.json"
{
  "version": 3,
  "pairs": {
    "en:fr": { "method": "deepl" },
    "en:ja": { "method": "openai", "model": "gpt-4o" },
    "en:ko": { "method": "gemini" },
    "en:ar": { "method": "microsoft-translator" },
    "en:crk": { "methodPlugin": "crk-coached-v1" }
  }
}
```

Nagta-translate ito ng French via DeepL (glossary support), Japanese via OpenAI (quality), Korean via Gemini (free tier), Arabic via Microsoft Translator (coverage), at Plains Cree via isang coached plugin (specialized).

## Mga Plugin

Ang mga plugins ay mga pre-packaged na translation recipes para sa mga specific na language pairs. Mga JSON manifests po ito — hindi code — na nagsasabi sa rosetta kung anong method ang gagamitin, anong settings, at anong quality ang na-benchmark.

:::tip Mula eval harness hanggang production sa isang command
Ang mga plugins na na-develop at napatunayan sa [eval harness](/docs/eval/harness) ay pwedeng i-install nang direkta — ang method na bini-validate ninyo doon ay nade-deploy dito gamit ang isang `plugin install` command. Tingnan ang [MT Evaluation](/docs/eval/) para sa buong evaluation workflow.
:::

```bash
i18n-rosetta plugin install ./french-formal-v1/
i18n-rosetta plugin list
i18n-rosetta plugin remove french-formal-v1
```

Tingnan ang [Plugin Specification](/docs/reference/plugin-spec) para sa buong manifest format.

---

## Pag-switch ng mga Provider

Lilipat ba ng methods? Magbabago ang model format at env var — heto po ang map:

### OpenRouter → Direct Provider

```diff title="i18n-rosetta.config.json"
 {
   "pairs": {
     "en:fr": {
-      "method": "llm",
-      "model": "openai/gpt-4o"
+      "method": "openai",
+      "model": "gpt-4o"
     }
   }
 }
```

```diff title="Environment variables"
- export OPENROUTER_API_KEY=sk-or-v1-...
+ export OPENAI_API_KEY=sk-proj-...
```

**Mga pangunahing pagkakaiba:**
- Gumagamit ang OpenRouter ng `provider/model` format (hal., `openai/gpt-4o`). Gumagamit ang mga direct providers ng bare model names (hal., `gpt-4o`).
- Bawat direct provider ay may sariling env var (`OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `GEMINI_API_KEY`).
- Kung gagamit kayo ng maling model format, magwa-warn sa inyo ang rosetta — tingnan ang [Model Validation](#model-validation).

### Direct Provider → OpenRouter

```diff title="i18n-rosetta.config.json"
 {
   "pairs": {
     "en:ja": {
-      "method": "anthropic",
-      "model": "claude-sonnet-4-6"
+      "method": "llm",
+      "model": "anthropic/claude-sonnet-4-6"
     }
   }
 }
```

:::tip Kailan gagamitin ang OpenRouter vs Direct
**Gamitin ang OpenRouter** kapag gusto ninyong mag-switch sa pagitan ng mga models nang hindi nagpapalit ng env vars, o kapag gusto ninyo ng access sa 200+ models mula sa iisang key. **Gamitin ang mga direct providers** kapag gusto ninyo ng mas simpleng billing, lower latency (walang middleman), o access sa mga provider-specific features tulad ng prompt caching ng Anthropic.
:::

---

## Pagkukumpara ng Cost

Approximate cost per 1,000 translated keys (assuming ~10 tokens per key, 30 keys per batch):

| Method | Cost / 1K Keys | Speed | Quality | Pinakamaganda Para Sa |
|--------|----------------|-------|---------|----------|
| `gemini` (Flash) | **Libre** (within tier) | Fast | Good | Getting started, personal projects |
| `google-translate` | ~$0.02 | Fastest | Adequate | High-volume, European languages |
| `deepl` | ~$0.02 | Fast | Good | European languages, terminology |
| `microsoft-translator` | ~$0.01 | Fast | Adequate | Azure shops, broad language coverage |
| `libretranslate` | **Libre** (self-hosted) | Varies | Fair | Air-gapped, GDPR, CI pipelines |
| `gemini` (Pro) | ~$0.07 | Medium | Very good | Quality-sensitive, free quota |
| `openai` (GPT-4o-mini) | ~$0.01 | Fast | Good | Budget LLM |
| `openai` (GPT-4o) | ~$0.10 | Medium | Very good | Quality-sensitive |
| `anthropic` (Haiku) | ~$0.01 | Fast | Good | Budget LLM |
| `anthropic` (Sonnet) | ~$0.10 | Medium | Very good | Quality-sensitive |
| `anthropic` (Opus) | ~$0.50 | Slow | Excellent | Maximum quality |
| `llm` (OpenRouter) | Varies by model | Varies | Varies | Model comparison, experimentation |

:::note Mga estimates po ito
Ang aktwal na costs ay nakadepende sa haba ng inyong source text, batch size, at mga pagbabago sa pricing ng provider. I-check ang current pricing page ng bawat provider para sa eksaktong rates.
:::

---

## Tingnan Din

- [Supported Languages](/docs/reference/supported-languages)
- [Coaching Data](/docs/concepts/coaching-data)
- [Support a Low-Resource Language](/docs/guides/low-resource-languages)
- [Plugin Specification](/docs/reference/plugin-spec)
- [Serving a Method via API](/docs/guides/serving-a-method)
- [Quality Gate](/docs/concepts/quality-gate)
- [Architecture](/docs/concepts/architecture)
- [Troubleshooting](/docs/guides/troubleshooting) — model errors, API issues