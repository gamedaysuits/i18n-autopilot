---
sidebar_position: 6
title: "Skript-Konverter"
---
# Schrift-Konverter

Schrift-Konverter sind deterministische, LLM-freie Post-Translation-Hooks, die Text von einem Schriftsystem in ein anderes konvertieren. Sie ermöglichen einen „einmal übersetzen, in mehreren Schriften rendern“-Workflow — Sie übersetzen in eine Arbeitsschrift (typischerweise Lateinisch) und konvertieren dann automatisch in die Anzeigeschrift.

## Warum Schrift-Konverter?

Einige Sprachen verwenden mehrere Schriftsysteme für dieselbe gesprochene Sprache:

- **Plains Cree**: SRO (Lateinisch) für die Bearbeitung → Syllabics (ᓀᐦᐃᔭᐍᐏᐣ) für die Anzeige
- **Serbisch**: Lateinisch für den internationalen Gebrauch → Kyrillisch für den inländischen Gebrauch
- **Klingonisch**: Romanisierung für die Eingabe → pIqaD (  ) für die Anzeige

Die direkte Übersetzung in nicht-lateinische Schriften verursacht Probleme: LLMs halluzinieren Zeichen, JSON-Dateien lassen sich schwer versionieren und Diff-Tools können Änderungen nicht vergleichen. Schrift-Konverter lösen dies, indem sie Übersetzungen in einer versionskontrollfreundlichen Schrift belassen und diese beim Synchronisieren deterministisch konvertieren.

## Verfügbare Konverter

Rosetta wird mit fünf integrierten Schrift-Konvertern ausgeliefert:

| Locale | Von | Nach | Typ | Schriftart erforderlich? |
|--------|------|----|------|----------------|
| `crk` | SRO (Standard Roman Orthography) | Cree Syllabics | Deterministisch | Nein — natives Unicode |
| `sr` | Lateinisch | Kyrillisch | Deterministisch | Nein — natives Unicode |
| `tlh` | Romanisierung | pIqaD | Deterministisch | Ja — PUA U+F8D0–F8FF |
| `x-elvish-s` | Lateinisch | Tengwar (Modus von Beleriand) | Deterministisch | Ja — PUA U+E000–E07F |
| `x-kryptonian` | Lateinisch | Kryptonisch | Schriftart-basierte Chiffre | Ja — PUA U+E100–E119 |

### Deterministisch vs. Schriftart-basiert

- **Deterministische Konverter** (Cree, Serbisch, Klingonisch, Tengwar) führen ein echtes Zeichen-für-Zeichen-Mapping anhand linguistischer Regeln durch. Die Ausgabe enthält tatsächliche Unicode-Zeichen.
- **Schriftart-basierte Konverter** (Kryptonisch) sind 1:1-Substitutionschiffren, bei denen die Ausgabe aus Unicode-PUA-Zeichen besteht, die nur dann korrekt gerendert werden, wenn eine bestimmte Schriftart geladen ist.

## Wie sie funktionieren

Schrift-Konverter werden **nach** der Übersetzung als Post-Processing-Schritt ausgeführt. Die Pipeline sieht wie folgt aus:

```
Source (English) → LLM Translation → Working Script → Script Converter → Display Script
```

Zum Beispiel Plains Cree:
```
"Welcome" → LLM → "tānisi" (SRO) → Converter → "ᑖᓂᓯ" (Syllabics)
```

### Greedy Left-to-Right Matching

Alle Konverter verwenden denselben Algorithmus: An jeder Zeichenposition wird zuerst die längstmögliche Übereinstimmung (Match) versucht, dann schrittweise kürzere Übereinstimmungen. Zeichen, die keinem Muster entsprechen (Leerzeichen, Satzzeichen, Zahlen), werden unverändert durchgereicht.

Dadurch werden Digraphen und Trigraphen korrekt verarbeitet:
- Klingonisch: `tlh` → einzelnes pIqaD-Zeichen (nicht `t` + `l` + `h`)
- Serbisch: `nj` → `њ` (nicht `н` + `ј`)
- Cree: `twê` → einzelnes Silbenzeichen (nicht `t` + `w` + `ê`)

## Verwendung von Schrift-Konvertern

Schrift-Konverter werden automatisch aktiviert, wenn der Locale-Code mit einem registrierten Konverter übereinstimmt. Es ist keine Konfiguration erforderlich — legen Sie einfach Ihr Ziel-Locale fest:

