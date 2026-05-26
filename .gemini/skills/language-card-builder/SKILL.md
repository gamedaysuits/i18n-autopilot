---
name: language-card-builder
description: >
  Build, complete, or audit a language reference card for i18n-rosetta.
  This is a stepwise research skill — each language card requires investigating
  data sources, linguistic properties, available NLP tools, corpora, and
  community resources. Use when adding a new language, completing a partially-
  scaffolded card, or auditing an existing card for completeness.
---

# Language Card Builder Skill

## Philosophy

Language cards are **research artifacts**, not generated files. The card generator
script (`scripts/generate-language-card.mjs`) handles mechanical lookups (IANA,
CLDR, Glottolog, NLLB), but it produces a scaffold with TODOs. This skill covers
the full research-and-populate workflow for every section of a language card.

A good language card should feel like it was written by someone who spent an
afternoon reading about the language and its NLP ecosystem. Not by a script
that scraped a few APIs.

## When to Use

- Adding a new language to i18n-rosetta
- Completing a scaffolded card (has TODOs)
- Auditing existing cards for accuracy and completeness
- Updating a card after discovering new resources
- Bulk-updating cards (e.g., adding FSTs across all GiellaLT-supported languages)

## Card Architecture

Each language has TWO card files:

| Card | Location | Purpose |
|------|----------|---------|
| **Runtime** | `lib/data/language-cards/{code}.json` | Shipped to client. Minimal, no encyclopedic data. |
| **Reference** | `lib/data/language-reference/{code}.json` | Full research data. Used by eval harness + docs. |

The runtime card is a strict subset — it contains rules, script info, and
provider support. The reference card adds linguisticChallenges, encyclopedic
data, and resources.

## Step-by-Step Procedure

### Step 0: Scaffold (if new language)

If the language has no card files yet, run the card generator first:

```bash
node scripts/generate-language-card.mjs {code} --dry-run
```

Review the output, then run without `--dry-run` to write files. This handles:
- ✅ IANA/BCP-47 resolution, ISO codes
- ✅ CLDR script, direction, plurals, typography, capitalization
- ✅ Glottolog family and classification
- ✅ NLLB code mapping
- ✅ Provider method support (Google, DeepL, Azure, etc.)
- ✅ GiellaLT FST auto-discovery (via GitHub API)

### Step 1: Native Name (Endonym)

Find the language's native name. This is how speakers refer to their own language.

**Sources** (in priority order):
1. Wikipedia article for the language (usually in the first paragraph)
2. Ethnologue entry (if accessible)
3. Glottolog record
4. Community language websites

**Examples**:
- French → `français`
- Plains Cree → `nêhiyawêwin`
- Yoruba → `Èdè Yorùbá`

**Validation**: Ensure proper diacritics and script. Don't anglicize.

### Step 2: Linguistic Challenges

This is the most important section for MT quality. Each challenge should describe
a real problem that machine translation systems face with this language.

