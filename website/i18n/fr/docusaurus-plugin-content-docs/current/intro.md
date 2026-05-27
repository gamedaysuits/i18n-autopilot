---
sidebar_position: 1
slug: /
title: "Introduction"
---
# i18n-rosetta

Un framework d'internationalisation entièrement personnalisable. Une seule commande traduit vos fichiers de localisation. Une seule configuration contrôle chaque méthode, modèle et paire de langues. Et si les méthodes intégrées ne suffisent pas, créez la vôtre, prouvez son efficacité et déployez-la.

```bash
npx i18n-rosetta sync
```

rosetta détecte automatiquement vos fichiers de localisation, leur format et les langues cibles. Il traduit ce qui manque, ignore ce qui est déjà fait, valide chaque résultat et produit un résultat propre. Ce n'est que le point de départ.

---

## Pourquoi ne pas simplement créer votre propre script ?

Vous pourriez écrire une boucle rapide qui appelle Google Translate pour chaque clé. La plupart des développeurs le font — cela prend environ 30 lignes. Voici où cela pose problème :

- **Aucune détection des modifications.** Mettez à jour une chaîne en anglais — la traduction reste obsolète pour toujours. rosetta suit chaque valeur source avec des hachages SHA-256 et ne retraduit que ce qui a changé.
- **Aucun traitement par lots.** Un appel API par clé signifie que 200 clés = 200 allers-retours. rosetta regroupe intelligemment les requêtes (configurable, par défaut 30 clés/lot pour un LLM, 128 pour Google).
- **Aucune mise en cache.** Chaque synchronisation retraduit tout. La mémoire de traduction de rosetta met en cache les traductions par texte source + paramètre régional + méthode — relancer la synchronisation après la modification d'une seule clé ne traduit que cette clé, et non le fichier entier.
- **Aucun contrôle de qualité.** La traduction automatique a des hallucinations, répète la source ou produit un résultat dans le mauvais système d'écriture. rosetta valide chaque traduction avant de l'écrire — les erreurs de système d'écriture, l'inflation de la longueur et les répétitions de la source sont détectées et rejetées.
- **Aucune reconnaissance du format.** Codé en dur pour JSON ? rosetta prend en charge JSON, TOML, YAML et Hugo Markdown (frontmatter + corps du texte) avec détection automatique.
- **Aucun contrôle de la méthode.** Chaque paire de langues utilise la même méthode. rosetta vous permet d'utiliser Google Translate pour le français, un LLM pour le japonais et un pipeline personnalisé hébergé par la communauté pour le cri — dans le même fichier de configuration.

rosetta est la version de production de ce script.

---

## Ce qui le différencie

### Chaque méthode est un plugin

La méthode de traduction est **configurable par paire de langues**. Mélangez Google Translate, des LLM, des prompts dirigés et des API personnalisées dans le même projet :

```json title="i18n-rosetta.config.json"
{
  "version": 3,
  "pairs": {
    "en:fr": { "method": "google-translate" },
    "en:ja": { "method": "llm", "model": "google/gemini-2.5-pro" },
    "en:crk": { "methodPlugin": "crk-coached-v1" }
  }
}
```

Le français utilise Google Translate (rapide, peu coûteux). Le japonais utilise un LLM premium (nuancé). Le cri des plaines utilise un plugin dirigé avec des règles de grammaire, des dictionnaires et une validation morphologique. Même commande `sync`. Même contrôle de qualité. Même interface en ligne de commande (CLI).

### Prouvez-le

Vous pensez que votre méthode peut traduire de l'anglais vers l'espagnol ? Du turc vers l'azerbaïdjanais ? De l'anglais vers le cri ?

