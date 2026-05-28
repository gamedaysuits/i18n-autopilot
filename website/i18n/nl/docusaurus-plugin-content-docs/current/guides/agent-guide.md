---
sidebar_position: 9
title: "Handleiding voor agents: i18n-rosetta gebruiken"
description: "Hoe AI-agents i18n-rosetta kunnen installeren, configureren en uitvoeren om localisatiebestanden te vertalen."
---
# Gids voor agenten: i18n-rosetta gebruiken

i18n-rosetta is een CLI-tool die de locale-bestanden van uw applicatie met één commando vertaalt. Deze gids is bedoeld voor AI-agenten (of ontwikkelaars die met AI-agenten werken) die snel van nul naar vertaalde locale-bestanden willen gaan.

:::tip Al bekend hiermee?
Als u alleen commando's nodig hebt, ga dan direct naar de [CLI-referentie](/docs/reference/cli). Als u een vertaalmethode wilt bouwen en benchmarken, raadpleeg dan de [Gids voor Arena-agenten](https://mtevalarena.org/docs/getting-started/agent-guide).
:::

---

## Omgeving instellen

```bash
# No global install needed — npx runs it directly
npx i18n-rosetta sync
```

**Vereisten:**
- Node.js 18+
- Een API-sleutel voor uw vertaalprovider

**API-sleutel instellen** — rosetta heeft ten minste één sleutel nodig, afhankelijk van de methoden die u gebruikt:

```bash
# Option 1: export (session only)
export OPENROUTER_API_KEY="sk-or-..."        # for llm / llm-coached methods
export GOOGLE_TRANSLATE_API_KEY="AIza..."    # for google-translate method

# Option 2: .env file in your project root (persistent, gitignored)
echo 'OPENROUTER_API_KEY=sk-or-...' > .env
```

