---
sidebar_position: 3
title: "Meertalige Hugo-site"
description: "Kookboek: een volledige meertalige Hugo-site opzetten waarbij i18n-rosetta de vertaling van zowel string-bestanden als Markdown-content afhandelt."
---
# Kookboek: Meertalige Hugo-website

Richt het meertalige systeem van Hugo in waarbij i18n-rosetta zowel de vertaling van JSON-stringbestanden als Markdown-content afhandelt. Dit omvat de volledige workflow, van de projectconfiguratie tot de implementatie in productie.

**Wat u gaat bouwen:** Een Hugo-website met Engels, Frans en Japans — stringvertalingen via locale-bestanden, contentvertalingen via Markdown-verwerking.

---

## Projectstructuur

Rosetta gebruikt de **filename-based** vertaalmodus van Hugo. Vertaalde bestanden worden in dezelfde directory geplaatst als het bronbestand, waarbij een taalachtervoegsel aan de bestandsnaam wordt toegevoegd (bijv. `about.fr.md`):

```
my-hugo-site/
├── content/
│   └── en/
│       ├── _index.md
│       ├── _index.fr.md           ← rosetta generates
│       ├── _index.ja.md           ← rosetta generates
│       ├── about.md
│       ├── about.fr.md            ← rosetta generates
│       ├── about.ja.md            ← rosetta generates
│       └── blog/
│           ├── first-post.md
│           ├── first-post.fr.md   ← rosetta generates
│           └── first-post.ja.md   ← rosetta generates
├── i18n/
│   ├── en.json
│   ├── fr.json                    ← rosetta generates
│   └── ja.json                    ← rosetta generates
└── hugo.toml
```

:::note Hugo i18n-modi
Hugo ondersteunt twee vertaalstrategieën: **filename-based** (`about.fr.md` naast `about.md`) en **directory-based** (afzonderlijke `content/fr/about.md`-bomen). Rosetta gebruikt filename-based vertaling omdat de `getTargetContentPath()`-functie doelpaden genereert door een taalachtervoegsel toe te voegen aan de bronbestandsnaam. Zorg ervoor dat uw `hugo.toml` is geconfigureerd voor filename-based vertaling wanneer u rosetta gebruikt.
:::

## Stap 1: Hugo configureren

```toml title="hugo.toml"
defaultContentLanguage = 'en'

[languages]
  [languages.en]
    languageName = 'English'
    weight = 1
  [languages.fr]
    languageName = 'Français'
    weight = 2
  [languages.ja]
    languageName = '日本語'
    weight = 3
```

## Stap 2: Rosetta configureren

Voor Rosetta moeten twee zaken worden geconfigureerd: het pad naar het locale-bestand (voor JSON-strings) en de content-directory (voor Markdown).

```json title="i18n-rosetta.config.json"
{
  "version": 3,
  "inputLocale": "en",
  "localesDir": "./i18n",
  "contentDir": "./content",
  "model": "google/gemini-3.5-flash",
  "pairs": {
    "en:fr": { "method": "llm" },
    "en:ja": { "method": "llm", "model": "openai/gpt-4o" }
  },
  "languages": {
    "fr": { "name": "French", "register": "Formal (vous-form)" },
    "ja": { "name": "Japanese", "register": "Polite/formal" }
  }
}
```

## Stap 3: Broncontent aanmaken

### Stringvertalingen (i18n/)

```json title="i18n/en.json"
{
  "nav": {
    "home": "Home",
    "about": "About",
    "blog": "Blog",
    "contact": "Contact"
  },
  "footer": {
    "copyright": "© 2026 My Company. All rights reserved.",
    "privacy": "Privacy Policy"
  }
}
```

### Markdown-content (content/en/)

```markdown title="content/en/about.md"
---
title: "About Us"
description: "Learn more about our team and mission"
date: 2026-01-15
---

We build software that helps businesses communicate across languages.

Our platform supports **real-time translation** for over 30 languages,
with specialized support for low-resource languages.

## Our Mission

Language should never be a barrier to understanding.

## The Team

{{< team-grid >}}
```

## Stap 4: De synchronisatie uitvoeren

```bash
npx i18n-rosetta sync
```

Rosetta verwerkt beide typen:

1. **Stringbestanden** (`i18n/en.json` → `i18n/fr.json`, `i18n/ja.json`)
2. **Contentbestanden** (`content/en/about.md` → `content/en/about.fr.md`, `content/en/about.ja.md`)

### Details van contentvertaling

Bij het vertalen van Markdown zal rosetta automatisch:

- Codeblokken, shortcodes (`{{< ... >}}`), inline code en HTML **afschermen**
- Front matter-velden (`title`, `description`, `summary`) **vertalen**
- Alle overige front matter-velden (`date`, `draft`, `weight`, `tags`) **behoudt**
- Afgeschermde blokken na de vertaling **herstellen**

De Hugo-shortcode `{{< team-grid >}}` wordt onvertaald doorgelaten.

## Stap 5: Verifiëren

```bash
# Preview the site
hugo server

# Check translation status
npx i18n-rosetta status
```

Navigeer naar `localhost:1313/fr/` en `localhost:1313/ja/` om de vertaalde content te beoordelen.

## Stap 6: Hugo-taalschakelaar

Voeg een taalschakelaar toe aan uw Hugo-lay-out:

```html title="layouts/partials/language-switcher.html"
<nav class="language-switcher">
  {{ range $.Site.Home.AllTranslations }}
    <a href="{{ .Permalink }}"
       {{ if eq .Lang $.Site.Language.Lang }}class="active"{{ end }}>
      {{ .Language.LanguageName }}
    </a>
  {{ end }}
</nav>
```

## Content gesynchroniseerd houden

Wanneer u de Engelse content bijwerkt, voert u de synchronisatie opnieuw uit. Rosetta hertaalt alleen bestanden die zijn gewijzigd:

```bash
# Edit content/en/about.md, then:
npx i18n-rosetta sync
```

Het lock-bestand houdt content-hashes per bestand bij, zodat stabiele pagina's niet opnieuw worden vertaald.

## Zie ook

- **[Handleiding voor contentvertaling](/docs/guides/content-translation)** — Diepgaande informatie over afscherming, front matter en uitzonderingsgevallen
- **[Framework-integratie](/docs/guides/framework-integration)** — Next.js- en React-configuraties
- **[CI/CD-handleiding](/docs/guides/ci-cd)** — Automatiseer synchronisaties bij een push naar `content/en/`
- **[Vertaalmethoden](/docs/guides/translation-methods)** — Vergelijk LLM-, TM- en hybride vertaalstrategieën
- **[Ondersteunde talen](/docs/reference/supported-languages)** — Volledige lijst van ondersteunde locales en taalcodes