---
sidebar_position: 3
title: "Site Multilíngue do Hugo"
description: "Guia prático: configure um site multilíngue completo no Hugo com o i18n-rosetta gerenciando a tradução de arquivos de strings e de conteúdo em Markdown."
---
# Cookbook: Site Multilíngue no Hugo

Configure o sistema multilíngue do Hugo com o i18n-rosetta lidando tanto com arquivos de strings JSON quanto com a tradução de conteúdo em Markdown. Isso cobre o fluxo de trabalho completo, desde a configuração do projeto até o deploy em produção.

**O que você vai construir:** Um site em Hugo com inglês, francês e japonês — traduções de strings via arquivos de localidade, traduções de conteúdo via processamento de Markdown.

---

## Estrutura do Projeto

O Rosetta usa o modo de tradução **baseado em nome de arquivo** (filename-based) do Hugo. Os arquivos traduzidos são colocados no mesmo diretório do arquivo de origem, com um sufixo de idioma adicionado ao nome do arquivo (ex: `about.fr.md`):

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

:::note Modos i18n do Hugo
O Hugo suporta duas estratégias de tradução: **baseada em nome de arquivo** (`about.fr.md` ao lado de `about.md`) e **baseada em diretório** (árvores `content/fr/about.md` separadas). O Rosetta usa a tradução baseada em nome de arquivo porque sua função `getTargetContentPath()` gera caminhos de destino anexando um sufixo de idioma ao nome do arquivo de origem. Certifique-se de que seu `hugo.toml` esteja configurado para tradução baseada em nome de arquivo ao usar o rosetta.
:::

## Passo 1: Configurar o Hugo

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

## Passo 2: Configurar o Rosetta

O Rosetta precisa de duas coisas configuradas: o caminho do arquivo de localidade (para strings JSON) e o diretório de conteúdo (para Markdown).

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

## Passo 3: Criar o Conteúdo de Origem

### Traduções de Strings (i18n/)

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

### Conteúdo em Markdown (content/en/)

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

## Passo 4: Executar a Sincronização

```bash
npx i18n-rosetta sync
```

O Rosetta processa ambos os tipos:

1. **Arquivos de strings** (`i18n/en.json` → `i18n/fr.json`, `i18n/ja.json`)
2. **Arquivos de conteúdo** (`content/en/about.md` → `content/en/about.fr.md`, `content/en/about.ja.md`)

### Detalhes da Tradução de Conteúdo

Ao traduzir Markdown, o rosetta automaticamente:

- **Protege** blocos de código, shortcodes (`{{< ... >}}`), código inline e HTML
- **Traduz** campos do front matter (`title`, `description`, `summary`)
- **Preserva** todos os outros campos do front matter (`date`, `draft`, `weight`, `tags`)
- **Restaura** os blocos protegidos após a tradução

O shortcode do Hugo `{{< team-grid >}}` passa sem ser traduzido.

## Passo 5: Verificar

```bash
# Preview the site
hugo server

# Check translation status
npx i18n-rosetta status
```

Navegue até `localhost:1313/fr/` e `localhost:1313/ja/` para revisar o conteúdo traduzido.

## Passo 6: Seletor de Idiomas do Hugo

Adicione um seletor de idiomas ao seu layout do Hugo:

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

## Mantendo o Conteúdo Sincronizado

Quando você atualizar o conteúdo em inglês, execute a sincronização novamente. O Rosetta retraduz apenas os arquivos que foram alterados:

```bash
# Edit content/en/about.md, then:
npx i18n-rosetta sync
```

O lock file rastreia os hashes de conteúdo por arquivo, para que as páginas estáveis não sejam retraduzidas.

## Veja Também

- **[Guia de Tradução de Conteúdo](/docs/guides/content-translation)** — Aprofundamento em proteção, front matter e casos extremos
- **[Integração com Frameworks](/docs/guides/framework-integration)** — Configurações para Next.js e React
- **[Guia de CI/CD](/docs/guides/ci-cd)** — Automatize sincronizações ao fazer push para `content/en/`
- **[Métodos de Tradução](/docs/guides/translation-methods)** — Compare estratégias de tradução por LLM, TM e híbridas
- **[Idiomas Suportados](/docs/reference/supported-languages)** — Lista completa de localidades e códigos de idioma suportados