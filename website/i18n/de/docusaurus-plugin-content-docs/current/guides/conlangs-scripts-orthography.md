---
sidebar_position: 3
title: "Kunstsprachen, Schriftsysteme & Orthografie"
---
# Konstruierte Sprachen, Schriften & Orthografie

rosetta bietet erstklassige Unterstützung für konstruierte Sprachen über LLM-Register und deterministische Schriftkonverter. Dieser Leitfaden behandelt, wie die Unterstützung für konstruierte Sprachen funktioniert, welche Schriftarten Sie benötigen und wie Sie Ihre eigenen hinzufügen können.

:::tip Warum konstruierte Sprachen wichtig sind
Konstruierte Sprachen sind nicht nur eine Spielerei — sie nutzen exakt dieselbe Infrastruktur, die auch für echte, unterrepräsentierte Sprachen verwendet wird. Das Quality Gate, das Coaching-System und die Pipeline zur Schriftkonvertierung funktionieren für Klingonisch und Plains Cree identisch. Wenn Ihre Pipeline für konstruierte Sprachen funktioniert, wird auch Ihre Pipeline für ressourcenarme Sprachen funktionieren.
:::

---

## Unterstützte konstruierte Sprachen

| Sprache | Code | Schriftkonverter | Benötigte Schriftart |
|----------|------|:----------------:|:-------------:|
| Klingonisch | `tlh` | ✅ Romanisierung → pIqaD | PUA-Schriftart (z. B. pIqaD qolqoS) |
| Sindarin (Tolkiens Elbisch) | `x-elvish-s` | ✅ Lateinisch → Tengwar | CSUR-PUA-Schriftart |
| Kryptonisch | `x-kryptonian` | ✅ Lateinisch → Kryptonisch | PUA-Schriftart |
| Piraten-Englisch | `x-pirate` | ❌ nur Register | Keine |
| Shakespeare-Englisch | `x-shakespeare` | ❌ nur Register | Keine |
| Yoda-Sprache | `x-yoda` | ❌ nur Register | Keine |

