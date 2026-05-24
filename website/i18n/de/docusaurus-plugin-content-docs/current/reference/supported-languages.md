---
sidebar_position: 4
title: "Unterstützte Sprachen"
---
# Unterstützte Sprachen

rosetta wird mit **Sprachkarten** (Language Cards) ausgeliefert — strukturierten Referenzdateien für mehr als 42 Sprachen. Jede Karte enthält Register-Voreinstellungen, Metadaten zum Höflichkeitssystem, Indikatoren zur Methodenunterstützung und Informationen zur Schrift. Jede Sprache, die Ihr LLM beherrscht, kann mit einer einzigen Konfigurationszeile hinzugefügt werden — die hier aufgeführten verfügen über kuratierte, produktionsreife Register.

---

## Übersetzungsmethoden

Für jede Sprache können Sie eine oder mehrere dieser Übersetzungsmethoden verwenden:

| Symbol | Methode | Funktionsweise | Kosten |
|------|--------|-------------|------|
| 🟢 | **Google Translate** | Neuronale MT-Basis. Über 130 Sprachen. Nur Schlüssel-Wert-Zeichenfolgen (Key-Value) — kann Markdown-Inhalte nicht sicher übersetzen. | ~$20/1 Mio. Zeichen |
| 🔵 | **LLM (OpenRouter)** | Jede Sprache, die das Modell beherrscht. Registergesteuerte Prompts. Verarbeitet Schlüssel-Wert-Paare und Markdown-Inhalte. | Variiert je nach Modell |
| 🟣 | **LLM-Coached** | LLM + Grammatikwörterbücher + Coaching-Daten, die in Prompts injiziert werden. Am besten für morphologisch komplexe Sprachen geeignet. | Variiert je nach Modell |
| 🟠 | **API (Plugin)** | Von der Community gehostete Übersetzungspipelines, die über HTTP bereitgestellt werden. [OCAP-kompatibel](/docs/guides/low-resource-languages). | Variiert je nach Anbieter |

Setzen Sie `GOOGLE_TRANSLATE_API_KEY` für Google Translate oder `OPENROUTER_API_KEY` für LLM-Methoden. Weitere Einzelheiten finden Sie unter [Übersetzungsmethoden](/docs/guides/translation-methods).

---

## Priorisierte Sprachen

Dies sind die am häufigsten nachgefragten Gebietsschemas (Locales) für Web- und Mobilanwendungen, aufgelistet in der von rosetta empfohlenen, auf Barrierefreiheit ausgerichteten Reihenfolge.

| Flagge | Sprache | Code | Google | LLM | Coached | Schrift | Anmerkungen |
|------|----------|------|:------:|:---:|:-------:|--------|-------|
| 🇸🇦 | Arabisch | `ar` | ✅ | ✅ | ✅ | — | RTL. Modernes Standardarabisch (فصحى). |
| 🇵🇭 | Filipino (Taglish) | `tl` | ✅ | ✅ | ✅ | — | Code-Switching: Tagalog primär, Fachbegriffe auf Englisch. |
| 🇫🇷 | Französisch | `fr` | ✅ | ✅ | ✅ | — | Vous-Form. Geschlechterinklusiv (Connecté·e). |
| 🇪🇸 | Spanisch | `es` | ✅ | ✅ | ✅ | — | Neutrales Lateinamerikanisch. |
| 🇩🇪 | Deutsch | `de` | ✅ | ✅ | ✅ | — | Sie-Form. Geschlechterinklusiv (Benutzer:innen). |
| 🇯🇵 | Japanisch | `ja` | ✅ | ✅ | ✅ | — | です/ます für Fließtext, する für UI-Beschriftungen. |
| 🇨🇳 | Chinesisch (Vereinfacht) | `zh` | ✅ | ✅ | ✅ | — | 简体中文. |
| 🇮🇹 | Italienisch | `it` | ✅ | ✅ | ✅ | — | Lei-Form. |
| 🇧🇷 | Portugiesisch (BR) | `pt` | ✅ | ✅ | ✅ | — | Brasilianisches Portugiesisch. |
| 🇰🇷 | Koreanisch | `ko` | ✅ | ✅ | ✅ | — | Höfliches Register (해요체). |

