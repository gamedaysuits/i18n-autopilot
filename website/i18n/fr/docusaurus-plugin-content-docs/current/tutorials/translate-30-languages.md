---
sidebar_position: 2
title: "Traduire 30 langues"
description: "Cookbook : mettez à l'échelle un projet de 3 à 30 langues grâce à la combinaison de méthodes par paire, au batching et à l'intégration CI."
---
# Guide pratique : Traduire 30 langues

Faites évoluer un projet de quelques paramètres régionaux vers une couverture mondiale. Ce guide pratique détaille le choix des méthodes, l'optimisation des coûts et l'intégration CI pour un déploiement multilingue en conditions réelles.

**Scénario :** Vous disposez d'une application SaaS avec `en`, `fr`, `es`. Vous devez ajouter 27 langues supplémentaires réparties sur trois niveaux d'exigences de qualité.

---

## Étape 1 : Catégoriser vos langues

Les 30 langues ne nécessitent pas toutes la même approche. Regroupez-les selon la qualité de la méthode disponible :

| Niveau | Langues | Méthode | Raison |
|------|-----------|--------|-----|
| **Niveau 1 — Premium** | `ja`, `ko`, `zh`, `de`, `pt` | `llm` (GPT-4o) | Marchés à forte valeur, grammaire nuancée |
| **Niveau 2 — Standard** | `it`, `nl`, `pl`, `sv`, `da`, `fi`, `no`, `cs`, `ro`, `hu`, `el`, `tr`, `id`, `ms`, `th`, `vi`, `uk`, `bg` | `google-translate` | Volume élevé, bien pris en charge par Google |
| **Niveau 3 — Supervisé** | `crk`, `oj`, `mi`, `haw` | `llm-coached` + plugins | Faibles ressources, nécessitent l'application d'une terminologie |

## Étape 2 : Configurer par paire

```json title="i18n-rosetta.config.json"
{
  "version": 3,
  "inputLocale": "en",
  "localesDir": "./locales",
  "defaultMethod": "google-translate",
  "model": "google/gemini-3.5-flash",
  "languages": {
    "ja": { "name": "Japanese", "register": "Polite/formal" },
    "ko": { "name": "Korean", "register": "Formal" },
    "zh": { "name": "Simplified Chinese", "register": "Neutral" },
    "de": { "name": "German", "register": "Formal (Sie)" },
    "pt": { "name": "Brazilian Portuguese", "register": "Informal" },
    "crk": { "name": "Plains Cree (SRO)", "register": "Neutral" }
  },
  "pairs": {
    "en:ja": { "method": "llm", "model": "openai/gpt-4o" },
    "en:ko": { "method": "llm", "model": "openai/gpt-4o" },
    "en:zh": { "method": "llm", "model": "openai/gpt-4o" },
    "en:de": { "method": "llm", "model": "openai/gpt-4o" },
    "en:pt": { "method": "llm", "model": "openai/gpt-4o" },
    "en:crk": { "methodPlugin": "crk-coached-v1" }
  }
}
```

**Remarque :** Les langues non répertoriées dans `pairs` héritent de `defaultMethod: "google-translate"`. Il n'est pas nécessaire d'énumérer les 30 langues.