Rosetta leest `.env` automatisch. Vraag een OpenRouter-sleutel aan via [openrouter.ai/keys](https://openrouter.ai/keys).

---

## Eerste synchronisatie

Rosetta detecteert automatisch uw locale-bestanden, hun formaat (JSON, TOML, YAML, PO) en uw doeltalen:

```bash
npx i18n-rosetta sync
```

**Wat er gebeurt:**
1. Laadt `i18n-rosetta.config.json` (of detecteert instellingen automatisch)
2. Scant uw bron-locale-bestand en maakt geneste sleutels plat
3. Vergelijkt met `.i18n-rosetta.lock` (SHA-256-hashes van eerder vertaalde waarden)
4. Controleert `.rosetta/tm.json` op in de cache opgeslagen vertalingen (Translation Memory)
5. Vertaalt alleen **gewijzigde, ontbrekende of verouderde sleutels** via de geconfigureerde methode
6. Voert de kwaliteitscontrole (Quality Gate met 5 controles) uit op elke vertaling
7. Schrijft goedgekeurde vertalingen naar het doel-locale-bestand
8. Werkt het lock-bestand en de TM-cache bij

Bij een typische hernieuwde uitvoering na het wijzigen van één sleutel, levert stap 4 142 sleutels uit de cache en vertaalt stap 5 1 sleutel. Dit is de reden waarom latere synchronisaties snel en goedkoop zijn.

---

## Configuratie

Maak `i18n-rosetta.config.json` aan in de hoofdmap (root) van uw project:

```json
{
  "inputLocale": "en",
  "pairs": {
    "en-fr": { "method": "llm-coached" },
    "en-ja": { "method": "google-translate" },
    "en-crk": { "method": "api", "endpoint": "http://localhost:3000/translate" }
  }
}
```

Belangrijkste velden:

| Veld | Doel | Standaardwaarde |
|-------|---------|---------|
| `inputLocale` | Brontaal | `en` |
| `pairs` | Mapping van bron→doel met methodeconfiguratie | (vereist) |
| `localesDir` | Waar locale-bestanden zich bevinden | (automatisch gedetecteerd) |
| `model` | LLM-model voor `llm`/`llm-coached` methoden | `google/gemini-2.5-flash` |
| `batchSize` | Sleutels per API-aanroep | 80 (LLM), 128 (Google) |
| `jsonConcurrency` | Parallelle locale-vertalingen voor JSON-sleutels | 200 |
| `contentConcurrency` | Parallelle API-aanroepen voor contentvertaling | 48 |

Volledige referentie: [Configuratie](/docs/getting-started/configuration)

---

## Vertaalmethoden

| Methode | Wanneer te gebruiken | Kosten | API-sleutel nodig |
|--------|------------|------|---------------|
| **`llm`** | Algemeen gebruik, goed voor talen met veel bronnen | Per token (modelafhankelijk) | `OPENROUTER_API_KEY` |
| **`llm-coached`** | Wanneer u grammaticaregels/een woordenboek voor de doeltaal hebt | Per token + coachingcontext | `OPENROUTER_API_KEY` |
| **`google-translate`** | Talen met veel bronnen waar GT goed werkt | $20/miljoen tekens | `GOOGLE_TRANSLATE_API_KEY` |
| **`api`** | Aangepaste pijplijn gehost achter een HTTP-eindpunt | Bepaald door server | Geen (eindpunt handelt authenticatie af) |
| **`plugin`** | Vooraf verpakte methode die lokaal is geïnstalleerd | Varieert | Varieert |

Details: [Vertaalmethoden](/docs/guides/translation-methods)

---

## Coachinggegevens

Voor `llm-coached`-paren sturen coachinggegevens de LLM aan met expliciete taalkundige kennis. Maak een coachingbestand aan:

```json title="coaching/fr.json"
{
  "grammar_rules": [
    "Use formal register (vous) for all UI text",
    "Adjectives agree in gender and number with the noun"
  ],
  "dictionary": {
    "dashboard": "tableau de bord",
    "settings": "paramètres"
  },
  "style_notes": "Prefer active voice. Avoid anglicisms."
}
```

Verwijs ernaar in uw paarconfiguratie:

```json
"en-fr": { "method": "llm-coached", "coachingFile": "coaching/fr.json" }
```

De kwaliteitscontrole (Quality Gate) verifieert of woordenboektermen daadwerkelijk in de uitvoer verschijnen — overtredingen worden geregistreerd als `[TERM]`-waarschuwingen.

Details: [Coachinggegevens](/docs/concepts/coaching-data)

---

## Quality Gate

Elke vertaling doorloopt vijf geautomatiseerde controles voordat deze naar de schijf wordt geschreven:

| Controle | Wat het detecteert | Voorbeeld |
|-------|----------------|---------|
| **Leeg/blanco** | Model heeft niets geretourneerd | `""` |
| **Bron-echo** | Model heeft de Engelse invoer ongewijzigd geretourneerd | `"Welcome"` voor Japans |
| **Hallucinatie-lus** | Herhaalde trigrammen | `"Qo' Qo' Qo' Qo'"` |
| **Lengte-inflatie** | Uitvoer is 4×+ langer dan de bron | Bron van 10 tekens → uitvoer van 50 tekens |
| **Scriptnaleving** | Verkeerd script voor de locale | Latijnse tekst voor Arabische locale |

Fouten worden geregistreerd met het voorvoegsel `[GATE]`. Geen stille terugvalopties (silent fallbacks) — als een vertaling mislukt, wordt dit gerapporteerd en niet stilletjes geaccepteerd.

Details: [Quality Gate](/docs/concepts/quality-gate)

---

## Vertaalgeheugen (Translation Memory)

Rosetta slaat vertalingen op in de cache in `.rosetta/tm.json`, gekoppeld aan brontekst + locale + methode. Bij latere synchronisaties worden ongewijzigde sleutels vanuit de cache geleverd — geen API-aanroep, geen kosten.

```
[TM] 142 key(s) served from cache
Translating 3 key(s) to French (llm)... [OK]
```

Om de cache voor één uitvoering te omzeilen: `npx i18n-rosetta sync --no-tm`

Details: [Vertaalgeheugen](/docs/concepts/translation-memory)

---

## Gegenereerde bestanden

Rosetta maakt verschillende bestanden aan in uw project. Zorg dat u weet wat deze inhouden, zodat u niet per ongeluk de verkeerde bestanden verwijdert of commit:

| Bestand | Doel | Git? |
|------|---------|------|
| `.i18n-rosetta.lock` | SHA-256-hashes van vertaalde bronwaarden (wijzigingsdetectie) | **Ja** — commit dit |
| `.i18n-rosetta-content.lock` | Hetzelfde, maar dan voor Markdown/MDX-contentbestanden | **Ja** — commit dit |
| `.rosetta/tm.json` | Cache van het vertaalgeheugen (Translation Memory) | **Ja** — commit dit (bespaart API-kosten voor het team) |
| `.rosetta/coaching/` | Map met coachinggegevens | **Ja** — dit is uw taalkundige kennis |
| `i18n-rosetta.config.json` | Projectconfiguratie | **Ja** — commit dit |

---

## Veelvoorkomende patronen

**Eén talenpaar vertalen:**
```bash
npx i18n-rosetta sync --pair en-fr
```

**Alle geconfigureerde paren vertalen:**
```bash
npx i18n-rosetta sync
```
Rosetta vertaalt alle locales parallel. Met TM-caching bereiken alleen gewijzigde sleutels de API.

**Contentmodus (Markdown/MDX voor Docusaurus, Hugo, enz.):**
```bash
npx i18n-rosetta sync --content
```
Vertaalt documentatie, blogberichten en contentbestanden naast locale-JSON. Maakt gebruik van parallelle gelijktijdigheid (standaard: 48 gelijktijdige API-aanroepen). Pas dit aan met `--content-concurrency`.

**Dry run (voorbeeld zonder te schrijven):**
```bash
npx i18n-rosetta sync --dry-run
```

**Specifieke sleutels geforceerd opnieuw vertalen:**
```bash
npx i18n-rosetta sync --force-keys "hero.title,nav.about"
```

**Alle contentbestanden geforceerd opnieuw vertalen:**
```bash
npx i18n-rosetta sync --force-content
```

**Vertaalstatus controleren:**
```bash
npx i18n-rosetta status
```
Toont dekking, kwaliteitsniveaus en plug-in-informatie voor elk paar.

**Controleren op onvertaalde terugvalwaarden (fallbacks):**
```bash
npx i18n-rosetta audit
```
Toont een lijst van alle `[EN]`-terugvalwaarden die vertaald moeten worden.

---

## Probleemoplossing

| Probleem | Oplossing |
|---------|-----|
| `OPENROUTER_API_KEY not set` | Exporteer de sleutel of voeg deze toe aan `.env` in de hoofdmap van uw project |
| `No locale files found` | Stel `localesDir` in de configuratie in, of zorg ervoor dat uw locale-bestanden overeenkomen met de standaardnaamgeving (`en.json`, `fr.json`) |
| `[GATE] Script compliance failed` | Uw doel-locale heeft Latijnse tekst gekregen in plaats van het verwachte script — probeer een ander model of voeg coachinggegevens toe |
| `[GATE] Source echo` | Het model heeft het Engels ongewijzigd geretourneerd — coachinggegevens of een ander model lost dit meestal op |
| Alle vertalingen in de cache | Voer uit met `--no-tm` om de cache te omzeilen, of `--force-keys` voor specifieke sleutels |
| Conflicten in lock-bestand | `.i18n-rosetta.lock` gebruikt SHA-256-hashes — samenvoegconflicten (merge conflicts) kunnen veilig worden opgelost door een van beide versies te behouden en vervolgens de synchronisatie opnieuw uit te voeren |

---

## Volgende stappen

- [Snelstart](/docs/getting-started/quick-start) — volledige handleiding om aan de slag te gaan
- [CLI-referentie](/docs/reference/cli) — elk commando en elke vlag
- [Hoe het werkt](/docs/how-it-works) — uitleg over de synchronisatiepijplijn
- [De Eval Harness Bridge](/docs/guides/bridge) — hoe rosetta verbinding maakt met de Arena
- **Wilt u uw eigen vertaalmethode bouwen?** Bekijk de [Gids voor Arena-agenten](https://mtevalarena.org/docs/getting-started/agent-guide) — bouw een methode, bewijs dat deze werkt en win prijzen.