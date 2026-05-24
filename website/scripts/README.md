# Website Build Scripts

## `generate-languages-json.js`

Compiles all language card data into a single static JSON file for the Docusaurus website.

### Data Flow

```
lib/data/language-cards/*.json     (runtime tier — registers, formality, rules)
  +
lib/data/language-reference/*.json (reference tier — challenges, family, resources)
  ↓
website/scripts/generate-languages-json.js  (merge + inheritance resolution)
  ↓
website/src/data/languages.json    (static output — consumed by React pages)
  ↓
website/src/pages/languages.js     (renders card grid + modals)
```

### When It Runs

- Automatically before `npm start` and `npm run build` (wired in `package.json`)
- Can be run manually: `node website/scripts/generate-languages-json.js`

### What It Does

1. Reads all `.json` files from `lib/data/language-cards/`
2. Resolves `extends` inheritance (family → subfamily → language)
3. Merges reference-tier data from `lib/data/language-reference/`
4. Sorts alphabetically by English name
5. Writes merged output to `website/src/data/languages.json`

### Adding a New Language

When you add a new card (e.g., via `node scripts/generate-language-card.mjs sw`), the website will automatically include it on the next build. No manual wiring needed.
