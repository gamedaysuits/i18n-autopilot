---
slug: v3-1-content-translation
title: "v3.1.0: Traducción de contenido Markdown de Hugo"
authors: [curtisforbes]
tags: [release]
date: 2026-04-15
---
La versión 3.1.0 añade la traducción completa de contenido Markdown de Hugo — campos del front matter y contenido del cuerpo, con protección automática para bloques de código, shortcodes y variables de interpolación.

<!-- truncate -->

## Traducción con reconocimiento de contenido

Al traducir Markdown, no se puede simplemente enviar el archivo sin procesar a un LLM. Los bloques de código se traducen. Los shortcodes se corrompen. Las variables de plantilla de Hugo se estropean.

Rosetta v3.1.0 resuelve esto con la **protección de centinelas Unicode**:

1. Antes de la traducción, los bloques estructurados (bloques de código, shortcodes, código en línea, HTML) se reemplazan con tokens centinela únicos
2. El LLM recibe únicamente el texto traducible
3. Después de la traducción, los centinelas se restauran con el contenido original

El LLM nunca ve sus bloques de código. No puede corromperlos.

## Soporte de front matter

Se admiten los delimitadores de front matter tanto de YAML (`---`) como de TOML (`+++`). De forma predeterminada, se traducen `title`, `description`, `summary`, `subtitle`, `caption` y `linkTitle`. Todos los demás campos (date, draft, tags, weight) se conservan.

## Configuración

```json title="i18n-rosetta.config.json"
{
  "contentDir": "./content"
}
```

```bash
npx i18n-rosetta sync   # now translates content too
```

Consulte la [guía de Traducción de contenido](/docs/guides/content-translation) para obtener más detalles.