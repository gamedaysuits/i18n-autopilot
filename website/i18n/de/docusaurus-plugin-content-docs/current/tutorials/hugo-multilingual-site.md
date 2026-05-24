---
sidebar_position: 3
title: "Mehrsprachige Hugo-Website"
description: "Kochbuch: Richten Sie eine vollständige mehrsprachige Hugo-Website ein, bei der i18n-rosetta die Übersetzung sowohl von String-Dateien als auch von Markdown-Inhalten übernimmt."
---
# Kochbuch: Mehrsprachige Hugo-Website

Richten Sie das mehrsprachige System von Hugo mit i18n-rosetta ein, das sowohl JSON-Zeichenketten-Dateien als auch die Übersetzung von Markdown-Inhalten verarbeitet. Dies deckt den kompletten Arbeitsablauf von der Projekteinrichtung bis zur Bereitstellung in der Produktionsumgebung ab.

**Was Sie erstellen werden:** Eine Hugo-Website auf Englisch, Französisch und Japanisch — Zeichenketten-Übersetzungen über Lokalisierungsdateien, Inhaltsübersetzungen durch Markdown-Verarbeitung.

---

## Projektstruktur

Rosetta verwendet den **dateinamenbasierten** Übersetzungsmodus von Hugo. Übersetzte Dateien werden im selben Verzeichnis wie die Quelldatei abgelegt, wobei dem Dateinamen ein Sprach-Suffix hinzugefügt wird (z. B. `about.fr.md`):

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

:::note Hugo i18n-Modi
Hugo unterstützt zwei Übersetzungsstrategien: **dateinamenbasiert** (`about.fr.md` neben `about.md`) und **verzeichnisbasiert** (separate `content/fr/about.md`-Bäume). Rosetta verwendet die dateinamenbasierte Übersetzung, da seine `getTargetContentPath()`-Funktion Zielpfade generiert, indem sie ein Sprach-Suffix an den Quell-Dateinamen anhängt. Stellen Sie sicher, dass Ihre `hugo.toml` für die dateinamenbasierte Übersetzung konfiguriert ist, wenn Sie rosetta verwenden.
:::

## Schritt 1: Hugo konfigurieren

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

## Schritt 2: Rosetta konfigurieren

Für Rosetta müssen zwei Dinge konfiguriert werden: der Dateipfad für die Lokalisierung (für JSON-Zeichenketten) und das Inhaltsverzeichnis (für Markdown).

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

## Schritt 3: Quellinhalte erstellen

### Zeichenketten-Übersetzungen (i18n/)

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

### Markdown-Inhalte (content/en/)

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

## Schritt 4: Die Synchronisierung ausführen

```bash
npx i18n-rosetta sync
```

Rosetta verarbeitet beide Typen:

1. **Zeichenketten-Dateien** (`i18n/en.json` → `i18n/fr.json`, `i18n/ja.json`)
2. **Inhaltsdateien** (`content/en/about.md` → `content/en/about.fr.md`, `content/en/about.ja.md`)

### Details zur Inhaltsübersetzung

Bei der Übersetzung von Markdown führt rosetta automatisch Folgendes aus:

- **Schützt** Codeblöcke, Shortcodes (`{{< ... >}}`), Inline-Code und HTML
- **Übersetzt** Front-Matter-Felder (`title`, `description`, `summary`)
- **Bewahrt** alle anderen Front-Matter-Felder (`date`, `draft`, `weight`, `tags`)
- **Stellt** geschützte Blöcke nach der Übersetzung wieder her

Der Hugo-Shortcode `{{< team-grid >}}` wird unübersetzt durchgereicht.

## Schritt 5: Überprüfen

```bash
# Preview the site
hugo server

# Check translation status
npx i18n-rosetta status
```

Navigieren Sie zu `localhost:1313/fr/` und `localhost:1313/ja/`, um die übersetzten Inhalte zu überprüfen.

## Schritt 6: Hugo-Sprachumschalter

Fügen Sie Ihrem Hugo-Layout einen Sprachumschalter hinzu:

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

## Inhalte synchron halten

Wenn Sie englische Inhalte aktualisieren, führen Sie die Synchronisierung erneut aus. Rosetta übersetzt nur Dateien neu, die sich geändert haben:

```bash
# Edit content/en/about.md, then:
npx i18n-rosetta sync
```

Die Sperrdatei verfolgt Inhalts-Hashes pro Datei, sodass unveränderte Seiten nicht neu übersetzt werden.

## Siehe auch

- **[Leitfaden zur Inhaltsübersetzung](/docs/guides/content-translation)** — Detaillierter Einblick in den Schutz von Elementen, Front Matter und Sonderfälle
- **[Framework-Integration](/docs/guides/framework-integration)** — Next.js- und React-Konfigurationen
- **[CI/CD-Leitfaden](/docs/guides/ci-cd)** — Automatisieren Sie Synchronisierungen beim Push nach `content/en/`
- **[Übersetzungsmethoden](/docs/guides/translation-methods)** — Vergleichen Sie LLM-, TM- und hybride Übersetzungsstrategien
- **[Unterstützte Sprachen](/docs/reference/supported-languages)** — Vollständige Liste der unterstützten Lokalisierungen und Sprachcodes