---
sidebar_position: 3
title: "Kunstsprachen, Schriftsysteme & Orthografie"
---
# Konstruierte Sprachen, Schriften & Orthografie

rosetta bietet erstklassige Unterstützung für konstruierte Sprachen (Conlangs) über LLM-Register und deterministische Schriftkonverter. Dieser Leitfaden behandelt, wie die Unterstützung für konstruierte Sprachen funktioniert, welche Schriftarten Sie benötigen und wie Sie Ihre eigenen hinzufügen können.

:::tip Warum konstruierte Sprachen wichtig sind
Konstruierte Sprachen sind nicht nur eine Spielerei – sie nutzen exakt dieselbe Infrastruktur, die auch für reale, unterrepräsentierte Sprachen verwendet wird. Die Qualitätsprüfung, das Coaching-System und die Verarbeitungskette zur Schriftkonvertierung funktionieren für Klingonisch und Plains Cree identisch. Wenn Ihre Verarbeitungskette für konstruierte Sprachen funktioniert, wird auch Ihre Verarbeitungskette für ressourcenarme Sprachen funktionieren.
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

Codes für konstruierte Sprachen verwenden das Präfix `x-` gemäß der BCP-47-Konvention für den privaten Gebrauch, mit Ausnahme von Klingonisch (`tlh`), dem von SIL International ein [ISO 639-3](https://iso639-3.sil.org/code/tlh)-Code zugewiesen wurde.

---

## Unicode, PUA und Anforderungen an Schriftarten

### Der Private Use Area (PUA)

Klingonisch (pIqaD), Sindarin (Tengwar) und Kryptonisch verwenden Zeichen aus dem **Private Use Area (PUA)** von Unicode. Der PUA umfasst den Bereich U+E000–U+F8FF – diese Codepoints haben **keine standardmäßige Zuweisung**. Die [ConScript Unicode Registry (CSUR)](https://www.evertype.com/standards/csur/) pflegt von der Community vereinbarte Zuordnungen für fiktive Schriften, diese sind jedoch nicht Teil des Unicode-Standards.

Was dies in der Praxis bedeutet:

- PUA-Text wird als **leere Kästchen** (□□□) dargestellt, wenn die richtige Schriftart nicht geladen ist
- Verschiedene Schriftarten können denselben PUA-Codepoints unterschiedliche Glyphen zuordnen
- rosetta bündelt KEINE PUA-Schriftarten – Sie müssen diese selbst laden
- Systemschriftarten werden diese Zeichen niemals darstellen

### PUA-Bereiche nach Schrift

| Schrift | PUA-Bereich | CSUR-Referenz |
|--------|-----------|---------------|
| Klingonisch (pIqaD) | U+F8D0–U+F8FF | [CSUR Klingonisch](https://www.evertype.com/standards/csur/klingon.html) |
| Tengwar (Elbisch) | U+E000–U+E07F | [CSUR Tengwar](https://www.evertype.com/standards/csur/tengwar.html) |
| Kryptonisch | Variiert je nach Schriftart | Kein CSUR-Standard |

### Laden von PUA-Web-Schriftarten

rosetta enthält einen integrierten Befehl zum Herunterladen und Verwalten von PUA-Web-Schriftarten:

```bash
# See which fonts are needed for your configured languages
i18n-rosetta fonts list

# Download all needed fonts (auto-detects project type for output directory)
i18n-rosetta fonts install

# Also generate a CSS snippet with @font-face declarations
i18n-rosetta fonts install --css
```

Der Befehl `fonts install` lädt aus verifizierten Open-Source-Repositorys herunter:

| Schriftart | Schrift | Lizenz | Quelle |
|------|--------|---------|--------|
| pIqaD qolqoS | Klingonisch | SIL Open Font License 1.1 | [GitHub](https://github.com/dadap/pIqaD-fonts) |
| FreeMonoTengwar | Tengwar | GNU GPL v3 (mit Schriftart-Ausnahme) | [SourceForge](https://sourceforge.net/projects/freetengwar/) |
| *(vom Benutzer bereitgestellt)* | Kryptonisch | Variiert | Keine Open-Source-PUA-Schriftart verfügbar |

Das Ausgabeverzeichnis wird automatisch anhand Ihrer Projektstruktur erkannt (Docusaurus → `static/fonts/`, Hugo → `static/fonts/`, Standard → `public/fonts/`). Überschreiben Sie dies mit `--dir`.

Wenn Sie es vorziehen, Schriftarten manuell zu verwalten, fügen Sie `@font-face`-Regeln in Ihr CSS ein:

```css
@font-face {
  font-family: 'pIqaD';
  src: url('/fonts/pIqaDqolqoS.ttf') format('truetype');
  font-display: swap;
  unicode-range: U+F8D0-F8FF;
}

/* Apply to Klingon text elements */
[lang="tlh"], [data-script="piqad"] {
  font-family: 'pIqaD', sans-serif;
}
```

:::warning Unicode-Unterstützung ist NICHT garantiert
Das Unicode-Konsortium hat es [ausdrücklich abgelehnt](https://www.unicode.org/faq/private_use.html), fiktive Schriften in den Standard aufzunehmen. PUA-Zuweisungen werden von der Community gepflegt und können zwischen verschiedenen Schriftart-Implementierungen in Konflikt geraten. Geben Sie immer die genaue Schriftart an, die Ihr Projekt verwendet, und testen Sie die Darstellung in verschiedenen Browsern.
:::

---

## Schriftkonverter

### Wie sie funktionieren

Die Schriftkonvertierung von rosetta ist ein **Post-Translation-Hook**:

1. Das LLM übersetzt den Text in eine **Arbeitsschrift** (normalerweise Lateinisch oder SRO)
2. Die [Qualitätsprüfung](/docs/concepts/quality-gate) validiert die Ausgabe
3. Der deterministische Konverter wandelt den validierten Text in die **Anzeigeschrift** um
4. Der konvertierte Text wird auf die Festplatte geschrieben

Dieser zweistufige Ansatz funktioniert, da LLMs bessere Ergebnisse liefern, wenn sie in lateinbasierten Schriften arbeiten. Der deterministische Konverter garantiert eine korrekte Schriftausgabe, ohne sich auf das (oft unzuverlässige) Schriftwissen des Modells zu verlassen.

### Alle fünf Konverter

rosetta wird mit fünf integrierten Schriftkonvertern ausgeliefert:

#### Plains Cree: SRO → Silbenschrift (`crk`)

Standard Roman Orthography (SRO) in die Silbenschrift der kanadischen Ureinwohner (Canadian Aboriginal Syllabics).

```
Input:  "tawâw"
Output: "ᑕᐚᐤ"
```

Lange Vokale verwenden Makron/Zirkumflex: ê, î, ô, â. Der Konverter verarbeitet alle diakritischen Zeichen der SRO und ordnet sie den korrekten Silbenzeichen zu. Siehe [Unterstützung einer ressourcenarmen Sprache](https://mtevalarena.org/docs/community/low-resource-languages) für die vollständige Cree-Verarbeitungskette.

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

Kryptonische Schriftzuordnung basierend auf dem Fan-Lexikon.

```
Input:  "Kal-El"
Output: [Kryptonian PUA] (requires Kryptonian font to render)
```

### Auslösen eines Konverters

Setzen Sie das Feld `scripts` in Ihrer Sprachkonfiguration. Bei integrierten Konvertern wird dies automatisch anhand des Sprachcodes erkannt:

```json
{
  "languages": {
    "sr": { "scripts": "sr" },
    "crk": {}
  }
}
```

Plains Cree (`crk`) wird automatisch erkannt – Sie müssen `scripts` nicht explizit setzen.

---

## Mehrschriftige Sprachen

Einige reale Sprachen verwenden mehrere aktive Schriften:

| Sprache | Schriften | rosetta-Ansatz |
|----------|---------|-----------------|
| Serbisch | Lateinisch + Kyrillisch | Schriftkonverter (`sr`) – auf Lateinisch übersetzen, in Kyrillisch konvertieren |
| Chinesisch | Vereinfacht + Traditionell | Separate Gebietsschema-Codes (`zh` vs. `zh-TW`) mit unterschiedlichen Registern |

Für Sprachen, bei denen beide Schriften dieselbe Zielgruppe bedienen (Serbisch), verwenden Sie einen Schriftkonverter. Für Sprachen, bei denen die Schriften unterschiedliche Zielgruppen bedienen (Vereinfachtes Chinesisch für Festlandchina, Traditionelles Chinesisch für Taiwan/HK), verwenden Sie separate Gebietsschema-Codes.

---

## Hinweise zur Orthografie

Register bestimmen nicht nur den Tonfall – sie enthalten **orthografische Anweisungen**, die das LLM zu korrekten Schreibkonventionen lenken.

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

### Geschlechtergerechte Schreibweise

Jede Sprachkarte verfügt über ein Feld `gender.inclusiveGuidance` mit sprachspezifischen Hinweisen. Dieses wird getrennt von der Register-Voreinstellung in den LLM-Übersetzungs-Prompt eingefügt, sodass es konsistent angewendet wird, unabhängig davon, welche Formalitäts-Voreinstellung der Benutzer wählt:

- **Französisch**: Écriture inclusive mit Mediopunkt-Schreibweise (z. B. „Connecté·e“)
- **Deutsch**: Doppelpunkt-Schreibweise (z. B. „Benutzer:innen“)
- **Spanisch**: Geschlechtsneutrale Umstrukturierung bevorzugt; Schrägstrich-Schreibweise (z. B. „usuario/a“) als Ausweichlösung

Für Sprachen ohne spezifische Vorgaben in ihrer Karte (z. B. Koreanisch, konstruierte Sprachen) greift das System auf eine allgemeine Regel zurück: *"Bevorzugen Sie geschlechtsneutrale Formen oder die inklusivste verfügbare Option."*

### Anforderungen an RTL-Schriften (Rechts-nach-links)

Die Register für Arabisch, Hebräisch, Persisch und Urdu weisen alle auf Rechts-nach-links-Anforderungen hin: `Ensure text reads naturally in RTL layout contexts.`

### Überschreiben eines beliebigen Registers

Jedes Register ist ein Konfigurationswert – überschreiben Sie ihn, um ihn an die Tonalität Ihres Projekts anzupassen:

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

### Schritt-für-Schritt-Anleitung

1. **Wählen Sie einen BCP-47-Code für den privaten Gebrauch**: Verwenden Sie das Präfix `x-` (z. B. `x-dothraki`, `x-valyrian`).

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

5. **Überprüfen Sie die Qualitätsprüfung**: Die [Qualitätsprüfung](/docs/concepts/quality-gate) muss möglicherweise für Ihre konstruierte Sprache angepasst werden – insbesondere die Prüfung `requireNonLatin`, wenn Ihre konstruierte Sprache PUA-Zeichen verwendet.

:::note Die Qualität konstruierter Sprachen hängt vom LLM-Wissen ab
Das LLM kann nur in eine konstruierte Sprache übersetzen, die es in seinen Trainingsdaten gesehen hat. Gut dokumentierte konstruierte Sprachen (Klingonisch, Sindarin, Dothraki) funktionieren gut. Unbekannte oder neu erfundene konstruierte Sprachen können zu inkonsistenten Ergebnissen führen. Verwenden Sie [Coaching-Daten](/docs/concepts/coaching-data), um die Qualität zu verbessern.
:::

---

## Siehe auch

- [Unterstützte Sprachen](/docs/reference/supported-languages) – vollständige Sprachtabelle mit Verfügbarkeit der Methoden
- [Schriftkonverter](/docs/concepts/script-converters) – technische Details der Konvertierungs-Verarbeitungskette
- [Übersetzungsmethoden](/docs/guides/translation-methods) – wie jede Übersetzungsmethode funktioniert
- [Konfiguration](/docs/getting-started/configuration) – Konfigurationsreferenz einschließlich Sprach- und Registereinrichtung
- [Unterstützung einer ressourcenarmen Sprache](https://mtevalarena.org/docs/community/low-resource-languages) – dieselbe Infrastruktur angewendet auf reale, unterrepräsentierte Sprachen