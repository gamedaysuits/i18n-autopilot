---
sidebar_position: 2
title: "Hoe synchronisatie werkt"
---
# Hoe Sync werkt

De opdracht `sync` is de kernbewerking van rosetta. Dit is wat er gebeurt wanneer u `npx i18n-rosetta sync` uitvoert.

## Overzicht van de pijplijn

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
- Bron-locale en doel-locales
- De pair graph (welke bron→doel-combinaties moeten worden verwerkt)
- Methode-, model- en kwaliteitsinstellingen per paar

Voordat bestanden worden gescand, drukt rosetta een opstartkoptekst af:

```
i18n-rosetta v3.3.1

[INFO] Detected format: json (auto)
[INFO] Detected framework: Hugo
```

- **Versiebanner**: Toont de geïnstalleerde versie voor foutopsporing en probleemrapporten.
- **Formaatdetectie**: Rapporteert het bestandsformaat en of dit automatisch is gedetecteerd `(auto)` of expliciet is geconfigureerd `(config)`. Ondersteunt `json`, `toml` en `yaml`.
- **Frameworkdetectie**: Wanneer `contentDir` is ingesteld, wordt het framework (`Hugo`) geïdentificeerd om te bevestigen dat contentsynchronisatie actief is.

### 2. Bron scannen

Het bron-locale-bestand wordt geladen en afgevlakt tot een key→value-map:

```json
// Input (nested)
{ "hero": { "title": "Welcome", "subtitle": "Build" } }

// Flattened
{ "hero.title": "Welcome", "hero.subtitle": "Build" }
```

### 3. Wijzigingsdetectie

Rosetta leest `.i18n-rosetta.lock`, waarin SHA-256-hashes van eerder vertaalde bronwaarden zijn opgeslagen. Voor elke sleutel wordt het volgende gecontroleerd:

| Voorwaarde | Actie |
|-----------|--------|
| Sleutel ontbreekt in doel | **Vertalen** |
| Bron-hash is gewijzigd sinds de laatste synchronisatie | **Opnieuw vertalen** (verouderd) |
| Doelwaarde begint met `[EN]` | **Opnieuw vertalen** (verouderde fallback-markering) |
| Bron-hash is ongewijzigd, sleutel bestaat | **Overslaan** |

Dit is de reden waarom rosetta alleen vertaalt wat er is gewijzigd — uw volledige bestand wordt niet bij elke synchronisatie opnieuw vertaald.

### 4. Batchverwerking

Sleutels worden gegroepeerd in batches (standaard: 80 sleutels/batch voor LLM, 128 voor Google Translate). Batchverwerking vermindert het aantal API-verzoeken en houdt prompts beheersbaar.

Tijdens de vertaling toont rosetta een inline voortgangsbalk die wordt bijgewerkt nadat elke batch is voltooid:

```
[INFO] fr.json — 2,847 missing
     ████████████████░░░░░░░░░░░░░░░░ 1,440/2,847 keys
```

De balk wordt weergegeven met behulp van `\r` carriage return voor in-place updates — zonder te scrollen. Onderdrukt in de modi `--quiet` en `--json`.

### 4b. Translation Memory

Voorafgaand aan de batchverwerking controleert rosetta de Translation Memory-cache (`.rosetta/tm.json`). Sleutels waarvan de brontekst + locale + methode overeenkomen met een eerdere vertaling, worden direct vanuit de cache geleverd — er is geen API-verzoek nodig.

```
  [TM] 142 key(s) served from cache
  Translating 3 key(s) to French (llm)... [OK]
```

Translation Memory is het belangrijkste kostenbesparende mechanisme. Het opnieuw uitvoeren van een synchronisatie na het wijzigen van één enkele sleutel vertaalt alleen die specifieke sleutel, niet het hele bestand. Zie [Translation Memory](/docs/concepts/translation-memory) voor meer informatie.

Om de cache voor een enkele uitvoering te omzeilen: `i18n-rosetta sync --no-tm`

### 5. Vertaling

Elke batch wordt naar de geconfigureerde vertaalmethode verzonden:

