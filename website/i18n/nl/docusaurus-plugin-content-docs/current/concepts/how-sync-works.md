---
sidebar_position: 2
title: "Hoe synchronisatie werkt"
---
# Hoe Sync Werkt

De opdracht `sync` is de kernbewerking van rosetta. Dit is wat er gebeurt wanneer u `npx i18n-rosetta sync` uitvoert.

## Pijplijnoverzicht

```mermaid
flowchart TD
    A["Load config\n+ resolve pairs"] --> B["Scan source locale\n(flatten nested keys)"]
    B --> C["Load lock file\n(.i18n-rosetta.lock)"]
    C --> D["Diff: find missing\nand stale keys"]
    D --> TM{"TM lookup"}
    TM -->|Hits| TC["Serve from cache"]
    TM -->|Misses| E{"Keys to translate?"}
    E -->|No| F["Done ✓"]
    E -->|Yes| G["Batch keys\n(default 80/batch)"]
    G --> H["Translate batch\n(method-specific)"]
    H --> I["Quality gate\n(validate each key)"]
    I --> TERM["Terminology check\n(coached pairs)"]
    TERM --> J{"All pass?"}
    J -->|Yes| K["Write to locale file"]
    J -->|Failures| L["Retry cascade:\nfull → half → individual"]
    L --> H
    TC --> I
    K --> TMS["Store new entries\nin TM"]
    TMS --> M["Update lock file\n(SHA-256 hashes)"]
    M --> N["Next pair"]
```

## Stap voor stap

### 1. Configuratie bepalen

Rosetta laadt `i18n-rosetta.config.json` (of detecteert instellingen automatisch). Het bepaalt:
- Brontaal en doeltalen
- De pair graph (welke bron→doel combinaties verwerkt moeten worden)
- Methode-, model- en kwaliteitsinstellingen per paar

Voordat bestanden worden gescand, drukt rosetta een opstartheader af:

```
i18n-rosetta v3.3.1

[INFO] Detected format: json (auto)
[INFO] Detected framework: Hugo
```

- **Versiebanner**: Toont de geïnstalleerde versie voor foutopsporing (debugging) en probleemrapporten.
- **Formaatdetectie**: Rapporteert het bestandsformaat en of dit automatisch is gedetecteerd `(auto)` of expliciet is geconfigureerd `(config)`. Ondersteunt `json`, `toml` en `yaml`.
- **Frameworkdetectie**: Wanneer `contentDir` is ingesteld, wordt het framework (`Hugo`) geïdentificeerd om te bevestigen dat content sync actief is.

### 2. Bron scannen

Het brontaalbestand wordt geladen en afgevlakt (flattened) naar een key→value map:

```json
// Input (nested)
{ "hero": { "title": "Welcome", "subtitle": "Build" } }

// Flattened
{ "hero.title": "Welcome", "hero.subtitle": "Build" }
```

### 3. Wijzigingsdetectie

Rosetta leest `.i18n-rosetta.lock`, waarin SHA-256 hashes van eerder vertaalde bronwaarden zijn opgeslagen. Voor elke sleutel (key) controleert het:

| Voorwaarde | Actie |
|-----------|--------|
| Sleutel ontbreekt in doel | **Vertalen** |
| Bron-hash is gewijzigd sinds laatste sync | **Opnieuw vertalen** (verouderd) |
| Doelwaarde begint met `[EN]` | **Opnieuw vertalen** (legacy fallback-markering) |
| Bron-hash ongewijzigd, sleutel bestaat | **Overslaan** |

Dit is de reden waarom rosetta alleen vertaalt wat er is gewijzigd — uw volledige bestand wordt niet bij elke sync opnieuw vertaald.

### 4. Batching

Sleutels worden gegroepeerd in batches (standaard: 80 sleutels/batch voor LLM, 128 voor Google Translate). Batching vermindert het aantal API-verzoeken (round trips) en houdt prompts beheersbaar.