**Research process**:
1. Search academic literature: `"{language name}" machine translation challenges`
2. Check WMT shared task papers (if the language has been included)
3. Read the Wikipedia linguistics section for the language
4. Check typological databases (WALS: https://wals.info/) for unusual features

**Common challenge categories**:

| Category | Languages | What to document |
|----------|-----------|------------------|
| Polysynthesis | crk, iku, ojg | Word = full sentence, morpheme boundaries matter |
| Agglutination | fi, hu, tr, ko | Long compound words, suffix stacking |
| Animacy | crk, pl, ru | Grammatical gender based on animacy affects agreement |
| Honorifics/Register | ja, ko, th | Formality levels change grammar, not just vocabulary |
| Classifiers | zh, ja, th | Numeric classifiers for different noun categories |
| Tone | zh, yo, th, vi | Tonal distinctions lost in romanization |
| Diglossia | ar, bn | Formal vs. spoken varieties diverge significantly |
| Script complexity | ar, he, th, ja | RTL, no spaces, multiple scripts |
| Pro-drop | es, it, tr, ja | Subject pronouns omitted, context-dependent |
| Neologisms | crk, qu, yo | Modern tech terms may not exist in the language |
| SOV/VSO order | ja, ar, he | Word order differs from English SVO |

**Quality bar**: 3-6 challenges per language. Each should be 1-2 sentences
explaining what goes wrong and why. Avoid generic statements like "complex
grammar" — be specific about the MT failure mode.

### Step 3: Encyclopedic Data

Fill in demographics, family, and community resources.

**Demographics**:
- Speaker count: Check Ethnologue, UNESCO Atlas of Endangered Languages,
  or Wikipedia. Use "Approx. X" for estimates.
- Regions: List countries/regions where the language is primarily spoken.

**Family**: Should be auto-populated from Glottolog. Verify.

**Dialects** (if applicable):
- Check if the language has significant dialectal variation
- Document if the standard/literary form differs from spoken varieties
- Note ISO 639-3 codes for major dialects

**Resources** (encyclopedic, not NLP tools):
- Wikipedia link
- Relevant language foundations/organizations
- Dictionaries and learning resources
- Community forums or revitalization projects

### Step 4: Resources — FSTs and NLP Tools

This is the `resources.fsts` field. Check these sources in order:

#### 4a: GiellaLT (https://github.com/giellalt)

Query: `https://api.github.com/repos/giellalt/lang-{iso639_3}`

If it exists, check releases:
- `fst-*` tags → legacy format, auto-installable by eval harness
- `speller-*`/`grammar-*` tags → Divvun format, requires Divvun manager

See the **fst-discovery** skill for detailed procedures.

#### 4b: Language-specific tools

| Tool | Languages | URL |
|------|-----------|-----|
| Omorfi | Finnish | github.com/flammie/omorfi |
| MorphoDiTa | Czech, Slovak | ufal.mff.cuni.cz/morphodita |
| CAMeL Tools | Arabic | github.com/CAMeL-Lab/camel_tools |
| Hazm | Persian/Farsi | github.com/roshan-research/hazm |
| YAP | Hebrew | github.com/OnlpLab/yap |
| KoNLPy | Korean | konlpy.org |
| spaCy models | Many | spacy.io/models |
| IndicNLP | Hindi, Bengali | github.com/anoopkunchukuttan/indic_nlp_library |
| Jieba | Chinese | github.com/fxsjy/jieba |
| MeCab | Japanese | github.com/taku910/mecab |

#### 4c: Apertium (https://github.com/apertium)

Apertium has morphological analyzers for many language pairs.
Check `apertium-{code}` repos.

#### 4d: Web search

For less-resourced languages, search:
- `"{language}" morphological analyzer`
- `"{language}" NLP tools`
- `"{language}" tokenizer`

### Step 5: Resources — Corpora

The `resources.corpora` field. Check:

1. **OPUS** (https://opus.nlpl.eu/) — Most comprehensive parallel corpus search
   - Search for `en-{code}` pairs
   - Note corpus size and domain

2. **NLLB-200** — If the language has an NLLB code (check `nllbCode` field)

3. **Flores+** — Facebook's evaluation benchmark
   - Check https://github.com/facebookresearch/flores

4. **Tatoeba** — Community-contributed sentence pairs
   - Check https://tatoeba.org/

5. **WMT datasets** — For well-resourced language pairs
   - Check recent WMT shared task data

6. **Language-specific corpora** — Search:
   - HuggingFace datasets: `huggingface.co/datasets?language={code}`
   - LDC, ELRA catalogs (commercial)
   - University language lab collections

### Step 6: Resources — Models

The `resources.models` field. Check:

1. **NLLB models** on HuggingFace
2. **OPUS-MT** (Helsinki-NLP) models
3. **Specialized fine-tunes** for the language
4. Search HuggingFace: `huggingface.co/models?language={code}&pipeline_tag=translation`

### Step 7: Formality and Register

Fill in `rules.formality` on the runtime card:

**Research**:
- Does the language have a T-V distinction? (tu/vous, du/Sie, etc.)
- Are there distinct formal/informal grammatical forms?
- What registers are relevant for software UI translation?

**Register presets** (if applicable):
```json
{
  "formality": {
    "system": "T-V distinction",
    "registers": {
      "formal": { "guidance": "Use {formal_pronoun} and formal verb conjugations" },
      "informal": { "guidance": "Use {informal_pronoun}, casual tone" },
      "neutral": { "guidance": "Avoid direct address when possible" }
    }
  }
}
```

### Step 8: Validate

```bash
# Validate both cards against schemas
node --test test/language-reference.test.js
node --test test/language-cards.test.js

# Check for remaining TODOs
grep -c "TODO" lib/data/language-reference/{code}.json
```

### Step 9: Update Eval Harness (if FST found)

If you found a GiellaLT FST in Step 4a:

1. Add the language to `GIELLALT_FST_REGISTRY` in
   `crk-translate/gds-mt-eval-harness/mt_eval_harness/plugins/fst_installer.py`

2. Add the ISO 639-3 code to `_LANG_NAME_TO_CODE` in
   `crk-translate/gds-mt-eval-harness/mt_eval_harness/plugin_discovery.py`

## Quality Checklist

Before marking a card as "complete", verify:

- [ ] No TODO strings remain in either card file
- [ ] `nativeName` is present with proper diacritics
- [ ] At least 3 linguisticChallenges with specific MT failure modes
- [ ] Demographics has speaker count and regions
- [ ] `resources.corpora` has at least 1 entry (OPUS at minimum)
- [ ] `resources.fsts` checked against GiellaLT + language-specific tools
- [ ] Formality system documented (or explicitly marked as "none")
- [ ] Both schema validations pass
- [ ] Encyclopedic resources include at least Wikipedia link

## Batch Operations

### Audit all cards for completeness
```bash
python3 -c "
import json, os, glob
for f in sorted(glob.glob('lib/data/language-reference/*.json')):
    code = os.path.basename(f).replace('.json', '')
    d = json.load(open(f))
    todos = json.dumps(d).lower().count('todo')
    r = d.get('resources') or {}
    fsts = len(r.get('fsts', []))
    corpora = len(r.get('corpora', []))
    chall = len(d.get('linguisticChallenges', {}))
    if todos > 0 or fsts == 0 or corpora == 0 or chall < 3:
        print(f'{code}: TODOs={todos} challenges={chall} corpora={corpora} fsts={fsts}')
"
```

### Update FSTs across all GiellaLT-supported languages
Use the **fst-discovery** skill for each language with a known GiellaLT repo.