- **`llm`**: Gestructureerde prompt naar OpenRouter met instructies voor register en genderrichtlijnen
- **`llm-coached`**: Hetzelfde, maar met geïnjecteerde grammaticaregels, woordenboek en stijlaantekeningen
- **`google-translate`**: Google Cloud Translation API v2 batchverzoek
- **`api`**: HTTP POST naar een extern endpoint

Het systeembericht (register, genderrichtlijnen, regels) is identiek voor alle batches binnen een bepaalde locale, wat **prompt caching** mogelijk maakt — providers zoals Anthropic en Google cachen herhaalde systeemberichten, wat de tokenkosten verlaagt.

### 6. Quality Gate

Elke vertaling wordt gevalideerd voordat deze naar de schijf wordt geschreven. Er worden vijf controles uitgevoerd:

| Controle | Wat het detecteert | Voorbeeld |
|-------|----------------|---------|
| **Leeg/blanco** | Model heeft niets geretourneerd | `""` |
| **Bron-echo** | Model heeft de Engelse invoer geretourneerd | `"Welcome"` voor Japans |
| **Hallucinatie-loop** | Herhaalde trigrammen | `"Qo' Qo' Qo' Qo'"` |
| **Lengte-inflatie** | Uitvoer is 4×+ langer dan de bron | Bron van 10 tekens → uitvoer van 50 tekens |
| **Scriptnaleving** | Verkeerd schrift voor de locale | Latijnse tekst voor Arabische locale |

Fouten worden gelogd met een `[GATE]` voorvoegsel. Geen stille fallbacks.

Zie [Quality Gate](/docs/concepts/quality-gate) voor meer informatie.

### 6b. Terminologieverificatie

Voor gecoachte paren met een woordenboek controleert rosetta of de LLM na vertaling daadwerkelijk de vereiste terminologie heeft gebruikt. Overtredingen worden gelogd als `[TERM]` waarschuwingen:

```
[TERM] en→fr: 2 term violation(s)
  • "dashboard" → expected "tableau de bord" but got "panneau"
```

Dit zijn waarschuwingen, geen blokkerende fouten — de vertaling wordt alsnog geschreven.

### 7. Retry Cascade

Bij een JSON-parseerfout of fouten op batchniveau, probeert rosetta het opnieuw met steeds kleinere batches:

```
Full batch (80 keys) → Failed
  └→ Half batch (40 keys) → 1 failure
      └→ Individual keys (1 each) → Isolates the problem key
```

Het budget voor herhaalpogingen wordt beperkt door `maxRetries` (standaard: 3) om uit de hand lopende tokenkosten te voorkomen.

### 8. Schrijven & Vergrendelen

Goedgekeurde vertalingen worden naar het doel-locale-bestand geschreven, waarbij de originele neststructuur behouden blijft. Het lock-bestand wordt bijgewerkt met nieuwe SHA-256-hashes.

### 9. Verificatie

Nadat alle paren zijn verwerkt, leest rosetta de geschreven locale-bestanden opnieuw van de schijf en voert een verificatieronde uit (tenzij `--no-verify` is ingesteld). Dit ondervangt het verschil tussen een succesvolle synchronisatiemelding en sleutels die in werkelijkheid onjuist zijn:

- **Sleutelpariteit** — alle bronsleutels zijn aanwezig in elk doel
- **`[EN]` fallback-markeringen** — verouderde markeringen van eerdere uitvoeringen
- **Lege vertalingen** — blanco waarden die erdoorheen zijn geglipt
- **Scriptnaleving** — niet-Latijnse locales met uitsluitend ASCII-vertalingen
- **Behoud van placeholders** — ICU-placeholders komen overeen met de bron
- **Coderingsproblemen** — BOM-markeringen, onzichtbare tekens

Dit is ook beschikbaar als een op zichzelf staande `i18n-rosetta verify` opdracht voor CI-gates.

## Contentvertaling (Fase 2)

Voor Docusaurus- en Hugo-projecten voert `sync` een tweede fase uit na de vertaling van JSON-sleutels. Deze fase vertaalt Markdown- en MDX-bestanden (documentatie, blogposts, tutorials) met behulp van dezelfde methoden en Quality Gate.

