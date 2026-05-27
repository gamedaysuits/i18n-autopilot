---
sidebar_position: 1
slug: /
title: "Introductie"
---
# i18n-rosetta

Een volledig aanpasbaar framework voor internationalisatie. Eén commando vertaalt uw locale-bestanden. Eén configuratie beheert elke methode, elk model en elk talenpaar. En als de ingebouwde methoden niet volstaan — bouw uw eigen methode, bewijs dat deze werkt en implementeer deze.

```bash
npx i18n-rosetta sync
```

rosetta detecteert automatisch uw locale-bestanden, het formaat en de doeltalen. Het vertaalt wat ontbreekt, slaat over wat al gedaan is, valideert elk resultaat en schrijft schone output. Dat is het startpunt.

---

## Waarom schrijft u niet gewoon zelf een script?

U zou een snelle loop kunnen schrijven die Google Translate aanroept voor elke key. De meeste ontwikkelaars doen dit — het kost ongeveer 30 regels code. Hier gaat het echter mis:

- **Geen detectie van wijzigingen.** Update een Engelse string — de vertaling blijft voor altijd verouderd. rosetta volgt elke bronwaarde met SHA-256 hashes en vertaalt alleen wat er is gewijzigd.
- **Geen batchverwerking.** Eén API-aanroep per key betekent 200 keys = 200 round trips. rosetta bundelt op intelligente wijze (configureerbaar, standaard 30 keys/batch voor LLM, 128 voor Google).
- **Geen caching.** Elke synchronisatie vertaalt alles opnieuw. Het Translation Memory van rosetta slaat vertalingen op in de cache op basis van brontekst + locale + methode — als u de synchronisatie opnieuw uitvoert na één gewijzigde key, wordt alleen die ene key vertaald, niet het hele bestand.
- **Geen kwaliteitscontrole (quality gate).** Machinevertalingen hallucineren, kopiëren de brontekst of genereren output in het verkeerde schrift. rosetta valideert elke vertaling voordat deze wordt weggeschreven — verkeerd schrift, onnodige lengtetoename (length inflation) en gekopieerde bronteksten worden gedetecteerd en geweigerd.
- **Geen formaatbewustzijn.** Hardcoded voor JSON? rosetta verwerkt JSON, TOML, YAML en Hugo Markdown (frontmatter + body) met automatische detectie.
- **Geen controle over de methode.** Elk talenpaar krijgt dezelfde methode. Met rosetta kunt u Google Translate gebruiken voor het Frans, een LLM voor het Japans en een aangepaste, door de community gehoste pipeline voor het Cree — in hetzelfde configuratiebestand.

rosetta is de productie-versie van dat script.

---

## Wat maakt het anders

### Elke methode is een plugin

De vertaalmethode is **configureerbaar per talenpaar**. Combineer Google Translate, LLM's, gecoachte prompts en aangepaste API's in hetzelfde project:

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

Frans krijgt Google Translate (snel, goedkoop). Japans krijgt een premium LLM (genuanceerd). Plains Cree krijgt een gecoachte plugin met grammaticaregels, woordenboeken en morfologische validatie. Hetzelfde `sync` commando. Dezelfde kwaliteitscontrole. Dezelfde CLI.

### Bewijs het

Denkt u dat uw methode Engels naar het Spaans kan vertalen? Turks naar het Azerbeidzjaans? Engels naar het Cree?