:::info
La prise en charge de `crk` est en cours de développement — consultez [Prendre en charge une langue à faibles ressources](https://mtevalarena.org/docs/community/low-resource-languages) pour connaître l'état d'avancement et les directives de contribution.
:::

## Étape 3 : Configurer les clés d'API

Vous aurez besoin des deux clés d'API pour cette configuration :

```bash
export OPENROUTER_API_KEY="sk-or-v1-..."
export GOOGLE_TRANSLATE_API_KEY="AIza..."
```

## Étape 4 : Effectuer d'abord un essai à blanc

Prévisualisez toujours avant de traduire 30 langues :

```bash
npx i18n-rosetta sync --dry
```

Examinez le résultat. Il indiquera :
- Quelles paires utilisent quelle méthode
- Combien de clés sont nouvelles ou modifiées par paramètre régional
- Les appels d'API estimés par niveau

## Étape 5 : Exécuter la synchronisation

```bash
npx i18n-rosetta sync
```

Rosetta traite chaque paire de manière indépendante. Les paires de niveau 2 utilisant Google Translate seront rapides. Les paires LLM de niveau 1 seront plus lentes mais de meilleure qualité. Les paires supervisées de niveau 3 utilisent les données de supervision du plugin.

### Mises à jour incrémentielles

Après la synchronisation initiale, les exécutions ultérieures ne traduisent que les clés **modifiées ou nouvelles** :

```bash
# Only keys that changed since last sync
npx i18n-rosetta sync
```

Le fichier de verrouillage (`.i18n-rosetta.lock`) assure le suivi de ce qui a été traduit, afin que vous ne retraduisiez jamais un contenu stable.

## Étape 6 : Auditer la qualité

Vérifiez l'état de toutes les paires de langues :

```bash
npx i18n-rosetta status
```

Cela génère un tableau affichant la méthode, le modèle, le niveau de qualité de chaque paire, et indiquant si des données de supervision ou des scores de référence sont disponibles.

## Étape 7 : Intégration CI

Ajoutez ceci à votre flux de travail GitHub Actions afin que les traductions restent à jour à chaque push :

```yaml title=".github/workflows/i18n-sync.yml"
name: Sync Translations
on:
  push:
    paths:
      - 'locales/en/**'

jobs:
  translate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20

      - run: npm ci

      - name: Sync translations
        run: npx i18n-rosetta sync
        env:
          OPENROUTER_API_KEY: ${{ secrets.OPENROUTER_API_KEY }}
          GOOGLE_TRANSLATE_API_KEY: ${{ secrets.GOOGLE_TRANSLATE_API_KEY }}

      - name: Commit updated translations
        run: |
          git config user.name "github-actions[bot]"
          git config user.email "github-actions[bot]@users.noreply.github.com"
          git add locales/
          git diff --staged --quiet || git commit -m "chore(i18n): sync translations"
          git push
```

## Estimation des coûts

Pour un projet comportant 500 clés sources réparties sur 30 langues :

| Niveau | Langues | Méthode | Coût approximatif |
|------|-----------|--------|-----------------|
| Niveau 1 (5 langues) | ja, ko, zh, de, pt | GPT-4o | ~2,50 $/sync. complète |
| Niveau 2 (18 langues) | it, nl, pl, etc. | Google Translate | ~0,90 $/sync. complète |
| Niveau 3 (4 langues) | crk, oj, mi, haw | GPT-4o-mini supervisé | ~0,40 $/sync. complète |
| **Total** | **30 langues** | **Mixte** | **~3,80 $/sync. complète** |

Les synchronisations incrémentielles (5 à 20 clés modifiées) ne coûtent qu'une fraction d'une synchronisation complète.

## Voir aussi

- [Méthodes de traduction](/docs/guides/translation-methods) — Comment fonctionne chaque méthode de traduction et quand l'utiliser
- [Spécification des plugins](/docs/reference/plugin-spec) — Créer des données de supervision pour n'importe laquelle de vos langues de niveau 3
- [Guide CI/CD](/docs/guides/ci-cd) — Modèles CI avancés, y compris les versions de prévisualisation des PR
- [Porte de qualité](/docs/concepts/quality-gate) — Comment Rosetta valide chaque traduction avant de l'écrire
- [Langues prises en charge](/docs/reference/supported-languages) — Liste complète des codes de langue et de la compatibilité des méthodes
- [Prendre en charge une langue à faibles ressources](https://mtevalarena.org/docs/community/low-resource-languages) — Ajouter des données de supervision pour les langues ne bénéficiant pas d'une large couverture par la traduction automatique (MT)