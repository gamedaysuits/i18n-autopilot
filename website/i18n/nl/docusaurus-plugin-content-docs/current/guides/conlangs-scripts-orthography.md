---
sidebar_position: 3
title: "Kunsttalen, schriftsystemen & orthografie"
---
# Kunsttalen, schriften & orthografie

rosetta biedt uitstekende ondersteuning voor kunsttalen via LLM-registers en deterministische scriptconverters. Deze gids behandelt hoe de ondersteuning voor kunsttalen werkt, welke lettertypen u nodig hebt en hoe u uw eigen kunsttaal kunt toevoegen.

:::tip Waarom kunsttalen belangrijk zijn
Kunsttalen zijn niet slechts een noviteit — ze maken gebruik van exact dezelfde infrastructuur die wordt gebruikt voor echte, ondervertegenwoordigde talen. De quality gate, het coachingsysteem en de scriptconversiepijplijn werken identiek voor Klingon en Plains Cree. Als uw pijplijn voor kunsttalen werkt, zal uw pijplijn voor talen met weinig bronnen dat ook doen.
:::

---

## Ondersteunde kunsttalen

| Taal | Code | Scriptconverter | Lettertype vereist |
|----------|------|:----------------:|:-------------:|
| Klingon | `tlh` | ✅ Romanisatie → pIqaD | PUA-lettertype (bijv. pIqaD qolqoS) |
| Sindarin (Tolkien-elfen) | `x-elvish-s` | ✅ Latijn → Tengwar | CSUR PUA-lettertype |
| Kryptoniaans | `x-kryptonian` | ✅ Latijn → Kryptoniaans | PUA-lettertype |
| Piraten-Engels | `x-pirate` | ❌ alleen register | Geen |
| Shakespeareaans Engels | `x-shakespeare` | ❌ alleen register | Geen |
| Yoda-taal | `x-yoda` | ❌ alleen register | Geen |

