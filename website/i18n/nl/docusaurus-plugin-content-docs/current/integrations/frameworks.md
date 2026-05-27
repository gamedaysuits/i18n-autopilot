# Integratiegidsen

Stapsgewijze configuratie voor i18n-rosetta met populaire frameworks.

---

## Configuratie van de API-sleutel

Voordat u integreert met een framework, heeft u een vertaal-API-sleutel nodig. Rosetta ondersteunt twee providers:

### Optie A: OpenRouter (aanbevolen)

[OpenRouter](https://openrouter.ai) biedt een geünificeerde API voor meer dan 200 LLM-modellen. Er is een gratis niveau beschikbaar.

```bash
# Sign up at https://openrouter.ai, then:
export OPENROUTER_API_KEY=sk-or-v1-...

# Or add to .env.local:
OPENROUTER_API_KEY=sk-or-v1-your-key-here
```

Ideaal voor: projecten met veel content, Markdown-vertalingen en projecten die contentbewuste afscherming nodig hebben (codeblokken, shortcodes, interpolatievariabelen).

### Optie B: Google Translate

```bash
export GOOGLE_TRANSLATE_API_KEY=...
```

Ideaal voor: grote volumes van key-value stringparen (meer dan 130 talen). **Niet aanbevolen** voor Markdown-content — Google Translate heeft geen besef van codeblokken, shortcodes of interpolatievariabelen.

Om Google Translate expliciet te gebruiken:

```bash
i18n-rosetta sync --method google-translate
```

> **Tip**: Als alleen `GOOGLE_TRANSLATE_API_KEY` is ingesteld (geen OpenRouter-sleutel), schakelt rosetta automatisch over naar Google Translate.

---

## Hugo (TOML / YAML / Markdown)

### Projectstructuur

Hugo gebruikt `i18n/` voor stringvertalingen en `content/` voor paginacontent:

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

### Configuratie

```bash
npm install --save-dev i18n-rosetta
```

```bash
# .env.local
OPENROUTER_API_KEY=sk-or-v1-your-key-here
```

Maak `i18n-rosetta.config.json` aan:

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

### Details van contentvertaling

**Front matter**: Ondersteunt zowel YAML- (`---`) als TOML-scheidingstekens (`+++`). Vertaalt standaard `title`, `description`, `summary`, `subtitle`, `caption` en `linkTitle`. Alle andere velden (date, draft, tags, weight, slug, enz.) blijven behouden. Pas dit aan met `translatableFields` in uw configuratie.

**Blokbescherming**: Codeblokken, Hugo shortcodes (`{{< >}}`, `{{% %}}`), inline code en ruwe HTML worden automatisch afgeschermd met behulp van Unicode-sentinel-placeholders. Deze worden ongewijzigd doorgegeven.

**Bestandsnaamconventie**: Volgt het patroon van Hugo voor vertaling via bestandsnamen:
- `my-post.md` → `my-post.fr.md`
- `my-post.en.md` → `my-post.fr.md` (verwijdert het achtervoegsel van de bron)

**Bestaande overslaan**: Bestaande vertaalde bestanden worden nooit overschreven. Verwijder een doelbestand om een hervertaling te forceren.

### Meervoudsvormen

TOML- en YAML-locales ondersteunen CLDR-meervoudsvormen:

```toml
[items]
one = "{{ .Count }} item"
other = "{{ .Count }} items"
```

Intern weergegeven als `items.one` en `items.other` voor diffing, en vervolgens opnieuw geserialiseerd naar het correcte gesegmenteerde formaat bij het wegschrijven.

---

## next-intl (JSON)

### Projectstructuur

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

### Configuratie

```bash
npm install --save-dev i18n-rosetta
```

Maak `i18n-rosetta.config.json` aan:

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

Maakt `messages/fr.json`, `messages/ja.json`, enz. aan — volledig vertaald, met behoud van uw geneste sleutelstructuur. next-intl pikt deze automatisch op.

### Ontwikkelingsworkflow

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

### Platte bestandsstructuur (aanbevolen)

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

### Geneste mappenstructuur

Als u de `{locale}/{namespace}.json`-structuur gebruikt, maak dan een synchronisatiescript aan om de structuur plat te maken (flatten) → te vertalen → te herstellen (unflatten). Zie de [react-i18next-documentatie](https://react.i18next.com/) voor meer details.