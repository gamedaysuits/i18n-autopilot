---
sidebar_position: 2
title: "Paano Gumagana ang Sync"
---
# Paano Gumagana ang Sync

Ang `sync` command ay ang core operation ng rosetta. Heto po ang nangyayari kapag nag-run kayo ng `npx i18n-rosetta sync`.

## Overview ng Pipeline

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

## Step by Step

### 1. Config Resolution

Nilo-load ng Rosetta ang `i18n-rosetta.config.json` (o nag-a-auto-detect ng settings). Nire-resolve nito ang:
- Source locale at target locales
- Ang pair graph (kung aling source→target combinations ang ipo-process)
- Per-pair method, model, at quality settings

Bago mag-scan ng files, nagpi-print ang rosetta ng startup header:

```
i18n-rosetta v3.3.2

[INFO] Detected format: json (auto)
[INFO] Detected framework: Hugo
```

- **Version banner**: Ipinapakita ang naka-install na version para sa debugging at issue reports.
- **Format detection**: Nire-report ang file format at kung ito ba ay na-auto-detect `(auto)` o explicitly configured `(config)`. Supported ang `json`, `toml`, at `yaml`.
- **Framework detection**: Kapag naka-set ang `contentDir`, ina-identify nito ang framework (`Hugo`) para i-confirm na active ang content sync.

### 2. Source Scanning

Nilo-load ang source locale file at pina-flatten into a key→value map:

```json
// Input (nested)
{ "hero": { "title": "Welcome", "subtitle": "Build" } }

// Flattened
{ "hero.title": "Welcome", "hero.subtitle": "Build" }
```

### 3. Change Detection

Binabasa ng Rosetta ang `.i18n-rosetta.lock`, na nag-i-store ng SHA-256 hashes ng mga previously translated na source values. Para sa bawat key, tinitingnan nito ang:

| Condition | Action |
|-----------|--------|
| Nawawala ang key sa target | **Translate** |
| Nagbago ang source hash simula nung last sync | **Re-translate** (stale) |
| Nag-uumpisa ang target value sa `[EN]` | **Re-translate** (legacy fallback marker) |
| Walang pagbabago sa source hash, nag-e-exist ang key | **Skip** |

Kaya po tina-translate lang ng rosetta kung ano ang nagbago — hindi nito nire-re-translate ang buong file ninyo sa bawat sync.

### 4. Batching

Gini-group ang mga keys into batches (default: 80 keys/batch para sa LLM, 128 para sa Google Translate). Nire-reduce ng batching ang API round trips habang pinapanatiling manageable ang mga prompts.

Habang nagta-translate, nagdi-display ang rosetta ng inline progress bar na nag-u-update pagkatapos makumpleto ng bawat batch:

```
[INFO] fr.json — 2,847 missing
     ████████████████░░░░░░░░░░░░░░░░ 1,440/2,847 keys
```

Nagre-render ang bar gamit ang `\r` carriage return para sa in-place updates — walang scrolling. Naka-suppress ito sa `--quiet` at `--json` modes.

### 4b. Translation Memory

Bago mag-batching, tinitingnan ng rosetta ang Translation Memory cache (`.rosetta/tm.json`). Ang mga keys na may source text + locale + method na nagma-match sa previous translation ay isi-serve instantly mula sa cache — no API call needed.

```
  [TM] 142 key(s) served from cache
  Translating 3 key(s) to French (llm)... [OK]
```

TM ang primary cost-saving mechanism. Ang pag-re-run ng sync pagkatapos ng isang key change ay ita-translate lang ang isang key na iyon, hindi ang buong file. Tingnan ang [Translation Memory](/docs/concepts/translation-memory) para sa details.

Para ma-bypass ang cache sa isang single run: `i18n-rosetta sync --no-tm`

### 5. Translation

Ipinapadala ang bawat batch sa configured translation method:

- **`llm`**: Structured prompt sa OpenRouter na may register at gender guidance instructions
- **`llm-coached`**: Pareho, pero may injected na grammar rules, dictionary, at style notes
- **`google-translate`**: Google Cloud Translation API v2 batch request
- **`api`**: HTTP POST sa isang remote endpoint

