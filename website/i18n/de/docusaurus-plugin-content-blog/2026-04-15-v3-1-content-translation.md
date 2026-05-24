---
slug: v3-1-content-translation
title: "v3.1.0: Übersetzung von Hugo-Markdown-Inhalten"
authors: [curtisforbes]
tags: [release]
date: 2026-04-15
---
v3.1.0 bietet nun die vollständige Übersetzung von Hugo-Markdown-Inhalten – Front-Matter-Felder und Haupttext – mit automatischem Schutz für Codeblöcke, Shortcodes und Interpolationsvariablen.

<!-- truncate -->

## Kontextsensitive Übersetzung

Bei der Übersetzung von Markdown können Sie nicht einfach die Rohdatei an ein LLM senden. Codeblöcke werden übersetzt. Shortcodes werden beschädigt. Hugo-Vorlagenvariablen werden verfälscht.

Rosetta v3.1.0 löst dieses Problem durch **Unicode-Sentinel-Abschirmung**:

1. Vor der Übersetzung werden strukturierte Blöcke (Code Fences, Shortcodes, Inline-Code, HTML) durch eindeutige Sentinel-Token ersetzt.
2. Das LLM erhält ausschließlich übersetzbaren Text.
3. Nach der Übersetzung werden die Sentinels mit dem ursprünglichen Inhalt wiederhergestellt.

Das LLM sieht Ihre Codeblöcke zu keinem Zeitpunkt. Es kann sie nicht beschädigen.

## Front-Matter-Unterstützung

Sowohl YAML- (`---`) als auch TOML- (`+++`) Front-Matter-Trennzeichen werden unterstützt. Standardmäßig werden `title`, `description`, `summary`, `subtitle`, `caption` und `linkTitle` übersetzt. Alle anderen Felder (date, draft, tags, weight) bleiben erhalten.

## Einrichtung

```json title="i18n-rosetta.config.json"
{
  "contentDir": "./content"
}
```

```bash
npx i18n-rosetta sync   # now translates content too
```

Weitere Einzelheiten finden Sie im [Leitfaden zur Inhaltsübersetzung](/docs/guides/content-translation).