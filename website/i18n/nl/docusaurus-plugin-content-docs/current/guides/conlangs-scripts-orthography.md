---
sidebar_position: 3
title: "Kunsttalen, Schriften & Orthografie"
---
# Conlangs, scripts & orthografie

rosetta biedt eersteklas ondersteuning voor geconstrueerde talen (conlangs) via LLM-registers en deterministische script converters. Deze gids behandelt hoe de ondersteuning voor conlangs werkt, welke lettertypen u nodig hebt en hoe u uw eigen conlangs kunt toevoegen.

:::tip Waarom conlangs belangrijk zijn
Conlangs zijn niet zomaar een nieuwigheid — ze maken gebruik van exact dezelfde infrastructuur die wordt gebruikt voor echte, ondervertegenwoordigde talen. De quality gate, het coaching system en de script conversion pipeline werken identiek voor het Klingon en het Plains Cree. Als uw conlang-pijplijn werkt, zal uw pijplijn voor low-resource talen dat ook doen.
:::

---

## Ondersteunde geconstrueerde talen

| Taal | Code | Script converter | Lettertype vereist |
|----------|------|:----------------:|:-------------:|
| Klingon | `tlh` | ✅ Romanisatie → pIqaD | PUA-lettertype (bijv. pIqaD qolqoS) |
| Sindarin (Tolkien-Elfs) | `x-elvish-s` | ✅ Latijn → Tengwar | CSUR PUA-lettertype |
| Kryptoniaans | `x-kryptonian` | ✅ Latijn → Kryptoniaans | PUA-lettertype |
| Piraten-Engels | `x-pirate` | ❌ alleen register | Geen |
| Shakespeareaans Engels | `x-shakespeare` | ❌ alleen register | Geen |
| Yoda-spraak | `x-yoda` | ❌ alleen register | Geen |

