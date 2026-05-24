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
    C --> D["Diff: find missing,\nstale, and fallback keys"]
    D --> E{"Keys to translate?"}
    E -->|No| F["Done ✓"]
    E -->|Yes| G["Batch keys\n(default 30/batch)"]
    G --> H["Translate batch\n(method-specific)"]
    H --> I["Quality gate\n(validate each key)"]
    I --> J{"All pass?"}
    J -->|Yes| K["Write to locale file"]
    J -->|Failures| L["Retry cascade:\nfull → half → individual"]
    L --> H
    K --> M["Update lock file\n(SHA-256 hashes)"]
    M --> N["Next pair"]
```

## Step by Step

### 1. Config Resolution

Nilo-load ng Rosetta ang `i18n-rosetta.config.json` (o nag-a-auto-detect ng settings). Nire-resolve nito ang:
- Source locale at mga target locale
- Ang pair graph (kung aling source→target combinations ang ipo-process)
- Per-pair method, model, at quality settings

### 2. Source Scanning

Nilo-load ang source locale file at pina-flatten ito sa isang key→value map:

```json
// Input (nested)
{ "hero": { "title": "Welcome", "subtitle": "Build" } }

// Flattened
{ "hero.title": "Welcome", "hero.subtitle": "Build" }
```

### 3. Change Detection

Binabasa ng Rosetta ang `.i18n-rosetta.lock`, na nag-i-store ng SHA-256 hashes ng mga na-translate na source values dati. Para sa bawat key, tinitingnan nito ang:

| Condition | Action |
|-----------|--------|
| Nawawala ang key sa target | **Translate** |
| Nagbago ang source hash simula nung huling sync | **Re-translate** (stale) |
| Nagsisimula ang target value sa `[EN]` | **Re-translate** (fallback placeholder) |
| Walang pagbabago sa source hash, nag-e-exist ang key | **Skip** |

Ito ang dahilan kung bakit tina-translate lang ng rosetta kung ano ang nagbago — hindi nito nire-re-translate ang buong file niyo sa bawat sync.

### 4. Batching

Gini-group ang mga keys sa mga batches (default: 30 keys/batch para sa LLM, 128 para sa Google Translate). Nire-reduce ng batching ang API round trips habang pinapanatiling manageable ang mga prompts.

### 5. Translation

Ipinapadala ang bawat batch sa naka-configure na translation method:

- **`llm`**: Structured prompt sa OpenRouter na may register at gender guidance instructions
- **`llm-coached`**: Pareho, pero may naka-inject na grammar rules, dictionary, at style notes
- **`google-translate`**: Google Cloud Translation API v2 batch request
- **`api`**: HTTP POST sa isang remote endpoint

Ang system message (register, gender guidance, rules) ay pare-pareho across batches para sa isang given locale, kaya nagkakaroon ng **prompt caching** — kina-cache ng mga providers tulad ng Anthropic at Google ang mga inuulit na system messages, kaya nare-reduce ang token costs.

### 6. Quality Gate

Bina-validate ang bawat translation bago ito i-write sa disk. May limang checks na nagra-run:

| Check | Ano ang nahuhuli nito | Example |
|-------|----------------|---------|
| **Empty/blank** | Walang ni-return ang model | `""` |
| **Source echo** | Binalik ng model ang English input | `"Welcome"` para sa Japanese |
| **Hallucination loop** | Inuulit na trigrams | `"Qo' Qo' Qo' Qo'"` |
| **Length inflation** | Ang output ay 4×+ na mas mahaba kaysa sa source | 10-char source → 50-char output |
| **Script compliance** | Maling script para sa locale | Latin text para sa Arabic locale |

Nila-log ang mga failures gamit ang `[GATE]` prefix. Walang silent fallbacks.

Tingnan ang [Quality Gate](/docs/concepts/quality-gate) para sa mga detalye.

### 7. Retry Cascade

Kapag may JSON parse failure o batch-level errors, nagre-retry ang rosetta gamit ang paunti-unting mas maliliit na batches:

```
Full batch (30 keys) → Failed
Half batch (15 keys) → Failed
Individual keys (1 each) → Isolates the problem key
```

Naka-cap ang retry budget sa `maxRetries` (default: 3) para maiwasan ang runaway token spend.

### 8. Write & Lock

Ang mga pumapasang translations ay isinusulat sa target locale file, habang pini-preserve ang original na nesting structure. Ina-update ang lock file gamit ang mga bagong SHA-256 hashes.

## Partial Success

Hindi bina-block ng isang failed batch ang iba. Kung 9 sa 10 batches ang nag-succeed, isusulat ang 9 na iyon. Nila-log ang failed batch, at pwede niyo i-re-run ang `sync` para mag-retry.

## Dry Run

I-preview kung ano ang magbabago nang hindi nagsusulat ng kahit anong files:

```bash
npx i18n-rosetta sync --dry
```

## Force Re-translate

I-force ang mga specific keys na ma-re-translate kahit walang pagbabago:

```bash
npx i18n-rosetta sync --force-keys "hero.title,nav.about"
```

## Cost Estimation

Bago mag-translate, nagge-generate ang rosetta ng isang **pre-sync cost report** na nagpapakita ng estimated costs per pair. Awtomatiko itong nagra-run sa bawat `sync` — makikita niyo ito bago pa man magkaroon ng anumang API calls.

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

### Ano ang Nai-estimate

Nagpo-provide ang bawat translation method ng sarili nitong cost estimate:

| Method | Cost Basis | Precision |
|--------|-----------|-----------|
| `google-translate` | Published rate ng Google ($20/million chars) | Accurate |
| `llm` | Nag-iiba depende sa OpenRouter model | Model-dependent — i-check ang [OpenRouter pricing](https://openrouter.ai/models) |
| `llm-coached` | Pareho sa `llm` plus coaching context tokens | Model-dependent |
| `api` | Server-determined | Unknown — hindi ma-estimate nang hindi kini-query ang endpoint |

Kapag hindi ma-determine ng isang method ang cost (LLM methods, remote APIs), nagre-report ang rosetta ng `—` kaysa manghula. Gamitin ang `--dry` para makita ang cost estimates nang hindi pa talaga nagta-translate.

---

## Tingnan Din

- [CLI Reference — sync](/docs/reference/cli#sync) — command flags at options
- [Quality Gate](/docs/concepts/quality-gate) — kung paano bina-validate ang mga translations
- [Translation Methods](/docs/guides/translation-methods) — kung paano gumagana ang bawat method
- [Configuration](/docs/getting-started/configuration) — config reference
- [CI/CD Guide](/docs/guides/ci-cd) — pag-automate ng mga sync sa inyong pipeline