Ang system message (register, gender guidance, rules) ay identical across batches para sa isang given locale, kaya nagkakaroon ng **prompt caching** — kina-cache ng mga providers tulad ng Anthropic at Google ang mga repeated system messages, na nagre-reduce ng token costs.

### 6. Quality Gate

Bawat translation ay vina-validate bago ito isulat sa disk. May limang checks na nagra-run:

| Check | Ano ang nahuhuli nito | Example |
|-------|----------------|---------|
| **Empty/blank** | Walang ni-return ang model | `""` |
| **Source echo** | Ni-return ng model ang English input | `"Welcome"` para sa Japanese |
| **Hallucination loop** | Repeated trigrams | `"Qo' Qo' Qo' Qo'"` |
| **Length inflation** | Ang output ay 4×+ na mas mahaba kaysa sa source | 10-char source → 50-char output |
| **Script compliance** | Maling script para sa locale | Latin text para sa Arabic locale |

Nalo-log ang mga failures gamit ang `[GATE]` prefix. Walang silent fallbacks.

Tingnan ang [Quality Gate](/docs/concepts/quality-gate) para sa details.

### 6b. Terminology Verification

Para sa mga coached pairs na may dictionary, tinitingnan ng rosetta kung ginamit ba talaga ng LLM ang required terminology pagkatapos ng translation. Nalo-log ang mga violations bilang `[TERM]` warnings:

```
[TERM] en→fr: 2 term violation(s)
  • "dashboard" → expected "tableau de bord" but got "panneau"
```

Mga warnings po ito, hindi blocking errors — isinusulat pa rin ang translation.

### 7. Retry Cascade

Kapag may JSON parse failure o batch-level errors, magre-retry ang rosetta gamit ang progressively smaller batches:

```
Full batch (80 keys) → Failed
  └→ Half batch (40 keys) → 1 failure
      └→ Individual keys (1 each) → Isolates the problem key
```

Naka-cap ang retry budget sa `maxRetries` (default: 3) para maiwasan ang runaway token spend.

### 8. Write & Lock

Isinusulat ang mga pumapasang translations sa target locale file, habang pini-preserve ang original nesting structure. Ina-update ang lock file gamit ang mga bagong SHA-256 hashes.

### 9. Verification

Pagkatapos ma-process ang lahat ng pairs, ire-re-read ng rosetta ang mga isinulat na locale files mula sa disk at magra-run ng verification pass (maliban kung naka-set ang `--no-verify`). Sinasalo nito ang gap sa pagitan ng sync reporting success at ng mga keys na mali pala talaga:

- **Key parity** — present ang lahat ng source keys sa bawat target
- **`[EN]` fallback markers** — legacy markers mula sa mga prior runs
- **Empty translations** — mga blank values na nakalusot
- **Script compliance** — non-Latin locales na may ASCII-only translations
- **Placeholder preservation** — nagma-match ang ICU placeholders sa source
- **Encoding issues** — BOM markers, invisible characters

Available din ito bilang isang standalone `i18n-rosetta verify` command para sa mga CI gates.

## Content Translation (Phase 2)

Para sa mga Docusaurus at Hugo projects, nagra-run ang `sync` ng second phase pagkatapos ng JSON key translation. Tina-translate ng phase na ito ang mga Markdown at MDX files (docs, blog posts, tutorials) gamit ang parehong methods at quality gate.

### Paano ito gumagana

1. Dini-discover ng Rosetta ang lahat ng source content files (`.md`, `.mdx`) sa pamamagitan ng pag-walk sa content/docs directory
2. Para sa bawat file × locale pair, tinitingnan nito ang isang separate content lock file (`.i18n-rosetta-content.lock`) para sa mga SHA-256 hash changes
3. Kinokolekta ang mga nagbago o nawawalang files sa isang flat work-item pool
4. Pipo-process ang pool nang may **parallel concurrency** (default: 12 simultaneous API calls)

```
Phase 2: content (79 translations to process, 341 skipped, concurrency: 48)

    [1/79] (1%)  docs/concepts/security.md → ja [RE-TRANSLATE] (~3328s left)
    [2/79] (3%)  docs/concepts/security.md → th [RE-TRANSLATE] (~1821s left)
    ...
    [79/79] (100%) blog/v3-2-quality.md → de [OK]

  [OK] Created 79 content file(s), 341 unchanged
```

