---
sidebar_position: 5
title: "Données de coaching"
---
# Données de coaching

Les données de coaching constituent le mécanisme de rosetta pour enseigner aux LLM des langues sur lesquelles ils n'ont pas été entraînés. En fournissant des règles de grammaire, des dictionnaires et des notes de style avec chaque demande de traduction, vous transformez un LLM à usage général en un traducteur sensible au contexte pour n'importe quelle langue, y compris les langues ne bénéficiant d'aucune prise en charge existante par la traduction automatique (MT).

## Comment cela fonctionne

Lorsque vous définissez la méthode d'une paire sur `llm-coached`, rosetta charge un fichier de coaching à partir de `.rosetta/coaching/<locale>.json` et injecte son contenu dans chaque prompt du LLM en tant que partie intégrante du message système. Le LLM consulte vos règles linguistiques en même temps que la demande de traduction, produisant ainsi un résultat qui respecte votre grammaire et votre terminologie au lieu de deviner.

```
┌──────────────────────────────────────────────────────┐
│ System Message (cached across batches)               │
│ ┌──────────────────────────────────────────────────┐ │
│ │ Base translation rules                           │ │
│ │ + Register instructions                          │ │
│ │ + Grammar rules (from coaching data)             │ │
│ │ + Dictionary entries (from coaching data)         │ │
│ │ + Style notes (from coaching data)               │ │
│ └──────────────────────────────────────────────────┘ │
├──────────────────────────────────────────────────────┤
│ User Message (per batch)                             │
│ ┌──────────────────────────────────────────────────┐ │
│ │ Keys to translate (JSON)                         │ │
│ └──────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────┘
```

Étant donné que les données de coaching font partie du message système, elles bénéficient de la **mise en cache des prompts** — des fournisseurs tels qu'Anthropic et Google mettent en cache les préfixes système répétés, de sorte que vous ne payez le contexte de coaching qu'une seule fois par session, et non une fois par lot.

## Format du fichier de coaching

Créez un fichier JSON par paramètre régional dans `.rosetta/coaching/` :

```json title=".rosetta/coaching/crk.json"
{
  "grammar_rules": [
    "Plains Cree is polysynthetic — a single word can express what English needs a full sentence for",
    "Animate/inanimate noun distinction affects verb conjugation",
    "Use SRO (Standard Roman Orthography) unless script converter handles conversion",
    "Verb stems are modified by prefixes and suffixes to indicate person, number, tense, and evidentiality"
  ],
  "dictionary": {
    "home": "kīwēwin",
    "settings": "isi-nākatohkēwin",
    "search": "nānātawāpahtam",
    "welcome": "tānisi",
    "submit": "ispīhci",
    "cancel": "pōni"
  },
  "style_notes": "Use formal register. Preserve English technical terms in parentheses when no Cree equivalent exists. Avoid loanwords when a descriptive Cree expression exists."
}
```

### Champs

| Champ | Type | Requis | Description |
|-------|------|----------|-------------|
| `grammar_rules` | `string[]` | Non | Tableau de règles de grammaire injectées dans le prompt système. Chaque règle doit être une instruction concise et exploitable que le LLM peut suivre. |
| `dictionary` | `object` | Non | Mappage clé-valeur du terme en anglais → terme dans la langue cible. Utilisé pour le vocabulaire spécifique au domaine que le LLM ne connaîtrait pas. |
| `style_notes` | `string` | Non | Instructions de style sous forme libre (registre, ton, conventions de formalité). |

Tous les champs sont facultatifs — vous pouvez commencer avec un simple dictionnaire et ajouter des règles de grammaire au fur et à mesure de vos affinements.

## Comportement de repli

Si une paire est configurée pour `llm-coached` mais qu'aucun fichier de coaching n'existe pour ce paramètre régional, rosetta **se rabat sur la méthode `llm` standard** avec un avertissement dans la console :

```
[INFO] No coaching data for "crk" at .rosetta/coaching/crk.json
       Falling back to standard LLM method. Create coaching data for better results.
```

Cela signifie que vous pouvez définir `"defaultMethod": "llm-coached"` globalement en toute sécurité — les langues disposant de données de coaching l'utiliseront, et les autres obtiendront une traduction LLM standard sans erreurs.

## Quand utiliser le coaching

| Scénario | Méthode recommandée |
|----------|-------------------|
| Langues de niveau 1 (français, espagnol, allemand) | `llm` ou `google-translate` — Les LLM les maîtrisent déjà bien |
| Langues de niveau 2 (coréen, turc, thaï) | `llm` avec un registre — Les LLM les gèrent de manière adéquate avec des directives de style |
| Langues de niveau 3 (cri des plaines, yoruba, quechua) | `llm-coached` — Les LLM ont besoin de règles de grammaire et de dictionnaires |
| Langues construites (klingon, sindarin, kryptonien) | `llm-coached` — Les LLM disposent de quelques données d'entraînement mais nécessitent des corrections |

## Créer de bonnes données de coaching

### Règles de grammaire

Rédigez les règles sous forme d'**instructions**, et non de descriptions. Le LLM suit mieux les instructions qu'il n'interprète la théorie linguistique.

```json
// ❌ Descriptive (the LLM learns nothing actionable)
"Plains Cree has animate and inanimate noun classes"

// ✅ Instructive (the LLM knows what to do)
"When translating nouns, check whether the Cree equivalent is animate (NA) or inanimate (NI) — this affects which verb conjugation to use"
```

### Dictionnaires

Concentrez-vous sur les **termes spécifiques au domaine** que le LLM traduirait de manière incorrecte ou inventerait. Ne vous préoccupez pas des mots courants que le LLM gère déjà — concentrez-vous sur les termes spécifiques à l'interface utilisateur de votre application.

### Notes de style

Soyez précis concernant le registre, le niveau de formalité et les conventions :

```json
"style_notes": "Use formal register (vous-form in French). Preserve brand names untranslated. UI labels should be imperative mood ('Save', not 'Saves'). Maximum 40 characters for button text."
```

## Tester les traductions avec coaching

Utilisez le [MT Eval Harness](https://github.com/gamedaysuits/gds-mt-eval-harness) pour évaluer vos traductions avec coaching par rapport à un corpus de référence :

```bash
# Install the harness
pip install mt-eval-harness

# Run coached translations against your test corpus
mt-eval run --corpus data/crk-corpus.json --model google/gemini-2.5-pro

# Score the results
mt-eval test eval/logs/run_*.json
```

Cela vous fournit les scores chrF++, BLEU et de correspondance exacte. Créez plusieurs versions du fichier de coaching et comparez-les — les métriques objectives surpassent l'évaluation subjective.

---

## Voir aussi

- [Méthodes de traduction](/docs/guides/translation-methods) — la méthode llm-coached
- [Prendre en charge une langue à faibles ressources](/docs/guides/low-resource-languages) — le coaching en pratique
- [Spécification des plugins](/docs/reference/plugin-spec) — empaqueter les données de coaching dans un plugin
- [Porte de qualité](/docs/concepts/quality-gate) — comment les traductions avec coaching sont validées
- [Configuration](/docs/getting-started/configuration) — configuration du coaching par paire