---
sidebar_position: 3
title: "Hugo Multilingual Site"
description: "Cookbook: mag-set up ng buong Hugo multilingual site gamit ang i18n-rosetta para mag-handle ng translation ng parehong string files at Markdown content."
---
# Cookbook: Hugo Multilingual Site

I-set up ang multilingual system ng Hugo gamit ang i18n-rosetta para i-handle pareho ang JSON string files at Markdown content translation. Cino-cover nito ang kumpletong workflow mula project setup hanggang production deployment.

**Ano ang i-bu-build mo:** Isang Hugo site na may English, French, at Japanese — string translations via locale files, at content translations via Markdown processing.

---

## Project Structure

Gumagamit ang Rosetta ng **filename-based** translation mode ng Hugo. Ang mga translated files ay inilalagay sa parehong directory ng source file, na may language suffix na idinagdag sa filename (e.g. `about.fr.md`):

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

:::note Hugo i18n Modes
Nag-su-support ang Hugo ng dalawang translation strategies: **filename-based** (`about.fr.md` katabi ng `about.md`) at **directory-based** (hiwalay na `content/fr/about.md` trees). Gumagamit ang Rosetta ng filename-based translation dahil ang `getTargetContentPath()` function nito ay nag-ge-generate ng target paths sa pamamagitan ng pag-append ng language suffix sa source filename. Siguraduhin po na ang inyong `hugo.toml` ay naka-configure para sa filename-based translation kapag gumagamit ng rosetta.
:::

## Step 1: I-configure ang Hugo

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

## Step 2: I-configure ang Rosetta

Kailangan ng Rosetta ng dalawang bagay na naka-configure: ang locale file path (para sa JSON strings) at ang content directory (para sa Markdown).

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

## Step 3: Gumawa ng Source Content

### String Translations (i18n/)

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

### Markdown Content (content/en/)

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

## Step 4: I-run ang Sync

```bash
npx i18n-rosetta sync
```

Pino-process ng Rosetta ang parehong types:

1. **String files** (`i18n/en.json` → `i18n/fr.json`, `i18n/ja.json`)
2. **Content files** (`content/en/about.md` → `content/en/about.fr.md`, `content/en/about.ja.md`)

### Content Translation Details

Kapag nagta-translate ng Markdown, awtomatikong ginagawa ng rosetta ang mga sumusunod:

- **Shini-shield** ang code blocks, shortcodes (`{{< ... >}}`), inline code, at HTML
- **Tinu-translate** ang front matter fields (`title`, `description`, `summary`)
- **Pini-preserve** ang lahat ng iba pang front matter fields (`date`, `draft`, `weight`, `tags`)
- **Nire-restore** ang mga shielded blocks pagkatapos ng translation

Ang Hugo shortcode na `{{< team-grid >}}` ay nagpa-pass through nang untranslated.

## Step 5: I-verify

```bash
# Preview the site
hugo server

# Check translation status
npx i18n-rosetta status
```

Mag-navigate sa `localhost:1313/fr/` at `localhost:1313/ja/` para i-review ang translated content.

## Step 6: Hugo Language Switcher

Mag-add ng language switcher sa inyong Hugo layout:

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

## Keeping Content in Sync

Kapag nag-update po kayo ng English content, i-run ulit ang sync. Ire-retranslate lang ng Rosetta ang mga files na may changes:

```bash
# Edit content/en/about.md, then:
npx i18n-rosetta sync
```

Tinu-track ng lock file ang content hashes per file, kaya hindi na nire-retranslate ang mga stable pages.

## See Also

- **[Content Translation Guide](/docs/guides/content-translation)** — Deep dive sa shielding, front matter, at edge cases
- **[Framework Integration](/docs/guides/framework-integration)** — Next.js at React setups
- **[CI/CD Guide](/docs/guides/ci-cd)** — I-automate ang syncs on push sa `content/en/`
- **[Translation Methods](/docs/guides/translation-methods)** — I-compare ang LLM, TM, at hybrid translation strategies
- **[Supported Languages](/docs/reference/supported-languages)** — Full list ng mga supported locales at language codes