### Parallelism

Parehong nagra-run in parallel ngayon ang Phase 1 (JSON keys) at Phase 2 (content):

- **Phase 1**: Sabay-sabay na nagfa-fire ang lahat ng locale translations (default: 50 simultaneous locales). Sa loob ng bawat locale, nagra-run din in parallel ang mga API batches (4 concurrent batches). Ang isang 12-locale sync na may 120 keys ay nakukumpleto sa loob ng ~1 minute sa halip na ~15 minutes.
- **Phase 2**: Tina-translate ang lahat ng file×locale combinations bilang isang flat pool (default: 12 simultaneous API calls). Sabay-sabay na tina-translate ang iba't ibang files at iba't ibang locales.

I-control ang parallelism gamit ang `--json-concurrency`, `--content-concurrency`, o `--concurrency` (sine-set pareho):

```bash
# Faster JSON sync (more parallel locale translations)
npx i18n-rosetta sync --json-concurrency 30

# Faster content sync (more parallel API calls)
npx i18n-rosetta sync --content-concurrency 20

# Slower (gentler on rate limits)
npx i18n-rosetta sync --concurrency 4
```

### Content protection

Habang nagta-translate, shini-shield ng rosetta ang mga non-translatable content:

- Ang mga **Code blocks** (fenced at indented) ay pinapalitan ng placeholders
- Ang mga **Frontmatter** fields na wala sa `translatableFields` list ay pini-preserve as-is
- Protektado ang mga **Links**, image paths, at HTML tags
- Shini-shield ang mga **Shortcodes** at interpolation variables (hal., `{count}`, `{{.Params.title}}`)

Pagkatapos ng translation, nire-restore at vina-validate ang lahat ng placeholders. Kung may nawawala o corrupt, ire-reject ang translation at magre-retry.

## Partial Success

Hindi bino-block ng isang failed batch ang iba. Kung 9 out of 10 batches ang nag-succeed, isusulat ang 9 na iyon. Nalo-log ang failed batch, at pwede ninyong i-re-run ang `sync` para mag-retry.

## Dry Run

I-preview kung ano ang magbabago nang hindi nagsusulat ng kahit anong files:

```bash
npx i18n-rosetta sync --dry-run
```

## Force Re-translate

I-force ang specific keys na ma-re-translate kahit walang pagbabago:

```bash
npx i18n-rosetta sync --force-keys "hero.title,nav.about"
```

## Cost Estimation

Bago mag-translate, nagge-generate ang rosetta ng **pre-sync cost report** na nagpapakita ng estimated costs per pair. Nagra-run ito automatically sa bawat `sync` — makikita ninyo ito bago pa man magkaroon ng anumang API calls.

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

### Ano ang Nae-estimate

Nagpo-provide ang bawat translation method ng sarili nitong cost estimate:

| Method | Cost Basis | Precision |
|--------|-----------|-----------|
| `google-translate` | Published rate ng Google ($20/million chars) | Accurate |
| `llm` | Nag-iiba depende sa OpenRouter model | Model-dependent — i-check ang [OpenRouter pricing](https://openrouter.ai/models) |
| `llm-coached` | Pareho sa `llm` plus coaching context tokens | Model-dependent |
| `api` | Server-determined | Unknown — hindi ma-estimate nang hindi kini-query ang endpoint |

Kapag hindi ma-determine ng isang method ang cost (LLM methods, remote APIs), nagre-report ang rosetta ng `—` sa halip na manghula. Gamitin ang `--dry` para makita ang cost estimates nang hindi pa talaga nagta-translate.

---

## Tingnan Din

- [CLI Reference — sync](/docs/reference/cli#sync) — command flags at options
- [Translation Memory](/docs/concepts/translation-memory) — caching at cost savings
- [Quality Gate](/docs/concepts/quality-gate) — kung paano vina-validate ang mga translations
- [Translation Methods](/docs/guides/translation-methods) — kung paano gumagana ang bawat method
- [Working with Professional Translators](/docs/guides/professional-translators) — XLIFF workflow
- [Configuration](/docs/getting-started/configuration) — config reference
- [CI/CD Guide](/docs/guides/ci-cd) — pag-automate ng mga syncs sa inyong pipeline