**Bewijs het.** De bijbehorende [eval harness](https://mtevalarena.org/docs/specifications/harness) benchmarkt elke vertaalmethode met reproduceerbare, gefingerprinte scores. Het [leaderboard](/leaderboard) houdt elke inzending bij.

De eval harness en de productie-CLI delen dezelfde plugin-interface. Een methode die goed scoort in de harness kan in productie worden gebruikt — mits de gemeenschap wiens taal het dient hiervoor toestemming geeft. Voor inheemse en low-resource talen is die toestemming van groot belang. Zie [Data Sovereignty](https://mtevalarena.org/docs/sovereignty/data-sovereignty).

```bash
# Benchmark your method (in the eval harness repo)
cd gds-mt-eval-harness
python eval/baseline_experiment.py --dataset data/edtekla-dev-v1.json --submit

# Use it locally
npx i18n-rosetta sync
```

Dezelfde plugin. Inpluggen en testen.

### De volledige toolkit

rosetta is niet zomaar `sync`. Het is een complete i18n-pipeline:

| Commando | Wat het doet |
|---------|-------------|
| `sync` | Vertaal ontbrekende, verouderde en fallback-keys |
| `watch` | Automatisch synchroniseren wanneer uw bronbestand wijzigt |
| `lint` | Scan broncode op hardcoded strings |
| `wrap` | Hardcoded strings automatisch inpakken in `t()`-aanroepen |
| `audit` | Toon alle onvertaalde `[EN]` fallback-waarden |
| `integrity` | Detecteer corruptie van placeholders, coderingsproblemen en volledigheid van ICU-meervouden |
| `seo` | Genereer hreflang-tags, sitemaps en JSON-LD-schema's |
| `status` | Toon configuratie van talenparen, plugins en benchmarkscores |
| `provenance` | Controleer licenties van vertaalbronnen |
| `plugin` | Installeer, verwijder en toon methode-plugins |
| `fonts` | Download webfonts voor PUA-scriptconverters |
| `tm` | Beheer de Translation Memory-cache (statistieken, wissen, per locale) |
| `xliff` | Exporteer/importeer XLIFF 1.2 voor beoordeling door professionele vertalers |

Drie hiervan — `lint`, `sync`, `audit` — vormen een CI-pipeline die hardcoded strings detecteert, deze vertaalt en de build laat falen als een locale onvolledig is.

---

## De Arena

Het [Method Leaderboard](/leaderboard) is het scorebord. Elke inzending wordt gefingerprint naar een Git-commit, geversioneerd naar een specifieke dataset en gescoord door dezelfde harness. Iedereen kan een inzending doen.

**Wat kunt u bewijzen?** De harness accepteert JSON. Plugins accepteren JSON. Elke methode die JSON produceert, kan worden getest:

| Aanpak | Voorbeeld |
|----------|---------|
| **Gecoachte LLM** | Injecteer grammaticaregels en woordenboeken in de prompt van een frontier-model |
| **Gefinetuned model** | Train een open model op parallelle tekst — maar niet op de evaluatiedata |
| **FST-gated pipeline** | LLM genereert → finite-state transducer valideert morfologie → probeer opnieuw |
| **Gekoppelde modellen** | Model A maakt een concept → Model B doet post-editing → Model C scoort |
| **Woordenboek + LLM** | Forceer bekende termen uit een woordenboek, laat de LLM de rest afhandelen |
| **Evolutionair** | Genereer kandidaten, scoor ze, muteer de beste, herhaal |
| **Gedeeltelijke vertaling** | Vertaal een steekproef handmatig, bewijs dat uw LLM overeenkomt, vertaal de rest automatisch |

Finetune modellen. Implementeer evolutionaire algoritmen. Test antwoorden van studenten op taalexamens. Bouw lookup-tabellen. Koppel drie modellen aan elkaar. Zolang uw methode JSON produceert, scoort de harness het en voert het framework het uit.

:::danger De enige regel
**Train niet op de evaluatiedata.** Methoden die zijn blootgesteld aan de benchmarkdataset worden gediskwalificeerd. Finetune op wat u maar wilt. Maar niet op de testset.
:::

Dit is een open uitnodiging. Als u werkt met een low-resource taal — als onderzoeker, lid van de gemeenschap, student of gewoon iemand die erom geeft — bouw een methode, voer de harness uit en claim de topscore. Het probleem is onopgelost. De infrastructuur is aanwezig.

**[→ Bekijk het leaderboard](/leaderboard)**

---

## Volgende stappen

**Aan de slag:**
- [Installatie](/docs/getting-started/installation) — Binnen 2 minuten ingesteld
- [Snelstart](/docs/getting-started/quick-start) — Voer uw eerste synchronisatie uit
- [Ondersteunde talen](/docs/reference/supported-languages) — Wat er standaard beschikbaar is

**Uw configuratie aanpassen:**
- [Vertaalmethoden](/docs/guides/translation-methods) — Kies de juiste methode per talenpaar
- [Translation Memory](/docs/concepts/translation-memory) — Hoe caching u geld bespaart
- [Configuratie](/docs/getting-started/configuration) — Volledige configuratiereferentie
- [Hugo meertalige site](/docs/tutorials/hugo-multilingual-site) — Vertaling van Markdown-content

**Dieper ingaan op de materie:**
- [Werken met professionele vertalers](/docs/guides/professional-translators) — XLIFF export/import workflow
- [Data Sovereignty](https://mtevalarena.org/docs/sovereignty/data-sovereignty) — Principes van OCAP, CARE en Māori Data Sovereignty
- [Ondersteun een low-resource taal](https://mtevalarena.org/docs/community/low-resource-languages) — De uitdaging waar het allemaal mee begon
- [Cookbook: FST-gated pipeline](https://mtevalarena.org/docs/tutorials/fst-gated-pipeline) — Bouw een decompositie-pipeline
- [MT-evaluatie](https://mtevalarena.org/docs/leaderboard/rules) — Hoe de harness en het leaderboard werken
- [Method Leaderboard](/leaderboard) — Live scores en inzendingen