Tijdens het vertalen toont rosetta een inline voortgangsbalk die wordt bijgewerkt nadat elke batch is voltooid:

```
[INFO] fr.json — 2,847 missing
     ████████████████░░░░░░░░░░░░░░░░ 1,440/2,847 keys
```

De balk wordt weergegeven met behulp van een `\r` carriage return voor in-place updates — zonder te scrollen. Dit wordt onderdrukt in de modi `--quiet` en `--json`.

### 4b. Vertaalgeheugen (Translation Memory)

Voorafgaand aan batching controleert rosetta de cache van het vertaalgeheugen (`.rosetta/tm.json`). Sleutels waarvan de brontekst + taal + methode overeenkomen met een eerdere vertaling, worden direct vanuit de cache geleverd — er is geen API-aanroep nodig.

```
  [TM] 142 key(s) served from cache
  Translating 3 key(s) to French (llm)... [OK]
```

TM is het belangrijkste kostenbesparende mechanisme. Als u sync opnieuw uitvoert na een wijziging in één sleutel, wordt alleen die ene sleutel vertaald en niet het hele bestand. Zie [Vertaalgeheugen](/docs/concepts/translation-memory) voor meer informatie.

Om de cache voor een enkele uitvoering te omzeilen: `i18n-rosetta sync --no-tm`

### 5. Vertaling

Elke batch wordt naar de geconfigureerde vertaalmethode verzonden:

- **`llm`**: Gestructureerde prompt naar OpenRouter met instructies voor register en genderrichtlijnen
- **`llm-coached`**: Hetzelfde, maar met geïnjecteerde grammaticaregels, woordenboek en stijlaantekeningen
- **`google-translate`**: Google Cloud Translation API v2 batchverzoek
- **`api`**: HTTP POST naar een extern eindpunt (remote endpoint)

Het systeembericht (register, genderrichtlijnen, regels) is identiek voor alle batches binnen een bepaalde taal, wat **prompt caching** mogelijk maakt — providers zoals Anthropic en Google cachen herhaalde systeemberichten, wat de tokenkosten verlaagt.

### 6. Quality Gate

Elke vertaling wordt gevalideerd voordat deze naar de schijf wordt geschreven. Er worden vijf controles uitgevoerd:

| Controle | Wat het detecteert | Voorbeeld |
|-------|----------------|---------|
| **Leeg/blanco** | Model heeft niets geretourneerd | `""` |
| **Bron-echo** | Model heeft de Engelse invoer geretourneerd | `"Welcome"` voor Japans |
| **Hallucinatie-loop** | Herhaalde trigrammen | `"Qo' Qo' Qo' Qo'"` |
| **Lengte-inflatie** | Uitvoer is 4×+ langer dan de bron | 10-teken bron → 50-teken uitvoer |
| **Script-naleving** | Verkeerd schrift voor de taal | Latijnse tekst voor Arabische taal |

Fouten worden gelogd met een `[GATE]` voorvoegsel. Er zijn geen stille fallbacks.

Zie [Quality Gate](/docs/concepts/quality-gate) voor meer informatie.

### 6b. Terminologieverificatie

Voor gecoachte paren met een woordenboek controleert rosetta of de LLM na vertaling daadwerkelijk de vereiste terminologie heeft gebruikt. Overtredingen worden gelogd als `[TERM]` waarschuwingen:

```
[TERM] en→fr: 2 term violation(s)
  • "dashboard" → expected "tableau de bord" but got "panneau"
```

Dit zijn waarschuwingen, geen blokkerende fouten — de vertaling wordt nog steeds weggeschreven.

### 7. Retry Cascade

Bij een JSON-parsefout of fouten op batchniveau, probeert rosetta het opnieuw met steeds kleinere batches:

```
Full batch (80 keys) → Failed
  └→ Half batch (40 keys) → 1 failure
      └→ Individual keys (1 each) → Isolates the problem key
```