Codes für konstruierte Sprachen verwenden das Präfix `x-` gemäß der BCP-47-Konvention für die private Nutzung, mit Ausnahme von Klingonisch (`tlh`), dem von SIL International ein [ISO 639-3](https://iso639-3.sil.org/code/tlh)-Code zugewiesen wurde.

---

## Unicode, PUA und Schriftartanforderungen

### Die Private Use Area (PUA)

Klingonisch (pIqaD), Sindarin (Tengwar) und Kryptonisch verwenden Zeichen aus der Unicode **Private Use Area (PUA)**. Die PUA umfasst den Bereich U+E000–U+F8FF — diese Codepoints haben **keine Standardzuweisung**. Die [ConScript Unicode Registry (CSUR)](https://www.evertype.com/standards/csur/) pflegt von der Community vereinbarte Zuordnungen für fiktive Schriften, diese sind jedoch nicht Teil des Unicode-Standards.

Was dies in der Praxis bedeutet:

- PUA-Text wird als **leere Kästchen** (□□□) gerendert, wenn nicht die korrekte Schriftart geladen ist
- Verschiedene Schriftarten können denselben PUA-Codepoints unterschiedliche Glyphen zuordnen
- rosetta bündelt KEINE PUA-Schriftarten — Sie müssen diese selbst laden
- Systemschriftarten werden diese Zeichen niemals rendern

### PUA-Bereiche nach Schrift

| Schrift | PUA-Bereich | CSUR-Referenz |
|--------|-----------|---------------|
| Klingonisch (pIqaD) | U+F8D0–U+F8FF | [CSUR Klingonisch](https://www.evertype.com/standards/csur/klingon.html) |
| Tengwar (Elbisch) | U+E000–U+E07F | [CSUR Tengwar](https://www.evertype.com/standards/csur/tengwar.html) |
| Kryptonisch | Variiert je nach Schriftart | Kein CSUR-Standard |

### Laden von PUA-Web-Schriftarten

Um PUA-basierten Text konstruierter Sprachen in Ihrer Webanwendung anzuzeigen, laden Sie die entsprechende Schriftart über CSS:

```css
/* Load a Klingon PUA font */
@font-face {
  font-family: 'pIqaD';
  src: url('/fonts/piqad.woff2') format('woff2');
  unicode-range: U+F8D0-U+F8FF;
}

/* Apply to Klingon text elements */
[lang="tlh"] {
  font-family: 'pIqaD', sans-serif;
}
```

:::warning Unicode-Unterstützung ist NICHT garantiert
Das Unicode-Konsortium hat es [ausdrücklich abgelehnt](https://www.unicode.org/faq/private_use.html), fiktive Schriften in den Standard aufzunehmen. PUA-Zuweisungen werden von der Community gepflegt und können zwischen verschiedenen Schriftart-Implementierungen in Konflikt stehen. Geben Sie immer die genaue Schriftart an, die Ihr Projekt verwendet, und testen Sie das Rendering in verschiedenen Browsern.
:::

---

## Schriftkonverter

### Wie sie funktionieren

Die Schriftkonvertierung von rosetta ist ein **Post-Translation-Hook**:

1. Das LLM übersetzt den Text in eine **Arbeitsschrift** (normalerweise Lateinisch oder SRO)
2. Das [Quality Gate](/docs/concepts/quality-gate) validiert die Ausgabe
3. Der deterministische Konverter wandelt den validierten Text in die **Anzeigeschrift** um
4. Der konvertierte Text wird auf die Festplatte geschrieben

Dieser zweistufige Ansatz funktioniert, da LLMs bessere Ergebnisse liefern, wenn sie in lateinbasierten Schriften arbeiten. Der deterministische Konverter garantiert eine korrekte Schriftausgabe, ohne sich auf das (oft unzuverlässige) Schriftwissen des Modells zu verlassen.

### Alle fünf Konverter

rosetta wird mit fünf integrierten Schriftkonvertern ausgeliefert:

#### Plains Cree: SRO → Silbenschrift (`crk`)

Standard Roman Orthography zu kanadischen indigenen Silbenschriften.

```
Input:  "tawâw"
Output: "ᑕᐚᐤ"
```

Lange Vokale verwenden Makron/Zirkumflex: ê, î, ô, â. Der Konverter verarbeitet alle SRO-Diakritika und ordnet sie den korrekten Silbenzeichen zu. Siehe [Unterstützung einer ressourcenarmen Sprache](https://mtevalarena.org/docs/community/low-resource-languages) für die vollständige Cree-Pipeline.

#### Serbisch: Lateinisch → Kyrillisch (`sr`)

Deterministische Konvertierung von Lateinisch zu Kyrillisch für Serbisch.

```
Input:  "zdravo"
Output: "здраво"
```

Dies verarbeitet die vollständige Zuordnung des serbischen Alphabets einschließlich Digraphen (lj → љ, nj → њ, dž → џ).

#### Klingonisch: Romanisierung → pIqaD (`tlh`)

Marc Okrands Romanisierungssystem zu pIqaD-PUA-Zeichen.

```
Input:  "Qapla'"    (romanized Klingon)
Output: [pIqaD PUA] (requires pIqaD font to render)
```

#### Sindarin: Lateinisch → Tengwar (`x-elvish-s`)

Tolkiens Tengwar-Zuordnung im Sindarin-Modus.

```
Input:  "elen síla"  (Latin Sindarin)
Output: [Tengwar PUA] (requires Tengwar font to render)
```

#### Kryptonisch: Lateinisch → Kryptonisch (`x-kryptonian`)

Kryptonische Schriftzuordnung aus dem Fan-Lexikon.

```
Input:  "Kal-El"
Output: [Kryptonian PUA] (requires Kryptonian font to render)
```

### Auslösen eines Konverters

Legen Sie das Feld `scripts` in Ihrer Sprachkonfiguration fest. Bei integrierten Konvertern wird dies automatisch anhand des Sprachcodes erkannt:

```json
{
  "languages": {
    "sr": { "scripts": "sr" },
    "crk": {}
  }
}
```

Plains Cree (`crk`) wird automatisch erkannt — Sie müssen `scripts` nicht explizit festlegen.

---

## Sprachen mit mehreren Schriften

Einige echte Sprachen verwenden mehrere aktive Schriften:

| Sprache | Schriften | rosetta-Ansatz |
|----------|---------|-----------------|
| Serbisch | Lateinisch + Kyrillisch | Schriftkonverter (`sr`) — auf Lateinisch übersetzen, in Kyrillisch konvertieren |
| Chinesisch | Vereinfacht + Traditionell | Separate Gebietsschema-Codes (`zh` vs. `zh-TW`) mit unterschiedlichen Registern |

Für Sprachen, bei denen beide Schriften dieselbe Zielgruppe bedienen (Serbisch), verwenden Sie einen Schriftkonverter. Für Sprachen, bei denen die Schriften unterschiedliche Zielgruppen bedienen (Vereinfachtes Chinesisch für Festlandchina, Traditionelles Chinesisch für Taiwan/HK), verwenden Sie separate Gebietsschema-Codes.

---

## Hinweise zur Orthografie

Register bestimmen nicht nur den Ton — sie enthalten **orthografische Anweisungen**, die das LLM zu korrekten Schreibkonventionen lenken.

### Formelle Anredeformen

Die integrierten Register von rosetta enthalten die kulturell angemessene formelle Anrede für jede Sprache:

| Sprache | Formelle Form | Registeranweisung |
|----------|------------|---------------------|
| Deutsch | Sie | `Use Sie-form for formal address` |
| Französisch | vous | `Use vous-form` |
| Russisch | вы | `Professional register with вы-form` |
| Türkisch | siz | `Professional register with siz-form` |
| Koreanisch | 합쇼체 | `Formal Korean (합쇼체)` |
| Japanisch | です/ます | `Polite professional register (です/ます form)` |
| Polnisch | Pan/Pani | `Professional register with Pan/Pani form` |

### Geschlechterinklusive Schreibweise

Jede Sprachkarte verfügt über ein Feld `gender.inclusiveGuidance` mit sprachspezifischen Hinweisen. Dies wird unabhängig von der Registervoreinstellung in den LLM-Übersetzungs-Prompt eingefügt, sodass es konsistent angewendet wird, unabhängig davon, welche Formalitätsvoreinstellung der Benutzer wählt:

- **Französisch**: Écriture inclusive mit Mediopunkt-Schreibweise (z. B. „Connecté·e“)
- **Deutsch**: Doppelpunkt-Schreibweise (z. B. „Benutzer:innen“)
- **Spanisch**: Geschlechtsneutrale Umstrukturierung bevorzugt; Schrägstrich-Schreibweise (z. B. „usuario/a“) als Ausweichlösung

Für Sprachen ohne spezifische Anweisungen in ihrer Karte (z. B. Koreanisch, konstruierte Sprachen) greift das System auf eine allgemeine Regel zurück: *"Bevorzugen Sie geschlechtsneutrale Formen oder die inklusivste verfügbare Option."*

### Anforderungen an RTL-Schriften

Die Register für Arabisch, Hebräisch, Persisch und Urdu weisen alle auf die Rechts-nach-links-Anforderungen hin: `Ensure text reads naturally in RTL layout contexts.`

### Überschreiben eines beliebigen Registers

Jedes Register ist ein Konfigurationswert — überschreiben Sie ihn, um ihn an die Tonalität Ihres Projekts anzupassen:

```json
{
  "languages": {
    "fr": {
      "register": "Casual French. Use tu-form. Conversational blog tone. Gender-neutral when possible."
    },
    "de": {
      "register": "Informal German. Use du-form. Tech startup voice."
    }
  }
}
```

Siehe [Konfiguration](/docs/getting-started/configuration) für die vollständige Konfigurationsreferenz.

---

## Hinzufügen einer neuen konstruierten Sprache

### Schritt-für-Schritt

1. **Wählen Sie einen BCP-47-Code für die private Nutzung**: Verwenden Sie das Präfix `x-` (z. B. `x-dothraki`, `x-valyrian`).

2. **Fügen Sie ihn zu Ihrer Konfiguration hinzu**:

```json
{
  "languages": {
    "x-dothraki": {
      "register": "Dothraki language. Use David J. Peterson's vocabulary from the Living Language Dothraki textbook. Harsh, direct tone. No articles, no verb 'to be'."
    }
  }
}
```

3. **(Optional) Fügen Sie einen Schriftkonverter hinzu**: Wenn Ihre konstruierte Sprache eine nicht-lateinische Anzeigeschrift verwendet, fügen Sie einen Konverter in `lib/scripts.js` hinzu und registrieren Sie ihn in `SCRIPT_CONVERTERS`.

4. **Testen**: Führen Sie `i18n-rosetta sync --dry` aus, um eine Vorschau der Übersetzungen anzuzeigen, ohne Dateien zu schreiben.

5. **Überprüfen Sie das Quality Gate**: Das [Quality Gate](/docs/concepts/quality-gate) muss möglicherweise für Ihre konstruierte Sprache angepasst werden — insbesondere die Prüfung `requireNonLatin`, falls Ihre konstruierte Sprache PUA-Zeichen verwendet.

:::note Die Qualität konstruierter Sprachen hängt vom LLM-Wissen ab
Das LLM kann nur in eine konstruierte Sprache übersetzen, die es in den Trainingsdaten gesehen hat. Gut dokumentierte konstruierte Sprachen (Klingonisch, Sindarin, Dothraki) funktionieren gut. Unbekannte oder neu erfundene konstruierte Sprachen können zu inkonsistenten Ergebnissen führen. Verwenden Sie [Coaching-Daten](/docs/concepts/coaching-data), um die Qualität zu verbessern.
:::

---

## Siehe auch

- [Unterstützte Sprachen](/docs/reference/supported-languages) — vollständige Sprachtabelle mit Methodenverfügbarkeit
- [Schriftkonverter](/docs/concepts/script-converters) — technische Details der Konvertierungs-Pipeline
- [Übersetzungsmethoden](/docs/guides/translation-methods) — wie jede Übersetzungsmethode funktioniert
- [Konfiguration](/docs/getting-started/configuration) — Konfigurationsreferenz einschließlich Sprach- und Registereinrichtung
- [Unterstützung einer ressourcenarmen Sprache](https://mtevalarena.org/docs/community/low-resource-languages) — dieselbe Infrastruktur angewendet auf echte, unterrepräsentierte Sprachen