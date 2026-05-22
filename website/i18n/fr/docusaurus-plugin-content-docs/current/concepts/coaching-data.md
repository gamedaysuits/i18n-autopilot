---
sidebar_position: 5
title: "Données de coaching"
---
# Coaching Data

Les Coaching Data constituent le mécanisme de rosetta pour enseigner aux LLMs des langues sur lesquelles ils n'ont pas été entraînés. En fournissant des règles de grammaire, des dictionnaires et des notes de style avec chaque demande de traduction, vous transformez un LLM généraliste en un traducteur sensible au contexte pour n'importe quelle langue — y compris les langues pour lesquelles il n'existe aucun support MT.

## Comment ça fonctionne

Lorsque vous définissez la méthode d'une paire sur `llm-coached`, rosetta charge un fichier de coaching depuis `.rosetta/coaching/<locale>.json` et injecte son contenu dans chaque prompt du LLM en tant que partie du system message. Le LLM voit vos règles linguistiques aux côtés de la demande de traduction, produisant un résultat qui respecte votre grammaire et votre terminologie au lieu de deviner.

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

Parce que les Coaching Data font partie du system message, elles bénéficient du **prompt caching** — des fournisseurs comme Anthropic et Google mettent en cache les préfixes système répétés, de sorte que vous ne payez le contexte de coaching qu'une seule fois par session, et non une fois par lot.

## Format du fichier de coaching

Créez un fichier JSON par locale dans `.rosetta/coaching/` :

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
|-------|------|--------|-------------|
| `grammar_rules` | `string[]` | Non | Tableau de règles de grammaire injectées dans le system prompt. Chaque règle doit être une instruction concise et exploitable que le LLM peut suivre. |
| `dictionary` | `object` | Non | Map clé-valeur du terme anglais → terme de la langue cible. Utilisé pour le vocabulaire spécifique au domaine que le LLM ne connaîtrait pas. |
| `style_notes` | `string` | Non | Instructions de style sous forme libre (registre, ton, conventions de formalité). |

Tous les champs sont facultatifs — vous pouvez commencer avec seulement un dictionnaire et ajouter des règles de grammaire au fur et à mesure de vos ajustements.

## Comportement de Fallback

Si une paire est configurée pour `llm-coached` mais qu'aucun fichier de coaching n'existe pour cette locale, rosetta **se rabat sur la méthode `llm` standard** avec un avertissement dans la console :

```
[INFO] No coaching data for "crk" at .rosetta/coaching/crk.json
       Falling back to standard LLM method. Create coaching data for better results.
```

Cela signifie que vous pouvez définir `"defaultMethod": "llm-coached"` globalement en toute sécurité — les langues disposant de Coaching Data l'utiliseront, et les autres obtiendront une traduction LLM standard sans erreurs.

## Quand utiliser le Coaching

| Scénario | Méthode recommandée |
|----------|---------------------|
| Langues de niveau 1 (Français, Espagnol, Allemand) | `llm` ou `google-translate` — Les LLMs les connaissent déjà bien |
| Langues de niveau 2 (Coréen, Turc, Thaï) | `llm` avec un registre — Les LLMs les gèrent de manière adéquate avec des directives de style |
| Langues de niveau 3 (Cri des plaines, Yoruba, Quechua) | `llm-coached` — Les LLMs ont besoin de règles de grammaire et de dictionnaires |
| Conlangs (Klingon, Sindarin, Kryptonien) | `llm-coached` — Les LLMs ont quelques données d'entraînement mais nécessitent des corrections |

## Construire de bonnes Coaching Data

### Règles de grammaire

Rédigez les règles sous forme d'**instructions**, et non de descriptions. Le LLM suit mieux les instructions qu'il n'interprète la théorie linguistique.

```json
// ❌ Descriptive (the LLM learns nothing actionable)
"Plains Cree has animate and inanimate noun classes"

// ✅ Instructive (the LLM knows what to do)
"When translating nouns, check whether the Cree equivalent is animate (NA) or inanimate (NI) — this affects which verb conjugation to use"
```

### Dictionnaires

Concentrez-vous sur les **termes spécifiques au domaine** que le LLM pourrait mal traduire ou inventer. Ne vous embêtez pas avec les mots courants que le LLM gère déjà — concentrez-vous sur les termes spécifiques à l'UI de votre application.

### Notes de style

Soyez précis·e sur le registre, la formalité et les conventions :

```json
"style_notes": "Use formal register (vous-form in French). Preserve brand names untranslated. UI labels should be imperative mood ('Save', not 'Saves'). Maximum 40 characters for button text."
```

## Tester les traductions avec Coaching

Utilisez le [MT Eval Harness](https://github.com/gamedaysuits/gds-mt-eval-harness) pour évaluer vos traductions avec coaching par rapport à un corpus de référence :

```bash
# Install the harness
pip install mt-eval-harness

# Run coached translations against your test corpus
mt-eval run --corpus data/crk-corpus.json --model google/gemini-2.5-pro

# Score the results
mt-eval test eval/logs/run_*.json
```

Cela vous donne les scores chrF++, BLEU et exact match. Créez plusieurs versions du fichier de coaching et comparez-les — les métriques objectives surpassent l'évaluation subjective.

## Voir aussi

- [Langues à faibles ressources](/docs/guides/low-resource-languages) — guide complet pour construire un pipeline de traduction à partir de zéro
- [Méthodes de traduction](/docs/guides/translation-methods) — comparaison de toutes les méthodes disponibles
- [Créer un plugin](/docs/tutorials/build-a-plugin) — empaqueter une méthode avec coaching sous forme de plugin réutilisable