---
sidebar_position: 7
title: "Pour les entreprises"
description: "Comment les organisations peuvent standardiser la traduction grâce à des méthodes éprouvées sur les leaderboards, des plugins personnalisés et un déploiement en une seule commande."
---
# i18n-rosetta pour l'Entreprise

Votre équipe traduit régulièrement du contenu. Vous disposez d'un ensemble de fichiers de localisation, d'un pipeline CI et d'un processus qui implique probablement qu'une personne exécute manuellement Google Translate, copie les résultats dans un fichier JSON et espère un résultat optimal. Ou bien, vous payez pour une plateforme TMS qui vous rend tributaire du moteur de traduction d'un seul fournisseur.

Il existe une meilleure approche.

## La Proposition de Valeur

1. **Choisissez la meilleure méthode pour chaque langue** — et non celle imposée par défaut par votre fournisseur
2. **Déployez avec une seule commande** — `npx i18n-rosetta sync` traduit chaque langue, chaque format, à chaque exécution
3. **Changez de méthode sans modifier le code** — une modification de configuration, pas une migration
4. **Maîtrisez votre pipeline** — aucune dépendance envers un fournisseur, aucun tableau de bord mensuel, aucun compte à créer

```json title="i18n-rosetta.config.json"
{
  "version": 3,
  "pairs": {
    "en:fr": { "method": "deepl" },
    "en:ja": { "method": "llm", "model": "google/gemini-2.5-pro" },
    "en:de": { "method": "google-translate" },
    "en:ko": { "method": "llm", "register": "polite-haeyo" },
    "en:crk": { "methodPlugin": "crk-coached-v3" }
  }
}
```

Le français utilise DeepL (votre équipe préfère sa fluidité européenne). Le japonais utilise un LLM de pointe. L'allemand utilise Google Translate (rapide, économique, suffisant). Le coréen utilise un LLM avec un registre formel. Le cri des plaines utilise un plugin supervisé par la communauté ayant obtenu le meilleur score au classement.

**Même commande. Même pipeline CI. Des méthodes différentes par paire de langues. Un seul fichier de configuration.**

## Le Flux de Travail : Du Classement au Déploiement

:::tip Bientôt disponible : l'interface en ligne de commande (CLI) `rosetta leaderboard`
Le flux de travail décrit ci-dessous représente l'intégration prévue entre le classement de la [MT Eval Arena](https://mtevalarena.org) et la CLI i18n-rosetta. L'infrastructure existe des deux côtés — la passerelle est en cours de développement.
:::

