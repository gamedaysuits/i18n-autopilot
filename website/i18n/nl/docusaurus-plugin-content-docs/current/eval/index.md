---
sidebar_position: 1
title: "MT-evaluatie"
---
# MT-evaluatie

rosetta bevat een evaluatieraamwerk voor automatische vertaling (MT), ontworpen voor **reproduceerbare benchmarking** van vertaalmethoden — in het bijzonder voor bronschaarse en inheemse talen waarvoor geen standaard MT-benchmarks bestaan en kwaliteitsclaims moeilijk te verifiëren zijn.

---

## Het Leaderboard

Het middelpunt is het **[Method Leaderboard](/leaderboard)** — een live, door Supabase ondersteund scorebord waar onderzoekers en communityleden vertaalmethoden indienen en vergelijken met behulp van gefingerprinte, reproduceerbare evaluaties.

Elke inzending bevat:

- **Gefingerprinte pijplijn** — gekoppeld aan een specifieke Git-commit en config-hash, zodat resultaten te herleiden zijn naar de exacte code die ze heeft geproduceerd
- **Geversioneerde dataset** — voorzien van een content-hash en versiebeheer; scores zijn alleen vergelijkbaar binnen dezelfde datasetversie
- **Gestandaardiseerde metrieken** — alle scores worden berekend door het gedeelde evaluatie-harness, waardoor implementatieverschillen worden geëlimineerd
- **Vertrouwensniveaus** — self-benchmarked, GDS Verified of Community Validated
- **Kostenregistratie** — API-kosten per inzending, zodat de afweging tussen kosten en kwaliteit transparant is

Het leaderboard houdt momenteel drie metrieken bij:

| Metriek | Type | Wat het meet |
|--------|------|------------------|
| **chrF++** | Character n-gram F-score | Primaire kwaliteitsmetriek — correleert goed met menselijke beoordeling, vooral voor morfologisch rijke talen |
| **Exact Match** | Aandeel perfecte overeenkomsten | Strikte nauwkeurigheid — hoe vaak is de vertaling exact de gouden standaard? |
| **FST Acceptance** | Morfologisch acceptatiepercentage | Voor methoden met finite-state transducer-verificatie — welk deel van de uitvoer is morfologisch geldig? |

**[→ Bekijk het leaderboard](/leaderboard)**

---

## Beschikbare datasets

### EDTeKLA Development Set v1

