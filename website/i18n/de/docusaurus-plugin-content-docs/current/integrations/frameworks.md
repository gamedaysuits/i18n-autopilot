# Integrationsanleitungen

Schritt-für-Schritt-Einrichtung für i18n-rosetta mit gängigen Frameworks.

---

## Einrichtung des API-Schlüssels

Bevor Sie die Integration mit einem Framework vornehmen, benötigen Sie einen API-Schlüssel für die Übersetzung. Rosetta unterstützt zwei Anbieter:

### Option A: OpenRouter (empfohlen)

[OpenRouter](https://openrouter.ai) bietet eine einheitliche API für über 200 LLM-Modelle. Ein kostenloser Tarif ist verfügbar.

```bash
# Sign up at https://openrouter.ai, then:
export OPENROUTER_API_KEY=sk-or-v1-...

# Or add to .env.local:
OPENROUTER_API_KEY=sk-or-v1-your-key-here
```

Am besten geeignet für: inhaltsschwere Projekte, Markdown-Übersetzung und Projekte, die eine inhaltsbezogene Abschirmung benötigen (Codeblöcke, Shortcodes, Interpolationsvariablen).

### Option B: Google Translate

```bash
export GOOGLE_TRANSLATE_API_KEY=...
```

Am besten geeignet für: große Mengen an Schlüssel-Wert-Paaren (über 130 Sprachen). **Nicht empfohlen** für Markdown-Inhalte — Google Translate erkennt keine Codeblöcke, Shortcodes oder Interpolationsvariablen.

Um Google Translate explizit zu verwenden:

```bash
i18n-rosetta sync --method google-translate
```

> **Tipp**: Wenn nur `GOOGLE_TRANSLATE_API_KEY` festgelegt ist (kein OpenRouter-Schlüssel), wechselt rosetta automatisch zu Google Translate.

---

## Hugo (TOML / YAML / Markdown)

### Projektstruktur

Hugo verwendet `i18n/` für die Übersetzung von Zeichenfolgen und `content/` für Seiteninhalte:

```
my-hugo-site/
├── i18n/
│   ├── en.toml             ← source of truth
│   ├── fr.toml
│   └── ja.toml
├── content/
│   ├── posts/
│   │   ├── hello.md        ← source (English)
│   │   ├── hello.fr.md
│   │   └── hello.ja.md
│   └── about.md
└── .env.local
```

### Einrichtung

```bash
npm install --save-dev i18n-rosetta
```

```bash
# .env.local
OPENROUTER_API_KEY=sk-or-v1-your-key-here
```

Erstellen Sie `i18n-rosetta.config.json`:

```json
{
  "version": 3,
  "inputLocale": "en",
  "localesDir": "./i18n",
  "contentDir": "./content",
  "format": "auto",
  "languages": ["fr", "de", "ja", "es", "ko", "zh"]
}
```

```bash
i18n-rosetta sync           # sync i18n string files + content files
i18n-rosetta sync --dry     # preview changes without writing
```

### Details zur Inhaltsübersetzung

**Front matter**: Unterstützt sowohl YAML- (`---`) als auch TOML-Trennzeichen (`+++`). Übersetzt standardmäßig `title`, `description`, `summary`, `subtitle`, `caption` und `linkTitle`. Alle anderen Felder (date, draft, tags, weight, slug usw.) bleiben erhalten. Passen Sie dies mit `translatableFields` in Ihrer Konfiguration an.

**Blockschutz**: Codeblöcke, Hugo-Shortcodes (`{{< >}}`, `{{% %}}`), Inline-Code und rohes HTML werden automatisch durch Unicode-Sentinel-Platzhalter abgeschirmt. Sie werden unverändert durchgereicht.

**Dateinamenskonvention**: Folgt dem Muster von Hugo für die Übersetzung nach Dateinamen:
- `my-post.md` → `my-post.fr.md`
- `my-post.en.md` → `my-post.fr.md` (entfernt das Quellsuffix)

**Vorhandene überspringen**: Bereits vorhandene übersetzte Dateien werden niemals überschrieben. Löschen Sie eine Zieldatei, um eine erneute Übersetzung zu erzwingen.

### Pluralformen

TOML- und YAML-Lokalisierungen unterstützen CLDR-Pluralformen:

```toml
[items]
one = "{{ .Count }} item"
other = "{{ .Count }} items"
```

Intern als `items.one` und `items.other` für den Abgleich (Diffing) dargestellt und beim Schreiben wieder in das korrekte, in Abschnitte unterteilte Format serialisiert.

---

## next-intl (JSON)

### Projektstruktur

```
my-app/
├── messages/
│   └── en.json        ← source of truth
├── src/
│   ├── i18n/
│   │   ├── routing.ts
│   │   └── request.ts
│   └── middleware.ts
└── .env.local
```

### Einrichtung

```bash
npm install --save-dev i18n-rosetta
```

Erstellen Sie `i18n-rosetta.config.json`:

```json
{
  "version": 3,
  "inputLocale": "en",
  "localesDir": "./messages",
  "languages": ["fr", "de", "ja", "es", "ko", "zh", "pt", "ar"]
}
```

```bash
npx i18n-rosetta sync
```

Erstellt `messages/fr.json`, `messages/ja.json` usw. — vollständig übersetzt, wobei Ihre verschachtelte Schlüsselstruktur erhalten bleibt. next-intl erkennt diese automatisch.

### Entwicklungsablauf

```json
{
  "scripts": {
    "dev": "i18n-rosetta watch & next dev",
    "i18n:sync": "i18n-rosetta sync",
    "i18n:audit": "i18n-rosetta audit"
  }
}
```

---

## react-i18next (JSON)

### Flache Dateistruktur (empfohlen)

```
locales/
├── en.json
├── fr.json
└── ja.json
```

```json
{
  "version": 3,
  "inputLocale": "en",
  "localesDir": "./locales",
  "languages": ["fr", "de", "ja"]
}
```

### Verschachtelte Verzeichnisstruktur

Wenn Sie die Struktur `{locale}/{namespace}.json` verwenden, erstellen Sie ein Synchronisierungsskript, um die Hierarchie aufzulösen → zu übersetzen → die Hierarchie wiederherzustellen. Weitere Details finden Sie in der [Dokumentation zu react-i18next](https://react.i18next.com/).