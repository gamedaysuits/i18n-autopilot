---
slug: v3-1-content-translation
title: "v3.1.0 : Traduction de contenu Markdown Hugo"
authors: [curtisforbes]
tags: [release]
date: 2026-04-15
---
La version 3.1.0 ajoute la traduction complète du contenu Markdown de Hugo — les champs du front matter et le contenu du corps, avec une protection automatique pour les code blocks, les shortcodes et les variables d'interpolation.

<!-- truncate -->

## Traduction sensible au contenu

Lors de la traduction de Markdown, vous ne pouvez pas simplement envoyer le fichier brut à un LLM. Les code blocks sont traduits. Les shortcodes sont corrompus. Les variables de modèle Hugo sont altérées.

Rosetta v3.1.0 résout ce problème grâce à la **protection par sentinelles Unicode** :

1. Avant la traduction, les blocs structurés (code fences, shortcodes, inline code, HTML) sont remplacés par des jetons sentinelles uniques
2. Le LLM reçoit uniquement le texte traduisible
3. Après la traduction, les sentinelles sont restaurées avec le contenu d'origine

Le LLM ne voit jamais vos code blocks. Il ne peut pas les corrompre.

## Prise en charge du front matter

Les délimiteurs de front matter YAML (`---`) et TOML (`+++`) sont tous deux pris en charge. Par défaut, `title`, `description`, `summary`, `subtitle`, `caption` et `linkTitle` sont traduits. Tous les autres champs (date, draft, tags, weight) sont préservés.

## Configuration

```json title="i18n-rosetta.config.json"
{
  "contentDir": "./content"
}
```

```bash
npx i18n-rosetta sync   # now translates content too
```

Consultez le [guide de traduction du contenu](/docs/guides/content-translation) pour plus de détails.