### Hoe het werkt

1. Rosetta ontdekt alle broncontentbestanden (`.md`, `.mdx`) door de content/docs-map te doorlopen
2. Voor elk bestand × locale-paar wordt een afzonderlijk content-lock-bestand (`.i18n-rosetta-content.lock`) gecontroleerd op wijzigingen in de SHA-256-hash
3. Gewijzigde of ontbrekende bestanden worden verzameld in een platte pool van werkitems
4. De pool wordt verwerkt met **parallelle gelijktijdigheid** (standaard: 12 gelijktijdige API-verzoeken)

```
Phase 2: content (79 translations to process, 341 skipped, concurrency: 12)

    [1/79] (1%)  docs/concepts/security.md → ja [RE-TRANSLATE] (~3328s left)
    [2/79] (3%)  docs/concepts/security.md → th [RE-TRANSLATE] (~1821s left)
    ...
    [79/79] (100%) blog/v3-2-quality.md → de [OK]

  [OK] Created 79 content file(s), 341 unchanged
```

### Parallellisme

Zowel Fase 1 (JSON-sleutels) als Fase 2 (content) worden nu parallel uitgevoerd:

- **Fase 1**: Alle locale-vertalingen worden gelijktijdig gestart (standaard: 50 gelijktijdige locales). Binnen elke locale worden API-batches ook parallel uitgevoerd (4 gelijktijdige batches). Een synchronisatie van 12 locales met 120 sleutels is in ~1 minuut voltooid in plaats van ~15 minuten.
- **Fase 2**: Alle combinaties van bestand × locale worden vertaald als een platte pool (standaard: 12 gelijktijdige API-verzoeken). Verschillende bestanden en verschillende locales worden gelijktijdig vertaald.

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

Tijdens de vertaling schermt rosetta niet-vertaalbare content af:

- **Codeblokken** (omkaderd en ingesprongen) worden vervangen door placeholders
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

## Opnieuw vertalen forceren

Forceer dat specifieke sleutels opnieuw worden vertaald, zelfs als ze ongewijzigd zijn:

```bash
npx i18n-rosetta sync --force-keys "hero.title,nav.about"
```

## Kostenraming

Voordat de vertaling begint, genereert rosetta een **pre-sync kostenrapport** dat de geschatte kosten per paar toont. Dit wordt automatisch uitgevoerd tijdens elke `sync` — u ziet dit voordat er API-verzoeken worden gedaan.

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

### Wat er wordt geschat

Elke vertaalmethode biedt zijn eigen kostenraming:

| Methode | Kostenbasis | Precisie |
|--------|-----------|-----------|
| `google-translate` | Gepubliceerde tarief van Google ($20/miljoen tekens) | Nauwkeurig |
| `llm` | Varieert per OpenRouter-model | Modelafhankelijk — bekijk [OpenRouter-prijzen](https://openrouter.ai/models) |
| `llm-coached` | Hetzelfde als `llm` plus coaching-contexttokens | Modelafhankelijk |
| `api` | Bepaald door server | Onbekend — kan niet worden geschat zonder het endpoint te bevragen |

Wanneer een methode de kosten niet kan bepalen (LLM-methoden, externe API's), rapporteert rosetta `—` in plaats van te raden. Gebruik `--dry` om kostenramingen te bekijken zonder daadwerkelijk te vertalen.

---

## Zie ook

- [CLI-referentie — sync](/docs/reference/cli#sync) — opdrachtvlaggen en opties
- [Translation Memory](/docs/concepts/translation-memory) — caching en kostenbesparingen
- [Quality Gate](/docs/concepts/quality-gate) — hoe vertalingen worden gevalideerd
- [Vertaalmethoden](/docs/guides/translation-methods) — hoe elke methode werkt
- [Werken met professionele vertalers](/docs/guides/professional-translators) — XLIFF-workflow
- [Configuratie](/docs/getting-started/configuration) — configuratiereferentie
- [CI/CD-gids](/docs/guides/ci-cd) — synchronisaties automatiseren in uw pijplijn