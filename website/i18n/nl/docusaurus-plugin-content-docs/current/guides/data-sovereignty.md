---
sidebar_position: 7
title: "Datasoevereiniteit"
description: "OCAP-, CARE- en Māori Data Sovereignty-principes voor de vertaling van inheemse talen. Waarom toestemming van de gemeenschap voorafgaat aan deployment."
---
# Datasoevereiniteit

Machinevertaling voor inheemse talen roept vragen op die niet bestaan voor het Frans of Japans. Wie is de eigenaar van de trainingsdata? Wie beheert hoe een taalmodel spreekt? Wie bepaalt of een vertaling goed genoeg is om te publiceren?

**Het antwoord is altijd de gemeenschap.**

rosetta is gebouwd om dit te ondersteunen. De `api`-methode houdt alle taalkundige bronnen aan de serverzijde onder beheer van de gemeenschap. Het plug-insysteem scheidt de methode van de tool. Maar de tool kan geen ethiek afdwingen — deze pagina legt de principes uit die u dient te volgen.

---

## OCAP®-principes

**OCAP** (Ownership, Control, Access, Possession) is een reeks principes ontwikkeld door het [First Nations Information Governance Centre](https://fnigc.ca/ocap-training/) (FNIGC) die vaststellen hoe data van First Nations verzameld, beschermd, gebruikt en gedeeld moet worden.

| Principe | Wat het betekent voor vertaling |
|-----------|------------------------------|
| **Ownership** (Eigendom) | De gemeenschap is eigenaar van haar taalkundige data — woordenboeken, grammatica's, parallelle teksten, coachingbestanden en alle vertalingen die daaruit worden geproduceerd. |
| **Control** (Controle) | De gemeenschap beheert hoe haar taaldata wordt gebruikt, wie toegang heeft en welke vertaalmethoden acceptabel zijn. |
| **Access** (Toegang) | Leden van de gemeenschap hebben het recht op toegang tot en beheer van hun eigen taalbronnen, ongeacht waar deze zijn opgeslagen. |
| **Possession** (Bezit) | De fysieke data (coachingbestanden, woordenboeken, modelgewichten) moet zich bevinden op infrastructuur die de gemeenschap beheert — niet in een cloud van derden. |

### Wat OCAP in de praktijk betekent

- **Publiceer geen vertalingen** van een inheemse taal zonder expliciete toestemming van de gemeenschap.
- **Train geen modellen** op door de gemeenschap verstrekte taalkundige data zonder een data-uitwisselingsovereenkomst.
- **Scrape geen** taalbronnen van de gemeenschap van websites, sociale media of educatief materiaal.
- **Gebruik de `api`-methode** zodat prompts, coachingdata en woordenboeken op servers blijven die door de gemeenschap worden beheerd. De rosetta `api`-methode is een "dumb pipe" (doorgeefluik) — het stuurt sleutels naar buiten en ontvangt vertalingen terug. Alle taalkundige intellectuele eigendom (IP) blijft aan de serverzijde.
- **Documenteer de herkomst** — het `provenance`-veld in het [plug-inmanifest](/docs/reference/plugin-spec) dient elke gebruikte bron, de bijbehorende licentie en de oorsprong ervan te vermelden.

:::warning OCAP® is een geregistreerd handelsmerk
OCAP® is een geregistreerd handelsmerk van het First Nations Information Governance Centre. Het is specifiek van toepassing op First Nations in Canada. De principes hebben een bredere relevantie, maar het handelsmerk en de bestuursbevoegdheid behoren toe aan het FNIGC.
:::

---

## CARE-principes

De **CARE-principes voor Inheems Databeheer** (CARE Principles for Indigenous Data Governance) zijn ontwikkeld door de [Global Indigenous Data Alliance](https://www.gida-global.org/care) (GIDA) als aanvulling op de FAIR-dataprincipes. FAIR stelt dat data Findable (Vindbaar), Accessible (Toegankelijk), Interoperable (Interoperabel) en Reusable (Herbruikbaar) moet zijn. CARE stelt dat dit niet voldoende is — databeheer moet ook inheemse rechten centraal stellen.

| Principe | Toepassing |
|-----------|------------|
| **Collective Benefit** (Collectief voordeel) | Vertaaltools dienen in de eerste plaats de taalgemeenschap ten goede te komen. Leaderboard-scores zijn een middel om methoden te verbeteren, niet om commerciële waarde te onttrekken aan gemeenschapstalen. |
| **Authority to Control** (Zeggenschap) | Gemeenschappen hebben de bevoegdheid om te bepalen hoe hun taaldata wordt verzameld, gebruikt en gedeeld. Een hoge leaderboard-score verleent geen toestemming om vertalingen te publiceren. |
| **Responsibility** (Verantwoordelijkheid) | Onderzoekers en ontwikkelaars die met inheemse taaldata werken, hebben de verantwoordelijkheid om relaties op te bouwen, toestemming te verkrijgen en voordelen te delen. |
| **Ethics** (Ethiek) | De rechten en het welzijn van inheemse volkeren moeten de primaire zorg zijn. Vertaalmethoden dienen *met* gemeenschappen te worden ontwikkeld, niet *over* hen. |

---

## Te Mana Raraunga — Māori Datasoevereiniteit

**Te Mana Raraunga** is het [Māori Data Sovereignty Network](https://www.temanararaunga.maori.nz/). Het stelt dat Māori-data — inclusief taaldata — een taonga (schat) is die onderworpen is aan de principes van het Verdrag van Waitangi en tikanga Māori (Māori gewoonterecht).

Belangrijkste principes:

| Principe | Betekenis |
|-----------|---------|
| **Rangatiratanga** (Autoriteit) | Māori hebben een inherent recht om autoriteit uit te oefenen over hun data, inclusief taaldata. |
| **Whakapapa** (Relaties) | Data heeft een oorsprong en connecties. Taaldata draagt de relaties en kennis in zich van de mensen die deze hebben gecreëerd. |
| **Whanaungatanga** (Verplichtingen) | Degenen die Māori-data bezitten of verwerken, hebben wederzijdse verplichtingen ten aanzien van de gemeenschappen waaruit deze afkomstig is. |
| **Kotahitanga** (Collectief voordeel) | Māori-data dient te worden gebruikt voor het collectieve voordeel van de Māori. |
| **Manaakitanga** (Wederkerigheid) | Het gebruik van Māori-data dient gepaard te gaan met zorg, respect en wederkerigheid. |
| **Kaitiakitanga** (Voogdij) | Databewaarders hebben de plicht om de data te beschermen en ervoor te zorgen dat deze op de juiste wijze wordt gebruikt. |

Deze principes zijn van toepassing op te reo Māori (de Māori-taal) en op al het computationele werk waarbij Māori-taaldata betrokken is.

---

## Wat dit betekent voor gebruikers van rosetta

### Voor standaardtalen (Frans, Japans, Spaans...)

Gebruik rosetta op de normale manier. Deze talen beschikken over grote, openbaar beschikbare corpora, gevestigde vertaal-API's en geen soevereiniteitskwesties. U kunt naar wens vertalen, synchroniseren en publiceren.

### Voor inheemse en low-resource talen

De situatie is fundamenteel anders:

1. **Vraag eerst om toestemming.** Voordat u een vertaalmethode voor een inheemse taal bouwt, dient u een relatie op te bouwen met de gemeenschap. Een methode die zonder betrokkenheid van de gemeenschap is gebouwd — hoe technisch indrukwekkend ook — mag niet worden gepubliceerd of gedistribueerd.

2. **Gebruik de `api`-methode.** Host de vertaalpipeline op infrastructuur die door de gemeenschap wordt beheerd. De `api`-methode in rosetta is hiervoor ontworpen: het verstuurt sleutels en ontvangt vertalingen terug zonder de prompts, woordenboeken of coachingdata bloot te leggen die de methode laten werken.

    ```json title="Community-controlled setup"
    {
      "pairs": {
        "en:crk": {
          "method": "api",
          "endpoint": "https://api.community-server.example/translate"
        }
      }
    }
    ```

3. **Documenteer alles.** Gebruik het `provenance`-veld in uw plug-inmanifest om elke bron, de bijbehorende licentie en of deze met toestemming van de gemeenschap is verstrekt, te vermelden.

4. **Scores zijn geen licenties.** Een hoge score op het leaderboard bewijst dat een methode technisch goed werkt. Het verleent geen toestemming om vertalingen te publiceren, de plug-in te distribueren of de methode te commercialiseren. De gemeenschap beslist.

5. **Deel de methode, niet de data.** Als u een techniek ontwikkelt die goed werkt (bijv. "FST-gated LLM met gecoachte prompts"), deel dan de *architectuur* en *aanpak* op het leaderboard. De gemeenschap behoudt de controle over de taalkundige data die het voor hun specifieke taal laat werken.

---

## De `api`-methode en soevereiniteit

De `api` [vertaalmethode](/docs/guides/translation-methods) bestaat specifiek om datasoevereiniteit te ondersteunen. Dit is waarom:

| Aspect | Andere methoden | `api`-methode |
|--------|--------------|-------------|
| **Waar prompts zich bevinden** | In de configuratiebestanden van rosetta (zichtbaar voor alle ontwikkelaars) | Op de server van de gemeenschap (privé) |
| **Waar coachingdata zich bevindt** | In de `.rosetta/coaching/`-map (vastgelegd in git) | Op de server van de gemeenschap (privé) |
| **Waar woordenboeken zich bevinden** | In de plug-inmap (gedistribueerd met de plug-in) | Op de server van de gemeenschap (privé) |
| **Wie de pipeline beheert** | Degene die `rosetta sync` uitvoert | De gemeenschap die de API beheert |
| **Wat rosetta ziet** | Alles | Sleutels erin, vertalingen eruit |

De `api`-methode is een bewuste architecturale keuze. Het is een "dumb pipe" omdat de intellectuele eigendom (IP) — de taalkundige kennis, de grammaticaregels, de zorgvuldig samengestelde coachingvoorbeelden — toebehoort aan de gemeenschap, niet aan de tool.

Zie [Een methode aanbieden via API](/docs/guides/serving-a-method) voor implementatiedetails.

---

## Verder lezen

- [First Nations Information Governance Centre — OCAP®](https://fnigc.ca/ocap-training/)
- [Global Indigenous Data Alliance — CARE-principes](https://www.gida-global.org/care)
- [Te Mana Raraunga — Māori Data Sovereignty Network](https://www.temanararaunga.maori.nz/)
- [USIDSN — United States Indigenous Data Sovereignty Network](https://usindigenousdata.org/)

---

## Zie ook

- [Een low-resource taal ondersteunen](/docs/guides/low-resource-languages) — de technische gids met OCAP-context
- [Vertaalmethoden](/docs/guides/translation-methods) — de `api`-methode en hoe deze IP beschermt
- [Een methode aanbieden via API](/docs/guides/serving-a-method) — het hosten van een door de gemeenschap beheerde pipeline
- [Plug-inspecificatie](/docs/reference/plugin-spec) — het `provenance`-veld voor brontoeschrijving
- [Kookboek: FST-Gated Pipeline](/docs/tutorials/fst-gated-pipeline) — het bouwen van een pipeline die een gemeenschap zelf kan hosten