Het budget voor nieuwe pogingen (retries) wordt beperkt door `maxRetries` (standaard: 3) om uit de hand lopende tokenkosten te voorkomen.

### 8. Schrijven & Lock

Goedgekeurde vertalingen worden naar het doeltaalbestand geschreven, waarbij de originele neststructuur behouden blijft. Het lock-bestand wordt bijgewerkt met nieuwe SHA-256 hashes.

### 9. Verificatie

Nadat alle paren zijn verwerkt, leest rosetta de weggeschreven taalbestanden opnieuw van de schijf en voert het een verificatieronde uit (tenzij `--no-verify` is ingesteld). Dit ondervangt het verschil tussen een sync die succes meldt en sleutels die in werkelijkheid onjuist zijn:

- **Sleutelpariteit (Key parity)** — alle bronsleutels zijn aanwezig in elk doel
- **`[EN]` fallback-markeringen** — legacy-markeringen van eerdere uitvoeringen
- **Lege vertalingen** — blanco waarden die erdoorheen zijn geglipt
- **Script-naleving** — niet-Latijnse talen met uitsluitend ASCII-vertalingen
- **Behoud van placeholders** — ICU-placeholders komen overeen met de bron
- **Coderingsproblemen** — BOM-markeringen, onzichtbare tekens

Dit is ook beschikbaar als een op zichzelf staande `i18n-rosetta verify` opdracht voor CI-gates.

## Contentvertaling (Fase 2)

Voor Docusaurus- en Hugo-projecten voert `sync` een tweede fase uit na de vertaling van JSON-sleutels. In deze fase worden Markdown- en MDX-bestanden (documentatie, blogposts, tutorials) vertaald met behulp van dezelfde methoden en Quality Gate.

### Hoe het werkt

1. Rosetta ontdekt alle broncontentbestanden (`.md`, `.mdx`) door de content/docs-directory te doorlopen
2. Voor elk bestand × taal-paar controleert het een afzonderlijk content lock-bestand (`.i18n-rosetta-content.lock`) op wijzigingen in de SHA-256 hash
3. Gewijzigde of ontbrekende bestanden worden verzameld in een platte pool van werkitems (work-item pool)
4. De pool wordt verwerkt met **parallelle gelijktijdigheid (concurrency)** (standaard: 12 gelijktijdige API-aanroepen)

```
Phase 2: content (79 translations to process, 341 skipped, concurrency: 48)

    [1/79] (1%)  docs/concepts/security.md → ja [RE-TRANSLATE] (~3328s left)
    [2/79] (3%)  docs/concepts/security.md → th [RE-TRANSLATE] (~1821s left)
    ...
    [79/79] (100%) blog/v3-2-quality.md → de [OK]

  [OK] Created 79 content file(s), 341 unchanged
```

### Parallellisme

Zowel Fase 1 (JSON-sleutels) als Fase 2 (content) worden nu parallel uitgevoerd:

- **Fase 1**: Alle taalvertalingen worden gelijktijdig gestart (standaard: 50 gelijktijdige talen). Binnen elke taal worden API-batches ook parallel uitgevoerd (4 gelijktijdige batches). Een sync van 12 talen met 120 sleutels is in ~1 minuut voltooid in plaats van ~15 minuten.
- **Fase 2**: Alle combinaties van bestand × taal worden vertaald als een platte pool (standaard: 12 gelijktijdige API-aanroepen). Verschillende bestanden en verschillende talen worden gelijktijdig vertaald.

Beheer het parallellisme met `--json-concurrency`, `--content-concurrency` of `--concurrency` (stelt beide in):

```bash
# Faster JSON sync (more parallel locale translations)
npx i18n-rosetta sync --json-concurrency 30

# Faster content sync (more parallel API calls)
npx i18n-rosetta sync --content-concurrency 20

# Slower (gentler on rate limits)
npx i18n-rosetta sync --concurrency 4
```