**Prouvez-le.** L'[environnement d'évaluation](https://mtevalarena.org/docs/specifications/harness) associé évalue toute méthode de traduction avec une notation reproductible et dotée d'une empreinte numérique. Le [classement](/leaderboard) suit chaque soumission.

L'environnement d'évaluation et la CLI de production partagent la même interface de plugin. Une méthode qui obtient de bons résultats lors de l'évaluation peut être utilisée en production — si la communauté dont elle sert la langue donne son consentement. Pour les langues autochtones et à faibles ressources, ce consentement est essentiel. Voir [Souveraineté des données](https://mtevalarena.org/docs/sovereignty/data-sovereignty).

```bash
# Benchmark your method (in the eval harness repo)
cd gds-mt-eval-harness
python eval/baseline_experiment.py --dataset data/edtekla-dev-v1.json --submit

# Use it locally
npx i18n-rosetta sync
```

Même plugin. Branchez et testez.

### La boîte à outils complète

rosetta n'est pas seulement `sync`. C'est un pipeline i18n complet :

| Commande | Ce qu'elle fait |
|---------|-------------|
| `sync` | Traduit les clés manquantes, obsolètes et de repli |
| `watch` | Synchronise automatiquement lorsque votre fichier source est modifié |
| `lint` | Analyse le code source à la recherche de chaînes codées en dur |
| `wrap` | Enveloppe automatiquement les chaînes codées en dur dans des appels `t()` |
| `audit` | Liste toutes les valeurs de repli `[EN]` non traduites |
| `integrity` | Détecte la corruption des espaces réservés, les problèmes d'encodage et l'exhaustivité des pluriels ICU |
| `seo` | Génère des balises hreflang, des plans de site et des schémas JSON-LD |
| `status` | Affiche la configuration des paires, les plugins et les scores d'évaluation |
| `provenance` | Audite les licences des ressources de traduction |
| `plugin` | Installe, supprime et liste les plugins de méthode |
| `fonts` | Télécharge des polices web pour les convertisseurs de scripts PUA |
| `tm` | Gère le cache de la mémoire de traduction (statistiques, effacement, par paramètre régional) |
| `xliff` | Exporte/importe au format XLIFF 1.2 pour révision par des traducteurs professionnels |

Trois d'entre elles — `lint`, `sync`, `audit` — forment un pipeline CI qui détecte les chaînes codées en dur, les traduit et fait échouer la compilation si un paramètre régional est incomplet.

---

## L'Arène

Le [Classement des méthodes](/leaderboard) est le tableau des scores. Chaque soumission est associée à l'empreinte d'un commit Git, versionnée selon un jeu de données spécifique et évaluée par le même environnement. Tout le monde peut soumettre.

**Que pouvez-vous prouver ?** L'environnement d'évaluation accepte le format JSON. Les plugins acceptent le format JSON. Toute méthode produisant du JSON peut être testée :

| Approche | Exemple |
|----------|---------|
| **LLM dirigé** | Injecter des règles de grammaire et des dictionnaires dans le prompt d'un modèle de pointe |
| **Modèle affiné** | Entraîner un modèle ouvert sur des textes parallèles — mais pas sur les données d'évaluation |
| **Pipeline contrôlé par FST** | Le LLM génère → un transducteur à états finis valide la morphologie → nouvelle tentative |
| **Modèles enchaînés** | Le modèle A rédige → Le modèle B post-édite → Le modèle C évalue |
| **Dictionnaire + LLM** | Imposer des termes connus à partir d'un dictionnaire, laisser le LLM gérer le reste |
| **Évolutive** | Générer des candidats, les évaluer, muter les meilleurs, répéter |
| **Traduction partielle** | Traduire un échantillon à la main, prouver que votre LLM correspond, traduire automatiquement le reste |

Affinez des modèles. Déployez des algorithmes évolutifs. Testez les réponses d'étudiants à des examens de langue. Créez des tables de correspondance. Enchaînez trois modèles ensemble. Tant que votre méthode produit du JSON, l'environnement d'évaluation la note et le framework l'exécute.

:::danger La règle unique
**Ne vous entraînez pas sur les données d'évaluation.** Les méthodes exposées au jeu de données de référence seront disqualifiées. Affinez vos modèles sur ce que vous voulez. Mais pas sur l'ensemble de test.
:::

Ceci est une invitation ouverte. Si vous travaillez avec une langue à faibles ressources — en tant que chercheur, membre de la communauté, étudiant ou simplement quelqu'un qui s'en soucie — créez une méthode, exécutez l'environnement d'évaluation et revendiquez le meilleur score. Le problème n'est pas résolu. L'infrastructure est là.

**[→ Voir le classement](/leaderboard)**

---

## Prochaines étapes

**Pour commencer :**
- [Installation](/docs/getting-started/installation) — Configuration en 2 minutes
- [Démarrage rapide](/docs/getting-started/quick-start) — Exécutez votre première synchronisation
- [Langues prises en charge](/docs/reference/supported-languages) — Ce qui est disponible par défaut

**Personnalisation de votre configuration :**
- [Méthodes de traduction](/docs/guides/translation-methods) — Choisissez la bonne méthode par paire
- [Mémoire de traduction](/docs/concepts/translation-memory) — Comment la mise en cache vous fait économiser de l'argent
- [Configuration](/docs/getting-started/configuration) — Référence complète de la configuration
- [Site multilingue Hugo](/docs/tutorials/hugo-multilingual-site) — Traduction de contenu Markdown

**Pour aller plus loin :**
- [Travailler avec des traducteurs professionnels](/docs/guides/professional-translators) — Flux de travail d'exportation/importation XLIFF
- [Souveraineté des données](https://mtevalarena.org/docs/sovereignty/data-sovereignty) — Principes OCAP, CARE et de souveraineté des données maories
- [Soutenir une langue à faibles ressources](https://mtevalarena.org/docs/community/low-resource-languages) — Le défi qui a tout déclenché
- [Livre de recettes : Pipeline contrôlé par FST](https://mtevalarena.org/docs/tutorials/fst-gated-pipeline) — Créer un pipeline de décomposition
- [Évaluation de la traduction automatique (MT)](https://mtevalarena.org/docs/leaderboard/rules) — Comment fonctionnent l'environnement d'évaluation et le classement
- [Classement des méthodes](/leaderboard) — Scores en direct et soumissions