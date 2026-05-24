---
sidebar_position: 5
title: "Ondersteun een low-resource taal"
---
# Ondersteuning voor een Low-Resource Taal

:::info Status: In actieve ontwikkeling
De ondersteuning voor Plains Cree (nêhiyawêwin) is momenteel in ontwikkeling. De tools, de evaluatie-harness en het leaderboard die hier worden beschreven, zijn echt en vandaag al bruikbaar, maar de vertaalpijplijn voor Cree is nog niet uitgebracht. Zodra dit gebeurt, zal dit dienen als blauwdruk voor andere polysynthetische en low-resource talen met FST-infrastructuur.
:::

## Het onopgeloste probleem

Google Translate ondersteunt ~130 talen. Er worden er meer dan 7.000 gesproken op aarde. Voor duizenden talen — waaronder veel inheemse talen met actieve sprekersgemeenschappen — bestaat er geen commerciële vertaal-API, is er geen groot parallel corpus samengesteld en produceert geen enkel vooraf getraind model betrouwbare output.

Dit is geen kloof die vanzelf zal dichten. Low-resource talen zijn low-resource *omdat* de economie van commerciële MT (Machine Translation) hen niet bereikt. De sprekers die deze tools het hardst nodig hebben, zijn dezelfde gemeenschappen voor wie de kans het kleinst is dat deze voor hen worden gebouwd.

**rosetta is gebouwd om daar verandering in te brengen.**

Het [Method Leaderboard](/leaderboard) is een open uitdaging: bouw de beste vertaalmethode voor een onderbediende taal, bewijs dit met reproduceerbare evaluaties en claim de topscore. Iedereen ter wereld kan bijdragen — taalkundigen, ML-onderzoekers, taalmedewerkers uit de gemeenschap, studenten, hobbyisten. Het probleem is onopgelost. De infrastructuur is aanwezig. Het leaderboard wacht op u.

---

## Waarom dit moeilijk is: Polysynthetische morfologie

De meeste commerciële MT-systemen zijn ontworpen voor talen zoals Engels, Frans en Chinees — talen waarbij woorden relatief kort zijn en zinnen worden opgebouwd uit afzonderlijke tokens. Maar veel inheemse talen, waaronder Plains Cree, zijn **polysynthetisch**: een enkel woord kan coderen wat het Engels als een hele zin uitdrukt.

### Het voorbeeld van Cree

Neem het Plains Cree woord:

> **ê-kî-nitawi-kîskinwahamâkosiyân**
> *"toen ik naar school ging"*

Dat is **één woord**. Het codeert de tijd (verleden), richting (gaan naar), de stam (leren), de wijs/stem (passief/wederkerend) en de persoon (eerste persoon enkelvoud). Een LLM die voornamelijk op het Engels is getraind, heeft geen intuïtie voor dit soort morfologische dichtheid.

De uitdagingen stapelen zich op:

| Uitdaging | Wat het betekent |
|-----------|--------------|
| **Morfologische complexiteit** | Een enkele werkwoordstam kan duizenden geldige verbogen vormen genereren door middel van prefixatie, suffixatie en circumfixatie |
| **Onderscheid levend/levenloos (animate/inanimate)** | Zelfstandige naamwoorden zijn grammaticaal levend of levenloos — dit beïnvloedt de werkwoordsvervoeging, aanwijzende voornaamwoorden en meervoudsvorming. De classificatie volgt niet altijd de biologische levendigheid (*askiy* "aarde" is levend; *maskisin* "schoen" is ook levend) |
| **Obviatie** | Verwijzingen in de derde persoon worden gerangschikt op nabijheid/saillantie. Het onderscheid tussen "proximaat" en "obviatief" heeft geen Nederlands equivalent |
| **Schaarse trainingsdata** | LLM's hebben heel weinig Plains Cree-tekst gezien. Wat ze hebben gezien, kan dialecten (Y-dialect, TH-dialect) of spellingen (SRO vs. syllabisch schrift) door elkaar halen |
| **Geen commerciële baseline** | Google Translate levert niets bruikbaars op. Er is geen kant-en-klare API om mee te vergelijken |

Dit is de reden waarom de vertaling van polysynthetische talen een **open onderzoeksprobleem** blijft — en waarom een gescoord, reproduceerbaar leaderboard belangrijk is.

