---
sidebar_position: 9
title: "Agent Guide: Paggamit ng i18n-rosetta"
description: "Paano mag-install, mag-configure, at mag-run ng i18n-rosetta ang mga AI agent para i-translate ang mga locale file."
---
# Agent Guide: Paggamit ng i18n-rosetta

Ang i18n-rosetta ay isang CLI tool na nagta-translate ng locale files ng app mo gamit ang isang command. Ang guide na ito ay para sa mga AI agent (o mga developer na nagtatrabaho kasama ng mga AI agent) na gustong pumunta mula zero hanggang sa translated locale files nang mabilis.

:::tip Pamilyar na ba?
Kung kailangan mo lang ng mga command, pumunta na sa [CLI Reference](/docs/reference/cli). Kung gusto mong mag-build at mag-benchmark ng translation method, tingnan ang [Arena Agent Guide](https://mtevalarena.org/docs/getting-started/agent-guide).
:::

---

## Environment Setup

```bash
# No global install needed — npx runs it directly
npx i18n-rosetta sync
```

**Mga Requirement:**
- Node.js 18+
- Isang API key para sa iyong translation provider

**API key setup** — kailangan ng rosetta ng kahit isang key depende sa kung aling mga method ang gagamitin mo:

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

Nag-a-auto-detect ang Rosetta ng iyong mga locale file, ng format ng mga ito (JSON, TOML, YAML, PO), at ng iyong mga target language:

```bash
npx i18n-rosetta sync
```

**Ano ang mangyayari:**
1. Maglo-load ng `i18n-rosetta.config.json` (o mag-a-auto-detect ng settings)
2. I-i-scan ang iyong source locale file, ifa-flatten ang mga nested key
3. Iko-compare laban sa `.i18n-rosetta.lock` (mga SHA-256 hash ng mga na-translate na value dati)
4. Iche-check ang `.rosetta/tm.json` para sa mga cached translation (Translation Memory)
5. Ita-translate lang ang mga **changed, missing, o stale na key** via sa naka-configure na method
6. Ira-run ang quality gate (5 checks) sa bawat translation
7. Isusulat ang mga pumasa na translation sa target locale file
8. I-a-update ang lock file at TM cache

Sa isang typical na re-run pagkatapos magbago ng isang key, ang step 4 ay magse-serve ng 142 keys mula sa cache at ang step 5 ay magta-translate ng 1 key. Ito ang dahilan kung bakit mabilis at mura ang mga susunod na sync.

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

Mga key field:

| Field | Purpose | Default |
|-------|---------|---------|
| `inputLocale` | Source language | `en` |
| `pairs` | Map ng source→target na may method config | (required) |
| `localesDir` | Kung saan nakalagay ang mga locale file | (auto-detected) |
| `model` | LLM model para sa `llm`/`llm-coached` methods | `google/gemini-2.5-flash` |
| `batchSize` | Keys per API call | 80 (LLM), 128 (Google) |
| `jsonConcurrency` | Parallel locale translations para sa JSON keys | 200 |
| `contentConcurrency` | Parallel API calls para sa content translation | 48 |

Buong reference: [Configuration](/docs/getting-started/configuration)

---

## Translation Methods

| Method | Kailan gagamitin | Cost | Kailangan ng API key |
|--------|------------|------|---------------|
| **`llm`** | General-purpose, maganda para sa mga well-resourced language | Per-token (depende sa model) | `OPENROUTER_API_KEY` |
| **`llm-coached`** | Kapag mayroon kang grammar rules/dictionary para sa target language | Per-token + coaching context | `OPENROUTER_API_KEY` |
| **`google-translate`** | High-resource languages kung saan maayos gumagana ang GT | $20/million chars | `GOOGLE_TRANSLATE_API_KEY` |
| **`api`** | Custom pipeline na naka-host sa likod ng isang HTTP endpoint | Server-determined | Wala (endpoint ang nagha-handle ng auth) |
| **`plugin`** | Pre-packaged method na naka-install locally | Nag-iiba-iba | Nag-iiba-iba |

Mga Detalye: [Translation Methods](/docs/guides/translation-methods)

---

## Coaching Data

Para sa mga `llm-coached` pair, ginagabayan ng coaching data ang LLM gamit ang explicit na linguistic knowledge. Gumawa po ng coaching file:

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

Bini-verify ng quality gate na ang mga dictionary term ay talagang lumalabas sa output — ang mga violation ay nalo-log bilang mga `[TERM]` warning.

Mga Detalye: [Coaching Data](/docs/concepts/coaching-data)

---

## Quality Gate

Dumadaan ang bawat translation sa limang automated check bago ito isulat sa disk:

| Check | Ano ang nade-detect nito | Halimbawa |
|-------|----------------|---------|
| **Empty/blank** | Walang ibinalik ang model | `""` |
| **Source echo** | Ibinalik ng model ang English input nang walang pagbabago | `"Welcome"` para sa Japanese |
| **Hallucination loop** | Mga naulit na trigram | `"Qo' Qo' Qo' Qo'"` |
| **Length inflation** | Ang output ay 4×+ na mas mahaba kaysa sa source | 10-char source → 50-char output |
| **Script compliance** | Maling script para sa locale | Latin text para sa Arabic locale |

Nalo-log ang mga failure gamit ang `[GATE]` prefix. Walang mga silent fallback — kung mag-fail ang isang translation, inire-report ito, hindi tahimik na tinatanggap.

Mga Detalye: [Quality Gate](/docs/concepts/quality-gate)

---

## Translation Memory

Kina-cache ng Rosetta ang mga translation sa `.rosetta/tm.json`, naka-key by source text + locale + method. Sa mga susunod na sync, ang mga hindi nagbagong key ay isine-serve mula sa cache — walang API call, walang cost.

```
[TM] 142 key(s) served from cache
Translating 3 key(s) to French (llm)... [OK]
```

Para i-bypass ang cache para sa isang run: `npx i18n-rosetta sync --no-tm`

Mga Detalye: [Translation Memory](/docs/concepts/translation-memory)

---

## Generated Files

Gumagawa ang Rosetta ng ilang file sa iyong project. Alamin kung ano ang mga ito para hindi mo sinasadyang ma-delete o ma-commit ang mga maling file:

| File | Purpose | Git? |
|------|---------|------|
| `.i18n-rosetta.lock` | Mga SHA-256 hash ng mga na-translate na source value (change detection) | **Oo** — i-commit ito |
| `.i18n-rosetta-content.lock` | Pareho, pero para sa mga Markdown/MDX content file | **Oo** — i-commit ito |
| `.rosetta/tm.json` | Translation Memory cache | **Oo** — i-commit ito (nakakatipid sa API costs para sa team) |
| `.rosetta/coaching/` | Coaching data directory | **Oo** — ito ang iyong linguistic knowledge |
| `i18n-rosetta.config.json` | Project configuration | **Oo** — i-commit ito |

---

## Common Patterns

**Mag-translate ng isang language pair:**
```bash
npx i18n-rosetta sync --pair en-fr
```

**I-translate ang lahat ng naka-configure na pair:**
```bash
npx i18n-rosetta sync
```
Tinatranslate ng Rosetta ang lahat ng locale in parallel. Dahil sa TM caching, ang mga nagbagong key lang ang tatama sa API.

**Content mode (Markdown/MDX para sa Docusaurus, Hugo, atbp.):**
```bash
npx i18n-rosetta sync --content
```
Nagtata-translate ng mga docs, blog post, at content file kasabay ng locale JSON. Gumagamit ng parallel concurrency (default: 48 simultaneous API calls). I-tune ito gamit ang `--content-concurrency`.

**Dry run (preview nang walang sinusulat):**
```bash
npx i18n-rosetta sync --dry-run
```

**I-force re-translate ang mga specific na key:**
```bash
npx i18n-rosetta sync --force-keys "hero.title,nav.about"
```

**I-force re-translate ang lahat ng content file:**
```bash
npx i18n-rosetta sync --force-content
```

**I-check ang translation status:**
```bash
npx i18n-rosetta status
```
Ipinapakita ang coverage, quality tiers, at plugin info para sa bawat pair.

**Mag-audit para sa mga untranslated na fallback:**
```bash
npx i18n-rosetta audit
```
Inililista ang lahat ng `[EN]` fallback value na kailangan ng translation.

---

## Troubleshooting

| Problema | Solusyon |
|---------|-----|
| `OPENROUTER_API_KEY not set` | I-export ang key o idagdag ito sa `.env` sa inyong project root |
| `No locale files found` | I-set ang `localesDir` sa config, o siguraduhin na ang iyong mga locale file ay nagma-match sa standard naming (`en.json`, `fr.json`) |
| `[GATE] Script compliance failed` | Nakakuha ng Latin text ang iyong target locale sa halip na ang inaasahang script — subukan ang ibang model o magdagdag ng coaching data |
| `[GATE] Source echo` | Ibinalik ng model ang English nang walang pagbabago — karaniwang naaayos ito ng coaching data o ng ibang model |
| Naka-cache ang lahat ng translation | I-run gamit ang `--no-tm` para i-bypass ang cache, o `--force-keys` para sa mga specific na key |
| Lock file conflicts | Gumagamit ang `.i18n-rosetta.lock` ng mga SHA-256 hash — safe na i-resolve ang mga merge conflict sa pamamagitan ng pag-keep sa kahit aling version, tapos i-re-run ang sync |

---

## Ano ang Susunod

- [Quick Start](/docs/getting-started/quick-start) — buong getting-started walkthrough
- [CLI Reference](/docs/reference/cli) — bawat command at flag
- [How It Works](/docs/how-it-works) — ipinaliwanag ang sync pipeline
- [The Eval Harness Bridge](/docs/guides/bridge) — kung paano kumokonekta ang rosetta sa Arena
- **Gusto mo bang mag-build ng sarili mong translation method?** Tingnan ang [Arena Agent Guide](https://mtevalarena.org/docs/getting-started/agent-guide) — mag-build ng method, patunayan na gumagana ito, at manalo ng mga premyo.