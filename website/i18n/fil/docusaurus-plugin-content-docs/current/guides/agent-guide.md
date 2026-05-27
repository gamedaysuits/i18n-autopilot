---
sidebar_position: 9
title: "Agent Guide: Paggamit ng i18n-rosetta"
description: "Kung paano i-install, i-configure, at i-run ng mga AI agents ang i18n-rosetta para i-translate ang mga locale files."
---
# Agent Guide: Paggamit ng i18n-rosetta

Ang i18n-rosetta ay isang CLI tool na nagta-translate ng locale files ng app niyo gamit ang isang command. Ang guide na ito ay para sa mga AI agents (o developers na nagtatrabaho kasama ang mga AI agents) na gustong mapabilis ang pag-setup mula zero hanggang sa magkaroon ng translated locale files.

:::tip Pamilyar na po ba?
Kung kailangan niyo lang po ng commands, dumiretso na sa [CLI Reference](/docs/reference/cli). Kung gusto niyo namang mag-build at mag-benchmark ng translation method, tingnan ang [Arena Agent Guide](https://mtevalarena.org/docs/getting-started/agent-guide).
:::

---

## Environment Setup

```bash
# No global install needed — npx runs it directly
npx i18n-rosetta sync
```

**Mga Kailangan:**
- Node.js 18+
- Isang API key para sa inyong translation provider

**API key setup** — kailangan po ng rosetta ng kahit isang key depende sa kung aling methods ang gagamitin niyo:

```bash
# Option 1: export (session only)
export OPENROUTER_API_KEY="sk-or-..."        # for llm / llm-coached methods
export GOOGLE_TRANSLATE_API_KEY="AIza..."    # for google-translate method

# Option 2: .env file in your project root (persistent, gitignored)
echo 'OPENROUTER_API_KEY=sk-or-...' > .env
```

Awtomatikong binabasa ng Rosetta ang `.env`. Kumuha po ng OpenRouter key sa [openrouter.ai/keys](https://openrouter.ai/keys).

---

## First Sync

Awtomatikong nade-detect ng Rosetta ang inyong locale files, ang format ng mga ito (JSON, TOML, YAML, PO), at ang inyong target languages:

```bash
npx i18n-rosetta sync
```

**Ano ang mangyayari:**
1. Ilo-load ang `i18n-rosetta.config.json` (o i-auto-detect ang settings)
2. I-scan ang inyong source locale file, at ifa-flatten ang nested keys
3. Iko-compare ito laban sa `.i18n-rosetta.lock` (SHA-256 hashes ng mga na-translate na values dati)
4. Iche-check ang `.rosetta/tm.json` para sa cached translations (Translation Memory)
5. Ita-translate lang ang **changed, missing, o stale keys** gamit ang naka-configure na method
6. Ira-run ang quality gate (5 checks) sa bawat translation
7. Isusulat ang mga pumasa na translations sa target locale file
8. I-update ang lock file at TM cache

Sa isang tipikal na re-run pagkatapos magbago ng isang key, ise-serve ng step 4 ang 142 keys mula sa cache at ita-translate ng step 5 ang 1 key. Ito po ang dahilan kung bakit mabilis at mura ang mga susunod na syncs.

---

## Configuration

Gumawa po ng `i18n-rosetta.config.json` sa inyong project root:

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

Key fields:

| Field | Purpose | Default |
|-------|---------|---------|
| `inputLocale` | Source language | `en` |
| `pairs` | Map ng source→target na may method config | (required) |
| `localesDir` | Kung saan nakalagay ang locale files | (auto-detected) |
| `model` | LLM model para sa `llm`/`llm-coached` methods | `google/gemini-2.5-flash` |
| `batchSize` | Keys per API call | 30 (LLM), 128 (Google) |
| `concurrency` | Parallel API calls para sa content translation | 12 |

Buong reference: [Configuration](/docs/getting-started/configuration)

---

## Translation Methods

| Method | Kailan gagamitin | Cost | Kailangan ng API key |
|--------|------------|------|---------------|
| **`llm`** | General-purpose, maganda para sa well-resourced languages | Per-token (model-dependent) | `OPENROUTER_API_KEY` |
| **`llm-coached`** | Kapag mayroon kayong grammar rules/dictionary para sa target language | Per-token + coaching context | `OPENROUTER_API_KEY` |
| **`google-translate`** | High-resource languages kung saan maganda ang performance ng GT | $20/million chars | `GOOGLE_TRANSLATE_API_KEY` |
| **`api`** | Custom pipeline na naka-host sa likod ng isang HTTP endpoint | Server-determined | Wala (endpoint ang nagha-handle ng auth) |
| **`plugin`** | Pre-packaged method na naka-install locally | Varies | Varies |

Mga Detalye: [Translation Methods](/docs/guides/translation-methods)

---

## Coaching Data

Para sa `llm-coached` pairs, ginagabayan ng coaching data ang LLM gamit ang explicit linguistic knowledge. Gumawa po ng coaching file:

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

I-reference ito sa inyong pair config:

```json
"en-fr": { "method": "llm-coached", "coachingFile": "coaching/fr.json" }
```

Bini-verify ng quality gate na lumalabas talaga sa output ang mga dictionary terms — ang mga violations ay nalo-log bilang `[TERM]` warnings.

Mga Detalye: [Coaching Data](/docs/concepts/coaching-data)

---

## Quality Gate

Dumadaan po ang bawat translation sa limang automated checks bago ito isulat sa disk:

| Check | Ano ang nahuhuli nito | Example |
|-------|----------------|---------|
| **Empty/blank** | Walang ibinalik ang model | `""` |
| **Source echo** | Ibinalik ng model ang English input nang walang pagbabago | `"Welcome"` para sa Japanese |
| **Hallucination loop** | Inuulit na trigrams | `"Qo' Qo' Qo' Qo'"` |
| **Length inflation** | Ang output ay 4×+ na mas mahaba kaysa sa source | 10-char source → 50-char output |
| **Script compliance** | Maling script para sa locale | Latin text para sa Arabic locale |

Nalo-log ang mga failures na may `[GATE]` prefix. Walang silent fallbacks — kung pumalya ang isang translation, inire-report ito, at hindi basta-bastang tinatanggap.

Mga Detalye: [Quality Gate](/docs/concepts/quality-gate)

---

## Translation Memory

Kina-cache ng Rosetta ang mga translations sa `.rosetta/tm.json`, na naka-key by source text + locale + method. Sa mga susunod na syncs, ang mga unchanged keys ay ise-serve mula sa cache — walang API call, walang gastos.

```
[TM] 142 key(s) served from cache
Translating 3 key(s) to French (llm)... [OK]
```

Para i-bypass ang cache sa isang run: `npx i18n-rosetta sync --no-tm`

Mga Detalye: [Translation Memory](/docs/concepts/translation-memory)

---

## Generated Files

Gumagawa po ang Rosetta ng ilang files sa inyong project. Alamin kung ano ang mga ito para hindi niyo aksidenteng mabura o ma-commit ang mga maling files:

| File | Purpose | Git? |
|------|---------|------|
| `.i18n-rosetta.lock` | SHA-256 hashes ng mga na-translate na source values (change detection) | **Yes** — i-commit ito |
| `.i18n-rosetta-content.lock` | Pareho, pero para sa Markdown/MDX content files | **Yes** — i-commit ito |
| `.rosetta/tm.json` | Translation Memory cache | **Yes** — i-commit ito (nakakatipid sa API costs para sa team) |
| `.rosetta/coaching/` | Coaching data directory | **Yes** — ito ang inyong linguistic knowledge |
| `i18n-rosetta.config.json` | Project configuration | **Yes** — i-commit ito |

---

## Common Patterns

**Mag-translate ng isang language pair:**
```bash
npx i18n-rosetta sync --pair en-fr
```

**I-translate ang lahat ng configured pairs:**
```bash
npx i18n-rosetta sync
```
Pino-process ng Rosetta ang mga pairs nang sequential. Dahil sa TM caching, ang mga changed keys lang ang tatama sa API.

**Content mode (Markdown/MDX para sa Docusaurus, Hugo, atbp.):**
```bash
npx i18n-rosetta sync --content
```
Nagtatranslate ng docs, blog posts, at content files kasabay ng locale JSON. Gumagamit ito ng parallel concurrency (default: 12 simultaneous API calls).

**Dry run (preview nang hindi nagsusulat):**
```bash
npx i18n-rosetta sync --dry-run
```

**I-force re-translate ang specific keys:**
```bash
npx i18n-rosetta sync --force-keys "hero.title,nav.about"
```

**I-force re-translate ang lahat ng content files:**
```bash
npx i18n-rosetta sync --force-content
```

**I-check ang translation status:**
```bash
npx i18n-rosetta status
```
Ipinapakita ang coverage, quality tiers, at plugin info para sa bawat pair.

**Mag-audit para sa untranslated fallbacks:**
```bash
npx i18n-rosetta audit
```
Inililista ang lahat ng `[EN]` fallback values na kailangang i-translate.

---

## Troubleshooting

| Problema | Solusyon |
|---------|-----|
| `OPENROUTER_API_KEY not set` | I-export ang key o idagdag ito sa `.env` sa inyong project root |
| `No locale files found` | I-set ang `localesDir` sa config, o siguraduhing nagma-match ang inyong locale files sa standard naming (`en.json`, `fr.json`) |
| `[GATE] Script compliance failed` | Nakakuha ng Latin text ang inyong target locale imbes na ang inaasahang script — subukan po ang ibang model o magdagdag ng coaching data |
| `[GATE] Source echo` | Ibinalik ng model ang English nang walang pagbabago — kadalasang naaayos ito ng coaching data o ng ibang model |
| Naka-cache ang lahat ng translations | I-run gamit ang `--no-tm` para i-bypass ang cache, o `--force-keys` para sa specific keys |
| Lock file conflicts | Gumagamit ang `.i18n-rosetta.lock` ng SHA-256 hashes — safe i-resolve ang merge conflicts sa pamamagitan ng pag-keep ng kahit aling version, tapos i-run ulit ang sync |

---

## What's Next

- [Quick Start](/docs/getting-started/quick-start) — buong getting-started walkthrough
- [CLI Reference](/docs/reference/cli) — lahat ng command at flag
- [How It Works](/docs/how-it-works) — ipinaliwanag ang sync pipeline
- [The Eval Harness Bridge](/docs/guides/bridge) — kung paano kumokonekta ang rosetta sa Arena
- **Gusto niyo po bang mag-build ng sarili niyong translation method?** Tingnan ang [Arena Agent Guide](https://mtevalarena.org/docs/getting-started/agent-guide) — mag-build ng method, patunayang gumagana ito, at manalo ng prizes.