---

## Eerder werk: Hoe men dit heeft aangepakt

### De ALTLab FST

De belangrijkste computationele bron voor Plains Cree is de **finite-state transducer (FST)**, ontwikkeld door het [Alberta Language Technology Lab (ALTLab)](https://altlab.artsrn.ualberta.ca/) aan de University of Alberta, in samenwerking met [Giellatekno](https://giellatekno.uit.no/) aan UiT The Arctic University of Norway.

De ALTLab FST is een **morfologische analysator en generator**: gegeven een verbogen Cree-woord, kan het dit ontleden in de stam en grammaticale tags, en gegeven een stam plus tags, kan het de correcte verbogen vorm genereren. Dit is deterministisch — geen neuraal netwerk, geen hallucinatie, geen waarschijnlijkheid. Als de FST een woord accepteert, is dat woord morfologisch geldig.

Daarom volgt het rosetta-leaderboard de **FST Acceptance Rate** als een metriek. Een vertaalmethode die woorden produceert die de FST afwijst, produceert morfologisch ongeldig Cree — ongeacht wat de chrF++-score zegt.

**Belangrijkste ALTLab-bronnen:**
- [itwêwina](https://itwewina.altlab.app/) — een intelligent Plains Cree–Engels woordenboek aangedreven door de FST
- [Morphodict](https://github.com/UAlbertaALTLab/morphodict) — open-source morfologisch bewust woordenboekplatform
- [crk-db](https://github.com/UAlbertaALTLab/crk-db) — Plains Cree lexicale database
- [21st Century Tools for Indigenous Languages](https://21c.tools/) — de bredere projectcontext

### Wereldwijde FST & Morfologische Registers

Plains Cree is niet de enige taal met hoogwaardige FST-infrastructuur. Als u vertaalpijplijnen wilt ontwikkelen voor andere low-resource of morfologisch complexe talen, kunt u gebruikmaken van deze gevestigde wereldwijde hubs:

* **[GiellaLT / Giellatekno](https://giellalt.github.io/) (UiT The Arctic University of Norway):** De grootste repository van open-source FST morfologische analysatoren en generatoren, die meer dan 100 talen dekt. Aandachtsgebieden zijn onder meer de Samische talen (`sme`, `smj`, `sma`, enz.), Oeraalse talen (Komi, Erzja, Oedmoerts, enz.) en andere minderheids-/inheemse talen. Zij hosten openbare verwerkte tekstcorpora (`corpus-xxx`) in hun [GitHub-organisatie](https://github.com/giellalt/).
* **[The Apertium Project](https://www.apertium.org/):** Een open-source regelgebaseerd automatisch vertaalplatform. Apertium onderhoudt sterk geoptimaliseerde FST morfologische analysatoren (met behulp van `lttoolbox` en `hfst`) en tweetalige woordenboeken voor tientallen talen, waaronder een grote reeks Turkse talen (Kazachs, Tataars, Kirgizisch, enz.) en Europese minderheidstalen. Alle bronnen zijn openbaar op [Apertium's GitHub](https://github.com/apertium).
* **[UniMorph (Universal Morphology)](https://unimorph.github.io/):** Een samenwerkingsproject dat gestandaardiseerde morfologische paradigma's biedt voor meer dan 150 talen. De dataset wordt gehost op Hugging Face via [unimorph/universal_morphologies](https://huggingface.co/datasets/unimorph/universal_morphologies). Als er geen gecompileerde FST-binary beschikbaar is voor een taal, kunnen UniMorph-tabellen worden gebruikt als een statische database-lookup gate.
* **[National Research Council Canada (NRC)](https://nrc-digital-repository.canada.ca/):** Biedt tools voor Canadese inheemse talen, waaronder de **Uqailaut** Inuktitut FST morfologische analysator en het enorme **Nunavut Hansard Parallel Corpus** (1,3 miljoen uitgelijnde Engels-Inuktitut zinsparen).

### Het EdTeKLA Corpus

De [EdTeKLA-onderzoeksgroep](https://spaces.facsci.ualberta.ca/edtekla/) (ook aan UAlberta) heeft een Plains Cree-taalcorpus samengesteld uit educatief materiaal, audiotranscripties en bronnen uit de gemeenschap. De rosetta-evaluatiedataset [EDTeKLA Dev v1](/docs/eval/datasets) is afgeleid van dit werk, gelicentieerd onder [CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/).

### Andere benaderingen die men heeft geprobeerd of zou kunnen proberen

Het leaderboard is methode-agnostisch. Hier zijn strategieën die zijn onderzocht of voorgesteld voor low-resource MT, die allemaal kunnen worden ingediend:

| Benadering | Hoe het werkt | Voordelen | Nadelen |
|----------|-------------|------|------|
| **Gecoachte LLM-prompting** | Grammaticaregels, woordenboeken en voorbeeldparen injecteren in de systeemprompt | Snel te itereren, geen training nodig | Kwaliteitsplafond beperkt door de basiskennis van de LLM |
| **Few-shot prompting** | Geverifieerde vertalingen opnemen als in-context voorbeelden | Goed voor een consistente stijl | Klein contextvenster; voorbeelden mogen NIET uit de evaluatiedata komen |
| **FST-gated pijplijn** | LLM genereert → FST valideert → wijst ongeldige morfologie af en probeert opnieuw | Garandeert morfologische geldigheid | Vereist FST-infrastructuur; retry-loops voegen latentie en kosten toe |
| **Woordenboek lookup + LLM** | Bekende termen uit een tweetalig woordenboek forceren, de LLM de rest laten afhandelen | Vermindert hallucinatie voor bekende termen | Woordenboekdekking is altijd onvolledig |
| **Gefinetuned model** | Een open model (Llama, Mistral) finetunen op parallelle tekst — maar niet op de evaluatiedata | Potentieel de hoogste kwaliteit | Vereist parallel corpus (schaars); duur; risico op overfitting |
| **Gekoppelde modellen (Chained models)** | Model A genereert ruwe vertaling → Model B post-edit → Model C scoort | Kan sterke punten van specialisten combineren | Complex; traag; duur |
| **Regelgebaseerd + LLM hybride** | Taalkundige regels gebruiken voor bekende patronen, LLM voor al het andere | Nauwkeurig waar regels van toepassing zijn | Vereist diepgaande taalkundige expertise |
| **Back-translation augmentatie** | Synthetische parallelle data genereren door Cree→Engels te vertalen en vervolgens te trainen op het omgekeerde | Breidt trainingsdata goedkoop uit | Versterkt bestaande modelfouten |
| **Evolutionaire benadering** | Kandidaat-vertalingen genereren, deze scoren, de best presterende muteren, herhalen | Kan nieuwe oplossingen ontdekken; parallelliseerbaar | Computationeel duur; heeft een goede fitnessfunctie nodig |
| **Gedeeltelijke vertaling** | Handmatig een representatieve steekproef vertalen, bewijzen dat uw methode hierop aansluit bij uw stijl, en vervolgens de resterende bulk automatisch vertalen | Combineert menselijke kwaliteit met machinale schaal | Vereist initiële menselijke inspanning |
| **Handmatige JSON / examenbeoordeling** | Handmatig een dataset JSON-bestand maken om antwoorden van studenten op een taalexamen te testen, of een batch menselijke vertalingen beoordelen tegen een gouden standaard | Geen ML vereist; werkt voor onderwijs en QA | Schaalt niet naar doorlopende vertaalbehoeften |

### Het is gewoon JSON

De harness neemt JSON in en geeft gescoorde JSON terug. Het [datasetformaat](/docs/eval/datasets) is eenvoudig:

```json
{
  "entries": [
    { "index": 0, "source_text": "Hello", "target_expected": "tânisi" },
    { "index": 1, "source_text": "Thank you", "target_expected": "kinanâskomitin" }
  ]
}
```

U kunt dit handmatig construeren. U kunt het exporteren vanuit een spreadsheet. U kunt het genereren vanuit een corpus. Een taaldocent zou het kunnen gebruiken om vertalingen van studenten te scoren. Een vertaalbureau zou het kunnen gebruiken om freelancers te benchmarken. Een onderzoekslaboratorium zou het kunnen gebruiken om modelarchitecturen te vergelijken. De harness maakt het niet uit waar de JSON vandaan komt — het scoort het simpelweg.

En omdat het productie-implementatieframework dezelfde plugin-interface gebruikt, kan een methode die goed scoort in de harness met één configuratiewijziging op uw website worden geïmplementeerd. **Bewijs het en gebruik het.**

De mogelijkheden zijn werkelijk eindeloos. **Als u een idee heeft, bouw het, voer de harness uit en dien uw scores in.**

---

## Hoe rosetta hierin past

rosetta biedt de infrastructuurlaag — u levert de methode.

### Het coachingsysteem

Met rosetta's `llm-coached` methode kunt u taalkundige kennis direct in de LLM-prompt injecteren:

```json title=".rosetta/coaching/crk.json"
{
  "grammar_rules": [
    "Plains Cree is polysynthetic — a single word can express what English needs a full sentence for",
    "Animate/inanimate noun distinction affects verb conjugation, demonstratives, and pluralization",
    "Use SRO (Standard Roman Orthography) as the working script — syllabic conversion is handled by the deterministic converter",
    "Obviation: when two third-person referents appear, the less salient one takes obviative marking (-a suffix on nouns, -iyiwa on verbs)"
  ],
  "dictionary": {
    "home": "kīwēwin",
    "settings": "isi-nākatohkēwin",
    "search": "nānātawāpahtam",
    "welcome": "tānisi",
    "dashboard": "kīskinwahamākēwin-māsinahikan"
  },
  "style_notes": "Use formal register appropriate for educational and community contexts. Preserve English technical terms in parentheses when no Cree equivalent exists or is widely accepted."
}
```

De coachingsdata wordt geïnjecteerd in elke LLM-prompt voor het `en:crk` paar, waardoor het model gestructureerde taalkundige context krijgt die het anders niet zou hebben. Zie [Coaching Data](/docs/concepts/coaching-data) voor de volledige specificatie.

### Registers

Het register maakt deel uit van de systeemprompt die de toon, formaliteit en orthografische conventies stuurt. rosetta wordt geleverd met één Plains Cree-register:

```
nêhiyawêwin (Plains Cree). Use SRO (Standard Roman Orthography) as the working
script. Output will be converted to Syllabics via deterministic converter.
Professional register appropriate for educational and community contexts.
```

U kunt dit overschrijven in uw configuratie om te experimenteren met verschillende promptingstrategieën:

```json title="i18n-rosetta.config.json"
{
  "languages": {
    "crk": {
      "register": "Casual Plains Cree (Y-dialect). Use SRO. Prefer everyday vocabulary over formal or archaic terms. Address the reader directly."
    }
  }
}
```

Verschillende registers produceren verschillende vertaalstijlen — en verschillende scores op het leaderboard. Elke inzending registreert het exacte register en de systeemprompt die zijn gebruikt (als een SHA-256-hash in de [run card](/docs/eval/run-card)), zodat experimenten reproduceerbaar zijn.

### Schriftconversie

Plains Cree wordt geschreven in twee schriften: **Standard Roman Orthography (SRO)** en **Canadian Aboriginal Syllabics** (Canadees inheems lettergreepschrift). De pijplijn van rosetta:

1. LLM vertaalt naar SRO (gebaseerd op het Latijnse alfabet, wat LLM's beter verwerken)
2. Quality gate valideert de SRO-output
3. Deterministische converter transformeert SRO → Syllabics
4. Geconverteerde tekst wordt naar schijf geschreven

De converter verwerkt alle SRO-diakritische tekens (ê, î, ô, â voor lange klinkers) en wijst deze toe aan de juiste syllabische tekens. Zie [Script Converters](/docs/concepts/script-converters) voor technische details.

### De evaluatieloop

De [eval harness](/docs/eval/harness) voert uw methode uit tegen de evaluatiedataset en produceert een gescoorde [run card](/docs/eval/run-card):

```bash
# Clone the harness
git clone https://github.com/gamedaysuits/gds-mt-eval-harness.git
cd gds-mt-eval-harness
pip install -e .

# Run a baseline experiment
python eval/baseline_experiment.py \
  --dataset data/edtekla-dev-v1.json \
  --model google/gemini-2.5-pro \
  --condition coached-v7

# Run with FST validation (if you have an FST binary)
python eval/baseline_experiment.py \
  --dataset data/edtekla-dev-v1.json \
  --fst-analyzer ./bin/crk-analyzer \
  --condition fst-gated-v1
```

De `--condition` flag is een label dat u zelf kiest. Het verschijnt op het leaderboard zodat mensen kunnen zien welke promptstrategie u heeft gebruikt. De harness registreert de volledige systeemprompt in de run card, zodat uw exacte benadering reproduceerbaar is.

:::tip Experimenteer vrijuit, dien uw beste in
De harness is ontworpen voor snelle iteratie. Voer tientallen experimenten uit met verschillende modellen, coachingsdata, registers en voorwaarden. Dien pas in op het leaderboard wanneer u iets heeft waar u trots op bent.
:::

---

## OCAP-principes

rosetta is ontworpen om inheemse datasoevereiniteit te ondersteunen. De [OCAP-principes](https://fnigc.ca/ocap-training/) (Ownership, Control, Access, Possession - Eigendom, Controle, Toegang, Bezit) sturen de manier waarop wij taaltechnologie voor inheemse gemeenschappen benaderen:

| Principe | Hoe rosetta dit ondersteunt |
|-----------|------------------------|
| **Ownership (Eigendom)** | Taalgemeenschappen zijn eigenaar van hun taalkundige data. rosetta stuurt nooit gegevens door of verzendt data naar onze servers |
| **Control (Controle)** | De [API-methode](/docs/guides/serving-a-method) stelt gemeenschappen in staat om hun eigen vertaalpijplijn te hosten — wij bieden de interface, zij beheren de implementatie |
| **Access (Toegang)** | Gemeenschappen bepalen wie hun methode kan gebruiken. De API kan worden afgeschermd met authenticatie |
| **Possession (Bezit)** | Alle vertaaldata blijft in het bestandssysteem van uw project. Het [provenance-systeem](/docs/concepts/security) houdt bij waar elke vertaling vandaan kwam |

De plugin-architectuur betekent dat een gemeenschap een methode kan bouwen die heilige of beperkt toegankelijke kennis intern verwerkt, alleen de vertaal-API blootstelt en volledige controle behoudt over hun taalkundige bronnen.

---

## De visie: Wat volgt hierna

Plains Cree is het eerste doelwit. Zodra de pijplijn is gevalideerd en de gemeenschap tevreden is met de kwaliteit, kan dezelfde architectuur worden uitgebreid naar andere polysynthetische talen met FST-infrastructuur:

- **Andere Algonkische talen**: Woods Cree, Swampy Cree, Ojibwe, Blackfoot
- **Inuït-talen**: Inuktitut, Inuinnaqtun (die ook syllabische schriften gebruiken)
- **Andere taalfamilies**: elke taal met een FST-analysator kan de FST-gated pijplijn gebruiken

Het leaderboard is afgebakend per taalpaar. Naarmate nieuwe evaluatiedatasets worden bijgedragen door taalgemeenschappen, worden er automatisch nieuwe leaderboard-tracks geopend.

**Dit is een open uitnodiging.** Als u werkt met een low-resource taal — als onderzoeker, lid van een gemeenschap, student of gewoon iemand die erom geeft — biedt rosetta u de tools om iets echts te bouwen, het eerlijk te meten en het met de wereld te delen. Het [Method Leaderboard](/leaderboard) wacht op uw inzending.

---

## Zie ook

- **[Method Leaderboard](/leaderboard)** — dien uw scores in en zie hoe methoden zich tot elkaar verhouden
- **[MT Evaluation](/docs/eval/)** — wat een goede methode maakt, wat wordt gediskwalificeerd
- **[Eval Harness](/docs/eval/harness)** — hoe u experimenten uitvoert
- **[Evaluation Datasets](/docs/eval/datasets)** — EDTeKLA Dev v1 en FLORES+
- **[Coaching Data](/docs/concepts/coaching-data)** — hoe u taalkundige kennis structureert voor de LLM
- **[Script Converters](/docs/concepts/script-converters)** — de SRO→Syllabics-pijplijn
- **[Serving a Method via API](/docs/guides/serving-a-method)** — het hosten van door de gemeenschap beheerde vertalingen
- **[ALTLab](https://altlab.artsrn.ualberta.ca/)** — het Alberta Language Technology Lab
- **[EdTeKLA](https://spaces.facsci.ualberta.ca/edtekla/)** — de Educational Technology, Knowledge & Language-onderzoeksgroep
- **[itwêwina woordenboek](https://itwewina.altlab.app/)** — FST-aangedreven Plains Cree–Engels woordenboek