---
sidebar_position: 6
title: "Scriptconverters"
---
# Scriptconverters

Scriptconverters zijn deterministische, LLM-vrije post-translation hooks die tekst van het ene schriftsysteem naar het andere converteren. Ze maken een workflow mogelijk van "één keer vertalen, in meerdere schriften weergeven" — u vertaalt naar een werkschrift (meestal Latijns) en converteert dit vervolgens automatisch naar het weergaveschrift.

## Waarom Scriptconverters?

Sommige talen gebruiken meerdere schriften voor dezelfde gesproken taal:

- **Plains Cree**: SRO (Latijns) voor bewerking → Syllabics (ᓀᐦᐃᔭᐍᐏᐣ) voor weergave
- **Servisch**: Latijns voor internationaal gebruik → Cyrillisch voor binnenlands gebruik
- **Klingon**: Romanisatie voor typen → pIqaD (  ) voor weergave

Direct vertalen naar niet-Latijnse schriften levert problemen op: LLM's hallucineren tekens, JSON-bestanden worden moeilijk te beheren in versiebeheer en diff-tools kunnen wijzigingen niet vergelijken. Scriptconverters lossen dit op door vertalingen in een versiebeheervriendelijk schrift te houden en deze deterministisch te converteren tijdens de synchronisatie.

## Beschikbare converters

Rosetta wordt geleverd met vijf ingebouwde scriptconverters:

| Locale | Van | Naar | Type | Lettertype vereist? |
|--------|------|----|------|----------------|
| `crk` | SRO (Standard Roman Orthography) | Cree Syllabics | Deterministisch | Nee — native Unicode |
| `sr` | Latijns | Cyrillisch | Deterministisch | Nee — native Unicode |
| `tlh` | Romanisatie | pIqaD | Deterministisch | Ja — PUA U+F8D0–F8FF |
| `x-elvish-s` | Latijns | Tengwar (Mode of Beleriand) | Deterministisch | Ja — PUA U+E000–E07F |
| `x-kryptonian` | Latijns | Kryptonian | Font-gebaseerde cipher | Ja — PUA U+E100–E119 |

### Deterministisch vs. Font-gebaseerd

- **Deterministische converters** (Cree, Servisch, Klingon, Tengwar) voeren een echte teken-naar-teken mapping uit met behulp van taalkundige regels. De uitvoer bevat daadwerkelijke Unicode-tekens.
- **Font-gebaseerde converters** (Kryptonian) zijn 1:1 substitutie-ciphers waarbij de uitvoer bestaat uit Unicode PUA-tekens die alleen correct worden weergegeven wanneer een specifiek lettertype is geladen.

## Hoe ze werken

Scriptconverters worden **na** de vertaling uitgevoerd als een post-processing stap. De pijplijn is:

```
Source (English) → LLM Translation → Working Script → Script Converter → Display Script
```

Bijvoorbeeld, Plains Cree:
```
"Welcome" → LLM → "tānisi" (SRO) → Converter → "ᑖᓂᓯ" (Syllabics)
```

### Greedy links-naar-rechts matching

Alle converters gebruiken hetzelfde algoritme: probeer op elke tekenpositie eerst de langst mogelijke match en vervolgens steeds kortere matches. Tekens die met geen enkel patroon overeenkomen (spaties, leestekens, cijfers) worden ongewijzigd doorgegeven.

Dit verwerkt digrafen en trigrafen correct:
- Klingon: `tlh` → enkel pIqaD-teken (niet `t` + `l` + `h`)
- Servisch: `nj` → `њ` (niet `н` + `ј`)
- Cree: `twê` → enkel syllabisch teken (niet `t` + `w` + `ê`)

## Scriptconverters gebruiken

Scriptconverters worden automatisch geactiveerd wanneer de locale-code overeenkomt met een geregistreerde converter. Er is geen configuratie nodig — u hoeft alleen uw doel-locale in te stellen:

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

Wanneer rosetta het `en:crk` paar synchroniseert, worden vertalingen eerst geproduceerd in SRO en vervolgens automatisch geconverteerd naar Syllabics voordat ze naar `crk.json` worden geschreven.

### Converterstatus controleren

```bash
npx i18n-rosetta status
```

De statusuitvoer toont welke paren actieve scriptconverters hebben en welke conversie zij uitvoeren.

## Vereisten voor webfonts

Drie converters leveren Unicode Private Use Area (PUA)-tekens als uitvoer, waarvoor aangepaste webfonts vereist zijn:

### Klingon (pIqaD)

Installeer een CSUR-compatibel pIqaD-lettertype (bijv. "pIqaD qolqoS" of "Klingon pIqaD HaSta"):

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

Installeer een CSUR-compatibel Tengwar-lettertype (bijv. "Tengwar Formal CSUR", "Tengwar Annatar"):

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

### Kryptonian

Installeer een Kryptonian-lettertype dat is toegewezen aan PUA-codepoints U+E100–E119:

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

:::tip Alternatieve aanpak voor Kryptonian
Aangezien Kryptonian een pure A-Z cipher is, kunt u de scriptconverter volledig overslaan en het lettertype via CSS toepassen op Latijnse tekst. Dit is vaak eenvoudiger voor webimplementaties — u hoeft alleen het Kryptonian-lettertype aan te bieden en `font-family` in te stellen op de relevante elementen.
:::

## Een aangepaste converter toevoegen

Om een converter voor een nieuwe taal toe te voegen, bewerkt u `lib/scripts.js`:

1. **Maak de conversiemap** — een geordende array van `[from, to]` paren, de langste sequenties eerst
2. **Maak de converterfunctie** — een greedy links-naar-rechts scanner (gebruik `sroToSyllabics` als sjabloon)
3. **Registreer deze** in het `SCRIPT_CONVERTERS` object met de locale-code als sleutel
4. **Voeg het `script` veld toe** aan de registervermelding van de taal in `registers.js`

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

---

## Zie ook

- [Conlangs, schriften & orthografie](/docs/guides/conlangs-scripts-orthography) — PUA-fonts, Unicode, nieuwe converters toevoegen
- [Quality Gate](/docs/concepts/quality-gate) — validatie die wordt uitgevoerd vóór de scriptconversie
- [Ondersteunde talen](/docs/reference/supported-languages) — welke talen scriptconverters hebben
- [Een low-resource taal ondersteunen](/docs/guides/low-resource-languages) — SRO→Syllabics in context
- [Cookbook: FST-Gated Pipeline](/docs/tutorials/fst-gated-pipeline) — scriptconversie in een meertraps pijplijn