La [MT Eval Arena](https://mtevalarena.org) est l'endroit où les méthodes de traduction sont évaluées avec une notation reproductible et dotée d'une empreinte numérique. Chaque méthode obtient un score composite basé sur de multiples métriques (chrF++, correspondance exacte, acceptation FST, évaluation sémantique). Le classement répertorie chaque soumission.

Le flux de travail prévu est le suivant :

```bash
# Browse the leaderboard from your terminal
npx i18n-rosetta leaderboard --pair en:crk

# Output:
# ┌──────┬───────────────────────┬────────────┬──────────┬───────────┐
# │ Rank │ Method                │ Model      │ chrF++   │ Composite │
# ├──────┼───────────────────────┼────────────┼──────────┼───────────┤
# │  1   │ crk-coached-v3        │ gemini-2.5 │ 43.2     │ 0.67      │
# │  2   │ fst-gated-pipeline    │ gpt-4o     │ 41.8     │ 0.63      │
# │  3   │ prompt-baseline       │ claude-4   │ 38.1     │ 0.55      │
# └──────┴───────────────────────┴────────────┴──────────┴───────────┘

# Install the top-scoring method as a plugin
npx i18n-rosetta plugin install crk-coached-v3

# Use it
npx i18n-rosetta sync
```

**Vous ne concevez pas la méthode. Vous n'entraînez pas le modèle. Vous sélectionnez le gagnant et vous le déployez.** Si une meilleure méthode apparaît dans le classement le mois prochain, vous la remplacez à l'aide d'une seule commande.

## Ce Qui Est Disponible Aujourd'hui

La passerelle entre le classement et la CLI est en cours de développement. Voici ce qui fonctionne actuellement :

### Méthodes intégrées (aucun plugin requis)

| Méthode | Idéale pour | Coût |
|--------|----------|------|
| `llm` (par défaut) | Axée sur la qualité, toutes langues | Par jeton via OpenRouter |
| `gemini` | Qualité + niveau gratuit | Gratuit (limité), puis par jeton |
| `google-translate` | Vitesse + volume | 20 $/M de caractères |
| `deepl` | Langues européennes | 25 $/M de caractères |
| `llm-coached` | Langues avec données d'entraînement | Par jeton via OpenRouter |
| `api` | Méthodes personnalisées/hébergées par la communauté | Auto-hébergé |

### Méthodes par plugin (à installer séparément)

Les plugins personnalisés peuvent encapsuler n'importe quelle logique de traduction — un modèle affiné, un pipeline contrôlé par FST, une API communautaire, ou tout autre élément produisant du JSON. Consultez la section [Créer un Plugin](/docs/tutorials/build-a-plugin).

## Flux de Travail pour l'Entreprise

### 1. Évaluez votre qualité actuelle

```bash
# See what you're getting today
npx i18n-rosetta status

# Output shows: method per pair, cache hit rate, quality gate stats
```

### 2. Exécutez le cadre d'évaluation sur les candidats

Le [cadre d'évaluation](https://mtevalarena.org/docs/specifications/harness) vous permet d'évaluer plusieurs méthodes par rapport au même ensemble de données. Effectuez une série de tests, comparez les scores et sélectionnez les gagnants :

```bash
# In the eval harness repo
python -m mt_eval_harness.run \
  --methods coached-v3 baseline prompt-tuned \
  --dataset data/your-corpus.json
```

### 3. Configurez les gagnants par paire de langues

Mettez à jour votre configuration pour utiliser la meilleure méthode pour chaque paire de langues. Différentes langues requièrent différentes méthodes optimales — c'est là tout l'intérêt.

### 4. Intégrez au CI/CD

```bash
# In your CI pipeline
npx i18n-rosetta lint        # Catch hardcoded strings
npx i18n-rosetta sync        # Translate what changed
npx i18n-rosetta audit       # Fail if any locale is incomplete
npx i18n-rosetta integrity   # Validate placeholder consistency
```

Trois commandes. Zéro traduction manuelle. Le pipeline détecte les chaînes de caractères codées en dur, les traduit avec les méthodes de votre choix, et fait échouer la compilation si un élément est manquant ou corrompu.

### 5. Révision professionnelle (facultatif)

Pour le contenu à fort enjeu, exportez au format XLIFF pour une révision humaine :

```bash
npx i18n-rosetta xliff export --locale ja --output translations.xliff
# → Send to your translation agency
# → Import corrections back:
npx i18n-rosetta xliff import translations.xliff
```

Traduisez automatiquement la majeure partie du contenu. Faites réviser par des humains les chemins critiques. Ne payez pour le temps humain que là où cela est véritablement nécessaire.

## Modèle de Coûts

rosetta n'exige **aucun frais de licence, aucun abonnement mensuel, aucune tarification par utilisateur**. Il s'agit d'un outil CLI open source. Vous ne payez que pour les appels d'API de traduction :

| Volume | Google Translate | LLM (Gemini Flash) | LLM (GPT-4o) |
|--------|-----------------|---------------------|---------------|
| 1 000 clés × 5 locales | ~0,50 $ | ~0,30 $ (niveau gratuit) | ~2,00 $ |
| 10 000 clés × 15 locales | ~15 $ | ~8 $ | ~60 $ |
| 50 000 clés × 30 locales | ~75 $ | ~40 $ | ~300 $ |

La mémoire de traduction signifie que vous ne payez que pour les **clés modifiées** lors des synchronisations ultérieures. Si vous mettez à jour 10 chaînes de caractères sur 10 000, vous payez pour 10 traductions, et non 10 000.

## Comparaison avec les Plateformes TMS

| | rosetta | Crowdin / Phrase / Locize |
|---|---|---|
| **Tarification** | Gratuit (open source) + coûts d'API | 50 $–500 $/mois + par utilisateur |
| **Dépendance au fournisseur** | Aucune — changement de fournisseur dans la configuration | Élevée — données dans leur cloud |
| **Choix de la méthode** | Tout fournisseur, tout modèle, par paire | Selon leur offre |
| **CI/CD** | Prise en charge native (`lint → sync → audit`) | Plugin/webhook |
| **Méthodes personnalisées** | Système de plugins, plugins communautaires | Non pris en charge |
| **Contrôle qualité** | Intégré (script incorrect, écho, longueur) | Variable |
| **Auto-hébergement** | Oui (LibreTranslate, API personnalisée) | Non |

Consultez la [comparaison complète](/docs/guides/comparison) pour plus de détails.

## Lectures Complémentaires

- **[Démarrage Rapide](/docs/getting-started/quick-start)** — exécutez votre première synchronisation en 60 secondes
- **[Méthodes de Traduction](/docs/guides/translation-methods)** — le menu complet des méthodes avec arbre de décision
- **[Intégration CI/CD](/docs/guides/ci-cd)** — automatisez au sein de votre pipeline
- **[Travailler avec des Traducteurs Professionnels](/docs/guides/professional-translators)** — exportation/importation XLIFF
- **[MT Eval Arena](https://mtevalarena.org)** — évaluation et classement
- **[Référence de Configuration](/docs/getting-started/configuration)** — toutes les options de configuration