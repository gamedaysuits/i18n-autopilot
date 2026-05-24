---
sidebar_position: 3
title: "Sitio multilingüe de Hugo"
description: "Recetario: configure un sitio multilingüe completo de Hugo con i18n-rosetta a cargo de la traducción tanto de los archivos de cadenas como del contenido en Markdown."
---
# Recetario: Sitio multilingüe en Hugo

Configure el sistema multilingüe de Hugo con i18n-rosetta para manejar tanto los archivos de cadenas JSON como la traducción de contenido en Markdown. Esto cubre el flujo de trabajo completo desde la configuración del proyecto hasta el despliegue en producción.

**Lo que construirá:** Un sitio en Hugo con inglés, francés y japonés: traducciones de cadenas a través de archivos de configuración regional y traducciones de contenido mediante el procesamiento de Markdown.

---

## Estructura del proyecto

Rosetta utiliza el modo de traducción **basado en nombres de archivo** de Hugo. Los archivos traducidos se colocan en el mismo directorio que el archivo de origen, con un sufijo de idioma añadido al nombre del archivo (por ejemplo, `about.fr.md`):

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

:::note Modos i18n de Hugo
Hugo admite dos estrategias de traducción: **basada en nombres de archivo** (`about.fr.md` junto a `about.md`) y **basada en directorios** (árboles `content/fr/about.md` separados). Rosetta utiliza la traducción basada en nombres de archivo porque su función `getTargetContentPath()` genera las rutas de destino añadiendo un sufijo de idioma al nombre del archivo de origen. Asegúrese de que su `hugo.toml` esté configurado para la traducción basada en nombres de archivo al usar rosetta.
:::

## Paso 1: Configurar Hugo

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

## Paso 2: Configurar Rosetta

Rosetta necesita que se configuren dos cosas: la ruta del archivo de configuración regional (para las cadenas JSON) y el directorio de contenido (para Markdown).

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

## Paso 3: Crear el contenido de origen

### Traducciones de cadenas (i18n/)

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

### Contenido en Markdown (content/en/)

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

## Paso 4: Ejecutar la sincronización

```bash
npx i18n-rosetta sync
```

Rosetta procesa ambos tipos:

1. **Archivos de cadenas** (`i18n/en.json` → `i18n/fr.json`, `i18n/ja.json`)
2. **Archivos de contenido** (`content/en/about.md` → `content/en/about.fr.md`, `content/en/about.ja.md`)

### Detalles de la traducción de contenido

Al traducir Markdown, rosetta automáticamente:

- **Protege** los bloques de código, shortcodes (`{{< ... >}}`), código en línea y HTML
- **Traduce** los campos del front matter (`title`, `description`, `summary`)
- **Conserva** todos los demás campos del front matter (`date`, `draft`, `weight`, `tags`)
- **Restaura** los bloques protegidos después de la traducción

El shortcode de Hugo `{{< team-grid >}}` pasa sin ser traducido.

## Paso 5: Verificar

```bash
# Preview the site
hugo server

# Check translation status
npx i18n-rosetta status
```

Navegue a `localhost:1313/fr/` y `localhost:1313/ja/` para revisar el contenido traducido.

## Paso 6: Selector de idioma de Hugo

Agregue un selector de idioma a su layout de Hugo:

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

## Mantener el contenido sincronizado

Cuando actualice el contenido en inglés, vuelva a ejecutar la sincronización. Rosetta solo vuelve a traducir los archivos que han cambiado:

```bash
# Edit content/en/about.md, then:
npx i18n-rosetta sync
```

El archivo de bloqueo rastrea los hashes de contenido por archivo, por lo que las páginas estables no se vuelven a traducir.

## Consulte también

- **[Guía de traducción de contenido](/docs/guides/content-translation)** — Análisis profundo sobre la protección, el front matter y los casos extremos
- **[Integración de frameworks](/docs/guides/framework-integration)** — Configuraciones para Next.js y React
- **[Guía de CI/CD](/docs/guides/ci-cd)** — Automatice las sincronizaciones al hacer push a `content/en/`
- **[Métodos de traducción](/docs/guides/translation-methods)** — Compare las estrategias de traducción con LLM, TM e híbridas
- **[Idiomas compatibles](/docs/reference/supported-languages)** — Lista completa de configuraciones regionales y códigos de idioma compatibles