Conlang-codes gebruiken het voorvoegsel `x-` volgens de BCP-47 private-use conventie, met uitzondering van het Klingon (`tlh`), dat een [ISO 639-3](https://iso639-3.sil.org/code/tlh)-code heeft toegewezen gekregen door SIL International.

---

## Unicode, PUA en lettertypevereisten

### De Private Use Area

Klingon (pIqaD), Sindarin (Tengwar) en Kryptoniaans gebruiken Unicode **Private Use Area (PUA)**-tekens. PUA is het bereik U+E000–U+F8FF — deze codepoints hebben **geen standaardtoewijzing**. De [ConScript Unicode Registry (CSUR)](https://www.evertype.com/standards/csur/) beheert door de gemeenschap overeengekomen toewijzingen voor fictieve scripts, maar deze maken geen deel uit van de Unicode-standaard.

Wat dit in de praktijk betekent:

- PUA-tekst wordt weergegeven als **lege vakjes** (□□□) als het juiste lettertype niet is geladen
- Verschillende lettertypen kunnen verschillende glyphs toewijzen aan dezelfde PUA-codepoints
- rosetta bundelt GEEN PUA-lettertypen — u dient deze zelf te laden
- Systeemlettertypen zullen deze tekens nooit weergeven

### PUA-bereiken per script

| Script | PUA-bereik | CSUR-referentie |
|--------|-----------|---------------|
| Klingon (pIqaD) | U+F8D0–U+F8FF | [CSUR Klingon](https://www.evertype.com/standards/csur/klingon.html) |
| Tengwar (Elfs) | U+E000–U+E07F | [CSUR Tengwar](https://www.evertype.com/standards/csur/tengwar.html) |
| Kryptoniaans | Varieert per lettertype | Geen CSUR-standaard |

### PUA-weblettertypen laden

Om op PUA gebaseerde conlang-tekst in uw webapplicatie weer te geven, laadt u het juiste lettertype via CSS:

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

:::warning Unicode-ondersteuning is NIET gegarandeerd
Het Unicode Consortium heeft [expliciet geweigerd](https://www.unicode.org/faq/private_use.html) om fictieve scripts in de standaard te coderen. PUA-toewijzingen worden door de gemeenschap beheerd en kunnen conflicteren tussen verschillende lettertype-implementaties. Specificeer altijd het exacte lettertype dat uw project gebruikt en test de weergave in verschillende browsers.
:::

---

## Script converters

### Hoe ze werken

De scriptconversie van rosetta is een **post-translation hook**:

1. De LLM vertaalt tekst naar een **werkscript** (meestal Latijn of SRO)
2. De [quality gate](/docs/concepts/quality-gate) valideert de uitvoer
3. De deterministische converter transformeert de gevalideerde tekst naar het **weergavescript**
4. De geconverteerde tekst wordt naar de schijf geschreven

Deze tweestapsbenadering werkt omdat LLM's betere uitvoer produceren wanneer ze in op het Latijn gebaseerde scripts werken. De deterministische converter garandeert een correcte scriptuitvoer zonder te vertrouwen op de (vaak onbetrouwbare) scriptkennis van het model.

### Alle vijf converters

rosetta wordt geleverd met vijf ingebouwde script converters:

#### Plains Cree: SRO → Syllabics (`crk`)

Standard Roman Orthography naar Canadian Aboriginal Syllabics.

```
Input:  "tawâw"
Output: "ᑕᐚᐤ"
```

Lange klinkers gebruiken een macron/circumflex: ê, î, ô, â. De converter verwerkt alle SRO-diakritische tekens en wijst deze toe aan de juiste syllabische tekens. Zie [Ondersteuning voor een low-resource taal](https://mtevalarena.org/docs/community/low-resource-languages) voor de volledige Cree-pijplijn.

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

De Tengwar-toewijzing volgens Tolkiens Sindarin-modus.

```
Input:  "elen síla"  (Latin Sindarin)
Output: [Tengwar PUA] (requires Tengwar font to render)
```

#### Kryptoniaans: Latijn → Kryptoniaans (`x-kryptonian`)

Kryptoniaanse scripttoewijzing volgens het fan-lexicon.

```
Input:  "Kal-El"
Output: [Kryptonian PUA] (requires Kryptonian font to render)
```

### Een converter activeren

Stel het veld `scripts` in uw taalconfiguratie in. Voor ingebouwde converters wordt dit automatisch gedetecteerd aan de hand van de taalcode:

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

## Talen met meerdere scripts

Sommige echte talen gebruiken meerdere actieve scripts:

| Taal | Scripts | rosetta-benadering |
|----------|---------|-----------------|
| Servisch | Latijn + Cyrillisch | Script converter (`sr`) — vertaal in het Latijn, converteer naar het Cyrillisch |
| Chinees | Vereenvoudigd + Traditioneel | Afzonderlijke localecodes (`zh` vs `zh-TW`) met verschillende registers |

Voor talen waarbij beide scripts dezelfde doelgroep bedienen (Servisch), gebruikt u een script converter. Voor talen waarbij de scripts verschillende doelgroepen bedienen (Vereenvoudigd Chinees voor het vasteland van China, Traditioneel voor Taiwan/HK), gebruikt u afzonderlijke localecodes.

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
- **Spaans**: Genderneutrale herstructurering heeft de voorkeur; slash-notatie (bijv. "usuario/a") als terugvaloptie

Voor talen zonder specifieke richtlijnen in hun kaart (bijv. Koreaans, conlangs), valt het systeem terug op een algemene regel: *"geef de voorkeur aan genderneutrale vormen of de meest inclusieve optie die beschikbaar is."*

### Vereisten voor RTL-scripts

De registers voor het Arabisch, Hebreeuws, Perzisch en Urdu vermelden allemaal de vereisten voor rechts-naar-links (RTL): `Ensure text reads naturally in RTL layout contexts.`

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

## Een nieuwe conlang toevoegen

### Stap voor stap

1. **Kies een BCP-47 private-use code**: Gebruik het voorvoegsel `x-` (bijv. `x-dothraki`, `x-valyrian`).

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

3. **(Optioneel) Voeg een script converter toe**: Als uw conlang een niet-Latijns weergavescript gebruikt, voeg dan een converter toe in `lib/scripts.js` en registreer deze in `SCRIPT_CONVERTERS`.

4. **Testen**: Voer `i18n-rosetta sync --dry` uit om een voorbeeld van vertalingen te bekijken zonder bestanden weg te schrijven.

5. **Controleer de quality gate**: De [quality gate](/docs/concepts/quality-gate) moet mogelijk worden afgestemd op uw conlang — in het bijzonder de controle `requireNonLatin` als uw conlang PUA-tekens gebruikt.

:::note Conlang-kwaliteit is afhankelijk van LLM-kennis
De LLM kan alleen vertalen naar een conlang die het in de trainingsgegevens heeft gezien. Goed gedocumenteerde conlangs (Klingon, Sindarin, Dothraki) werken goed. Obscure of nieuw uitgevonden conlangs kunnen inconsistente resultaten opleveren. Gebruik [coaching data](/docs/concepts/coaching-data) om de kwaliteit te verbeteren.
:::

---

## Zie ook

- [Ondersteunde talen](/docs/reference/supported-languages) — volledige taaltabel met beschikbaarheid van methoden
- [Script converters](/docs/concepts/script-converters) — technische details van de conversiepijplijn
- [Vertaalmethoden](/docs/guides/translation-methods) — hoe elke vertaalmethode werkt
- [Configuratie](/docs/getting-started/configuration) — configuratiereferentie inclusief taal- en registerinstellingen
- [Ondersteuning voor een low-resource taal](https://mtevalarena.org/docs/community/low-resource-languages) — dezelfde infrastructuur toegepast op echte, ondervertegenwoordigde talen