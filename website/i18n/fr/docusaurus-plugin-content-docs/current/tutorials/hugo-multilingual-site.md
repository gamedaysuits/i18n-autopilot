---
sidebar_position: 3
title: "Site multilingue Hugo"
description: "Guide pratique : configurer un site multilingue Hugo complet avec i18n-rosetta pour gérer la traduction des fichiers de chaînes ainsi que du contenu Markdown."
---
# Livre de recettes : Site multilingue Hugo

Configurez le système multilingue de Hugo avec i18n-rosetta pour gérer à la fois les fichiers de chaînes JSON et la traduction du contenu Markdown. Ceci couvre le flux de travail complet, de la configuration du projet au déploiement en production.

**Ce que vous allez construire :** Un site Hugo en anglais, français et japonais — traductions de chaînes via des fichiers de localisation, traductions de contenu via le traitement Markdown.

---

## Structure du projet

Rosetta utilise le mode de traduction **basé sur le nom de fichier** de Hugo. Les fichiers traduits sont placés dans le même répertoire que le fichier source, avec un suffixe de langue ajouté au nom du fichier (par exemple, `about.fr.md`) :

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

:::note Modes i18n de Hugo
Hugo prend en charge deux stratégies de traduction : **basée sur le nom de fichier** (`about.fr.md` à côté de `about.md`) et **basée sur le répertoire** (arborescences `content/fr/about.md` séparées). Rosetta utilise la traduction basée sur le nom de fichier car sa fonction `getTargetContentPath()` génère des chemins cibles en ajoutant un suffixe de langue au nom du fichier source. Assurez-vous que votre `hugo.toml` est configuré pour la traduction basée sur le nom de fichier lorsque vous utilisez rosetta.
:::

## Étape 1 : Configurer Hugo

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

## Étape 2 : Configurer Rosetta

Rosetta nécessite la configuration de deux éléments : le chemin du fichier de localisation (pour les chaînes JSON) et le répertoire de contenu (pour le Markdown).

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

## Étape 3 : Créer le contenu source

### Traductions de chaînes (i18n/)

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

### Contenu Markdown (content/en/)

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

## Étape 4 : Exécuter la synchronisation

```bash
npx i18n-rosetta sync
```

Rosetta traite les deux types :

1. **Fichiers de chaînes** (`i18n/en.json` → `i18n/fr.json`, `i18n/ja.json`)
2. **Fichiers de contenu** (`content/en/about.md` → `content/en/about.fr.md`, `content/en/about.ja.md`)

### Détails de la traduction de contenu

Lors de la traduction du Markdown, rosetta effectue automatiquement les actions suivantes :

- **Protège** les blocs de code, les shortcodes (`{{< ... >}}`), le code en ligne et le HTML
- **Traduit** les champs du front matter (`title`, `description`, `summary`)
- **Préserve** tous les autres champs du front matter (`date`, `draft`, `weight`, `tags`)
- **Restaure** les blocs protégés après la traduction

Le shortcode Hugo `{{< team-grid >}}` est transmis sans être traduit.

## Étape 5 : Vérifier

```bash
# Preview the site
hugo server

# Check translation status
npx i18n-rosetta status
```

Naviguez vers `localhost:1313/fr/` et `localhost:1313/ja/` pour examiner le contenu traduit.

## Étape 6 : Sélecteur de langue Hugo

Ajoutez un sélecteur de langue à votre layout Hugo :

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

## Maintenir le contenu synchronisé

Lorsque vous mettez à jour le contenu en anglais, exécutez à nouveau la synchronisation. Rosetta ne retraduit que les fichiers qui ont été modifiés :

```bash
# Edit content/en/about.md, then:
npx i18n-rosetta sync
```

Le fichier de verrouillage suit les hachages de contenu par fichier, de sorte que les pages stables ne sont pas retraduites.

## Voir aussi

- **[Guide de traduction de contenu](/docs/guides/content-translation)** — Plongée approfondie dans la protection, le front matter et les cas particuliers
- **[Intégration de frameworks](/docs/guides/framework-integration)** — Configurations Next.js et React
- **[Guide CI/CD](/docs/guides/ci-cd)** — Automatiser les synchronisations lors d'un push vers `content/en/`
- **[Méthodes de traduction](/docs/guides/translation-methods)** — Comparer les stratégies de traduction LLM, de mémoire de traduction (TM) et hybrides
- **[Langues prises en charge](/docs/reference/supported-languages)** — Liste complète des paramètres régionaux et des codes de langue pris en charge