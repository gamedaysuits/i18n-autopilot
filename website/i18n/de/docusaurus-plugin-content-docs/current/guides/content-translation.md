---
sidebar_position: 5
title: "Inhaltsübersetzung"
---
# Inhaltsübersetzung (Hugo Markdown)

Rosetta übersetzt Hugo Markdown-Dateien — sowohl Front-Matter-Felder als auch den Textkörper — mit vollständigem Schutz von Codeblöcken, Shortcodes und strukturierten Elementen.

## Einrichtung

Setzen Sie `contentDir` in Ihrer Konfiguration, um die Übersetzung von Markdown-Inhalten zu aktivieren:

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

## Was übersetzt wird

### Front Matter

Sowohl YAML- (`---`) als auch TOML-Trennzeichen (`+++`) werden unterstützt. Standardmäßig werden diese Felder übersetzt:

- `title`
- `description`
- `summary`
- `subtitle`
- `caption`
- `linkTitle`

Alle anderen Felder (`date`, `draft`, `tags`, `weight`, `slug`, usw.) bleiben unverändert erhalten. Passen Sie dies mit `translatableFields` in Ihrer Konfiguration an.

### Textkörper

Der gesamte Markdown-Textkörper wird mit Blockschutz übersetzt — strukturierte Elemente werden vor der Übersetzung durch Unicode-Sentinel-Platzhalter abgeschirmt und danach wiederhergestellt.

## Blockschutz

Diese Elemente bleiben bei der Übersetzung unangetastet:

| Element | Beispiel | Schutz |
|---------|---------|-----------|
| Codeblöcke | ``````` ```js ... ``` ``````` | Vollständiger Block abgeschirmt |
| Inline-Code | `` `variable` `` | Abgeschirmt |
| Hugo Shortcodes | `{{< figure >}}`, `{{% note %}}` | Vollständiger Block abgeschirmt |
| Reines HTML | `<div>`, `<table>` | Abgeschirmt |
| Links (URLs) | `[text](https://...)` | URL erhalten, Text übersetzt |
| Interpolation | `{{ .Count }}` | Abgeschirmt |

## Dateinamenkonvention

Folgt Hugos Muster der Übersetzung per Dateiname:

```
my-post.md      → my-post.fr.md
my-post.en.md   → my-post.fr.md  (strips source suffix)
```

## Verhalten beim Überspringen

Bereits existierende übersetzte Dateien werden **niemals überschrieben**. Wenn `my-post.fr.md` bereits existiert, wird sie übersprungen. Löschen Sie die Zieldatei, um eine erneute Übersetzung zu erzwingen.

## Nur-Markdown-Methoden

:::warning Google Translate und Markdown
Google Translate hat **keinerlei Kenntnis** von Codeblöcken, Shortcodes oder Interpolationsvariablen. Es wird strukturierte Markdown-Inhalte beschädigen. Verwenden Sie LLM-Methoden (`llm` oder `llm-coached`) für die Inhaltsübersetzung — diese schirmen strukturierte Elemente explizit ab.
:::

Wenn die Inhaltsübersetzung als Ausweichlösung von Google Translate auf eine LLM-Methode zurückgreift, protokolliert Rosetta eine Warnung, die den Grund dafür erklärt.