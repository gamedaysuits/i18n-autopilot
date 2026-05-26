---
name: fst-discovery
description: >
  Discover and link FST (Finite State Transducer) morphological analyzers for
  language reference cards. Use when building out or updating a language card
  and you need to find if an FST exists for the target language.
---

# FST Discovery Skill

## When to Use

Activate this skill when:
- Generating or updating a language reference card
- A user asks about FST availability for a specific language
- Populating the `resources.fsts` field on a language card
- Adding a new language to the eval harness that may have morphological tools

## Discovery Procedure

### Step 1: Check GiellaLT

GiellaLT (https://github.com/giellalt) maintains FST transducers for 80+ languages,
primarily Indigenous and minority languages.

1. Check if `giellalt/lang-{iso639_3}` exists:
   ```
   https://api.github.com/repos/giellalt/lang-{code}
   ```

2. Check releases for FST binaries:
   ```
   https://api.github.com/repos/giellalt/lang-{code}/releases?per_page=10
   ```

3. **Legacy format** (auto-installable by the eval harness):
   - Release tags starting with `fst-` (e.g., `fst-v2021.7.8`)
   - Assets are `.zip` files containing `.hfstol` analyzers
   - Example: `lang-crk` has `plains-cree-fsts-fst-v2021.7.8.zip`

4. **Divvun format** (requires Divvun manager):
   - Release tags starting with `speller-`, `grammar-`, or `tts-textproc-`
   - Assets are `.drb` or `.pkt.tar.zst` packages
   - Users need https://divvun.no/ to extract `.hfstol` files
   - Example: `lang-sme` has `speller-sme/v4.5.2`

### Step 2: Check Other FST Sources

If no GiellaLT repo exists, check:

| Source | Languages | URL Pattern |
|--------|-----------|-------------|
| Omorfi | Finnish | `github.com/flammie/omorfi` |
| Apertium | Many pairs | `github.com/apertium/apertium-{code}` |
| HFST ecosystem | Various | Search GitHub for `{language} hfst` |
| ALTLab (UAlberta) | Cree, Ojibwe | `github.com/UAlbertaALTLab` |

### Step 3: Populate the Language Card

Add entries to the reference card's `resources.fsts` array:

```json
{
  "resources": {
    "fsts": [
      {
        "name": "GiellaLT {Language} FST (lang-{code})",
        "url": "https://github.com/giellalt/lang-{code}/releases",
        "type": "morphological-analyzer"
      }
    ]
  }
}
```

Valid `type` values (from `language-reference.schema.json`):
- `morphological-analyzer` — The most common; analyzes word forms
- `spell-checker` — Checks spelling validity
- `tokenizer` — Splits text into tokens
- `transliterator` — Converts between scripts/orthographies

### Step 4: Update the Harness Registry

If the FST has **legacy-format releases** (standalone `.hfstol` zips), also add
it to the eval harness's FST registry:

**File**: `crk-translate/gds-mt-eval-harness/mt_eval_harness/plugins/fst_installer.py`

```python
GIELLALT_FST_REGISTRY["new_code"] = {
    "name": "Language Name",
    "repo": "giellalt/lang-new_code",
    "release_tag": "fst-vYYYY.M.D",
    "asset_pattern": "language-name-fsts-",
    "format": "legacy-zip",
}
```

For Divvun-only languages, add with `"format": "divvun"` — the harness will
print guidance instead of auto-installing.

### Step 5: Validate

```bash
# Validate the language card
node --test test/language-reference.test.js

# Validate the harness
cd crk-translate/gds-mt-eval-harness && .venv/bin/python -m pytest tests/ -q
```

## Known GiellaLT Languages with FST Releases

### Legacy Format (auto-installable)
| Code | Language | Release Tag |
|------|----------|-------------|
| crk  | Plains Cree | fst-v2021.7.8 |

### Divvun Format (manual install)
| Code | Language | Latest Release Type |
|------|----------|---------------------|
| sme  | Northern Sámi | speller, grammar, tts |
| sma  | Southern Sámi | speller |
| smj  | Lule Sámi | speller, grammar |
| smn  | Inari Sámi | speller, grammar |
| sms  | Skolt Sámi | speller, grammar |
| fin  | Finnish | speller, grammar |
| nob  | Norwegian Bokmål | speller, grammar |
| iku  | Inuktitut | speller |

## Important Notes

- The `resources.fsts` field on the card is **documentation** — it tells users
  and the eval harness what tools exist for the language.
- The eval harness's `GIELLALT_FST_REGISTRY` is the **runtime gate** — it
  controls which FSTs are required for evaluation.
- Keep both in sync when adding a new language.
- The card generator (`scripts/generate-language-card.mjs`) now auto-discovers
  GiellaLT FSTs during card generation. Manual updates are only needed for
  non-GiellaLT FST sources.
