---
sidebar_position: 4
title: "Unterstützte Sprachen"
---
# Unterstützte Sprachen

rosetta wird mit **Language Cards** ausgeliefert — strukturierten Konfigurationsdateien für 50 Sprachen. Jede Karte enthält Register-Voreinstellungen, Metadaten zum Höflichkeitssystem, Flags zur Methodenunterstützung, Typografieregeln und Schriftinformationen. Jede Sprache, die Ihr LLM kennt, kann mit einer einzigen Konfigurationszeile hinzugefügt werden — dies sind diejenigen mit kuratierten, produktionsbereiten Registern.

---

## Übersetzungsmethoden

Jede Sprache kann eine oder mehrere dieser Übersetzungsmethoden verwenden:

| Symbol | Methode | Funktionsweise | Kosten |
|------|--------|-------------|------|
| 🟢 | **Google Translate** | Neuronale MT-Basis. Über 130 Sprachen. Nur Schlüssel-Wert-Zeichenfolgen — kann Markdown-Inhalte nicht sicher übersetzen. | ~$20/1 Mio. Zeichen |
| 🔵 | **LLM (OpenRouter)** | Jede Sprache, die das Modell kennt. Registergesteuerte Prompts. Verarbeitet Schlüssel-Wert- + Markdown-Inhalte. | Variiert je nach Modell |
| 🟣 | **LLM-Coached** | LLM + Grammatikwörterbücher + in Prompts injizierte Coaching-Daten. Am besten für morphologisch komplexe Sprachen geeignet. | Variiert je nach Modell |
| 🟠 | **API (Plugin)** | Von der Community gehostete Übersetzungs-Pipelines, die über HTTP bereitgestellt werden. [OCAP-kompatibel](https://mtevalarena.org/docs/community/low-resource-languages). | Variiert je nach Anbieter |

Legen Sie `GOOGLE_TRANSLATE_API_KEY` für Google Translate oder `OPENROUTER_API_KEY` für LLM-Methoden fest. Weitere Details finden Sie unter [Übersetzungsmethoden](/docs/guides/translation-methods).

---

## Priorisierte Sprachen

Dies sind die am häufigsten angeforderten Gebietsschemas (Locales) für Web- und Mobilanwendungen, aufgelistet in der von rosetta empfohlenen Reihenfolge, bei der Barrierefreiheit an erster Stelle steht.

| Flagge | Sprache | Code | Google | LLM | Coached | Schrift | Anmerkungen |
|------|----------|------|:------:|:---:|:-------:|--------|-------|
| 🇸🇦 | Arabisch | `ar` | ✅ | ✅ | ✅ | — | RTL. Modernes Standardarabisch (فصحى). |
| 🇵🇭 | Filipino (Taglish) | `tl` | ✅ | ✅ | ✅ | — | Code-Switching: Tagalog primär, Fachbegriffe auf Englisch. |
| 🇫🇷 | Französisch | `fr` | ✅ | ✅ | ✅ | — | Vous-Form. Geschlechtergerecht (Connecté·e). |
| 🇪🇸 | Spanisch | `es` | ✅ | ✅ | ✅ | — | Neutrales Lateinamerikanisch. |
| 🇩🇪 | Deutsch | `de` | ✅ | ✅ | ✅ | — | Sie-Form. Geschlechtergerecht (Benutzer:innen). |
| 🇯🇵 | Japanisch | `ja` | ✅ | ✅ | ✅ | — | です/ます für Fließtext, する für UI-Beschriftungen. |
| 🇨🇳 | Chinesisch (Vereinfacht) | `zh` | ✅ | ✅ | ✅ | — | 简体中文. |
| 🇮🇹 | Italienisch | `it` | ✅ | ✅ | ✅ | — | Lei-Form. |
| 🇧🇷 | Portugiesisch (BR) | `pt` | ✅ | ✅ | ✅ | — | Brasilianisches Portugiesisch. |
| 🇰🇷 | Koreanisch | `ko` | ✅ | ✅ | ✅ | — | 해요체 höfliches Register. |

## Wichtige Weltsprachen

| Flagge | Sprache | Code | Google | LLM | Coached | Schrift | Anmerkungen |
|------|----------|------|:------:|:---:|:-------:|--------|-------|
| 🇧🇩 | Bengalisch | `bn` | ✅ | ✅ | ✅ | — | শুদ্ধ ভাষা Präferenz. |
| 🇧🇬 | Bulgarisch | `bg` | ✅ | ✅ | ✅ | — | |
| 🇨🇿 | Tschechisch | `cs` | ✅ | ✅ | ✅ | — | Vykání (Vy-Form). |
| 🇩🇰 | Dänisch | `da` | ✅ | ✅ | ✅ | — | |
| 🇬🇷 | Griechisch | `el` | ✅ | ✅ | ✅ | — | Moderne Δημοτική. |
| 🇮🇷 | Persisch | `fa` | ✅ | ✅ | ✅ | — | RTL. |
| 🇫🇮 | Finnisch | `fi` | ✅ | ✅ | ✅ | — | Kein grammatikalisches Geschlecht. |
| 🇮🇱 | Hebräisch | `he` | ✅ | ✅ | ✅ | — | RTL. |
| 🇮🇳 | Hindi | `hi` | ✅ | ✅ | ✅ | — | शुद्ध हिन्दी. Minimale englische Lehnwörter. |
| 🇭🇺 | Ungarisch | `hu` | ✅ | ✅ | ✅ | — | Ön-Form. |
| 🇮🇩 | Indonesisch | `id` | ✅ | ✅ | ✅ | — | |
| 🇲🇾 | Malaiisch | `ms` | ✅ | ✅ | ✅ | — | |
| 🇳🇱 | Niederländisch | `nl` | ✅ | ✅ | ✅ | — | U-Form. |
| 🇳🇴 | Norwegisch | `nb` | ✅ | ✅ | ✅ | — | Bokmål. |
| 🇵🇱 | Polnisch | `pl` | ✅ | ✅ | ✅ | — | Pan/Pani-Form. |
| 🇵🇹 | Portugiesisch (EU) | `pt-PT` | ✅ | ✅ | ✅ | — | Europäisches Portugiesisch. |
| 🇷🇴 | Rumänisch | `ro` | ✅ | ✅ | ✅ | — | |
| 🇷🇺 | Russisch | `ru` | ✅ | ✅ | ✅ | — | Вы-Form. |
| 🇸🇰 | Slowakisch | `sk` | ✅ | ✅ | ✅ | — | Vykanie (Vy-Form). |
| 🇷🇸 | Serbisch | `sr` | ✅ | ✅ | ✅ | 🔤 Lateinisch→Kyrillisch | Deterministischer Schriftkonverter. |
| 🇸🇪 | Schwedisch | `sv` | ✅ | ✅ | ✅ | — | |
| 🇰🇪 | Swahili | `sw` | ✅ | ✅ | ✅ | — | |
| 🇹🇭 | Thai | `th` | ✅ | ✅ | ✅ | — | ครับ/ค่ะ Höflichkeitspartikel. |
| 🇹🇷 | Türkisch | `tr` | ✅ | ✅ | ✅ | — | Siz-Form. |
| 🇺🇦 | Ukrainisch | `uk` | ✅ | ✅ | ✅ | — | Ви-Form. |
| 🇵🇰 | Urdu | `ur` | ✅ | ✅ | ✅ | — | RTL. آپ-Form. |
| 🇻🇳 | Vietnamesisch | `vi` | ✅ | ✅ | ✅ | — | |
| 🇹🇼 | Chinesisch (Traditionell) | `zh-TW` | ✅ | ✅ | ✅ | — | 繁體中文. |
| 🇬🇪 | Georgisch | `ka` | ✅ | ✅ | — | — | ქართული. Südkaukasische Sprachfamilie. |
| 🇳🇬 | Yoruba | `yo` | ✅ | ✅ | — | — | Èdè Yorùbá. Tonal (3 Töne). |

## Regionale Varianten

| Flagge | Sprache | Code | Google | LLM | Coached | Schrift | Anmerkungen |
|------|----------|------|:------:|:---:|:-------:|--------|-------|
| 🇲🇽 | Mexikanisches Spanisch | `es-MX` | ✅ | ✅ | ✅ | — | Tú-Form. Warmes Register. |
| 🇨🇦 | Kanadisches Französisch | `fr-CA` | ✅ | ✅ | ✅ | — | Québécois-Idiome. |

---

## Indigene & ressourcenarme Sprachen

Diese Sprachen werden von kommerziellen MT-Diensten nicht unterstützt. rosetta stellt die Werkzeuge für Sprachgemeinschaften bereit, um ihre eigenen Methoden nach den [OCAP-Prinzipien](https://mtevalarena.org/docs/community/low-resource-languages) zu entwickeln.

| | Sprache | Code | Google | LLM | Coached | Schrift | Status |
|---|----------|------|:------:|:---:|:-------:|--------|--------|
| 🪶 | Plains Cree | `crk` | ❌ | ✅ | ✅ | 🔤 SRO→Silbenschrift | 🚧 In Entwicklung |
| 🌄 | Quechua | `qu` | ✅ | ✅ | — | — | Runasimi. Evidentielle Suffixe. |

:::info Plains Cree befindet sich in aktiver Entwicklung
Das Register, die Coaching-Infrastruktur, der Schriftkonverter und die Evaluierungsumgebung für Plains Cree sind alle funktionsfähig, aber die Übersetzungs-Pipeline wurde **noch nicht veröffentlicht**. Wir arbeiten mit Sprachgemeinschaften nach den [OCAP-Prinzipien](https://mtevalarena.org/docs/community/low-resource-languages) zusammen, um die Qualität vor der Veröffentlichung sicherzustellen. Unter [Eine ressourcenarme Sprache unterstützen](https://mtevalarena.org/docs/community/low-resource-languages) finden Sie die vollständige Geschichte — und wie Sie dazu beitragen können.
:::

:::tip Weitere ressourcenarme Sprachen hinzufügen
Das Methoden-Plugin-System von rosetta ist genau dafür konzipiert. Eine Sprachgemeinschaft kann eine benutzerdefinierte Übersetzungsmethode entwickeln, diese unter eigener Kontrolle hosten und über die [API-Methode](/docs/guides/serving-a-method) bereitstellen. Die [Methoden-Rangliste](/leaderboard) verfolgt die Punktzahlen für jedes Sprachpaar — entwickeln Sie eine Methode, führen Sie die Evaluierungsumgebung aus und sichern Sie sich die höchste Punktzahl.
:::

---

## Konstruierte Sprachen (Conlangs)

Conlangs werden über LLM-Register und optionale Schriftkonverter unterstützt. Sie nutzen dieselbe Infrastruktur wie natürliche Sprachen — das Quality Gate, das Coaching-System und die Schriftkonvertierungs-Pipeline funktionieren identisch.

| | Sprache | Code | Google | LLM | Schrift | Anmerkungen |
|---|----------|------|:------:|:---:|--------|-------|
| 🖖 | Klingonisch | `tlh` | ❌ | ✅ | 🔤 Romanisierung→pIqaD | PUA-Schriftart erforderlich. Marc-Okrand-Vokabular. |
| 🧝 | Sindarin (Tolkiens Elbisch) | `x-elvish-s` | ❌ | ✅ | 🔤 Lateinisch→Tengwar | CSUR-PUA-Schriftart erforderlich. |
| 🏴‍☠️ | Piraten-Englisch | `x-pirate` | ❌ | ✅ | — | Nur Register. Nautische Metaphern. |
| 🦸 | Kryptonisch | `x-kryptonian` | ❌ | ✅ | 🔤 Lateinisch→Kryptonisch | PUA-Schriftart erforderlich. |
| 🎭 | Shakespeare-Englisch | `x-shakespeare` | ❌ | ✅ | — | Nur Register. Thee/thou, -eth/-est-Formen. |
| 🐸 | Yoda-Sprache | `x-yoda` | ❌ | ✅ | — | Nur Register. OSV-Wortstellung. |

Siehe [Conlangs, Schriften & Orthografie](/docs/guides/conlangs-scripts-orthography) für PUA-Schriftart-Anforderungen, Unicode-Einschränkungen und Informationen dazu, wie Sie Ihre eigenen hinzufügen können.

---

## Sprach-Voreinstellungen

Der `init`-Assistent unterstützt Voreinstellungsnamen für eine schnelle Einrichtung. Sie können Voreinstellungen mit individuellen Codes mischen.

| Voreinstellung | Erweitert zu |
|--------|-----------|
| `european` | fr, de, es, it, pt, nl |
| `asian` | ja, zh, ko |
| `global` | fr, es, de, ja, zh, ko, pt, ar |
| `nordic` | da, fi, nb, sv |

```bash
# Mix presets with individual codes
i18n-rosetta init
# → Target languages: european, ja
# → Resolves to: fr, de, es, it, pt, nl, ja
```

---

## Jede beliebige Sprache hinzufügen

rosetta kann in **jede Sprache übersetzen, die Ihr LLM kennt** — die obige Tabelle listet lediglich Sprachen mit integrierten Register-Voreinstellungen auf. Um eine nicht aufgeführte Sprache hinzuzufügen, fügen Sie deren BCP-47-Code in Ihre Konfiguration ein:

```json
{
  "languages": {
    "sw": {},
    "am": {
      "register": "Formal Amharic. Professional register with Geʽez script."
    }
  }
}
```

Das LLM übersetzt unter Verwendung seines Trainingswissens über die Sprache. Durch das Festlegen eines `register` erhalten Sie die Kontrolle über Tonfall, Formalität und orthografische Konventionen. Weitere Details finden Sie unter [Konfiguration](/docs/getting-started/configuration).

---

## Language Cards

Jede integrierte Sprache verfügt über eine **Language Card** — eine strukturierte JSON-Konfiguration, die aus Leistungsgründen in zwei Ebenen unterteilt ist:

### Zwei-Ebenen-Architektur

| Ebene | Verzeichnis | Geladen | Zweck |
|------|-----------|--------|--------|
| **Laufzeit (Runtime)** | `lib/data/language-cards/` | Sofort (eager) bei `import` | Übersetzungs-Engine: Register, Formalität, Regeln, Methodenunterstützung |
| **Referenz** | `lib/data/language-reference/` | Verzögert (lazy) bei Bedarf | Entwicklerdokumentation: linguistische Herausforderungen, enzyklopädische Daten, NLP-Ressourcen |

Die Laufzeitebene bleibt klein (~2 KB/Karte), damit beim Importieren von rosetta keine Megabytes an Dokumentationsdaten geladen werden. Die Referenzebene ist über `getLanguageReference(code)` für Tools, die Website und die Evaluierungsumgebung verfügbar.

### Felder der Laufzeit-Karte

| Feld | Inhalt |
|-------|------------------|
| **`nativeName`** | Endonym — die Eigenbezeichnung der Sprache in ihrer eigenen Schrift (z. B. ქართული, Runasimi) |
| **Höflichkeitssystem (Formality system)** | T-V-Distinktion, Sprachebenen, Keigo, Partikel usw. |
| **Register-Voreinstellungen** | Benannte LLM-Prompt-Voreinstellungen, die spezifisch für den Charakter der Sprache sind |
| **Methodenunterstützung** | Welche Übersetzungs-APIs diese Sprache unterstützen |
| **Leitfaden zum Geschlecht (Gender guidance)** | Grammatikalische Geschlechterregeln und Tipps für inklusives Schreiben |
| **Schrift/Richtung** | ISO-15924-Schriftcode und RTL/LTR |
| **Regeln** | Typografie (Anführungszeichen, Abstände), Groß-/Kleinschreibung, Pluralkategorien |
| **Evaluierungsdatensätze** | Welche Benchmarks diese Sprache abdecken |
| **`glottocode`** | Kanonischer Glottolog-Identifikator für Querverweise |
| **`humanReviewed`** | Ob die Karte von einem Muttersprachler überprüft wurde |

### Felder der Referenz-Karte

| Feld | Inhalt |
|-------|------------------|
| **Linguistische Herausforderungen** | MT-spezifische Fallstricke (z. B. Evidentialität, tonale Diakritika, Agglutination) |
| **Enzyklopädisch** | Sprachfamilie, Klassifikation, Sprecherzahl, Regionen |
| **Ressourcen** | NLP-Tools, parallele Korpora, vortrainierte Modelle |

### Eine neue Language Card generieren (Scaffolding)

Verwenden Sie den Generator, um das Grundgerüst beider Ebenen aus maßgeblichen Datenquellen (IANA, CLDR, Glottolog) zu erstellen:

```bash
# Preview what would be generated
node scripts/generate-language-card.mjs sw --dry-run

# Generate both runtime + reference cards
node scripts/generate-language-card.mjs sw
```

Der Generator füllt Metadaten (Codes, Schrift, Richtung, Plurale, Anführungszeichen, Methodenunterstützung, Sprachfamilie) automatisch aus und markiert Felder für linguistische Beurteilungen als TODO für die menschliche Kuratierung.

### Verwendung von Voreinstellungsschlüsseln (Preset Keys)

Anstatt den vollständigen Registertext zu schreiben, können Sie den Namen eines Voreinstellungsschlüssels verwenden:

```json
{
  "languages": {
    "fr": "casual-tu",
    "ko": "formal-hapsyo",
    "ja": "polite"
  }
}
```

Rosetta löst den Schlüssel in den vollständigen Register-Prompt auf. Führen Sie `npx i18n-rosetta init` aus, um die verfügbaren Voreinstellungen für jede Sprache anzuzeigen.

### Beispiel-Voreinstellungen

| Sprache | Voreinstellungen | Standard |
|----------|---------|--------|
| Französisch | `formal-vous`, `casual-tu` | `formal-vous` |
| Koreanisch | `polite-haeyo`, `formal-hapsyo`, `casual-hae` | `polite-haeyo` |
| Japanisch | `polite`, `formal-keigo`, `casual` | `polite` |
| Deutsch | `formal-Sie`, `casual-du` | `formal-Sie` |
| Thai | `neutral-professional`, `polite-male`, `polite-female` | `neutral-professional` |
| Spanisch | `neutral-professional`, `formal-usted`, `casual-tuteo` | `neutral-professional` |

Siehe [Eine Language Card beisteuern](https://github.com/gamedaysuits/i18n-rosetta) für die vollständige Spezifikation, einschließlich Feldvalidierung und PR-Checkliste.

---

## Siehe auch

- [Konfiguration](/docs/getting-started/configuration) — vollständige Konfigurationsreferenz einschließlich Spracheinrichtung
- [Übersetzungsmethoden](/docs/guides/translation-methods) — wie jede Methode funktioniert
- [Schriftkonverter](/docs/concepts/script-converters) — deterministische Schriftkonvertierungs-Pipeline
- [Conlangs, Schriften & Orthografie](/docs/guides/conlangs-scripts-orthography) — PUA-Schriftarten, Unicode, Hinzufügen von Conlangs
- [Eine ressourcenarme Sprache unterstützen](https://mtevalarena.org/docs/community/low-resource-languages) — Entwicklung von Methoden für unterversorgte Sprachen