De eerste evaluatiedataset, gebouwd voor de vertaling van Engels naar Plains Cree (SRO). Gemaakt door de [EdTeKLA-onderzoeksgroep](https://spaces.facsci.ualberta.ca/edtekla/) aan de University of Alberta.

| Eigenschap | Waarde |
|----------|-------|
| **ID** | `edtekla-dev-v1` |
| **Talenpaar** | EN → CRK (Plains Cree, SRO-spelling) |
| **Aantal invoeren** | 124 |
| **Licentie** | [CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/) |
| **Herkomst** | `gold_standard` (geverifieerd door sprekers), `textbook` (gepubliceerd educatief materiaal) |

### FLORES+ Devtest

Een meertalige benchmark met brede dekking, beheerd door het [Open Language Data Initiative (OLDI)](https://huggingface.co/datasets/openlanguagedata/flores_plus).

| Eigenschap | Waarde |
|----------|-------|
| **Talenparen** | EN → 39 talen (alle in rosetta geregistreerde talen) |
| **Aantal invoeren** | 1.012 zinnen per taal |
| **Licentie** | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/) |
| **Bron** | Oorspronkelijk Meta FLORES-200, nu beheerd door OLDI |
| **Locatie** | Vooraf geëxtraheerde fixtures op `test/benchmark/fixtures/` in de hoofdrepository van rosetta |

Zie [Evaluatiedatasets](/docs/eval/datasets) voor het volledige datasetschema, de moeilijkheidsgraden en hoe u uw eigen dataset kunt maken.

:::danger TRAIN NIET op evaluatiedata

**Deze datasets zijn uitsluitend bedoeld voor evaluatie.** Methoden die zijn getraind, gefinetuned, via few-shot prompting zijn gestuurd of op een andere manier zijn blootgesteld aan evaluatiedata, zullen kunstmatig verhoogde scores opleveren en worden **gediskwalificeerd voor het leaderboard.**

Dit is geen suggestie — het is de allerbelangrijkste regel voor evaluatie-integriteit. Gebruik afzonderlijke corpora voor training. Evaluatiesets moeten tijdens de ontwikkeling ongezien blijven voor uw model.

Als u gebruikmaakt van coachingdata of few-shot voorbeelden, moeten deze afkomstig zijn uit **volledig gescheiden bronnen**. Bij twijfel dient u deze niet op te nemen.
:::

:::warning LLM-nondeterminisme

LLM-uitvoer is nondeterministisch. Scores vertegenwoordigen momentopnamen onder specifieke modelversies en API-configuraties. Modelaanbieders kunnen gewichten, decoderingsstrategieën of veiligheidsfilters op elk moment bijwerken, wat kan leiden tot scoreverschuivingen tussen uitvoeringen. Het leaderboard registreert de exacte model-slug en tijdstempel voor elke inzending.
:::

---

## Wat maakt een methode goed

Niet alle methoden zijn gelijk. Hier is wat rigoureus werk onderscheidt van opgeblazen scores.

### Kenmerken van een sterke methode

- **Strikte scheiding van trainings- en evaluatiedata** — uw methode heeft de evaluatieset nooit gezien tijdens de ontwikkeling, tuning, prompt engineering of de selectie van few-shot voorbeelden
- **Reproduceerbaar** — iemand anders kan uw repo klonen, het harness uitvoeren en dezelfde scores behalen (binnen de grenzen van LLM-nondeterminisme)
- **Gedocumenteerd** — uw [method card](/docs/eval/methods) beschrijft wat uw methode doet, welke tools deze gebruikt en wat de beperkingen zijn
- **Eerlijk over de reikwijdte** — als uw methode slechts voor één talenpaar werkt, vermeld dit dan; als deze verslechtert bij bepaalde morfologische patronen, documenteer dat dan
- **Community-bewust** — voor inheemse talen respecteert uw methode datasoevereiniteit. U heeft overlegd met taalgemeenschappen of uitsluitend data met een open licentie gebruikt

### Rode vlaggen (wat leidt tot diskwalificatie)

| Rode vlag | Waarom het een probleem is |
|----------|--------------------|
| Trainen op evaluatiedata | Doet het doel van evaluatie volledig teniet. Opgeblazen scores misleiden iedereen. |
| Cherry-picking van resultaten | Tien keer uitvoeren en de beste run indienen zonder de andere te vermelden |
| Niet-vermelde nabewerking | Handmatig corrigeren van uitvoer voorafgaand aan de scoring |
| Gecontamineerde coachingdata | Voorbeelden uit de evaluatieset gebruiken als few-shot prompts of woordenboekvermeldingen |
| Commerciële gereedheid claimen zonder herkomst | Als uw methode CC BY-NC-SA-data gebruikt, is deze niet commercieel gereed |

### Kwaliteitsniveaus in het leaderboard

Het leaderboard ondersteunt drie vertrouwensniveaus:

| Niveau | Betekenis | Hoe u dit verkrijgt |
|------|---------|---------------|
| **Self-benchmarked** | U heeft het harness zelf uitgevoerd en de resultaten ingediend | Open een PR met uw run card |
| **GDS Verified** | De beheerders van rosetta hebben uw resultaten gereproduceerd | Dien uw methode in als een installeerbare plug-in |
| **Community Validated** | Onafhankelijke communityleden hebben de resultaten gereproduceerd | Binnenkort beschikbaar |

---

## Hoe in te dienen

1. **Bouw uw methode** — zie [Een methode bouwen](/docs/eval/methods) voor de methode-interface
2. **Voer het harness uit** — zie [Eval Harness](/docs/eval/harness) voor installatie en gebruik
3. **Genereer een run card** — het harness produceert een JSON run card met uw scores, fingerprint en metadata
4. **Open een PR** — dien uw run card in bij de [eval harness-repository](https://github.com/gamedaysuits/gds-mt-eval-harness)
5. **Verschijn op het leaderboard** — zodra deze is gemerged, verschijnen uw resultaten op het [Method Leaderboard](/leaderboard)

---

## Toekomstige ontwikkelingen

- **FLORES+ modelvergelijkingsruns** — systematische evaluatie van frontier-modellen (GPT-5.5, Claude Opus 4.7, Gemini 3.1 Pro, enz.) voor alle 39 rosetta-talen
- **Meer talenparen** — Quechua, Inuktitut en andere bronschaarse talen naarmate door de community geverifieerde datasets beschikbaar komen
- **Dataset-import** — tooling om externe evaluatiedatasets (WMT, Tatoeba, enz.) te converteren naar het rosetta-evaluatieformaat
- **Geautomatiseerde heruitvoeringen** — het detecteren van wijzigingen in modelversies en het opnieuw uitvoeren van benchmarks om scoreverschuivingen bij te houden

---

## Zie ook

- **[Method Leaderboard](/leaderboard)** — live scores en inzendingen
- **[Eval Harness](/docs/eval/harness)** — hoe u evaluaties uitvoert
- **[Evaluatiedatasets](/docs/eval/datasets)** — datasetformaat en beschikbare datasets
- **[Een methode bouwen](/docs/eval/methods)** — de specificatie van de methode-interface
- **[Run Card-specificatie](/docs/eval/run-card)** — het JSON-schema van de run card
- **[Een bronschaarse taal ondersteunen](/docs/guides/low-resource-languages)** — de bredere context voor het bestaan van dit raamwerk