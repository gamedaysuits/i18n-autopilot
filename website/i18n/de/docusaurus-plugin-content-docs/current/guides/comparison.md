---
sidebar_position: 7
title: "Vergleich"
---
# Wie Rosetta im Vergleich abschneidet

i18n-rosetta gehört einer anderen Kategorie an als die meisten Lokalisierungswerkzeuge. Hier finden Sie einen ehrlichen Vergleich.

## Das Marktumfeld

Die meisten Lokalisierungswerkzeuge fallen in eine von drei Kategorien:

| Kategorie | Beispiele | Modell |
|----------|----------|-------|
| **Cloud-TMS-Plattformen** | Crowdin, Phrase, Locize, Tolgee | SaaS-Dashboard + menschliche Übersetzer + monatliches Abonnement |
| **Schlüssel-Extraktionswerkzeuge** | i18next-scanner, FormatJS CLI | Durchsuchen des Quellcodes nach Aufrufen von Übersetzungsfunktionen |
| **CLI-Übersetzungs-Engines** | **i18n-rosetta** | Ausführung in Ihrem Projekt, direkte Übersetzung von Dateien, kein Cloud-Konto |

Rosetta ist eine **CLI-Übersetzungs-Engine** — sie übersetzt Ihre Sprachdateien direkt unter Verwendung konfigurierbarer Backends (LLMs, Google Translate, benutzerdefinierte Plugins). Kein Cloud-Dashboard, kein Workflow für menschliche Übersetzer, keine monatlichen Gebühren.

---

## Funktionsvergleich

| Funktion | i18n-rosetta | Crowdin | Phrase | Locize |
|---------|:------------:|:-------:|:------:|:------:|
| **Lokale Ausführung (kein Cloud-Konto)** | ✅ | ❌ | ❌ | ❌ |
| **Keine Abhängigkeiten** | ✅ | ❌ | ❌ | ❌ |
| **Methodenkonfiguration pro Sprachpaar** | ✅ | ❌ | ❌ | ❌ |
| **Benutzerdefinierte Sprachregister** | ✅ | ❌ | ❌ | ❌ |
| **Inhaltsbezogen (schützt Codeblöcke)** | ✅ | ❌ | ❌ | ❌ |
| **Konstruierte Sprachen & Schriftkonvertierung** | ✅ | ❌ | ❌ | ❌ |
| **Plugin-Architektur** | ✅ | ❌ | ❌ | ❌ |
| **Markdown- / Inhaltsübersetzung** | ✅ | ✅ | ✅ | ❌ |
| **Translation Memory** | ✅ | ✅ | ✅ | ✅ |
| **XLIFF-Export/-Import** | ✅ | ✅ | ✅ | ❌ |
| **ICU-Plural-Validierung** | ✅ | ✅ | ✅ | ❌ |
| **Terminologie-Durchsetzung** | ✅ | ✅ | ✅ | ❌ |
| **Workflow für menschliche Übersetzer** | XLIFF-basiert | ✅ | ✅ | ✅ |
| **In-Kontext-Bearbeitung (visuell)** | ❌ | ✅ | ✅ | ✅ |
| **Team-Zusammenarbeit** | ❌ | ✅ | ✅ | ✅ |
| **Unterstützte Dateiformate** | JSON, TOML, YAML, MD, XLIFF | 50+ | 40+ | JSON |
| **Preisgestaltung** | Kostenlos (Sie zahlen für Ihr LLM) | Ab $0/Monat | Ab $0/Monat | Ab $0/Monat |

---

## Wann Sie Rosetta verwenden sollten

**Rosetta ist eine gute Wahl, wenn:**

- Sie maschinelle Übersetzung fest in Ihre Build-Pipeline integrieren möchten — nicht als separaten Workflow
- Sie eine Methodenkontrolle pro Sprache benötigen (LLM für einige, Google Translate für andere, benutzerdefinierte Plugins für den Rest)
- Sie in Sprachen ohne API-Abdeckung übersetzen (indigene, bedrohte, konstruierte Sprachen)
- Sie eine deterministische Schriftausgabe wünschen (Cree-Silbenschrift, Klingonisch pIqaD, Tengwar)
- Sie keinerlei Anbieterbindung und keine Cloud-Abhängigkeiten wünschen
- Sie ein Einzelentwickler oder ein kleines Team sind, das kein vollständiges TMS-Dashboard benötigt
- Sie eine XLIFF-basierte Übergabe an professionelle Übersetzer ohne Cloud-Abonnement wünschen