### Contentbescherming

Tijdens het vertalen schermt rosetta niet-vertaalbare content af:

- **Codeblokken** (fenced en ingesprongen) worden vervangen door placeholders
- **Frontmatter**-velden die niet in de `translatableFields`-lijst staan, blijven ongewijzigd behouden
- **Links**, afbeeldingspaden en HTML-tags worden beschermd
- **Shortcodes** en interpolatievariabelen (bijv. `{count}`, `{{.Params.title}}`) worden afgeschermd

Na de vertaling worden alle placeholders hersteld en gevalideerd. Als er placeholders ontbreken of beschadigd zijn, wordt de vertaling afgewezen en opnieuw geprobeerd.

## Gedeeltelijk succes

Eén mislukte batch blokkeert de rest niet. Als 9 van de 10 batches slagen, worden die 9 weggeschreven. De mislukte batch wordt gelogd en u kunt `sync` opnieuw uitvoeren om het nogmaals te proberen.

## Dry Run

Bekijk een voorbeeld van wat er zou veranderen zonder bestanden weg te schrijven:

```bash
npx i18n-rosetta sync --dry-run
```

## Geforceerd opnieuw vertalen

Forceer dat specifieke sleutels opnieuw worden vertaald, zelfs als ze ongewijzigd zijn:

```bash
npx i18n-rosetta sync --force-keys "hero.title,nav.about"
```

## Kostenraming

Voordat het vertalen begint, genereert rosetta een **pre-sync kostenrapport** dat de geschatte kosten per paar toont. Dit wordt automatisch uitgevoerd tijdens elke `sync` — u ziet dit voordat er API-aanroepen worden gedaan.

```
╔══════════════════════════════════════════════════════════╗
║  Cost Estimate                                          ║
╠════════════╦═══════╦════════════╦════════════════════════╣
║ Pair       ║ Keys  ║ Est. Cost  ║ Method                 ║
╠════════════╬═══════╬════════════╬════════════════════════╣
║ en → fr    ║   142 ║ $0.07      ║ google-translate       ║
║ en → ja    ║    38 ║   —        ║ llm (model-dependent)  ║
║ en → crk   ║    38 ║   —        ║ llm-coached            ║
╚════════════╩═══════╩════════════╩════════════════════════╝
```

### Wat wordt er geschat

Elke vertaalmethode biedt een eigen kostenraming:

| Methode | Kostenbasis | Precisie |
|--------|-----------|-----------|
| `google-translate` | Gepubliceerde tarief van Google ($20/miljoen tekens) | Nauwkeurig |
| `llm` | Varieert per OpenRouter-model | Modelafhankelijk — bekijk [OpenRouter-prijzen](https://openrouter.ai/models) |
| `llm-coached` | Zelfde als `llm` plus coaching context-tokens | Modelafhankelijk |
| `api` | Bepaald door server | Onbekend — kan niet worden geschat zonder het eindpunt te bevragen |

Wanneer een methode de kosten niet kan bepalen (LLM-methoden, externe API's), rapporteert rosetta `—` in plaats van te gissen. Gebruik `--dry` om kostenramingen te bekijken zonder daadwerkelijk te vertalen.

---

## Zie ook

- [CLI-referentie — sync](/docs/reference/cli#sync) — opdrachtvlaggen (flags) en opties
- [Vertaalgeheugen](/docs/concepts/translation-memory) — caching en kostenbesparingen
- [Quality Gate](/docs/concepts/quality-gate) — hoe vertalingen worden gevalideerd
- [Vertaalmethoden](/docs/guides/translation-methods) — hoe elke methode werkt
- [Werken met professionele vertalers](/docs/guides/professional-translators) — XLIFF-workflow
- [Configuratie](/docs/getting-started/configuration) — configuratiereferentie
- [CI/CD-gids](/docs/guides/ci-cd) — syncs automatiseren in uw pijplijn