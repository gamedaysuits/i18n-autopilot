# Mga Integration Guide

Step-by-step setup para sa i18n-rosetta gamit ang mga popular na frameworks.

---

## API Key Setup

Bago mag-integrate sa anumang framework, kailangan mo po ng translation API key. Sinusuportahan ng Rosetta ang dalawang providers:

### Option A: OpenRouter (recommended)

Ang [OpenRouter](https://openrouter.ai) ay nagpo-provide ng unified API para sa 200+ na LLM models. May available po na free tier.

```bash
# Sign up at https://openrouter.ai, then:
export OPENROUTER_API_KEY=sk-or-v1-...

# Or add to .env.local:
OPENROUTER_API_KEY=sk-or-v1-your-key-here
```

Best for: mga content-heavy na projects, Markdown translation, at mga projects na nangangailangan ng content-aware shielding (code blocks, shortcodes, interpolation variables).

### Option B: Google Translate

```bash
export GOOGLE_TRANSLATE_API_KEY=...
```

Best for: high-volume key-value string pairs (130+ languages). **Not recommended** para sa Markdown content — walang awareness ang Google Translate sa mga code blocks, shortcodes, o interpolation variables.

Para explicit na gamitin ang Google Translate:

```bash
i18n-rosetta sync --method google-translate
```

> **Tip**: Kung `GOOGLE_TRANSLATE_API_KEY` lang ang naka-set (walang OpenRouter key), mag-o-auto-switch ang rosetta sa Google Translate automatically.

---

## Hugo (TOML / YAML / Markdown)

### Project structure

Gumagamit ang Hugo ng `i18n/` para sa mga string translation at `content/` para sa page content:

```
my-hugo-site/
├── i18n/
│   ├── en.toml             ← source of truth
│   ├── fr.toml
│   └── ja.toml
├── content/
│   ├── posts/
│   │   ├── hello.md        ← source (English)
│   │   ├── hello.fr.md
│   │   └── hello.ja.md
│   └── about.md
└── .env.local
```

### Setup

```bash
npm install --save-dev i18n-rosetta
```

```bash
# .env.local
OPENROUTER_API_KEY=sk-or-v1-your-key-here
```

Gumawa ng `i18n-rosetta.config.json`:

```json
{
  "version": 3,
  "inputLocale": "en",
  "localesDir": "./i18n",
  "contentDir": "./content",
  "format": "auto",
  "languages": ["fr", "de", "ja", "es", "ko", "zh"]
}
```

```bash
i18n-rosetta sync           # sync i18n string files + content files
i18n-rosetta sync --dry     # preview changes without writing
```

### Content translation details

**Front matter**: Sinusuportahan ang parehong YAML (`---`) at TOML (`+++`) delimiters. Tinu-translate ang `title`, `description`, `summary`, `subtitle`, `caption`, at `linkTitle` by default. Nape-preserve ang lahat ng iba pang fields (date, draft, tags, weight, slug, etc.). I-customize gamit ang `translatableFields` sa iyong config.

**Block protection**: Ang mga code blocks, Hugo shortcodes (`{{< >}}`, `{{% %}}`), inline code, at raw HTML ay automatically na naka-shield gamit ang mga Unicode sentinel placeholders. Nagpa-pass through ang mga ito nang hindi nagagalaw.

**Filename convention**: Sinusunod ang translation-by-filename pattern ng Hugo:
- `my-post.md` → `my-post.fr.md`
- `my-post.en.md` → `my-post.fr.md` (tinatanggal ang source suffix)

**Skip existing**: Hindi kailanman ino-overwrite ang mga existing na translated files. I-delete ang isang target file para i-force ang re-translation.

### Plural forms

Sinusuportahan ng mga TOML at YAML locales ang mga CLDR plural forms:

```toml
[items]
one = "{{ .Count }} item"
other = "{{ .Count }} items"
```

Internally represented bilang `items.one` at `items.other` para sa diffing, tapos nire-re-serialize sa tamang sectioned format kapag nag-write.

---

## next-intl (JSON)

### Project structure

```
my-app/
├── messages/
│   └── en.json        ← source of truth
├── src/
│   ├── i18n/
│   │   ├── routing.ts
│   │   └── request.ts
│   └── middleware.ts
└── .env.local
```

### Setup

```bash
npm install --save-dev i18n-rosetta
```

Gumawa ng `i18n-rosetta.config.json`:

```json
{
  "version": 3,
  "inputLocale": "en",
  "localesDir": "./messages",
  "languages": ["fr", "de", "ja", "es", "ko", "zh", "pt", "ar"]
}
```

```bash
npx i18n-rosetta sync
```

Gagawa ito ng `messages/fr.json`, `messages/ja.json`, etc. — fully translated, at nape-preserve ang iyong nested key structure. Automatically itong ipi-pick up ng next-intl.

### Development workflow

```json
{
  "scripts": {
    "dev": "i18n-rosetta watch & next dev",
    "i18n:sync": "i18n-rosetta sync",
    "i18n:audit": "i18n-rosetta audit"
  }
}
```

---

## react-i18next (JSON)

### Flat file structure (recommended)

```
locales/
├── en.json
├── fr.json
└── ja.json
```

```json
{
  "version": 3,
  "inputLocale": "en",
  "localesDir": "./locales",
  "languages": ["fr", "de", "ja"]
}
```

### Nested directory structure

Kung ginagamit mo po ang `{locale}/{namespace}.json` structure, gumawa ng sync script para mag-flatten → translate → unflatten. Tingnan ang [react-i18next docs](https://react.i18next.com/) para sa mga detalye.