```json title="i18n-rosetta.config.json"
{
  "pairs": {
    "en:crk": {
      "method": "llm-coached",
      "model": "google/gemini-2.5-pro"
    }
  }
}
```

Wenn Rosetta das Paar `en:crk` synchronisiert, werden die Übersetzungen zunächst in SRO erstellt und dann automatisch in Syllabics konvertiert, bevor sie in `crk.json` geschrieben werden.

### Konverter-Status überprüfen

```bash
npx i18n-rosetta status
```

Die Statusausgabe zeigt, welche Paare aktive Schrift-Konverter haben und welche Konvertierung sie durchführen.

## Anforderungen an Web-Schriftarten

Drei Konverter geben Unicode Private Use Area (PUA)-Zeichen aus, die benutzerdefinierte Web-Schriftarten erfordern:

### Klingonisch (pIqaD)

Installieren Sie eine CSUR-kompatible pIqaD-Schriftart (z. B. „pIqaD qolqoS“ oder „Klingon pIqaD HaSta“):

```css
@font-face {
  font-family: 'pIqaD';
  src: url('/fonts/pIqaD.woff2') format('woff2');
  unicode-range: U+F8D0-F8FF;
}

:lang(tlh) {
  font-family: 'pIqaD', sans-serif;
}
```

### Tengwar (Sindarin)

Installieren Sie eine CSUR-kompatible Tengwar-Schriftart (z. B. „Tengwar Formal CSUR“, „Tengwar Annatar“):

```css
@font-face {
  font-family: 'Tengwar';
  src: url('/fonts/tengwar-formal-csur.woff2') format('woff2');
  unicode-range: U+E000-E07F;
}

:lang(x-elvish-s) {
  font-family: 'Tengwar', serif;
}
```

### Kryptonisch

Installieren Sie eine kryptonische Schriftart, die auf die PUA-Codepoints U+E100–E119 gemappt ist:

```css
@font-face {
  font-family: 'Kryptonian';
  src: url('/fonts/kryptonian.woff2') format('woff2');
  unicode-range: U+E100-E119;
}

:lang(x-kryptonian) {
  font-family: 'Kryptonian', sans-serif;
}
```

:::tip Alternativer Ansatz für Kryptonisch
Da Kryptonisch eine reine A-Z-Chiffre ist, können Sie den Schrift-Konverter komplett überspringen und die Schriftart über CSS auf lateinischen Text anwenden. Dies ist für Web-Deployments oft einfacher — stellen Sie einfach die kryptonische Schriftart bereit und setzen Sie `font-family` auf den entsprechenden Elementen.
:::

## Hinzufügen eines benutzerdefinierten Konverters

Um einen Konverter für eine neue Sprache hinzuzufügen, bearbeiten Sie `lib/scripts.js`:

1. **Erstellen Sie die Konvertierungs-Map** — ein geordnetes Array von `[from, to]`-Paaren, längste Sequenzen zuerst
2. **Erstellen Sie die Konverter-Funktion** — einen Greedy-Scanner von links nach rechts (verwenden Sie `sroToSyllabics` als Vorlage)
3. **Registrieren Sie ihn** im `SCRIPT_CONVERTERS`-Objekt mit dem Locale-Code als Schlüssel
4. **Fügen Sie das Feld `script`** zum Registereintrag der Sprache in `registers.js` hinzu

```javascript
// Example: adding a converter for Cherokee (chr)
const LATIN_TO_CHEROKEE_MAP = [
  ['ga', 'Ꭶ'], ['ka', 'Ꭷ'], ['ge', 'Ꭸ'], // ...
];

function latinToCherokee(text) {
  // Same greedy left-to-right pattern as other converters
}

SCRIPT_CONVERTERS['chr'] = {
  from: 'Latin',
  to: 'Cherokee Syllabary',
  type: 'deterministic',
  converter: latinToCherokee,
};
```

## Siehe auch

- [Ressourcenarme Sprachen](/docs/guides/low-resource-languages) — vollständiger Pipeline-Walkthrough einschließlich Schrift-Konvertierung
- [Coaching-Daten](/docs/concepts/coaching-data) — wie Sie dem LLM Ihre Sprache vor der Konvertierung beibringen
- [Quality Gate](/docs/concepts/quality-gate) — die `script compliance`-Prüfung, die das Ausgabe-Schriftsystem validiert