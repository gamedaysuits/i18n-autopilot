---
sidebar_position: 5
title: "Traducción de contenido"
---
# Traducción de contenido (Hugo Markdown)

Rosetta traduce archivos Markdown de Hugo —tanto los campos del front matter como el contenido del cuerpo— con protección total de bloques de código, shortcodes y elementos estructurados.

## Configuración

Establezca `contentDir` en su configuración para habilitar la traducción de contenido Markdown:

```json title="i18n-rosetta.config.json"
{
  "version": 3,
  "inputLocale": "en",
  "localesDir": "./i18n",
  "contentDir": "./content"
}
```

```bash
npx i18n-rosetta sync    # translates both string files and content files
```

## Qué se traduce

### Front Matter

Se admiten los delimitadores tanto de YAML (`---`) como de TOML (`+++`). De forma predeterminada, se traducen estos campos:

- `title`
- `description`
- `summary`
- `subtitle`
- `caption`
- `linkTitle`

Todos los demás campos (`date`, `draft`, `tags`, `weight`, `slug`, etc.) se conservan tal cual. Personalícelo con `translatableFields` en su configuración.

### Contenido del cuerpo

El cuerpo completo del Markdown se traduce con protección de bloques: los elementos estructurados se protegen utilizando marcadores de posición centinelas Unicode antes de la traducción y se restauran después.

## Protección de bloques

Estos elementos pasan por la traducción intactos:

| Elemento | Ejemplo | Protección |
|---------|---------|-----------|
| Bloques de código | ``````` ```js ... ``` ``````` | Bloque completo protegido |
| Código en línea | `` `variable` `` | Protegido |
| Shortcodes de Hugo | `{{< figure >}}`, `{{% note %}}` | Bloque completo protegido |
| HTML sin procesar | `<div>`, `<table>` | Protegido |
| Enlaces (URL) | `[text](https://...)` | URL conservada, texto traducido |
| Interpolación | `{{ .Count }}` | Protegida |

## Convención de nombres de archivo

Sigue el patrón de traducción por nombre de archivo de Hugo:

```
my-post.md      → my-post.fr.md
my-post.en.md   → my-post.fr.md  (strips source suffix)
```

## Comportamiento de omisión

Los archivos traducidos existentes **nunca se sobrescriben**. Si `my-post.fr.md` ya existe, se omite. Elimine el archivo de destino para forzar una nueva traducción.

## Métodos exclusivos para Markdown

:::warning Google Translate y Markdown
Google Translate **no tiene conocimiento** de los bloques de código, shortcodes ni variables de interpolación. Corromperá el contenido estructurado de Markdown. Utilice métodos LLM (`llm` o `llm-coached`) para la traducción de contenido; estos protegen explícitamente los elementos estructurados.
:::

Cuando la traducción de contenido recurre a un método LLM en lugar de Google Translate, rosetta registra una advertencia explicando el motivo.