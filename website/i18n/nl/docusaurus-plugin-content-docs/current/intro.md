---
sidebar_position: 1
slug: /
title: "Introductie"
---
# i18n-rosetta

Een volledig aanpasbaar internationalisatie-framework. Eén commando vertaalt uw locale-bestanden. Eén configuratie beheert elke methode, elk model en elk talenpaar. En als de ingebouwde methoden niet voldoende zijn — bouw uw eigen methode, bewijs dat deze werkt en deploy deze.

```bash
npx i18n-rosetta sync
```

rosetta detecteert automatisch uw locale-bestanden, het formaat en de doeltalen. Het vertaalt wat ontbreekt, slaat over wat al gedaan is, valideert elk resultaat en schrijft schone output. Dat is het startpunt.

---

## Waarom schrijft u niet gewoon zelf een script?

U zou een snelle loop kunnen schrijven die Google Translate aanroept voor elke key. De meeste developers doen dit — het kost ongeveer 30 regels. Hier gaat het mis:

- **Geen change detection.** Update een Engelse string — de vertaling blijft voor altijd verouderd. rosetta volgt elke bronwaarde met SHA-256 hashes en vertaalt alleen opnieuw wat er is veranderd.
- **Geen batching.** Eén API call per key betekent 200 keys = 200 round trips. rosetta bundelt intelligent (configureerbaar, standaard 80 keys/batch voor LLM, 128 voor Google).
- **Geen caching.** Elke sync vertaalt alles opnieuw. De Translation Memory van rosetta slaat vertalingen op in de cache op basis van brontekst + locale + methode — het opnieuw uitvoeren van een sync na de wijziging van één key vertaalt alleen die ene key, niet het hele bestand.
- **Geen quality gate.** Machine translation hallucineert, echoot de bron terug of geeft output in het verkeerde script. rosetta valideert elke vertaling voordat deze wordt weggeschreven — verkeerd script, lengte-inflatie en bron-echo's worden opgevangen en afgewezen.
- **Geen format awareness.** Hardcoded naar JSON? rosetta verwerkt JSON, TOML, YAML en Hugo Markdown (frontmatter + body) met automatische detectie.
- **Geen method control.** Elk paar krijgt dezelfde methode. Met rosetta kunt u Google Translate gebruiken voor het Frans, een LLM voor het Japans en een aangepaste community-hosted pipeline voor het Cree — in hetzelfde configuratiebestand.

rosetta is de productie-versie van dat script.

---

## Wat maakt het anders

### Elke methode is een plugin

De vertaalmethode is **configureerbaar per talenpaar**. Combineer Google Translate, LLM's, coached prompts en custom API's in hetzelfde project:

```json title="i18n-rosetta.config.json"
{
  "version": 3,
  "pairs": {
    "en:fr": { "method": "google-translate" },
    "en:ja": { "method": "llm", "model": "google/gemini-2.5-pro" },
    "en:crk": { "methodPlugin": "crk-coached-v1" }
  }
}
```

Frans krijgt Google Translate (snel, goedkoop). Japans krijgt een premium LLM (genuanceerd). Plains Cree krijgt een coached plugin met grammaticaregels, woordenboeken en morfologische validatie. Hetzelfde `sync` commando. Dezelfde quality gate. Dezelfde CLI.

### Bewijs het

Denkt u dat uw methode Engels naar het Spaans kan vertalen? Turks naar het Azerbeidzjaans? Engels naar het Cree?