**Ein Cloud-TMS ist die bessere Wahl, wenn:**

- Sie professionelle menschliche Übersetzer haben, die jede Zeichenfolge überprüfen (der XLIFF-Workflow von rosetta ist einfacher als ein vollständiges TMS)
- Sie projektübergreifendes Translation Memory und Glossar-Management benötigen
- Sie eine visuelle In-Kontext-Bearbeitung benötigen (Vorschau von Übersetzungen innerhalb Ihrer Benutzeroberfläche)
- Sie ein großes Team mit Bedarf an rollenbasierter Zugriffskontrolle haben
- Sie Unterstützung für über 50 Dateiformate benötigen

---

## Was Rosetta leistet, was sonst niemand bietet

### 1. Benutzerdefinierte Register

Jedes Sprachpaar erhält kulturell angemessene Tonfall-Anweisungen für das LLM:

```json
{
  "de": {
    "register": "Standard professional register. Use Sie-form for formal address."
  },
  "tl": {
    "register": "Educated Manila Taglish. Use Tagalog as the primary language but keep technical terms in English."
  },
  "tlh": {
    "register": "Warrior's honor. OVS grammar. Use Marc Okrand vocabulary."
  }
}
```

Kein anderes Werkzeug wird mit 47 vorkonfigurierten Sprachregistern ausgeliefert oder lässt Sie projektbezogen benutzerdefinierte Register definieren.

### 2. Deterministische Schriftkonverter

Rosetta bietet fünf integrierte Schriftkonverter, die als Post-Translation-Hooks ausgeführt werden — es wird kein LLM benötigt:

| Gebietsschema | Konvertierung | Beispiel |
|--------|-----------|---------|
| `crk` | SRO → Cree-Silbenschrift | `nêhiyawêwin` → `ᓀᐦᐃᔭᐍᐏᐣ` |
| `sr` | Lateinisch → Kyrillisch | `Beograd` → `Београд` |
| `tlh` | Romanisierung → pIqaD | `tlhIngan Hol` → (pIqaD-Glyphen) |
| `x-elvish-s` | Lateinisch → Tengwar | Sindarin → Tengwar (Modus von Beleriand) |
| `x-kryptonian` | Lateinisch → Kryptonisch | Chiffren-Substitution (erfordert Schriftart) |

Dies sind reine Konverter auf Basis von Nachschlagetabellen — deterministisch, überprüfbar, ohne Risiko von LLM-Halluzinationen.

### 3. Inhaltsbezogene Abschirmung

Bei der Übersetzung von Markdown oder Rich-Content schirmt Rosetta Folgendes ab:

- Eingefasste Codeblöcke (` ``` `)
- Inline-Code (`` ` ` ``)
- Hugo-Shortcodes (`{{</* */>}}`, `{{%/* */%}}`)
- Interpolationsvariablen (`{{ .Count }}`, `{name}`, `{{t('key')}}`)
- Reine HTML-Blöcke

Diese werden vor der Übersetzung durch Unicode-Sentinel-Token ersetzt und danach wiederhergestellt. Das LLM sieht niemals Ihren Code, Ihre Shortcodes oder Ihre Variablen.

### 4. Gecoachte Methoden-Plugins

Für Sprachen ohne API-Abdeckung können Sie eine gecoachte Übersetzungsmethode erstellen:

1. Verfassen Sie linguistische Coaching-Daten (Grammatikregeln, Vokabular, Beispiele)
2. Bündeln Sie diese als Plugin
3. Vergleichen Sie es mit Referenzübersetzungen mithilfe des [Eval-Harness](https://github.com/gamedaysuits/gds-mt-eval-harness)
4. Installieren Sie es in Ihrem Projekt mit `i18n-rosetta plugin install`

Auf diese Weise verarbeitet rosetta Plains Cree — und so können Sie jede beliebige Sprache verarbeiten, einschließlich solcher, die noch gar nicht existieren.

---

## Fazit

Rosetta ist kein Ersatz für Crowdin. Es ist ein anderes Werkzeug für einen anderen Workflow. Wenn Sie menschliche Übersetzer benötigen, verwenden Sie ein TMS. Wenn Sie eine CLI benötigen, die Ihre Dateien mit einem einzigen Befehl übersetzt und Ihnen pro Sprache die Kontrolle über Methoden, Modelle und Register gibt — verwenden Sie rosetta.