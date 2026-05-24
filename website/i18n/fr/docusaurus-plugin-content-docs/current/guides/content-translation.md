---
sidebar_position: 5
title: "Traduction de contenu"
---
# Traduction de contenu (Hugo Markdown)

Rosetta traduit les fichiers Hugo Markdown — tant les champs du front matter que le contenu du corps — avec une protection complète des blocs de code, des shortcodes et des éléments structurés.

## Configuration

Définissez `contentDir` dans votre configuration pour activer la traduction du contenu Markdown :

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

## Ce qui est traduit

### Front Matter

Les délimiteurs YAML (`---`) et TOML (`+++`) sont tous deux pris en charge. Par défaut, ces champs sont traduits :

- `title`
- `description`
- `summary`
- `subtitle`
- `caption`
- `linkTitle`

Tous les autres champs (`date`, `draft`, `tags`, `weight`, `slug`, etc.) sont préservés tels quels. Personnalisez-les avec `translatableFields` dans votre configuration.

### Contenu du corps

L'intégralité du corps Markdown est traduite avec une protection des blocs — les éléments structurés sont protégés à l'aide d'espaces réservés sentinelles Unicode avant la traduction et restaurés par la suite.

## Protection des blocs

Ces éléments traversent la traduction sans être modifiés :

| Élément | Exemple | Protection |
|---------|---------|-----------|
| Blocs de code | ``````` ```js ... ``` ``````` | Bloc complet protégé |
| Code en ligne | `` `variable` `` | Protégé |
| Shortcodes Hugo | `{{< figure >}}`, `{{% note %}}` | Bloc complet protégé |
| HTML brut | `<div>`, `<table>` | Protégé |
| Liens (URL) | `[text](https://...)` | URL préservée, texte traduit |
| Interpolation | `{{ .Count }}` | Protégée |

## Convention de nommage des fichiers

Suit le modèle de traduction par nom de fichier de Hugo :

```
my-post.md      → my-post.fr.md
my-post.en.md   → my-post.fr.md  (strips source suffix)
```

## Comportement d'omission

Les fichiers traduits existants ne sont **jamais écrasés**. Si `my-post.fr.md` existe déjà, il est ignoré. Supprimez le fichier cible pour forcer une nouvelle traduction.

## Méthodes exclusives à Markdown

:::warning Google Translate et Markdown
Google Translate n'a **aucune connaissance** des blocs de code, des shortcodes ou des variables d'interpolation. Il corrompra le contenu Markdown structuré. Utilisez les méthodes LLM (`llm` ou `llm-coached`) pour la traduction de contenu — elles protègent explicitement les éléments structurés.
:::

Lorsque la traduction de contenu bascule de Google Translate vers une méthode LLM, rosetta enregistre un avertissement expliquant pourquoi.