## Wichtige Weltsprachen

| Flagge | Sprache | Code | Google | LLM | Coached | Schrift | Anmerkungen |
|------|----------|------|:------:|:---:|:-------:|--------|-------|
| 🇧🇩 | Bengalisch | `bn` | ✅ | ✅ | ✅ | — | Präferenz für শুদ্ধ ভাষা. |
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
| 🇹🇭 | Thai | `th` | ✅ | ✅ | ✅ | — | Höflichkeitspartikel ครับ/ค่ะ. |
| 🇹🇷 | Türkisch | `tr` | ✅ | ✅ | ✅ | — | Siz-Form. |
| 🇺🇦 | Ukrainisch | `uk` | ✅ | ✅ | ✅ | — | Ви-Form. |
| 🇵🇰 | Urdu | `ur` | ✅ | ✅ | ✅ | — | RTL. آپ-Form. |
| 🇻🇳 | Vietnamesisch | `vi` | ✅ | ✅ | ✅ | — | |
| 🇹🇼 | Chinesisch (Traditionell) | `zh-TW` | ✅ | ✅ | ✅ | — | 繁體中文. |

## Regionale Varianten

| Flagge | Sprache | Code | Google | LLM | Coached | Schrift | Anmerkungen |
|------|----------|------|:------:|:---:|:-------:|--------|-------|
| 🇲🇽 | Mexikanisches Spanisch | `es-MX` | ✅ | ✅ | ✅ | — | Tú-Form. Herzliches Register. |
| 🇨🇦 | Kanadisches Französisch | `fr-CA` | ✅ | ✅ | ✅ | — | Québécois-Redewendungen. |

---

## Indigene & ressourcenarme Sprachen

Diese Sprachen werden von kommerziellen MT-Diensten (maschinelle Übersetzung) nicht unterstützt. rosetta stellt die Werkzeuge bereit, damit Sprachgemeinschaften ihre eigenen Methoden nach den [OCAP-Prinzipien](/docs/guides/low-resource-languages) entwickeln können.

| | Sprache | Code | Google | LLM | Coached | Schrift | Status |
|---|----------|------|:------:|:---:|:-------:|--------|--------|
| 🪶 | Plains Cree | `crk` | ❌ | ✅ | ✅ | 🔤 SRO→Silbenschrift | 🚧 In Entwicklung |

:::info Plains Cree befindet sich in aktiver Entwicklung
Das Register, die Coaching-Infrastruktur, der Schriftkonverter und die Evaluierungsumgebung für Plains Cree sind alle funktionsfähig, aber die Übersetzungspipeline wurde **noch nicht veröffentlicht**. Wir arbeiten mit Sprachgemeinschaften nach den [OCAP-Prinzipien](/docs/guides/low-resource-languages) zusammen, um die Qualität vor der Veröffentlichung sicherzustellen. Lesen Sie [Eine ressourcenarme Sprache unterstützen](/docs/guides/low-resource-languages) für die vollständigen Hintergründe — und wie Sie dazu beitragen können.
:::

:::tip Weitere ressourcenarme Sprachen hinzufügen
Das Methoden-Plugin-System von rosetta ist genau dafür konzipiert. Eine Sprachgemeinschaft kann eine benutzerdefinierte Übersetzungsmethode entwickeln, sie unter eigener Kontrolle hosten und über die [API-Methode](/docs/guides/serving-a-method) bereitstellen. Die [Methoden-Rangliste](/leaderboard) erfasst die Punktzahlen für jedes Sprachpaar — entwickeln Sie eine Methode, führen Sie die Evaluierungsumgebung aus und sichern Sie sich die höchste Punktzahl.
:::

---

## Konstruierte Sprachen (Conlangs)

Conlangs werden über LLM-Register und optionale Schriftkonverter unterstützt. Sie nutzen dieselbe Infrastruktur wie natürliche Sprachen — das Quality Gate, das Coaching-System und die Schriftkonvertierungspipeline funktionieren identisch.

