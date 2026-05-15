---
sidebar_position: 1
slug: /
title: Introduction
---

# i18n-rosetta

Translate your locale files with one command:

```bash
npx i18n-rosetta sync
```

Rosetta auto-detects your locale files, their format, and the target languages. It translates missing keys, skips what's already done, and writes the results. That's it.

## Why Not Just Script It Yourself?

You could write a quick script that loops through your English keys and calls Google Translate. Most developers do — it takes about 30 lines. Here's why it breaks:

- **No change detection.** When you update an English string, the translation stays stale forever. Rosetta tracks every source value with SHA-256 hashes and re-translates only what changed.
- **No batching.** One API call per key means 200 keys = 200 round trips. Rosetta batches intelligently (configurable, default 30 keys/batch for LLM, 128 for Google).
- **No quality gate.** Machine translation hallucinates, echoes the source back, or outputs in the wrong script. Rosetta validates every translation before writing it — wrong-script, length inflation, and source echoes are caught and rejected.
- **No format awareness.** Hardcoded to JSON? Rosetta handles JSON, TOML, YAML, and Hugo Markdown (frontmatter + body) with auto-detection.
- **No safety.** Rosetta guards against prototype pollution, path traversal via crafted locale codes, and code block corruption during Markdown translation.

Rosetta is the production version of that script.

## What It Does

You handle the i18n framework (next-intl, i18next, Hugo). Rosetta handles the translation files.

- **Multi-format** — JSON, TOML, YAML, and Hugo Markdown (front matter + body)
- **Incremental** — Only translates what changed (SHA-256 hash tracking)
- **Quality-gated** — Validates every translation: catches hallucinations, wrong-script output, source echoes, and length inflation
- **Content-aware** — LLM methods shield code blocks, shortcodes, links, and interpolation variables during Markdown translation
- **Pipeline tools** — `lint`, `audit`, `integrity`, `seo` for CI gates
- **Zero dependencies** — Node.js built-ins only. No SDKs, no native modules. Requires Node 20+

## Beyond Google Translate

The quick start gets you running with an LLM or Google Translate. But Google Translate supports ~130 languages. There are over 7,000.

**Rosetta's core idea: the translation method is configurable per language pair.** Use Google Translate for French, an LLM with morphological coaching for Plains Cree, and a community-hosted API for Quechua — all in the same project, all with the same CLI.

```json
{
  "version": 3,
  "pairs": {
    "en:fr": { "method": "google-translate" },
    "en:ja": { "method": "llm" },
    "en:crk": { "methodPlugin": "crk-coached-v1" }
  }
}
```

If you can figure out how to translate a language pair — through prompt engineering, community dictionaries, FST pipelines, or fine-tuned models — rosetta lets you package that method as a plugin and deploy it alongside everything else.

> Born from translating a production website into Plains Cree, where no off-the-shelf API exists. The per-pair architecture isn't theoretical — it exists because one project needed Google Translate for French and a coached FST pipeline for an Indigenous language, running side by side in the same sync command.

The companion [MT Eval Harness](https://github.com/gamedaysuits/gds-mt-eval-harness) lets you benchmark and compare translation approaches, then export working methods as rosetta plugins.

## Next Steps

- **[Installation](/docs/getting-started/installation)** — Get set up in 2 minutes
- **[Quick Start](/docs/getting-started/quick-start)** — Run your first sync
- **[Translation Methods](/docs/guides/translation-methods)** — Choose the right method for your project
- **[Architecture](/docs/concepts/architecture)** — Understand the ecosystem