**Bewijs het.** De bijbehorende [eval harness](https://mtevalarena.org/docs/specifications/harness) benchmarkt elke vertaalmethode met reproduceerbare, gefingerprinte scores. Het [leaderboard](/leaderboard) houdt elke inzending bij.

De eval harness en de productie-CLI delen dezelfde plugin-interface. Een methode die goed scoort in de harness kan in productie worden gebruikt — mits de gemeenschap wiens taal het bedient, toestemming geeft. Voor inheemse en low-resource talen is die toestemming van belang. Zie [Data Sovereignty](https://mtevalarena.org/docs/sovereignty/data-sovereignty).

```bash
# Benchmark your method (in the eval harness repo)
cd gds-mt-eval-harness
python eval/baseline_experiment.py --dataset data/edtekla-dev-v1.json --submit

# Use it locally
npx i18n-rosetta sync
```

Dezelfde plugin. Inpluggen en testen.

### De volledige toolkit

rosetta is niet zomaar `sync`. Het is een complete i18n pipeline:

| Commando | Wat het doet |
|---------|-------------|
| `sync` | Vertaalt ontbrekende en verouderde keys (met post-sync verificatie) |
| `watch` | Automatische sync wanneer uw bronbestand wijzigt |
| `lint` | Scant broncode op hardcoded strings |
| `wrap` | Wrapt hardcoded strings automatisch in `t()` calls |
| `audit` | Toont een lijst van alle `[EN]` fallback markers van eerdere runs |
| `verify` | Verifieert of vertalingen aanwezig en correct zijn (CI gate) |
| `integrity` | Detecteert corruptie van placeholders, coderingsproblemen en ICU plural completeness |
| `seo` | Genereert hreflang tags, sitemaps en JSON-LD schema |
| `status` | Toont de configuratie van paren, plugins en benchmarkscores |
| `provenance` | Voert een audit uit op de licenties van vertaalresources |
| `plugin` | Installeert, verwijdert en toont methode-plugins |
| `fonts` | Downloadt web fonts voor PUA script converters |
| `tm` | Beheert de Translation Memory cache (statistieken, wissen, per-locale) |
| `xliff` | Exporteert/importeert XLIFF 1.2 voor beoordeling door professionele vertalers |

Vier hiervan — `lint`, `sync`, `verify`, `audit` — vormen een CI pipeline die hardcoded strings opvangt, deze vertaalt, de correctheid verifieert en de build laat falen als een locale onvolledig is.

---

## De Arena

Het [Method Leaderboard](/leaderboard) is het scorebord. Elke inzending wordt gefingerprint naar een Git commit, geversioneerd naar een specifieke dataset en gescoord door dezelfde harness. Iedereen kan een inzending doen.

**Wat kunt u bewijzen?** De harness accepteert JSON. Plugins accepteren JSON. Elke methode die JSON produceert, kan worden getest:

| Aanpak | Voorbeeld |
|----------|---------|
| **Coached LLM** | Injecteer grammaticaregels en woordenboeken in de prompt van een frontier model |
| **Fine-tuned model** | Train een open model op parallelle tekst — alleen niet op de eval data |
| **FST-gated pipeline** | LLM genereert → finite-state transducer valideert morfologie → opnieuw proberen |
| **Chained models** | Model A maakt een concept → Model B doet post-editing → Model C scoort |
| **Dictionary + LLM** | Forceer bekende termen uit een woordenboek, laat de LLM de rest afhandelen |
| **Evolutionary** | Genereer kandidaten, scoor ze, muteer de beste, herhaal |
| **Partial translation** | Vertaal een sample handmatig, bewijs dat uw LLM overeenkomt, vertaal de rest automatisch |

Fine-tune modellen. Deploy evolutionaire algoritmen. Test antwoorden van studenten op taalexamens. Bouw lookup tables. Koppel drie modellen aan elkaar. Zolang uw methode JSON produceert, scoort de harness deze en voert het framework deze uit.

:::danger De enige regel
**Train niet op de evaluatiedata.** Methoden die zijn blootgesteld aan de benchmark dataset worden gediskwalificeerd. Fine-tune op wat u maar wilt. Alleen niet op de testset.
:::

Dit is een open uitnodiging. Als u werkt met een low-resource taal — als onderzoeker, lid van de gemeenschap, student of gewoon iemand die erom geeft — bouw een methode, voer de harness uit en claim de topscore. Het probleem is nog onopgelost. De infrastructuur is hier.

**[→ Bekijk het leaderboard](/leaderboard)**

---

## Volgende stappen

**Aan de slag:**
- [Installatie](/docs/getting-started/installation) — Binnen 2 minuten ingesteld
- [Quick Start](/docs/getting-started/quick-start) — Voer uw eerste sync uit
- [Ondersteunde talen](/docs/reference/supported-languages) — Wat out-of-the-box beschikbaar is

**Uw setup aanpassen:**
- [Vertaalmethoden](/docs/guides/translation-methods) — Kies de juiste methode per paar
- [Translation Memory](/docs/concepts/translation-memory) — Hoe caching u geld bespaart
- [Configuratie](/docs/getting-started/configuration) — Volledige referentie voor de configuratie
- [Hugo Multilingual Site](/docs/tutorials/hugo-multilingual-site) — Vertaling van Markdown-content

**Verdieping:**
- [Werken met professionele vertalers](/docs/guides/professional-translators) — XLIFF export/import workflow
- [Data Sovereignty](https://mtevalarena.org/docs/sovereignty/data-sovereignty) — OCAP, CARE en Māori Data Sovereignty principes
- [Ondersteun een low-resource taal](https://mtevalarena.org/docs/community/low-resource-languages) — De uitdaging waar het allemaal mee begon
- [Cookbook: FST-Gated Pipeline](https://mtevalarena.org/docs/tutorials/fst-gated-pipeline) — Bouw een decompositie-pipeline
- [MT Evaluatie](https://mtevalarena.org/docs/leaderboard/rules) — Hoe de harness en het leaderboard werken
- [Method Leaderboard](/leaderboard) — Live scores en inzendingen