| | Sprache | Code | Google | LLM | Schrift | Anmerkungen |
|---|----------|------|:------:|:---:|--------|-------|
| 🖖 | Klingonisch | `tlh` | ❌ | ✅ | 🔤 Romanisierung→pIqaD | PUA-Schriftart erforderlich. Vokabular nach Marc Okrand. |
| 🧝 | Sindarin (Tolkiens Elbisch) | `x-elvish-s` | ❌ | ✅ | 🔤 Lateinisch→Tengwar | CSUR-PUA-Schriftart erforderlich. |
| 🏴‍☠️ | Piraten-Englisch | `x-pirate` | ❌ | ✅ | — | Nur Register. Nautische Metaphern. |
| 🦸 | Kryptonisch | `x-kryptonian` | ❌ | ✅ | 🔤 Lateinisch→Kryptonisch | PUA-Schriftart erforderlich. |
| 🎭 | Shakespeare-Englisch | `x-shakespeare` | ❌ | ✅ | — | Nur Register. Thee/thou, -eth/-est-Formen. |
| 🐸 | Yoda-Sprache | `x-yoda` | ❌ | ✅ | — | Nur Register. OSV-Wortstellung. |

Weitere Informationen zu den Anforderungen an PUA-Schriftarten, Unicode-Einschränkungen und zum Hinzufügen eigener Sprachen finden Sie unter [Conlangs, Schriften & Orthographie](/docs/guides/conlangs-scripts-orthography).

---

## Sprachvoreinstellungen

Der Assistent `init` unterstützt Voreinstellungsnamen für eine schnelle Einrichtung. Sie können Voreinstellungen mit individuellen Codes mischen.

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

## Beliebige Sprachen hinzufügen

rosetta kann in **jede Sprache übersetzen, die Ihr LLM beherrscht** — die obige Tabelle listet lediglich Sprachen mit integrierten Register-Voreinstellungen auf. Um eine nicht aufgeführte Sprache hinzuzufügen, fügen Sie deren BCP-47-Code in Ihre Konfiguration ein:

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

Das LLM übersetzt unter Verwendung seines Trainingswissens über die Sprache. Durch das Festlegen eines `register` erhalten Sie die Kontrolle über Tonfall, Höflichkeitsform und orthographische Konventionen. Weitere Einzelheiten finden Sie unter [Konfiguration](/docs/getting-started/configuration).

---

## Sprachkarten

Jede integrierte Sprache verfügt über eine **Sprachkarte** (Language Card) — eine JSON-Datei in `lib/data/language-cards/`, die Folgendes enthält:

| Feld | Inhalt |
|-------|------------------|
| **Höflichkeitssystem** | T-V-Distinktion, Sprachebenen, Keigo, Partikel usw. |
| **Register-Voreinstellungen** | Benannte Voreinstellungen, die spezifisch für den Charakter der Sprache sind |
| **Methodenunterstützung** | Welche Übersetzungs-APIs diese Sprache unterstützen |
| **Leitfaden zum Geschlecht** | Grammatikalische Geschlechterregeln und Tipps zum inklusiven Schreiben |
| **Schrift/Richtung** | ISO-15924-Schriftcode und RTL/LTR |
| **Evaluierungsdatensätze** | Welche Benchmarks diese Sprache abdecken |

### Verwendung von Voreinstellungsschlüsseln

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

Unter [Eine Sprachkarte beisteuern](https://github.com/nicholasgriffintn/i18n-rosetta/blob/main/docs/planning/LANGUAGE_CARD_SPEC.md) erfahren Sie, wie Sie Voreinstellungen hinzufügen oder verbessern können.

---

## Siehe auch

- [Konfiguration](/docs/getting-started/configuration) — vollständige Konfigurationsreferenz einschließlich Spracheinrichtung
- [Übersetzungsmethoden](/docs/guides/translation-methods) — wie jede Methode funktioniert
- [Schriftkonverter](/docs/concepts/script-converters) — deterministische Schriftkonvertierungspipeline
- [Conlangs, Schriften & Orthographie](/docs/guides/conlangs-scripts-orthography) — PUA-Schriftarten, Unicode, Hinzufügen von Conlangs
- [Eine ressourcenarme Sprache unterstützen](/docs/guides/low-resource-languages) — Entwicklung von Methoden für unterversorgte Sprachen