Codes voor kunsttalen gebruiken het voorvoegsel `x-` volgens de BCP-47-conventie voor privégebruik, met uitzondering van Klingon (`tlh`), dat een [ISO 639-3](https://iso639-3.sil.org/code/tlh)-code heeft toegewezen gekregen van SIL International.

---

## Unicode, PUA en lettertypevereisten

### De Private Use Area

Klingon (pIqaD), Sindarin (Tengwar) en Kryptoniaans gebruiken Unicode **Private Use Area (PUA)**-tekens. PUA is het bereik U+E000–U+F8FF — deze codepunten hebben **geen standaardtoewijzing**. De [ConScript Unicode Registry (CSUR)](https://www.evertype.com/standards/csur/) onderhoudt door de gemeenschap overeengekomen toewijzingen voor fictieve schriften, maar deze maken geen deel uit van de Unicode-standaard.

Wat dit in de praktijk betekent:

- PUA-tekst wordt weergegeven als **lege vakjes** (□□□) als het juiste lettertype niet is geladen
- Verschillende lettertypen kunnen verschillende tekens (glyphs) toewijzen aan dezelfde PUA-codepunten
- rosetta bundelt GEEN PUA-lettertypen — u dient deze zelf te laden
- Systeemlettertypen zullen deze tekens nooit weergeven

### PUA-bereiken per schrift

| Schrift | PUA-bereik | CSUR-referentie |
|--------|-----------|---------------|
| Klingon (pIqaD) | U+F8D0–U+F8FF | [CSUR Klingon](https://www.evertype.com/standards/csur/klingon.html) |
| Tengwar (Elfen) | U+E000–U+E07F | [CSUR Tengwar](https://www.evertype.com/standards/csur/tengwar.html) |
| Kryptoniaans | Varieert per lettertype | Geen CSUR-standaard |

### PUA-weblettertypen laden

rosetta bevat een ingebouwde opdracht om PUA-weblettertypen te downloaden en te beheren:

```bash
# See which fonts are needed for your configured languages
i18n-rosetta fonts list

# Download all needed fonts (auto-detects project type for output directory)
i18n-rosetta fonts install

# Also generate a CSS snippet with @font-face declarations
i18n-rosetta fonts install --css
```

De opdracht `fonts install` downloadt vanuit geverifieerde open-source repositories:

| Lettertype | Schrift | Licentie | Bron |
|------|--------|---------|--------|
| pIqaD qolqoS | Klingon | SIL Open Font License 1.1 | [GitHub](https://github.com/dadap/pIqaD-fonts) |
| FreeMonoTengwar | Tengwar | GNU GPL v3 (met lettertype-uitzondering) | [SourceForge](https://sourceforge.net/projects/freetengwar/) |
| *(door gebruiker verstrekt)* | Kryptoniaans | Varieert | Geen open-source PUA-lettertype beschikbaar |

De uitvoermap wordt automatisch gedetecteerd op basis van uw projectstructuur (Docusaurus → `static/fonts/`, Hugo → `static/fonts/`, standaard → `public/fonts/`). U kunt dit overschrijven met `--dir`.

Als u er de voorkeur aan geeft om lettertypen handmatig te beheren, voeg dan `@font-face`-regels toe in uw CSS:

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

:::warning Unicode-ondersteuning is NIET gegarandeerd
Het Unicode Consortium heeft [expliciet geweigerd](https://www.unicode.org/faq/private_use.html) om fictieve schriften in de standaard te coderen. PUA-toewijzingen worden door de gemeenschap onderhouden en kunnen conflicteren tussen verschillende lettertype-implementaties. Specificeer altijd het exacte lettertype dat uw project gebruikt en test de weergave in verschillende browsers.
:::

---

## Scriptconverters

### Hoe ze werken

De scriptconversie van rosetta is een **post-translation hook**:

1. De LLM vertaalt tekst naar een **werkschrift** (meestal Latijn of SRO)
2. De [quality gate](/docs/concepts/quality-gate) valideert de uitvoer
3. De deterministische converter transformeert de gevalideerde tekst naar het **weergaveschrift**
4. De geconverteerde tekst wordt naar de schijf geschreven

Deze tweestapsbenadering werkt omdat LLM's betere uitvoer produceren wanneer ze in op het Latijn gebaseerde schriften werken. De deterministische converter garandeert een correcte scriptuitvoer zonder te vertrouwen op de (vaak onbetrouwbare) scriptkennis van het model.

### Alle vijf converters

rosetta wordt geleverd met vijf ingebouwde scriptconverters:

#### Plains Cree: SRO → Syllabenschrift (`crk`)

Standard Roman Orthography naar Canadian Aboriginal Syllabics.

```
Input:  "tawâw"
Output: "ᑕᐚᐤ"
```

Lange klinkers gebruiken een macron/circumflex: ê, î, ô, â. De converter verwerkt alle SRO-diakritische tekens en wijst deze toe aan de juiste syllabische tekens. Zie [Een low-resource taal ondersteunen](https://mtevalarena.org/docs/community/low-resource-languages) voor de volledige Cree-pijplijn.

#### Servisch: Latijn → Cyrillisch (`sr`)

Deterministische Latijn-naar-Cyrillisch conversie voor het Servisch.

```
Input:  "zdravo"
Output: "здраво"
```

Dit verwerkt de volledige toewijzing van het Servische alfabet, inclusief digrafen (lj → љ, nj → њ, dž → џ).

#### Klingon: Romanisatie → pIqaD (`tlh`)

Het romanisatiesysteem van Marc Okrand naar pIqaD PUA-tekens.

```
Input:  "Qapla'"    (romanized Klingon)
Output: [pIqaD PUA] (requires pIqaD font to render)
```

#### Sindarin: Latijn → Tengwar (`x-elvish-s`)

Tolkiens Sindarin-modus Tengwar-toewijzing.

```
Input:  "elen síla"  (Latin Sindarin)
Output: [Tengwar PUA] (requires Tengwar font to render)
```

#### Kryptoniaans: Latijn → Kryptoniaans (`x-kryptonian`)

Fan-lexicon Kryptoniaanse scripttoewijzing.

```
Input:  "Kal-El"
Output: [Kryptonian PUA] (requires Kryptonian font to render)
```

### Een converter activeren

Stel het veld `scripts` in uw taalconfiguratie in. Voor ingebouwde converters wordt dit automatisch gedetecteerd op basis van de taalcode:

```json
{
  "languages": {
    "sr": { "scripts": "sr" },
    "crk": {}
  }
}
```

Plains Cree (`crk`) wordt automatisch gedetecteerd — u hoeft `scripts` niet expliciet in te stellen.

---

## Talen met meerdere schriften

Sommige echte talen gebruiken meerdere actieve schriften:

| Taal | Schriften | rosetta-benadering |
|----------|---------|-----------------|
| Servisch | Latijn + Cyrillisch | Scriptconverter (`sr`) — vertaal in het Latijn, converteer naar Cyrillisch |
| Chinees | Vereenvoudigd + Traditioneel | Afzonderlijke locale-codes (`zh` vs `zh-TW`) met verschillende registers |

Voor talen waarbij beide schriften dezelfde doelgroep bedienen (Servisch), gebruikt u een scriptconverter. Voor talen waarbij de schriften verschillende doelgroepen bedienen (Vereenvoudigd Chinees voor het vasteland van China, Traditioneel voor Taiwan/HK), gebruikt u afzonderlijke locale-codes.

---

## Opmerkingen over orthografie

Registers bepalen niet alleen de toon — ze bevatten **orthografische instructies** die de LLM sturen naar de juiste schrijfconventies.

### Formele aanspreekvormen

De ingebouwde registers van rosetta bevatten de cultureel gepaste formele aanspreekvorm voor elke taal:

| Taal | Formele vorm | Registerinstructie |
|----------|------------|---------------------|
| Duits | Sie | `Use Sie-form for formal address` |
| Frans | vous | `Use vous-form` |
| Russisch | вы | `Professional register with вы-form` |
| Turks | siz | `Professional register with siz-form` |
| Koreaans | 합쇼체 | `Formal Korean (합쇼체)` |
| Japans | です/ます | `Polite professional register (です/ます form)` |
| Pools | Pan/Pani | `Professional register with Pan/Pani form` |

### Genderinclusief schrijven

Elke taalkaart heeft een veld `gender.inclusiveGuidance` met taalspecifiek advies. Dit wordt afzonderlijk van de register-preset in de LLM-vertaalprompt geïnjecteerd, zodat het consistent wordt toegepast, ongeacht welke formaliteits-preset de gebruiker kiest:

- **Frans**: Écriture inclusive met interpunct-notatie (bijv. "Connecté·e")
- **Duits**: Doppelpunkt-notatie (bijv. "Benutzer:innen")
- **Spaans**: Voorkeur voor genderneutrale herstructurering; slash-notatie (bijv. "usuario/a") als terugvaloptie

Voor talen zonder specifieke richtlijnen in hun kaart (bijv. Koreaans, kunsttalen), valt het systeem terug op een algemene regel: *"geef de voorkeur aan genderneutrale vormen of de meest inclusieve optie die beschikbaar is."*

### Vereisten voor RTL-schriften

De registers voor Arabisch, Hebreeuws, Perzisch en Urdu vermelden allemaal de vereisten voor rechts-naar-links: `Ensure text reads naturally in RTL layout contexts.`

### Een register overschrijven

Elk register is een configuratiewaarde — u kunt deze overschrijven om deze af te stemmen op de stem van uw project:

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

Zie [Configuratie](/docs/getting-started/configuration) voor de volledige configuratiereferentie.

---

## Een nieuwe kunsttaal toevoegen

### Stapsgewijs

1. **Kies een BCP-47-code voor privégebruik**: Gebruik het voorvoegsel `x-` (bijv. `x-dothraki`, `x-valyrian`).

2. **Voeg toe aan uw configuratie**:

```json
{
  "languages": {
    "x-dothraki": {
      "register": "Dothraki language. Use David J. Peterson's vocabulary from the Living Language Dothraki textbook. Harsh, direct tone. No articles, no verb 'to be'."
    }
  }
}
```

3. **(Optioneel) Voeg een scriptconverter toe**: Als uw kunsttaal een niet-Latijns weergaveschrift gebruikt, voeg dan een converter toe in `lib/scripts.js` en registreer deze in `SCRIPT_CONVERTERS`.

4. **Testen**: Voer `i18n-rosetta sync --dry` uit om een voorbeeld van vertalingen te bekijken zonder bestanden te schrijven.

5. **Controleer de quality gate**: De [quality gate](/docs/concepts/quality-gate) moet mogelijk worden afgestemd op uw kunsttaal — in het bijzonder de controle `requireNonLatin` als uw kunsttaal PUA-tekens gebruikt.

:::note Kwaliteit van kunsttalen is afhankelijk van LLM-kennis
De LLM kan alleen vertalen naar een kunsttaal die deze in de trainingsgegevens heeft gezien. Goed gedocumenteerde kunsttalen (Klingon, Sindarin, Dothraki) werken goed. Obscure of nieuw uitgevonden kunsttalen kunnen inconsistente resultaten opleveren. Gebruik [coachingsgegevens](/docs/concepts/coaching-data) om de kwaliteit te verbeteren.
:::

---

## Zie ook

- [Ondersteunde talen](/docs/reference/supported-languages) — volledige taaltabel met beschikbaarheid van methoden
- [Scriptconverters](/docs/concepts/script-converters) — technische details van de conversiepijplijn
- [Vertaalmethoden](/docs/guides/translation-methods) — hoe elke vertaalmethode werkt
- [Configuratie](/docs/getting-started/configuration) — configuratiereferentie inclusief taal- en registerinstellingen
- [Een low-resource taal ondersteunen](https://mtevalarena.org/docs/community/low-resource-languages) — dezelfde infrastructuur toegepast op echte, ondervertegenwoordigde talen